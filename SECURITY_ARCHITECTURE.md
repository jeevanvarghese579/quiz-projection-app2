# Production Firebase security architecture

## Verified state

The canonical shared-rules repository was inspected on 4 November 2026. It uses an `authorizedUser(appId, uid)` helper backed by `/accessUsers/{uid}` and `/appRegistry/{appId}`, and owner-scoped rules below `/apps/{appId}/users/{uid}/...`. The proposed `quizProjectionApp2` key is not present in the current canonical rules. Browser clients cannot read or write the Access Manager control-plane collections.

Consequently, this repository intentionally ships the safe demo implementation only. The deployed demo stores fictional quiz state in browser `localStorage` and synchronizes open same-origin tabs through storage events. It does not write to Firestore or claim production authorization.

## Proposed production model

- App key: `quizProjectionApp2` (pending registration and approval).
- Owner data root: `/apps/quizProjectionApp2/users/{ownerUid}/quizzes/{quizId}`.
- Child collections: `teams`, `questions`, `scores`, `leaderboard`, `invigilatorAccess`, `invigilatorSessions`, and `auditLogs`.
- Administrators authenticate with Google, then a trusted callable verifies Access Manager entitlement, active app registration, expiration, and quiz ownership.
- Invigilators authenticate anonymously and redeem a rate-limited, hashed code through `quizProjectionRedeemCode`. The callable returns only a narrow, expiring session; raw codes are never stored in readable documents.
- Score mutations use `quizProjectionSubmitScore` and transactions. The function validates the session, team assignment, question, state, mark bounds, quiz status, and writes an immutable server-timestamped audit entry.
- Admin corrections use `quizProjectionCorrectScore` with the same ownership and Access Manager checks.
- Projector delivery exposes only approved display fields. It must use an authorized server-mediated stream or a narrowly scoped read model approved in the canonical rules.

## Required approval sequence

1. Register the fixed Web App ID and final app key in Access Manager.
2. Prepare a minimal canonical-rule change and emulator tests in the shared-config repository.
3. Review the exact rule diff and full test results.
4. Obtain explicit approval, then deploy rules from the canonical repository only.
5. Implement and review the application-specific callable functions.
6. Obtain explicit approval, then deploy only the named quiz functions.
7. Enable production mode and perform a multi-client real-time acceptance test.

Hosting can be deployed independently because `firebase.json` contains Hosting only and the command is scoped to `hosting:quiz-projection-app2`.
