import { useState, useEffect, useCallback } from "react";

/**
 * useLocalStorage
 * ───────────────
 * Persists state to localStorage, with SSR safety and JSON serialization.
 *
 * @param {string} key         — localStorage key
 * @param {*}      initialValue
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Safari private mode throws on write — silently ignore
    }
  }, [key, value]);

  const remove = useCallback(() => {
    try { window.localStorage.removeItem(key); } catch {}
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValue, remove];
}
