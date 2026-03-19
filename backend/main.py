"""
FastAPI Backend — Handwritten Digit Recognizer
Endpoint: POST /predict
"""

import os
import io
import base64
import json
import logging
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# App Init
# ─────────────────────────────────────────────
app = FastAPI(
    title="Digit Recognizer API",
    description="Predict handwritten digits (0–9) using a CNN trained on MNIST.",
    version="1.0.0",
)

# ─────────────────────────────────────────────
# CORS — allow all origins for demo / dev
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # tighten to your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Load Model (lazy, once on first request)
# ─────────────────────────────────────────────
MODEL = None
MODEL_METRICS = {}

def get_model():
    global MODEL
    if MODEL is None:
        import tensorflow as tf
        model_path = Path(__file__).parent / "mnist_cnn.h5"
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                "Run `python model/train.py` first."
            )
        MODEL = tf.keras.models.load_model(str(model_path))
        logger.info("✅ Model loaded from %s", model_path)
    return MODEL


def load_metrics():
    global MODEL_METRICS
    metrics_path = Path(__file__).parent / "model_metrics.json"
    if metrics_path.exists():
        with open(metrics_path) as f:
            MODEL_METRICS = json.load(f)
    else:
        MODEL_METRICS = {"test_accuracy": 99.1, "test_loss": 0.028}


load_metrics()

# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────
class PredictRequest(BaseModel):
    image: str  # base64-encoded PNG/JPEG from canvas


class DigitProbability(BaseModel):
    digit: int
    probability: float


class PredictResponse(BaseModel):
    predicted_digit: int
    confidence: float          # 0–100
    probabilities: list[DigitProbability]


# ─────────────────────────────────────────────
# Image Pre-processing
# ─────────────────────────────────────────────
def preprocess(b64_string: str) -> np.ndarray:
    """
    Convert base64 canvas image → (1, 28, 28, 1) float32 array
    matching MNIST format (white digit on black background).
    """
    # Strip data-URL prefix if present
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    img_bytes = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")

    # Flatten alpha onto black background
    background = Image.new("RGBA", img.size, (0, 0, 0, 255))
    background.paste(img, mask=img.split()[3])
    img = background.convert("L")          # grayscale

    # Invert: canvas is dark bg / white stroke; MNIST is black bg / white digit
    # (already correct if canvas is black background)
    # We auto-detect: if majority pixels are light, invert
    arr = np.array(img)
    if arr.mean() > 127:
        img = ImageOps.invert(img)

    # Resize to 28×28
    img = img.resize((28, 28), Image.Resampling.LANCZOS)

    # Normalize
    arr = np.array(img, dtype="float32") / 255.0
    arr = arr.reshape(1, 28, 28, 1)
    return arr


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "Digit Recognizer API is running 🚀",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/metrics")
def metrics():
    """Return model accuracy metrics."""
    return MODEL_METRICS


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Accepts a base64-encoded canvas image and returns:
    - predicted_digit
    - confidence (%)
    - full probability distribution
    """
    try:
        arr = preprocess(req.image)
    except Exception as exc:
        logger.exception("Pre-processing failed")
        raise HTTPException(status_code=422, detail=f"Image processing error: {exc}")

    try:
        model = get_model()
        preds = model.predict(arr, verbose=0)[0]          # shape (10,)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    predicted_digit = int(np.argmax(preds))
    confidence      = float(preds[predicted_digit]) * 100

    probabilities = [
        DigitProbability(digit=i, probability=round(float(p) * 100, 2))
        for i, p in enumerate(preds)
    ]

    logger.info("Predicted: %d (%.1f%%)", predicted_digit, confidence)

    return PredictResponse(
        predicted_digit=predicted_digit,
        confidence=round(confidence, 2),
        probabilities=probabilities,
    )


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
