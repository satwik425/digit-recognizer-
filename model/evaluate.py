"""
model/evaluate.py
─────────────────
Quick evaluation script for a saved mnist_cnn.h5 model.
Usage:
    python evaluate.py                  # uses mnist_cnn.h5 in same dir
    python evaluate.py --model my.h5    # specify path
    python evaluate.py --samples 1000   # limit test samples

Outputs:
  • Accuracy + Loss
  • Per-class accuracy
  • Worst-performing digits
  • Confusion matrix (printed + saved as PNG)
  • 10 sample predictions with images
"""

import argparse
import json
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import tensorflow as tf
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    accuracy_score,
)
import seaborn as sns


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model",   default="mnist_cnn.h5", help="Path to .h5 model")
    p.add_argument("--samples", type=int, default=10000, help="Test samples to use")
    return p.parse_args()


def load_test_data(n_samples: int):
    (_, _), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
    x_test = x_test[:n_samples].astype("float32") / 255.0
    x_test = np.expand_dims(x_test, -1)
    y_test = y_test[:n_samples]
    return x_test, y_test


def main():
    args = parse_args()
    model_path = Path(args.model)
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    print(f"🔍 Loading model: {model_path}")
    model = tf.keras.models.load_model(str(model_path))

    print(f"📦 Loading {args.samples} test samples…")
    x_test, y_test = load_test_data(args.samples)

    # ── Predict ────────────────────────────────────────────────
    y_pred_probs = model.predict(x_test, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)

    # ── Overall metrics ────────────────────────────────────────
    acc = accuracy_score(y_test, y_pred)
    print(f"\n📊 Overall Accuracy: {acc * 100:.2f}%")

    # ── Per-class accuracy ─────────────────────────────────────
    print("\n📋 Per-class accuracy:")
    for digit in range(10):
        mask  = y_test == digit
        d_acc = accuracy_score(y_test[mask], y_pred[mask])
        bar   = "█" * int(d_acc * 30)
        print(f"  {digit}: {bar:<30} {d_acc * 100:.1f}%")

    # ── Classification report ──────────────────────────────────
    print("\n📄 Classification Report:")
    print(classification_report(y_test, y_pred,
                                 target_names=[str(i) for i in range(10)]))

    # ── Confusion matrix ───────────────────────────────────────
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=range(10), yticklabels=range(10))
    plt.title(f"Confusion Matrix — {model_path.name} (acc={acc*100:.2f}%)", fontweight="bold")
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.tight_layout()
    plt.savefig("confusion_matrix_eval.png", dpi=150)
    print("\n✅ Confusion matrix → confusion_matrix_eval.png")

    # ── Sample predictions ─────────────────────────────────────
    fig, axes = plt.subplots(2, 5, figsize=(12, 5))
    fig.suptitle("Sample Predictions", fontsize=14, fontweight="bold")
    indices = np.random.choice(len(x_test), 10, replace=False)
    for ax, idx in zip(axes.flat, indices):
        ax.imshow(x_test[idx].squeeze(), cmap="gray")
        true_label = y_test[idx]
        pred_label = y_pred[idx]
        conf       = y_pred_probs[idx][pred_label] * 100
        color      = "green" if true_label == pred_label else "red"
        ax.set_title(f"T:{true_label} P:{pred_label} {conf:.0f}%",
                     color=color, fontsize=9)
        ax.axis("off")
    plt.tight_layout()
    plt.savefig("sample_predictions.png", dpi=150)
    print("🖼  Sample predictions → sample_predictions.png")

    # ── Save summary JSON ──────────────────────────────────────
    summary = {
        "model":          str(model_path),
        "test_samples":   int(args.samples),
        "test_accuracy":  round(float(acc) * 100, 2),
        "per_class":      {str(d): round(float(accuracy_score(
                              y_test[y_test==d], y_pred[y_test==d])) * 100, 2)
                           for d in range(10)},
    }
    with open("eval_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
    print("💾 Summary → eval_summary.json")


if __name__ == "__main__":
    main()
