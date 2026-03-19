import React from "react";

const SHORTCUTS = [
  { keys: ["Ctrl", "Z"],         desc: "Undo last stroke"       },
  { keys: ["Ctrl", "Shift", "Z"],desc: "Redo"                   },
  { keys: ["Ctrl", "S"],         desc: "Save / download drawing" },
  { keys: ["Escape"],            desc: "Clear canvas"           },
  { keys: ["Ctrl", "D"],         desc: "Toggle dark / light mode"},
  { keys: ["1"],                 desc: "Small brush"            },
  { keys: ["2"],                 desc: "Medium brush"           },
  { keys: ["3"],                 desc: "Large brush"            },
];

/**
 * KeyboardShortcutsModal
 * Props: isOpen, onClose
 */
export function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">Keyboard Shortcuts</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="shortcut-row">
              <div className="shortcut-keys">
                {s.keys.map((k, j) => (
                  <React.Fragment key={k}>
                    <kbd className="kbd">{k}</kbd>
                    {j < s.keys.length - 1 && <span className="kbd-plus">+</span>}
                  </React.Fragment>
                ))}
              </div>
              <span className="shortcut-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
