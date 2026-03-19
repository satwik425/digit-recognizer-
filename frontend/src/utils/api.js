const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

/**
 * Send canvas image to backend and get prediction.
 * @param {string} base64Image — data URL from canvas.toDataURL()
 * @returns {Promise<{predicted_digit, confidence, probabilities}>}
 */
export async function predictDigit(base64Image) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch model accuracy metrics.
 */
export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}
