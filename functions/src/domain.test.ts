import test from "node:test";
import assert from "node:assert/strict";
import { computeMarks, generateCode, hashCode, isRoutedCode, normalizeCode, ownerUidFromCode, validateCode } from "./domain.js";

test("generated codes are normalized, valid, and high entropy length", () => {
  const code = generateCode("FirebaseUid_AbC123");
  assert.match(code, /^QP2\.FirebaseUid_AbC123\.[A-Z0-9]{12}$/);
  assert.doesNotThrow(() => validateCode(code));
  assert.equal(ownerUidFromCode(code), "FirebaseUid_AbC123");
  assert.equal(isRoutedCode(code), true);
});

test("normalization and hashing are stable", () => {
  assert.equal(normalizeCode(" QP2.FirebaseUid.ABCD1234EFGH "), "QP2.FirebaseUid.ABCD1234EFGH");
  assert.equal(hashCode("QP2.FirebaseUid.ABCD1234EFGH"), hashCode(" QP2.FirebaseUid.ABCD1234EFGH "));
});

test("legacy numeric and named codes remain compatible", () => {
  assert.equal(normalizeCode(" 888888 "), "888888");
  assert.equal(normalizeCode(" science-4827 "), "SCIENCE-4827");
  assert.doesNotThrow(() => validateCode("888888"));
  assert.doesNotThrow(() => validateCode("SCIENCE-4827"));
  assert.equal(isRoutedCode("888888"), false);
  assert.throws(() => validateCode("SHORT"));
  assert.throws(() => validateCode("SCIENCE CODE"));
  assert.throws(() => validateCode("SCIENCE_2026"));
});

test("score calculation enforces question bounds", () => {
  const question = { id: "q1", maxMarks: 10 };
  assert.equal(computeMarks(question, "correct"), 10);
  assert.equal(computeMarks(question, "incorrect"), 0);
  assert.equal(computeMarks(question, "incorrect", undefined, 25), -2.5);
  assert.equal(computeMarks({ id: "q2", maxMarks: 3 }, "incorrect", undefined, 33), -0.99);
  assert.equal(computeMarks(question, "half"), 5);
  assert.equal(computeMarks(question, "unanswered"), null);
  assert.equal(computeMarks(question, "custom", 7.5), 7.5);
  assert.throws(() => computeMarks(question, "custom", 11));
});
