"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./glass-ai-more.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

/* More AI parts: reply versions, follow-ups, asking about a selection,
   error states, chat history, @mentions, an artifact panel, suggested
   edits, and four voice parts. None of them call a model; you pass in
   what yours returns. Colours come from the theme tokens. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const I = ({ d, size = 16, w = 1.8, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6", x: "M6 6l12 12M18 6L6 18", check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6", up: "M12 19V5M5.5 11.5L12 5l6.5 6.5", retry: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  quote: "M7 7h4v4c0 3-2 5-4 6M15 7h4v4c0 3-2 5-4 6", ask: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  copy: "M9 9h10v10H9zM5 15V5h10", search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4", pin: "M14 3l7 7-4 1-4 4 1 5-2 1-4-6-5 5M9 11l4 4",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13", pencil: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4", plus: "M12 5v14M5 12h14",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5", user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  tool: "M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4", alert: "M12 4l9 16H3zM12 10v4M12 17h.01", wifi: "M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2", play: "M7 5v14l12-7z", pause: "M7 5h3v14H7zM14 5h3v14h-3z", down: "M12 5v14M5.5 12.5L12 19l6.5-6.5",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4", doc: "M6 3h9l4 4v14H6zM9 12h6M9 16h6M9 8h3", mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
};
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function useOutside(open, ref, close) {
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
}

/* ---------- Reply versions: ‹ 2 of 3 › between regenerated answers ---------- */
export function GlassBranches({ versions = [], value, onChange, onRegenerate, render = (v) => v, className = "" }) {
  const [inner, setInner] = useState(versions.length - 1);
  const i = value == null ? inner : value;
  const [dir, setDir] = useState(0);
  const go = (n) => { if (n < 0 || n >= versions.length) return; setDir(n > i ? 1 : -1); onChange ? onChange(n) : setInner(n); };
  useEffect(() => { if (value == null) setInner(versions.length - 1); }, [versions.length]);
  return (
    <div className={"gam-br " + className}>
      <div className="gam-br-body" key={i} data-dir={dir}>{render(versions[i], i)}</div>
      <div className="gam-br-bar">
        {versions.length > 1 && <span className="gam-br-nav" role="group" aria-label="Versions of this reply">
          <button type="button" aria-label="Previous version" disabled={i === 0} onClick={() => go(i - 1)}><I d={P.left} size={14} w={2.2} /></button>
          <span aria-live="polite">{i + 1} of {versions.length}</span>
          <button type="button" aria-label="Next version" disabled={i === versions.length - 1} onClick={() => go(i + 1)}><I d={P.right} size={14} w={2.2} /></button>
        </span>}
        {onRegenerate && <button type="button" className="gam-ghost" onClick={onRegenerate}><I d={P.retry} size={14} />Try again</button>}
      </div>
    </div>
  );
}

/* ---------- Follow-ups: what to ask next, under a finished answer ---------- */
export function GlassFollowUps({ items = [], onPick, label = "Ask next", className = "" }) {
  return (
    <div className={"gam-fu " + className}>
      <span className="gam-fu-label">{label}</span>
      <div className="gam-fu-list">
        {items.map((t, k) => (
          <button key={t} type="button" style={{ "--k": k }} onClick={() => onPick && onPick(t)}>
            <span>{t}</span><I d={P.arrow} size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Ask about a selection: a small bar appears over selected text ---------- */
export function GlassSelectionAsk({ children, actions = [{ id: "ask", label: "Ask", icon: P.ask }, { id: "quote", label: "Quote", icon: P.quote }, { id: "copy", label: "Copy", icon: P.copy }], onAction, className = "" }) {
  const box = useRef(null);
  const [sel, setSel] = useState(null);
  useEffect(() => {
    const check = () => {
      const s = window.getSelection();
      const el = box.current;
      if (!s || s.isCollapsed || !el || !s.rangeCount || !el.contains(s.anchorNode) || !el.contains(s.focusNode)) { setSel(null); return; }
      const text = s.toString().trim();
      if (!text) { setSel(null); return; }
      const r = s.getRangeAt(0).getBoundingClientRect(), b = el.getBoundingClientRect();
      setSel({ text, x: Math.min(Math.max(r.left + r.width / 2 - b.left, 90), b.width - 90), y: r.top - b.top });
    };
    document.addEventListener("selectionchange", check);
    return () => document.removeEventListener("selectionchange", check);
  }, []);
  return (
    <div ref={box} className={"gam-sel " + className}>
      {children}
      {sel && (
        <div className="gam-sel-bar" role="toolbar" aria-label="Selected text" style={{ left: sel.x, top: sel.y }} onPointerDown={(e) => e.preventDefault()}>
          {actions.map((a) => (
            <button key={a.id} type="button" onClick={() => { onAction && onAction(a.id, sel.text); if (a.id === "copy") { try { navigator.clipboard.writeText(sel.text); } catch (e) {} } window.getSelection().removeAllRanges(); setSel(null); }}>
              <I d={a.icon} size={14} />{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Error states: say what happened and offer the next step ---------- */
const ERR = {
  failed: { icon: P.alert, title: "That answer didn't finish", tone: "bad" },
  tool: { icon: P.tool, title: "A tool didn't respond", tone: "bad" },
  limit: { icon: P.clock, title: "You're near your limit", tone: "warn" },
  offline: { icon: P.wifi, title: "Connection lost", tone: "warn" },
};
export function GlassChatError({ kind = "failed", title, children, action, onAction, secondary, onSecondary, className = "" }) {
  const k = ERR[kind] || ERR.failed;
  return (
    <div className={"gam-err " + className} data-tone={k.tone} role="alert">
      <span className="gam-err-ic"><I d={k.icon} size={16} w={2} /></span>
      <div className="gam-err-txt"><b>{title || k.title}</b>{children && <span>{children}</span>}</div>
      <div className="gam-err-acts">
        {secondary && <button type="button" className="gam-ghost" onClick={onSecondary}>{secondary}</button>}
        {action && <button type="button" className="gam-solid" onClick={onAction}>{kind === "failed" || kind === "tool" ? <I d={P.retry} size={14} /> : null}{action}</button>}
      </div>
    </div>
  );
}

/* ---------- Chat history: past chats grouped by when, with search, pin, rename, delete ---------- */
export function GlassHistory({ chats = [], value, onChange, onNew, onRename, onDelete, onPin, title = "Chats", className = "" }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null);
  const [menu, setMenu] = useState(null);
  const [gone, setGone] = useState(null);
  const menuRef = useRef(null);
  useOutside(menu != null, menuRef, () => setMenu(null));
  const shown = chats.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()));
  const groups = [["Pinned", shown.filter((c) => c.pinned)], ...["Today", "Yesterday", "Earlier"].map((g) => [g, shown.filter((c) => !c.pinned && (c.when || "Earlier") === g)])].filter(([, l]) => l.length);
  // Matching letters are marked while searching
  const mark = (t) => { if (!q) return t; const i = t.toLowerCase().indexOf(q.toLowerCase()); return i < 0 ? t : <>{t.slice(0, i)}<mark>{t.slice(i, i + q.length)}</mark>{t.slice(i + q.length)}</>; };
  const del = (id) => { setMenu(null); setGone(id); setTimeout(() => { setGone(null); onDelete && onDelete(id); }, reduce() ? 0 : 280); };
  let k = 0;
  return (
    <nav className={"gam-hist " + className} aria-label={title}>
      <div className="gam-hist-in">
        <div className="gam-hist-bar">
          <b>{title}</b><span className="gam-hist-count">{chats.length}</span>
          {onNew && <button type="button" className="gam-hist-new" onClick={onNew}><I d={P.plus} size={14} w={2.4} />New</button>}
        </div>
        <label className="gam-hist-search"><I d={P.search} size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search chats" />{q && <button type="button" aria-label="Clear search" onClick={() => setQ("")}><I d={P.x} size={12} w={2.4} /></button>}</label>
        <div className="gam-hist-list">
          {groups.map(([g, list]) => (
            <div key={g} className="gam-hist-group">
              <span className="gam-hist-head">{g === "Pinned" && <I d={P.pin} size={11} />}{g}</span>
              {list.map((c) => (
                <div key={c.id} className="gam-hist-row" aria-current={c.id === value ? "page" : undefined} data-open={menu === c.id ? "" : undefined} data-gone={gone === c.id ? "" : undefined} style={{ "--i": k++ }}>
                  {edit === c.id ? (
                    <input className="gam-hist-edit" autoFocus defaultValue={c.title} aria-label="Chat name"
                      onBlur={(e) => { onRename && onRename(c.id, e.target.value.trim() || c.title); setEdit(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEdit(null); }} />
                  ) : (
                    <button type="button" className="gam-hist-item" onClick={() => onChange && onChange(c.id)}>
                      <span className="gam-hist-t">{mark(c.title)}</span>
                      {c.time && <em className="gam-hist-time">{c.time}</em>}
                    </button>
                  )}
                  <span className="gam-hist-more-wrap" ref={menu === c.id ? menuRef : undefined}>
                    <button type="button" className="gam-hist-more" aria-label={`Options for ${c.title}`} aria-haspopup="menu" aria-expanded={menu === c.id} onClick={() => setMenu(menu === c.id ? null : c.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="18" cy="12" r="1.6" fill="currentColor" /></svg>
                    </button>
                    {menu === c.id && (
                      <span className="gam-hist-menu" role="menu">
                        <button type="button" role="menuitem" onClick={() => { setMenu(null); onPin && onPin(c.id, !c.pinned); }}><I d={P.pin} size={15} />{c.pinned ? "Unpin" : "Pin to top"}</button>
                        <button type="button" role="menuitem" onClick={() => { setMenu(null); setEdit(c.id); }}><I d={P.pencil} size={15} />Rename</button>
                        <span className="gam-hist-sep" />
                        <button type="button" role="menuitem" data-danger="" onClick={() => del(c.id)}><I d={P.trash} size={15} />Delete</button>
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ))}
          {!groups.length && <p className="gam-hist-none">No chats called “{q}”.</p>}
        </div>
      </div>
    </nav>
  );
}

/* ---------- Mentions: type @ to add a file, person or tool as a chip ---------- */
const KIND_ICON = { file: P.file, person: P.user, tool: P.tool, web: P.globe };
export function GlassMentions({ options = [], value = [], onChange, onSend, placeholder = "Ask anything. Type @ to add context", className = "" }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState(null);
  const [hi, setHi] = useState(0);
  const ta = useRef(null);
  const list = q == null ? [] : options.filter((o) => !value.some((v) => v.id === o.id) && o.label.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const change = (e) => {
    const v = e.target.value; setText(v);
    const upto = v.slice(0, e.target.selectionStart);
    const m = /(^|\s)@([\w.-]*)$/.exec(upto);
    setQ(m ? m[2] : null); setHi(0);
  };
  const pick = (o) => {
    const el = ta.current; const pos = el.selectionStart;
    const before = text.slice(0, pos).replace(/@[\w.-]*$/, ""); const after = text.slice(pos);
    setText(before + after); setQ(null);
    onChange && onChange([...value, o]);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(before.length, before.length); });
  };
  const key = (e) => {
    if (list.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHi((hi + 1) % list.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHi((hi - 1 + list.length) % list.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(list[hi]); return; }
      if (e.key === "Escape") { setQ(null); return; }
    }
    if (e.key === "Backspace" && !text && value.length) onChange && onChange(value.slice(0, -1));
    if (e.key === "Enter" && !e.shiftKey && (text.trim() || value.length)) { e.preventDefault(); gsnd("send"); onSend && onSend(text.trim(), value); setText(""); }
  };
  return (
    <div className={"gam-men " + className}>
      {list.length > 0 && (
        <ul className="gam-men-pop" role="listbox" aria-label="Add context">
          {list.map((o, k) => (
            <li key={o.id} role="option" aria-selected={k === hi} onPointerDown={(e) => { e.preventDefault(); pick(o); }} onPointerEnter={() => setHi(k)}>
              <span className="gam-men-ic" data-kind={o.kind}><I d={KIND_ICON[o.kind] || P.file} size={14} /></span><b>{o.label}</b><em>{o.hint || o.kind}</em>
            </li>
          ))}
        </ul>
      )}
      {value.length > 0 && (
        <div className="gam-men-chips">
          {value.map((o) => (
            <span key={o.id} className="gam-men-chip" data-kind={o.kind}><I d={KIND_ICON[o.kind] || P.file} size={12} />{o.label}
              <button type="button" aria-label={`Remove ${o.label}`} onClick={() => onChange && onChange(value.filter((v) => v.id !== o.id))}><I d={P.x} size={10} w={2.4} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="gam-men-row">
        <textarea ref={ta} rows={2} value={text} onChange={change} onKeyDown={key} placeholder={placeholder} aria-label="Message" />
        <button type="button" className="gam-men-send" aria-label="Send" disabled={!text.trim() && !value.length} onClick={() => { gsnd("send"); onSend && onSend(text.trim(), value); setText(""); }}><I d={P.up} size={16} w={2.2} /></button>
      </div>
    </div>
  );
}

/* ---------- Artifact panel: a document or code beside the chat, with versions ---------- */
export function GlassArtifact({ title, kind = "doc", versions = [], value, onChange, onClose, onCopy, onDownload, render, className = "" }) {
  const [inner, setInner] = useState(versions.length - 1);
  const v = value == null ? inner : value;
  const set = (n) => (onChange ? onChange(n) : setInner(n));
  useEffect(() => { if (value == null) setInner(versions.length - 1); }, [versions.length]);
  const cur = versions[v] || "";
  return (
    <section className={"gam-art " + className} aria-label={title}>
      <header className="gam-art-head">
        <span className="gam-art-ic"><I d={kind === "code" ? P.code : P.doc} size={15} /></span>
        <b>{title}</b>
        {versions.length > 1 && (
          <span className="gam-art-vers" role="group" aria-label="Versions">
            {versions.map((_, k) => <button key={k} type="button" aria-pressed={k === v} onClick={() => set(k)}>v{k + 1}</button>)}
          </span>
        )}
        <span className="gam-art-acts">
          {onCopy !== false && <button type="button" aria-label="Copy" onClick={() => { try { navigator.clipboard.writeText(typeof cur === "string" ? cur : ""); } catch (e) {} onCopy && onCopy(); }}><I d={P.copy} size={15} /></button>}
          {onDownload && <button type="button" aria-label="Download" onClick={() => onDownload(cur, v)}><I d={P.down} size={15} /></button>}
          {onClose && <button type="button" aria-label="Close" onClick={onClose}><I d={P.x} size={15} /></button>}
        </span>
      </header>
      <div className="gam-art-body" key={v} data-kind={kind}>{render ? render(cur, v) : kind === "code" ? <pre><code>{cur}</code></pre> : <div className="gam-art-doc">{cur}</div>}</div>
    </section>
  );
}

/* ---------- Suggested edits: each change can be kept or dropped ---------- */
export function GlassDiff({ parts = [], onDone, className = "" }) {
  // parts: strings (unchanged) or { id, from, to }
  const [state, setState] = useState({});
  const changes = parts.filter((p) => typeof p === "object");
  const left = changes.filter((c) => !state[c.id]).length;
  const decide = (id, v) => setState((s) => ({ ...s, [id]: v }));
  const all = (v) => setState(Object.fromEntries(changes.map((c) => [c.id, v])));
  useEffect(() => { if (changes.length && !left && onDone) onDone(state); }, [left]);
  return (
    <div className={"gam-diff " + className}>
      <div className="gam-diff-top">
        <b>{left ? `${left} suggested ${left === 1 ? "change" : "changes"}` : "All changes reviewed"}</b>
        {left > 0 ? <span><button type="button" className="gam-ghost" onClick={() => all("no")}>Reject all</button><button type="button" className="gam-solid" onClick={() => all("yes")}><I d={P.check} size={14} w={2.2} />Accept all</button></span>
          : <button type="button" className="gam-ghost" onClick={() => setState({})}><I d={P.retry} size={14} />Review again</button>}
      </div>
      <p className="gam-diff-text">
        {parts.map((p, k) => typeof p === "string" ? <span key={k}>{p}</span> : (
          <span key={p.id} className="gam-chg" data-s={state[p.id] || "open"}>
            {state[p.id] !== "yes" && p.from && <del>{p.from}</del>}
            {state[p.id] !== "no" && p.to && <ins>{p.to}</ins>}
            {!state[p.id] && (
              <span className="gam-chg-acts">
                <button type="button" aria-label={`Keep “${p.to || "removal"}”`} onClick={() => decide(p.id, "yes")}><I d={P.check} size={12} w={2.6} /></button>
                <button type="button" aria-label="Drop this change" onClick={() => decide(p.id, "no")}><I d={P.x} size={12} w={2.6} /></button>
              </span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

/* ---------- Live waveform: bars that move with a voice ---------- */
export function GlassWaveform({ active = true, stream, bars = 32, height = 56, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const kids = [...el.children];
    let raf, an, data, ctx;
    if (stream && window.AudioContext) {
      try { ctx = new AudioContext(); an = ctx.createAnalyser(); an.fftSize = 128; ctx.createMediaStreamSource(stream).connect(an); data = new Uint8Array(an.frequencyBinCount); } catch (e) { an = null; }
    }
    let t = 0;
    const tick = () => {
      t += 0.06;
      if (an) an.getByteFrequencyData(data);
      kids.forEach((k, i) => {
        let v;
        if (!active) v = 0.08;
        else if (an) v = data[Math.floor((i / bars) * data.length * 0.7)] / 255;
        else { const env = 0.55 + 0.45 * Math.sin(t * 0.7 + Math.sin(t * 0.23) * 2); v = Math.max(0.06, env * Math.abs(Math.sin(i * 0.55 + t * 2.1) * Math.cos(i * 0.21 - t * 1.3)) * (1 - Math.abs(i / bars - 0.5) * 0.9)); }
        k.style.transform = `scaleY(${Math.max(0.06, Math.min(1, v)).toFixed(3)})`;
      });
      raf = requestAnimationFrame(tick);
    };
    if (reduce()) kids.forEach((k, i) => (k.style.transform = `scaleY(${active ? 0.2 + 0.5 * Math.abs(Math.sin(i)) : 0.08})`));
    else raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (ctx) ctx.close(); };
  }, [active, stream, bars]);
  return <div ref={ref} className={"gam-wave " + className} data-active={active ? "" : undefined} style={{ height }} role="img" aria-label={active ? "Listening" : "Paused"}>{Array.from({ length: bars }, (_, i) => <i key={i} />)}</div>;
}

/* ---------- Live transcript: words appear as they are spoken ---------- */
export function GlassTranscript({ lines = [], live = true, className = "" }) {
  // lines: [{ who, text, final? }]; the last line may be partial
  const end = useRef(null);
  useEffect(() => { const el = end.current; if (el && el.parentElement) el.parentElement.scrollTop = el.parentElement.scrollHeight; }, [lines]);
  return (
    <div className={"gam-tr " + className} aria-live="polite">
      {lines.map((l, k) => {
        const last = k === lines.length - 1 && live && !l.final;
        const words = l.text.split(" ");
        return (
          <p key={k} className="gam-tr-line" data-who={l.who === "You" ? "me" : "ai"} data-live={last ? "" : undefined}>
            <b>{l.who}</b>
            <span>{words.map((w, j) => <span key={j} className="gam-tr-w" style={{ "--j": j }}>{w} </span>)}{last && <i className="gam-tr-caret" />}</span>
          </p>
        );
      })}
      <span ref={end} />
    </div>
  );
}

/* ---------- Voice picker: pick a voice, play a short sample ---------- */
export function GlassVoicePicker({ voices = [], value, onChange, onPreview, className = "" }) {
  const [playing, setPlaying] = useState(null);
  const t = useRef(0);
  const preview = (v) => {
    clearTimeout(t.current);
    if (playing === v.id) { setPlaying(null); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} return; }
    setPlaying(v.id);
    let done = false;
    const stop = () => { if (!done) { done = true; setPlaying((p) => (p === v.id ? null : p)); } };
    if (onPreview) onPreview(v);
    else try {
      const s = window.speechSynthesis;
      if (s) { s.cancel(); const u = new SpeechSynthesisUtterance(v.sample || `Hi, I'm ${v.name}.`); u.pitch = v.pitch || 1; u.rate = v.rate || 1; u.onend = stop; s.speak(u); }
    } catch (e) {}
    t.current = setTimeout(stop, 3200);
  };
  useEffect(() => () => { clearTimeout(t.current); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }, []);
  return (
    <div className={"gam-vp " + className} role="radiogroup" aria-label="Voice">
      {voices.map((v) => (
        <div key={v.id} className="gam-vp-row" data-on={v.id === value ? "" : undefined}>
          <button type="button" role="radio" aria-checked={v.id === value} className="gam-vp-pick" onClick={() => onChange && onChange(v.id)}>
            <span className="gam-vp-av" style={{ "--h": v.hue || 260 }}><i /><i /><i /></span>
            <span className="gam-vp-txt"><b>{v.name}</b><em>{v.desc}</em></span>
            <span className="gam-vp-tick"><I d={P.check} size={12} w={2.6} /></span>
          </button>
          <button type="button" className="gam-vp-play" data-playing={playing === v.id ? "" : undefined} aria-label={playing === v.id ? `Stop ${v.name}` : `Play ${v.name}`} onClick={() => preview(v)}>
            {playing === v.id ? <span className="gam-vp-eq"><i /><i /><i /></span> : <I d={P.play} size={12} fill="currentColor" w={0} />}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Audio player: a waveform to scrub, speed, and words that follow along ---------- */
export function GlassAudioPlayer({ src, duration: dur0 = 18, words, title, className = "" }) {
  const audio = useRef(null);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(dur0);
  const [on, setOn] = useState(false);
  const [rate, setRate] = useState(1);
  const bars = useMemo(() => Array.from({ length: 64 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37) + 0.25 * Math.sin(i * 2.3))), []);
  // Without a src the player runs on its own clock, so the demo works anywhere
  useEffect(() => {
    if (src || !on) return;
    let last = performance.now(), raf;
    const step = (now) => { const d = (now - last) / 1000; last = now; setT((x) => { const n = x + d * rate; if (n >= dur) { setOn(false); return dur; } return n; }); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, rate, src, dur]);
  useEffect(() => { if (audio.current) audio.current.playbackRate = rate; }, [rate]);
  const toggle = () => {
    if (t >= dur) setT(0);
    if (src && audio.current) { on ? audio.current.pause() : audio.current.play(); }
    setOn(!on);
  };
  const seek = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const n = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
    setT(n); if (audio.current) audio.current.currentTime = n;
  };
  const p = dur ? t / dur : 0;
  const ws = words ? words.split(" ") : [];
  const at = Math.floor(p * ws.length);
  return (
    <div className={"gam-ap " + className} data-on={on ? "" : undefined}>
      {src && <audio ref={audio} src={src} onTimeUpdate={(e) => setT(e.target.currentTime)} onLoadedMetadata={(e) => setDur(e.target.duration)} onEnded={() => setOn(false)} />}
      <div className="gam-ap-row">
        <button type="button" className="gam-ap-play" aria-label={on ? "Pause" : "Play"} onClick={toggle}><I d={on ? P.pause : P.play} size={16} fill="currentColor" w={0} /></button>
        <div className="gam-ap-main">
          {title && <b className="gam-ap-title">{title}</b>}
          <div className="gam-ap-wave" role="slider" tabIndex={0} aria-label="Position" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(t)} aria-valuetext={fmtT(t)}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seek(e); }} onPointerMove={(e) => e.buttons && seek(e)}
            onKeyDown={(e) => { const d = { ArrowRight: 2, ArrowLeft: -2 }[e.key]; if (d) { e.preventDefault(); const n = Math.max(0, Math.min(dur, t + d)); setT(n); if (audio.current) audio.current.currentTime = n; } }}>
            {bars.map((h, i) => <i key={i} style={{ height: (h * 100).toFixed(0) + "%" }} data-past={i / bars.length < p ? "" : undefined} />)}
          </div>
        </div>
        <span className="gam-ap-time">{fmtT(t)} / {fmtT(dur)}</span>
        <button type="button" className="gam-ap-rate" aria-label={`Speed ${rate} times`} onClick={() => setRate(rate === 1 ? 1.5 : rate === 1.5 ? 2 : rate === 2 ? 0.75 : 1)}>{rate}×</button>
      </div>
      {ws.length > 0 && (
        <p className="gam-ap-words">{ws.map((w, i) => <span key={i} data-s={t > 0 ? (i < at ? "past" : i === at ? "now" : undefined) : undefined}>{w} </span>)}</p>
      )}
    </div>
  );
}
