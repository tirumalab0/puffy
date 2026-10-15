"use client";
import { useEffect, useId, useRef, useState } from "react";
import "./glass-surface.css";
import "./glass-controls.css";

const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 12.5l4 4 8-9" />
  </svg>
);

/* ---------- Liquid glass ----------
   While held, a thumb turns into a clear glass drop. Inside it sits a
   magnified copy of the track (the "lens"), so the track looks bent and
   enlarged through the glass. Plain CSS, so it works in every browser. */

/* "held" while a pointer is down; "settle" plays a short wobble after */
function useGlass(ms = 520) {
  const [held, setHeld] = useState(false);
  const [settle, setSettle] = useState(false);
  const t = useRef(0);
  useEffect(() => () => clearTimeout(t.current), []);
  const release = () => {
    setHeld(false);
    setSettle(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setSettle(false), ms);
  };
  const pulse = () => {
    setHeld(true);
    clearTimeout(t.current);
    t.current = setTimeout(release, 240);
  };
  return { held, settle, hold: () => { clearTimeout(t.current); setSettle(false); setHeld(true); }, release, pulse };
}

/** GlassSwitch: checked, onChange(next), label. Tap it, or drag the thumb. */
export function GlassSwitch({ checked = false, onChange, label, disabled = false, ...rest }) {
  const g = useGlass();
  const drag = useRef(null);
  const set = (v) => onChange && v !== checked && onChange(v);
  return (
    <button
      type="button"
      className="gsw"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-held={g.held ? "" : undefined}
      data-settle={g.settle ? "" : undefined}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        drag.current = { x: e.clientX, moved: false };
        e.currentTarget.setPointerCapture(e.pointerId);
        g.hold();
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 6) { d.moved = true; set(dx > 0); }
      }}
      onPointerUp={() => { if (drag.current) g.release(); }}
      onPointerCancel={() => { drag.current = null; g.release(); }}
      onClick={(e) => {
        const d = drag.current;
        drag.current = null;
        if (d && d.moved) return; /* a drag already chose the side */
        if (e.detail === 0) g.pulse(); /* keyboard */
        onChange && onChange(!checked);
      }}
      {...rest}
    >
      <span className="gsw-track"><span className="gsw-thumb"><span className="g-lens" /></span></span>
      {label && <span>{label}</span>}
    </button>
  );
}

/** GlassCheckbox: checked, onChange(next), label, hint */
export function GlassCheckbox({ checked = false, onChange, label, hint, disabled = false }) {
  return (
    <label className="gopt" data-disabled={disabled ? "" : undefined}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange && onChange(e.target.checked)} />
      <span className="gck" aria-hidden="true"><Tick /></span>
      <span className="gopt-text">
        <span>{label}</span>
        {hint && <span className="gopt-hint">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * GlassCheckboxGroup: pick any number.
 * options  [{ value, label, hint?, disabled? }]
 * value    array of chosen values; onChange(nextArray)
 */
export function GlassCheckboxGroup({ label, options, value = [], onChange }) {
  const toggle = (v, on) => onChange && onChange(on ? [...value, v] : value.filter((x) => x !== v));
  return (
    <fieldset className="ggroup">
      {label && <legend className="gfield-label">{label}</legend>}
      {options.map((o) => (
        <GlassCheckbox key={o.value} label={o.label} hint={o.hint} disabled={o.disabled} checked={value.includes(o.value)} onChange={(on) => toggle(o.value, on)} />
      ))}
    </fieldset>
  );
}

/**
 * GlassRadioGroup: pick exactly one.
 * options  [{ value, label, hint?, disabled? }]
 * value, onChange(value)
 */
export function GlassRadioGroup({ label, options, value, onChange }) {
  const name = useId();
  return (
    <fieldset className="ggroup">
      {label && <legend className="gfield-label">{label}</legend>}
      {options.map((o) => (
        <label key={o.value} className="gopt" data-disabled={o.disabled ? "" : undefined}>
          <input type="radio" name={name} checked={value === o.value} disabled={o.disabled} onChange={() => onChange && onChange(o.value)} />
          <span className="gck" data-round="" aria-hidden="true"><span className="gck-dot" /></span>
          <span className="gopt-text">
            <span>{o.label}</span>
            {o.hint && <span className="gopt-hint">{o.hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** GlassSlider: value, onChange(number), min, max, step, label, unit */
// Sound comes from glass-sound.jsx when it is loaded and switched on.
let slLast = 0;
const slSound = () => (typeof window !== "undefined" && window.glassSound) || null;
function slWake() { const g = slSound(); g && g.wake(); }
// A short, soft "tok" whose pitch follows the position: low on the left, bright on the right
function slTick(p, edge) {
  const now = performance.now(); if (now - slLast < 28 && !edge) return; slLast = now;
  const gs = slSound(); if (gs && !gs.get().on) return;
  try {
    const ctx = gs && gs.context(), out = gs && gs.output();
    if (ctx && out && ctx.state === "running") {
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(380 + p * 620, t); o.frequency.exponentialRampToValueAtTime(260 + p * 420, t + 0.05);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(edge ? 0.2 : 0.11, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + (edge ? 0.12 : 0.06));
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.14);
    }
  } catch (e) {}
  try { navigator.vibrate && navigator.vibrate(edge ? 10 : 3); } catch (e) {}
}
export function GlassSlider({ value = 0, onChange, min = 0, max = 100, step = 1, label, unit = "", showValue = true, sound = true }) {
  const id = useId();
  const p = (value - min) / (max - min);
  const g = useGlass();
  // Dots mark the steps: every step when there are few, otherwise ten even marks
  const n = Math.round((max - min) / step);
  const marks = n <= 12 ? n : 10;
  return (
    <div className="gsl">
      {(label || showValue) && (
        <div className="gsl-head">
          <label htmlFor={id}>{label}</label>
          {showValue && <span>{value}{unit}</span>}
        </div>
      )}
      {/* The real range input sits on top, invisible, so dragging and the keyboard work as normal */}
      <div className="gsl-rail" data-held={g.held ? "" : undefined} data-settle={g.settle ? "" : undefined} style={{ "--gsl-p": p }}>
        <span className="gsl-track">
          <span className="gsl-fill" />
          <span className="gsl-dots" aria-hidden="true">{Array.from({ length: marks + 1 }, (_, i) => <i key={i} style={{ "--k": i / marks }} data-on={i / marks <= p + 0.001 ? "" : undefined} />)}</span>
        </span>
        <span className="gsl-thumb" aria-hidden="true"><span className="g-lens" /></span>
        <input
          id={id}
          className="gsl-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => { const v = Number(e.target.value); if (sound && v !== value) slTick((v - min) / (max - min || 1), v === min || v === max); onChange && onChange(v); }}
          onPointerDown={(e) => { if (sound) slWake(); g.hold(e); }}
          onPointerUp={g.release}
          onPointerCancel={g.release}
          onKeyDown={(e) => { if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End" || e.key.startsWith("Page")) g.pulse(); }}
        />
      </div>
    </div>
  );
}
