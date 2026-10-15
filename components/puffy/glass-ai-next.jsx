"use client";
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom/client";
import "./glass-ai-next.css";

/* The next set of AI parts: code blocks, attachments, modes and tools,
   stop and steer, edit and resend, jump to latest, memory, slash commands,
   read aloud and answer cards; then background tasks, a live browser view,
   checkpoints, helpers, compare, answer checks, limits, hold to talk, camera
   mode, live captions and image edit. None of them call a model: you pass in
   what yours returns. Every popover becomes a bottom sheet on phones.
   Colours come from the theme tokens. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const I = ({ d, size = 16, w = 1.8, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
export const NP = {
  x: "M6 6l12 12M18 6L6 18", check: "M5 12.5l4.5 4.5L19 7.5", plus: "M12 5v14M5 12h14", up: "M12 19V5M5.5 11.5L12 5l6.5 6.5", down: "M12 5v14M5.5 12.5L12 19l6.5-6.5",
  copy: "M9 9h10v10H9zM5 15V5h10", play: "M7 5v14l12-7z", pause: "M7 5h3v14H7zM14 5h3v14h-3z", stop: "M7 7h10v10H7z", pencil: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  retry: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7", spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z", bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
  brain: "M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 3 3 0 0 1-3-3",
  telescope: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6M11 8v6", globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01", camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  folder: "M3 6h6l2 2h10v11H3z", cal: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4", code: "M8 8l-4 4 4 4M16 8l4 4-4 4", term: "M4 5h16v14H4zM8 10l2 2-2 2M12 15h4",
  wrap: "M4 7h16M4 12h13a3 3 0 0 1 0 6h-4M4 17h5M15 16l-2 2 2 2", chev: "M6 9l6 6 6-6", chevr: "M9 6l6 6-6 6", chevl: "M15 6l-6 6 6 6",
  ghost: "M6 20V10a6 6 0 0 1 12 0v10l-2-2-2 2-2-2-2 2-2-2zM10 11h.01M14 11h.01", trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13", speaker: "M5 9h3l5-4v14l-5-4H5zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11",
  slash: "M15 4L9 20", sum: "M5 6h14M5 10h10M5 14h14M5 18h8", trans: "M4 5h8M8 3v2M6 5c0 4 3 7 6 8M10 5c-1 4-4 7-6 8M13 20l4-9 4 9M14.5 17h5", list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3", lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3", unlock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 6.8-1.2",
  send: "M12 19V5M5.5 11.5L12 5l6.5 6.5", cursor: "M5 3l14 7-6 2-2 6z", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", hand: "M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.6-1.5L8 15",
  restore: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2", brush: "M14 4l6 6-8 8H6v-6zM4 20h4", shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  bars: "M5 20V10M10 20V4M15 20v-7M20 20v-12", drive: "M8 4h8l5 9-4 7H7l-4-7zM3 13h18M8 4l5 9", git: "M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 12c0 4-6 3-12 6",
  crown: "M3 8l4 4 5-7 5 7 4-4-2 11H5z", flash: "M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8",
};
export { I as NI };

/* ---------- Feel: one soft tick, a buzz on phones ---------- */
// Sound comes from glass-sound.jsx when it is loaded and switched on;
// without it these parts stay silent.
const NSND = { tap: "tick", done: "success", send: "send", soft: "tick", warn: "warn", pop: "pop", close: "popClose", chime: "chime", ding: "ding", delete: "delete", error: "error", pick: "pick", drop: "drop" };
export function nWake() { const g = typeof window !== "undefined" && window.glassSound; g && g.wake(); }
export function nTick(kind = "tap", opts) {
  const g = typeof window !== "undefined" && window.glassSound;
  if (g) g.play(NSND[kind] || kind, opts);
}

/* ---------- Phones: is the screen narrow? ---------- */
export function useIsPhone(max = 640) {
  const q = typeof window !== "undefined" && window.matchMedia ? window.matchMedia(`(max-width: ${max}px)`) : null;
  const [m, setM] = useState(q ? q.matches : false);
  useEffect(() => { if (!q) return; const f = () => setM(q.matches); q.addEventListener ? q.addEventListener("change", f) : q.addListener(f); return () => (q.removeEventListener ? q.removeEventListener("change", f) : q.removeListener(f)); }, []);
  return m;
}
function useOutside(open, ref, close) {
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
}

/* ---------- Bottom sheet: slides up, drag the handle down to close ---------- */
export function GlassSheet({ open, onClose, title, children, inline = false, className = "" }) {
  const [show, setShow] = useState(open);
  const [drag, setDrag] = useState(0);
  const [vars, setVars] = useState(null);
  const st = useRef(null);
  const panel = useRef(null);
  const here = useRef(null);
  useEffect(() => { if (open) setShow(true); else if (show) { const t = setTimeout(() => setShow(false), reduce() ? 0 : 260); return () => clearTimeout(t); } }, [open]);
  const was = useRef(open);
  useEffect(() => { if (open !== was.current) nTick(open ? "pop" : "close"); was.current = open; }, [open]);
  useLayoutEffect(() => {
    // A sheet is moved to the end of the page, so it carries the theme colours with it
    if (!open || inline || !here.current) return;
    const cs = getComputedStyle(here.current), v = {};
    ["--glass-tint", "--glass-on-tint", "--glass-fg", "--glass-shadow", "--glass-radius", "--bg", "--fg", "--line", "--muted"].forEach((k) => { const x = cs.getPropertyValue(k); if (x) v[k] = x.trim(); });
    v.color = cs.getPropertyValue("--glass-fg") || undefined;
    const t = here.current.closest("[data-glass-tint]"), th = here.current.closest("[data-glass-theme]");
    setVars({ style: v, tint: t ? t.getAttribute("data-glass-tint") : undefined, theme: th ? th.getAttribute("data-glass-theme") : undefined });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === "Escape" && onClose && onClose();
    document.addEventListener("keydown", esc);
    const t = setTimeout(() => { panel.current && panel.current.focus({ preventScroll: true }); }, 60);
    return () => { document.removeEventListener("keydown", esc); clearTimeout(t); };
  }, [open]);
  const down = (e) => { st.current = { y: e.clientY, t: performance.now() }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => { if (st.current) setDrag(Math.max(0, e.clientY - st.current.y)); };
  const up = (e) => {
    if (!st.current) return;
    const v = (e.clientY - st.current.y) / Math.max(1, performance.now() - st.current.t);
    st.current = null;
    if (drag > 90 || v > 0.6) { onClose && onClose(); }
    setDrag(0);
  };
  const body = show && (
    <div className={"gn-sheet-wrap " + className} data-inline={inline ? "" : undefined} data-open={open ? "" : undefined} style={inline || !vars ? undefined : vars.style} data-glass-tint={!inline && vars ? vars.tint : undefined} data-glass-theme={!inline && vars ? vars.theme : undefined}>
      <div className="gn-sheet-back" onClick={onClose} />
      <div ref={panel} tabIndex={-1} className="gn-sheet gn" role="dialog" aria-modal={inline ? undefined : "true"} aria-label={title} style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}>
        <div className="gn-sheet-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><i /></div>
        {title && <div className="gn-sheet-head"><b>{title}</b><button type="button" className="gn-x" aria-label="Close" onClick={onClose}><I d={NP.x} size={15} /></button></div>}
        <div className="gn-sheet-body">{children}</div>
      </div>
    </div>
  );
  if (inline) return body || null;
  return <>
    <span ref={here} hidden />
    {body && typeof document !== "undefined" ? createPortal(body, document.body) : null}
  </>;
}

/* A menu that floats on wide screens and becomes a sheet on phones */
export function GlassMenuSheet({ open, onClose, title, anchor = "up", align = "start", children, sheetInline = false }) {
  const phone = useIsPhone();
  const box = useRef(null);
  useOutside(open && !phone, box, onClose);
  if (phone) return <GlassSheet open={open} onClose={onClose} title={title} inline={sheetInline}>{children}</GlassSheet>;
  if (!open) return null;
  return <div ref={box} className="gn-pop gn" data-anchor={anchor} data-align={align} role="menu" aria-label={title}>{children}</div>;
}

/* ---------- Switch used inside menus ---------- */
function Sw({ on }) { return <span className="gn-sw" data-on={on ? "" : undefined} aria-hidden="true"><i /></span>; }

/* =====================================================================
   1. Code block
   ===================================================================== */
const KW = new Set("const let var function return if else for while import from export default async await new class extends try catch throw of in def print lambda None True False self elif pass with as yield null true false undefined this".split(" "));
function tokens(line) {
  const out = []; const re = /(\/\/.*$|#.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b|\s+|.)/g;
  let m; while ((m = re.exec(line))) {
    const t = m[0];
    const k = /^(\/\/|#)/.test(t) ? "c" : /^["'`]/.test(t) ? "s" : /^\d/.test(t) ? "n" : KW.has(t) ? "k" : /^[A-Za-z_$]/.test(t) && line[m.index + t.length] === "(" ? "f" : "";
    out.push(k ? <span key={m.index} className={"gn-t" + k}>{t}</span> : t);
  }
  return out;
}
export function GlassCodeBlock({ code = "", lang = "js", filename, onRun, maxLines = 14, className = "" }) {
  const lines = code.replace(/\n$/, "").split("\n");
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [open, setOpen] = useState(lines.length <= maxLines);
  const [run, setRun] = useState(null); // {lines:[], done, ms}
  const copy = () => { try { navigator.clipboard && navigator.clipboard.writeText(code); } catch (e) {} setCopied(true); nTick("tap"); setTimeout(() => setCopied(false), 1400); };
  const go = async () => {
    if (!onRun || (run && !run.done)) return;
    const t0 = performance.now(); setRun({ lines: [], done: false });
    const it = await onRun(code);
    const list = Array.isArray(it) ? it : [String(it)];
    for (let i = 0; i < list.length; i++) { await new Promise((r) => setTimeout(r, reduce() ? 0 : 260)); setRun((r) => ({ ...r, lines: [...r.lines, list[i]] })); }
    setRun((r) => ({ ...r, done: true, ms: Math.round(performance.now() - t0) })); nTick("done");
  };
  return (
    <div className={"gn gn-code " + className} data-wrap={wrap ? "" : undefined}>
      <div className="gn-code-bar">
        <span className="gn-code-lang"><i data-l={lang} />{filename || lang}</span>
        <span className="gn-code-tools">
          <button type="button" className="gn-ib" aria-pressed={wrap} aria-label="Wrap long lines" title="Wrap lines" onClick={() => setWrap(!wrap)}><I d={NP.wrap} size={15} /></button>
          {onRun && <button type="button" className="gn-chip-btn" data-busy={run && !run.done ? "" : undefined} onClick={go}>{run && !run.done ? <span className="gn-spin" /> : <I d={NP.play} size={12} fill="currentColor" w={0} />}Run</button>}
          <button type="button" className="gn-chip-btn" data-done={copied ? "" : undefined} onClick={copy}><span className="gn-swap"><I d={NP.copy} size={13} /><I d={NP.check} size={13} w={2.4} /></span>{copied ? "Copied" : "Copy"}</button>
        </span>
      </div>
      <div className="gn-code-scroll" data-clip={!open ? "" : undefined} style={{ "--rows": open ? lines.length : maxLines }}>
        <pre><code>{lines.map((l, i) => <span key={i} className="gn-code-ln"><em>{i + 1}</em><span>{tokens(l)}{"\n"}</span></span>)}</code></pre>
      </div>
      {!open && <button type="button" className="gn-code-more" onClick={() => setOpen(true)}>Show all {lines.length} lines <I d={NP.chev} size={14} /></button>}
      {run && (
        <div className="gn-code-out" aria-live="polite">
          <div className="gn-code-out-head"><I d={NP.term} size={13} />Output{run.done && <em>Done in {(run.ms / 1000).toFixed(1)}s</em>}{!run.done && <span className="gn-dots"><i /><i /><i /></span>}</div>
          {run.lines.map((l, i) => <div key={i} className="gn-code-out-ln">{l}</div>)}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   2. Attachments
   ===================================================================== */
const KIND_IC = { image: NP.image, pdf: NP.file, sheet: NP.bars, doc: NP.file, code: NP.code };
function Ring({ p, size = 22 }) {
  const r = (size - 4) / 2, c = 2 * Math.PI * r;
  return <svg className="gn-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={r} /><circle cx={size / 2} cy={size / 2} r={r} style={{ strokeDasharray: c, strokeDashoffset: c * (1 - p) }} /></svg>;
}
export function GlassAttachmentChip({ file, onRemove, onRetry }) {
  const { name, kind = "doc", status = "ready", progress = 0, note, thumb, size } = file;
  return (
    <div className="gn-att" data-status={status} data-kind={kind}>
      <span className="gn-att-thumb" style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}>
        {!thumb && <I d={KIND_IC[kind] || NP.file} size={17} />}
        {status === "uploading" && <span className="gn-att-cover"><Ring p={progress} /></span>}
      </span>
      <span className="gn-att-txt">
        <b>{name}</b>
        <em>{status === "uploading" ? `Uploading ${Math.round(progress * 100)}%` : status === "reading" ? (note || "Reading…") : status === "error" ? "Couldn't upload" : (note || size || "Ready")}</em>
      </span>
      {status === "ready" && <span className="gn-att-ok"><I d={NP.check} size={11} w={3} /></span>}
      {status === "error" && onRetry && <button type="button" className="gn-ib" aria-label={`Try ${name} again`} onClick={onRetry}><I d={NP.retry} size={14} /></button>}
      {onRemove && <button type="button" className="gn-att-x" aria-label={`Remove ${name}`} onClick={onRemove}><I d={NP.x} size={11} w={2.4} /></button>}
    </div>
  );
}
export function GlassAttachments({ files = [], onAdd, onRemove, onRetry, accept, anchor = "up", children, className = "" }) {
  const [menu, setMenu] = useState(false);
  const [over, setOver] = useState(false);
  const inp = useRef(null);
  const pick = (mode) => { setMenu(false); if (inp.current) { inp.current.accept = mode === "image" ? "image/*" : accept || ""; if (mode === "camera") inp.current.setAttribute("capture", "environment"); else inp.current.removeAttribute("capture"); inp.current.click(); } };
  const take = (list) => { const fs = [...(list || [])]; if (fs.length && onAdd) onAdd(fs); };
  return (
    <div className={"gn gn-atts " + className} data-over={over ? "" : undefined}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}>
      {files.length > 0 && <div className="gn-atts-row">{files.map((f) => <GlassAttachmentChip key={f.id} file={f} onRemove={onRemove && (() => onRemove(f.id))} onRetry={onRetry && (() => onRetry(f.id))} />)}</div>}
      <div className="gn-atts-bar">
        <span className="gn-rel">
          <button type="button" className="gn-ib gn-ib-lg" aria-label="Add files" aria-expanded={menu} onClick={() => { nTick("tap"); setMenu(!menu); }}><I d={NP.plus} size={18} /></button>
          <GlassMenuSheet open={menu} onClose={() => setMenu(false)} title="Add to chat" anchor={anchor}>
            <div className="gn-add-grid">
              <button type="button" onClick={() => pick("camera")}><span><I d={NP.camera} size={20} /></span>Camera</button>
              <button type="button" onClick={() => pick("image")}><span><I d={NP.image} size={20} /></span>Photos</button>
              <button type="button" onClick={() => pick("file")}><span><I d={NP.folder} size={20} /></span>Files</button>
            </div>
          </GlassMenuSheet>
        </span>
        {children}
      </div>
      <input ref={inp} type="file" multiple hidden onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
      {over && <div className="gn-drop"><I d={NP.down} size={22} />Drop to add</div>}
    </div>
  );
}

/* =====================================================================
   3. Modes and tools
   ===================================================================== */
const DEF_MODES = [{ id: "fast", label: "Fast", icon: NP.bolt, hint: "Quick answers" }, { id: "think", label: "Think", icon: NP.brain, hint: "Reasons step by step" }, { id: "research", label: "Research", icon: NP.telescope, hint: "Reads many sources, takes minutes" }];
export function GlassModeSwitch({ modes = DEF_MODES, value, onChange, className = "" }) {
  const box = useRef(null);
  const [pill, setPill] = useState(null);
  useLayoutEffect(() => {
    const b = box.current && box.current.querySelector(`[data-id="${value}"]`);
    if (b) setPill({ x: b.offsetLeft, w: b.offsetWidth });
  }, [value, modes.length]);
  return (
    <div ref={box} className={"gn gn-modes " + className} role="radiogroup" aria-label="Mode">
      {pill && <span className="gn-modes-pill" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />}
      {modes.map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={m.id === value} data-id={m.id} title={m.hint} onClick={() => { if (m.id !== value) { nTick("tap"); onChange && onChange(m.id); } }}>
          <I d={m.icon} size={14} />{m.label}
        </button>
      ))}
    </div>
  );
}
export function GlassToolsMenu({ tools = [], value = [], onChange, anchor = "up", className = "" }) {
  const [open, setOpen] = useState(false);
  const on = (id) => value.includes(id);
  const flip = (id) => { nTick("tap"); onChange && onChange(on(id) ? value.filter((x) => x !== id) : [...value, id]); };
  const groups = [...new Set(tools.map((t) => t.group || ""))];
  return (
    <span className={"gn gn-rel gn-tools " + className}>
      <button type="button" className="gn-tools-btn" aria-expanded={open} onClick={() => { nTick("tap"); setOpen(!open); }}>
        <I d={NP.plus} size={16} /><span>Tools</span>{value.length > 0 && <b key={value.length}>{value.length}</b>}
      </button>
      <GlassMenuSheet open={open} onClose={() => setOpen(false)} title="Tools" anchor={anchor}>
        {groups.map((g) => (
          <div key={g} className="gn-menu-group">
            {g && <span className="gn-menu-head">{g}</span>}
            {tools.filter((t) => (t.group || "") === g).map((t) => (
              <button key={t.id} type="button" role="menuitemcheckbox" aria-checked={on(t.id)} className="gn-menu-row" onClick={() => flip(t.id)}>
                <span className="gn-menu-ic" style={t.hue != null ? { "--h": t.hue } : undefined}><I d={t.icon || NP.spark} size={16} /></span>
                <span className="gn-menu-txt"><b>{t.label}</b>{t.hint && <em>{t.hint}</em>}</span>
                <Sw on={on(t.id)} />
              </button>
            ))}
          </div>
        ))}
      </GlassMenuSheet>
    </span>
  );
}
export function GlassToolChips({ tools = [], value = [], onRemove }) {
  return (
    <span className="gn gn-tchips">
      {value.map((id) => { const t = tools.find((x) => x.id === id); if (!t) return null; return (
        <span key={id} className="gn-tchip" style={t.hue != null ? { "--h": t.hue } : undefined}><I d={t.icon || NP.spark} size={13} />{t.short || t.label}{onRemove && <button type="button" aria-label={`Turn off ${t.label}`} onClick={() => onRemove(id)}><I d={NP.x} size={11} w={2.4} /></button>}</span>
      ); })}
    </span>
  );
}

/* =====================================================================
   4. Stop and steer: send turns into stop while a reply streams; anything
   typed meanwhile is queued as a steer
   ===================================================================== */
export function GlassSteerComposer({ busy, onSend, onStop, onSteer, queued = [], onUnqueue, placeholder = "Ask anything", leading, className = "" }) {
  const [text, setText] = useState("");
  const ta = useRef(null);
  useLayoutEffect(() => { const t = ta.current; if (t) { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px"; } }, [text]);
  const submit = () => {
    const v = text.trim();
    if (busy && !v) { nTick("soft"); onStop && onStop(); return; }
    if (!v) return;
    nTick("send");
    if (busy) onSteer && onSteer(v); else onSend && onSend(v);
    setText("");
  };
  return (
    <div className={"gn gn-steer " + className} data-busy={busy ? "" : undefined}>
      {queued.length > 0 && (
        <div className="gn-queue">
          {queued.map((q, i) => <span key={q + i} className="gn-qchip"><I d={NP.retry} size={12} /><span>Next: {q}</span>{onUnqueue && <button type="button" aria-label="Remove" onClick={() => onUnqueue(i)}><I d={NP.x} size={11} w={2.4} /></button>}</span>)}
        </div>
      )}
      <div className="gn-steer-row">
        {leading}
        <textarea ref={ta} rows={1} value={text} placeholder={busy ? "Add to what it's doing…" : placeholder} aria-label="Message" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
        <button type="button" className="gn-send" data-mode={busy ? (text.trim() ? "steer" : "stop") : "send"} aria-label={busy ? (text.trim() ? "Add to the reply" : "Stop") : "Send"} disabled={!busy && !text.trim()} onClick={submit}>
          <span className="gn-send-ring" aria-hidden="true" />
          <span className="gn-send-ic"><I d={NP.send} size={16} w={2.2} /><I d={NP.stop} size={12} fill="currentColor" w={0} /><I d={NP.plus} size={16} w={2.2} /></span>
        </button>
      </div>
    </div>
  );
}
/* Streams text word by word; pass running={false} to stop it where it is */
export function useStream(full, { running = true, speed = 28, onDone, chime = true } = {}) {
  const [n, setN] = useState(0);
  const words = useMemo(() => full.split(/(\s+)/), [full]);
  useEffect(() => { setN(0); }, [full]);
  useEffect(() => {
    if (!running) return;
    if (n >= words.length) { if (chime && n > 2) nTick("chime"); onDone && onDone(); return; }
    const t = setTimeout(() => setN((x) => x + 2), reduce() ? 0 : speed);
    return () => clearTimeout(t);
  }, [n, running, words.length]);
  return { text: words.slice(0, n).join(""), done: n >= words.length };
}

/* =====================================================================
   5. Edit and resend
   ===================================================================== */
export function GlassEditableMessage({ text, onResend, edited = 0, className = "" }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(text);
  const ta = useRef(null);
  useEffect(() => { setV(text); }, [text]);
  useLayoutEffect(() => { if (edit && ta.current) { const t = ta.current; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, [edit, v]);
  const send = () => { const s = v.trim(); if (!s) return; setEdit(false); nTick("send"); if (s !== text) onResend && onResend(s); };
  return (
    <div className={"gn gn-edit " + className} data-editing={edit ? "" : undefined}>
      {edit ? (
        <div className="gn-edit-box">
          <textarea ref={ta} value={v} aria-label="Edit your message" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } if (e.key === "Escape") { setV(text); setEdit(false); } }} />
          <div className="gn-edit-act"><span>Replies after this will be replaced</span><button type="button" className="gn-btn" onClick={() => { setV(text); setEdit(false); }}>Cancel</button><button type="button" className="gn-btn gn-btn-main" onClick={send}>Send</button></div>
        </div>
      ) : (
        <>
          <div className="gn-edit-bub">{text}</div>
          <div className="gn-edit-meta">
            {edited > 0 && <span>Edited</span>}
            <button type="button" className="gn-ib" aria-label="Edit message" onClick={() => { nTick("tap"); setEdit(true); }}><I d={NP.pencil} size={14} /></button>
          </div>
        </>
      )}
    </div>
  );
}

/* =====================================================================
   6. Jump to latest: follows a streaming reply until you scroll up
   ===================================================================== */
export function GlassChatScroll({ children, deps = [], height = 360, className = "" }) {
  const box = useRef(null);
  const [stuck, setStuck] = useState(true);
  const [fresh, setFresh] = useState(0);
  const atEnd = () => { const b = box.current; return b ? b.scrollHeight - b.scrollTop - b.clientHeight < 24 : true; };
  useEffect(() => {
    const b = box.current; if (!b) return;
    if (stuck) b.scrollTop = b.scrollHeight; else setFresh((f) => f + 1);
  }, deps);
  const onScroll = () => { const e = atEnd(); setStuck(e); if (e) setFresh(0); };
  const jump = () => { const b = box.current; if (!b) return; nTick("tap"); b.scrollTo({ top: b.scrollHeight, behavior: reduce() ? "auto" : "smooth" }); setStuck(true); setFresh(0); };
  return (
    <div className={"gn gn-cs " + className} style={{ "--h": typeof height === "number" ? height + "px" : height }}>
      <div ref={box} className="gn-cs-box" onScroll={onScroll}>{children}</div>
      <button type="button" className="gn-jump" data-show={!stuck ? "" : undefined} tabIndex={stuck ? -1 : 0} onClick={jump}>
        <I d={NP.down} size={14} w={2.2} />{fresh > 0 ? "New reply" : "Latest"}{fresh > 0 && <i />}
      </button>
    </div>
  );
}

/* =====================================================================
   7. Memory
   ===================================================================== */
export function GlassMemory({ items = [], onForget, onRestore, on = true, onToggle, temporary = false, onTemporary, className = "" }) {
  const [gone, setGone] = useState(null);
  const forget = (it) => { nTick("soft"); setGone(it); onForget && onForget(it.id); };
  return (
    <div className={"gn gn-mem " + className} data-off={!on ? "" : undefined}>
      <div className="gn-mem-head">
        <span className="gn-mem-ic"><I d={NP.brain} size={17} /></span>
        <span><b>Memory</b><em>{on ? `${items.length} things it remembers about you` : "Off. New chats start fresh."}</em></span>
        <button type="button" className="gn-swbtn" role="switch" aria-checked={on} aria-label="Use memory" onClick={() => { nTick("tap"); onToggle && onToggle(!on); }}><Sw on={on} /></button>
      </div>
      <ul className="gn-mem-list">
        {items.map((it, i) => (
          <li key={it.id} style={{ "--i": i }}>
            <span className="gn-mem-dot" style={{ "--h": it.hue != null ? it.hue : 250 }} />
            <span className="gn-mem-txt">{it.text}{it.when && <em>{it.when}</em>}</span>
            <button type="button" className="gn-ib" aria-label={`Forget: ${it.text}`} onClick={() => forget(it)}><I d={NP.trash} size={14} /></button>
          </li>
        ))}
        {!items.length && <li className="gn-mem-none">Nothing saved yet.</li>}
      </ul>
      {gone && <div className="gn-mem-undo" key={gone.id}><span>Forgot “{gone.text.length > 34 ? gone.text.slice(0, 34) + "…" : gone.text}”</span><button type="button" onClick={() => { onRestore && onRestore(gone); setGone(null); }}>Undo</button></div>}
      <button type="button" className="gn-temp" aria-pressed={temporary} onClick={() => { nTick("tap"); onTemporary && onTemporary(!temporary); }}>
        <I d={NP.ghost} size={16} /><span><b>Temporary chat</b><em>Not saved, not remembered</em></span><Sw on={temporary} />
      </button>
    </div>
  );
}
export function GlassMemoryNote({ text, onManage }) {
  return (
    <div className="gn gn-memnote" role="status">
      <span className="gn-memnote-ic"><I d={NP.spark} size={12} /></span>
      <span>Saved to memory: <b>{text}</b></span>
      {onManage && <button type="button" onClick={onManage}>Manage</button>}
    </div>
  );
}

/* =====================================================================
   8. Slash commands
   ===================================================================== */
export function GlassSlashInput({ commands = [], onSend, placeholder = "Type / for commands", className = "" }) {
  const [text, setText] = useState("");
  const [cmd, setCmd] = useState(null);
  const [hi, setHi] = useState(0);
  const ta = useRef(null);
  const q = !cmd && /^\/(\w*)$/.exec(text);
  const list = q ? commands.filter((c) => c.id.startsWith(q[1].toLowerCase()) || c.label.toLowerCase().includes(q[1].toLowerCase())) : [];
  const open = !!q;
  useEffect(() => setHi(0), [text]);
  const choose = (c) => { nTick("tap"); setCmd(c); setText(""); setTimeout(() => ta.current && ta.current.focus(), 0); };
  const send = () => { if (!text.trim() && !cmd) return; nTick("send"); onSend && onSend(text.trim(), cmd); setText(""); setCmd(null); };
  return (
    <div className={"gn gn-slash " + className}>
      {open && (
        <ul className="gn-slash-pop" role="listbox" aria-label="Commands">
          {list.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === hi} onMouseEnter={() => setHi(i)} onMouseDown={(e) => { e.preventDefault(); choose(c); }}>
              <span className="gn-menu-ic" style={{ "--h": c.hue != null ? c.hue : 250 }}><I d={c.icon || NP.slash} size={15} /></span>
              <span className="gn-menu-txt"><b>/{c.id}</b><em>{c.hint}</em></span>
              {i === hi && <kbd>↵</kbd>}
            </li>
          ))}
          {!list.length && <li className="gn-slash-none">No command called “{q[1]}”</li>}
        </ul>
      )}
      <div className="gn-slash-row">
        {cmd && <span className="gn-slash-tok" style={{ "--h": cmd.hue != null ? cmd.hue : 250 }}><I d={cmd.icon || NP.slash} size={13} />/{cmd.id}<button type="button" aria-label="Remove command" onClick={() => setCmd(null)}><I d={NP.x} size={10} w={2.6} /></button></span>}
        <textarea ref={ta} rows={1} value={text} placeholder={cmd ? cmd.placeholder || "Add details…" : placeholder} aria-label="Message"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (open && list.length) {
              if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % list.length); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + list.length) % list.length); return; }
              if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); choose(list[hi]); return; }
            }
            if (e.key === "Escape" && open) { setText(""); return; }
            if (e.key === "Backspace" && !text && cmd) { setCmd(null); return; }
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }} />
        <button type="button" className="gn-send" data-mode="send" aria-label="Send" disabled={!text.trim() && !cmd} onClick={send}><span className="gn-send-ic"><I d={NP.send} size={16} w={2.2} /></span></button>
      </div>
    </div>
  );
}

/* =====================================================================
   9. Read aloud: speaks a reply and lights each word as it goes
   ===================================================================== */
export function GlassReadAloud({ text, className = "" }) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const [state, setState] = useState("idle"); // idle, playing, paused
  const [w, setW] = useState(-1);
  const [rate, setRate] = useState(1);
  const timer = useRef(null);
  const utter = useRef(null);
  const real = typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  const starts = useMemo(() => { const a = []; let p = 0; words.forEach((x, i) => { a.push(p); p += x.length; }); return a; }, [words]);
  const stop = () => { clearInterval(timer.current); if (real) try { speechSynthesis.cancel(); } catch (e) {} setState("idle"); setW(-1); };
  useEffect(() => () => stop(), []);
  const tick = (from) => {
    clearInterval(timer.current); let i = from;
    timer.current = setInterval(() => {
      do { i++; } while (i < words.length && !words[i].trim());
      if (i >= words.length) { clearInterval(timer.current); setState("idle"); setW(-1); nTick("done"); return; }
      setW(i);
    }, 330 / rate);
  };
  const play = () => {
    nTick("tap");
    if (state === "playing") { setState("paused"); clearInterval(timer.current); if (real) try { speechSynthesis.pause(); } catch (e) {} return; }
    if (state === "paused") { setState("playing"); if (real && utter.current) try { speechSynthesis.resume(); } catch (e) {} if (!utter.current) tick(w); return; }
    setState("playing"); setW(0);
    let ok = false;
    if (real) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text); u.rate = rate; utter.current = u;
        u.onboundary = (e) => { ok = true; clearInterval(timer.current); const k = starts.findIndex((s, j) => s <= e.charIndex && (starts[j + 1] == null || starts[j + 1] > e.charIndex)); if (k >= 0) setW(k); };
        u.onend = () => { utter.current = null; clearInterval(timer.current); setState("idle"); setW(-1); };
        speechSynthesis.speak(u);
      } catch (e) { utter.current = null; }
    }
    tick(0); // a timer lights words until the voice reports where it is
    setTimeout(() => { if (ok) clearInterval(timer.current); }, 900);
  };
  const p = w < 0 ? 0 : w / Math.max(1, words.length - 1);
  return (
    <div className={"gn gn-ra " + className} data-state={state}>
      <p className="gn-ra-text">{words.map((x, i) => (x.trim() ? <span key={i} data-on={i === w ? "" : undefined} data-read={w >= 0 && i < w ? "" : undefined}>{x}</span> : x))}</p>
      <div className="gn-ra-bar">
        <button type="button" className="gn-ra-play" aria-label={state === "playing" ? "Pause" : "Read aloud"} onClick={play}>
          <span className="gn-swap" data-on={state === "playing" ? "" : undefined}><I d={NP.speaker} size={16} /><I d={NP.pause} size={14} fill="currentColor" w={0} /></span>
        </button>
        <span className="gn-ra-track"><i style={{ transform: `scaleX(${p})` }} /></span>
        <span className="gn-ra-rates" role="radiogroup" aria-label="Speed">
          {[1, 1.25, 1.5, 2].map((r) => <button key={r} type="button" role="radio" aria-checked={rate === r} onClick={() => { setRate(r); if (state === "playing") { if (real) { stop(); } else tick(w); } }}>{r}×</button>)}
        </span>
        {state !== "idle" && <button type="button" className="gn-ib" aria-label="Stop" onClick={stop}><I d={NP.stop} size={12} fill="currentColor" w={0} /></button>}
      </div>
    </div>
  );
}

/* =====================================================================
   10. Answer cards: a table, a checklist and a key figure
   ===================================================================== */
export function GlassAnswerTable({ columns = [], rows = [], caption, className = "" }) {
  const [sort, setSort] = useState(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const { i, d } = sort; const num = (v) => parseFloat(String(v).replace(/[^\d.-]/g, ""));
    return [...rows].sort((a, b) => { const x = num(a[i]), y = num(b[i]); const r = isNaN(x) || isNaN(y) ? String(a[i]).localeCompare(String(b[i])) : x - y; return r * d; });
  }, [rows, sort]);
  return (
    <div className={"gn gn-atab " + className}>
      {caption && <div className="gn-card-cap"><I d={NP.list} size={14} />{caption}</div>}
      <div className="gn-atab-scroll">
        <table>
          <thead><tr>{columns.map((c, i) => <th key={c} aria-sort={sort && sort.i === i ? (sort.d > 0 ? "ascending" : "descending") : undefined}><button type="button" onClick={() => { nTick("tap"); setSort((s) => (s && s.i === i ? { i, d: -s.d } : { i, d: 1 })); }}>{c}<I d={sort && sort.i === i && sort.d < 0 ? NP.up : NP.down} size={12} /></button></th>)}</tr></thead>
          <tbody>{sorted.map((r, k) => <tr key={r.join("|")} style={{ "--i": k }}>{r.map((v, i) => (i === 0 ? <th key={i} scope="row">{v}</th> : <td key={i}>{v}</td>))}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
export function GlassAnswerChecklist({ title, items = [], className = "" }) {
  const [done, setDone] = useState(() => new Set(items.filter((x) => x.done).map((x) => x.id)));
  const p = items.length ? done.size / items.length : 0;
  return (
    <div className={"gn gn-chk " + className}>
      <div className="gn-card-cap"><I d={NP.check} size={14} />{title}<span className="gn-chk-n">{done.size} of {items.length}</span></div>
      <span className="gn-chk-bar"><i style={{ transform: `scaleX(${p})` }} /></span>
      <ul>
        {items.map((it) => { const on = done.has(it.id); return (
          <li key={it.id}><button type="button" role="checkbox" aria-checked={on} onClick={() => { nTick(on ? "soft" : done.size + 1 === items.length ? "done" : "tap"); setDone((s) => { const n = new Set(s); on ? n.delete(it.id) : n.add(it.id); return n; }); }}>
            <span className="gn-chk-box"><I d={NP.check} size={12} w={3} /></span><span className="gn-chk-txt">{it.text}{it.note && <em>{it.note}</em>}</span>
          </button></li>
        ); })}
      </ul>
    </div>
  );
}
export function GlassAnswerStat({ label, value, delta, sub, bars = [], className = "" }) {
  const max = Math.max(...bars, 1);
  return (
    <div className={"gn gn-astat " + className}>
      <div className="gn-astat-top"><span>{label}</span>{delta && <em data-down={/^[-−]/.test(delta) ? "" : undefined}>{delta}</em>}</div>
      <b>{value}</b>
      {sub && <span className="gn-astat-sub">{sub}</span>}
      {bars.length > 0 && <span className="gn-astat-bars">{bars.map((v, i) => <i key={i} style={{ "--v": v / max, "--i": i }} />)}</span>}
    </div>
  );
}

/* =====================================================================
   11. Background tasks
   ===================================================================== */
export function GlassTaskTray({ tasks = [], onOpen, onCancel, defaultOpen = false, className = "" }) {
  const [open, setOpen] = useState(() => defaultOpen && !(typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 640px)").matches));
  const phone = useIsPhone();
  const run = tasks.filter((t) => t.status === "running" || t.status === "queued");
  const done = tasks.filter((t) => t.status === "done");
  const doneN = useRef(done.length);
  useEffect(() => { if (done.length > doneN.current) nTick("ding"); doneN.current = done.length; }, [done.length]);
  const list = (
    <ul className="gn-tasks">
      {tasks.map((t) => (
        <li key={t.id} data-status={t.status}>
          <span className="gn-task-ic">{t.status === "done" ? <span className="gn-task-ok"><I d={NP.check} size={13} w={2.6} /></span> : t.status === "failed" ? <I d={NP.x} size={14} /> : <><Ring p={t.progress || 0} size={28} /><i className="gn-task-pct">{Math.round((t.progress || 0) * 100)}</i></>}</span>
          <span className="gn-task-txt"><b>{t.title}</b><em>{t.status === "done" ? (t.result || "Ready") : t.status === "queued" ? "Waiting to start" : t.status === "failed" ? "Something went wrong" : t.detail}{t.eta && t.status === "running" ? ` · ${t.eta}` : ""}</em></span>
          {t.status === "done" ? <button type="button" className="gn-btn" onClick={() => onOpen && onOpen(t.id)}>Open</button>
            : t.status !== "failed" && onCancel ? <button type="button" className="gn-ib" aria-label={`Cancel ${t.title}`} onClick={() => onCancel(t.id)}><I d={NP.x} size={14} /></button> : null}
        </li>
      ))}
      {!tasks.length && <li className="gn-tasks-none">Nothing running</li>}
    </ul>
  );
  return (
    <div className={"gn gn-tray " + className} data-open={open && !phone ? "" : undefined}>
      <button type="button" className="gn-tray-pill" aria-expanded={open} onClick={() => { nTick("tap"); setOpen(!open); }}>
        <span className="gn-tray-rings">{run.slice(0, 3).map((t) => <Ring key={t.id} p={t.progress || 0} size={18} />)}{!run.length && done.length > 0 && <span className="gn-task-ok gn-task-ok-sm"><I d={NP.check} size={10} w={3} /></span>}</span>
        <span>{run.length ? `${run.length} running` : done.length ? `${done.length} ready` : "No tasks"}</span>
        {done.length > 0 && run.length > 0 && <b>{done.length} ready</b>}
        <I d={NP.chev} size={14} />
      </button>
      {phone ? <GlassSheet open={open} onClose={() => setOpen(false)} title="Tasks">{list}</GlassSheet> : open && <div className="gn-tray-panel">{list}</div>}
    </div>
  );
}

/* =====================================================================
   12. Live browser view: watch an agent click through a site
   ===================================================================== */
export function GlassBrowserView({ url = "example.com", steps = [], running = true, onFinish, page, className = "" }) {
  const [i, setI] = useState(0);
  const [mine, setMine] = useState(false);
  const [typed, setTyped] = useState("");
  const [click, setClick] = useState(0);
  const live = running && !mine && i < steps.length;
  const s = steps[Math.min(i, steps.length - 1)] || {};
  useEffect(() => {
    if (!live) return;
    setTyped("");
    let t2, k = 0;
    const t1 = setTimeout(() => {
      if (s.action === "type" && s.text) { t2 = setInterval(() => { k++; setTyped(s.text.slice(0, k)); if (k >= s.text.length) clearInterval(t2); }, 45); }
      else { setClick((c) => c + 1); nTick("tap"); }
    }, 750);
    const t3 = setTimeout(() => { if (i + 1 >= steps.length) { setI(steps.length); nTick("done"); onFinish && onFinish(); } else setI(i + 1); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t3); clearInterval(t2); };
  }, [i, live]);
  return (
    <div className={"gn gn-bv " + className} data-mine={mine ? "" : undefined}>
      <div className="gn-bv-win">
        <div className="gn-bv-bar"><span className="gn-bv-dots"><i /><i /><i /></span><span className="gn-bv-url"><I d={NP.lock} size={10} />{url}</span>{live ? <span className="gn-live"><i />Live</span> : <span className="gn-live" data-off="">{mine ? "You" : "Done"}</span>}</div>
        <div className="gn-bv-page">
          {page || (
            <div className="gn-bv-fake">
              <div className="gn-bv-search"><I d={NP.globe} size={13} /><span>{typed || (i > 0 && steps[0] && steps[0].text) || "Search hotels"}{live && s.action === "type" && <span className="gn-bv-caret" />}</span></div>
              <div className="gn-bv-cards">{[0, 1, 2].map((k) => <div key={k} className="gn-bv-card" data-hit={s.target === k && click ? "" : undefined}><span /><b /><i /></div>)}</div>
            </div>
          )}
          {live && <span className="gn-bv-cursor" style={{ left: (s.x || 50) + "%", top: (s.y || 50) + "%" }}><I d={NP.cursor} size={18} fill="#111" w={1.2} />{click > 0 && <i key={click} className="gn-bv-ripple" />}</span>}
          {mine && <div className="gn-bv-mine"><span>You're in control. The agent is waiting.</span><button type="button" className="gn-btn gn-btn-main" onClick={() => { setMine(false); nTick("tap"); }}>Hand back</button></div>}
        </div>
      </div>
      <ol className="gn-bv-log">
        {steps.map((st, k) => <li key={k} data-state={k < i ? "done" : k === i && live ? "now" : "next"}><span>{k < i ? <I d={NP.check} size={11} w={3} /> : k + 1}</span>{st.label}</li>)}
      </ol>
      {running && i < steps.length && !mine && <button type="button" className="gn-btn gn-bv-take" onClick={() => { setMine(true); nTick("warn"); }}><I d={NP.hand} size={15} />Take over</button>}
    </div>
  );
}

/* =====================================================================
   13. Checkpoints: undo the agent's work back to any step
   ===================================================================== */
export function GlassCheckpoints({ items = [], onRestore, className = "" }) {
  const [ask, setAsk] = useState(null);
  const [cut, setCut] = useState(null);
  const n = ask == null ? 0 : items.length - 1 - items.findIndex((x) => x.id === ask);
  const restore = () => { const k = items.findIndex((x) => x.id === ask); setCut(k); nTick("warn"); setTimeout(() => { onRestore && onRestore(ask); setCut(null); setAsk(null); }, reduce() ? 0 : 450); };
  return (
    <ol className={"gn gn-cp " + className}>
      {items.map((it, k) => (
        <li key={it.id} data-gone={cut != null && k > cut ? "" : undefined} data-last={k === items.length - 1 ? "" : undefined} style={{ "--i": k }}>
          <span className="gn-cp-node" />
          <div className="gn-cp-body">
            <div className="gn-cp-top"><b>{it.title}</b><em>{it.time}</em></div>
            {it.detail && <p>{it.detail}</p>}
            {it.files && <span className="gn-cp-files">{it.files.map((f) => <code key={f}>{f}</code>)}</span>}
            {k < items.length - 1 && (ask === it.id ? (
              <div className="gn-cp-ask"><span>Undo {n} later {n === 1 ? "change" : "changes"}?</span><button type="button" className="gn-btn" onClick={() => setAsk(null)}>Cancel</button><button type="button" className="gn-btn gn-btn-main" onClick={restore}>Restore</button></div>
            ) : <button type="button" className="gn-cp-restore" onClick={() => { nTick("tap"); setAsk(it.id); }}><I d={NP.restore} size={14} />Restore to here</button>)}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* =====================================================================
   14. Helpers: one task splits into helpers, then comes back together
   ===================================================================== */
export function GlassSubAgents({ task, helpers = [], mergeLabel = "Putting it together", className = "" }) {
  const all = helpers.length > 0 && helpers.every((h) => h.status === "done");
  return (
    <div className={"gn gn-sa " + className} data-all={all ? "" : undefined}>
      <div className="gn-sa-node gn-sa-root"><span className="gn-sa-ic"><I d={NP.spark} size={15} /></span><b>{task}</b></div>
      <div className="gn-sa-row" style={{ "--n": helpers.length }}>
        {helpers.map((h, k) => (
          <div key={h.id} className="gn-sa-col" data-status={h.status} style={{ "--i": k }}>
            <span className="gn-sa-line gn-sa-in" />
            <div className="gn-sa-card">
              <span className="gn-sa-st">{h.status === "done" ? <span className="gn-task-ok"><I d={NP.check} size={11} w={3} /></span> : h.status === "running" ? <span className="gn-spin" /> : <i className="gn-sa-wait" />}</span>
              <span className="gn-sa-txt"><b>{h.label}</b><em>{h.status === "done" ? h.result || "Done" : h.status === "running" ? h.detail || "Working…" : "Waiting"}</em></span>
              {h.status === "running" && h.progress != null && <span className="gn-sa-bar"><i style={{ transform: `scaleX(${h.progress})` }} /></span>}
            </div>
            <span className="gn-sa-line gn-sa-out" />
          </div>
        ))}
      </div>
      <div className="gn-sa-node gn-sa-merge"><span className="gn-sa-ic">{all ? <I d={NP.check} size={14} w={2.6} /> : <span className="gn-spin" />}</span><b>{all ? "Ready" : mergeLabel}</b></div>
    </div>
  );
}

/* =====================================================================
   15. Compare two answers
   ===================================================================== */
export function GlassCompare({ answers = [], onPick, render = (t) => <p>{t}</p>, className = "" }) {
  const [pick, setPick] = useState(null);
  const [at, setAt] = useState(0);
  const sc = useRef(null);
  const onScroll = () => { const s = sc.current; if (s) setAt(Math.round(s.scrollLeft / Math.max(1, s.clientWidth * 0.86))); };
  return (
    <div className={"gn gn-cmp " + className} data-picked={pick != null ? "" : undefined}>
      <div className="gn-cmp-head"><b>Which answer is better?</b><span>Your pick helps it learn what you like.</span></div>
      <div ref={sc} className="gn-cmp-row" onScroll={onScroll}>
        {answers.map((a, k) => (
          <div key={k} className="gn-cmp-card" data-chosen={pick === k ? "" : undefined} data-lost={pick != null && pick !== k ? "" : undefined}>
            <span className="gn-cmp-tag">Answer {String.fromCharCode(65 + k)}</span>
            <div className="gn-cmp-body">{render(a)}</div>
            {pick === k ? <span className="gn-cmp-thanks"><I d={NP.check} size={14} w={2.6} />Thanks. We'll use this one.</span>
              : <button type="button" className="gn-btn" disabled={pick != null} onClick={() => { setPick(k); nTick("done"); onPick && onPick(k); }}>This one is better</button>}
          </div>
        ))}
      </div>
      <div className="gn-cmp-dots" aria-hidden="true">{answers.map((_, k) => <i key={k} data-on={k === at ? "" : undefined} />)}</div>
    </div>
  );
}

/* =====================================================================
   16. Check this answer: claims marked by how well a source backs them
   ===================================================================== */
const LVL = { strong: "Backed by a source", weak: "Partly backed", none: "No source found" };
export function GlassCheckedText({ parts = [], model = "Nova", checked, className = "" }) {
  const [open, setOpen] = useState(null);
  const [info, setInfo] = useState(false);
  const claims = parts.filter((p) => typeof p !== "string");
  const counts = { strong: 0, weak: 0, none: 0 }; claims.forEach((c) => counts[c.level]++);
  const cur = open != null ? parts[open] : null;
  const detail = cur && (
    <div className="gn-ck-pop-in">
      <span className="gn-ck-lvl" data-l={cur.level}><i />{LVL[cur.level]}</span>
      <q>{cur.text}</q>
      {cur.source ? <div className="gn-ck-src"><span className="gn-ck-fav">{cur.source.site.slice(0, 1).toUpperCase()}</span><span><b>{cur.source.title}</b><em>{cur.source.site}</em></span></div> : <p className="gn-ck-none">Nothing we searched says this. Treat it as a guess.</p>}
      {cur.source && cur.source.quote && <blockquote>“{cur.source.quote}”</blockquote>}
    </div>
  );
  return (
    <div className={"gn gn-ck " + className}>
      <button type="button" className="gn-ck-label" aria-expanded={info} onClick={() => setInfo(!info)}>
        <I d={NP.shield} size={14} /><span>AI-generated · {checked || `${claims.length} claims checked`}</span><I d={NP.chev} size={13} />
      </button>
      {info && <div className="gn-ck-info"><span>Written by {model}. Each claim was compared with what we found online.</span><span className="gn-ck-legend"><em data-l="strong"><i />{counts.strong} backed</em><em data-l="weak"><i />{counts.weak} partly</em><em data-l="none"><i />{counts.none} no source</em></span></div>}
      <p className="gn-ck-text">
        {parts.map((p, k) => typeof p === "string" ? <Fragment key={k}>{p}</Fragment> : (
          <span key={k} className="gn-ck-claim" data-l={p.level}>
            <span role="button" tabIndex={0} className="gn-ck-hit" aria-expanded={open === k} onClick={() => { nTick("tap"); setOpen(open === k ? null : k); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(open === k ? null : k); } }}>{p.text}</span>
            {open === k && <CheckPop onClose={() => setOpen(null)}>{detail}</CheckPop>}
          </span>
        ))}
      </p>
    </div>
  );
}
function CheckPop({ children, onClose }) {
  const phone = useIsPhone();
  const box = useRef(null);
  useOutside(!phone, box, onClose);
  if (phone) return <GlassSheet open onClose={onClose} title="Check">{children}</GlassSheet>;
  return <span ref={box} className="gn-ck-pop gn-pop" data-anchor="down" data-align="start">{children}</span>;
}

/* =====================================================================
   17. Limits and upgrade
   ===================================================================== */
export function GlassLimitNudge({ used, limit, resets, onPlans, className = "" }) {
  const p = clamp(used / limit, 0, 1);
  return (
    <div className={"gn gn-lim " + className} data-level={p >= 1 ? "out" : p >= 0.8 ? "near" : "ok"}>
      <span className="gn-lim-ring"><Ring p={p} size={34} /><b>{Math.round(p * 100)}%</b></span>
      <span className="gn-lim-txt"><b>{p >= 1 ? "You're out of messages for today" : `You've used ${used} of ${limit} messages today`}</b><em>Resets {resets}</em></span>
      <button type="button" className="gn-btn gn-btn-main" onClick={() => { nTick("tap"); onPlans && onPlans(); }}>See plans</button>
    </div>
  );
}
export function GlassPlans({ plans = [], current, onChoose, className = "" }) {
  const [yearly, setYearly] = useState(true);
  const [sel, setSel] = useState(plans.findIndex((p) => p.best) >= 0 ? plans.findIndex((p) => p.best) : 0);
  return (
    <div className={"gn gn-plans " + className}>
      <div className="gn-plans-cyc" role="radiogroup" aria-label="Billing">
        <span className="gn-plans-pill" data-y={yearly ? "" : undefined} />
        <button type="button" role="radio" aria-checked={!yearly} onClick={() => setYearly(false)}>Monthly</button>
        <button type="button" role="radio" aria-checked={yearly} onClick={() => setYearly(true)}>Yearly <em>2 months free</em></button>
      </div>
      <div className="gn-plans-list" role="radiogroup" aria-label="Plan">
        {plans.map((p, k) => (
          <button key={p.id} type="button" role="radio" aria-checked={sel === k} className="gn-plan" onClick={() => { nTick("tap"); setSel(k); }}>
            <span className="gn-plan-top"><b>{p.name}</b>{p.best && <i>Most picked</i>}{current === p.id && <i data-cur="">Your plan</i>}<span className="gn-plan-dot" /></span>
            <span className="gn-plan-price"><b key={yearly + p.id}>{p.price === 0 ? "₹0" : (yearly ? p.yearly : p.price)}</b>{p.price !== 0 && <em>{yearly ? "a month, billed yearly" : "a month"}</em>}</span>
            <ul>{p.features.map((f) => <li key={f}><I d={NP.check} size={12} w={2.6} />{f}</li>)}</ul>
          </button>
        ))}
      </div>
      <button type="button" className="gn-btn gn-btn-main gn-plans-go" disabled={plans[sel] && plans[sel].id === current} onClick={() => { nTick("done"); onChoose && onChoose(plans[sel].id, yearly); }}>
        {plans[sel] && plans[sel].id === current ? "This is your plan" : `Continue with ${plans[sel] ? plans[sel].name : ""}`}
      </button>
    </div>
  );
}

/* =====================================================================
   18. Hold to talk: hold to record, slide up to lock, left to cancel
   ===================================================================== */
export function GlassHoldToTalk({ onSend, className = "" }) {
  const [st, setSt] = useState("idle"); // idle, rec, locked, cancel
  const [t, setT] = useState(0);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [lv, setLv] = useState(() => Array(28).fill(0.15));
  const o = useRef(null);
  const tm = useRef(null);
  const t0 = useRef(0);
  useEffect(() => {
    if (st !== "rec" && st !== "locked") return;
    t0.current = performance.now() - t * 1000;
    tm.current = setInterval(() => { setT((performance.now() - t0.current) / 1000); setLv((l) => [...l.slice(1), 0.15 + Math.random() * 0.85]); }, 90);
    return () => clearInterval(tm.current);
  }, [st]);
  const begin = (e) => { if (st !== "idle") return; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); o.current = { x: e.clientX, y: e.clientY }; setT(0); setDx(0); setDy(0); setSt("rec"); nTick("tap"); };
  const move = (e) => {
    if (st !== "rec" || !o.current) return;
    const x = Math.min(0, e.clientX - o.current.x), y = Math.min(0, e.clientY - o.current.y);
    setDx(x); setDy(y);
    if (y < -70) { setSt("locked"); setDx(0); setDy(0); nTick("done"); }
    else if (x < -110) { setSt("cancel"); nTick("warn"); setTimeout(() => { setSt("idle"); setT(0); }, 700); }
  };
  const finish = (send) => { const d = t; setSt("idle"); setDx(0); setDy(0); o.current = null; if (send && d > 0.4) { nTick("send"); onSend && onSend({ duration: d, levels: lv.slice() }); } };
  const end = () => { if (st === "rec") finish(true); };
  const rec = st === "rec" || st === "locked";
  return (
    <div className={"gn gn-htt " + className} data-state={st}>
      <div className="gn-htt-bar">
        {st === "idle" && <span className="gn-htt-hint">Hold the mic to talk</span>}
        {rec && <>
          <span className="gn-htt-rec"><i />{fmtT(t)}</span>
          <span className="gn-htt-wave">{lv.map((v, k) => <i key={k} style={{ transform: `scaleY(${v})` }} />)}</span>
          {st === "rec" ? <span className="gn-htt-cancel" style={{ transform: `translateX(${dx * 0.6}px)`, opacity: 1 + dx / 160 }}><I d={NP.chevl} size={14} />Slide to cancel</span>
            : <button type="button" className="gn-ib" aria-label="Delete recording" onClick={() => { nTick("warn"); setSt("idle"); setT(0); }}><I d={NP.trash} size={16} /></button>}
        </>}
        {st === "cancel" && <span className="gn-htt-gone"><I d={NP.trash} size={16} />Deleted</span>}
      </div>
      <div className="gn-htt-btnwrap">
        {st === "rec" && <span className="gn-htt-lock" style={{ transform: `translateY(${dy * 0.5}px)`, opacity: 0.6 + Math.min(0.4, -dy / 70) }}><I d={dy < -40 ? NP.lock : NP.unlock} size={15} /><I d={NP.up} size={12} /></span>}
        {st === "locked"
          ? <button type="button" className="gn-htt-btn gn-htt-send" aria-label="Send voice message" onClick={() => finish(true)}><I d={NP.send} size={20} w={2.2} /></button>
          : <button type="button" className="gn-htt-btn" aria-label="Hold to record a voice message" style={st === "rec" ? { transform: `translate(${dx * 0.25}px, ${dy * 0.25}px) scale(1.35)` } : undefined}
              onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
              onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && st === "idle") { e.preventDefault(); setT(0); setSt("locked"); nTick("tap"); } }}
              onContextMenu={(e) => e.preventDefault()}>
              <I d={NP.mic} size={20} />
              {st === "rec" && <span className="gn-htt-pulse" style={{ transform: `scale(${1 + lv[lv.length - 1] * 0.5})` }} />}
            </button>}
      </div>
    </div>
  );
}
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export function GlassVoiceNote({ duration = 4, levels = [], mine = true, className = "" }) {
  const [play, setPlay] = useState(false);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!play) return;
    const t0 = performance.now() - p * duration * 1000;
    const id = setInterval(() => { const q = (performance.now() - t0) / (duration * 1000); if (q >= 1) { setP(0); setPlay(false); clearInterval(id); } else setP(q); }, 50);
    return () => clearInterval(id);
  }, [play]);
  const bars = (levels.length ? levels : Array.from({ length: 28 }, (_, k) => 0.3 + 0.6 * Math.abs(Math.sin(k * 1.7)))).slice(-28);
  return (
    <div className={"gn gn-vn " + className} data-mine={mine ? "" : undefined}>
      <button type="button" className="gn-vn-play" aria-label={play ? "Pause" : "Play voice message"} onClick={() => { nTick("tap"); setPlay(!play); }}><span className="gn-swap" data-on={play ? "" : undefined}><I d={NP.play} size={13} fill="currentColor" w={0} /><I d={NP.pause} size={13} fill="currentColor" w={0} /></span></button>
      <span className="gn-vn-wave">{bars.map((v, k) => <i key={k} data-on={k / bars.length < p ? "" : undefined} style={{ transform: `scaleY(${Math.max(0.15, v)})` }} />)}</span>
      <em>{fmtT(play ? p * duration : duration)}</em>
    </div>
  );
}

/* =====================================================================
   19. Camera mode: point, see labels, ask about the frame
   ===================================================================== */
export function GlassCameraAsk({ labels = [], answer, question = "What's this, and how do I look after it?", children, className = "" }) {
  const [shown, setShown] = useState(0);
  const [shot, setShot] = useState(false);
  const [ans, setAns] = useState(false);
  useEffect(() => {
    if (shot) return;
    setShown(0);
    const ts = labels.map((_, k) => setTimeout(() => { setShown(k + 1); nTick("soft"); }, 900 + k * 650));
    return () => ts.forEach(clearTimeout);
  }, [shot, labels.length]);
  const snap = () => { if (shot) return; nTick("done"); setShot(true); setTimeout(() => setAns(true), 600); };
  return (
    <div className={"gn gn-cam " + className} data-shot={shot ? "" : undefined}>
      <div className="gn-cam-view">
        {children || <CamScene />}
        {!shot && <span className="gn-cam-scan" />}
        <span className="gn-cam-corners"><i /><i /><i /><i /></span>
        {labels.slice(0, shown).map((l, k) => (
          <span key={k} className="gn-cam-pin" style={{ left: l.x + "%", top: l.y + "%" }} data-side={l.side || "right"}>
            <i className="gn-cam-dot" /><span className="gn-cam-tag">{l.label}{l.sub && <em>{l.sub}</em>}</span>
          </span>
        ))}
        {shot && <span className="gn-cam-flash" />}
        <div className="gn-cam-top"><span className="gn-live"><i />Looking</span></div>
        <div className="gn-cam-bottom">
          <span className="gn-cam-q">{question}</span>
          <button type="button" className="gn-cam-shutter" aria-label="Ask about this frame" onClick={snap}><i /></button>
        </div>
        <GlassSheet inline open={ans} onClose={() => { setAns(false); setShot(false); }} title="Monstera">
          <div className="gn-cam-ans">{answer}</div>
        </GlassSheet>
      </div>
    </div>
  );
}
function CamScene() {
  return (
    <svg className="gn-cam-scene" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="cw" x2="0" y2="1"><stop offset="0" stopColor="#e9dccb" /><stop offset="1" stopColor="#d8c6ae" /></linearGradient>
        <linearGradient id="ct" x2="0" y2="1"><stop offset="0" stopColor="#a87b53" /><stop offset="1" stopColor="#8a613f" /></linearGradient>
        <linearGradient id="cl" x1="0" x2="1"><stop offset="0" stopColor="#c9ccd3" /><stop offset="1" stopColor="#9fa4ad" /></linearGradient>
        <radialGradient id="cs" cx="0.75" cy="0.15" r="0.8"><stop offset="0" stopColor="#fff6e5" stopOpacity="0.9" /><stop offset="1" stopColor="#fff6e5" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="300" height="260" fill="url(#cw)" />
      <rect y="250" width="300" height="150" fill="url(#ct)" />
      <rect width="300" height="400" fill="url(#cs)" />
      <g fill="#2f6b3f">
        <path d="M70 230c-30-40-55-50-60-90 30 10 48 40 60 90z" /><path d="M78 228c-5-55 5-95 35-125 8 40-5 90-35 125z" fill="#3b7d4c" />
        <path d="M84 230c20-45 50-65 90-70-15 35-45 60-90 70z" /><path d="M76 226c-40-25-50-60-45-95 25 25 40 55 45 95z" fill="#28603a" />
        <path d="M92 200c15-35 40-60 75-70" stroke="#1f4f2e" strokeWidth="2" fill="none" />
      </g>
      <path d="M50 230h60l-8 50H58z" fill="#e8e3da" /><path d="M50 230h60v8H50z" fill="#d7d0c4" />
      <rect x="150" y="214" width="130" height="8" rx="3" fill="url(#cl)" /><path d="M160 214l10-60h100l-6 60z" fill="#2b2d33" /><path d="M166 210l9-50h88l-5 50z" fill="#4b6fa8" opacity="0.85" />
      <path d="M205 268h34v30a10 10 0 0 1-10 10h-14a10 10 0 0 1-10-10z" fill="#f2f2f2" /><path d="M239 274a9 9 0 0 1 0 18" stroke="#f2f2f2" strokeWidth="5" fill="none" /><ellipse cx="222" cy="268" rx="17" ry="4" fill="#5a3a22" />
      <rect y="300" width="300" height="100" fill="#000" opacity="0.08" />
    </svg>
  );
}

/* =====================================================================
   20. Live captions with translation
   ===================================================================== */
export function GlassLiveCaptions({ lines = [], langs = [], speaker = { name: "Speaker", initials: "S" }, className = "" }) {
  const [li, setLi] = useState(0);
  const [w, setW] = useState(0);
  const [lang, setLang] = useState(langs[0] ? langs[0].id : null);
  const [lv, setLv] = useState(() => Array(18).fill(0.2));
  const cur = lines[li % Math.max(1, lines.length)] || { text: "" };
  const words = cur.text.split(" ");
  useEffect(() => {
    if (!lines.length) return;
    const t = setTimeout(() => {
      if (w < words.length) setW(w + 1);
      else { setW(0); setLi((x) => x + 1); }
    }, w < words.length ? 190 : 1600);
    return () => clearTimeout(t);
  }, [w, li, lines.length]);
  useEffect(() => { const id = setInterval(() => setLv((l) => [...l.slice(1), w < words.length ? 0.25 + Math.random() * 0.75 : 0.12]), 90); return () => clearInterval(id); }, [w, words.length]);
  const prev = lines.length ? lines[(li - 1 + lines.length) % lines.length] : null;
  const tr = lang && cur.tr ? cur.tr[lang] : null;
  const trWords = tr ? tr.split(" ") : [];
  const trN = Math.round((w / Math.max(1, words.length)) * trWords.length);
  return (
    <div className={"gn gn-lc " + className}>
      <div className="gn-lc-who">
        <span className="gn-lc-av" style={{ "--h": [...(speaker.name || "")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7) }}>{speaker.initials}</span>
        <span className="gn-lc-name"><b>{speaker.name}</b><em>Speaking English</em></span>
        <span className="gn-lc-wave">{lv.map((v, k) => <i key={k} style={{ transform: `scaleY(${v})` }} />)}</span>
      </div>
      <div className="gn-lc-box" aria-live="polite">
        {prev && li > 0 && <p className="gn-lc-prev">{lang && prev.tr ? prev.tr[lang] : prev.text}</p>}
        <p className="gn-lc-now">{words.slice(0, w).map((x, k) => <Fragment key={li + "-" + k}><span>{x}</span>{" "}</Fragment>)}</p>
        {tr && <p className="gn-lc-tr">{trWords.slice(0, trN).map((x, k) => <Fragment key={li + "t" + k}><span>{x}</span>{" "}</Fragment>)}</p>}
      </div>
      {langs.length > 0 && (
        <div className="gn-lc-langs" role="radiogroup" aria-label="Translate into">
          <button type="button" role="radio" aria-checked={!lang} onClick={() => setLang(null)}>Off</button>
          {langs.map((l) => <button key={l.id} type="button" role="radio" aria-checked={lang === l.id} onClick={() => { nTick("tap"); setLang(l.id); }}>{l.label}</button>)}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   21. Image edit: paint the part to change, describe it, compare
   ===================================================================== */
export function GlassImageEdit({ width = 480, height = 320, draw, edit, prompt = "Turn the sky into a sunset", className = "" }) {
  const base = useRef(null), mask = useRef(null), out = useRef(null), wrap = useRef(null);
  const [size, setSize] = useState(26);
  const [painted, setPainted] = useState(false);
  const [text, setText] = useState(prompt);
  const [state, setState] = useState("paint"); // paint, busy, done
  const [cmp, setCmp] = useState(50);
  const last = useRef(null);
  useEffect(() => { const c = base.current.getContext("2d"); (draw || drawScene)(c, width, height); }, []);
  const pos = (e) => { const r = mask.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * width, y: ((e.clientY - r.top) / r.height) * height }; };
  const paint = (e, first) => {
    if (state !== "paint") return;
    const c = mask.current.getContext("2d"), p = pos(e);
    const col = (getComputedStyle(wrap.current).getPropertyValue("--n-c") || "").trim(); c.fillStyle = c.strokeStyle = /^(#|rgb|hsl|oklch|color)/.test(col) && col !== "#18181b" ? col : "#6b5cff"; c.lineCap = c.lineJoin = "round"; c.lineWidth = size * 2;
    c.beginPath(); if (first || !last.current) { c.arc(p.x, p.y, size, 0, Math.PI * 2); c.fill(); } else { c.moveTo(last.current.x, last.current.y); c.lineTo(p.x, p.y); c.stroke(); }
    last.current = p; if (!painted) setPainted(true);
  };
  const clear = () => { mask.current.getContext("2d").clearRect(0, 0, width, height); setPainted(false); setState("paint"); };
  const apply = () => {
    if (!painted) return;
    nTick("send"); setState("busy");
    setTimeout(() => {
      const o = out.current.getContext("2d");
      o.clearRect(0, 0, width, height); o.drawImage(base.current, 0, 0);
      const tmp = document.createElement("canvas"); tmp.width = width; tmp.height = height;
      const t = tmp.getContext("2d"); (edit || editScene)(t, width, height);
      t.globalCompositeOperation = "destination-in"; t.filter = "blur(6px)"; t.drawImage(mask.current, 0, 0); t.filter = "none";
      o.drawImage(tmp, 0, 0);
      setState("done"); setCmp(50); nTick("done");
    }, reduce() ? 0 : 1800);
  };
  const drag = (e) => { const r = wrap.current.getBoundingClientRect(); setCmp(clamp(((e.clientX - r.left) / r.width) * 100, 0, 100)); };
  return (
    <div className={"gn gn-ie " + className} data-state={state}>
      <div ref={wrap} className="gn-ie-canvas" style={{ aspectRatio: `${width} / ${height}` }}>
        <canvas ref={base} width={width} height={height} />
        <canvas ref={out} width={width} height={height} className="gn-ie-out" style={{ clipPath: state === "done" ? `inset(0 0 0 ${cmp}%)` : undefined }} />
        <canvas ref={mask} width={width} height={height} className="gn-ie-mask"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = null; paint(e, true); }}
          onPointerMove={(e) => { if (e.buttons) paint(e); }} onPointerUp={() => { last.current = null; }} />
        {state === "busy" && <span className="gn-ie-busy"><span className="gn-spin" />Editing the painted part…</span>}
        {state === "done" && (
          <div className="gn-ie-cmp" style={{ left: cmp + "%" }} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e); }} onPointerMove={(e) => e.buttons && drag(e)}
            role="slider" tabIndex={0} aria-label="Before and after" aria-valuenow={Math.round(cmp)} aria-valuemin={0} aria-valuemax={100}
            onKeyDown={(e) => { if (e.key === "ArrowLeft") setCmp((c) => clamp(c - 5, 0, 100)); if (e.key === "ArrowRight") setCmp((c) => clamp(c + 5, 0, 100)); }}>
            <i /><span><I d={NP.chevl} size={12} w={2.4} /><I d={NP.chevr} size={12} w={2.4} /></span>
          </div>
        )}
        {state === "done" && <><em className="gn-ie-tag" data-s="b">Before</em><em className="gn-ie-tag" data-s="a">After</em></>}
        {state === "paint" && !painted && <span className="gn-ie-hint"><I d={NP.brush} size={14} />Paint over the part to change</span>}
      </div>
      <div className="gn-ie-tools">
        {state !== "done" ? <>
          <label className="gn-ie-size"><I d={NP.brush} size={14} /><input type="range" min="8" max="50" value={size} onChange={(e) => setSize(+e.target.value)} aria-label="Brush size" /></label>
          <button type="button" className="gn-btn" onClick={clear} disabled={!painted}>Clear</button>
        </> : <button type="button" className="gn-btn" onClick={clear}><I d={NP.retry} size={14} />Start over</button>}
      </div>
      {state !== "done" && (
        <div className="gn-steer-row gn-ie-prompt">
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Describe the change" placeholder="Describe the change" onKeyDown={(e) => e.key === "Enter" && apply()} />
          <button type="button" className="gn-send" data-mode="send" aria-label="Apply" disabled={!painted || !text.trim() || state === "busy"} onClick={apply}><span className="gn-send-ic"><I d={NP.spark} size={16} /></span></button>
        </div>
      )}
    </div>
  );
}
function drawScene(c, w, h) {
  const sky = c.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, "#8ec5ff"); sky.addColorStop(1, "#dff0ff");
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(255,255,255,0.9)"; [[0.2, 0.18, 40], [0.27, 0.16, 30], [0.7, 0.24, 46], [0.78, 0.22, 32]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x * w, y * h, r, r * 0.45, 0, 0, Math.PI * 2); c.fill(); });
  const hill = (y0, col, amp, f) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, y0 + Math.sin(x / w * Math.PI * f) * amp); c.lineTo(w, h); c.fill(); };
  hill(h * 0.58, "#6f9fb8", 18, 2.2); hill(h * 0.66, "#4f8a6e", 22, 1.6); hill(h * 0.78, "#3d7356", 14, 3);
  c.fillStyle = "#2d5a43"; for (let i = 0; i < 9; i++) { const x = w * (0.06 + i * 0.11), y = h * 0.8; c.beginPath(); c.moveTo(x, y - 34); c.lineTo(x - 11, y + 4); c.lineTo(x + 11, y + 4); c.fill(); }
}
function editScene(c, w, h) {
  const g = c.createLinearGradient(0, 0, 0, h * 0.65); g.addColorStop(0, "#3b2a6b"); g.addColorStop(0.45, "#e0607a"); g.addColorStop(0.8, "#ffb36b"); g.addColorStop(1, "#ffe0a3");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const s = c.createRadialGradient(w * 0.62, h * 0.52, 4, w * 0.62, h * 0.52, 70); s.addColorStop(0, "rgba(255,240,200,1)"); s.addColorStop(0.3, "rgba(255,200,120,0.8)"); s.addColorStop(1, "rgba(255,160,100,0)");
  c.fillStyle = s; c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(255,190,150,0.55)"; [[0.22, 0.2, 44], [0.72, 0.27, 50]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x * w, y * h, r, r * 0.3, 0, 0, Math.PI * 2); c.fill(); });
}

/* =====================================================================
   22. Floating assistant: a bubble in the corner that opens a small chat
   ===================================================================== */
export function GlassAssistantWidget({ title = "Assistant", greeting = "Hi! How can I help?", starters = [], respond, contained = false, defaultOpen = false, mark, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(0);
  const box = useRef(null);
  const phone = useIsPhone();
  useEffect(() => { const b = box.current; if (b) b.scrollTop = b.scrollHeight; }, [msgs, busy]);
  const send = async (q) => {
    if (!q || busy) return;
    nTick("send"); setMsgs((m) => [...m, { me: true, t: q }]); setBusy(true);
    const a = respond ? await respond(q) : "Thanks! Someone will get back to you soon.";
    await new Promise((r) => setTimeout(r, reduce() ? 0 : 500));
    setBusy(false); setMsgs((m) => [...m, { me: false, t: a, s: true }]);
    if (!open) setUnread((u) => u + 1);
  };
  const toggle = () => { nTick("tap"); setOpen(!open); setUnread(0); };
  return (
    <div className={"gn gn-aw " + className} data-contained={contained ? "" : undefined} data-open={open ? "" : undefined} data-phone={phone ? "" : undefined}>
      <div className="gn-aw-panel" role="dialog" aria-label={title} aria-hidden={!open} inert={open ? undefined : ""}>
        <div className="gn-aw-head">
          <span className="gn-aw-mark">{mark || <I d={NP.spark} size={16} />}</span>
          <span className="gn-aw-title"><b>{title}</b><em><i />Usually replies in seconds</em></span>
          <button type="button" className="gn-ib" aria-label="Close" onClick={toggle}><I d={NP.chev} size={16} /></button>
        </div>
        <div ref={box} className="gn-aw-body">
          <div className="gn-aw-hello"><b>{greeting}</b>{starters.length > 0 && !msgs.length && <span className="gn-aw-starts">{starters.map((s, k) => <button key={s} type="button" style={{ "--i": k }} onClick={() => send(s)}>{s}<I d={NP.chevr} size={13} /></button>)}</span>}</div>
          {msgs.map((m, k) => <div key={k} className="gn-aw-msg" data-me={m.me ? "" : undefined}>{m.s ? <AwStream text={m.t} /> : m.t}</div>)}
          {busy && <div className="gn-aw-msg gn-aw-typing"><span className="gn-dots"><i /><i /><i /></span></div>}
        </div>
        <div className="gn-aw-foot"><GlassSteerComposer busy={busy} onSend={send} onStop={() => setBusy(false)} placeholder="Ask a question" /></div>
      </div>
      <button type="button" className="gn-aw-fab" aria-expanded={open} aria-label={open ? "Close assistant" : `Open ${title}`} onClick={toggle}>
        <span className="gn-swap" data-on={open ? "" : undefined}><I d={NP.spark} size={22} /><I d={NP.x} size={20} w={2.2} /></span>
        {unread > 0 && !open && <b key={unread}>{unread}</b>}
      </button>
    </div>
  );
}
function AwStream({ text }) { const s = useStream(text); return <>{s.text}{!s.done && <span className="gn-aw-caret" />}</>; }

/* =====================================================================
   23. Live preview: a generated page builds itself inside a frame
   ===================================================================== */
const DEVICES = [{ id: "desktop", w: "100%", icon: "M3 5h18v11H3zM8 20h8M12 16v4" }, { id: "tablet", w: "560px", icon: "M6 3h12v18H6zM11 18h2" }, { id: "phone", w: "320px", icon: "M8 3h8v18H8zM11 18h2" }];
export function GlassLivePreview({ url = "preview.app", blocks = [], building = true, speed = 700, onDone, className = "" }) {
  const [n, setN] = useState(building ? 0 : blocks.length);
  const [dev, setDev] = useState("desktop");
  const [spin, setSpin] = useState(0);
  useEffect(() => {
    if (n >= blocks.length) { if (building) { nTick("done"); onDone && onDone(); } return; }
    const t = setTimeout(() => setN((x) => x + 1), reduce() ? 0 : speed);
    return () => clearTimeout(t);
  }, [n, spin]);
  const d = DEVICES.find((x) => x.id === dev);
  const live = n < blocks.length;
  return (
    <div className={"gn gn-lp " + className}>
      <div className="gn-lp-bar">
        <span className="gn-bv-dots"><i /><i /><i /></span>
        <span className="gn-lp-url"><I d={NP.lock} size={10} />{url}{live && <span className="gn-lp-load" style={{ transform: `scaleX(${n / Math.max(1, blocks.length)})` }} />}</span>
        <button type="button" className="gn-ib" aria-label="Rebuild" onClick={() => { nTick("tap"); setN(0); setSpin((s) => s + 1); }}><I d={NP.retry} size={14} /></button>
        <span className="gn-lp-devs" role="radiogroup" aria-label="Screen size">
          {DEVICES.map((x) => <button key={x.id} type="button" role="radio" aria-checked={dev === x.id} aria-label={x.id} onClick={() => { nTick("tap"); setDev(x.id); }}><I d={x.icon} size={14} /></button>)}
        </span>
      </div>
      <div className="gn-lp-stage">
        <div className="gn-lp-page" style={{ width: d.w }} data-dev={dev}>
          {blocks.slice(0, n).map((b, k) => <div key={k + "-" + spin} className="gn-lp-block">{b}</div>)}
          {live && <div className="gn-lp-ghost"><i /><i /><i /></div>}
        </div>
        <span className="gn-lp-status" data-live={live ? "" : undefined}>{live ? <><span className="gn-spin" />Building {n + 1} of {blocks.length}</> : <><I d={NP.check} size={12} w={2.6} />Ready</>}</span>
      </div>
    </div>
  );
}

/* =====================================================================
   24. Autonomy: how much the agent may do on its own
   ===================================================================== */
const LEVELS = [
  { id: "suggest", label: "Suggest", hint: "It proposes; you do everything.", can: [["Read your files", 1], ["Draft changes", 0], ["Send or book", 0]] },
  { id: "draft", label: "Draft", hint: "It prepares the work and waits for your yes.", can: [["Read your files", 1], ["Draft changes", 1], ["Send or book", 0]] },
  { id: "auto", label: "Do it", hint: "It finishes the job and tells you after.", can: [["Read your files", 1], ["Draft changes", 1], ["Send or book", 1]] },
];
export function GlassAutonomy({ value = "draft", onChange, levels = LEVELS, className = "" }) {
  const i = Math.max(0, levels.findIndex((l) => l.id === value));
  const cur = levels[i];
  const set = (k) => { const n = clamp(k, 0, levels.length - 1); if (n !== i) { nTick(n === levels.length - 1 ? "warn" : "tap"); onChange && onChange(levels[n].id); } };
  return (
    <div className={"gn gn-auto " + className} data-level={i} style={{ "--p": i / Math.max(1, levels.length - 1) }}>
      <div className="gn-auto-head"><b>How much can it do alone?</b><span key={cur.id}>{cur.hint}</span></div>
      <div className="gn-auto-track" role="radiogroup" aria-label="Autonomy" onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(i + 1); } if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(i - 1); } }}>
        <span className="gn-auto-fill" />
        <span className="gn-auto-thumb" />
        {levels.map((l, k) => <button key={l.id} type="button" role="radio" aria-checked={k === i} tabIndex={k === i ? 0 : -1} onClick={() => set(k)}><i />{l.label}</button>)}
      </div>
      <ul className="gn-auto-can">
        {cur.can.map(([t, ok]) => <li key={t} data-ok={ok ? "" : undefined}><span><I d={ok ? NP.check : NP.x} size={11} w={2.8} /></span>{t}</li>)}
      </ul>
    </div>
  );
}

/* =====================================================================
   25. Action receipt: what the agent changed, with undo
   ===================================================================== */
export function GlassActionReceipt({ title, app, agent = "Nova", when = "Just now", changes = [], undoFor = 8, onUndo, className = "" }) {
  const [left, setLeft] = useState(undoFor);
  const [undone, setUndone] = useState(false);
  useEffect(() => { if (undone || left <= 0) return; const t = setTimeout(() => setLeft((x) => x - 1), 1000); return () => clearTimeout(t); }, [left, undone]);
  return (
    <div className={"gn gn-rcpt " + className} data-undone={undone ? "" : undefined}>
      <div className="gn-rcpt-head">
        <span className="gn-rcpt-ic">{undone ? <I d={NP.restore} size={16} /> : <I d={NP.check} size={16} w={2.4} />}</span>
        <span className="gn-rcpt-t"><b>{undone ? "Undone: " + title : title}</b><em>{app} · by {agent} · {when}</em></span>
      </div>
      <ul className="gn-rcpt-list">
        {changes.map((c, k) => (
          <li key={k} style={{ "--i": k }}><span className="gn-rcpt-k">{c.label}</span>{c.from != null && <s>{c.from}</s>}{c.from != null && <I d={NP.chevr} size={12} />}<b>{c.to}</b></li>
        ))}
      </ul>
      {!undone && left > 0 && onUndo && (
        <button type="button" className="gn-btn gn-rcpt-undo" onClick={() => { setUndone(true); nTick("warn"); onUndo(); }}>
          <span className="gn-rcpt-ring" style={{ "--p": left / undoFor }} />Undo<em>{left}s</em>
        </button>
      )}
      {!undone && left <= 0 && <span className="gn-rcpt-final"><I d={NP.lock} size={12} />Final</span>}
    </div>
  );
}

/* =====================================================================
   26. Budget and time box: live cost and time, and a question before going over
   ===================================================================== */
export function GlassBudget({ spent = 0, limit = 100, elapsed = 0, timeLimit = 600, currency = "$", asking, onAllow, onStop, className = "" }) {
  const p = clamp(spent / limit, 0, 1), q = clamp(elapsed / timeLimit, 0, 1);
  const m = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const lvl = (x) => (x >= 0.9 ? "hi" : x >= 0.7 ? "mid" : "ok");
  return (
    <div className={"gn gn-bud " + className}>
      <div className="gn-bud-row">
        <div className="gn-bud-cell" data-l={lvl(p)}>
          <span className="gn-bud-lab">Spent</span>
          <b>{currency}{spent.toFixed(2)}<em> of {currency}{limit}</em></b>
          <span className="gn-bud-bar"><i style={{ transform: `scaleX(${p})` }} /></span>
        </div>
        <div className="gn-bud-cell" data-l={lvl(q)}>
          <span className="gn-bud-lab">Time</span>
          <b>{m(elapsed)}<em> of {m(timeLimit)}</em></b>
          <span className="gn-bud-bar"><i style={{ transform: `scaleX(${q})` }} /></span>
        </div>
      </div>
      {asking && (
        <div className="gn-bud-ask" role="alertdialog" aria-label="Needs more budget">
          <span className="gn-bud-ask-ic"><I d={NP.info} size={16} /></span>
          <span className="gn-bud-ask-t"><b>{asking.title}</b><em>{asking.text}</em></span>
          <span className="gn-bud-ask-b"><button type="button" className="gn-btn" onClick={onStop}>Stop here</button><button type="button" className="gn-btn gn-btn-main" onClick={onAllow}>{asking.allow || "Allow"}</button></span>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   27. Shimmer text: a light that sweeps across words while something loads
   ===================================================================== */
export function GlassShimmerText({ children, as: Tag = "span", speed = 1.8, className = "" }) {
  return <Tag className={"gn gn-shim " + className} style={{ "--s": speed + "s" }}>{children}</Tag>;
}

/* =====================================================================
   28. Share a chat: link on or off, copy, download
   ===================================================================== */
export function GlassShareChat({ title = "Goa offsite budget", messages = 12, onDownload, className = "" }) {
  const [open, setOpen] = useState(false);
  const [pub, setPub] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = "northwind.ai/share/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  return (
    <span className={"gn gn-rel " + className}>
      <button type="button" className="gn-btn" onClick={() => { nTick("tap"); setOpen(true); }}><I d="M12 15V3M7 8l5-5 5 5M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" size={15} />Share</button>
      <GlassSheet open={open} onClose={() => setOpen(false)} title="Share this chat">
        <div className="gn-share">
          <div className="gn-share-card"><span className="gn-share-ic"><I d={NP.spark} size={16} /></span><span><b>{title}</b><em>{messages} messages</em></span></div>
          <button type="button" className="gn-temp" aria-pressed={pub} onClick={() => { nTick("tap"); setPub(!pub); setCopied(false); }}>
            <I d={NP.globe} size={16} /><span><b>Anyone with the link</b><em>{pub ? "Can read this chat. Your memory isn't shared." : "Only you can see this chat"}</em></span><Sw on={pub} />
          </button>
          <div className="gn-share-link" data-on={pub ? "" : undefined}>
            <span>{link}</span>
            <button type="button" className="gn-btn gn-btn-main" disabled={!pub} onClick={() => { try { navigator.clipboard && navigator.clipboard.writeText("https://" + link); } catch (e) {} setCopied(true); nTick("done"); }}>{copied ? "Copied" : "Copy link"}</button>
          </div>
          <div className="gn-share-dl">
            <span>Download</span>
            <button type="button" className="gn-btn" onClick={() => onDownload && onDownload("md")}><I d={NP.file} size={14} />Markdown</button>
            <button type="button" className="gn-btn" onClick={() => onDownload && onDownload("pdf")}><I d={NP.file} size={14} />PDF</button>
          </div>
        </div>
      </GlassSheet>
    </span>
  );
}

/* =====================================================================
   29. Handoff: the agent is stuck and asks a person for one thing
   ===================================================================== */
export function GlassHandoff({ task, reason, need = "Code", done = [], onResume, className = "" }) {
  const [v, setV] = useState("");
  const [state, setState] = useState("stuck"); // stuck, resuming, back
  const go = () => { if (!v.trim()) return; nTick("send"); setState("resuming"); setTimeout(() => { setState("back"); nTick("done"); onResume && onResume(v); }, reduce() ? 0 : 1400); };
  return (
    <div className={"gn gn-hand " + className} data-state={state}>
      <div className="gn-hand-head">
        <span className="gn-hand-ic">{state === "back" ? <I d={NP.check} size={16} w={2.4} /> : <I d={NP.hand} size={16} />}</span>
        <span><b>{state === "back" ? "Back on it" : state === "resuming" ? "Picking up where it stopped…" : "Needs you for a moment"}</b><em>{task}</em></span>
      </div>
      {state === "stuck" && <p className="gn-hand-why">{reason}</p>}
      <ol className="gn-hand-steps">
        {done.map((d) => <li key={d} data-done=""><span><I d={NP.check} size={10} w={3} /></span>{d}</li>)}
        <li data-now={state !== "back" ? "" : undefined} data-done={state === "back" ? "" : undefined}><span>{state === "back" ? <I d={NP.check} size={10} w={3} /> : done.length + 1}</span>{state === "back" ? "Got your " + need.toLowerCase() : "Waiting for your " + need.toLowerCase()}</li>
      </ol>
      {state === "stuck" && (
        <div className="gn-steer-row gn-hand-in">
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder={need} aria-label={need} inputMode="numeric" onKeyDown={(e) => e.key === "Enter" && go()} />
          <button type="button" className="gn-btn gn-btn-main" disabled={!v.trim()} onClick={go}>Resume</button>
        </div>
      )}
    </div>
  );
}
