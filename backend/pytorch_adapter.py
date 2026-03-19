"""
backend/pytorch_adapter.py
──────────────────────────
Drop-in model loader that supports both TensorFlow (.h5) and
PyTorch (.pt / .torchscript.pt) saved models.

Usage in main.py:
    from pytorch_adapter import load_model, run_inference
    model = load_model("mnist_cnn.pt")
    probs = run_inference(model, preprocessed_array)  # → np.ndarray shape (10,)
"""

from pathlib import Path
import numpy as np


def load_model(path: str):
    """Auto-detect framework from file extension and return a wrapped model."""
    p = Path(path)
    if p.suffix in (".h5", ".keras"):
        return _TFModel(str(p))
    elif p.suffix in (".pt", ".pth"):
        return _PTModel(str(p))
    else:
        raise ValueError(f"Unsupported model format: {p.suffix}")


def run_inference(model, arr: np.ndarray) -> np.ndarray:
    """
    arr: shape (1, 28, 28, 1) float32 in [0,1]
    returns: shape (10,) probabilities
    """
    return model.predict(arr)


# ── TensorFlow wrapper ─────────────────────────────────────────────────────────
class _TFModel:
    def __init__(self, path: str):
        import tensorflow as tf
        self._model = tf.keras.models.load_model(path)
        print(f"✅ [TF] Loaded {path}")

    def predict(self, arr: np.ndarray) -> np.ndarray:
        return self._model.predict(arr, verbose=0)[0]


# ── PyTorch wrapper ────────────────────────────────────────────────────────────
class _PTModel:
    def __init__(self, path: str):
        import torch
        self._device = torch.device("cpu")   # backend inference always on CPU
        try:
            # Try loading as TorchScript first (production-safe)
            self._model = torch.jit.load(path, map_location=self._device)
        except Exception:
            # Fall back to loading state dict with architecture re-build
            from _pt_arch import MnistCNN
            self._model = MnistCNN()
            state = torch.load(path, map_location=self._device)
            self._model.load_state_dict(state)
        self._model.eval()
        print(f"✅ [PyTorch] Loaded {path}")

    def predict(self, arr: np.ndarray) -> np.ndarray:
        import torch
        import torch.nn.functional as F
        # arr is (1, 28, 28, 1) — convert to (1, 1, 28, 28)
        t = torch.from_numpy(arr.transpose(0, 3, 1, 2))
        with torch.no_grad():
            out  = self._model(t)               # log-softmax output
            probs = torch.exp(out).squeeze()     # → probabilities
        return probs.numpy()
