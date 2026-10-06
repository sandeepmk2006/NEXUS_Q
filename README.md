# NEXUS-Q: Multimodal Medical Image Intelligence Platform

> HackNex 2026 | Problem Statement HNX26PSI05 | Team Submission

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://nexus-q.pages.dev)
[![GitHub](https://img.shields.io/badge/GitHub-NEXUS__Q-black)](https://github.com/sandeepmk2006/NEXUS_Q)

---

## 🩺 What We Built

**NEXUS-Q** is a production-grade AI-powered medical imaging second-opinion platform. Doctors upload X-rays, CT scans, MRIs, or any medical image, provide clinical context, and receive structured AI analysis with:

- **Precise lesion localization** — every finding points to an exact anatomical region
- **Confidence levels** — 0–100% confidence scores, never false certainty
- **Anti-hallucination guarantee** — every finding must be backed by image evidence OR clinical notes
- **Multimodal reasoning** — combines image analysis with patient history and symptoms
- **Doctor-first framing** — "Doctor, consider examining..." never "The patient has..."

---

## 🏗️ Architecture

```
NEXUS-Q/
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
| Frontend | React 18, TypeScript, TailwindCSS v4, Vite |
| State | Zustand (with persistence) |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firebase Firestore |
| Backend | Node.js, Express, TypeScript |
| AI Engine | Google Gemini 2.0 Flash (multimodal) |
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
Medical Image → Base64 Encode → Gemini 2.0 Flash Multimodal
                                        ↓
                          System Prompt (Anti-hallucination rules)
                                        ↓
                          Clinical Notes + Patient History
                                        ↓
                     Structured JSON Response with:
                     • Finding + Exact Location
                     • Confidence Score (0-100%)
                     • Supporting Evidence
                     • Severity Level
                     • Doctor Recommendations
                                        ↓
                              Saved to Firestore
```

### Anti-Hallucination Rules (enforced in prompt)
1. Every finding must cite exact image region OR clinical notes
2. Confidence levels are always realistic (never 100% without strong evidence)
3. Poor-quality images trigger quality warnings
4. Unsupported findings are explicitly prohibited

---

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
| Abnormality detection | Gemini 2.0 Flash multimodal analysis |
| Region localization | Exact anatomical coordinates in findings |
| Multimodal (image + notes) | Clinical notes fused into Gemini prompt |
| Confidence levels | 0-100% per finding, color-coded |
| Evidence-backed findings | Every finding requires image/note citation |
| Poor image handling | Image quality assessment in every analysis |
| Doctor-helper framing | System prompt enforces suggestion language |

---

## 📁 Sample Input/Output

### Input
- Image: Chest X-ray (JPEG)
- Clinical Notes: "65-year-old male, smoker, presenting with persistent cough and weight loss"
- Patient History: "COPD, hypertension"

### Output
```json
{
  "imageQuality": "Good — adequate for diagnostic interpretation",
  "findings": [
    {
      "finding": "Irregular opacity with spiculated margins",
      "location": "Right upper lobe, perihilar region",
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
