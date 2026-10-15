"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./glass-delight.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

/* Small parts with a lot of care in them: confirm, calendar, popover and
   hover card, hold to confirm, swipe to delete, password strength, rating,
   undo pill, toast stack, notification bell, number ticker, floating label,
   range slider, and the pieces of an animated form (check ring, letter
   reveal, metal text). Colours come from the theme tokens. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const I = ({ d, size = 16, w = 1.8, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6", x: "M6 6l12 12M18 6L6 18", check: "M5 12.5l4.5 4.5L19 7.5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13", bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  star: "M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z", undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  alert: "M12 4l9 16H3zM12 10v4M12 17h.01", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
};
function useOutside(open, ref, close) {
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
}

/* ---------- Confirm: "Are you sure?" with an optional word to type ---------- */
export function GlassConfirm({ open, onClose, onConfirm, title = "Are you sure?", description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, typeToConfirm, icon }) {
  const ref = useRef(null);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) { setTyped(""); d.showModal(); gsnd("pop"); }
    if (!open && d.open) d.close();
  }, [open]);
  const ok = !typeToConfirm || typed.trim() === typeToConfirm;
  return (
    <dialog ref={ref} className="gx-confirm" data-danger={danger ? "" : undefined} onClose={() => onClose && onClose()} onClick={(e) => { if (e.target === ref.current) onClose && onClose(); }}>
      <div className="gx-confirm-in">
        <span className="gx-confirm-ic">{icon || <I d={danger ? P.trash : P.alert} size={20} />}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {typeToConfirm && (
          <label className="gx-confirm-type"><span>Type <b>{typeToConfirm}</b> to confirm</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus spellCheck={false} autoComplete="off" /></label>
        )}
        <div className="gx-confirm-acts">
          <button type="button" className="gx-btn" onClick={() => onClose && onClose()}>{cancelLabel}</button>
          <button type="button" className="gx-btn gx-btn-main" disabled={!ok} onClick={() => { gsnd(danger ? "delete" : "success"); onConfirm && onConfirm(); onClose && onClose(); }}>{confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}

/* ---------- Calendar: one month, pick a day, slide between months ---------- */
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const same = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export function GlassCalendar({ value, onChange, today = new Date(), min, max, marked = [], className = "" }) {
  const [view, setView] = useState(() => new Date((value || today).getFullYear(), (value || today).getMonth(), 1));
  const [dir, setDir] = useState(0);
  const first = (view.getDay() + 6) % 7;
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => { const d = i - first + 1; return d >= 1 && d <= days ? new Date(view.getFullYear(), view.getMonth(), d) : null; });
  const go = (n) => { setDir(n); setView(new Date(view.getFullYear(), view.getMonth() + n, 1)); };
  const off = (d) => (min && d < min) || (max && d > max);
  return (
    <div className={"gx-cal " + className}>
      <div className="gx-cal-head">
        <b key={view.getMonth()} data-dir={dir}>{view.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</b>
        <span><button type="button" aria-label="Previous month" onClick={() => go(-1)}><I d={P.left} size={15} w={2.2} /></button><button type="button" aria-label="Next month" onClick={() => go(1)}><I d={P.right} size={15} w={2.2} /></button></span>
      </div>
      <div className="gx-cal-grid" role="grid" key={view.getTime()} data-dir={dir}>
        {DOW.map((d) => <span key={d} className="gx-cal-dow" role="columnheader">{d}</span>)}
        {cells.map((d, i) => d ? (
          <button key={i} type="button" role="gridcell" disabled={off(d)} aria-selected={same(d, value)} data-today={same(d, today) ? "" : undefined} data-marked={marked.some((m) => same(m, d)) ? "" : undefined}
            onClick={() => onChange && onChange(d)} aria-label={d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}>{d.getDate()}</button>
        ) : <span key={i} />)}
      </div>
    </div>
  );
}

/* ---------- Popover (click) and hover card (point or focus) ---------- */
export function GlassPopover({ trigger, children, align = "start", className = "" }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useOutside(open, box, () => setOpen(false));
  return (
    <span className={"gx-pop " + className} ref={box}>
      <span onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="dialog">{trigger}</span>
      {open && <span className="gx-pop-panel" data-align={align} role="dialog">{typeof children === "function" ? children(() => setOpen(false)) : children}</span>}
    </span>
  );
}
export function GlassHoverCard({ trigger, children, delay = 350, className = "" }) {
  const [open, setOpen] = useState(false);
  const t = useRef(0);
  const show = () => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(true), delay); };
  const hide = () => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(false), 150); };
  return (
    <span className={"gx-hc " + className} onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}>
      {trigger}
      {open && <span className="gx-hc-card" role="tooltip" onPointerEnter={show} onPointerLeave={hide}>{children}</span>}
    </span>
  );
}

/* ---------- Hold to confirm: press and hold until it fills ---------- */
export function GlassHoldButton({ children = "Hold to delete", doneLabel = "Deleted", duration = 1400, onConfirm, danger = true, className = "" }) {
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef(0), t0 = useRef(0);
  const tick = (now) => {
    const k = Math.min(1, (now - t0.current) / duration);
    setP(k);
    if (k >= 1) { setDone(true); if (!gsnd(danger ? "delete" : "success")) { try { navigator.vibrate && navigator.vibrate(20); } catch (e) {} } onConfirm && onConfirm(); setTimeout(() => { setDone(false); setP(0); }, 1800); return; }
    raf.current = requestAnimationFrame(tick);
  };
  const start = (e) => { if (done) return; if (e && e.preventDefault) e.preventDefault(); t0.current = performance.now(); cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(tick); };
  const stop = () => { if (done) return; cancelAnimationFrame(raf.current); setP(0); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <button type="button" className={"gx-hold " + className} data-danger={danger ? "" : undefined} data-done={done ? "" : undefined} data-held={p > 0 && !done ? "" : undefined} style={{ "--p": p }}
      onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); }} onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") stop(); }}>
      <span className="gx-hold-fill" aria-hidden="true" />
      <span className="gx-hold-txt">{done ? <><I d={P.check} size={15} w={2.4} />{doneLabel}</> : <><I d={P.trash} size={15} />{children}</>}</span>
    </button>
  );
}

/* ---------- Swipe to delete: drag a row left ---------- */
export function GlassSwipeRow({ children, onDelete, label = "Delete", className = "" }) {
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState(false);
  const drag = useRef(null);
  const max = -96;
  const down = (e) => { drag.current = { x: e.clientX, base: dx }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => { if (!drag.current) return; setDx(clamp(drag.current.base + e.clientX - drag.current.x, -220, 0)); };
  const up = () => {
    if (!drag.current) return; drag.current = null;
    if (dx < -170) { setGone(true); gsnd("delete"); setTimeout(() => onDelete && onDelete(), 300); }
    else setDx(dx < max / 2 ? max : 0);
  };
  return (
    <div className={"gx-swipe " + className} data-gone={gone ? "" : undefined} data-open={dx < -2 || gone ? "" : undefined}>
      <button type="button" className="gx-swipe-del" tabIndex={dx ? 0 : -1} style={{ "--r": clamp(-dx / 96, 0, 1.6) }} onClick={() => { setGone(true); gsnd("delete"); setTimeout(() => onDelete && onDelete(), 300); }}><I d={P.trash} size={17} />{label}</button>
      <div className="gx-swipe-row" style={{ transform: `translateX(${gone ? -400 : dx}px)`, opacity: gone ? 0 : 1, transition: drag.current ? "none" : undefined }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onKeyDown={(e) => { if (e.key === "Delete" || e.key === "Backspace") { setGone(true); gsnd("delete"); setTimeout(() => onDelete && onDelete(), 300); } if (e.key === "ArrowLeft") setDx(max); if (e.key === "ArrowRight") setDx(0); }} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Password strength: four bars and the rules still missing ---------- */
const RULES = [["8 characters or more", (s) => s.length >= 8], ["A number", (s) => /\d/.test(s)], ["Upper and lower case", (s) => /[a-z]/.test(s) && /[A-Z]/.test(s)], ["A symbol", (s) => /[^A-Za-z0-9]/.test(s)]];
export function GlassPasswordStrength({ value = "", className = "" }) {
  const met = RULES.map(([, f]) => f(value));
  const score = value ? met.filter(Boolean).length : 0;
  const word = ["", "Weak", "Fair", "Good", "Strong"][score];
  return (
    <div className={"gx-pw " + className} data-score={score}>
      <div className="gx-pw-bars" aria-hidden="true">{[1, 2, 3, 4].map((k) => <i key={k} data-on={score >= k ? "" : undefined} />)}</div>
      <div className="gx-pw-word" aria-live="polite">{word ? <>Strength: <b>{word}</b></> : "Use 8 or more characters"}</div>
      <ul className="gx-pw-rules">{RULES.map(([t], i) => <li key={t} data-ok={met[i] ? "" : undefined}><span><I d={met[i] ? P.check : P.x} size={11} w={3} /></span>{t}</li>)}</ul>
    </div>
  );
}

/* ---------- Star rating: point to preview, tap to set ---------- */
export function GlassRating({ value = 0, onChange, max = 5, size = 28, label = "Rating", className = "" }) {
  const [hover, setHover] = useState(null);
  const [pop, setPop] = useState(0);
  const shown = hover != null ? hover : value;
  return (
    <div className={"gx-rate " + className} role="radiogroup" aria-label={label} onPointerLeave={() => setHover(null)} style={{ "--s": size + "px" }}>
      {Array.from({ length: max }, (_, i) => (
        <button type="button" role="radio" aria-checked={value === i + 1} aria-label={`${i + 1} of ${max}`} data-on={i < shown ? "" : undefined} data-pop={pop && i < value ? "" : undefined} key={i + "-" + (i < value ? pop : 0)}
          style={{ "--i": i }} onPointerEnter={() => setHover(i + 1)} onClick={() => { onChange && onChange(i + 1 === value ? 0 : i + 1); setPop((n) => n + 1); }}>
          <I d={P.star} size={size} w={1.6} fill="currentColor" />
        </button>
      ))}
    </div>
  );
}

/* ---------- Undo pill: a short message with a countdown ring ---------- */
export function GlassUndoPill({ show, message = "Moved to trash", onUndo, onExpire, duration = 5000, className = "" }) {
  useEffect(() => { if (!show) return; const t = setTimeout(() => onExpire && onExpire(), duration); return () => clearTimeout(t); }, [show]);
  if (!show) return null;
  return (
    <div className={"gx-undo " + className} role="status" style={{ "--t": duration + "ms" }}>
      <svg className="gx-undo-ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="9" className="gx-undo-left" pathLength="1" /></svg>
      <span>{message}</span>
      <button type="button" onClick={() => onUndo && onUndo()}><I d={P.undo} size={14} w={2} />Undo</button>
    </div>
  );
}

/* ---------- Toast stack: newest on top, the rest tucked behind; opens on hover ---------- */
export function GlassToastStack({ items = [], onDismiss, className = "" }) {
  const [open, setOpen] = useState(false);
  const list = items.slice(-4).reverse();
  const seen = useRef(new Set(items.map((t) => t.id)));
  useEffect(() => {
    const fresh = items.filter((t) => !seen.current.has(t.id));
    items.forEach((t) => seen.current.add(t.id));
    const t = fresh[fresh.length - 1];
    if (t) gsnd(t.tone === "error" || t.tone === "danger" ? "error" : t.tone === "success" ? "success" : "pop");
  }, [items]);
  return (
    <ol className={"gx-ts " + className} data-open={open ? "" : undefined} onPointerEnter={() => setOpen(true)} onPointerLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} aria-live="polite" style={{ "--n": list.length }}>
      {list.map((t, i) => (
        <li key={t.id} className="gx-ts-item" data-tone={t.tone} style={{ "--i": i }}>
          <span className="gx-ts-dot" />
          <span className="gx-ts-txt"><b>{t.title}</b>{t.text && <span>{t.text}</span>}</span>
          <button type="button" aria-label="Dismiss" onClick={() => onDismiss && onDismiss(t.id)}><I d={P.x} size={13} w={2.2} /></button>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Notification bell: rings when something arrives ---------- */
export function GlassBell({ items = [], onRead, onReadAll, className = "" }) {
  const [open, setOpen] = useState(false);
  const [ring, setRing] = useState(0);
  const box = useRef(null);
  const unread = items.filter((i) => !i.read).length;
  const prev = useRef(unread);
  useEffect(() => { if (unread > prev.current) { setRing((r) => r + 1); gsnd("ding"); } prev.current = unread; }, [unread]);
  useOutside(open, box, () => setOpen(false));
  return (
    <span className={"gx-bell " + className} ref={box}>
      <button type="button" className="gx-bell-btn" aria-label={`Notifications, ${unread} unread`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span key={ring} className="gx-bell-ic" data-ring={ring ? "" : undefined}><I d={P.bell} size={19} /></span>
        {unread > 0 && <span key={"b" + unread} className="gx-bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="gx-bell-panel" role="menu">
          <div className="gx-bell-top"><b>Notifications</b>{unread > 0 && <button type="button" onClick={onReadAll}>Mark all read</button>}</div>
          {items.length ? items.map((n) => (
            <button key={n.id} type="button" role="menuitem" className="gx-bell-item" data-unread={n.read ? undefined : ""} onClick={() => onRead && onRead(n.id)}>
              <span className="gx-bell-av" style={{ "--h": n.hue || 260 }}>{n.who ? n.who.split(" ").map((w) => w[0]).join("").slice(0, 2) : "•"}</span>
              <span className="gx-bell-txt"><span>{n.text}</span><em>{n.when}</em></span>
            </button>
          )) : <p className="gx-bell-empty">You're all caught up.</p>}
        </div>
      )}
    </span>
  );
}

/* ---------- Number ticker: digits roll to the new value ---------- */
export function GlassTicker({ value = 0, format = (v) => v.toLocaleString("en-US"), className = "" }) {
  const text = format(value);
  return (
    <span className={"gx-tick " + className} aria-label={text} role="text">
      {text.split("").map((c, i, a) => /\d/.test(c)
        ? <span key={a.length - i} className="gx-tick-col" aria-hidden="true"><span style={{ transform: `translateY(${-Number(c) * 10}%)`, transitionDelay: (a.length - i) * 30 + "ms" }}>{"0123456789".split("").map((d) => <i key={d}>{d}</i>)}</span></span>
        : <span key={"s" + (a.length - i)} className="gx-tick-sym" aria-hidden="true">{c}</span>)}
    </span>
  );
}

/* ---------- Floating label input ---------- */
export function GlassFloatingInput({ label, value, onChange, type = "text", hint, error, className = "", ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const pw = type === "password";
  return (
    <div className={"gx-fl " + className} data-filled={value ? "" : undefined} data-error={error ? "" : undefined}>
      <input id={id} type={pw && show ? "text" : type} value={value} onChange={onChange} placeholder=" " aria-invalid={error ? true : undefined} {...rest} />
      <label htmlFor={id}>{label}</label>
      {pw && <button type="button" className="gx-fl-eye" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow(!show)}><I d={P.eye} size={16} /></button>}
      {(error || hint) && <span className="gx-fl-foot">{error || hint}</span>}
    </div>
  );
}

/* ---------- Range slider: two handles for a from and to ---------- */
export function GlassRangeSlider({ min = 0, max = 100, step = 1, value = [20, 80], onChange, format = (v) => v, label = "Range", className = "" }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const [a, b] = value;
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const toV = (px) => { const r = ref.current.getBoundingClientRect(); return clamp(Math.round(((px - r.left) / r.width) * (max - min) / step) * step + min, min, max); };
  const down = (e) => {
    const v = toV(e.clientX); const which = drag.current = Math.abs(v - a) <= Math.abs(v - b) ? (v > b ? 1 : 0) : 1;
    e.currentTarget.setPointerCapture(e.pointerId); set(which, v);
  };
  const set = (which, v) => { if (which === 0) onChange && onChange([Math.min(v, b), b]); else onChange && onChange([a, Math.max(v, a)]); };
  const key = (which) => (e) => { const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[e.key]; if (d) { e.preventDefault(); set(which, clamp((which ? b : a) + d, min, max)); } };
  return (
    <div className={"gx-rs " + className}>
      <div className="gx-rs-head"><span>{label}</span><b>{format(a)} – {format(b)}</b></div>
      <div className="gx-rs-track" ref={ref} onPointerDown={down} onPointerMove={(e) => drag.current != null && e.buttons && set(drag.current, toV(e.clientX))} onPointerUp={() => (drag.current = null)}>
        <span className="gx-rs-fill" style={{ left: pct(a) + "%", right: 100 - pct(b) + "%" }} />
        {[a, b].map((v, i) => (
          <span key={i} className="gx-rs-thumb" style={{ left: pct(v) + "%" }} role="slider" tabIndex={0} aria-label={i ? label + " to" : label + " from"} aria-valuemin={min} aria-valuemax={max} aria-valuenow={v} aria-valuetext={String(format(v))} onKeyDown={key(i)} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Animated form pieces: a check ring that draws itself, letters that arrive, metal text ---------- */
export function GlassCheckRing({ done, delay = 0, size = 20, className = "" }) {
  return (
    <span className={"gx-ring " + className} data-done={done ? "" : undefined} style={{ "--d": delay + "ms", width: size, height: size }} aria-label={done ? "Done" : undefined}>
      <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.5" pathLength="1" className="gx-ring-c" /><path d="M6 10.4l2.6 2.6L14 7.6" pathLength="1" className="gx-ring-k" /></svg>
    </span>
  );
}
export function GlassTypeIn({ text = "", speed = 55, delay = 0, mask, className = "" }) {
  const [n, setN] = useState(reduce() ? text.length : 0);
  useEffect(() => {
    if (reduce()) { setN(text.length); return; }
    setN(0); let i = 0, t;
    const step = () => { i++; setN(i); if (i < text.length) t = setTimeout(step, speed); };
    t = setTimeout(step, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return <span className={"gx-type " + className} aria-label={mask ? undefined : text}>{text.slice(0, n).split("").map((c, i) => <span key={i}>{mask ? mask : c}</span>)}</span>;
}
export function GlassMetalText({ children, as: Tag = "span", className = "" }) {
  return <Tag className={"gx-metal " + className}>{children}</Tag>;
}

/* ---------- Edge-lit set: a bezel shell around a lit inner panel ----------
   Card, input, button, toast and alert drawn the same way: an outer frame,
   an inner surface with a soft top-to-bottom gradient and a one-pixel
   highlight on its top edge. Put gx-seq on a wrapper to play its children in
   one after another. */
const EP = {
  mail: "M4 6h16v12H4zM4 7l8 6 8-6", lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01", ok: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12.5l2.4 2.4 4.6-5",
};
const TONE_IC = { info: EP.info, success: EP.ok, warning: P.alert, danger: P.alert };
export function GlassEdgeCard({ title, text, children, className = "", ...rest }) {
  return (
    <div className={"gx-edge " + className} {...rest}>
      <div className="gx-edge-in">
        {title && <h3 className="gx-edge-title gx-metal">{title}</h3>}
        {text && <p className="gx-edge-text">{text}</p>}
        {children}
      </div>
    </div>
  );
}
export function GlassEdgeInput({ label, icon, done, hint, className = "", ...rest }) {
  const id = useId();
  return (
    <label className={"gx-efield " + className} htmlFor={id}>
      {label && <span className="gx-efield-label">{label}</span>}
      <span className="gx-efield-box">
        {icon && <span className="gx-efield-ic"><I d={EP[icon] || icon} size={16} /></span>}
        <input id={id} {...rest} />
        {done !== undefined && <GlassCheckRing done={done} size={18} />}
      </span>
      {hint && <span className="gx-efield-hint">{hint}</span>}
    </label>
  );
}
export function GlassEdgeButton({ variant = "main", tone, children, className = "", ...rest }) {
  return <button type="button" className={"gx-ebtn " + className} data-variant={variant} data-tone={tone} {...rest}><span>{children}</span></button>;
}
export function GlassEdgeToast({ title, text, tone = "success", duration = 4000, onClose, className = "" }) {
  useEffect(() => { if (!duration || !onClose) return; const t = setTimeout(onClose, duration); return () => clearTimeout(t); }, [duration]);
  return (
    <div className={"gx-etoast " + className} data-tone={tone} role="status" style={{ "--dur": duration + "ms" }}>
      <div className="gx-etoast-in">
        <span className="gx-e-ic"><I d={TONE_IC[tone] || EP.info} size={17} /></span>
        <span className="gx-etoast-body"><b>{title}</b>{text && <span>{text}</span>}</span>
        {onClose && <button type="button" className="gx-e-x" aria-label="Dismiss" onClick={onClose}><I d={P.x} size={14} /></button>}
      </div>
      {duration > 0 && <i className="gx-etoast-bar" aria-hidden="true" />}
    </div>
  );
}
export function GlassEdgeAlert({ tone = "info", title, children, action, onDismiss, className = "" }) {
  return (
    <div className={"gx-ealert " + className} data-tone={tone} role={tone === "danger" || tone === "warning" ? "alert" : "status"}>
      <div className="gx-ealert-in">
        <span className="gx-e-ic"><I d={TONE_IC[tone] || EP.info} size={17} /></span>
        <span className="gx-ealert-body">{title && <b>{title}</b>}{children && <span>{children}</span>}{action && <span className="gx-ealert-act">{action}</span>}</span>
        {onDismiss && <button type="button" className="gx-e-x" aria-label="Dismiss" onClick={onDismiss}><I d={P.x} size={14} /></button>}
      </div>
    </div>
  );
}
