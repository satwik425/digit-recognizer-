# NeuroDraw — Handwritten Digit Recognizer

> Draw any digit 0–9. Watch a CNN predict it in real time, complete with confidence scores and probability charts.

![accuracy](https://img.shields.io/badge/Test%20Accuracy-99.1%25-brightgreen)
![tensorflow](https://img.shields.io/badge/TensorFlow-2.x-orange)
![pytorch](https://img.shields.io/badge/PyTorch-2.x-red)
![fastapi](https://img.shields.io/badge/FastAPI-0.110-009688)
![react](https://img.shields.io/badge/React-18-61dafb)
![license](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

| Category | Details |
|---|---|
| 🎨 **Canvas** | Mouse + touch drawing, adjustable brush size (S/M/L) |
| ⚡ **Real-time** | Prediction fires 500ms after stroke ends — no button needed |
| ↩️ **Undo / Redo** | Full stroke history (Ctrl+Z / Ctrl+Shift+Z) |
| 📊 **Charts** | Animated probability bars for all 10 digits |
| 🔵 **Confidence ring** | SVG ring visualising model certainty |
| 📝 **Session history** | Scrollable log of all drawings with thumbnails |
| 💾 **Download** | Save your drawn digit as PNG (Ctrl+S) |
| ⌨️ **Shortcuts** | Full keyboard shortcut system with reference modal |
| 🌓 **Dark/Light mode** | Persisted to localStorage |
| 📱 **Mobile** | Full touch drawing support |
| 📈 **Analytics page** | Training curves, confusion matrix, model architecture |
| 🧭 **Onboarding** | 4-step first-run tour |

---

## 🏗️ Architecture

```
digit-recognizer/
├── model/
│   ├── train.py              # TensorFlow / Keras CNN
│   ├── train_pytorch.py      # PyTorch CNN (same architecture)
│   ├── evaluate.py           # Evaluation + per-class accuracy
│   └── convert_to_tfjs.py    # Export to TF.js (browser inference)
│
├── backend/
│   ├── main.py               # FastAPI REST API
│   ├── pytorch_adapter.py    # Framework-agnostic model loader
│   └── tests/test_api.py     # 14-test pytest suite
│
├── frontend/
│   └── src/
│       ├── App.js            # Root — all features wired together
│       ├── App.css           # Full design system
│       ├── components/
│       │   ├── BrushSizeControl.js
│       │   ├── ConfusionMatrix.js
│       │   ├── ErrorBoundary.js
│       │   ├── KeyboardShortcutsModal.js
│       │   ├── OnboardingTooltip.js
│       │   ├── PredictionHistory.js
│       │   ├── ProbabilityBar.js
│       │   ├── StatsPage.js
│       │   ├── Toast.js
│       │   └── TrainingChart.js
│       ├── hooks/
│       │   ├── useCanvas.js
│       │   ├── useKeyboardShortcuts.js
│       │   ├── useLocalStorage.js
│       │   ├── usePredict.js
│       │   └── useUndoRedo.js
│       └── utils/api.js
│
├── docker-compose.yml
├── render.yaml
├── Makefile
├── CONTRIBUTING.md
├── CHANGELOG.md
└── .github/workflows/ci.yml
```

---

## 🧠 CNN Architecture

```
Input  28 × 28 × 1
  │
  ├── Conv2D(32, 3×3) + BatchNorm + ReLU
  ├── Conv2D(32, 3×3) + BatchNorm + ReLU
  ├── MaxPool(2×2)  →  Dropout(0.25)
  │
  ├── Conv2D(64, 3×3) + BatchNorm + ReLU
  ├── Conv2D(64, 3×3) + BatchNorm + ReLU
  ├── MaxPool(2×2)  →  Dropout(0.25)
  │
  ├── Flatten  →  Dense(256) + BatchNorm + ReLU  →  Dropout(0.5)
  │
  └── Dense(10) + Softmax  →  Output
```

**Parameters:** ~1.2M  |  **Test accuracy:** ≥ 99.1%  |  **Augmentation:** rotation ±10°, zoom 10%, shift 10%

---

## 🚀 Quick Start

### One-command (Docker)

```bash
# 1. Train the model first
make train

# 2. Spin up everything
make docker-up
# → API: http://localhost:8000
# → UI:  http://localhost:3000
```

### Manual

```bash
# Step 1 — Install dependencies
make setup

# Step 2 — Train the model (TensorFlow)
make train
#   or PyTorch:
make train-pytorch

# Step 3 — Evaluate
make eval

# Step 4 — Backend (new terminal)
make backend-dev

# Step 5 — Frontend (new terminal)
make frontend
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+Z` | Undo last stroke |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save / download drawing |
| `Esc` | Clear canvas |
| `Ctrl+D` | Toggle dark / light mode |
| `1` / `2` / `3` | Brush size S / M / L |

---

## 🌐 API Reference

### `POST /predict`

```json
// Request
{ "image": "data:image/png;base64,iVBORw0KGgo..." }

// Response
{
  "predicted_digit": 7,
  "confidence": 99.82,
  "probabilities": [
    { "digit": 0, "probability": 0.01 },
    ...
    { "digit": 7, "probability": 99.82 },
    ...
  ]
}
```

### `GET /metrics`

```json
{
  "test_accuracy": 99.1,
  "test_loss": 0.028,
  "epochs_trained": 12,
  "train_accuracy_final": 99.5,
  "val_accuracy_final": 99.1
}
```

---

## ☁️ Deployment

### Backend → Render

```bash
# Option A — Blueprint (automatic)
# Push render.yaml to repo root, create Render Blueprint

# Option B — Manual
# Build:  pip install -r backend/requirements.txt
# Start:  cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
# Upload mnist_cnn.h5 via Render shell after first deploy
```

### Frontend → Vercel

```bash
cd frontend
REACT_APP_API_URL=https://your-api.onrender.com npx vercel --prod
```

### CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push:
1. `pytest` backend tests
2. React production build
3. Deploy to Render (main branch only)
4. Deploy to Vercel (main branch only)

Required secrets: `RENDER_API_KEY`, `RENDER_SERVICE_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `BACKEND_URL`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| ML (TF) | TensorFlow 2.x / Keras |
| ML (PT) | PyTorch 2.x |
| Backend | FastAPI + Uvicorn |
| Frontend | React 18 |
| Styling | Custom CSS design system |
| Fonts | Space Mono + Outfit |
| Deployment | Vercel + Render |
| CI/CD | GitHub Actions |
| Containers | Docker + Compose |

---

## 📄 License

MIT — see [LICENSE](LICENSE)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding standards, and the PR process.

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.
