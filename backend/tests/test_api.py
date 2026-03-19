import sys
from unittest.mock import patch, MagicMock

sys.modules['tensorflow'] = MagicMock()
sys.modules['tensorflow.keras'] = MagicMock()
sys.modules['tensorflow.keras.models'] = MagicMock()
sys.modules['torch'] = MagicMock()
sys.modules['torchvision'] = MagicMock()

import base64
import io
import json
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from main import app, preprocess

client = TestClient(app)


def _make_b64_image(color: int = 255, size: int = 100) -> str:
    img = Image.new("L", (size, size), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _mock_predict(arr):
    probs = np.zeros((1, 10), dtype="float32")
    probs[0, 7] = 0.99
    probs[0, 1] = 0.01
    return probs


class TestHealthRoutes:
    def test_root_returns_200(self):
        res = client.get("/")
        assert res.status_code == 200
        assert "message" in res.json()

    def test_health_ok(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_metrics_endpoint(self):
        res = client.get("/metrics")
        assert res.status_code == 200
        assert isinstance(res.json(), dict)


class TestPreprocessing:
    def test_white_image_inverted(self):
        arr = preprocess(_make_b64_image(color=255))
        assert arr.shape == (1, 28, 28, 1)
        assert arr.mean() < 0.5

    def test_black_image_stays(self):
        arr = preprocess(_make_b64_image(color=10))
        assert arr.shape == (1, 28, 28, 1)
        assert arr.mean() < 0.2

    def test_data_url_prefix_stripped(self):
        arr = preprocess(_make_b64_image(color=128))
        assert arr.shape == (1, 28, 28, 1)

    def test_output_normalized(self):
        arr = preprocess(_make_b64_image(color=200))
        assert arr.max() <= 1.0
        assert arr.min() >= 0.0


class TestPredictEndpoint:
    @patch("main.get_model")
    def test_predict_valid_response(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = _mock_predict(None)
        mock_get_model.return_value = mock_model
        res = client.post("/predict", json={"image": _make_b64_image(color=10)})
        assert res.status_code == 200
        body = res.json()
        assert "predicted_digit" in body
        assert "confidence" in body
        assert "probabilities" in body
        assert len(body["probabilities"]) == 10

    @patch("main.get_model")
    def test_predicted_digit_is_int(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = _mock_predict(None)
        mock_get_model.return_value = mock_model
        body = client.post("/predict", json={"image": _make_b64_image(color=10)}).json()
        assert isinstance(body["predicted_digit"], int)
        assert 0 <= body["predicted_digit"] <= 9

    @patch("main.get_model")
    def test_confidence_in_range(self, mock_get_model):
        mock_model = MagicMock()
        mock_model.predict.return_value = _mock_predict(None)
        mock_get_model.return_value = mock_model
        body = client.post("/predict", json={"image": _make_b64_image(color=10)}).json()
        assert 0 <= body["confidence"] <= 100

    @patch("main.get_model")
    def test_probabilities_sum_to_100(self, mock_get_model):
        mock_model = MagicMock()
        probs = np.ones((1, 10), dtype="float32") * 0.1
        mock_model.predict.return_value = probs
        mock_get_model.return_value = mock_model
        body = client.post("/predict", json={"image": _make_b64_image(color=10)}).json()
        total = sum(p["probability"] for p in body["probabilities"])
        assert abs(total - 100.0) < 1.0

    def test_missing_image_field(self):
        res = client.post("/predict", json={})
        assert res.status_code == 422

    def test_invalid_base64(self):
        res = client.post("/predict", json={"image": "not_valid!!!"})
        assert res.status_code == 422

    @patch("main.get_model", side_effect=FileNotFoundError("model not found"))
    def test_model_not_found(self, _):
        res = client.post("/predict", json={"image": _make_b64_image(color=10)})
        assert res.status_code == 503