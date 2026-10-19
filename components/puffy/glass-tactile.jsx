"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./glass-tactile.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

/* Tactile controls: things you turn, type into, drop on, react with and
   swipe. Each one keeps its own motion small and springy, and works from
   the keyboard as well as by touch. Colours come from the theme tokens. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const snap = (v, step, min) => Math.round((v - min) / step) * step + min;
const I = ({ d, size = 16, w = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  minus: "M5 12h14",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  smile: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 14.5c.9 1.2 2.1 1.8 3.5 1.8s2.6-.6 3.5-1.8M9 9.5h.01M15 9.5h.01",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
};

/* ---------- Knob: drag up or down, scroll, or use the arrow keys ---------- */
/* A soft mechanical click made on the fly, and a tiny buzz on phones that allow it */
// Sound comes from glass-sound.jsx when it is loaded and switched on.
// Without it the knob is silent and still buzzes softly on phones.
const gSound = () => (typeof window !== "undefined" && window.glassSound) || null;
function knobWake() { const g = gSound(); g && g.wake(); }
function knobClick(strong) {
  const gs = gSound(), ctx = gs && gs.context(), out = gs && gs.output();
  if (gs && !gs.get().on) return;
  try {
    if (ctx && out && ctx.state === "running") {
      const t = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate * 0.018), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = strong ? 1900 : 3200; bp.Q.value = 3;
      const g = ctx.createGain(); g.gain.setValueAtTime(strong ? 0.8 : 0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      src.connect(bp).connect(g).connect(out); src.start(t);
    }
  } catch (e) {}
  try { navigator.vibrate && navigator.vibrate(strong ? 12 : 4); } catch (e) {}
}
export function GlassKnob({ label, value, onChange, min = 0, max = 100, step = 1, unit = "", size = 120, ticks = 31, format, sound = true, haptics = true, className = "" }) {
  const drag = useRef(null);
  const [held, setHeld] = useState(false);
  const p = (value - min) / (max - min || 1);
  const last = useRef(value);
  const set = (v) => {
    const n = clamp(snap(v, step, min), min, max);
    if (n === last.current) return;
    // one click per tick mark passed, a firmer one at the ends
    const tk = (x) => Math.round(((x - min) / (max - min || 1)) * (ticks - 1));
    if (tk(n) !== tk(last.current) || n === min || n === max) {
      if (sound || haptics) {
        const strong = n === min || n === max;
        if (sound) knobClick(strong); else try { navigator.vibrate && navigator.vibrate(strong ? 12 : 4); } catch (e) {}
      }
    }
    last.current = n;
    onChange && onChange(n);
  };
  const down = (e) => {
    if (sound) knobWake();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, x: e.clientX, v: value };
    setHeld(true);
  };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    const delta = (d.y - e.clientY) + (e.clientX - d.x) * 0.6;
    set(d.v + (delta / 180) * (max - min));
  };
  const up = () => { drag.current = null; setHeld(false); };
  const key = (e) => {
    if (sound) knobWake();
    const big = (max - min) / 10;
    const m = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: big, PageDown: -big }[e.key];
    if (m) { e.preventDefault(); set(value + m); }
    if (e.key === "Home") { e.preventDefault(); set(min); }
    if (e.key === "End") { e.preventDefault(); set(max); }
  };
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const wheel = (e) => { e.preventDefault(); set(value + (e.deltaY < 0 ? step : -step)); };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  });
  const text = format ? format(value) : value + unit;
  return (
    <div className={"gkn " + className} style={{ "--gkn-size": size + "px", "--p": p }}>
      <div className="gkn-dial">
        <svg className="gkn-ticks" viewBox="0 0 100 100" aria-hidden="true">
          {Array.from({ length: ticks }, (_, i) => {
            const t = i / (ticks - 1), a = (-135 + t * 270) * (Math.PI / 180);
            const long = i % 5 === 0;
            return <line key={i} x1={50 + Math.sin(a) * 47} y1={50 - Math.cos(a) * 47} x2={50 + Math.sin(a) * (long ? 41 : 43.5)} y2={50 - Math.cos(a) * (long ? 41 : 43.5)} data-on={t <= p + 0.0001 ? "" : undefined} />;
          })}
        </svg>
        <div ref={ref} className="gkn-knob" role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={text}
          data-held={held ? "" : undefined} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
          onDoubleClick={() => set(min + (max - min) / 2)}>
          <span className="gkn-cap" style={{ transform: `rotate(${-135 + p * 270}deg)` }}><i /></span>
        </div>
      </div>
      <div className="gkn-read"><span>{label}</span><b>{text}</b></div>
    </div>
  );
}

/* ---------- One-time code: one real input under a row of boxes ---------- */
export function GlassOtp({ length = 6, value = "", onChange, onComplete, status, label = "Verification code", numeric = true, fullWidth = false, className = "" }) {
  const id = useId();
  const [focus, setFocus] = useState(false);
  const ref = useRef(null);
  const chars = value.split("").slice(0, length);
  const change = (e) => {
    let v = e.target.value;
    if (numeric) v = v.replace(/\D/g, "");
    v = v.slice(0, length);
    onChange && onChange(v);
    if (v.length === length && onComplete) onComplete(v);
  };
  const at = Math.min(chars.length, length - 1);
  const was = useRef(status);
  useEffect(() => { if (status !== was.current) { if (status === "success") gsnd("success"); else if (status === "error") gsnd("error"); } was.current = status; }, [status]);
  return (
    <div className={"gotp " + className} data-status={status || undefined} data-full={fullWidth ? "" : undefined} onClick={() => ref.current && ref.current.focus()}>
      <label htmlFor={id} className="gotp-sr">{label}</label>
      <input ref={ref} id={id} className="gotp-input" value={value} onChange={change} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        inputMode={numeric ? "numeric" : "text"} autoComplete="one-time-code" maxLength={length} spellCheck={false} aria-invalid={status === "error" || undefined} />
      <div className="gotp-row" aria-hidden="true" data-group={length > 3 && length % 3 === 0 ? "" : undefined}>
        {Array.from({ length }, (_, i) => (
          <span key={i} className="gotp-box" style={{ "--i": i }} data-filled={chars[i] ? "" : undefined} data-active={focus && i === at && !status ? "" : undefined}>
            {chars[i] ? <b key={chars[i] + i}>{chars[i]}</b> : null}
            {focus && i === at && !chars[i] && !status && <i className="gotp-caret" />}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Counter: minus, a number whose digits roll, plus. Hold to repeat ---------- */
function Roll({ text }) {
  return (
    <span className="gct-roll" aria-hidden="true">
      {String(text).split("").map((c, i, a) => /\d/.test(c)
        ? <span key={a.length - i} className="gct-col"><span style={{ transform: `translateY(${-Number(c) * 10}%)` }}>{"0123456789".split("").map((d) => <i key={d}>{d}</i>)}</span></span>
        : <span key={"s" + (a.length - i)} className="gct-sym">{c}</span>)}
    </span>
  );
}
export function GlassCounter({ label, value, onChange, min = 0, max = 99, step = 1, unit = "", className = "" }) {
  const t = useRef(0);
  const v = useRef(value);
  v.current = value;
  const [bump, setBump] = useState(null);
  const go = (d) => {
    const n = clamp(v.current + d, min, max);
    if (n === v.current) { setBump(d > 0 ? "max" : "min"); setTimeout(() => setBump(null), 380); return false; }
    onChange && onChange(n); v.current = n; gsnd("tick"); return true;
  };
  const start = (d) => {
    if (!go(d)) return;
    let delay = 420;
    const loop = () => { if (go(d)) { delay = Math.max(50, delay * 0.78); t.current = setTimeout(loop, delay); } };
    t.current = setTimeout(loop, delay);
  };
  const stop = () => clearTimeout(t.current);
  useEffect(() => stop, []);
  const btn = (d, icon, name, off) => (
    <button type="button" className="gct-btn" aria-label={name} disabled={off}
      onPointerDown={(e) => { if (e.button === 0) { e.preventDefault(); start(d); } }} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(d); } }}>
      <I d={icon} size={16} w={2.2} />
    </button>
  );
  return (
    <div className={"gcnt " + className} role="group" aria-label={label} data-bump={bump || undefined}>
      {label && <span className="gct-label">{label}</span>}
      <div className="gct-body">
        {btn(-step, P.minus, "Less", value <= min)}
        <output className="gct-val" aria-live="polite"><Roll text={value} /><span className="gct-sr">{value}{unit && " " + unit}</span>{unit && <em>{unit}</em>}</output>
        {btn(step, P.plus, "More", value >= max)}
      </div>
    </div>
  );
}

/* ---------- Drop zone: drop or pick files, watch each one upload ---------- */
const fmtSize = (b) => (b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(1) + " MB");
const fakeUpload = (file, onProgress) => new Promise((ok) => {
  let p = 0;
  const tick = () => { p = Math.min(1, p + 0.06 + Math.random() * 0.12); onProgress(p); if (p < 1) setTimeout(tick, 120 + Math.random() * 160); else ok(); };
  setTimeout(tick, 200);
});
export function GlassDropzone({ accept, multiple = true, maxSize = 20 * 1048576, upload = fakeUpload, onFiles, hint, className = "" }) {
  const [over, setOver] = useState(false);
  const [items, setItems] = useState([]);
  const input = useRef(null);
  const depth = useRef(0);
  const add = (list) => {
    const files = [...list].slice(0, multiple ? 20 : 1);
    if (!files.length) return;
    const next = files.map((f) => ({ id: Math.random().toString(36).slice(2), file: f, p: 0, error: f.size > maxSize ? "Too big" : null, thumb: /^image\//.test(f.type) ? URL.createObjectURL(f) : null }));
    setItems((cur) => (multiple ? [...next, ...cur] : next));
    gsnd(next.some((x) => x.error) ? "error" : "drop");
    onFiles && onFiles(files);
    next.filter((x) => !x.error).forEach((x) => {
      upload(x.file, (p) => setItems((cur) => cur.map((y) => (y.id === x.id ? { ...y, p } : y))))
        .then(() => setItems((cur) => cur.map((y) => (y.id === x.id ? { ...y, p: 1, done: true } : y))))
        .catch((err) => setItems((cur) => cur.map((y) => (y.id === x.id ? { ...y, error: (err && err.message) || "Failed" } : y))));
    });
  };
  const remove = (id) => setItems((cur) => { const x = cur.find((y) => y.id === id); if (x && x.thumb) URL.revokeObjectURL(x.thumb); return cur.filter((y) => y.id !== id); });
  return (
    <div className={"gdz " + className}>
      <div className="gdz-zone" data-over={over ? "" : undefined} role="button" tabIndex={0} aria-label="Add files. Drop them here or press to choose"
        onClick={() => input.current && input.current.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); depth.current++; setOver(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setOver(false); }}
        onDrop={(e) => { e.preventDefault(); depth.current = 0; setOver(false); add(e.dataTransfer.files); }}>
        <span className="gdz-art" aria-hidden="true"><i /><i /><b><I d={P.upload} size={22} w={2} /></b></span>
        <span className="gdz-title">{over ? "Let go to add them" : "Drop files here"}</span>
        <span className="gdz-hint">{hint || <>or <u>choose from your computer</u> · up to {fmtSize(maxSize)}</>}</span>
        <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {items.length > 0 && (
        <ul className="gdz-list">
          {items.map((x) => (
            <li key={x.id} className="gdz-item" data-done={x.done ? "" : undefined} data-error={x.error ? "" : undefined} style={{ "--p": x.p }}>
              <span className="gdz-thumb">{x.thumb ? <img src={x.thumb} alt="" /> : <I d={P.file} size={18} />}</span>
              <span className="gdz-meta">
                <b>{x.file.name}</b>
                <em>{x.error ? x.error : x.done ? fmtSize(x.file.size) + " · Uploaded" : `${Math.round(x.p * 100)}% · ${fmtSize(x.file.size)}`}</em>
                {!x.done && !x.error && <span className="gdz-bar"><i /></span>}
              </span>
              <span className="gdz-state">{x.done ? <I d={P.check} size={14} w={2.4} /> : null}</span>
              <button type="button" className="gdz-x" aria-label={"Remove " + x.file.name} onClick={() => remove(x.id)}><I d={P.x} size={14} w={2} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Reactions: a fan of emoji springs out of one button ---------- */
export function GlassReactions({ options = ["👍", "❤️", "😂", "😮", "🎉", "🔥"], counts = {}, value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(null);
  const [shift, setShift] = useState(0);
  const box = useRef(null);
  const addRef = useRef(null);
  // Keep the fan inside its frame: slide it sideways near an edge
  useLayoutEffect(() => {
    if (!open || !addRef.current) return;
    const b = addRef.current.getBoundingClientRect();
    const frame = addRef.current.closest("[data-grx-frame], .stage") || document.documentElement;
    const f = frame.getBoundingClientRect();
    const c = b.left + b.width / 2, r = 92 + 24;
    setShift(c + r > f.right - 6 ? f.right - 6 - (c + r) : c - r < f.left + 6 ? f.left + 6 - (c - r) : 0);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  const pick = (r) => { const next = value === r ? null : r; gsnd(next ? "pick" : "toggleOff"); onChange && onChange(next); setPop(next ? r + Date.now() : null); setOpen(false); };
  const shown = options.filter((r) => (counts[r] || 0) + (value === r ? 1 : 0) > 0);
  const n = options.length;
  return (
    <div className={"grx " + className} ref={box}>
      {shown.map((r) => (
        <button key={r} type="button" className="grx-chip" aria-pressed={value === r} onClick={() => pick(r)} aria-label={`${r} ${(counts[r] || 0) + (value === r ? 1 : 0)}`}>
          <span className="grx-e" key={value === r ? pop : r}>{r}</span><b>{(counts[r] || 0) + (value === r ? 1 : 0)}</b>
        </button>
      ))}
      <div className="grx-add-wrap">
        <button ref={addRef} type="button" className="grx-add" aria-expanded={open} aria-label="Add a reaction" onClick={() => setOpen(!open)}><I d={P.smile} size={17} /><span className="grx-plus"><I d={P.plus} size={9} w={3} /></span></button>
        <div className="grx-fan" style={{ marginLeft: shift }} data-open={open ? "" : undefined} role="menu" aria-label="Reactions" aria-hidden={!open}>
          {options.map((r, i) => {
            const a = (-60 + (i / Math.max(1, n - 1)) * 120) * (Math.PI / 180);
            return (
              <button key={r} type="button" role="menuitem" className="grx-opt" tabIndex={open ? 0 : -1} data-on={value === r ? "" : undefined}
                style={{ "--x": (Math.sin(a) * 92).toFixed(1) + "px", "--y": (-Math.cos(a) * 70 - 26).toFixed(1) + "px", "--d": i * 28 + "ms" }} onClick={() => pick(r)}>{r}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Card deck: swipe the top card away, the rest step forward ---------- */
export function GlassDeck({ cards, render, onSwipe, emptyText = "That's all of them.", className = "" }) {
  const [gone, setGone] = useState([]);
  const [dx, setDx] = useState(0);
  const [fly, setFly] = useState(null);
  const drag = useRef(null);
  const left = cards.filter((c) => !gone.some((g) => g.id === c.id));
  const top = left[0];
  const decide = (dir) => {
    if (!top || fly) return;
    setFly(dir); gsnd(dir === "right" ? "drop" : "popClose");
    setTimeout(() => { setGone((g) => [...g, { id: top.id, dir }]); setFly(null); setDx(0); onSwipe && onSwipe(top, dir); }, reduce() ? 0 : 320);
  };
  const down = (e) => { if (fly) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = e.clientX; gsnd("pick", { quiet: true }); };
  const move = (e) => { if (drag.current != null) setDx(e.clientX - drag.current); };
  const up = () => { if (drag.current == null) return; drag.current = null; if (Math.abs(dx) > 90) decide(dx > 0 ? "right" : "left"); else setDx(0); };
  const undo = () => { gsnd("pick"); setGone((g) => g.slice(0, -1)); };
  return (
    <div className={"gdk " + className}>
      <div className="gdk-stack">
        {left.slice(0, 3).reverse().map((c) => {
          const i = left.indexOf(c);
          const isTop = i === 0;
          const x = isTop ? (fly ? (fly === "right" ? 420 : -420) : dx) : 0;
          const style = { "--i": i, transform: isTop ? `translateX(${x}px) rotate(${x / 18}deg)` : undefined, transition: isTop && drag.current != null ? "none" : undefined, zIndex: 10 - i };
          return (
            <div key={c.id} className="gdk-card" style={style} data-top={isTop ? "" : undefined} aria-hidden={!isTop}
              onPointerDown={isTop ? down : undefined} onPointerMove={isTop ? move : undefined} onPointerUp={isTop ? up : undefined} onPointerCancel={isTop ? up : undefined}>
              {render(c)}
              {isTop && <span className="gdk-stamp gdk-yes" style={{ opacity: clamp(x / 90, 0, 1) }}>Keep</span>}
              {isTop && <span className="gdk-stamp gdk-no" style={{ opacity: clamp(-x / 90, 0, 1) }}>Skip</span>}
            </div>
          );
        })}
        {!top && <div className="gdk-empty"><p>{emptyText}</p><button type="button" onClick={() => setGone([])}>Start over</button></div>}
      </div>
      <div className="gdk-acts">
        <button type="button" className="gdk-btn" aria-label="Skip" disabled={!top} onClick={() => decide("left")}><I d={P.x} size={20} w={2.2} /></button>
        <button type="button" className="gdk-btn gdk-small" aria-label="Undo" disabled={!gone.length} onClick={undo}><I d={P.undo} size={16} w={2} /></button>
        <button type="button" className="gdk-btn gdk-love" aria-label="Keep" disabled={!top} onClick={() => decide("right")}><I d={P.heart} size={20} w={2.2} /></button>
      </div>
    </div>
  );
}

/* ---------- Morphing tray: a pill that grows into the panel it opens ---------- */
export function GlassTray({ label, icon, title, children, width = 320, className = "" }) {
  const [open, setOpen] = useState(false);
  const pill = useRef(null);
  const panel = useRef(null);
  const box = useRef(null);
  const [size, setSize] = useState(null);
  useLayoutEffect(() => {
    const el = open ? panel.current : pill.current;
    if (el) setSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, [open, children]);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") { setOpen(false); box.current && box.current.querySelector(".gtr-pill").focus(); } };
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className={"gtr " + className} ref={box} data-open={open ? "" : undefined} style={size ? { width: size.w, height: size.h } : undefined}>
      <button ref={pill} type="button" className="gtr-pill" aria-expanded={open} onClick={() => setOpen(true)} tabIndex={open ? -1 : 0}>{icon}{label}</button>
      <div ref={panel} className="gtr-panel" style={{ width: `min(${width}px, calc(100vw - 84px))` }} role="dialog" aria-label={title || label} aria-hidden={!open} inert={open ? undefined : ""}>
        <div className="gtr-head"><b>{title || label}</b><button type="button" className="gtr-x" aria-label="Close" onClick={() => setOpen(false)}><I d={P.x} size={14} w={2} /></button></div>
        <div className="gtr-body">{typeof children === "function" ? children(() => setOpen(false)) : children}</div>
      </div>
    </div>
  );
}

/* ---------- Arc dial: drag the handle round the arc, or use − and + ---------- */
export function GlassArcDial({ label = "Temperature", value, onChange, min = 16, max = 32, step = 1, unit = "°", caption, sub = "Celsius", format, size = 260, sound = true, className = "" }) {
  const svg = useRef(null);
  const last = useRef(value);
  const [held, setHeld] = useState(false);
  const [bump, setBump] = useState(0);
  const p = (value - min) / (max - min || 1);
  const R = 100, C = 120, A0 = -135, SW = 270;
  const pt = (t, r = R) => { const a = ((A0 + t * SW) * Math.PI) / 180; return [C + Math.sin(a) * r, C - Math.cos(a) * r]; };
  const arc = (t0, t1, r = R) => { const [x0, y0] = pt(t0, r), [x1, y1] = pt(t1, r); return `M${x0} ${y0}A${r} ${r} 0 ${(t1 - t0) * SW > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const set = (v, strongAtEnds = true) => {
    const n = clamp(snap(v, step, min), min, max);
    if (n === last.current) return;
    if (sound) knobClick(strongAtEnds && (n === min || n === max));
    last.current = n; setBump((b) => b + 1);
    onChange && onChange(n);
  };
  const fromPointer = (e) => {
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 240 - C, y = ((e.clientY - r.top) / r.height) * 240 - C;
    const a = (Math.atan2(x, -y) * 180) / Math.PI; // 0 at the top, clockwise
    const t = a < A0 || a > A0 + SW ? (last.current - min < (max - min) / 2 ? 0 : 1) : (a - A0) / SW; // in the gap: stay at the nearer end
    set(min + clamp(t, 0, 1) * (max - min));
  };
  // A press in the open gap at the bottom (where the buttons sit) does nothing; only the arc responds
  const inGap = (e) => {
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 240 - C, y = ((e.clientY - r.top) / r.height) * 240 - C;
    const a = (Math.atan2(x, -y) * 180) / Math.PI;
    return a < A0 || a > A0 + SW || Math.hypot(x, y) < R - 34;
  };
  const down = (e) => { if (inGap(e)) return; if (sound) knobWake(); e.currentTarget.setPointerCapture(e.pointerId); setHeld(true); fromPointer(e); };
  const move = (e) => { if (held) fromPointer(e); };
  const up = () => setHeld(false);
  const key = (e) => {
    if (sound) knobWake();
    const m = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: step * 5, PageDown: -step * 5 }[e.key];
    if (m) { e.preventDefault(); set(value + m); }
    if (e.key === "Home") { e.preventDefault(); set(min); }
    if (e.key === "End") { e.preventDefault(); set(max); }
  };
  const id = useId().replace(/:/g, "");
  const steps = Math.round((max - min) / step);
  const dots = Math.min(steps, 24);
  const [hx, hy] = pt(p);
  const text = format ? format(value) : value;
  return (
    <div className={"gad " + className} style={{ "--gad-size": size + "px" }}>
      {caption && <span className="gad-cap">{caption}</span>}
      <div className="gad-dial">
        <svg ref={svg} viewBox="0 0 240 240" className="gad-svg" role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={text + unit}
          data-held={held ? "" : undefined} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
          <defs>
            <linearGradient id={id + "g"} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="var(--gt-c)" /><stop offset="1" stopColor="var(--gad-c2)" /></linearGradient>
            <filter id={id + "s"} x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.25" /></filter>
          </defs>
          <path d={arc(0, 1)} className="gad-groove" />
          <path d={arc(0, 1)} className="gad-groove-in" />
          {p > 0.001 && <path d={arc(0, Math.max(0.002, p))} className="gad-fill" stroke={`url(#${id}g)`} />}
          {Array.from({ length: dots + 1 }, (_, k) => { const t = k / dots; if (t <= p + 0.02) return null; const [x, y] = pt(t, R); return <circle key={k} cx={x} cy={y} r="1.8" className="gad-dot" />; })}
          <g className="gad-handle" transform={`translate(${hx} ${hy})`} filter={`url(#${id}s)`}>
            <circle r="15" className="gad-knob" /><circle r="5" className="gad-pip" />
          </g>
        </svg>
        <div className="gad-read" aria-hidden="true">
          <b key={bump} data-bump={bump ? "" : undefined}>{text}<sup>{unit}</sup></b>
          {sub && <span>{sub}</span>}
        </div>
        <span className="gad-end" data-e="min">{format ? format(min) : min}{unit}</span>
        <span className="gad-end" data-e="max">{format ? format(max) : max}{unit}</span>
      </div>
      <div className="gad-btns">
        <button type="button" aria-label={`Lower ${label}`} disabled={value <= min} onClick={() => { if (sound) knobWake(); set(value - step); }}><I d="M6 9l6 6 6-6" size={18} w={2} /></button>
        <button type="button" aria-label={`Raise ${label}`} disabled={value >= max} onClick={() => { if (sound) knobWake(); set(value + step); }}><I d="M6 15l6-6 6 6" size={18} w={2} /></button>
      </div>
    </div>
  );
}

/* ---------- Ruler: slide a scale under a fixed line; it glides and settles on a mark ---------- */
export function GlassRuler({ label, value, onChange, min = 0, max = 100, step = 1, unit = "", current, every = 5, gap = 12, format, sound = true, className = "" }) {
  const box = useRef(null);
  const [w, setW] = useState(320);
  const [pos, setPos] = useState((value - min) / step); // in steps, may be fractional while moving
  const st = useRef({ drag: null, v: 0, raf: 0, last: Math.round((value - min) / step), lt: 0 });
  const n = Math.round((max - min) / step);
  useLayoutEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth); return () => ro.disconnect(); }, []);
  useEffect(() => { if (!st.current.drag && !st.current.raf) setPos((value - min) / step); }, [value]);
  const emit = (q) => {
    const k = clamp(Math.round(q), 0, n);
    if (k !== st.current.last) {
      st.current.last = k;
      const now = performance.now();
      if (sound && now - st.current.lt > 22) { st.current.lt = now; knobClick(k === 0 || k === n); }
      onChange && onChange(min + k * step);
    }
  };
  const glide = () => {
    const s = st.current; cancelAnimationFrame(s.raf);
    let q = pos, v = s.v;
    const run = () => {
      v *= 0.94; q = clamp(q + v, 0, n);
      if (Math.abs(v) < 0.03 || q === 0 || q === n) {
        // settle on the nearest mark with a small spring
        const target = Math.round(q); let x = q, sv = 0;
        const spring = () => { sv = (sv + (target - x) * 0.25) * 0.6; x += sv; setPos(x); emit(x); if (Math.abs(target - x) > 0.002 || Math.abs(sv) > 0.002) s.raf = requestAnimationFrame(spring); else { setPos(target); emit(target); s.raf = 0; } };
        s.raf = requestAnimationFrame(spring); return;
      }
      setPos(q); emit(q); s.raf = requestAnimationFrame(run);
    };
    s.raf = requestAnimationFrame(run);
  };
  const down = (e) => {
    if (sound) knobWake();
    const s = st.current; cancelAnimationFrame(s.raf); s.raf = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.drag = { x: e.clientX, p: pos, t: performance.now(), lx: e.clientX }; s.v = 0;
  };
  const move = (e) => {
    const s = st.current; if (!s.drag) return;
    const q = clamp(s.drag.p - (e.clientX - s.drag.x) / gap, 0, n);
    const now = performance.now(), dt = Math.max(1, now - s.drag.t);
    s.v = s.v * 0.5 + (-(e.clientX - s.drag.lx) / gap / dt * 16) * 0.5;
    s.drag.t = now; s.drag.lx = e.clientX;
    setPos(q); emit(q);
  };
  const up = () => { const s = st.current; if (!s.drag) return; s.drag = null; glide(); };
  useEffect(() => {
    const el = box.current; if (!el) return;
    const wheel = (e) => { const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (!d) return; e.preventDefault(); const k = clamp(st.current.last + (d > 0 ? 1 : -1), 0, n); setPos(k); emit(k); };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  });
  const key = (e) => {
    if (sound) knobWake();
    const m = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: every, PageDown: -every }[e.key];
    if (m) { e.preventDefault(); const k = clamp(st.current.last + m, 0, n); setPos(k); emit(k); }
  };
  const k = clamp(Math.round(pos), 0, n), val = min + k * step;
  const fmt = (v) => (format ? format(v) : v);
  // Only draw the marks that can be seen
  const half = Math.ceil(w / 2 / gap) + 2;
  const from = Math.max(0, Math.floor(pos) - half), to = Math.min(n, Math.ceil(pos) + half);
  const cur = current != null ? (current - min) / step : null;
  return (
    <div className={"grl " + className}>
      <div className="grl-top">
        {label && <span className="grl-label">{label}{current != null && <em>Now {fmt(current)}{unit}</em>}</span>}
        <b className="grl-val"><span key={k}>{fmt(val)}</span><small>{unit}</small></b>
      </div>
      <div ref={box} className="grl-track" role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={val} aria-valuetext={fmt(val) + unit}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
        <div className="grl-strip" style={{ transform: `translateX(${w / 2 - pos * gap}px)` }}>
          {Array.from({ length: to - from + 1 }, (_, j) => {
            const i = from + j, big = i % every === 0, d = Math.abs(i - pos);
            return (
              <span key={i} className="grl-tick" data-big={big ? "" : undefined} style={{ left: i * gap, opacity: Math.max(0.15, 1 - d / (half * 0.95)) }}>
                {big && <em>{fmt(min + i * step)}</em>}
              </span>
            );
          })}
          {cur != null && <span className="grl-cur" style={{ left: cur * gap }} />}
        </div>
        <span className="grl-needle" />
      </div>
    </div>
  );
}
