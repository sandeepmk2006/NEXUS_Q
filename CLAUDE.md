# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NEXUS-Q (backend logs call it "TetrixAI"): an AI second-opinion platform for medical images. Doctors upload an X-ray/CT/MRI with clinical context; the backend sends it to Gemini and returns structured findings (anatomical location, 0–100 confidence, evidence). Prompt rules that must be preserved: every finding must be backed by image evidence or clinical notes (anti-hallucination), and output is doctor-directed ("Doctor, consider examining…"), never a diagnosis of the patient.

## Commands

Two independent npm projects (`frontend/`, `backend/`); the root `package.json` only has convenience scripts.

```bash
npm run install:all          # install both
npm run dev:backend          # backend: tsc && node dist/index.js  (port 5000, no watch mode — rerun after edits)
npm run dev:frontend         # Vite on 5173, proxies /api -> localhost:5000
npm run build:frontend       # tsc -b && vite build
npm run build:backend        # tsc -> backend/dist
cd frontend && npm run lint  # oxlint
```

There is no test suite. `backend/test_gemini.js` and `backend/list_models.js` are ad-hoc scripts for checking the Gemini API key/model availability.

## Architecture

**Backend** (`backend/src`, Express + TypeScript): `index.ts` mounts `/api/auth`, `/api/patients`, `/api/analysis`, `/api/admin` plus `/health`. CORS origin comes from `FRONTEND_URL`.

- **Auth** (`middleware/auth.ts`): `authenticate` verifies the Firebase ID token from `Authorization: Bearer`. `verifyTokenHelper` falls back from Firebase Admin → Google tokeninfo → decoding the JWT payload *without signature verification*. That last step exists so local dev works without service-account credentials. Role guards are `requireDoctor` and `requireAdmin` (roles: `doctor` | `admin`).
- **Data layer**: `config/firebase.ts` exports `db`. That is real Firestore only when `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` are all set. Otherwise it is `appDb` from `services/db.ts`, a Firestore-shaped shim that persists to `localdb.json` in the process cwd. Route code must stay compatible with both: avoid Firestore features the shim lacks. Recent fixes removed chained `orderBy`, which also required composite indexes in real Firestore, so sort in memory instead.
- **AI** (`services/geminiService.ts`): `analyzemedicalImage()` uses `@google/generative-ai`. It sends a system prompt, a user prompt with clinical context, and the inline image, then parses JSON into `AnalysisResult`/`MedicalFinding`. The model name is hard-coded in several places in that file and has changed often because of API deprecations, so update every occurrence together.
- **Uploads**: `routes/analysis.ts` uses multer memory storage (20 MB limit, field `image`). The JSON body limit is 50 MB.

**Frontend** (`frontend/src`, React 19 + Vite + Tailwind v4 + Zustand):
- `config/api.ts`: axios instance with `baseURL = VITE_API_URL || '/api'`. Request paths must not repeat `/api` (this has caused 404s). An interceptor attaches the Firebase ID token, and a 401 signs the user out and redirects to `/signin`.
- `config/firebase.ts`: Firebase client configured from `VITE_FIREBASE_*` env vars; Google OAuth sign-in.
- `store/authStore.ts`: persisted Zustand auth/user state.
- `pages/`: route-level screens (Dashboard, PatientList/Detail, NewAnalysis, AnalysisReport, AdminDashboard, …). API list responses are wrapped objects (e.g. `{ patients: [...] }`, `{ analyses: [...] }`), not bare arrays, so unwrap them before mapping.

**Deployment**: Cloudflare Pages (frontend) and Workers (backend); each package has a `wrangler.toml`.

## Environment

- Backend `.env` (see `.env.example`): `GEMINI_API_KEY`, optional `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`, `FRONTEND_URL`, `PORT`, `ADMIN_EMAIL`/`ADMIN_INIT_SECRET` (admin bootstrap).
- Frontend: `VITE_FIREBASE_*`, optional `VITE_API_URL`.
