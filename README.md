# Quiz Projection App 2

Live quiz scoring and an animated championship leaderboard for schools, colleges, and educational institutions.

Production site: [quiz-projection-app2.web.app](https://quiz-projection-app2.web.app)

## Current release

Administrators sign in with Google through Firebase Authentication. The application calls the existing Firebase Access Manager `checkMyAccess` and `requestAppAccess` functions using the fixed Web App ID, then reads and writes only `/apps/quizProjectionApp2/users/{uid}/...`. Quiz state is synchronized in real time through Firestore. Invigilators use independent, expiring Firebase custom-auth sessions created by app-specific callable Functions, so an administrator does not need to be signed in on the invigilator device.

The canonical rule change is maintained and tested only in `jeevanvarghese579/school-softwares-firebase-shared-config`; this application repository never owns or deploys shared rules. See [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md).

## Features

- Multiple independent quizzes with draft, live, paused, completed, and archived states
- Team and student management with CSV import/export
- Configurable questions and correct, incorrect, half, unanswered, and bounded custom scores
- Server-generated invigilator codes with independent login, team restrictions, expiry, revocation, and read-only access
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

Open the local URL printed by Vite and sign in with an Access Manager-authorized Google account.

## Quality checks

```bash
npm run check
```

This runs TypeScript, ESLint, frontend and Functions unit tests, and both production builds. Tests never connect to production Firebase.

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
- Canonical app key: `quizProjectionApp2`
- Data root: `/apps/quizProjectionApp2/users/{ownerUid}/...`
- Canonical rules repository: `jeevanvarghese579/school-softwares-firebase-shared-config`

This repository deliberately contains no Firestore or Storage rules and no Admin SDK credentials. Google authentication alone never grants administrator access. Production invigilator code redemption and score writes use the deployed callable Functions described in [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md).

## Hosting deployment

The Hosting deployment script is scoped to this Hosting site:

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
