# Changelog

All notable changes to NeuroDraw are documented here.
This project follows [Semantic Versioning](https://semver.org/).

---

## [1.3.0] — 2026-03-19

### Added
- **Undo / Redo** — full canvas stroke history (Ctrl+Z / Ctrl+Shift+Z)
- **Keyboard shortcuts** — complete shortcut system with `?` modal
- **Onboarding tour** — 4-step first-run guide (persisted in localStorage)
- **Toast notifications** — feedback for save, undo, redo actions
- **Session history** — scrollable prediction log with thumbnails
- **Brush size control** — S / M / L stroke widths (keyboard 1 / 2 / 3)
- **Persistent settings** — dark mode + brush size saved to localStorage
- **Error boundary** — graceful fallback UI for runtime crashes
- **PyTorch training script** — full alternative to TensorFlow (`train_pytorch.py`)
- **PyTorch backend adapter** — `pytorch_adapter.py` supports both .h5 and .pt
- **Model evaluation script** — `evaluate.py` with per-class accuracy table
- **TF.js export script** — `convert_to_tfjs.py` for browser-only deployment
- **Makefile** — one-command developer ergonomics for all tasks
- **render.yaml** — Render.com blueprint for one-click backend deployment
- **GitHub Actions CI/CD** — pytest → React build → Render → Vercel pipeline
- **CONTRIBUTING.md** — coding standards, branch naming, PR checklist
- **Docker Compose** — full-stack local development with health checks

### Changed
- `useCanvas` now accepts dynamic `brushSize` and passes canvas ref to `onStrokeEnd`
- `App.js` fully refactored — all state persistence, keyboard events, accessibility
- Header gains Analytics + Shortcuts buttons
- Footer gains keyboard shortcut link

### Fixed
- Probability bars now animate correctly on every new prediction
- Canvas clear properly resets undo history

---

## [1.2.0] — 2026-03-18

### Added
- **StatsPage** — model analytics: metric cards, training curves, confusion matrix, architecture table
- **ConfusionMatrix** component — interactive 10×10 heatmap with hover tooltips
- **TrainingChart** component — SVG line chart for accuracy/loss history
- **PredictionHistory** — session log of all drawings and predictions
- **BrushSizeControl** — S/M/L brush picker
- `usePredict` hook — prediction logic and history separated from UI
- Backend `pytest` test suite (14 tests)

---

## [1.1.0] — 2026-03-17

### Added
- FastAPI backend with `/predict`, `/health`, `/metrics` endpoints
- Image pre-processing pipeline: RGBA flatten, auto-invert, 28×28 resize, normalise
- React frontend with animated probability bars and confidence ring
- Dark / light mode toggle
- Canvas download button
- Mobile touch drawing support

---

## [1.0.0] — 2026-03-16

### Added
- TensorFlow / Keras CNN trained on MNIST (≥99.1% accuracy)
- Data augmentation: rotation, zoom, shift
- Training history plots + confusion matrix saved as PNG
- `model_metrics.json` output for backend API to serve
