import React from "react";

/**
 * PredictionHistory — shows a scrollable log of past predictions
 * in the current session.
 *
 * `history` is an array of { id, digit, confidence, thumbnail, timestamp }
 */
export function PredictionHistory({ history = [], onClearHistory }) {
  if (!history.length) return null;

  return (
    <div className="history-panel">
      <div className="history-header">
        <span className="history-title">Session History</span>
        <button className="history-clear" onClick={onClearHistory}>Clear</button>
      </div>
      <div className="history-scroll">
        {[...history].reverse().map((item) => (
          <div key={item.id} className="history-item">
            {/* Thumbnail */}
            <div className="history-thumb">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={`drawn ${item.digit}`} />
              ) : (
                <span className="history-thumb__placeholder">?</span>
              )}
            </div>

            {/* Info */}
            <div className="history-info">
              <span className="history-digit">{item.digit}</span>
              <span
                className="history-conf"
                style={{ color: confColor(item.confidence) }}
              >
                {item.confidence.toFixed(1)}%
              </span>
            </div>

            {/* Time */}
            <span className="history-time">{formatTime(item.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function confColor(pct) {
  if (pct >= 90) return "#4ade80";
  if (pct >= 70) return "#facc15";
  return "#f87171";
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
