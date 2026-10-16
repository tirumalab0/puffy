"use client";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./glass-ai-ux.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

/* AI beyond the chat box: a voice orb, ghost text, rewrite with a diff,
   an agent's plan, a status island, an insight that shows its evidence,
   magic fill for forms, image variations, streaming text and feedback.
   Each part works on its own; none of them call a model for you. You pass
   in what your model returns. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const Svg = ({ d, size = 16, w = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const SPARK = "M12 3c.6 3.9 2.1 5.4 6 6-3.9.6-5.4 2.1-6 6-.6-3.9-2.1-5.4-6-6 3.9-.6 5.4-2.1 6-6zM19 15c.3 1.7 1 2.4 2.7 2.7-1.7.3-2.4 1-2.7 2.7-.3-1.7-1-2.4-2.7-2.7 1.7-.3 2.4-1 2.7-2.7z";
const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const CROSS = "M6.5 6.5l11 11M17.5 6.5l-11 11";

/* ---------------------------------------------------------------------------
 * GlassVoiceOrb: a soft bubble that breathes while it listens and ripples
 * while it speaks. Press it to start or stop.
 * state     "idle" | "listening" | "thinking" | "speaking"
 * level     0 to 1, how loud right now (from your audio). Leave it out and
 *           the orb moves on its own.
 * face      draw two eyes, like the Puffy mascot
 * size      px (default 120)
 * onClick, label
 * ------------------------------------------------------------------------- */
export function GlassVoiceOrb({ state = "idle", level, face = true, size = 120, onClick, label }) {
  const lv = level == null ? undefined : Math.max(0, Math.min(1, level));
  const names = { idle: "Start talking", listening: "Listening. Press to stop", thinking: "Thinking", speaking: "Speaking. Press to interrupt" };
  return (
    <button type="button" className="gvo" data-state={state} data-auto={lv == null ? "" : undefined} aria-label={label || names[state]} aria-pressed={state !== "idle"}
      style={{ "--gvo-size": size + "px", "--lv": lv ?? 0 }} onClick={onClick}>
      <span className="gvo-ring" aria-hidden="true" />
      <span className="gvo-ring gvo-ring-2" aria-hidden="true" />
      <span className="gvo-body" aria-hidden="true">
        <span className="gvo-fill">
          <span className="gvo-blob gvo-blob-a" />
          <span className="gvo-blob gvo-blob-b" />
          <span className="gvo-blob gvo-blob-c" />
        </span>
        <span className="gvo-shine" />
        {face && <span className="gvo-face"><i className="gvo-bar" /><i /><i /><i className="gvo-bar" /></span>}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * GlassGhostInput: as people type, a suggestion appears in grey after the
 * cursor. Tab (or the right arrow at the end) takes it; Escape hides it.
 * value, onChange   the text and a function that receives the new text
 * suggest           (text) => the rest of the sentence, or "" for none
 * label, placeholder, hint
 * ------------------------------------------------------------------------- */
export function GlassGhostInput({ value = "", onChange, suggest, label, placeholder, hint = "Tab to accept", effect = "flat", onAccept }) {
  const id = useId();
  const [hidden, setHidden] = useState(false);
  const [focused, setFocused] = useState(false);
  const ghost = !hidden && value && suggest ? suggest(value) || "" : "";
  const take = () => { const next = value + ghost; onChange && onChange(next); onAccept && onAccept(next); };
  return (
    <div className="gfield ggi">
      {label && <label className="gfield-label" htmlFor={id}>{label}</label>}
      <div className="gf" data-effect={effect}>
        <span className="ggi-spark" data-on={ghost ? "" : undefined} aria-hidden="true"><Svg d={SPARK} size={15} w={1.6} /></span>
        <span className="ggi-wrap">
          <span className="ggi-mirror" aria-hidden="true"><span className="ggi-typed">{value}</span><span className="ggi-ghost" key={ghost}>{ghost}</span></span>
          <input id={id} className="gf-input" value={value} placeholder={placeholder} autoComplete="off" aria-describedby={ghost ? id + "-s" : undefined}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            onChange={(e) => { setHidden(false); onChange && onChange(e.target.value); }}
            onKeyDown={(e) => {
              if (!ghost) return;
              const atEnd = e.target.selectionStart === value.length;
              if (e.key === "Tab" || (e.key === "ArrowRight" && atEnd)) { e.preventDefault(); take(); }
              if (e.key === "Escape") setHidden(true);
            }} />
        </span>
        {ghost && focused && <kbd className="ggi-key" aria-hidden="true">Tab</kbd>}
      </div>
      <span className="sr-only" id={id + "-s"} aria-live="polite">{ghost ? `Suggestion: ${value}${ghost}. Press Tab to accept.` : ""}</span>
      {hint && <div className="gfield-foot"><span className="gfield-hint">{hint}</span></div>}
    </div>
  );
}

/* Word diff: which words were removed and which were added */
export function diffWords(a, b) {
  const A = a.split(/(\s+)/).filter(Boolean), B = b.split(/(\s+)/).filter(Boolean);
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push(["same", A[i]]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push(["del", A[i++]]);
    else out.push(["add", B[j++]]);
  }
  while (i < n) out.push(["del", A[i++]]);
  while (j < m) out.push(["add", B[j++]]);
  return out;
}

/* ---------------------------------------------------------------------------
 * GlassRewrite: select some text and ask for a change. The answer shows as a
 * diff, struck-out words and new words, until you keep it or undo it.
 * value, onChange   the whole text
 * actions           [{ id, label }] shown when text is selected
 * rewrite           async (selectedText, actionId) => new text
 * label, rows
 * ------------------------------------------------------------------------- */
export function GlassRewrite({ value = "", onChange, actions = [], rewrite, label = "Draft", rows = 6, effect = "flat" }) {
  const id = useId();
  const ref = useRef(null);
  const [sel, setSel] = useState(null); // [start, end]
  const [busy, setBusy] = useState(null);
  const [draft, setDraft] = useState(null); // { start, end, before, after, action }
  const words = sel ? value.slice(sel[0], sel[1]).trim().split(/\s+/).filter(Boolean).length : 0;
  const read = () => { const el = ref.current; if (!el) return; setSel(el.selectionEnd > el.selectionStart ? [el.selectionStart, el.selectionEnd] : null); };
  const run = async (a) => {
    const [s, e] = draft ? [draft.start, draft.end] : sel;
    const before = draft ? draft.before : value.slice(s, e);
    setBusy(a.id);
    try {
      const after = await rewrite(before, a.id);
      setDraft({ start: s, end: e, before, after, action: a.label });
    } finally { setBusy(null); }
  };
  const keep = () => { onChange && onChange(value.slice(0, draft.start) + draft.after + value.slice(draft.end)); setDraft(null); setSel(null); };
  const parts = useMemo(() => (draft ? diffWords(draft.before, draft.after) : []), [draft]);
  let k = 0;
  return (
    <div className="gfield grw" data-busy={busy ? "" : undefined}>
      {label && <label className="gfield-label" htmlFor={id}>{label}</label>}
      <div className="gf grw-box" data-multiline="" data-effect={effect}>
        <div className="grw-bar" data-show={(sel && words) || draft || busy ? "" : undefined} role="toolbar" aria-label="Rewrite the selected text">
          <span className="grw-count"><Svg d={SPARK} size={14} w={1.6} />{draft ? draft.action : `${words} word${words === 1 ? "" : "s"}`}</span>
          {draft ? (
            <>
              <button type="button" className="grw-act grw-keep" onClick={keep}><Svg d={CHECK} size={14} w={2.2} />Keep</button>
              <button type="button" className="grw-act" onClick={() => { setDraft(null); ref.current && ref.current.focus(); }}><Svg d={CROSS} size={14} w={2} />Undo</button>
              {actions.filter((a) => a.label !== draft.action).slice(0, 2).map((a) => <button key={a.id} type="button" className="grw-act" disabled={!!busy} onClick={() => run(a)}>{a.label}</button>)}
            </>
          ) : actions.map((a) => (
            <button key={a.id} type="button" className="grw-act" disabled={!!busy || !sel} onMouseDown={(e) => e.preventDefault()} onClick={() => run(a)}>
              {busy === a.id && <span className="grw-spin" aria-hidden="true" />}{a.label}
            </button>
          ))}
        </div>
        {draft ? (
          <div className="grw-diff" aria-live="polite">
            {value.slice(0, draft.start)}
            {parts.map(([t, w], i) => t === "same" ? <span key={i}>{w}</span> : /^\s+$/.test(w) ? (t === "del" ? <del key={i}>{w}</del> : <span key={i}>{w}</span>) : t === "del" ? <del key={i}>{w}</del> : <ins key={i} style={{ "--i": k++ }}>{w}</ins>)}
            {value.slice(draft.end)}
          </div>
        ) : (
          <textarea id={id} ref={ref} className="gf-input" rows={rows} value={value} onChange={(e) => { onChange && onChange(e.target.value); setSel(null); }}
            onSelect={read} onKeyUp={read} onMouseUp={read} />
        )}
      </div>
      <div className="gfield-foot"><span className="gfield-hint">{draft ? "Struck-out words go, coloured words come in." : "Select some words to rewrite them."}</span></div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * GlassAgentPlan: the steps an agent means to take, shown before it starts.
 * People can drop a step, then run it and watch each one finish.
 * steps     [{ id, label, detail?, status: "todo" | "active" | "done" | "error" | "skipped", result? }]
 * running   true while it works
 * onRun, onPause, onRemove(id), onRetry(id)
 * title
 * ------------------------------------------------------------------------- */
export function GlassAgentPlan({ title = "Plan", steps = [], running = false, onRun, onPause, onRemove, onRetry, elapsed }) {
  const done = steps.filter((s) => s.status === "done" || s.status === "skipped").length;
  const started = steps.some((s) => s.status !== "todo");
  const finished = steps.length > 0 && done === steps.length;
  const p = steps.length ? done / steps.length : 0;
  return (
    <section className="gapl" data-running={running ? "" : undefined} aria-label={title}>
      <header className="gap-head">
        <span className="gap-ring" style={{ "--p": p }} aria-hidden="true">{finished ? <Svg d={CHECK} size={14} w={2.4} /> : <b>{done}</b>}</span>
        <span className="gap-title"><strong>{title}</strong><span>{finished ? `Done${elapsed ? " in " + elapsed : ""}` : running ? `Working · step ${Math.min(done + 1, steps.length)} of ${steps.length}` : started ? `Paused · ${done} of ${steps.length} done` : `${steps.length} steps. Check them, then run.`}</span></span>
        {!finished && (running
          ? <button type="button" className="gap-btn" onClick={onPause}><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor" /><rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor" /></svg>Pause</button>
          : <button type="button" className="gap-btn gap-run" onClick={onRun}><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>{started ? "Resume" : "Run plan"}</button>)}
      </header>
      <ol className="gap-list">
        {steps.map((s, i) => (
          <li key={s.id} className="gap-step" data-s={s.status} style={{ "--i": i }}>
            <span className="gap-dot" aria-hidden="true">{s.status === "done" ? <Svg d={CHECK} size={12} w={2.6} /> : s.status === "error" ? <Svg d={CROSS} size={11} w={2.6} /> : s.status === "active" ? <i className="gap-spin" /> : <em>{i + 1}</em>}</span>
            <div className="gap-text">
              <span className="gap-label">{s.label}</span>
              {s.detail && <span className="gap-detail">{s.detail}</span>}
              {s.result && <span className="gap-result">{s.result}</span>}
            </div>
            {s.status === "todo" && !running && onRemove && <button type="button" className="gap-x" aria-label={"Skip " + s.label} onClick={() => onRemove(s.id)}><Svg d={CROSS} size={13} w={2} /></button>}
            {s.status === "error" && onRetry && <button type="button" className="gap-btn" onClick={() => onRetry(s.id)}>Retry</button>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * GlassAgentIsland: a small pill that says what an agent is doing. It grows
 * to fit each new message and opens into a card when pressed.
 * state      "idle" | "thinking" | "working" | "needs" | "done"
 * label      short text, e.g. "Booking rooms"
 * progress   0 to 1 while working
 * open, onOpenChange, children (shown when open)
 * ------------------------------------------------------------------------- */
export function GlassAgentIsland({ state = "idle", label = "", progress, open = false, onOpenChange, children }) {
  const p = progress == null ? null : Math.max(0, Math.min(1, progress));
  const canOpen = !!(onOpenChange && children);
  const PillTag = canOpen ? "button" : "div";
  return (
    <div className="gis" data-state={state} data-open={open ? "" : undefined}>
      {/* a status only, unless there is something to open */}
      <PillTag {...(canOpen ? { type: "button", "aria-expanded": open, onClick: () => onOpenChange(!open) } : { role: "status" })} className="gis-pill" data-static={canOpen ? undefined : ""}>
        <span className="gis-icon" aria-hidden="true">
          {state === "done" ? <Svg d={CHECK} size={14} w={2.6} /> : state === "needs" ? <b>!</b> : state === "idle" ? <Svg d={SPARK} size={14} w={1.8} /> : <span className="gis-wave"><i /><i /><i /></span>}
        </span>
        <span className="gis-label" key={label} aria-live="polite">{label}</span>
        {p != null && state === "working" && <span className="gis-ring" style={{ "--p": p }} aria-label={`${Math.round(p * 100)}% done`} />}
      </PillTag>
      <div className="gis-panel" hidden={!open}>{open && children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * GlassInsight: an AI finding written in one or two sentences, with its
 * evidence. Point at an underlined phrase and the numbers behind it light up.
 * title
 * parts      the sentence as [ "plain text", { text, refs: [index, ...] }, ... ]
 * labels, values   the small bar chart it is based on
 * basis      a line on what it is based on, e.g. "9 days of orders"
 * confidence "high" | "medium" | "low"
 * actions    buttons under it
 * ------------------------------------------------------------------------- */
export function GlassInsight({ title = "Insight", parts = [], labels = [], values = [], basis, confidence = "high", actions, format = (v) => v.toLocaleString() }) {
  const [hl, setHl] = useState(null);
  const max = Math.max(...values, 1);
  return (
    <section className="gin" aria-label={title}>
      <header className="gin-head"><span className="gin-spark" aria-hidden="true"><Svg d={SPARK} size={15} w={1.6} /></span><strong>{title}</strong><span className="gin-conf" data-c={confidence}><i /><i /><i />{confidence[0].toUpperCase() + confidence.slice(1)} confidence</span></header>
      <p className="gin-text">
        {parts.map((pt, i) => typeof pt === "string" ? <span key={i}>{pt}</span> : (
          <button key={i} type="button" className="gin-ref" data-on={hl === i ? "" : undefined}
            onPointerEnter={() => setHl(i)} onPointerLeave={() => setHl(null)} onFocus={() => setHl(i)} onBlur={() => setHl(null)}
            aria-describedby={undefined}>{pt.text}</button>
        ))}
      </p>
      <div className="gin-bars" role="img" aria-label={labels.map((l, i) => `${l} ${format(values[i])}`).join(", ")} data-hl={hl != null ? "" : undefined}>
        {values.map((v, i) => {
          const on = hl != null && parts[hl] && parts[hl].refs && parts[hl].refs.includes(i);
          return (
            <span key={i} className="gin-bar" data-on={on ? "" : undefined} style={{ "--h": v / max, "--i": i }}>
              <i />{on && <b>{format(v)}</b>}<em>{labels[i]}</em>
            </span>
          );
        })}
      </div>
      {(basis || actions) && <footer className="gin-foot">{basis && <span>{basis}</span>}{actions && <span className="gin-actions">{actions}</span>}</footer>}
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * GlassMagicFill: paste anything (an email signature, a message, a business
 * card) and the form fills itself, one field at a time. Each filled field is
 * marked so people know to check it.
 * fields     [{ name, label }]
 * values, onChange   an object of field values and a function that receives the new one
 * parse      async (text) => { name: value, ... }
 * ------------------------------------------------------------------------- */
export function GlassMagicFill({ fields = [], values = {}, onChange, parse, effect = "flat", placeholder = "Paste an email signature, a message or a business card" }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [filled, setFilled] = useState({});
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const go = async (t) => {
    if (!t.trim() || !parse) return;
    setBusy(true);
    const found = await parse(t);
    setBusy(false);
    let next = { ...values };
    const keys = fields.map((f) => f.name).filter((k) => found[k]);
    const step = reduce() ? 0 : 160;
    keys.forEach((k, i) => {
      timers.current.push(setTimeout(() => {
        next = { ...next, [k]: found[k] };
        onChange && onChange(next);
        setFilled((f) => ({ ...f, [k]: true }));
      }, i * step));
    });
  };
  return (
    <div className="gmf">
      <div className="gmf-paste" data-busy={busy ? "" : undefined}>
        <span className="gmf-paste-icon" aria-hidden="true"><Svg d={SPARK} size={16} w={1.6} /></span>
        <textarea rows={2} value={text} placeholder={placeholder} aria-label="Paste text to fill the form" onChange={(e) => setText(e.target.value)} onPaste={(e) => { const t = e.clipboardData.getData("text"); setTimeout(() => go(t), 0); }} />
        <button type="button" className="gmf-go" disabled={!text.trim() || busy} onClick={() => go(text)}>{busy ? <span className="grw-spin" aria-hidden="true" /> : null}{busy ? "Reading" : "Fill"}</button>
      </div>
      <div className="gmf-fields">
        {fields.map((f) => (
          <div key={f.name} className="gfield gmf-field" data-filled={filled[f.name] ? "" : undefined}>
            <label className="gfield-label" htmlFor={"gmf-" + f.name}>{f.label}{filled[f.name] && <span className="gmf-tag"><Svg d={SPARK} size={11} w={2} />Filled for you</span>}</label>
            <div className="gf" data-effect={effect}>
              <input id={"gmf-" + f.name} className="gf-input" value={values[f.name] || ""} autoComplete="off" onChange={(e) => { onChange && onChange({ ...values, [f.name]: e.target.value }); setFilled((x) => ({ ...x, [f.name]: false })); }} />
              {filled[f.name] && <button type="button" className="gmf-undo" aria-label={"Clear " + f.label} onClick={() => { onChange && onChange({ ...values, [f.name]: "" }); setFilled((x) => ({ ...x, [f.name]: false })); }}><Svg d={CROSS} size={13} w={2} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* A seeded colour field, so the same prompt always "generates" the same art */
const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const WARM = /sun|fire|warm|desert|gold|orange|dusk|autumn|peach|coral/i, COOL = /sea|ocean|ice|blue|night|rain|mint|sky|winter|calm/i, GREEN = /forest|leaf|moss|garden|green|spring|meadow/i;
export function artFor(prompt, n) {
  const h = hash(prompt + "#" + n);
  const base = WARM.test(prompt) ? 18 : COOL.test(prompt) ? 205 : GREEN.test(prompt) ? 110 : (hash(prompt) % 360);
  const hue = (o) => (base + o + (h % 50) - 25 + 360) % 360;
  const x = (k) => ((h >> k) & 63) + 18;
  return `radial-gradient(60% 55% at ${x(2)}% ${x(8)}%, hsl(${hue(30)} 90% 72%), transparent 70%), radial-gradient(55% 60% at ${x(14)}% ${x(20)}%, hsl(${hue(-40)} 75% 55%), transparent 70%), radial-gradient(70% 60% at ${x(5)}% ${x(11)}%, hsl(${hue(170)} 60% 70% / 0.8), transparent 70%), linear-gradient(${h % 360}deg, hsl(${hue(0)} 55% 30%), hsl(${hue(60)} 70% 62%))`;
}

/* ---------------------------------------------------------------------------
 * GlassVariations: a prompt and a grid of results that develop like film.
 * Pick one, or make one again.
 * prompt          the text the results are for
 * count           how many (default 4)
 * render          (prompt, index, seed) => an element for a finished result.
 *                 Leave it out to show a colour study made from the prompt.
 * value, onChange the chosen index
 * duration        ms each result takes to develop
 * pending         true while your model is still making them (or one
 *                 boolean per result); they keep developing until it ends
 * onAgain(i)      called by a result's round arrow, to make that one again
 * ------------------------------------------------------------------------- */
export function GlassVariations({ prompt = "", count = 4, render, value, onChange, duration = 2200, pending = false, onAgain }) {
  const [seeds, setSeeds] = useState(() => Array.from({ length: count }, (_, i) => i));
  const [born, setBorn] = useState(() => Array.from({ length: count }, () => Date.now()));
  const [now, setNow] = useState(Date.now());
  useEffect(() => { setBorn(Array.from({ length: count }, (_, i) => Date.now() + i * 220)); }, [prompt, count]);
  const wait = (i) => (Array.isArray(pending) ? !!pending[i] : !!pending);
  const anyWait = Array.from({ length: count }, (_, i) => wait(i)).some(Boolean);
  // When a result stops waiting it finishes developing from where it was
  const was = useRef([]);
  useEffect(() => {
    const done = Array.from({ length: count }, (_, i) => was.current[i] && !wait(i));
    if (done.some(Boolean)) setBorn((b) => b.map((x, i) => (done[i] ? Date.now() - duration * 0.8 : x)));
    if (Array.from({ length: count }, (_, i) => !was.current[i] && wait(i)).some(Boolean)) setBorn((b) => b.map((x, i) => (wait(i) && !was.current[i] ? Date.now() : x)));
    was.current = Array.from({ length: count }, (_, i) => wait(i));
  }, [JSON.stringify(pending), count]);
  const busy = anyWait || born.some((b) => now - b < duration);
  useEffect(() => {
    if (!busy) return;
    let raf;
    const tick = () => { setNow(Date.now()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [busy, born]);
  const again = (i) => { if (onAgain) { onAgain(i); setBorn((b) => b.map((x, j) => (j === i ? Date.now() : x))); setNow(Date.now()); return; } setSeeds((s) => s.map((x, j) => (j === i ? x + count : x))); setBorn((b) => b.map((x, j) => (j === i ? Date.now() : x))); setNow(Date.now()); };
  return (
    <div className="gvr" role="radiogroup" aria-label={`Results for “${prompt}”`}>
      {seeds.map((seed, i) => {
        const age = Math.max(0, now - born[i]);
        const t = wait(i) ? 0.86 * (1 - Math.exp(-age / (duration * 1.4))) : Math.max(0, Math.min(1, age / duration));
        const ready = t >= 1;
        return (
          <div key={i} className="gvr-cell" data-ready={ready ? "" : undefined} data-on={value === i ? "" : undefined} style={{ "--t": t }}>
            <button type="button" role="radio" aria-checked={value === i} disabled={!ready} className="gvr-pick" onClick={() => onChange && onChange(i)} aria-label={ready ? `Result ${i + 1}` : `Result ${i + 1}, ${Math.round(t * 100)}%`}>
              <span className="gvr-art" style={{ backgroundImage: artFor(prompt, seed) }}>{render && !wait(i) ? render(prompt, i, seed) : null}</span>
              {!ready && <span className="gvr-pct">{Math.round(t * 100)}%</span>}
              {value === i && <span className="gvr-check" aria-hidden="true"><Svg d={CHECK} size={14} w={2.6} /></span>}
            </button>
            {ready && <button type="button" className="gvr-again" aria-label={`Make result ${i + 1} again`} onClick={() => again(i)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" /></svg></button>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * GlassStream: text that arrives a few words at a time, the way a model
 * answers, with a soft caret at the end.
 * text      the full answer
 * speed     words a second (default 18)
 * playing   false holds it
 * onDone
 * ------------------------------------------------------------------------- */
export function GlassStream({ text = "", speed = 18, playing = true, onDone, chime = true, as: Tag = "p", className = "" }) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const [n, setN] = useState(reduce() ? words.length : 0);
  useEffect(() => { setN(reduce() ? words.length : 0); }, [text]);
  useEffect(() => {
    if (!playing) return;
    if (n >= words.length) { if (chime && n > 2 && !reduce()) gsnd("chime"); onDone && onDone(); return; }
    const t = setTimeout(() => setN((x) => Math.min(words.length, x + 2)), 1000 / speed * 1.6);
    return () => clearTimeout(t);
  }, [n, playing, words.length]);
  const live = n < words.length;
  return (
    <Tag className={("gsm " + className).trim()} aria-busy={live}>
      {words.slice(0, n).map((w, i) => (/^\s+$/.test(w) ? w : <span key={i} className="gsm-w">{w}</span>))}
      {live && <span className="gsm-caret" aria-hidden="true" />}
    </Tag>
  );
}

/* ---------------------------------------------------------------------------
 * GlassFeedback: was this answer good? A thumbs down asks why, in one tap.
 * onRate     (value: "up" | "down", reason?) => void
 * reasons    the chips shown after a thumbs down
 * ------------------------------------------------------------------------- */
export function GlassFeedback({ onRate, reasons = ["Not accurate", "Too long", "Missed the point", "Unsafe"], prompt = "Was this helpful?" }) {
  const [v, setV] = useState(null);
  const [why, setWhy] = useState(null);
  const send = (val, r) => { setV(val); if (r) setWhy(r); onRate && onRate(val, r); };
  const thumb = (up) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={up ? undefined : { transform: "rotate(180deg)" }}><path d="M7 11v9H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11zM7 11l4-7.5c1.4 0 2.5 1.1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7" /></svg>;
  const thanks = v === "up" || why;
  return (
    <div className="gfb" data-state={thanks ? "thanks" : v || "ask"} role="group" aria-label="Rate this answer">
      {thanks ? (
        <span className="gfb-thanks"><Svg d={CHECK} size={14} w={2.4} />{v === "up" ? "Thanks. Glad it helped." : `Thanks. We'll use “${why}” to do better.`}</span>
      ) : (
        <>
          <span className="gfb-q">{v === "down" ? "What went wrong?" : prompt}</span>
          {v !== "down" && <>
            <button type="button" className="gfb-btn" aria-label="Helpful" onClick={() => send("up")}>{thumb(true)}</button>
            <button type="button" className="gfb-btn" aria-label="Not helpful" onClick={() => setV("down")}>{thumb(false)}</button>
          </>}
          {v === "down" && reasons.map((r, i) => <button key={r} type="button" className="gfb-chip" style={{ "--i": i }} onClick={() => send("down", r)}>{r}</button>)}
        </>
      )}
    </div>
  );
}
