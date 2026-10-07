# TetrixAI: Multimodal Medical Image Intelligence Platform

> The GitHub repository is named `NEXUS_Q`; the product is called **TetrixAI**.
> HackNex 2026 | Problem Statement HNX26PSI05 | Team Submission

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://nexus-q.pages.dev)
[![GitHub](https://img.shields.io/badge/GitHub-NEXUS__Q-black)](https://github.com/sandeepmk2006/NEXUS_Q)

---

## 🩺 What We Built

**TetrixAI** is a production-grade AI-powered medical imaging second-opinion platform. Doctors upload X-rays, CT scans, MRIs, or any medical image, provide clinical context, and receive structured AI analysis with:

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
| Deployment | Cloudflare Pages (frontend) + Cloudflare Workers (backend) |

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
1. Every finding must carry a bounding box (`[ymin, xmin, ymax, xmax]`, 0-1000 normalized) **or** cite the clinical notes. Findings with neither are discarded in code, and the report shows how many were dropped.
2. Confidence is 0-100 per finding. On `poor` image quality it is multiplied by 0.6, on `fair` by 0.85, and a warning banner is shown.
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

## 🌐 Deployment (Cloudflare)

```bash
# Frontend → Cloudflare Pages
npm run build
# Deploy dist/ to Cloudflare Pages

# Backend → Cloudflare Workers (or any Node.js host)
npm run build
# Deploy with wrangler or your preferred host
```

---

## 📜 License

MIT — See [LICENSE](LICENSE)

---

## 👨‍💻 Team

Built for **HackNex 2026 Internal Qualifier** — Karunya Institute of Technology and Sciences
Division of Computer Science and Engineering
