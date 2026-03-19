import React, { useState, useCallback, useEffect } from "react";
import { useCanvas } from "./hooks/useCanvas";
import { usePredict } from "./hooks/usePredict";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { ProbabilityBar } from "./components/ProbabilityBar";
import { PredictionHistory } from "./components/PredictionHistory";
import { BrushSizeControl } from "./components/BrushSizeControl";
import { StatsPage } from "./components/StatsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { OnboardingTooltip } from "./components/OnboardingTooltip";
import { useToast, ToastContainer } from "./components/Toast";
import { fetchMetrics } from "./utils/api";
import "./App.css";

function getThumbnail(canvas, size = 60) {
  const tmp = document.createElement("canvas");
  tmp.width = size; tmp.height = size;
  tmp.getContext("2d").drawImage(canvas, 0, 0, size, size);
  return tmp.toDataURL("image/png");
}

function downloadCanvas(canvas) {
  const link = document.createElement("a");
  link.download = `digit_${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function confColor(pct) {
  if (pct >= 90) return "#4ade80";
  if (pct >= 70) return "#facc15";
  return "#f87171";
}

// ──────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);
  const [brushSize, setBrushSize] = useLocalStorage("brushSize", 22);
  const [page, setPage] = useState("draw");
  const [animKey, setAnimKey] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { toasts, showToast } = useToast();
  const { prediction, isLoading, error, history, predict, reset, clearHistory } = usePredict();

  useEffect(() => {
    fetchMetrics()
      .then(setMetrics)
      .catch(() => setMetrics({ test_accuracy: 99.1, test_loss: 0.028, epochs_trained: 12 }));
  }, []);

  // ── stroke handler ─────────────────────────────────────────
  const handleStrokeEnd = useCallback(async (base64, canvas) => {
    undoRedo.snapshot();
    const thumb = canvas ? getThumbnail(canvas) : null;
    await predict(base64, thumb);
    setAnimKey(k => k + 1);

  }, [predict]);

  const { canvasRef, clearCanvas, hasContent } = useCanvas({
    onStrokeEnd: handleStrokeEnd,
    debounceMs: 500,
    brushSize,
  });

  const undoRedo = useUndoRedo(canvasRef);

  // ── actions ────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    clearCanvas();
    undoRedo.clearHistory();
    reset();
  }, [clearCanvas, undoRedo, reset]);

  const handleDownload = useCallback(() => {
    if (canvasRef.current) {
      downloadCanvas(canvasRef.current);
      showToast("Image saved!", "success");
    }
  }, [canvasRef, showToast]);

  const handleUndo = useCallback(() => {
    undoRedo.undo();
    showToast("Undo", "info", 1200);
  }, [undoRedo, showToast]);

  const handleRedo = useCallback(() => {
    undoRedo.redo();
    showToast("Redo", "info", 1200);
  }, [undoRedo, showToast]);

  // ── keyboard shortcuts ────────────────────────────────────
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onClear: handleClear,
    onSave: handleDownload,
    onToggleDark: () => setDarkMode(d => !d),
    onBrushSmall: () => setBrushSize(14),
    onBrushMedium: () => setBrushSize(22),
    onBrushLarge: () => setBrushSize(30),
  });

  const sortedProbs = prediction
    ? [...prediction.probabilities].sort((a, b) => b.probability - a.probability)
    : [];

  // ── stats page ─────────────────────────────────────────────
  if (page === "stats") {
    return (
      <div className={`app ${darkMode ? "dark" : "light"}`}>
        <div className="noise" aria-hidden="true" />
        <AppHeader darkMode={darkMode} setDarkMode={setDarkMode} metrics={metrics}
          onStats={() => setPage("draw")} showBack
          onShowShortcuts={() => setShowShortcuts(true)} />
        <main className="main">
          <ErrorBoundary><StatsPage onBack={() => setPage("draw")} /></ErrorBoundary>
        </main>
        <AppFooter />
        <ToastContainer toasts={toasts} />
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <div className="noise" aria-hidden="true" />

      <AppHeader darkMode={darkMode} setDarkMode={setDarkMode} metrics={metrics}
        onStats={() => setPage("stats")}
        onShowShortcuts={() => setShowShortcuts(true)} />

      <main className="main">
        {/* ── Canvas Panel ─────────────────── */}
        <section className="panel panel--canvas">
          <div className="panel__label">Draw a digit</div>

          <div className="canvas-wrapper">
            <canvas ref={canvasRef} width={560} height={560} className="draw-canvas"
              style={{ touchAction: "none", cursor: "crosshair" }}
              role="img" aria-label="Drawing canvas — draw a digit here" />
            {!hasContent && (
              <div className="canvas-hint" aria-hidden="true">
                <span className="canvas-hint__number">0–9</span>
                <span className="canvas-hint__text">Draw any digit</span>
              </div>
            )}
            {isLoading && (
              <div className="canvas-loading" role="status" aria-label="Predicting…">
                <span className="spinner" />
              </div>
            )}
          </div>

          <div className="canvas-toolbar">
            <BrushSizeControl size={brushSize} onChange={setBrushSize} />
            <div className="canvas-controls">
              <button className="btn btn--ghost" onClick={handleUndo}
                disabled={!undoRedo.canUndo} title="Undo (Ctrl+Z)">↩ Undo</button>
              <button className="btn btn--ghost" onClick={handleRedo}
                disabled={!undoRedo.canRedo} title="Redo (Ctrl+Shift+Z)">↪ Redo</button>
              <button className="btn btn--ghost" onClick={handleClear}
                disabled={!hasContent} title="Clear (Esc)">✕ Clear</button>
              <button className="btn btn--ghost" onClick={handleDownload}
                disabled={!hasContent} title="Save (Ctrl+S)">↓ Save</button>
            </div>
          </div>

          <PredictionHistory history={history} onClearHistory={clearHistory} />
        </section>

        {/* ── Results Panel ─────────────────── */}
        <section className="panel panel--results" aria-live="polite">
          <div className="result-card" key={animKey}>
            {prediction ? (
              <>
                <div className="result-digit animate-pop"
                  aria-label={`Predicted digit: ${prediction.predicted_digit}`}>
                  {prediction.predicted_digit}
                </div>
                <div className="result-conf">
                  <span className="result-conf__label">Confidence</span>
                  <span className="result-conf__value" style={{ color: confColor(prediction.confidence) }}>
                    {prediction.confidence.toFixed(1)}%
                  </span>
                </div>
                <ConfidenceRing pct={prediction.confidence} />
              </>
            ) : (
              <div className="result-empty">
                {error
                  ? <span className="result-error" role="alert">{error}</span>
                  : <><span className="result-empty__icon" aria-hidden="true">✏</span>
                    <span className="result-empty__text">Start drawing to see predictions</span></>
                }
              </div>
            )}
          </div>

          <div className="prob-panel">
            <div className="prob-panel__title">Probability Distribution</div>
            <div className="prob-list" role="list" aria-label="Digit probabilities">
              {(prediction ? sortedProbs : Array.from({ length: 10 }, (_, i) => ({ digit: i, probability: 0 })))
                .map((p, i) => (
                  <ProbabilityBar key={p.digit} digit={p.digit} probability={p.probability}
                    isTop={i === 0 && prediction !== null} />
                ))}
            </div>
          </div>

          {metrics && (
            <div className="model-info">
              <InfoPill label="Accuracy" value={`${metrics.test_accuracy}%`} />
              <InfoPill label="Loss" value={metrics.test_loss} />
              <InfoPill label="Dataset" value="MNIST" />
              <InfoPill label="Model" value="CNN" />
              <button className="btn btn--ghost btn--full stats-btn" onClick={() => setPage("stats")}>
                View Model Analytics →
              </button>
            </div>
          )}
        </section>
      </main>

      <AppFooter onShowShortcuts={() => setShowShortcuts(true)} />
      <ToastContainer toasts={toasts} />
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <OnboardingTooltip />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function AppHeader({ darkMode, setDarkMode, metrics, onStats, showBack, onShowShortcuts }) {
  return (
    <header className="header" role="banner">
      <div className="header__left">
        <span className="header__logo" aria-hidden="true">◈</span>
        <div>
          <h1 className="header__title">NeuroDraw</h1>
          <p className="header__subtitle">Handwritten Digit Recognizer</p>
        </div>
      </div>
      <div className="header__right">
        {metrics && (
          <div className="accuracy-badge" role="status" aria-label={`Model accuracy: ${metrics.test_accuracy}%`}>
            <span className="accuracy-badge__label">Model Accuracy</span>
            <span className="accuracy-badge__value">{metrics.test_accuracy}%</span>
          </div>
        )}
        <button className="btn btn--ghost" onClick={onStats} style={{ fontSize: "0.72rem" }}>
          {showBack ? "← Draw" : "Analytics"}
        </button>
        <button className="btn btn--ghost" onClick={onShowShortcuts}
          aria-label="Keyboard shortcuts" style={{ fontSize: "0.72rem" }}>⌨ Keys</button>
        <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
          {darkMode ? "☀" : "◑"}
        </button>
      </div>
    </header>
  );
}

function AppFooter({ onShowShortcuts }) {
  return (
    <footer className="footer" role="contentinfo">
      Built with TensorFlow · FastAPI · React &nbsp;·&nbsp; Draw any digit 0–9
      {onShowShortcuts && (
        <button className="footer-shortcut-link" onClick={onShowShortcuts}>
          ⌨ Shortcuts
        </button>
      )}
    </footer>
  );
}

function ConfidenceRing({ pct }) {
  const r = 42, cx = 52, circ = 2 * Math.PI * r;
  return (
    <svg className="conf-ring" viewBox="0 0 104 104" width="104" height="104"
      role="img" aria-label={`Confidence ring: ${Math.round(pct)}%`}>
      <circle cx={cx} cy={cx} r={r} className="conf-ring__bg" />
      <circle cx={cx} cy={cx} r={r} className="conf-ring__fill"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        transform={`rotate(-90 ${cx} ${cx})`} style={{ stroke: confColor(pct) }} />
      <text x={cx} y={cx} className="conf-ring__text"
        textAnchor="middle" dominantBaseline="central">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="info-pill">
      <span className="info-pill__label">{label}</span>
      <span className="info-pill__value">{value}</span>
    </div>
  );
}
