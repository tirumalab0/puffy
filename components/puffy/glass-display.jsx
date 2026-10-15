"use client";
import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./glass-surface.css";
import "./glass-display.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
);
const Cross = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
);

/**
 * GlassBadge: tone "neutral" | "accent" | "success" | "warning" | "danger"
 * dot adds a status dot; effect "flat" | "glass" | "bubble"
 */
export function GlassBadge({ tone = "neutral", dot = false, effect = "flat", children }) {
  return (
    <span className="gbd" data-tone={tone} data-effect={effect}>
      {dot && <span className="gbd-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** GlassBanner: title, children (the message), tone, action (an element), onDismiss */
export function GlassBanner({ title, tone = "accent", action, onDismiss, children }) {
  return (
    <div className="gbn" data-tone={tone} role="status">
      <span className="gbn-mark" aria-hidden="true" />
      <div className="gbn-body">
        {title && <span className="gbn-title">{title}</span>}
        {children && <span className="gbn-text">{children}</span>}
      </div>
      <div className="gbn-side">
        {action}
        {onDismiss && <button type="button" className="gbn-x" aria-label="Dismiss" onClick={onDismiss}><Cross /></button>}
      </div>
    </div>
  );
}

/**
 * GlassAccordion: one section open at a time.
 * items        [{ id, title, content }]
 * defaultOpen  id of the section open at first
 */
export function GlassAccordion({ items, defaultOpen }) {
  const base = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="gac">
      {items.map((item) => {
        const on = open === item.id;
        return (
          <div key={item.id} className="gac-item">
            <button type="button" className="gac-head" id={`${base}-${item.id}-h`} aria-expanded={on} aria-controls={`${base}-${item.id}-p`} onClick={() => setOpen(on ? null : item.id)}>
              {item.title}
              <Chevron />
            </button>
            <div className="gac-panel" id={`${base}-${item.id}-p`} role="region" aria-labelledby={`${base}-${item.id}-h`} data-open={on ? "" : undefined} inert={on ? undefined : ""}>
              <div className="gac-inner"><div>{item.content}</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * GlassTabs
 * tabs     [{ id, label }]
 * value, onChange(id)
 * variant  "segmented" (default) or "subtle"
 * effect   "flat" | "glass" | "bubble"
 */
export function GlassTabs({ tabs, value, onChange, variant = "segmented", effect = "flat", label }) {
  const ref = useRef(null);
  const [pill, setPill] = useState(null);
  const [fade, setFade] = useState("");
  // Tabs stay on one row. When they run out of room they scroll, the edge with
  // more tabs fades, and the chosen tab is brought to the middle.
  const measure = () => {
    const t = ref.current;
    if (!t) return;
    const el = t.querySelector('[aria-selected="true"]');
    if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth });
    const l = t.scrollLeft > 2, r = t.scrollLeft + t.clientWidth < t.scrollWidth - 2;
    setFade(l && r ? "both" : l ? "start" : r ? "end" : "");
  };
  useLayoutEffect(measure, [value, tabs.length]);
  useEffect(() => {
    const t = ref.current;
    if (!t || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const t = ref.current;
    const el = t && t.querySelector('[aria-selected="true"]');
    if (el && t.scrollWidth > t.clientWidth + 2) t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [value]);
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === value);
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    onChange && onChange(tab.id);
    requestAnimationFrame(() => ref.current && ref.current.querySelector('[aria-selected="true"]').focus());
  };
  return (
    <div className="gtabs" role="tablist" aria-label={label} data-variant={variant} data-effect={effect} data-fade={fade || undefined} ref={ref} onScroll={measure} onKeyDown={onKeyDown}>
      {pill && <span className="gtabs-pill" aria-hidden="true" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />}
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" className="gtab" aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} onClick={() => onChange && onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/**
 * GlassTable
 * columns  [{ key, label, align? }]   align "end" right-aligns numbers
 * rows     [{ id, ...values }]        a value may be text or an element
 */
export function GlassTable({ columns, rows, caption }) {
  return (
    <div className="gtb">
      <table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col" data-align={c.align}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>{columns.map((c) => <td key={c.key} data-align={c.align}>{row[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** GlassTooltip: wrap one focusable element; label is the hint text; effect "flat" | "glass" | "bubble" */
export function GlassTooltip({ label, effect = "flat", children }) {
  const id = useId();
  return (
    <span className="gtt">
      {cloneElement(children, { "aria-describedby": id })}
      <span className="gtt-tip" role="tooltip" id={id} data-effect={effect}>{label}</span>
    </span>
  );
}

/** GlassDots: count, index, onChange(index) */
export function GlassDots({ count, index = 0, onChange, label = "Slides" }) {
  return (
    <div className="gdots" role="group" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" className="gdot" aria-label={`Go to ${i + 1} of ${count}`} aria-current={i === index} onClick={() => onChange && onChange(i)} />
      ))}
    </div>
  );
}

/** GlassThinking: a waiting indicator for assistants. label defaults to "Thinking" */
export function GlassThinking({ label = "Thinking" }) {
  return (
    <span className="gth" role="status">
      <span className="gth-orb" aria-hidden="true"><i /></span>
      <span className="gth-label">{label}</span>
    </span>
  );
}

/**
 * GlassDialog: a modal. Built on the browser's own <dialog>, so focus stays
 * inside it and Escape closes it.
 * open, onClose, title, description, actions (elements), children
 */
export function GlassDialog({ open, onClose, title, description, actions, children }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) { el.showModal(); gsnd("pop"); }
    if (!open && el.open) { el.close(); gsnd("popClose"); }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="gdl"
      aria-labelledby={`${id}-t`}
      onCancel={(e) => { e.preventDefault(); onClose && onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose && onClose(); }}
    >
      <h2 className="gdl-title" id={`${id}-t`}>{title}</h2>
      {description && <p className="gdl-text">{description}</p>}
      {children && <div className="gdl-body">{children}</div>}
      {actions && <div className="gdl-actions">{actions}</div>}
    </dialog>
  );
}
