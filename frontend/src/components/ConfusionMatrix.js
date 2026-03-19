import React, { useState } from "react";

/**
 * ConfusionMatrix — renders an interactive 10×10 heatmap.
 * `matrix` is a 2D array [true][pred], values 0–N.
 */
export function ConfusionMatrix({ matrix }) {
  const [hovered, setHovered] = useState(null); // { row, col }

  if (!matrix || matrix.length === 0) return null;

  // Find max for colour scaling (excluding diagonal for better contrast)
  const flat = matrix.flat();
  const maxVal = Math.max(...flat);

  const cellColor = (val, row, col) => {
    const isDiag = row === col;
    const intensity = maxVal > 0 ? val / maxVal : 0;
    if (isDiag) {
      // Green diagonal (correct predictions)
      const g = Math.round(80 + intensity * 100);
      return `rgba(74, ${g + 90}, 120, ${0.15 + intensity * 0.7})`;
    }
    // Red off-diagonal (errors)
    const r = Math.round(120 + intensity * 135);
    return val > 0
      ? `rgba(${r}, 60, 80, ${0.1 + intensity * 0.8})`
      : "transparent";
  };

  const isHovered = (r, c) => hovered && hovered.row === r && hovered.col === c;

  return (
    <div className="cm-wrap">
      <div className="cm-y-label">True Label</div>
      <div className="cm-inner">
        <div className="cm-grid">
          {/* Corner spacer */}
          <div className="cm-corner" />

          {/* Column headers */}
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="cm-header">{i}</div>
          ))}

          {/* Rows */}
          {matrix.map((row, ri) => (
            <React.Fragment key={ri}>
              {/* Row header */}
              <div className="cm-header cm-row-header">{ri}</div>

              {/* Cells */}
              {row.map((val, ci) => (
                <div
                  key={ci}
                  className={`cm-cell ${ri === ci ? "cm-cell--diag" : ""} ${
                    isHovered(ri, ci) ? "cm-cell--hovered" : ""
                  }`}
                  style={{ background: cellColor(val, ri, ci) }}
                  onMouseEnter={() => setHovered({ row: ri, col: ci })}
                  onMouseLeave={() => setHovered(null)}
                  title={`True: ${ri} → Predicted: ${ci} | Count: ${val}`}
                >
                  <span className="cm-val">{val > 0 ? val : ""}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="cm-x-label">Predicted Label</div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="cm-tooltip">
          True: <strong>{hovered.row}</strong> → Predicted:{" "}
          <strong>{hovered.col}</strong> &nbsp;|&nbsp; Count:{" "}
          <strong>{matrix[hovered.row][hovered.col]}</strong>
          {hovered.row === hovered.col ? " ✓ correct" : " ✗ error"}
        </div>
      )}

      {/* Legend */}
      <div className="cm-legend">
        <span className="cm-legend__item cm-legend__item--correct">Correct</span>
        <span className="cm-legend__item cm-legend__item--error">Error</span>
      </div>
    </div>
  );
}
