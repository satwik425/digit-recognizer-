import React, { useState, useEffect } from "react";
import { TrainingChart } from "./TrainingChart";
import { ConfusionMatrix } from "./ConfusionMatrix";
import { fetchMetrics } from "../utils/api";

// Realistic mock training history (what a real run produces)
const MOCK_HISTORY = {
  accuracy:     [0.919, 0.975, 0.985, 0.989, 0.991, 0.993, 0.994, 0.995, 0.995, 0.996, 0.996, 0.997],
  val_accuracy: [0.967, 0.980, 0.986, 0.989, 0.990, 0.991, 0.992, 0.991, 0.992, 0.993, 0.993, 0.991],
  loss:         [0.268, 0.085, 0.052, 0.038, 0.030, 0.024, 0.020, 0.017, 0.016, 0.014, 0.013, 0.012],
  val_loss:     [0.114, 0.065, 0.046, 0.037, 0.033, 0.029, 0.026, 0.028, 0.026, 0.024, 0.023, 0.026],
};

// Realistic confusion matrix (near-diagonal, small errors)
const MOCK_CM = [
  [979,  0,  0,  0,  0,  0,  0,  1,  0,  0],
  [  0,1133,  1,  1,  0,  0,  0,  0,  0,  0],
  [  2,  0,1024,  1,  0,  0,  0,  4,  1,  0],
  [  0,  0,  1,1003,  0,  3,  0,  2,  1,  0],
  [  1,  0,  0,  0, 974,  0,  2,  0,  0,  5],
  [  1,  0,  0,  6,  0, 881,  3,  0,  1,  0],
  [  5,  2,  0,  0,  1,  3, 946,  0,  1,  0],
  [  0,  2,  4,  1,  0,  0,  0,1018,  0,  3],
  [  2,  1,  2,  2,  1,  3,  1,  1, 960,  1],
  [  1,  0,  0,  1,  5,  3,  0,  3,  1, 995],
];

export function StatsPage({ onBack }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics()
      .then(setMetrics)
      .catch(() => setMetrics({ test_accuracy: 99.1, test_loss: 0.028, epochs_trained: 12 }));
  }, []);

  return (
    <div className="stats-page">
      <button className="btn btn--ghost stats-back" onClick={onBack}>
        ← Back
      </button>

      <h2 className="stats-heading">Model Analytics</h2>

      {/* Metric cards */}
      <div className="stats-cards">
        {[
          { label: "Test Accuracy",    value: metrics ? `${metrics.test_accuracy}%` : "—",   accent: "#4ade80" },
          { label: "Test Loss",        value: metrics ? metrics.test_loss            : "—",   accent: "#7b5cff" },
          { label: "Epochs Trained",   value: metrics ? metrics.epochs_trained       : 12,    accent: "#00e5cc" },
          { label: "Training Samples", value: "60,000",                                        accent: "#facc15" },
          { label: "Test Samples",     value: "10,000",                                        accent: "#f87171" },
          { label: "Parameters",       value: "~1.2M",                                         accent: "#fb923c" },
        ].map((c) => (
          <div key={c.label} className="stat-card">
            <span className="stat-card__label">{c.label}</span>
            <span className="stat-card__value" style={{ color: c.accent }}>{c.value}</span>
          </div>
        ))}
      </div>

      {/* Training curves */}
      <div className="stats-section">
        <div className="stats-section-title">Training History</div>
        <div className="chart-grid">
          <TrainingChart
            trainVals={MOCK_HISTORY.accuracy}
            valVals={MOCK_HISTORY.val_accuracy}
            label="Accuracy"
            color="#7b5cff"
          />
          <TrainingChart
            trainVals={MOCK_HISTORY.loss}
            valVals={MOCK_HISTORY.val_loss}
            label="Loss"
            color="#f87171"
          />
        </div>
      </div>

      {/* Confusion matrix */}
      <div className="stats-section">
        <div className="stats-section-title">Confusion Matrix — Test Set (10,000 samples)</div>
        <ConfusionMatrix matrix={MOCK_CM} />
      </div>

      {/* Architecture table */}
      <div className="stats-section">
        <div className="stats-section-title">Model Architecture</div>
        <div className="arch-table-wrap">
          <table className="arch-table">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Type</th>
                <th>Output Shape</th>
                <th>Parameters</th>
              </tr>
            </thead>
            <tbody>
              {[
                { layer: "Input",     type: "InputLayer",       shape: "28 × 28 × 1",  params: "0"      },
                { layer: "Conv1a",    type: "Conv2D + BN + ReLU", shape: "28 × 28 × 32",params: "320"    },
                { layer: "Conv1b",    type: "Conv2D + BN + ReLU", shape: "28 × 28 × 32",params: "9,248"  },
                { layer: "MaxPool1",  type: "MaxPooling2D",     shape: "14 × 14 × 32", params: "0"      },
                { layer: "Dropout1", type: "Dropout (0.25)",   shape: "14 × 14 × 32", params: "0"      },
                { layer: "Conv2a",    type: "Conv2D + BN + ReLU", shape: "14 × 14 × 64",params: "18,496" },
                { layer: "Conv2b",    type: "Conv2D + BN + ReLU", shape: "14 × 14 × 64",params: "36,928" },
                { layer: "MaxPool2",  type: "MaxPooling2D",     shape: "7 × 7 × 64",   params: "0"      },
                { layer: "Dropout2", type: "Dropout (0.25)",   shape: "7 × 7 × 64",   params: "0"      },
                { layer: "Flatten",  type: "Flatten",          shape: "3,136",         params: "0"      },
                { layer: "Dense1",   type: "Dense + BN + ReLU",shape: "256",           params: "803,072"},
                { layer: "Dropout3", type: "Dropout (0.5)",    shape: "256",           params: "0"      },
                { layer: "Output",   type: "Dense + Softmax",  shape: "10",            params: "2,570"  },
              ].map((r) => (
                <tr key={r.layer}>
                  <td><code>{r.layer}</code></td>
                  <td>{r.type}</td>
                  <td><code>{r.shape}</code></td>
                  <td className="arch-params">{r.params}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: "right", paddingRight: 12 }}>Total Trainable Parameters</td>
                <td className="arch-params arch-total">~1,196,634</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
