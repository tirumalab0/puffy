"use client";
import { useState } from "react";
import { GlassButton } from "./glass-button.jsx";
import "./glass-surface.css";
import "./glass-keypad.css";

const Backspace = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6h11v12H9l-5-6zM12 10l4 4M16 10l-4 4" />
  </svg>
);

/**
 * GlassKeypad: a number pad for PINs and one-time codes.
 * length      how many digits, default 4
 * value, onChange(code)   optional; it keeps its own state without them
 * onComplete(code)        called when the last digit goes in
 * mask        show dots instead of digits
 * effect      "flat" | "glass" | "bubble"
 * Digits and Backspace on a keyboard work while focus is inside the pad.
 */
export function GlassKeypad({ length = 4, value, onChange, onComplete, mask = false, effect = "flat", label = "Enter code" }) {
  const [inner, setInner] = useState("");
  const code = value !== undefined ? value : inner;

  const update = (next) => {
    if (value === undefined) setInner(next);
    if (onChange) onChange(next);
    if (next.length === length && onComplete) onComplete(next);
  };
  const add = (digit) => {
    if (code.length < length) update(code + digit);
  };
  const back = () => update(code.slice(0, -1));
  const onKeyDown = (e) => {
    if (/^[0-9]$/.test(e.key)) add(e.key);
    else if (e.key === "Backspace") back();
  };
  const key = { variant: "secondary", effect, size: "lg", className: "gk-key" };

  return (
    <div className="gk" role="group" aria-label={label} onKeyDown={onKeyDown}>
      <div className="gk-cells" role="status" aria-label={`${code.length} of ${length} digits entered`}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className="gf gk-cell" data-effect={effect} data-current={i === code.length ? "" : undefined}>
            {i < code.length && (mask ? <span className="gk-dot" /> : <span className="gk-digit">{code[i]}</span>)}
          </span>
        ))}
      </div>
      <div className="gk-keys">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <GlassButton key={d} {...key} onClick={() => add(d)}>{d}</GlassButton>
        ))}
        <GlassButton {...key} variant="ghost" className="gk-key gk-small" onClick={() => update("")}>Clear</GlassButton>
        <GlassButton {...key} onClick={() => add("0")}>0</GlassButton>
        <GlassButton {...key} variant="ghost" aria-label="Delete last digit" onClick={back}><Backspace /></GlassButton>
      </div>
    </div>
  );
}

export default GlassKeypad;
