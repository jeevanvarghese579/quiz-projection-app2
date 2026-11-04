import { randomBytes, randomUUID } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore, type DocumentData } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { computeMarks, generateCode, hashCode, isRoutedCode, normalizeCode, ownerUidFromCode, validateCode, type ScoreState } from "./domain.js";

if (!getApps().length) initializeApp();
setGlobalOptions({ region: "us-central1", maxInstances: 10, timeoutSeconds: 60 });

const db = getFirestore();
const APP_KEY = "quizProjectionApp2";
const FIREBASE_WEB_APP_ID = "1:379503088311:web:ff8ed9b3c2540b9b133332";
const SESSION_HOURS = 12;
const attempts = new Map<string, { count: number; resetAt: number }>();

interface InvigilatorAccess {
  id: string;
  code: string;
  label: string;
  teamIds: string[] | "all";
  readOnly: boolean;
  createdAt: number;
  expiresAt: number | null;
  revoked: boolean;
  lastUsedAt: number | null;
}

interface QuizData extends DocumentData {
  id: string;
  name: string;
  status: string;
  teams: Array<{ id: string; [key: string]: unknown }>;
  questions: Array<{ id: string; maxMarks: number; active?: boolean; [key: string]: unknown }>;
  scores: Array<{ teamId: string; questionId: string; [key: string]: unknown }>;
  invigilatorAccess: InvigilatorAccess[];
  auditLogs: unknown[];
  invigilatorLoginEnabled: boolean;
}

function stateRef(ownerUid: string) {
  return db.doc(`apps/${APP_KEY}/users/${ownerUid}/data/state`);
}

function codeRef(ownerUid: string, codeHash: string) {
  return db.doc(`apps/${APP_KEY}/users/${ownerUid}/invigilatorCodes/${codeHash}`);
}

function sessionRef(ownerUid: string, sessionId: string) {
  return db.doc(`apps/${APP_KEY}/users/${ownerUid}/invigilatorSessions/${sessionId}`);
}

function cleanText(value: unknown, max = 120): string {
  return String(value || "").trim().slice(0, max);
}

function asQuizzes(data: DocumentData | undefined): QuizData[] {
  return Array.isArray(data?.quizzes) ? data.quizzes as QuizData[] : [];
}

function expirationMillis(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Timestamp) return value.toMillis();
  return null;
}

async function requireAuthorizedOwner(request: CallableRequest<unknown>): Promise<string> {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in as an authorized administrator.");
  const uid = request.auth.uid;
  const [user, app] = await Promise.all([
    db.doc(`accessUsers/${uid}`).get(),
    db.doc(`appRegistry/${FIREBASE_WEB_APP_ID}`).get(),
  ]);
  const userData = user.data();
  const appExpiry = expirationMillis(userData?.appExpirations?.[FIREBASE_WEB_APP_ID]);
  if (!user.exists || userData?.active !== true || userData?.apps?.[FIREBASE_WEB_APP_ID] !== true || (appExpiry !== null && appExpiry <= Date.now())) {
    throw new HttpsError("permission-denied", "Your Firebase Access Manager grant is not active for this app.");
  }
  if (!app.exists || app.data()?.active !== true) throw new HttpsError("permission-denied", "This Firebase app is not active in Access Manager.");
  return uid;
}

function rateLimitRedemption(request: CallableRequest<unknown>) {
  const key = cleanText(request.rawRequest.ip || request.rawRequest.headers["x-forwarded-for"] || "unknown", 160);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > 12) throw new HttpsError("resource-exhausted", "Too many code attempts. Wait one minute and try again.");
}

function findQuiz(quizzes: QuizData[], quizId: string): QuizData {
  const quiz = quizzes.find((item) => item.id === quizId);
  if (!quiz) throw new HttpsError("not-found", "Quiz not found.");
  return quiz;
}

function findAccess(quiz: QuizData, accessId: string): InvigilatorAccess {
  const access = Array.isArray(quiz.invigilatorAccess) ? quiz.invigilatorAccess.find((item) => item.id === accessId) : undefined;
  if (!access) throw new HttpsError("permission-denied", "Invigilator access no longer exists.");
  if (access.revoked) throw new HttpsError("permission-denied", "This access code has been revoked.");
  if (access.expiresAt !== null && access.expiresAt <= Date.now()) throw new HttpsError("permission-denied", "This access code has expired.");
  if (!quiz.invigilatorLoginEnabled) throw new HttpsError("permission-denied", "Invigilator login is disabled for this quiz.");
  return access;
}

async function findLegacyCode(code: string): Promise<{ ownerUid: string; quizId: string; accessId: string } | null> {
  const ownerRefs = await db.collection(`apps/${APP_KEY}/users`).listDocuments();
  const matches: Array<{ ownerUid: string; quizId: string; accessId: string }> = [];
  for (let offset = 0; offset < ownerRefs.length; offset += 100) {
    const stateRefs = ownerRefs.slice(offset, offset + 100).map((owner) => stateRef(owner.id));
    if (stateRefs.length === 0) continue;
    const snapshots = await db.getAll(...stateRefs);
    for (let index = 0; index < snapshots.length; index += 1) {
      const ownerUid = ownerRefs[offset + index].id;
      for (const quiz of asQuizzes(snapshots[index].data())) {
        for (const access of quiz.invigilatorAccess || []) {
          if (normalizeCode(access.code) === code) matches.push({ ownerUid, quizId: quiz.id, accessId: access.id });
        }
      }
    }
  }
  if (matches.length > 1) throw new HttpsError("failed-precondition", "This legacy code is not unique. Ask the administrator to create a new secure code.");
  return matches[0] ?? null;
}

function sanitizedQuiz(quiz: QuizData, access: InvigilatorAccess) {
  const allowed = access.teamIds === "all" ? null : new Set(access.teamIds);
  return {
    ...quiz,
    teams: (quiz.teams || []).filter((team) => !allowed || allowed.has(team.id)),
    scores: (quiz.scores || []).filter((score) => !allowed || allowed.has(score.teamId)),
    invigilatorAccess: [],
    auditLogs: [],
    sessionAccess: {
      id: access.id,
      label: access.label,
      teamIds: access.teamIds,
      readOnly: access.readOnly,
      expiresAt: access.expiresAt,
    },
  };
}

async function requireSession(request: CallableRequest<unknown>) {
  const sessionToken = cleanText((request.data as { sessionToken?: unknown })?.sessionToken, 1000);
  const parts = sessionToken.split('.');
  if (parts.length !== 3 || parts[0] !== 'QPS' || !parts[1] || !/^[A-Za-z0-9_-]{32,}$/.test(parts[2])) {
    throw new HttpsError("unauthenticated", "Invigilator session is not signed in.");
  }
  let routing: { ownerUid?: unknown; sessionId?: unknown };
  try { routing = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as { ownerUid?: unknown; sessionId?: unknown }; }
  catch { throw new HttpsError("unauthenticated", "Invigilator session token is invalid."); }
  const ownerUid = cleanText(routing.ownerUid, 128);
  const sessionId = cleanText(routing.sessionId, 100);
  if (!ownerUid || ownerUid.includes('/') || !sessionId || sessionId.includes('/')) throw new HttpsError("unauthenticated", "Invigilator session token is invalid.");
  const session = await sessionRef(ownerUid, sessionId).get();
  const sessionData = session.data();
  if (!session.exists || sessionData?.tokenHash !== hashCode(sessionToken) || sessionData?.revoked === true) throw new HttpsError("permission-denied", "Invigilator session is invalid or revoked.");
  const expiresAt = expirationMillis(sessionData?.expiresAt);
  if (expiresAt === null || expiresAt <= Date.now()) throw new HttpsError("permission-denied", "Invigilator session has expired.");
  return {
    ownerUid,
    sessionId,
    quizId: cleanText(sessionData?.quizId, 100),
    accessId: cleanText(sessionData?.accessId, 120),
  };
}

export const quizProjectionCreateCode = onCall(async (request) => {
  const ownerUid = await requireAuthorizedOwner(request);
  const data = request.data as { quizId?: unknown; label?: unknown; teamIds?: unknown; readOnly?: unknown; expiresAt?: unknown; code?: unknown };
  const quizId = cleanText(data?.quizId, 100);
  if (!quizId) throw new HttpsError("invalid-argument", "quizId is required.");
  const requestedCode = normalizeCode(data?.code);
  const code = requestedCode || generateCode(ownerUid);
  try { validateCode(code); } catch (error) { throw new HttpsError("invalid-argument", error instanceof Error ? error.message : "Invalid access code."); }
  const codeHash = hashCode(code);
  if (requestedCode && isRoutedCode(code)) throw new HttpsError("invalid-argument", "Custom codes may contain only letters, numbers, and hyphens.");
  if (requestedCode && await findLegacyCode(code)) throw new HttpsError("already-exists", "This custom code is already in use. Choose another code.");
  if ((await codeRef(ownerUid, codeHash).get()).exists) {
    throw new HttpsError("already-exists", requestedCode ? "This custom code is already in use. Choose another code." : "Could not generate a unique code. Try again.");
  }
  const accessId = `inv_${randomUUID()}`;
  const expiresAt = data?.expiresAt === null || data?.expiresAt === undefined || data?.expiresAt === "" ? null : Number(data.expiresAt);
  if (expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= Date.now())) throw new HttpsError("invalid-argument", "Expiration must be in the future.");

  let createdAccess: InvigilatorAccess | null = null;
  await db.runTransaction(async (transaction) => {
    const ref = stateRef(ownerUid);
    const snapshot = await transaction.get(ref);
    const quizzes = asQuizzes(snapshot.data());
    const quiz = findQuiz(quizzes, quizId);
    const requestedTeams = data?.teamIds === "all" ? "all" : Array.isArray(data?.teamIds) ? [...new Set(data.teamIds.map((item) => cleanText(item, 100)).filter(Boolean))] : "all";
    const validTeamIds = new Set((quiz.teams || []).map((team) => team.id));
    if (requestedTeams !== "all" && (requestedTeams.length === 0 || requestedTeams.some((teamId) => !validTeamIds.has(teamId)))) {
      throw new HttpsError("invalid-argument", "Assigned teams must belong to this quiz.");
    }
    createdAccess = {
      id: accessId,
      code,
      label: cleanText(data?.label, 80) || `Invigilator ${(quiz.invigilatorAccess || []).length + 1}`,
      teamIds: requestedTeams,
      readOnly: data?.readOnly === true,
      createdAt: Date.now(),
      expiresAt,
      revoked: false,
      lastUsedAt: null,
    };
    quiz.invigilatorAccess = [...(quiz.invigilatorAccess || []), createdAccess];
    transaction.set(ref, { ...snapshot.data(), quizzes, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.create(codeRef(ownerUid, codeHash), { appKey: APP_KEY, ownerUid, quizId, accessId, codeHash, createdAt: FieldValue.serverTimestamp() });
  });
  return { access: createdAccess };
});

export const quizProjectionRevokeSession = onCall(async (request) => {
  const ownerUid = await requireAuthorizedOwner(request);
  const data = request.data as { quizId?: unknown; accessId?: unknown };
  const quizId = cleanText(data?.quizId, 100);
  const accessId = cleanText(data?.accessId, 120);
  if (!quizId || !accessId) throw new HttpsError("invalid-argument", "quizId and accessId are required.");
  await db.runTransaction(async (transaction) => {
    const ref = stateRef(ownerUid);
    const snapshot = await transaction.get(ref);
    const quizzes = asQuizzes(snapshot.data());
    const quiz = findQuiz(quizzes, quizId);
    const access = (quiz.invigilatorAccess || []).find((item) => item.id === accessId);
    if (!access) throw new HttpsError("not-found", "Invigilator access not found.");
    access.revoked = true;
    transaction.set(ref, { ...snapshot.data(), quizzes, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.delete(codeRef(ownerUid, hashCode(access.code)));
  });
  return { revoked: true };
});

export const quizProjectionRedeemCode = onCall({ maxInstances: 2 }, async (request) => {
  rateLimitRedemption(request);
  const code = normalizeCode((request.data as { code?: unknown })?.code);
  try { validateCode(code); } catch { throw new HttpsError("invalid-argument", "Enter a valid access code."); }
  const codeHash = hashCode(code);
  let ownerUid: string;
  let quizId: string;
  let accessId: string;
  if (isRoutedCode(code)) {
    ownerUid = ownerUidFromCode(code);
    const match = await codeRef(ownerUid, codeHash).get();
    if (!match.exists) throw new HttpsError("permission-denied", "Invalid, expired, or revoked access code.");
    const lookup = match.data() || {};
    quizId = cleanText(lookup.quizId, 100);
    accessId = cleanText(lookup.accessId, 120);
  } else {
    const legacy = await findLegacyCode(code);
    if (!legacy) throw new HttpsError("permission-denied", "Invalid, expired, or revoked access code.");
    ({ ownerUid, quizId, accessId } = legacy);
  }
  const state = await stateRef(ownerUid).get();
  const quizzes = asQuizzes(state.data());
  const quiz = findQuiz(quizzes, quizId);
  const access = findAccess(quiz, accessId);
  if (hashCode(access.code) !== codeHash) throw new HttpsError("permission-denied", "Invalid access code.");

  const sessionId = `sess_${randomUUID()}`;
  const routing = Buffer.from(JSON.stringify({ ownerUid, sessionId }), 'utf8').toString('base64url');
  const sessionToken = `QPS.${routing}.${randomBytes(32).toString('base64url')}`;
  const sessionExpiresAt = Math.min(access.expiresAt ?? Number.POSITIVE_INFINITY, Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await sessionRef(ownerUid, sessionId).set({
    appKey: APP_KEY, ownerUid, quizId, accessId, tokenHash: hashCode(sessionToken), revoked: false,
    createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(sessionExpiresAt),
  });
  await db.runTransaction(async (transaction) => {
    const ref = stateRef(ownerUid);
    const fresh = await transaction.get(ref);
    const freshQuizzes = asQuizzes(fresh.data());
    const freshQuiz = findQuiz(freshQuizzes, quizId);
    findAccess(freshQuiz, accessId);
    freshQuiz.invigilatorAccess = (freshQuiz.invigilatorAccess || []).map((entry) => entry.id === accessId ? { ...entry, lastUsedAt: Date.now() } : entry);
    transaction.set(ref, { ...fresh.data(), quizzes: freshQuizzes, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return { sessionToken, quizId, expiresAt: sessionExpiresAt };
});

export const quizProjectionGetSessionState = onCall(async (request) => {
  const session = await requireSession(request);
  const state = await stateRef(session.ownerUid).get();
  const quiz = findQuiz(asQuizzes(state.data()), session.quizId);
  const access = findAccess(quiz, session.accessId);
  return { quiz: sanitizedQuiz(quiz, access) };
});

export const quizProjectionSubmitScore = onCall(async (request) => {
  const session = await requireSession(request);
  const data = request.data as { teamId?: unknown; questionId?: unknown; state?: unknown; customValue?: unknown };
  const teamId = cleanText(data?.teamId, 100);
  const questionId = cleanText(data?.questionId, 100);
  const scoreState = cleanText(data?.state, 20) as ScoreState;
  if (!teamId || !questionId || !["correct", "incorrect", "half", "unanswered", "custom"].includes(scoreState)) {
    throw new HttpsError("invalid-argument", "Team, question, and a valid score state are required.");
  }
  let responseQuiz: ReturnType<typeof sanitizedQuiz> | null = null;
  await db.runTransaction(async (transaction) => {
    const ref = stateRef(session.ownerUid);
    const snapshot = await transaction.get(ref);
    const quizzes = asQuizzes(snapshot.data());
    const quiz = findQuiz(quizzes, session.quizId);
    const access = findAccess(quiz, session.accessId);
    if (access.readOnly || quiz.status === "paused" || quiz.status === "completed" || quiz.status === "archived") throw new HttpsError("permission-denied", "This quiz is read-only right now.");
    if (access.teamIds !== "all" && !access.teamIds.includes(teamId)) throw new HttpsError("permission-denied", "This session cannot score that team.");
    if (!(quiz.teams || []).some((team) => team.id === teamId)) throw new HttpsError("not-found", "Team not found.");
    const question = (quiz.questions || []).find((item) => item.id === questionId);
    if (!question || question.active === false) throw new HttpsError("not-found", "Question is not active.");
    let marks: number | null;
    try { marks = computeMarks(question, scoreState, data?.customValue === undefined ? undefined : Number(data.customValue)); }
    catch (error) { throw new HttpsError("invalid-argument", error instanceof Error ? error.message : "Invalid marks."); }
    const scoreIndex = (quiz.scores || []).findIndex((item) => item.teamId === teamId && item.questionId === questionId);
    const previous = scoreIndex >= 0 ? quiz.scores[scoreIndex] : undefined;
    const entry = { teamId, questionId, state: scoreState, marks, updatedAt: Date.now(), updatedBy: session.accessId };
    if (scoreIndex >= 0) quiz.scores[scoreIndex] = entry;
    else quiz.scores = [...(quiz.scores || []), entry];
    const audit = {
      id: `log_${randomUUID()}`, quizId: quiz.id, teamId, questionId,
      previousMarks: previous?.marks ?? null, newMarks: marks,
      previousState: previous?.state ?? "unanswered", newState: scoreState,
      actorRole: "invigilator", actorId: session.accessId, timestamp: Date.now(),
    };
    quiz.auditLogs = [audit, ...(quiz.auditLogs || [])].slice(0, 500);
    responseQuiz = sanitizedQuiz(quiz, access);
    transaction.set(ref, { ...snapshot.data(), quizzes, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return { quiz: responseQuiz };
});
