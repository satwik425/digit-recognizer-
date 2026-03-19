"""
MNIST CNN Training Script
Trains a Convolutional Neural Network on MNIST dataset.
Target accuracy: ≥98%
"""

import os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import json

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
EPOCHS      = 20
BATCH_SIZE  = 128
MODEL_PATH  = "mnist_cnn.h5"
PLOT_PATH   = "training_history.png"
METRICS_PATH = "model_metrics.json"

# ─────────────────────────────────────────────
# 1. Load & Preprocess Data
# ─────────────────────────────────────────────
print("📦 Loading MNIST dataset...")
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()

# Normalize to [0, 1] and add channel dim → (N, 28, 28, 1)
x_train = x_train.astype("float32") / 255.0
x_test  = x_test.astype("float32")  / 255.0
x_train = np.expand_dims(x_train, -1)
x_test  = np.expand_dims(x_test,  -1)

# One-hot encode labels
y_train_cat = keras.utils.to_categorical(y_train, 10)
y_test_cat  = keras.utils.to_categorical(y_test,  10)

print(f"  Train: {x_train.shape}  |  Test: {x_test.shape}")

# ─────────────────────────────────────────────
# 2. Data Augmentation
# ─────────────────────────────────────────────
datagen = keras.preprocessing.image.ImageDataGenerator(
    rotation_range=10,
    zoom_range=0.1,
    width_shift_range=0.1,
    height_shift_range=0.1,
)
datagen.fit(x_train)

# ─────────────────────────────────────────────
# 3. Build CNN Model
# ─────────────────────────────────────────────
def build_model():
    model = keras.Sequential([
        # Input
        layers.Input(shape=(28, 28, 1)),

        # Block 1
        layers.Conv2D(32, (3, 3), activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation="relu", padding="same"),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),

        # Block 2
        layers.Conv2D(64, (3, 3), activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation="relu", padding="same"),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),

        # Classifier Head
        layers.Flatten(),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(10, activation="softmax"),
    ], name="mnist_cnn")

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model

model = build_model()
model.summary()

# ─────────────────────────────────────────────
# 4. Callbacks
# ─────────────────────────────────────────────
callbacks = [
    EarlyStopping(patience=5, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(factor=0.5, patience=3, min_lr=1e-6, verbose=1),
    ModelCheckpoint(MODEL_PATH, save_best_only=True, verbose=1),
]

# ─────────────────────────────────────────────
# 5. Train
# ─────────────────────────────────────────────
print("\n🚀 Starting training...")
history = model.fit(
    datagen.flow(x_train, y_train_cat, batch_size=BATCH_SIZE),
    epochs=EPOCHS,
    validation_data=(x_test, y_test_cat),
    callbacks=callbacks,
    verbose=1,
)

# ─────────────────────────────────────────────
# 6. Evaluate
# ─────────────────────────────────────────────
print("\n📊 Evaluating on test set...")
loss, accuracy = model.evaluate(x_test, y_test_cat, verbose=0)
print(f"  Test Loss:     {loss:.4f}")
print(f"  Test Accuracy: {accuracy * 100:.2f}%")

# ─────────────────────────────────────────────
# 7. Save Metrics
# ─────────────────────────────────────────────
metrics = {
    "test_accuracy": round(float(accuracy) * 100, 2),
    "test_loss":     round(float(loss), 4),
    "epochs_trained": len(history.history["accuracy"]),
    "train_accuracy_final": round(float(history.history["accuracy"][-1]) * 100, 2),
    "val_accuracy_final":   round(float(history.history["val_accuracy"][-1]) * 100, 2),
}
with open(METRICS_PATH, "w") as f:
    json.dump(metrics, f, indent=2)
print(f"\n✅ Metrics saved → {METRICS_PATH}")

# ─────────────────────────────────────────────
# 8. Plot Training History
# ─────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
fig.suptitle("MNIST CNN Training History", fontsize=14, fontweight="bold")

ep = range(1, len(history.history["accuracy"]) + 1)

# Accuracy
axes[0].plot(ep, history.history["accuracy"],     "b-o", label="Train Accuracy", linewidth=2)
axes[0].plot(ep, history.history["val_accuracy"], "r-o", label="Val Accuracy",   linewidth=2)
axes[0].set_title("Accuracy")
axes[0].set_xlabel("Epoch")
axes[0].set_ylabel("Accuracy")
axes[0].legend()
axes[0].grid(alpha=0.3)
axes[0].set_ylim([0.95, 1.0])

# Loss
axes[1].plot(ep, history.history["loss"],     "b-o", label="Train Loss", linewidth=2)
axes[1].plot(ep, history.history["val_loss"], "r-o", label="Val Loss",   linewidth=2)
axes[1].set_title("Loss")
axes[1].set_xlabel("Epoch")
axes[1].set_ylabel("Loss")
axes[1].legend()
axes[1].grid(alpha=0.3)

plt.tight_layout()
plt.savefig(PLOT_PATH, dpi=150, bbox_inches="tight")
print(f"📈 Training plot saved → {PLOT_PATH}")

# ─────────────────────────────────────────────
# 9. Confusion Matrix
# ─────────────────────────────────────────────
from sklearn.metrics import confusion_matrix
import seaborn as sns

y_pred = np.argmax(model.predict(x_test, verbose=0), axis=1)
cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=range(10), yticklabels=range(10))
plt.title("Confusion Matrix — MNIST CNN", fontsize=14, fontweight="bold")
plt.xlabel("Predicted Label")
plt.ylabel("True Label")
plt.tight_layout()
plt.savefig("confusion_matrix.png", dpi=150, bbox_inches="tight")
print("🔢 Confusion matrix saved → confusion_matrix.png")

print(f"\n🎉 Model saved → {MODEL_PATH}  (accuracy: {accuracy*100:.2f}%)")
