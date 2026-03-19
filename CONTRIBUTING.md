# Contributing to NeuroDraw

Thank you for your interest in contributing! This document covers how to set up a dev environment, coding standards, and the PR process.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Making Changes](#making-changes)
4. [Code Standards](#code-standards)
5. [Submitting a PR](#submitting-a-pr)
6. [Reporting Issues](#reporting-issues)

---

## Development Setup

### Prerequisites

| Tool       | Version    |
|------------|------------|
| Python     | ≥ 3.10     |
| Node.js    | ≥ 18       |
| npm        | ≥ 9        |
| Docker     | ≥ 24 (optional) |

### Quickstart

```bash
# 1. Clone
git clone https://github.com/your-user/digit-recognizer.git
cd digit-recognizer

# 2. Install everything
make setup

# 3. Train the model (one-time, takes ~5 min on CPU)
make train

# 4. Start backend + frontend in separate terminals
make backend-dev
make frontend
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
digit-recognizer/
├── model/
│   ├── train.py              # TensorFlow CNN training
│   ├── train_pytorch.py      # PyTorch CNN training
│   ├── evaluate.py           # Evaluation + confusion matrix
│   └── convert_to_tfjs.py    # Export to browser-runnable TF.js
│
├── backend/
│   ├── main.py               # FastAPI app
│   ├── pytorch_adapter.py    # Framework-agnostic model loader
│   └── tests/test_api.py     # pytest suite
│
├── frontend/
│   └── src/
│       ├── App.js            # Root component
│       ├── components/       # UI components
│       ├── hooks/            # Custom React hooks
│       └── utils/api.js      # Backend API calls
│
├── docker-compose.yml
├── render.yaml
├── Makefile
└── .github/workflows/ci.yml
```

---

## Making Changes

### Branch naming

| Type       | Pattern                |
|------------|------------------------|
| Feature    | `feat/short-description` |
| Bug fix    | `fix/short-description`  |
| Refactor   | `refactor/...`           |
| Docs       | `docs/...`               |

### Commit messages (Conventional Commits)

```
feat: add eraser tool to canvas
fix: prevent prediction on empty canvas
docs: add deployment section to README
refactor: extract ConfidenceRing to own component
test: add test for auto-invert preprocessing
```

---

## Code Standards

### Python

- **Formatter**: [Black](https://black.readthedocs.io) — `make format`
- **Linter**: [Ruff](https://docs.astral.sh/ruff/) — `make lint`
- Type hints on all public functions
- Docstrings on all modules and public functions (Google style)

```python
def preprocess(b64_string: str) -> np.ndarray:
    """
    Convert base64 canvas PNG to (1, 28, 28, 1) float32 MNIST-format array.

    Args:
        b64_string: Data URL or raw base64 string from canvas.toDataURL().

    Returns:
        NumPy array of shape (1, 28, 28, 1) with values in [0, 1].
    """
```

### React / JavaScript

- Functional components only, hooks for all state
- `useCallback` for event handlers passed as props
- Prop-types or JSDoc comments on all components
- No inline CSS — all styles in `App.css` with BEM-style classes

```js
/**
 * ProbabilityBar — single digit probability row.
 * @param {number} digit       0–9
 * @param {number} probability 0–100
 * @param {boolean} isTop      true for the highest-probability digit
 */
export function ProbabilityBar({ digit, probability, isTop }) { ... }
```

---

## Running Tests

```bash
# Backend
make backend-test

# Frontend (React Testing Library)
cd frontend && npm test
```

All tests must pass before opening a PR. CI will block merge on failures.

---

## Submitting a PR

1. Fork → branch → commit → push
2. Open a Pull Request against `main`
3. Fill in the PR template (description, screenshots for UI changes, test evidence)
4. Address review comments
5. Squash & merge after approval

### PR checklist

- [ ] `make lint` passes
- [ ] `make backend-test` passes
- [ ] New components have CSS in `App.css`
- [ ] New hooks have JSDoc comments
- [ ] README updated if user-facing behaviour changed

---

## Reporting Issues

Open a GitHub Issue and include:

- **Environment**: OS, Python version, Node version, browser
- **Steps to reproduce**
- **Expected vs. actual behaviour**
- **Console errors** (screenshot or paste)
- For model issues: the digit you drew and the prediction received

---

Thank you for helping make NeuroDraw better! 🎉
