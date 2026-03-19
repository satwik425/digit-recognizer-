import React from "react";

/**
 * BrushSizeControl — lets the user pick stroke width.
 */
export function BrushSizeControl({ size, onChange }) {
  const sizes = [
    { value: 14, label: "S" },
    { value: 22, label: "M" },
    { value: 30, label: "L" },
  ];

  return (
    <div className="brush-control">
      <span className="brush-label">Brush</span>
      <div className="brush-options">
        {sizes.map((s) => (
          <button
            key={s.value}
            className={`brush-btn ${size === s.value ? "brush-btn--active" : ""}`}
            onClick={() => onChange(s.value)}
            aria-label={`Brush size ${s.label}`}
          >
            <span
              className="brush-dot"
              style={{ width: s.value / 2.5, height: s.value / 2.5 }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
