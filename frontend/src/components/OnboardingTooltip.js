import React, { useState, useEffect } from "react";

const STEPS = [
  {
    title: "Welcome to NeuroDraw",
    body:  "Draw any handwritten digit (0–9) on the canvas and watch the CNN predict it in real time.",
    icon:  "◈",
  },
  {
    title: "Draw freely",
    body:  "Use your mouse or finger to write a digit. Prediction fires automatically ~500ms after you stop.",
    icon:  "✏",
  },
  {
    title: "Adjust brush size",
    body:  "Use the S / M / L buttons (or keyboard 1 / 2 / 3) to change stroke width.",
    icon:  "◎",
  },
  {
    title: "Explore analytics",
    body:  "Tap Analytics in the header to see training curves, confusion matrix, and model architecture.",
    icon:  "📊",
  },
];

/**
 * OnboardingTooltip
 * Shows a multi-step first-run tour.
 * Persists completion in localStorage so it never re-shows.
 */
export function OnboardingTooltip() {
  const [step,    setStep]    = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done");
    if (!done) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem("onboarding_done", "1");
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const s = STEPS[step];
  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true">
      <div className="onboarding-card">
        <div className="onboarding-icon">{s.icon}</div>
        <h3 className="onboarding-title">{s.title}</h3>
        <p  className="onboarding-body">{s.body}</p>
        <div className="onboarding-footer">
          <div className="onboarding-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`onboarding-dot ${i === step ? "active" : ""}`} />
            ))}
          </div>
          <div className="onboarding-btns">
            <button className="btn btn--ghost" onClick={dismiss} style={{ fontSize: "0.7rem" }}>
              Skip
            </button>
            <button className="btn btn--accent" onClick={next}>
              {step < STEPS.length - 1 ? "Next →" : "Let's go!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
