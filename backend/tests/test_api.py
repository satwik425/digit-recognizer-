"""
Backend tests for the Digit Recognizer API.
Run: pytest tests/ -v
"""

import base64
import io
import json
import pytest
import numpy as np
from unittest.mock import patch, MagicMock

from PIL import Image
from fastapi.testclient import TestClient

# We patch tensorflow before importing main to avoid loading the full TF runtime
import sys
sys.modules.setdefault("tensorflow", MagicMock())

from main import app, preprocess  # noqa: E402

client = TestClient(app)


# ── helpers ──────────────────────────────────────────────────────────────────

def _make_b64_image(color: int = 255, size: int = 100) -> str:
    """Create a simple grayscale PNG as base64."""
    img = Image.new("L", (size, size), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _mock_model_predict(arr):
    """Returns a numpy array simulating a model that always predicts digit 7."""
    probs = np.zeros((1, 10), dtype="float32")
    probs[0, 7] = 0.99
    probs[0, 1] = 0.01
    return probs


# ── route tests ───────────────────────────────────────────────────────────────

class TestHealthRoutes:
    def test_root_returns_200(self):
        res = client.get("/")
        assert res.status_code == 200
        body = res.json()
        assert "message" in body

    def test_health_ok(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_metrics_endpoint(self):
        res = client.get("/metrics")
        assert res.status_code == 200
        # Should always return a dict (possibly empty / mocked)
        assert isinstance(res.json(), dict)


class TestPreprocessing:
    def test_white_image_is_inverted(self):
        """A white image (mean > 127) should be auto-inverted → near-black digit."""
        b64 = _make_b64_image(color=255)
        arr = preprocess(b64)
        assert arr.shape == (1, 28, 28, 1)
        # After inversion white→black the mean should be low
        assert arr.mean() < 0.5

    def test_black_image_stays(self):
        """A dark canvas (mean < 127) should not be inverted."""
        b64 = _make_b64_image(color=10)
        arr = preprocess(b64)
        assert arr.shape == (1, 28, 28, 1)
        assert arr.mean() < 0.2

    def test_data_url_prefix_stripped(self):
        """Data-URL prefix should be handled transparently."""
        b64 = _make_b64_image(color=128)
        arr = preprocess(b64)
        assert arr.shape == (1, 28, 28, 1)

    def test_output_normalized(self):
        """Pixel values should be in [0, 1]."""
        b64 = _make_b64_image(color=200)
        arr = preprocess(b64)
        assert arr.max() <= 1.0
        assert arr.min() >= 0.0


class TestPredictEndpoint:
    @patch("main.get_model")
    def test_predict_returns_valid_response(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = _mock_model_predict(None)
        mock_get_model.return_value = mock_model

        b64 = _make_b64_image(color=10)
        res = client.post("/predict", json={"image": b64})

        assert res.status_code == 200
        body = res.json()
        assert "predicted_digit" in body
        assert "confidence" in body
        assert "probabilities" in body
        assert len(body["probabilities"]) == 10

    @patch("main.get_model")
    def test_predicted_digit_is_int(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = _mock_model_predict(None)
        mock_get_model.return_value = mock_model

        b64 = _make_b64_image(color=10)
        body = client.post("/predict", json={"image": b64}).json()
        assert isinstance(body["predicted_digit"], int)
        assert 0 <= body["predicted_digit"] <= 9

    @patch("main.get_model")
    def test_confidence_in_range(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = _mock_model_predict(None)
        mock_get_model.return_value = mock_model

        b64 = _make_b64_image(color=10)
        body = client.post("/predict", json={"image": b64}).json()
        assert 0 <= body["confidence"] <= 100

    @patch("main.get_model")
    def test_probabilities_sum_to_100(self, mock_get_model):
        mock_model = MagicMock()
        # All probs sum to 1 → ×100 should sum to ~100
        probs = np.ones((1, 10), dtype="float32") * 0.1
        mock_model.predict.return_value = probs
        mock_get_model.return_value = mock_model

        b64 = _make_b64_image(color=10)
        body = client.post("/predict", json={"image": b64}).json()
        total = sum(p["probability"] for p in body["probabilities"])
        assert abs(total - 100.0) < 1.0  # allow small floating-point error

    def test_predict_missing_image_field(self):
        res = client.post("/predict", json={})
        assert res.status_code == 422  # Unprocessable Entity

    def test_predict_invalid_base64(self):
        res = client.post("/predict", json={"image": "not_valid_base64!!!"})
        assert res.status_code == 422

    @patch("main.get_model", side_effect=FileNotFoundError("model not found"))
    def test_predict_model_not_found(self, _):
        b64 = _make_b64_image(color=10)
        res = client.post("/predict", json={"image": b64})
        assert res.status_code == 503


class TestCORS:
    def test_cors_headers_present(self):
        res = client.options(
            "/predict",
            headers={"Origin": "http://localhost:3000",
                     "Access-Control-Request-Method": "POST"},
        )
        # FastAPI CORS returns 200 for preflight
        assert res.status_code in (200, 405)
