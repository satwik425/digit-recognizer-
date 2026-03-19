import { useEffect } from "react";

/**
 * useKeyboardShortcuts
 * ─────────────────────
 * Registers global keyboard shortcuts for the drawing canvas.
 *
 * Shortcuts:
 *   Ctrl+Z           → undo
 *   Ctrl+Shift+Z     → redo
 *   Ctrl+Y           → redo (Windows convention)
 *   Escape / Delete  → clear canvas
 *   Ctrl+S           → save / download canvas
 *   Ctrl+D           → toggle dark mode
 *   1 / 2 / 3        → brush size S / M / L
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onClear,
  onSave,
  onToggleDark,
  onBrushSmall,
  onBrushMedium,
  onBrushLarge,
}) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore if focus is inside an input/textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (ctrl && e.key === "z" && !shift) { e.preventDefault(); onUndo?.(); return; }
      if (ctrl && e.key === "z" &&  shift) { e.preventDefault(); onRedo?.(); return; }
      if (ctrl && e.key === "y")           { e.preventDefault(); onRedo?.(); return; }
      if (ctrl && e.key === "s")           { e.preventDefault(); onSave?.(); return; }
      if (ctrl && e.key === "d")           { e.preventDefault(); onToggleDark?.(); return; }
      if (e.key === "Escape" || e.key === "Delete") { onClear?.(); return; }
      if (e.key === "1") { onBrushSmall?.();  return; }
      if (e.key === "2") { onBrushMedium?.(); return; }
      if (e.key === "3") { onBrushLarge?.();  return; }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUndo, onRedo, onClear, onSave, onToggleDark, onBrushSmall, onBrushMedium, onBrushLarge]);
}
