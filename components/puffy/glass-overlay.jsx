"use client";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import "./glass-surface.css";
import "./glass-app.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

/* Overlays and feedback for SaaS screens: command menu, drawer, toasts,
   empty state, skeleton, date-range picker and stepper. */

const Svg = ({ d, size = 16, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d={d} />
  </svg>
);
const X = "M6 6l12 12M18 6L6 18";

/* The browser's own <dialog>: focus stays inside, Escape closes it */
function useModal(open) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) { el.showModal(); gsnd("pop"); }
    if (!open && el.open) { el.close(); gsnd("popClose"); }
  }, [open]);
  return ref;
}

/* ---------- Command menu ---------- */
/**
 * GlassCommand: search everything and jump anywhere. Opens with Cmd/Ctrl+K.
 * open, onOpenChange(next)
 * groups    [{ label, items: [{ id, label, icon?, hint?, keys?: string[], onSelect? }] }]
 * onSelect(item)   called for any item, after its own onSelect
 * hotkey    false turns off the Cmd/Ctrl+K shortcut
 */
export function GlassCommand({ open, onOpenChange, groups = [], onSelect, placeholder = "Search or jump to…", hotkey = true, effect = "flat" }) {
  const ref = useModal(open);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  useEffect(() => {
    if (!hotkey) return;
    const on = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange && onOpenChange(!open); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [hotkey, open, onOpenChange]);
  useEffect(() => { if (open) { setQ(""); setActive(0); } }, [open]);
  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => !t || it.label.toLowerCase().includes(t) || (it.hint || "").toLowerCase().includes(t)) }))
      .filter((g) => g.items.length);
  }, [groups, q]);
  const flat = visible.flatMap((g) => g.items);
  const pick = (it) => {
    if (!it) return;
    it.onSelect && it.onSelect();
    onSelect && onSelect(it);
    onOpenChange && onOpenChange(false);
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % Math.max(1, flat.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + flat.length) % Math.max(1, flat.length)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(flat[active]); }
  };
  let idx = -1;
  return (
    <dialog ref={ref} className="gdl gcmd" aria-label="Command menu" onCancel={(e) => { e.preventDefault(); onOpenChange && onOpenChange(false); }} onClick={(e) => { if (e.target === ref.current) onOpenChange && onOpenChange(false); }}>
      <div className="gf gcmd-search" data-effect={effect}>
        <span className="gf-icon"><Svg d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm9 2l-4.35-4.35" /></span>
        <input className="gf-input" autoFocus placeholder={placeholder} aria-label={placeholder} role="combobox" aria-expanded="true" aria-controls={listId}
          aria-activedescendant={flat[active] ? `${listId}-${flat[active].id}` : undefined}
          value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} />
        <kbd className="gcmd-esc">esc</kbd>
      </div>
      <div className="gcmd-list" id={listId} role="listbox">
        {visible.length === 0 && <p className="gcmd-empty">No results for “{q}”.</p>}
        {visible.map((g) => (
          <div key={g.label} role="group" aria-label={g.label}>
            <div className="gcmd-group">{g.label}</div>
            {g.items.map((it) => {
              idx += 1;
              const i = idx;
              return (
                <div key={it.id} id={`${listId}-${it.id}`} role="option" aria-selected={i === active} className="gcmd-item"
                  onPointerMove={() => setActive(i)} onClick={() => pick(it)}>
                  {it.icon && <span className="gcmd-icon">{it.icon}</span>}
                  <span className="gcmd-text">{it.label}{it.hint && <span className="gcmd-hint">{it.hint}</span>}</span>
                  {it.keys && <span className="gcmd-keys">{it.keys.map((k) => <kbd key={k}>{k}</kbd>)}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </dialog>
  );
}

/* ---------- Drawer ---------- */
/** GlassDrawer: a panel that slides in from the side. open, onClose, title, description, side "right" | "left", actions, children */
export function GlassDrawer({ open, onClose, title, description, side = "right", actions, children }) {
  const ref = useModal(open);
  const id = useId();
  return (
    <dialog ref={ref} className="gdl gdr" data-side={side} aria-labelledby={`${id}-t`}
      onCancel={(e) => { e.preventDefault(); onClose && onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose && onClose(); }}>
      <header className="gdr-head">
        <div>
          <h2 className="gdl-title" id={`${id}-t`}>{title}</h2>
          {description && <p className="gdl-text">{description}</p>}
        </div>
        <button type="button" className="gbn-x" aria-label="Close" onClick={onClose}><Svg d={X} /></button>
      </header>
      <div className="gdr-body">{children}</div>
      {actions && <footer className="gdr-foot">{actions}</footer>}
    </dialog>
  );
}

/* ---------- Toasts ---------- */
let toasts = [];
let nextId = 1;
const subs = new Set();
const emit = () => subs.forEach((f) => f());
/** toast(title, { description, tone: "neutral"|"success"|"danger", action: { label, onClick }, duration }) */
export function toast(title, opts = {}) {
  const t = { id: nextId++, title, tone: "neutral", duration: 4200, ...opts };
  toasts = [...toasts, t].slice(-4);
  gsnd(t.tone === "success" ? "success" : t.tone === "danger" ? "error" : "pop");
  emit();
  if (t.duration) setTimeout(() => dismissToast(t.id), t.duration);
  return t.id;
}
export function dismissToast(id) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, 220);
}
/** GlassToaster: put one in your app. Toasts stack in the corner. */
export function GlassToaster({ position = "bottom-right" }) {
  const list = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => toasts, () => toasts);
  return (
    <div className="gts-wrap" data-position={position} role="region" aria-label="Notifications" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="gp gtst" data-tone={t.tone} data-leaving={t.leaving ? "" : undefined}>
          <span className="gtst-mark" aria-hidden="true">
            {t.tone === "success" ? <Svg d="M6 12.5l4 4 8-9" /> : t.tone === "danger" ? <Svg d="M12 8v5m0 3.5v.5" /> : <Svg d="M12 8h.01M11 12h1v5h1" />}
          </span>
          <div className="gtst-body">
            <strong>{t.title}</strong>
            {t.description && <span>{t.description}</span>}
          </div>
          {t.action && <button type="button" className="gtst-action" onClick={() => { t.action.onClick && t.action.onClick(); dismissToast(t.id); }}>{t.action.label}</button>}
          <button type="button" className="gbn-x" aria-label="Dismiss" onClick={() => dismissToast(t.id)}><Svg d={X} size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Empty state and skeleton ---------- */
/** GlassEmpty: icon, title, children (one line), actions */
export function GlassEmpty({ icon, title, children, actions }) {
  return (
    <div className="gem">
      {icon && <span className="gem-icon">{icon}</span>}
      <h3 className="gem-title">{title}</h3>
      {children && <p className="gem-text">{children}</p>}
      {actions && <div className="gem-actions">{actions}</div>}
    </div>
  );
}
/** GlassSkeleton: a shimmering placeholder. width, height, radius, or lines for a text block */
export function GlassSkeleton({ width = "100%", height = 14, radius = 8, lines }) {
  if (lines) {
    return (
      <span className="gsk-lines" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => <span key={i} className="gsk" style={{ width: i === lines - 1 ? "62%" : "100%", height, borderRadius: radius }} />)}
      </span>
    );
  }
  return <span className="gsk" aria-hidden="true" style={{ width, height, borderRadius: radius }} />;
}

/* ---------- Date range picker ---------- */
const DAY = 86400000;
const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a, b) => a && b && a.getTime() === b.getTime();
const fmtDay = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fmtFull = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
/**
 * GlassDateRange: pick a from–to range, with quick presets.
 * value { from: Date, to: Date }, onChange(range), presets [{ label, days }]
 */
export function GlassDateRange({ value, onChange, label = "Date range", presets = [{ label: "Today", days: 1 }, { label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }], effect = "flat", today }) {
  const [open, setOpen] = useState(false);
  // "Today" is read only after someone opens the picker, so server pre-rendering stays stable
  const getT0 = () => startOf(today || new Date());
  const t0 = open ? getT0() : null;
  const [month, setMonth] = useState(null);
  const openPicker = () => { if (!month) { const b = (value && value.to) || getT0(); setMonth(new Date(b.getFullYear(), b.getMonth(), 1)); } setOpen((o) => !o); };
  const [draft, setDraft] = useState(null);
  const root = useRef(null);
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);
  const days = useMemo(() => {
    if (!month) return [];
    const first = new Date(month);
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);
  const from = draft ? draft.from : value && value.from;
  const to = draft ? draft.to : value && value.to;
  const clickDay = (d) => {
    if (!draft || draft.to) setDraft({ from: d, to: null });
    else {
      const r = d < draft.from ? { from: d, to: draft.from } : { from: draft.from, to: d };
      setDraft(null);
      onChange && onChange(r);
      setOpen(false);
    }
  };
  const preset = (n) => { const t = getT0(); onChange && onChange({ from: new Date(t.getTime() - (n - 1) * DAY), to: t }); setDraft(null); setOpen(false); };
  return (
    <div className="gfield gdp" ref={root}>
      <button type="button" className="gf gdp-trigger" data-effect={effect} data-open={open ? "" : undefined} aria-haspopup="dialog" aria-expanded={open} aria-label={`${label}: ${value ? fmtFull(value.from) + " to " + fmtFull(value.to) : "none"}`} onClick={openPicker}>
        <span className="gf-icon"><Svg d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></span>
        <span className="gf-value">{value ? `${fmtDay(value.from)} – ${fmtFull(value.to)}` : "Pick dates"}</span>
      </button>
      {open && month && (
        <div className="gp gdp-pop" data-effect={effect} role="dialog" aria-label={label}>
          <div className="gdp-presets">
            {presets.map((p) => <button key={p.label} type="button" className="gdp-preset" onClick={() => preset(p.days)}>{p.label}</button>)}
          </div>
          <div className="gdp-cal">
            <div className="gdp-head">
              <button type="button" className="gbn-x" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Svg d="M15 6l-6 6 6 6" /></button>
              <strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
              <button type="button" className="gbn-x" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Svg d="M9 6l6 6-6 6" /></button>
            </div>
            <div className="gdp-grid" role="grid">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="gdp-dow" aria-hidden="true">{d}</span>)}
              {days.map((d, i) => d ? (
                <button key={i} type="button" className="gdp-day"
                  data-today={same(d, t0) ? "" : undefined}
                  data-edge={same(d, from) || same(d, to) ? "" : undefined}
                  data-in={from && to && d > from && d < to ? "" : undefined}
                  aria-label={fmtFull(d)} onClick={() => clickDay(d)}>{d.getDate()}</button>
              ) : <span key={i} />)}
            </div>
            <p className="gdp-hint">{draft ? "Now pick the end date." : "Pick a start date, then an end date."}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Stepper ---------- */
/**
 * GlassStepper: where someone is in a flow.
 * steps [{ id, label, hint? }], current (index), onStepClick(index) lets people go back
 * orientation "horizontal" | "vertical"
 */
export function GlassStepper({ steps = [], current = 0, onStepClick, orientation = "horizontal" }) {
  return (
    <ol className="gstp" data-orientation={orientation} style={{ "--p": steps.length > 1 ? current / (steps.length - 1) : 0 }}>
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        const can = onStepClick && i < current;
        const Tag = can ? "button" : "span";
        return (
          <li key={s.id} className="gstp-step" data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <Tag type={can ? "button" : undefined} className="gstp-btn" aria-label={can ? `Back to step ${i + 1}: ${s.label}` : undefined} onClick={can ? () => onStepClick(i) : undefined}>
              <span className="gstp-mark">{state === "done" ? <Svg d="M6 12.5l4 4 8-9" size={14} strokeWidth="2.6" /> : i + 1}</span>
              <span className="gstp-text"><span>{s.label}</span>{s.hint && <span className="gstp-hint">{s.hint}</span>}</span>
            </Tag>
          </li>
        );
      })}
    </ol>
  );
}
