import { browserSessionPersistence, setPersistence, signInWithCustomToken, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions, invigilatorAuth, invigilatorFunctions } from '@/firebase/client';
import type { InvigilatorAccess, Quiz, ScoreState } from '@/types';

export type SessionAccess = Pick<InvigilatorAccess, 'id' | 'label' | 'teamIds' | 'readOnly' | 'expiresAt'>;
export interface SessionQuiz extends Quiz { sessionAccess: SessionAccess }

function messageFrom(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\([^)]*\)\.?$/, '')
      .replace(/\s*\[\d+\]\s*$/, '');
  }
  return 'The request could not be completed.';
}

export async function createInvigilatorCode(input: {
  quizId: string;
  code?: string;
  label: string;
  teamIds: string[] | 'all';
  readOnly: boolean;
  expiresAt: number | null;
}): Promise<InvigilatorAccess> {
  try {
    const call = httpsCallable<typeof input, { access: InvigilatorAccess }>(functions, 'quizProjectionCreateCode');
    return (await call(input)).data.access;
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function revokeInvigilatorSession(quizId: string, accessId: string): Promise<void> {
  try {
    const call = httpsCallable<{ quizId: string; accessId: string }, { revoked: boolean }>(functions, 'quizProjectionRevokeSession');
    await call({ quizId, accessId });
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function redeemInvigilatorCode(code: string): Promise<string> {
  try {
    const call = httpsCallable<{ code: string }, { token: string; quizId: string }>(invigilatorFunctions, 'quizProjectionRedeemCode');
    const result = await call({ code });
    await setPersistence(invigilatorAuth, browserSessionPersistence);
    await signInWithCustomToken(invigilatorAuth, result.data.token);
    return result.data.quizId;
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function getInvigilatorSessionState(): Promise<SessionQuiz> {
  try {
    if (!invigilatorAuth.currentUser) throw new Error('Your invigilator session is not signed in.');
    const call = httpsCallable<Record<string, never>, { quiz: SessionQuiz }>(invigilatorFunctions, 'quizProjectionGetSessionState');
    return (await call({})).data.quiz;
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function submitInvigilatorScore(input: {
  teamId: string;
  questionId: string;
  state: ScoreState;
  customValue?: number;
}): Promise<SessionQuiz> {
  try {
    const call = httpsCallable<typeof input, { quiz: SessionQuiz }>(invigilatorFunctions, 'quizProjectionSubmitScore');
    return (await call(input)).data.quiz;
  } catch (error) {
    throw new Error(messageFrom(error));
  }
}

export async function signOutInvigilator(): Promise<void> {
  await signOut(invigilatorAuth);
}
