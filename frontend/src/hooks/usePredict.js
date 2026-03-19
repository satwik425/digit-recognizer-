import { useState, useCallback, useRef } from "react";
import { predictDigit } from "../utils/api";

/**
 * usePredict — manages prediction state and history.
 */
export function usePredict() {
  const [prediction,  setPrediction]  = useState(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState(null);
  const [history,     setHistory]     = useState([]);
  const idRef = useRef(0);

  const predict = useCallback(async (base64Image, thumbnailDataUrl) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await predictDigit(base64Image);
      setPrediction(result);

      // Add to session history
      setHistory((prev) => [
        ...prev,
        {
          id:         ++idRef.current,
          digit:      result.predicted_digit,
          confidence: result.confidence,
          thumbnail:  thumbnailDataUrl,
          timestamp:  Date.now(),
        },
      ]);

      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPrediction(null);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { prediction, isLoading, error, history, predict, reset, clearHistory };
}
