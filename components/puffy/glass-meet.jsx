"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GlassAvatar, GlassAvatarGroup } from "./glass-app.jsx";
import "./glass-meet.css";

/* AI meeting parts: the bar while a meeting is recorded, the card before it
   starts, the notes written after, the action items, who talked how much,
   and the key moments on a timeline. People use the library Avatar, and each
   person keeps the same colour in every part. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hueOf = (s = "") => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const I = ({ d, size = 16, w = 1.8, fill }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill || "none"} stroke={fill ? "none" : "currentColor"} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  pause: "M8 5h3v14H8zM13 5h3v14h-3z", play: "M8 5.5v13l10.5-6.5z", stop: "M7 7h10v10H7z", check: "M5 12.5l4.5 4.5L19 7.5",
  copy: "M9 9h10v10H9zM5 15V5h10", spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z", video: "M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 10l5-3v10l-5-3",
  cal: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 2v4M16 2v4", send: "M4 12l16-8-6 16-2.5-6.5z",
  down: "M6 9l6 6 6-6", flag: "M5 21V4h11l-2 4 2 4H5", q: "M9.1 9a3 3 0 1 1 4.2 2.7c-.8.4-1.3 1.1-1.3 2V15M12 18h.01", bolt: "M13 3L5 14h6l-1 7 8-11h-6z", star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
};
const mmss = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0"); };
const firstName = (n = "") => n.split(" ")[0];

/* =====================================================================
   Recording bar: what shows while the notetaker is in the meeting
   ===================================================================== */
/** title, people [names], paused, onPause(next), onStop, elapsed (s, optional: it counts itself), level 0..1 (optional mic level) */
export function GlassRecordingBar({ title = "Meeting", people = [], paused = false, onPause, onStop, elapsed, level, className = "" }) {
  const [own, setOwn] = useState(0);
  useEffect(() => { if (elapsed != null || paused) return; const id = setInterval(() => setOwn((s) => s + 1), 1000); return () => clearInterval(id); }, [paused, elapsed]);
  const secs = elapsed != null ? elapsed : own;
  const bars = useMemo(() => Array.from({ length: 5 }, (_, k) => k), []);
  // In a narrow space the level bars and faces step aside so the title and time never overlap
  const ref = useRef(null);
  const full = useRef(0);
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current; const box = el && el.parentElement;
    if (!el || !box || typeof ResizeObserver === "undefined") return;
    const check = () => {
      // measure the bar at its full natural width, then put it back
      const had = el.hasAttribute("data-compact"); if (had) el.removeAttribute("data-compact");
      const w = el.style.width, mw = el.style.maxWidth; el.style.width = "max-content"; el.style.maxWidth = "none";
      full.current = el.offsetWidth; el.style.width = w; el.style.maxWidth = mw; if (had) el.setAttribute("data-compact", "");
      const room = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft || 0) - parseFloat(getComputedStyle(box).paddingRight || 0);
      setCompact(full.current > room + 1);
    };
    const ro = new ResizeObserver(check); ro.observe(box); check();
    return () => ro.disconnect();
  }, [people.length]);
  return (
    <div ref={ref} className={"gmx gmx-rec " + className} data-paused={paused ? "" : undefined} data-compact={compact ? "" : undefined} role="group" aria-label={`Recording ${title}`}>
      <span className="gmx-rec-dot" aria-hidden="true" />
      <span className="gmx-rec-text"><b>{paused ? "Paused" : "Recording"}</b><em>{title}</em></span>
      <span className="gmx-rec-time" aria-live="off">{mmss(secs)}</span>
      <span className="gmx-rec-wave" aria-hidden="true" style={level != null ? { "--lv": clamp(level, 0.1, 1) } : undefined}>{bars.map((k) => <i key={k} style={{ animationDelay: k * -0.17 + "s" }} />)}</span>
      {people.length > 0 && <span className="gmx-rec-people"><GlassAvatarGroup people={people.map((name) => ({ name }))} max={3} size="sm" /></span>}
      <span className="gmx-rec-acts">
        {onPause && <button type="button" className="gmx-ib" aria-label={paused ? "Resume recording" : "Pause recording"} onClick={() => { gsnd("tick"); onPause(!paused); }}><I d={paused ? P.play : P.pause} size={15} fill="currentColor" /></button>}
        {onStop && <button type="button" className="gmx-ib gmx-stop" aria-label="Stop and write notes" onClick={() => { gsnd("success"); onStop(); }}><I d={P.stop} size={13} fill="currentColor" /></button>}
      </span>
    </div>
  );
}

/* =====================================================================
   Meeting prep: the card before a meeting, with what to remember
   ===================================================================== */
/** title, start (Date), end (Date), people [names], where, brief [strings], notetaker, onNotetaker(next), onJoin */
export function GlassMeetingPrep({ title, start, end, people = [], where, brief = [], notetaker = true, onNotetaker, onJoin, className = "" }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(id); }, []);
  const s = start ? +new Date(start) : now, e = end ? +new Date(end) : s + 30 * 60000;
  const mins = Math.round((s - now) / 60000);
  const state = now >= e ? "ended" : now >= s ? "live" : mins <= 10 ? "soon" : "later";
  const when = state === "ended" ? "Ended" : state === "live" ? "Happening now" : mins < 60 ? `Starts in ${mins} min` : `Starts at ${new Date(s).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  const time = (d) => new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <article className={"gmx gmx-card gmx-prep " + className} data-state={state}>
      <header className="gmx-prep-top">
        <span className="gmx-chip" data-state={state}>{state === "live" && <i className="gmx-live" />}{when}</span>
        <span className="gmx-prep-time"><I d={P.cal} size={14} />{time(s)} – {time(e)}</span>
      </header>
      <h3 className="gmx-prep-title">{title}</h3>
      <div className="gmx-prep-who">
        <GlassAvatarGroup people={people.map((name) => ({ name }))} max={4} size="sm" />
        <span>{people.length > 2 ? `${firstName(people[0])}, ${firstName(people[1])} and ${people.length - 2} more` : people.map(firstName).join(" and ")}{where ? ` · ${where}` : ""}</span>
      </div>
      {brief.length > 0 && (
        <section className="gmx-prep-brief">
          <span className="gmx-label"><I d={P.spark} size={13} />From last time</span>
          <ul>{brief.map((b, k) => <li key={k} style={{ "--i": k }}>{b}</li>)}</ul>
        </section>
      )}
      <footer className="gmx-prep-foot">
        {onNotetaker && (
          <label className="gmx-switch">
            <input type="checkbox" role="switch" checked={notetaker} onChange={(ev) => { gsnd(ev.target.checked ? "toggleOn" : "toggleOff"); onNotetaker(ev.target.checked); }} />
            <span className="gmx-switch-track" aria-hidden="true"><i /></span>
            <span>Take notes for me</span>
          </label>
        )}
        {onJoin && <button type="button" className="gmx-btn gmx-btn-main" disabled={state === "ended"} onClick={onJoin}><I d={P.video} size={16} />Join</button>}
      </footer>
    </article>
  );
}

/* =====================================================================
   Meeting notes: summary and decisions, written after the meeting
   ===================================================================== */
/** title, meta, status "empty" | "writing" | "done", summary, decisions [strings], onWrite, onCopy */
export function GlassMeetingNotes({ title = "Notes", meta, status = "done", summary, decisions = [], onWrite, onCopy, className = "" }) {
  const [copied, setCopied] = useState(false);
  return (
    <article className={"gmx gmx-card gmx-notes " + className} data-status={status} aria-busy={status === "writing"}>
      <header className="gmx-notes-top">
        <span className="gmx-notes-mark" aria-hidden="true"><I d={P.spark} size={15} /></span>
        <span className="gmx-notes-head"><b>{title}</b>{meta && <em>{meta}</em>}</span>
        {status === "done" && onCopy && (
          <button type="button" className="gmx-btn" onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>
            <I d={copied ? P.check : P.copy} size={14} w={copied ? 2.4 : 1.8} />{copied ? "Copied" : "Copy"}
          </button>
        )}
      </header>
      {status === "empty" && (
        <div className="gmx-notes-empty">
          <p>The recording is saved. Notes take a few seconds.</p>
          {onWrite && <button type="button" className="gmx-btn gmx-btn-main" onClick={onWrite}><I d={P.spark} size={15} />Write the notes</button>}
        </div>
      )}
      {status === "writing" && (
        <div className="gmx-notes-skel" aria-label="Writing the notes">
          <span className="gmx-shimmer">Reading 42 minutes of conversation…</span>
          {[92, 100, 76, 0, 64, 88].map((w, k) => (w ? <i key={k} style={{ width: w + "%", "--i": k }} /> : <b key={k} />))}
        </div>
      )}
      {status === "done" && (
        <div className="gmx-notes-body">
          {summary && <section style={{ "--i": 0 }}><span className="gmx-label">Summary</span><p>{summary}</p></section>}
          {decisions.length > 0 && (
            <section style={{ "--i": 1 }}>
              <span className="gmx-label">Decided</span>
              <ul className="gmx-decide">{decisions.map((d, k) => <li key={k}><span className="gmx-tick" aria-hidden="true"><I d={P.check} size={11} w={3} /></span>{d}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

/* =====================================================================
   Action items: what people agreed to do, with an owner and a date
   ===================================================================== */
/** items [{ id, text, owner, due, done }], people [names], onChange(items), onSend */
export function GlassActionItems({ items = [], people = [], onChange, onSend, title = "Action items", className = "" }) {
  const [menu, setMenu] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (menu == null) return;
    const out = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(null); };
    const esc = (e) => e.key === "Escape" && setMenu(null);
    document.addEventListener("pointerdown", out); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", out); document.removeEventListener("keydown", esc); };
  }, [menu]);
  const set = (id, patch) => onChange && onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const done = items.filter((x) => x.done).length;
  return (
    <section ref={ref} className={"gmx gmx-card gmx-acts " + className} aria-label={title}>
      <header className="gmx-acts-top">
        <b>{title}</b>
        <span className="gmx-acts-count">{done} of {items.length} done</span>
        <span className="gmx-acts-bar" aria-hidden="true"><i style={{ width: items.length ? (done / items.length) * 100 + "%" : 0 }} /></span>
      </header>
      <ul className="gmx-acts-list">
        {items.map((it, k) => (
          <li key={it.id} className="gmx-act" data-done={it.done ? "" : undefined} style={{ "--i": k }}>
            <button type="button" role="checkbox" aria-checked={!!it.done} className="gmx-check" aria-label={(it.done ? "Mark not done: " : "Mark done: ") + it.text}
              onClick={() => { gsnd(it.done ? "toggleOff" : "success"); set(it.id, { done: !it.done }); }}><I d={P.check} size={12} w={3} /></button>
            <span className="gmx-act-text">{it.text}</span>
            <span className="gmx-act-meta">
              {it.due && <span className="gmx-due">{it.due}</span>}
              <span className="gmx-owner-wrap">
                <button type="button" className="gmx-owner" aria-haspopup="listbox" aria-expanded={menu === it.id} aria-label={`Owner: ${it.owner || "nobody"}. Change`} onClick={() => setMenu(menu === it.id ? null : it.id)}>
                  {it.owner ? <GlassAvatar name={it.owner} size="sm" /> : <span className="gmx-owner-none">+</span>}
                  <span className="gmx-owner-name">{it.owner ? firstName(it.owner) : "Assign"}</span>
                </button>
                {menu === it.id && (
                  <span className="gmx-menu" role="listbox" aria-label="Choose an owner">
                    {people.map((p) => (
                      <button key={p} type="button" role="option" aria-selected={p === it.owner} onClick={() => { gsnd("tick"); set(it.id, { owner: p }); setMenu(null); }}>
                        <GlassAvatar name={p} size="sm" />{p}{p === it.owner && <I d={P.check} size={14} w={2.4} />}
                      </button>
                    ))}
                  </span>
                )}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {onSend && <footer className="gmx-acts-foot"><button type="button" className="gmx-btn gmx-btn-main" onClick={onSend}><I d={P.send} size={15} />Send to tasks</button></footer>}
    </section>
  );
}

/* =====================================================================
   Talk time: who spoke, and how much
   ===================================================================== */
/** speakers [{ name, secs }] */
export function GlassTalkTime({ speakers = [], title = "Talk time", className = "" }) {
  const list = [...speakers].sort((a, b) => b.secs - a.secs);
  const total = list.reduce((s, x) => s + x.secs, 0) || 1;
  const [on, setOn] = useState(null);
  const top = list[0];
  const share = (x) => Math.round((x.secs / total) * 100);
  return (
    <section className={"gmx gmx-card gmx-talk " + className} aria-label={title}>
      <header className="gmx-talk-top"><b>{title}</b><em>{mmss(total)} in all</em></header>
      <div className="gmx-talk-strip" role="img" aria-label={list.map((x) => `${x.name} ${share(x)}%`).join(", ")}>
        {list.map((x) => <i key={x.name} data-dim={on && on !== x.name ? "" : undefined} style={{ flexGrow: x.secs, "--h": hueOf(x.name) }} />)}
      </div>
      <ul className="gmx-talk-list">
        {list.map((x, k) => (
          <li key={x.name} style={{ "--h": hueOf(x.name), "--i": k }} data-dim={on && on !== x.name ? "" : undefined} onPointerEnter={() => setOn(x.name)} onPointerLeave={() => setOn(null)}>
            <GlassAvatar name={x.name} size="sm" />
            <span className="gmx-talk-name">{x.name}</span>
            <span className="gmx-talk-bar"><i style={{ width: (x.secs / top.secs) * 100 + "%" }} /></span>
            <b>{share(x)}%</b>
            <em>{mmss(x.secs)}</em>
          </li>
        ))}
      </ul>
      {top && share(top) >= 45 && list.length > 2 && <p className="gmx-talk-note">{firstName(top.name)} spoke for {share(top) >= 50 ? "over half" : "almost half"} of the meeting.</p>}
    </section>
  );
}

/* =====================================================================
   Key moments: decisions, questions and actions on the meeting's timeline
   ===================================================================== */
const KIND = { decision: ["Decision", P.flag], question: ["Question", P.q], action: ["Action", P.bolt], highlight: ["Highlight", P.star] };
/** duration (s), moments [{ at, kind: decision | question | action | highlight, label }], current (s), onSeek(at) */
export function GlassKeyMoments({ duration = 1, moments = [], current = 0, onSeek, title = "Key moments", className = "" }) {
  const kinds = Object.keys(KIND).filter((k) => moments.some((m) => m.kind === k));
  const [only, setOnly] = useState(null);
  const [tip, setTip] = useState(null);
  const shown = moments.filter((m) => !only || m.kind === only).sort((a, b) => a.at - b.at);
  const near = shown.reduce((best, m) => (m.at <= current + 1 ? m : best), null);
  return (
    <section className={"gmx gmx-card gmx-km " + className} aria-label={title}>
      <header className="gmx-km-top">
        <b>{title}</b>
        <span className="gmx-km-filter" role="group" aria-label="Show">
          <button type="button" aria-pressed={!only} onClick={() => setOnly(null)}>All</button>
          {kinds.map((k) => <button key={k} type="button" data-kind={k} aria-pressed={only === k} onClick={() => setOnly(only === k ? null : k)}>{KIND[k][0]}s</button>)}
        </span>
      </header>
      <div className="gmx-km-track" onPointerLeave={() => setTip(null)}>
        <span className="gmx-km-rail"><i style={{ width: clamp(current / duration, 0, 1) * 100 + "%" }} /></span>
        {shown.map((m, k) => (
          <button key={k} type="button" className="gmx-km-pin" data-kind={m.kind} data-on={near === m ? "" : undefined} style={{ left: clamp(m.at / duration, 0, 1) * 100 + "%" }}
            aria-label={`${KIND[m.kind][0]} at ${mmss(m.at)}: ${m.label}`} onPointerEnter={() => setTip(m)} onFocus={() => setTip(m)} onBlur={() => setTip(null)} onClick={() => { gsnd("tick"); onSeek && onSeek(m.at); }}>
            <I d={KIND[m.kind][1]} size={11} w={2.2} />
          </button>
        ))}
        <span className="gmx-km-head" style={{ left: clamp(current / duration, 0, 1) * 100 + "%" }} aria-hidden="true" />
        {tip && <span className="gmx-km-tip" style={{ left: clamp((tip.at / duration) * 100, 12, 88) + "%" }}><b>{mmss(tip.at)}</b>{tip.label}</span>}
      </div>
      <div className="gmx-km-ends" aria-hidden="true"><span>0:00</span><span>{mmss(duration)}</span></div>
      <ol className="gmx-km-list">
        {shown.map((m, k) => (
          <li key={m.at + m.label} style={{ "--i": k }}>
            <button type="button" data-on={near === m ? "" : undefined} onClick={() => { gsnd("tick"); onSeek && onSeek(m.at); }}>
              <span className="gmx-km-ic" data-kind={m.kind}><I d={KIND[m.kind][1]} size={13} w={2} /></span>
              <span className="gmx-km-label">{m.label}</span>
              <em>{mmss(m.at)}</em>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
