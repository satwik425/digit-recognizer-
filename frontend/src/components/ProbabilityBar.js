import React from "react";

/**
 * Animated probability bar for a single digit.
 */
export function ProbabilityBar({ digit, probability, isTop }) {
  return (
    <div className={`prob-row ${isTop ? "prob-row--top" : ""}`}>
      <span className="prob-label">{digit}</span>
      <div className="prob-track">
        <div
          className="prob-fill"
          style={{ width: `${probability}%` }}
        />
      </div>
      <span className="prob-value">{probability.toFixed(1)}%</span>
    </div>
  );
}
