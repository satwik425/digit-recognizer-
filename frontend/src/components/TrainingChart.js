import React, { useRef, useEffect } from "react";

/**
 * TrainingChart — SVG line chart for training vs validation metrics.
 * Props:
 *   trainVals  [number]  — per-epoch train values
 *   valVals    [number]  — per-epoch val values
 *   label      string    — "Accuracy" | "Loss"
 *   color      string    — primary line color
 */
export function TrainingChart({ trainVals = [], valVals = [], label = "Value", color = "#7b5cff" }) {
  const W = 340, H = 180, PAD = { top: 16, right: 16, bottom: 36, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  if (!trainVals.length) return null;

  const allVals = [...trainVals, ...valVals];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;

  const scaleX = (i) => PAD.left + (i / (trainVals.length - 1 || 1)) * plotW;
  const scaleY = (v) => PAD.top + plotH - ((v - minV) / range) * plotH;

  const makePath = (vals) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i).toFixed(1)},${scaleY(v).toFixed(1)}`)
      .join(" ");

  const makeArea = (vals) => {
    const line = makePath(vals);
    const last = vals.length - 1;
    return `${line} L${scaleX(last).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${PAD.left},${(PAD.top + plotH).toFixed(1)} Z`;
  };

  // Y-axis ticks
  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => {
    const v = minV + (i / (ticks - 1)) * range;
    return { y: scaleY(v), label: label === "Accuracy" ? `${(v * 100).toFixed(0)}%` : v.toFixed(3) };
  });

  const epochs = trainVals.length;

  return (
    <div className="chart-wrap">
      <div className="chart-title">{label}</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id={`grad-train-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`grad-val-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00e5cc" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00e5cc" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line key={i} x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={i} x={PAD.left - 6} y={t.y + 4}
            textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)"
            fontFamily="var(--font-mono, monospace)">
            {t.label}
          </text>
        ))}

        {/* X-axis labels */}
        {[1, Math.ceil(epochs / 2), epochs].map((ep, i) => (
          <text key={i}
            x={scaleX(ep - 1)} y={H - 8}
            textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)"
            fontFamily="var(--font-mono, monospace)">
            {ep}
          </text>
        ))}

        {/* Area fills */}
        <path d={makeArea(trainVals)} fill={`url(#grad-train-${label})`} />
        {valVals.length > 0 && (
          <path d={makeArea(valVals)} fill={`url(#grad-val-${label})`} />
        )}

        {/* Lines */}
        <path d={makePath(trainVals)} fill="none"
          stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {valVals.length > 0 && (
          <path d={makePath(valVals)} fill="none"
            stroke="#00e5cc" strokeWidth="2" strokeDasharray="5,3"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Dots at last epoch */}
        <circle cx={scaleX(epochs - 1)} cy={scaleY(trainVals[epochs - 1])}
          r="4" fill={color} />
        {valVals.length > 0 && (
          <circle cx={scaleX(epochs - 1)} cy={scaleY(valVals[valVals.length - 1])}
            r="4" fill="#00e5cc" />
        )}
      </svg>

      {/* Legend */}
      <div className="chart-legend">
        <span className="chart-legend__item" style={{ "--c": color }}>Train</span>
        {valVals.length > 0 && (
          <span className="chart-legend__item" style={{ "--c": "#00e5cc" }}>Validation</span>
        )}
      </div>
    </div>
  );
}
