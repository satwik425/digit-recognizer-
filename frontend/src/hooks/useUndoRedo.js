import { useRef, useCallback } from "react";

const MAX_HISTORY = 20;

/**
 * useUndoRedo
 * ───────────
 * Maintains a stack of canvas ImageData snapshots.
 * Exposes: { snapshot, undo, redo, canUndo, canRedo }
 *
 * Usage:
 *   const { snapshot, undo, redo, canUndo, canRedo } = useUndoRedo(canvasRef);
 *
 *   // Call snapshot() after every completed stroke
 *   // Bind undo/redo to Ctrl+Z / Ctrl+Shift+Z
 */
export function useUndoRedo(canvasRef) {
  const past   = useRef([]);  // array of ImageData
  const future = useRef([]);  // redo stack

  /** Save current canvas state onto the undo stack. */
  const snapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    past.current.push(data);
    if (past.current.length > MAX_HISTORY) past.current.shift();
    future.current = [];   // new action clears redo stack
  }, [canvasRef]);

  /** Undo — restores previous state. */
  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || past.current.length === 0) return;
    const ctx = canvas.getContext("2d");

    // Push current state to redo stack
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    future.current.push(current);

    // Pop and restore last state
    const prev = past.current.pop();
    ctx.putImageData(prev, 0, 0);
  }, [canvasRef]);

  /** Redo — re-applies undone state. */
  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || future.current.length === 0) return;
    const ctx = canvas.getContext("2d");

    // Push current state to undo stack
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    past.current.push(current);

    // Pop and restore future state
    const next = future.current.pop();
    ctx.putImageData(next, 0, 0);
  }, [canvasRef]);

  /** Clear both stacks (call when canvas is cleared). */
  const clearHistory = useCallback(() => {
    past.current   = [];
    future.current = [];
  }, []);

  return {
    snapshot,
    undo,
    redo,
    clearHistory,
    get canUndo() { return past.current.length > 0; },
    get canRedo() { return future.current.length > 0; },
  };
}
