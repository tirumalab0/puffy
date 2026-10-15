"use client";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import "./glass-button.css";
import { useGlassLens } from "./glass-lens.js";

/* Springs, not durations: a press can be reversed mid-flight and the
   button picks up from wherever it is. */
const SPRINGS = {
  smooth: { stiffness: 380, damping: 36 }, // settles with no bounce
  bubble: { stiffness: 420, damping: 19 }, // one soft overshoot
};

const REST = { scale: 1, squish: 0, hx: 0.5, hy: 0, glow: 0 };

const reducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const write = (el, values) => {
  for (const key in values) el.style.setProperty(`--g-${key}`, values[key].toFixed(4));
};

/* Drives a handful of CSS variables with one spring loop per button.
   No React re-renders happen while it animates. */
function useSpringVars(ref, springName, still) {
  const state = useRef(null);
  if (!state.current) {
    state.current = { cur: { ...REST }, vel: {}, target: { ...REST }, raf: 0, last: 0 };
  }
  const opts = useRef({});
  opts.current = { springName, still };

  const step = useCallback(
    (now) => {
      const s = state.current;
      const el = ref.current;
      if (!el) {
        s.raf = 0;
        return;
      }
      const spring = SPRINGS[opts.current.springName] || SPRINGS.smooth;
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      let moving = false;
      for (const key in s.cur) {
        const v = s.vel[key] || 0;
        const d = s.target[key] - s.cur[key];
        const nv = v + (spring.stiffness * d - spring.damping * v) * dt;
        s.vel[key] = nv;
        s.cur[key] += nv * dt;
        if (Math.abs(d) < 0.0005 && Math.abs(nv) < 0.005) {
          s.cur[key] = s.target[key];
          s.vel[key] = 0;
        } else {
          moving = true;
        }
      }
      write(el, s.cur);
      s.raf = moving ? requestAnimationFrame(step) : 0;
    },
    [ref]
  );

  const set = useCallback(
    (next) => {
      const s = state.current;
      const el = ref.current;
      Object.assign(s.target, next);
      if (!el) return;
      if (opts.current.still || reducedMotion()) {
        // Keep the light feedback, drop the movement.
        Object.assign(s.cur, s.target, { scale: 1, squish: 0 });
        write(el, s.cur);
        return;
      }
      if (!s.raf) {
        s.last = performance.now();
        s.raf = requestAnimationFrame(step);
      }
    },
    [ref, step]
  );

  useEffect(() => () => cancelAnimationFrame(state.current.raf), []);
  return set;
}

const chain = (own, user) => (event) => {
  if (user) user(event);
  if (!event.defaultPrevented) own(event);
};

/**
 * GlassButton
 *
 * variant   "primary" | "secondary" | "ghost"
 * effect    "flat" | "glass" | "bubble"
 * size      "sm" | "md" | "lg"
 * iconOnly  square button for a single icon (give it an aria-label)
 * motion    "smooth" | "none"
 * loading   shows a spinner and blocks clicks, keeps focus
 */
export const GlassButton = forwardRef(function GlassButton(
  {
    variant = "primary",
    effect = "flat",
    size = "md",
    iconOnly = false,
    motion = "smooth",
    loading = false,
    disabled = false,
    iconLeft,
    iconRight,
    className = "",
    children,
    onClick,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
    onKeyUp,
    onBlur,
    ...rest
  },
  forwardedRef
) {
  useGlassLens(effect !== "flat");
  const ref = useRef(null);
  const bubble = effect === "bubble";
  const set = useSpringVars(ref, bubble ? "bubble" : "smooth", motion === "none");
  const inert = disabled || loading;

  const setRef = useCallback(
    (node) => {
      ref.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  useEffect(() => {
    if (inert) set(REST);
  }, [inert, set]);

  const enter = () => {
    if (!inert) set({ glow: 1 });
  };
  const move = (e) => {
    if (inert || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    set({
      hx: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      hy: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    });
  };
  const leave = () => set(REST);
  // Flat and glass sink slightly. Bubble also squashes, then springs back.
  const press = () => {
    if (!inert) set(bubble ? { scale: 0.96, squish: 0.02, glow: 1 } : { scale: 0.98, glow: 1 });
  };
  const release = () => {
    if (!inert) set({ scale: 1, squish: 0 });
  };
  const keyDown = (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) press();
  };
  const keyUp = (e) => {
    if (e.key === " " || e.key === "Enter") set({ scale: 1, squish: 0, glow: 0 });
  };

  return (
    <button
      type="button"
      {...rest}
      ref={setRef}
      className={`gb ${className}`.trim()}
      data-variant={variant}
      data-effect={effect}
      data-size={size}
      data-icon-only={iconOnly ? "" : undefined}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      onPointerEnter={chain(enter, onPointerEnter)}
      onPointerMove={chain(move, onPointerMove)}
      onPointerLeave={chain(leave, onPointerLeave)}
      onPointerDown={chain(press, onPointerDown)}
      onPointerUp={chain(release, onPointerUp)}
      onPointerCancel={chain(leave, onPointerCancel)}
      onKeyDown={chain(keyDown, onKeyDown)}
      onKeyUp={chain(keyUp, onKeyUp)}
      onBlur={chain(leave, onBlur)}
    >
      {loading ? (
        <span className="gb-spinner" aria-hidden="true" />
      ) : (
        iconLeft && (
          <span className="gb-icon" aria-hidden="true">
            {iconLeft}
          </span>
        )
      )}
      {children != null && <span className="gb-label">{children}</span>}
      {iconRight && (
        <span className="gb-icon" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  );
});

export default GlassButton;
