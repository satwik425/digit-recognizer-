"""
model/convert_to_tfjs.py
────────────────────────
Converts the saved Keras .h5 model to TensorFlow.js format
so it can run directly in the browser (no backend needed).

Usage:
    pip install tensorflowjs
    python convert_to_tfjs.py                     # default: mnist_cnn.h5 → tfjs_model/
    python convert_to_tfjs.py --model my.h5 --out ./public/tfjs_model

The output folder can be dropped into React's `public/` directory
and loaded with:
    const model = await tf.loadLayersModel('/tfjs_model/model.json');
"""

import argparse
from pathlib import Path

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model", default="mnist_cnn.h5")
    p.add_argument("--out",   default="tfjs_model")
    return p.parse_args()

def main():
    args = parse_args()
    model_path = Path(args.model)
    out_path   = Path(args.out)

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    try:
        import tensorflowjs as tfjs
        import tensorflow as tf
    except ImportError:
        print("❌ Install tensorflowjs: pip install tensorflowjs")
        return

    print(f"📦 Loading {model_path}…")
    model = tf.keras.models.load_model(str(model_path))
    model.summary()

    print(f"🔄 Converting to TF.js format → {out_path}/")
    out_path.mkdir(parents=True, exist_ok=True)
    tfjs.converters.save_keras_model(model, str(out_path))

    # Print sizes
    sizes = {p.name: p.stat().st_size for p in out_path.iterdir()}
    total = sum(sizes.values()) / 1024
    print(f"\n✅ TF.js model saved ({total:.1f} KB total):")
    for name, size in sorted(sizes.items()):
        print(f"   {name}: {size/1024:.1f} KB")

    print(f"\n💡 Load in React with:")
    print(f'   const model = await tf.loadLayersModel("/tfjs_model/model.json");')
    print(f'   const input = tf.tensor4d(pixels, [1, 28, 28, 1]);')
    print(f'   const probs = model.predict(input).dataSync();')

if __name__ == "__main__":
    main()
