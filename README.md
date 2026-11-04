# Quiz Projection App 2

Live quiz scoring and an animated championship leaderboard for schools, colleges, and educational institutions.

Production site: [quiz-projection-app2.web.app](https://quiz-projection-app2.web.app)

## Current release

This release is a complete, browser-local demonstration of the administrator, invigilator, results, CSV, audit-log, and animated-projector workflows. Demo data persists in the browser and changes synchronize across open tabs on the same origin. The interface labels this mode clearly.

Production Firestore scoring is intentionally disabled. The shared Firebase project's canonical rules do not yet register the proposed `quizProjectionApp2` app key, and the required Access Manager and callable-function changes have not been approved. See [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) for the verified state and rollout plan.

## Features

- Multiple independent quizzes with draft, live, paused, completed, and archived states
- Team and student management with CSV import/export
- Configurable questions and correct, incorrect, half, unanswered, and bounded custom scores
- Team-restricted demo invigilator codes, expiry, revocation, and read-only access
- Results table, CSV export, printing, corrections, resets, and audit history
- Full-screen projector with stable team colors, tied rankings, reduced-motion support, animated score changes, and overflow standings
- Responsive admin and mobile scoring interfaces
- Exact developer credits and project links on the About page
- Firebase Hosting single-page-app rewrites and scoped deployment

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Use demo invigilator code `SCIENCE-4827`.

## Quality checks

```bash
npm run check
```

This runs TypeScript, ESLint, Vitest, and the production Vite build. Tests never connect to production Firebase.

## CSV format

Team import accepts these headers:

```csv
team_name,team_color,student_name,student_id,class,institution
Team Alpha,#3B82F6,Asha A,STU-001,10A,Example School
```

Repeated team rows are merged into the same team during import.

## Firebase configuration and safety

- Project ID: `inter-level-progress-manager`
- Hosting site: `quiz-projection-app2`
- Web App ID: `1:379503088311:web:ff8ed9b3c2540b9b133332`
- Proposed app key: `quizProjectionApp2` (not yet registered or approved)
- Proposed data root: `/apps/quizProjectionApp2/users/{ownerUid}/...`
- Canonical rules repository: `jeevanvarghese579/school-softwares-firebase-shared-config`

This repository deliberately contains no Firestore or Storage rules and no Admin SDK credentials. Google authentication alone must never grant administrator access. Production invigilator code redemption and score writes require the reviewed callable functions described in [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md).

## Hosting deployment

The only deployment script in this repository is scoped to this Hosting site:

```bash
npm run deploy:hosting
```

Equivalent command after a successful build:

```bash
firebase deploy --project inter-level-progress-manager --only hosting:quiz-projection-app2
```

Never run an unscoped deployment from this repository.

## Developer

Developed by **Jeevan Varghese**, HSST Jr. Botany, St. Gemma's Girls' HSS, Malappuram.

[Developer website](https://itsjeevanvarghese.web.app) · [GitHub repository](https://github.com/jeevanvarghese579/quiz-projection-app2)
