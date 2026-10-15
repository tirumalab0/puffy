"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./glass-ai-kit.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

/* The parts around an AI answer: pick a model, start from a suggestion,
   write with files attached, watch research or an image come together,
   check the sources inline and act on the reply. None of them call a model;
   you pass in what yours returns. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const I = ({ d, size = 16, w = 1.8, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  down: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  up: "M12 19V5M5.5 11.5L12 5l6.5 6.5",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z",
  copy: "M9 9h10v10H9zM5 15V5h10",
  thumb: "M7 11v9H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11zM7 11l4-7.5c1.4 0 2.5 1.1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.3 20H7",
  retry: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  speak: "M4 10v4h4l5 4V6L8 10zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  stop: "M7 7h10v10H7z",
};
const domainOf = (s) => s.domain || (s.href ? s.href.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "");
/* A small round badge with the site's first letter, coloured from its name */
const hue = (s) => { let h = 0; for (const c of s || "") h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
export function SiteBadge({ site, size = 18 }) {
  const name = (site || "?").replace(/^www\./, "");
  return <span className="gak-fav" style={{ "--h": hue(name), width: size, height: size, fontSize: size * 0.52 }} aria-hidden="true">{name[0].toUpperCase()}</span>;
}

/* ---------------------------------------------------------------------------
 * GlassModelPicker: a chip that opens a list of models. Each row has a name,
 * a one-line description and two small meters, so people pick by what a
 * model is good at rather than by its version number.
 * models    [{ id, name, description, speed: 1-3, smarts: 1-3, badge?, icon? }]
 * value, onChange
 * label     what the list is called (default "Model")
 * ------------------------------------------------------------------------- */
export function GlassModelPicker({ models = [], value, onChange, label = "Model", align = "start" }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef(null);
  const list = useRef(null);
  const id = useId();
  const cur = models.find((m) => m.id === value) || models[0];
  useEffect(() => {
    if (!open) return;
    setHi(Math.max(0, models.findIndex((m) => m.id === value)));
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    requestAnimationFrame(() => list.current && list.current.focus());
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  const pick = (m) => { onChange && onChange(m.id); setOpen(false); box.current && box.current.querySelector(".gmp-chip").focus(); };
  const key = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % models.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + models.length) % models.length); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(models[hi]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); box.current.querySelector(".gmp-chip").focus(); }
  };
  const meter = (n, name) => <span className="gmp-meter" aria-label={`${name} ${n} of 3`}>{[1, 2, 3].map((k) => <i key={k} data-on={k <= n ? "" : undefined} />)}</span>;
  return (
    <div className="gmp" ref={box} data-open={open ? "" : undefined} data-align={align}>
      <button type="button" className="gmp-chip" aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span className="gmp-glyph" aria-hidden="true">{cur && cur.icon ? cur.icon : <I d={P.spark} size={13} w={1.8} />}</span>
        <span className="gmp-name">{cur ? cur.name : label}</span>
        <I d={P.down} size={14} w={2} />
      </button>
      {open && (
        <div className="gmp-pop" role="presentation">
          <div className="gmp-head"><span>{label}</span><span className="gmp-legend"><b>Speed</b><b>Smarts</b></span></div>
          <ul id={id} ref={list} className="gmp-list" role="listbox" tabIndex={-1} aria-label={label} aria-activedescendant={`${id}-${hi}`} onKeyDown={key}>
            {models.map((m, i) => (
              <li key={m.id} id={`${id}-${i}`} role="option" aria-selected={m.id === value} className="gmp-opt" data-hi={i === hi ? "" : undefined} style={{ "--i": i }}
                onPointerEnter={() => setHi(i)} onClick={() => pick(m)}>
                <span className="gmp-icon" aria-hidden="true">{m.icon || <I d={P.spark} size={15} />}</span>
                <span className="gmp-text">
                  <span className="gmp-row"><strong>{m.name}</strong>{m.badge && <em>{m.badge}</em>}</span>
                  <span className="gmp-desc">{m.description}</span>
                </span>
                <span className="gmp-meters">{meter(m.speed || 2, "Speed")}{meter(m.smarts || 2, "Smarts")}</span>
                <span className="gmp-tick" aria-hidden="true">{m.id === value && <I d={P.check} size={15} w={2.4} />}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * GlassStarters: the first screen of an assistant. A greeting, then a few
 * things to try. Picking one hands its prompt to you.
 * greeting    "Good morning, Elara"
 * sub         one line under it
 * items       [{ label, prompt?, icon? }]
 * onPick      (item) => void
 * ------------------------------------------------------------------------- */
export function GlassStarters({ greeting = "What can I help with?", sub, items = [], onPick, mark }) {
  const words = greeting.split(" ");
  return (
    <div className="gsta">
      {mark && <span className="gst-mark" aria-hidden="true">{mark}</span>}
      <h2 className="gst-hello" aria-label={greeting}>
        {words.map((w, i) => <span key={i} aria-hidden="true">{i > 0 && " "}<span style={{ "--i": i }}>{w}</span></span>)}
      </h2>
      {sub && <p className="gst-sub">{sub}</p>}
      <div className="gst-items">
        {items.map((it, i) => (
          <button key={it.label} type="button" className="gst-item" style={{ "--i": i + words.length }} onClick={() => onPick && onPick(it)}>
            {it.icon && <span className="gst-icon" aria-hidden="true">{it.icon}</span>}
            <span>{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * GlassCitedText: an answer with numbered sources inside the sentences.
 * Point at a number, or tap it, to see the page it came from.
 * parts     ["plain text", { cite: 1 }, " more text", { cite: [2, 3] }]
 * sources   [{ title, domain?, href?, snippet? }]   numbered from 1
 * footer    show the row of sources under the text (default true)
 * ------------------------------------------------------------------------- */
export function GlassCitedText({ parts = [], sources = [], footer = true, as: Tag = "p" }) {
  const [open, setOpen] = useState(null);
  const root = useRef(null);
  const via = useRef("mouse");
  useEffect(() => {
    if (open == null) return;
    const away = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(null); };
    const esc = (e) => e.key === "Escape" && setOpen(null);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const used = [...new Set(parts.flatMap((p) => (p && typeof p === "object" ? [].concat(p.cite) : [])))].filter((n) => sources[n - 1]);
  let k = 0;
  return (
    <div className="gct" ref={root}>
      <Tag className="gct-text">
        {parts.map((p, i) => {
          if (typeof p === "string") return <span key={i}>{p}</span>;
          const nums = [].concat(p.cite).filter((n) => sources[n - 1]);
          return nums.map((n) => {
            const s = sources[n - 1];
            const key = `${i}-${n}`;
            const isOpen = open === key;
            k += 1;
            return (
              <span key={key} className="gct-ref" data-open={isOpen ? "" : undefined}
                onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(key)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setOpen((o) => (o === key ? null : o))}>
                <button type="button" className="gct-n" aria-expanded={isOpen} aria-label={`Source ${n}: ${s.title}`}
                  onPointerDown={(e) => { via.current = e.pointerType; }}
                  onClick={() => setOpen(via.current === "mouse" ? key : isOpen ? null : key)}
                  onFocus={(e) => e.target.matches(":focus-visible") && setOpen(key)}>{n}</button>
                {isOpen && (
                  <span className="gct-card" role="tooltip">
                    <span className="gct-site"><SiteBadge site={domainOf(s)} size={16} />{domainOf(s)}</span>
                    {s.href ? <a className="gct-title" href={s.href} target="_blank" rel="noreferrer">{s.title}</a> : <strong className="gct-title">{s.title}</strong>}
                    {s.snippet && <span className="gct-snip">{s.snippet}</span>}
                  </span>
                )}
              </span>
            );
          });
        })}
      </Tag>
      {footer && used.length > 0 && (
        <div className="gct-foot">
          <span className="gct-stack" aria-hidden="true">{used.slice(0, 4).map((n) => <SiteBadge key={n} site={domainOf(sources[n - 1])} size={18} />)}</span>
          <span>{used.length} source{used.length > 1 ? "s" : ""}</span>
          <span className="gct-chips">{used.map((n) => <button key={n} type="button" className="gct-chip" onClick={() => setOpen(`foot-${n}`)} aria-label={`Source ${n}`}>{domainOf(sources[n - 1])}</button>)}</span>
          {typeof open === "string" && open.startsWith("foot-") && (() => {
            const s = sources[+open.slice(5) - 1];
            return <span className="gct-card gct-card-foot" role="tooltip"><span className="gct-site"><SiteBadge site={domainOf(s)} size={16} />{domainOf(s)}</span><strong className="gct-title">{s.title}</strong>{s.snippet && <span className="gct-snip">{s.snippet}</span>}</span>;
          })()}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * GlassMessageActions: the row under an answer. Copy, rate, read aloud,
 * try again, and step between versions when there is more than one.
 * text            what Copy copies
 * versions, version, onVersion(n)   e.g. 3 and 2 shows ‹ 2 / 3 ›
 * onRegenerate, onRate(up|down|null), onSpeak(playing)
 * ------------------------------------------------------------------------- */
export function GlassMessageActions({ text = "", versions = 1, version = 1, onVersion, onRegenerate, onRate, onSpeak, busy = false }) {
  const [copied, setCopied] = useState(false);
  const [rate, setRate] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [spin, setSpin] = useState(0);
  useEffect(() => { if (!speaking) return; const t = setTimeout(() => { setSpeaking(false); onSpeak && onSpeak(false); }, Math.min(9000, 1200 + text.length * 40)); return () => clearTimeout(t); }, [speaking]);
  const copy = async () => { try { await navigator.clipboard.writeText(text); } catch (e) {} setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const doRate = (v) => { const n = rate === v ? null : v; setRate(n); onRate && onRate(n); };
  const tip = (label, el) => <span className="gma-tip-wrap">{el}<span className="gma-tip" aria-hidden="true">{label}</span></span>;
  return (
    <div className="gma" role="toolbar" aria-label="Answer actions" data-busy={busy ? "" : undefined}>
      {tip(copied ? "Copied" : "Copy", <button type="button" className="gma-btn" aria-label={copied ? "Copied" : "Copy"} data-done={copied ? "" : undefined} onClick={copy}><I d={copied ? P.check : P.copy} size={16} w={copied ? 2.4 : 1.8} /></button>)}
      {tip("Good answer", <button type="button" className="gma-btn" aria-label="Good answer" aria-pressed={rate === "up"} onClick={() => doRate("up")}><I d={P.thumb} fill={rate === "up" ? "currentColor" : undefined} /></button>)}
      {tip("Bad answer", <button type="button" className="gma-btn gma-down" aria-label="Bad answer" aria-pressed={rate === "down"} onClick={() => doRate("down")}><I d={P.thumb} fill={rate === "down" ? "currentColor" : undefined} /></button>)}
      {tip(speaking ? "Stop" : "Read aloud", <button type="button" className="gma-btn" aria-label={speaking ? "Stop reading" : "Read aloud"} aria-pressed={speaking} onClick={() => { setSpeaking(!speaking); onSpeak && onSpeak(!speaking); }}>
        {speaking ? <span className="gma-wave" aria-hidden="true"><i /><i /><i /><i /></span> : <I d={P.speak} />}
      </button>)}
      {onRegenerate && tip("Try again", <button type="button" className="gma-btn" aria-label="Try again" disabled={busy} onClick={() => { setSpin((s) => s + 1); onRegenerate(); }}><span className="gma-spin" key={spin}><I d={P.retry} /></span></button>)}
      {versions > 1 && (
        <span className="gma-ver" role="group" aria-label="Versions">
          <button type="button" className="gma-btn gma-sm" aria-label="Previous version" disabled={version <= 1} onClick={() => onVersion && onVersion(version - 1)}><I d={P.left} size={14} w={2.2} /></button>
          <span className="gma-count" aria-live="polite"><b key={version}>{version}</b> / {versions}</span>
          <button type="button" className="gma-btn gma-sm" aria-label="Next version" disabled={version >= versions} onClick={() => onVersion && onVersion(version + 1)}><I d={P.right} size={14} w={2.2} /></button>
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * GlassImageGen: an image that develops while your model makes it. It starts
 * as soft dots of colour and sharpens as progress climbs.
 * progress   0 to 1, from your model; leave it out to fake a gentle climb
 * children   the finished image (an <img>, or anything)
 * prompt     shown under it
 * ratio      "1 / 1", "4 / 5", "16 / 9"
 * onCancel, onDone
 * ------------------------------------------------------------------------- */
export function GlassImageGen({ progress, children, prompt, ratio = "4 / 5", onCancel, onDone, duration = 6000, run = 0 }) {
  const [fake, setFake] = useState(progress == null ? 0 : progress);
  useEffect(() => {
    if (progress != null) return;
    if (reduce()) { setFake(1); return; }
    setFake(0);
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const x = Math.min(1, (t - t0) / duration);
      setFake(1 - Math.pow(1 - x, 2.2));
      if (x < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, run, duration]);
  const p = progress == null ? fake : Math.max(0, Math.min(1, progress));
  const done = p >= 1;
  useEffect(() => { if (done && onDone) onDone(); }, [done]);
  return (
    <figure className="gig" data-done={done ? "" : undefined} style={{ "--p": p, aspectRatio: ratio }}>
      <div className="gig-art">{children}</div>
      <div className="gig-dots" aria-hidden="true" />
      <div className="gig-shine" aria-hidden="true" />
      {!done && (
        <div className="gig-hud">
          <span className="gig-ring" role="progressbar" aria-label="Making the image" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)}><b>{Math.round(p * 100)}%</b></span>
          {onCancel && <button type="button" className="gig-cancel" onClick={onCancel} aria-label="Stop"><I d={P.x} size={14} w={2.2} /></button>}
        </div>
      )}
      {prompt && <figcaption className="gig-cap">{done ? prompt : p < 0.35 ? "Sketching shapes…" : p < 0.75 ? "Adding colour and light…" : "Sharpening details…"}</figcaption>}
    </figure>
  );
}

/* ---------------------------------------------------------------------------
 * GlassResearch: deep research you can watch. A plan, a live count of the
 * pages read, the page it is reading now, and a stop button. When it ends it
 * folds into a small summary card.
 * title
 * steps     [{ label, status: "todo" | "active" | "done" }]
 * sources   [{ title, domain }]    the pages read so far
 * reading   the page being read now (a source)
 * status    "running" | "done" | "stopped"
 * elapsed   "3m 12s"
 * onStop, onOpen
 * ------------------------------------------------------------------------- */
export function GlassResearch({ title = "Research", steps = [], sources = [], reading, status = "running", elapsed, onStop, onOpen }) {
  const done = steps.filter((s) => s.status === "done").length;
  const p = steps.length ? (done + (steps.some((s) => s.status === "active") ? 0.5 : 0)) / steps.length : 0;
  if (status === "done") {
    return (
      <button type="button" className="grs grs-done" onClick={onOpen}>
        <span className="grs-art" aria-hidden="true"><I d={P.file} size={20} /></span>
        <span className="grs-sum">
          <strong>{title}</strong>
          <span><span className="grs-stack" aria-hidden="true">{sources.slice(0, 3).map((s, i) => <SiteBadge key={i} site={s.domain} size={16} />)}</span>{sources.length} sources · {steps.length} steps{elapsed ? " · " + elapsed : ""}</span>
        </span>
        <span className="grs-open">Open</span>
      </button>
    );
  }
  return (
    <section className="grs" aria-label={title} data-status={status}>
      <header className="grs-head">
        <span className="grs-badge"><I d={P.globe} size={14} />Deep research</span>
        <strong className="grs-title">{title}</strong>
        {status === "running" && onStop && <button type="button" className="grs-stop" onClick={onStop} aria-label="Stop research"><I d={P.stop} size={12} w={0} fill="currentColor" /></button>}
      </header>
      <ol className="grs-steps">
        {steps.map((s, i) => (
          <li key={i} data-s={s.status} style={{ "--i": i }}>
            <span className="grs-dot" aria-hidden="true">{s.status === "done" ? <I d={P.check} size={11} w={3} /> : s.status === "active" ? <i /> : null}</span>
            <span>{s.label}</span>
          </li>
        ))}
      </ol>
      <div className="grs-live" aria-live="polite">
        <span className="grs-stack" aria-hidden="true">{sources.slice(-5).map((s, i) => <SiteBadge key={sources.length - 5 + i} site={s.domain} size={20} />)}</span>
        <span className="grs-count"><b key={sources.length}>{sources.length}</b> {sources.length === 1 ? "page" : "pages"} read</span>
        {reading && status === "running" && <span className="grs-now" key={reading.title}>Reading <em>{reading.title}</em></span>}
        {status === "stopped" && <span className="grs-now">Stopped. Showing what it found so far.</span>}
      </div>
      <div className="grs-bar" aria-hidden="true"><i style={{ width: `${Math.max(4, p * 100)}%` }} /></div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * GlassComposer: the message box, grown up. Files sit above the text as
 * chips, a mode (like Research) shows as a removable tag, and the plus menu
 * adds files or turns modes on.
 * value, onChange, onSend(text)
 * attachments    [{ id, name, size?, kind: "file" | "image", preview?, progress? }]
 * onAttach()     the plus menu's "Add files"; you open the file picker
 * onRemove(id)
 * modes          [{ id, label, icon? }]   mode, onMode(id | null)
 * right          elements before the send button (a model picker, a mic)
 * busy, onStop
 * ------------------------------------------------------------------------- */
export function GlassComposer({ value = "", onChange, onSend, attachments = [], onAttach, onRemove, modes = [], mode, onMode, right, busy = false, onStop, placeholder = "Ask anything" }) {
  const [menu, setMenu] = useState(false);
  const ta = useRef(null);
  const box = useRef(null);
  useEffect(() => { const el = ta.current; if (!el) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; }, [value]);
  useEffect(() => {
    if (!menu) return;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setMenu(false); };
    const esc = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [menu]);
  const m = modes.find((x) => x.id === mode);
  const uploading = attachments.some((a) => a.progress != null && a.progress < 1);
  const can = value.trim() && !busy && !uploading;
  const send = () => { if (can && onSend) { gsnd("send"); onSend(value.trim()); } };
  return (
    <div className="gkc" ref={box} data-busy={busy ? "" : undefined}>
      {attachments.length > 0 && (
        <div className="gkc-files">
          {attachments.map((a) => (
            <span key={a.id} className="gkc-file" data-kind={a.kind || "file"}>
              {a.kind === "image" ? <span className="gkc-thumb" style={{ background: a.preview }} aria-hidden="true" /> : <span className="gkc-ficon" aria-hidden="true"><I d={P.file} size={16} /></span>}
              <span className="gkc-fname"><b>{a.name}</b>{a.size && <em>{a.progress != null && a.progress < 1 ? `Uploading ${Math.round(a.progress * 100)}%` : a.size}</em>}</span>
              {a.progress != null && a.progress < 1 && <span className="gkc-up" style={{ "--p": a.progress }} aria-hidden="true" />}
              {onRemove && <button type="button" className="gkc-x" aria-label={"Remove " + a.name} onClick={() => onRemove(a.id)}><I d={P.x} size={11} w={2.6} /></button>}
            </span>
          ))}
        </div>
      )}
      <textarea ref={ta} className="gkc-input" rows={1} value={value} placeholder={m ? `${m.label}: ${placeholder.toLowerCase()}` : placeholder} aria-label={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
      <div className="gkc-bar">
        <span className="gkc-plus-wrap">
          <button type="button" className="gkc-round" aria-label="Add" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu(!menu)} data-on={menu ? "" : undefined}><I d={P.plus} size={18} w={2} /></button>
          {menu && (
            <div className="gkc-menu" role="menu">
              {onAttach && <button type="button" role="menuitem" onClick={() => { setMenu(false); onAttach(); }}><I d={P.file} />Add photos and files</button>}
              {modes.map((x) => (
                <button key={x.id} type="button" role="menuitemcheckbox" aria-checked={mode === x.id} onClick={() => { setMenu(false); onMode && onMode(mode === x.id ? null : x.id); }}>
                  {x.icon || <I d={P.spark} />}{x.label}<span className="gkc-switch" data-on={mode === x.id ? "" : undefined} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </span>
        {m && <span className="gkc-mode">{m.icon || <I d={P.spark} size={14} />}{m.label}<button type="button" aria-label={"Turn off " + m.label} onClick={() => onMode && onMode(null)}><I d={P.x} size={11} w={2.6} /></button></span>}
        <span className="gkc-grow" />
        {right}
        {busy
          ? <button type="button" className="gkc-send" data-stop="" aria-label="Stop" onClick={onStop}><I d={P.stop} size={12} w={0} fill="currentColor" /></button>
          : <button type="button" className="gkc-send" aria-label="Send" disabled={!can} onClick={send}><I d={P.up} size={18} w={2.2} /></button>}
      </div>
    </div>
  );
}
