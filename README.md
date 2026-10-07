# TetrixAI: Multimodal Medical Image Intelligence Platform

> The GitHub repository is named `NEXUS_Q`; the product is called **TetrixAI**.
> HackNex 2026 | Problem Statement HNX26PSI05 | Team Submission

**Live demo:** https://tetrixai.tech
[![GitHub](https://img.shields.io/badge/GitHub-NEXUS__Q-black)](https://github.com/sandeepmk2006/NEXUS_Q)

---

## 🩺 What We Built

**TetrixAI** is an AI-powered medical imaging second-opinion platform. Doctors upload X-rays, CT scans, MRIs, or any medical image, provide clinical context, and receive structured AI analysis with:

- **Precise lesion localization** — every finding points to an exact anatomical region
- **Confidence levels** — 0–100% confidence scores, never false certainty
- **Anti-hallucination guarantee** — every finding must be backed by image evidence OR clinical notes
- **Multimodal reasoning** — combines image analysis with patient history and symptoms
- **Doctor-first framing** — "Doctor, consider examining..." never "The patient has..."

---

## 🏗️ Architecture

```
NEXUS_Q/
├── frontend/          # React 18 + TypeScript + TailwindCSS
│   └── src/
│       ├── pages/     # SignIn, Register, Dashboard, Patients, Analysis, Admin
│       ├── components/ # Reusable UI + Analysis components
│       ├── config/    # Firebase + Axios API
│       └── store/     # Zustand auth state
│
├── backend/           # Node.js + Express + TypeScript
│   └── src/
│       ├── routes/    # auth, patients, analysis, admin
│       ├── middleware/ # Firebase auth verification, RBAC
│       ├── services/  # Gemini AI service
│       └── config/    # Firebase Admin SDK
```

## 🔑 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, TailwindCSS v4, Vite (white and blue clinical theme, IBM Plex Sans) |
| State | Zustand (with persistence) |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firebase Firestore |
| Backend | Node.js, Express, TypeScript |
| AI Engine | Google Gemini via `@google/generative-ai` (model set in `MODEL_NAME`, `backend/src/services/geminiService.ts`; currently `gemini-flash-lite-latest`) |
| Deployment | Render: static site (frontend) + web service (backend), auto-deployed from GitHub |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase project with Authentication and Firestore enabled
- Google OAuth configured in Firebase Console
- Gemini API key

### 1. Clone the Repository
```bash
git clone https://github.com/sandeepmk2006/NEXUS_Q.git
cd NEXUS_Q
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your Firebase service account credentials and Gemini API key
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in your Firebase web app config
npm install
npm run dev
```

### 4. Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Google sign-in
3. Enable **Firestore Database**
4. Add your domain to Authorized Domains
5. Download service account key for backend `.env`
6. Copy web app config for frontend `.env`

### 5. Create Admin Account
```bash
# After Firebase setup, call the init-admin endpoint once:
curl -X POST http://localhost:5000/api/auth/init-admin \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "your-secret", "idToken": "google-oauth-token"}'
```

---

## 🧠 AI Analysis Pipeline

```
Scan (browser downsizes to <=1024px JPEG) -> POST /api/analysis/analyze
        |
        v
Gemini multimodal call (JSON mode) = image + patient history + clinical notes
        |
        v
Structured JSON: findings[] each with location text, boundingBox, confidence,
                 evidenceSource, supportingEvidence, severity, recommendation
        |
        v
Server-side validation (sanitizeFindings):
  - drop findings with no valid image box AND no clinical-notes citation
  - clamp confidence to 0-100, validate severity / box geometry
  - poor/fair image quality -> confidence scaled down + warning
        |
        v
Saved with the (downsized) image -> report page draws boxes over the scan
```

### Anti-Hallucination Rules (prompt **and** code)
1. A finding is asserted only if it has a bounding box (`[ymin, xmin, ymax, xmax]`, 0-1000 normalized) and supporting evidence. A claim backed only by the clinical notes is rewritten as *"Clinical notes suggest X, but it cannot be localized on the provided scan"* and listed separately. Anything else is discarded, and the report shows how many.
2. Confidence is shown with its breakdown: `model confidence - image quality penalty` (poor 25, fair 10, unknown 5), capped at 95%. No single image justifies certainty. Poor or fair quality also shows a warning banner.
3. If the model output cannot be parsed, the report says so explicitly instead of presenting an empty (apparently clean) result.
4. All output is phrased as suggestions to the doctor.

### Localization
Localization is **bounding boxes** predicted by Gemini, rendered as clickable overlays linked to each finding card. There is no pixel-level segmentation or Grad-CAM heatmap, and box accuracy depends on the model and is not clinically validated.

---

## 🖼️ Interface

White and blue clinical theme throughout. Each report shows the scan with numbered, severity-coloured boxes linked to the finding cards below it, plus a quality banner when the image is poor.

## 👥 Role-Based Access Control

| Feature | Doctor | Admin |
|---------|--------|-------|
| View own patients | ✅ | ✅ |
| View all patients | ❌ | ✅ |
| Run AI analysis | ✅ | ✅ |
| Transfer patients | ❌ | ✅ |
| Suspend doctors | ❌ | ✅ |
| View audit logs | ❌ | ✅ |
| Create new accounts | Via registration | Pre-configured only |

---

## 📊 Evaluation Criteria Coverage

| Criterion | Implementation |
|-----------|---------------|
| Abnormality detection | Gemini multimodal analysis (no custom-trained classifier) |
| Region localization | Bounding box per finding, drawn over the scan |
| Multimodal (image + notes) | Clinical notes, history and medications fused into the prompt; `evidenceSource` records which was used |
| Confidence levels | 0-100% per finding, color-coded, reduced on poor image quality |
| Evidence-backed findings | Unsupported findings are filtered out in code |
| Poor image handling | Quality rating + confidence penalty + warning banner |
| Doctor-helper framing | System prompt enforces suggestion language |

## 🎯 Scope Note

**Minimum viable (implemented):** upload -> multimodal Gemini analysis -> structured findings with confidence, evidence, bounding boxes -> annotated report; auth, patients, admin.

**Stretch / not done:** automated tests, pixel-level segmentation, heatmaps, DICOM support, a locally trained or fine-tuned model, quantitative evaluation on a labelled dataset.

## 📦 External Resources Declared

- Google Gemini API (pre-trained multimodal model) - all image reasoning
- Firebase Authentication / Firestore (Firestore optional; falls back to a local `localdb.json` file)
- Open-source libraries: Express, React, Vite, Tailwind, Zustand, Axios, multer
- Test images: use any public chest X-ray set (e.g. the Kaggle "Chest X-Ray Images (Pneumonia)" dataset). No dataset is bundled and none was used for training.
- Built with AI coding assistance (Claude Code / Antigravity); the team reviewed and is responsible for the code.

## 🔁 Reproducing the Demo

1. Complete Quick Start and sign in with Google.
2. Add a patient (age, gender, history, medications).
3. New Analysis -> choose the patient, upload a public chest X-ray, enter clinical notes (e.g. the sample below).
4. Open the report: the scan shows numbered boxes, each linked to a finding card with confidence and evidence.
5. Try a blurry or low-contrast image to see the quality warning and lowered confidence.

---

## 📁 Sample Input/Output

### Input
- Image: Chest X-ray (JPEG)
- Clinical Notes: "65-year-old male, smoker, presenting with persistent cough and weight loss"
- Patient History: "COPD, hypertension"

### Output
```json
{
  "imageQualityRating": "good",
  "imageQuality": "Good - adequate for interpretation",
  "findings": [
    {
      "finding": "Irregular opacity with spiculated margins",
      "location": "Right upper lobe, perihilar region",
      "boundingBox": [180, 560, 340, 720],
      "evidenceSource": "both",
      "confidence": 78,
      "severity": "high",
      "supportingEvidence": "Image shows 2-3cm density in right upper lobe. Clinical history of smoking and weight loss raises malignancy concern.",
      "recommendation": "Doctor, consider urgent CT chest with contrast and pulmonology referral for this finding."
    }
  ],
  "overallAssessment": "Doctor, this chest X-ray warrants urgent attention...",
  "disclaimer": "This analysis is a second-opinion tool. Clinical judgment supersedes AI findings."
}
```

---

## 🔒 Security

- All API endpoints require Firebase ID token authentication
- Role-based access control (RBAC) enforced server-side
- Admin account cannot be created through registration UI
- Rate limiting on analysis endpoints
- CORS restricted to frontend domain
- Helmet.js security headers

---

## 🌐 Deployment (Render)

The whole app runs on Render's free plan, defined in `render.yaml`. Both parts redeploy automatically on every `git push` to `main`. There is no manual deploy step.

```
GitHub (main) ──push──► Render
                          ├─ tetrixai-frontend  static site (React build)
                          └─ tetrixai-backend   web service (Express API)
```

### 1. Create both services (one time)
In Render, choose **New → Blueprint** and select this repository. Render reads `render.yaml` and creates both services. It asks for the values below.

**Backend (`tetrixai-backend`)**

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `FRONTEND_URL` | Every address the frontend is served from, comma-separated, e.g. `https://tetrixai.tech,https://www.tetrixai.tech,https://tetrixai-frontend.onrender.com` |
| `FIREBASE_PROJECT_ID` | Same as `VITE_FIREBASE_PROJECT_ID`. **Required**: production only accepts properly verified sign-in tokens |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Optional service account. With them, data is stored in Firestore. Without them it goes to `localdb.json`, which Render wipes on every redeploy or restart |
| `ADMIN_EMAIL`, `ADMIN_INIT_SECRET` | For creating the admin account |

**Frontend (`tetrixai-frontend`)**

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | The backend's URL plus `/api`, e.g. `https://tetrixai-backend.onrender.com/api` |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | From your Firebase web app config |

You only know the final `.onrender.com` URLs after the services are created. If you had to guess them, correct `FRONTEND_URL` and `VITE_API_URL` afterwards in each service's **Environment** tab. The frontend then needs a redeploy (**Manual Deploy → Deploy latest commit**), because `VITE_*` values are baked in at build time.

### 2. Allow sign-in from the live site (one time)
In the Firebase console, open **Authentication → Settings → Authorized domains** and add the frontend's `onrender.com` domain. Google sign-in fails on the live site without this.

### 3. Check it
- `https://<backend>.onrender.com/health` returns `{"status":"ok"}`.
- The frontend loads, Google sign-in works, and refreshing a page such as `/analysis/<id>` still works (`render.yaml` rewrites every route to `index.html`).

### Things to know
- The free backend sleeps after about 15 minutes idle; the first request then takes around 30-60 seconds. Open the site a minute before a demo. The static frontend does not sleep.
- Node 22 is pinned through `NODE_VERSION` in `render.yaml`.

## ⚠️ Known Limitations

- Findings come from a general-purpose multimodal model, not a model trained or clinically validated for diagnosis. Boxes are approximate.
- In local development (`NODE_ENV` not `production`) the server also accepts sign-in tokens without verifying their signature, so it runs without Firebase setup. Production disables this and verifies every token against `FIREBASE_PROJECT_ID`.
- Accuracy has not been measured on a labelled dataset.

---

## 📜 License

MIT — See [LICENSE](LICENSE)

---

## 👨‍💻 Team

Built for **HackNex 2026 Internal Qualifier** — Karunya Institute of Technology and Sciences
Division of Computer Science and Engineering
