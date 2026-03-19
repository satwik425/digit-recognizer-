# ═══════════════════════════════════════════════════════════════
#  NeuroDraw — Handwritten Digit Recognizer  |  Makefile
#  Usage: make <target>
# ═══════════════════════════════════════════════════════════════

.PHONY: help train train-pytorch eval convert-tfjs \
        backend backend-dev backend-test \
        frontend frontend-build \
        docker-up docker-down \
        clean lint format

# ── Default ──────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  NeuroDraw — available targets"
	@echo "  ─────────────────────────────────────────────────"
	@echo "  train           Train CNN with TensorFlow (→ mnist_cnn.h5)"
	@echo "  train-pytorch   Train CNN with PyTorch    (→ mnist_cnn.pt)"
	@echo "  eval            Evaluate saved model (per-class accuracy + CM)"
	@echo "  convert-tfjs    Export model for browser (TF.js format)"
	@echo "  backend         Start FastAPI server (port 8000)"
	@echo "  backend-dev     Start FastAPI with hot-reload"
	@echo "  backend-test    Run pytest test suite"
	@echo "  frontend        Start React dev server (port 3000)"
	@echo "  frontend-build  Production build → frontend/build/"
	@echo "  docker-up       Start full stack with Docker Compose"
	@echo "  docker-down     Stop Docker Compose services"
	@echo "  clean           Remove build artifacts and caches"
	@echo "  lint            Ruff lint (Python) + ESLint (React)"
	@echo "  format          Black (Python) + Prettier (React)"
	@echo ""

# ── Model ─────────────────────────────────────────────────────────
train:
	@echo "🧠 Training TensorFlow CNN…"
	cd model && pip install -q -r requirements.txt && python train.py

train-pytorch:
	@echo "🧠 Training PyTorch CNN…"
	cd model && pip install -q torch torchvision matplotlib scikit-learn seaborn && \
	python train_pytorch.py

eval:
	@echo "📊 Evaluating model…"
	cd model && python evaluate.py

convert-tfjs:
	@echo "🔄 Converting to TF.js…"
	cd model && pip install -q tensorflowjs && python convert_to_tfjs.py \
	  --out ../frontend/public/tfjs_model

# ── Backend ───────────────────────────────────────────────────────
backend:
	@echo "🚀 Starting FastAPI (production)…"
	cd backend && uvicorn main:app --host 0.0.0.0 --port 8000

backend-dev:
	@echo "🔁 Starting FastAPI (hot-reload)…"
	cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

backend-test:
	@echo "🧪 Running backend tests…"
	cd backend && pip install -q pytest httpx && pytest tests/ -v --tb=short

backend-install:
	cd backend && pip install -r requirements.txt

# ── Frontend ──────────────────────────────────────────────────────
frontend:
	@echo "⚛  Starting React dev server…"
	cd frontend && npm start

frontend-build:
	@echo "📦 Building React for production…"
	cd frontend && npm run build

frontend-install:
	cd frontend && npm install

# ── Docker ────────────────────────────────────────────────────────
docker-up:
	@echo "🐳 Starting Docker Compose stack…"
	docker compose up --build

docker-down:
	@echo "🛑 Stopping Docker Compose stack…"
	docker compose down

docker-logs:
	docker compose logs -f

# ── Setup (first time) ────────────────────────────────────────────
setup: backend-install frontend-install
	@echo "✅ Dependencies installed. Run 'make train' next."

# ── Code quality ──────────────────────────────────────────────────
lint:
	@echo "🔍 Linting Python…"
	cd backend && pip install -q ruff && ruff check .
	cd model   && ruff check .
	@echo "🔍 Linting React…"
	cd frontend && npm run lint --if-present

format:
	@echo "🎨 Formatting Python (black)…"
	pip install -q black && black backend/ model/
	@echo "🎨 Formatting React (prettier)…"
	cd frontend && npx prettier --write src/

# ── Clean ─────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/build frontend/node_modules/.cache
	@echo "🧹 Clean complete"
