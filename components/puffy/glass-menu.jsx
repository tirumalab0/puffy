"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./glass-surface.css";

/* Shared by GlassSelect, GlassDropdown and GlassCombobox. */

/* Open state that closes when the person clicks anywhere else. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const down = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);
  return { open, setOpen, rootRef };
}

/* Next row up or down, skipping separators and disabled rows. */
export function moveIndex(items, from, dir) {
  const n = items.length;
  let i = from;
  for (let k = 0; k < n; k++) {
    i = (i + dir + n) % n;
    if (!items[i].separator && !items[i].disabled) return i;
  }
  return from;
}

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * GlassList: the floating panel.
 * items  [{ value, label, icon?, hint?, danger?, disabled? } | { separator: true }]
 */
export function GlassList({ id, role = "listbox", effect = "flat", align, items, activeIndex, onActiveChange, onPick, selectedValue, labelledBy, empty = "Nothing here" }) {
  const ref = useRef(null);
  const [hl, setHl] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current && ref.current.querySelector(`[data-index="${activeIndex}"]`);
    if (!el) return setHl(null);
    setHl({ y: el.offsetTop, h: el.offsetHeight });
    if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex, items.length]);

  return (
    <div ref={ref} id={id} className="gp" role={role} data-effect={effect} data-align={align} aria-labelledby={labelledBy} tabIndex={-1}>
      <span className="gp-hl" aria-hidden="true" style={hl ? { transform: `translateY(${hl.y}px)`, height: hl.h } : { opacity: 0 }} />
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="gp-sep" role="separator" />
        ) : (
          <div
            key={item.value}
            id={`${id}-${i}`}
            data-index={i}
            className="gp-item"
            role={role === "menu" ? "menuitem" : "option"}
            aria-selected={role === "menu" ? undefined : item.value === selectedValue}
            aria-disabled={item.disabled || undefined}
            data-danger={item.danger ? "" : undefined}
            onPointerMove={() => !item.disabled && activeIndex !== i && onActiveChange(i)}
            onClick={() => !item.disabled && onPick(item)}
          >
            {item.icon && <span className="gp-icon" aria-hidden="true">{item.icon}</span>}
            <span className="gp-text">{item.label}</span>
            {item.hint && <span className="gp-hint">{item.hint}</span>}
            {role !== "menu" && item.value === selectedValue && <span className="gp-check" aria-hidden="true"><Check /></span>}
          </div>
        )
      )}
      {items.length === 0 && <div className="gp-empty">{empty}</div>}
    </div>
  );
}

/* Arrow, Home, End, Enter and Escape for an open list. Returns true if handled. */
export function listKey(e, { items, active, setActive, pick, close }) {
  const go = (index) => {
    e.preventDefault();
    setActive(index);
    return true;
  };
  switch (e.key) {
    case "ArrowDown": return go(moveIndex(items, active, 1));
    case "ArrowUp": return go(moveIndex(items, active < 0 ? 0 : active, -1));
    case "Home": return go(moveIndex(items, -1, 1));
    case "End": return go(moveIndex(items, 0, -1));
    case "Enter":
      e.preventDefault();
      if (items[active]) pick(items[active]);
      return true;
    case "Escape":
      e.preventDefault();
      close();
      return true;
    case "Tab":
      close();
      return true;
    default:
      return false;
  }
}

export const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
