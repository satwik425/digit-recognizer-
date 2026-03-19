"""
model/train_pytorch.py
──────────────────────
Trains a CNN on MNIST using PyTorch.  Saves model as mnist_cnn.pt
and exports a TorchScript version for deployment.

Usage:
    pip install torch torchvision matplotlib scikit-learn seaborn
    python train_pytorch.py
    python train_pytorch.py --epochs 20 --batch-size 128 --lr 1e-3
"""

import argparse
import json
import time
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from sklearn.metrics import confusion_matrix
import seaborn as sns


# ─── CLI ──────────────────────────────────────────────────────────────────────
def get_args():
    p = argparse.ArgumentParser()
    p.add_argument("--epochs",      type=int,   default=20)
    p.add_argument("--batch-size",  type=int,   default=128)
    p.add_argument("--lr",          type=float, default=1e-3)
    p.add_argument("--output",      default="mnist_cnn.pt")
    p.add_argument("--device",      default=None,
                   help="cpu | cuda | mps (auto-detect if omitted)")
    return p.parse_args()


# ─── Device selection ──────────────────────────────────────────────────────────
def best_device(preference=None):
    if preference:
        return torch.device(preference)
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


# ─── Model ────────────────────────────────────────────────────────────────────
class MnistCNN(nn.Module):
    """
    Architecture mirrors the TensorFlow version:
      Conv32 → BN → Conv32 → BN → MaxPool → Dropout
      Conv64 → BN → Conv64 → BN → MaxPool → Dropout
      FC256  → BN → Dropout → FC10 → LogSoftmax
    """
    def __init__(self):
        super().__init__()
        self.block1 = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
            nn.Conv2d(32, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
            nn.MaxPool2d(2), nn.Dropout2d(0.25),
        )
        self.block2 = nn.Sequential(
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.Conv2d(64, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(),
            nn.MaxPool2d(2), nn.Dropout2d(0.25),
        )
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 7 * 7, 256), nn.BatchNorm1d(256), nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 10),
            nn.LogSoftmax(dim=1),
        )

    def forward(self, x):
        x = self.block1(x)
        x = self.block2(x)
        return self.head(x)


# ─── Data ─────────────────────────────────────────────────────────────────────
def get_loaders(batch_size: int):
    train_tf = transforms.Compose([
        transforms.RandomRotation(10),
        transforms.RandomAffine(0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)),
    ])
    test_tf = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)),
    ])
    train_ds = datasets.MNIST("./data", train=True,  download=True, transform=train_tf)
    test_ds  = datasets.MNIST("./data", train=False, download=True, transform=test_tf)
    train_dl = DataLoader(train_ds, batch_size=batch_size, shuffle=True,  num_workers=2, pin_memory=True)
    test_dl  = DataLoader(test_ds,  batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    return train_dl, test_dl


# ─── Training loop ────────────────────────────────────────────────────────────
def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss = correct = 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        out  = model(x)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * x.size(0)
        correct    += (out.argmax(1) == y).sum().item()
    n = len(loader.dataset)
    return total_loss / n, correct / n


@torch.no_grad()
def eval_epoch(model, loader, criterion, device):
    model.eval()
    total_loss = correct = 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        out  = model(x)
        loss = criterion(out, y)
        total_loss += loss.item() * x.size(0)
        correct    += (out.argmax(1) == y).sum().item()
    n = len(loader.dataset)
    return total_loss / n, correct / n


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    args   = get_args()
    device = best_device(args.device)
    print(f"🖥  Device: {device}")

    train_dl, test_dl = get_loaders(args.batch_size)

    model     = MnistCNN().to(device)
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, factor=0.5, patience=3, verbose=True)
    criterion = nn.NLLLoss()

    print(f"🏗  Parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    best_acc = 0.0
    patience_counter = 0
    PATIENCE = 5

    print(f"\n🚀 Training for up to {args.epochs} epochs …\n")
    for epoch in range(1, args.epochs + 1):
        t0 = time.time()
        tl, ta = train_epoch(model, train_dl, optimizer, criterion, device)
        vl, va = eval_epoch(model, test_dl,  criterion, device)
        scheduler.step(vl)

        history["train_loss"].append(tl)
        history["train_acc"].append(ta)
        history["val_loss"].append(vl)
        history["val_acc"].append(va)

        flag = " ★" if va > best_acc else ""
        print(f"Epoch {epoch:02d}/{args.epochs}  "
              f"train_loss={tl:.4f}  train_acc={ta*100:.2f}%  "
              f"val_loss={vl:.4f}  val_acc={va*100:.2f}%  "
              f"({time.time()-t0:.1f}s){flag}")

        if va > best_acc:
            best_acc = va
            patience_counter = 0
            torch.save(model.state_dict(), args.output)
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(f"\n⏹  Early stopping at epoch {epoch}")
                break

    # ── Reload best weights ──────────────────────────────────────
    model.load_state_dict(torch.load(args.output, map_location=device))

    # ── Final eval ───────────────────────────────────────────────
    _, final_acc = eval_epoch(model, test_dl, criterion, device)
    print(f"\n✅ Best test accuracy: {final_acc * 100:.2f}%")

    # ── Save TorchScript ─────────────────────────────────────────
    model.eval()
    scripted = torch.jit.script(model)
    ts_path  = Path(args.output).with_suffix(".torchscript.pt")
    scripted.save(str(ts_path))
    print(f"📦 TorchScript saved → {ts_path}")

    # ── Save metrics ─────────────────────────────────────────────
    metrics = {
        "test_accuracy":        round(final_acc * 100, 2),
        "epochs_trained":       len(history["train_acc"]),
        "train_accuracy_final": round(history["train_acc"][-1] * 100, 2),
        "val_accuracy_final":   round(history["val_acc"][-1] * 100, 2),
        "framework":            "pytorch",
    }
    with open("model_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # ── Training plot ─────────────────────────────────────────────
    ep = range(1, len(history["train_acc"]) + 1)
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("MNIST CNN Training History (PyTorch)", fontsize=14, fontweight="bold")

    axes[0].plot(ep, [a*100 for a in history["train_acc"]], "b-o", label="Train")
    axes[0].plot(ep, [a*100 for a in history["val_acc"]],   "r-o", label="Val")
    axes[0].set(title="Accuracy (%)", xlabel="Epoch", ylabel="Accuracy")
    axes[0].legend(); axes[0].grid(alpha=0.3)

    axes[1].plot(ep, history["train_loss"], "b-o", label="Train")
    axes[1].plot(ep, history["val_loss"],   "r-o", label="Val")
    axes[1].set(title="Loss", xlabel="Epoch", ylabel="Loss")
    axes[1].legend(); axes[1].grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig("training_history_pytorch.png", dpi=150)
    print("📈 Training plot → training_history_pytorch.png")

    # ── Confusion matrix ─────────────────────────────────────────
    all_true, all_pred = [], []
    model.eval()
    with torch.no_grad():
        for x, y in test_dl:
            x = x.to(device)
            out = model(x)
            all_true.extend(y.numpy())
            all_pred.extend(out.argmax(1).cpu().numpy())

    cm = confusion_matrix(all_true, all_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=range(10), yticklabels=range(10))
    plt.title("Confusion Matrix — PyTorch CNN", fontweight="bold")
    plt.xlabel("Predicted"); plt.ylabel("True")
    plt.tight_layout()
    plt.savefig("confusion_matrix_pytorch.png", dpi=150)
    print("🔢 Confusion matrix → confusion_matrix_pytorch.png")

    print(f"\n🎉 Done!  Model: {args.output}  (accuracy: {final_acc*100:.2f}%)")


if __name__ == "__main__":
    main()
