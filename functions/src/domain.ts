import { createHash, randomBytes } from "node:crypto";

export type ScoreState = "correct" | "incorrect" | "half" | "unanswered" | "custom";

export interface QuestionLike {
  id: string;
  maxMarks: number;
  active?: boolean;
}

export function normalizeCode(value: unknown): string {
  const compact = String(value || "").trim().replace(/\s+/g, "");
  return compact.startsWith("QP2.") ? compact : compact.toUpperCase();
}

export function hashCode(code: string): string {
  return createHash("sha256").update(normalizeCode(code)).digest("hex");
}

export function generateCode(ownerUid: string): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(12);
  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `QP2.${ownerUid}.${body}`;
}

export function validateCode(code: string): void {
  const routed = /^QP2\.[A-Za-z0-9_-]{1,128}\.[A-Z0-9]{12}$/.test(code);
  const legacy = /^[A-Z0-9-]{6,48}$/.test(code);
  if (!routed && !legacy) {
    throw new Error("Access codes must contain 6–48 letters, numbers, or hyphens.");
  }
}

export function ownerUidFromCode(code: string): string {
  if (!code.startsWith('QP2.')) throw new Error('Legacy codes do not contain an owner UID.');
  validateCode(code);
  return code.split('.')[1];
}

export function isRoutedCode(code: string): boolean {
  return code.startsWith('QP2.');
}

export function computeMarks(question: QuestionLike, state: ScoreState, customValue?: number, negativeMarkingPercentage = 0): number | null {
  const max = Number(question.maxMarks);
  if (!Number.isFinite(max) || max < 0) throw new Error("Question maximum marks are invalid.");
  if (state === "correct") return max;
  if (state === "incorrect") {
    const percentage = Math.min(100, Math.max(0, Number(negativeMarkingPercentage) || 0));
    if (percentage === 0) return 0;
    return Math.round((-Math.abs(max) * percentage / 100) * 100) / 100;
  }
  if (state === "half") return max / 2;
  if (state === "unanswered") return null;
  if (!Number.isFinite(customValue) || Number(customValue) < -Math.abs(max) || Number(customValue) > max) {
    throw new Error(`Custom marks must be between ${-Math.abs(max)} and ${max}.`);
  }
  return Number(customValue);
}
