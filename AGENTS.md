# Repository instructions

## Quality gates

- Run `npm run check` before committing or deploying.
- Keep the interface responsive and preserve reduced-motion behavior.
- Never label local demo state as production Firebase data.

## Firebase shared-project safety

- Firebase project: `inter-level-progress-manager`.
- Hosting site: `quiz-projection-app2`.
- Fixed Web App ID: `1:379503088311:web:ff8ed9b3c2540b9b133332`.
- Proposed, not yet registered, app key: `quizProjectionApp2`.
- All future application data must live below `/apps/quizProjectionApp2/users/{ownerUid}/...` after registration.
- The canonical rules repository is `jeevanvarghese579/school-softwares-firebase-shared-config`.
- Do not add or deploy authoritative Firestore or Storage rules from this repository.
- Do not run unscoped `firebase deploy`.
- Do not deploy Functions, rules, Access Manager changes, or production data changes without explicit action-time approval.
- Never place Admin SDK credentials or service-account keys in this repository.
