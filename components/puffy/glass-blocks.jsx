"use client";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GlassAvatar, GlassAvatarGroup } from "./glass-app.jsx";
import { GlassCalendar } from "./glass-delight.jsx";
import "./glass-blocks.css";

/* Blocks: the bigger pieces product teams reach for every week. A date picker,
   a kanban board, a filter bar, pricing cards and a workspace switcher. Same lit
   surfaces, colour (--glass-tint) and shape (--glass-radius) as every Puffy part. */

const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };
const I = ({ d, size = 16, w = 1.8 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  cal: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 2v4M16 2v4",
  x: "M6 6l12 12M18 6L6 18", down: "M6 9l6 6 6-6", updown: "M8 9l4-4 4 4M8 15l4 4 4-4", check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14", search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5", filter: "M4 6h16M7 12h10M10 18h4",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  out: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9", grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
};
const hueOf = (s = "") => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const fmtDate = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/* Close a popover on Escape or a press outside it; Escape puts focus back on the trigger */
function useDismiss(open, setOpen, refs, trigger) {
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (!refs.some((r) => r.current && r.current.contains(e.target))) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); trigger.current && trigger.current.focus(); } };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key, true); };
  }, [open]);
}
/* Open below the trigger, or above it when there's no room underneath */
function usePlace(open, trigger, pop, gap = 8) {
  const [up, setUp] = useState(false);
  useLayoutEffect(() => {
    if (!open || !trigger.current || !pop.current) return;
    const t = trigger.current.getBoundingClientRect(), h = pop.current.offsetHeight;
    setUp(t.bottom + gap + h > window.innerHeight - 8 && t.top - gap - h > 8);
  }, [open]);
  return up;
}

/* =====================================================================
   Date picker: a field that opens a calendar
   ===================================================================== */
/** value (Date|null), onChange(Date|null), label, placeholder, min, max, hint, clearable */
export function GlassDatePicker({ value = null, onChange, label = "Date", placeholder = "Pick a date", min, max, hint, clearable = true, className = "" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef(null), pop = useRef(null), wrap = useRef(null);
  useDismiss(open, setOpen, [wrap], btn);
  const up = usePlace(open, btn, pop);
  useEffect(() => { if (open && pop.current) { const sel = pop.current.querySelector('[aria-selected="true"]') || pop.current.querySelector("[data-today]") || pop.current.querySelector(".gx-cal-grid button:not(:disabled)"); sel && sel.focus(); } }, [open]);
  const pick = (d) => { onChange && onChange(d); setOpen(false); gsnd("tick"); btn.current && btn.current.focus(); };
  const startOfToday = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  return (
    <div className={"gbl gbl-dp " + className} ref={wrap}>
      {label && <label className="gbl-label" htmlFor={id}>{label}</label>}
      <div className="gbl-field" data-open={open ? "" : undefined}>
        <button ref={btn} id={id} type="button" className="gbl-field-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="gbl-ico"><I d={P.cal} /></span>
          <span className={value ? "gbl-val" : "gbl-ph"}>{value ? fmtDate(value) : placeholder}</span>
        </button>
        {clearable && value && <button type="button" className="gbl-clear" aria-label="Clear date" onClick={() => { onChange && onChange(null); btn.current && btn.current.focus(); }}><I d={P.x} size={14} /></button>}
      </div>
      {hint && <p className="gbl-hint">{hint}</p>}
      {open && (
        <div ref={pop} className="gbl-pop gbl-dp-pop" role="dialog" aria-label={`Choose ${label.toLowerCase()}`} data-up={up ? "" : undefined}>
          <GlassCalendar value={value || undefined} onChange={pick} min={min} max={max} />
          <div className="gbl-dp-foot">
            <button type="button" className="gbl-chip" onClick={() => pick(startOfToday())} disabled={(min && startOfToday() < min) || (max && startOfToday() > max)}>Today</button>
            {value && <button type="button" className="gbl-chip" onClick={() => { onChange && onChange(null); setOpen(false); btn.current && btn.current.focus(); }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Kanban: drag cards between columns, or move them with the keyboard
   ===================================================================== */
/** columns [{ id, title, cards: [{ id, title, meta?, tags?, people? }] }], onChange(columns), onAdd(columnId) */
export function GlassKanban({ columns = [], onChange, onAdd, label = "Board", className = "" }) {
  const board = useRef(null);
  const [drag, setDrag] = useState(null); // { id, from, x, y, w, h, dx, dy, over, at }
  const [lifted, setLifted] = useState(null); // keyboard: card id being moved
  const [say, setSay] = useState("");
  const find = (id) => { for (const c of columns) { const i = c.cards.findIndex((k) => k.id === id); if (i >= 0) return [c.id, i]; } return [null, -1]; };
  const move = (id, to, at) => {
    const [from, i] = find(id); if (!from) return;
    const card = columns.find((c) => c.id === from).cards[i];
    let next = columns.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== id) }));
    next = next.map((c) => c.id === to ? { ...c, cards: [...c.cards.slice(0, at), card, ...c.cards.slice(at)] } : c);
    onChange && onChange(next);
    const col = next.find((c) => c.id === to);
    setSay(`${card.title}: ${col.title}, position ${at + 1} of ${col.cards.length}`);
  };
  // Pointer drag: a ghost follows the pointer, a gap opens where it will land
  const start = (e, card, colId) => {
    if (e.button !== 0 || e.target.closest("button:not(.gbl-kb-card)")) return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY; let live = false;
    const target = (x, y) => {
      const cols = [...board.current.querySelectorAll(".gbl-kb-col")];
      const col = cols.find((c) => { const b = c.getBoundingClientRect(); return x >= b.left && x <= b.right; }) || cols.reduce((a, c) => Math.abs(c.getBoundingClientRect().left - x) < Math.abs(a.getBoundingClientRect().left - x) ? c : a, cols[0]);
      const cards = [...col.querySelectorAll(".gbl-kb-card:not([data-dragging])")];
      let at = cards.findIndex((c) => { const b = c.getBoundingClientRect(); return y < b.top + b.height / 2; });
      if (at < 0) at = cards.length;
      return { over: col.dataset.col, at };
    };
    const mv = (ev) => {
      if (!live && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
      if (!live) { live = true; gsnd("pop"); }
      setDrag({ id: card.id, from: colId, card, x: ev.clientX - (sx - r.left), y: ev.clientY - (sy - r.top), w: r.width, h: r.height, ...target(ev.clientX, ev.clientY) });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      if (live) { const t = target(ev.clientX, ev.clientY); move(card.id, t.over, t.at); gsnd("tick"); }
      setDrag(null);
    };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };
  // Keyboard: Space lifts a card, arrows move it, Space drops, Escape cancels
  const key = (e, card) => {
    const [colId, i] = find(card.id); const ci = columns.findIndex((c) => c.id === colId);
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (lifted === card.id) { setLifted(null); setSay(`Dropped ${card.title}.`); gsnd("tick"); }
      else { setLifted(card.id); setSay(`Picked up ${card.title}. Arrow keys move it, Space drops it.`); gsnd("pop"); }
      return;
    }
    if (e.key === "Escape" && lifted) { setLifted(null); setSay("Move cancelled."); return; }
    if (lifted !== card.id) return;
    const n = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!n) return;
    e.preventDefault();
    if (n[0]) { const to = columns[ci + n[0]]; if (to) move(card.id, to.id, Math.min(i, to.cards.length)); }
    else { const len = columns[ci].cards.length; const at = Math.max(0, Math.min(len - 1, i + n[1])); if (at !== i) move(card.id, colId, at); }
  };
  // keep focus on the moved card
  useEffect(() => { if (lifted && board.current) { const el = board.current.querySelector(`[data-card="${lifted}"]`); el && el !== document.activeElement && el.focus(); } });
  return (
    <div className={"gbl gbl-kb " + className} ref={board} role="group" aria-label={label} data-dragging={drag ? "" : undefined}>
      {columns.map((col) => {
        const cards = col.cards.filter((k) => !drag || k.id !== drag.id);
        return (
          <section key={col.id} className="gbl-kb-col" data-col={col.id} data-over={drag && drag.over === col.id ? "" : undefined} aria-label={col.title}>
            <header className="gbl-kb-head">
              <span className="gbl-kb-dot" style={{ "--h": hueOf(col.title) }} aria-hidden="true" />
              <b>{col.title}</b><span className="gbl-kb-n">{col.cards.length}</span>
              {onAdd && <button type="button" className="gbl-kb-add" aria-label={`Add a card to ${col.title}`} onClick={() => onAdd(col.id)}><I d={P.plus} size={15} /></button>}
            </header>
            <ol className="gbl-kb-list">
              {cards.map((card, i) => (
                <li key={card.id} style={{ display: "contents" }}>
                  {drag && drag.over === col.id && drag.at === i && <div className="gbl-kb-gap" style={{ height: drag.h }} aria-hidden="true" />}
                  <div className="gbl-kb-card" data-card={card.id} tabIndex={0} role="button" aria-roledescription="Draggable card" aria-pressed={lifted === card.id}
                    data-lifted={lifted === card.id ? "" : undefined} onPointerDown={(e) => start(e, card, col.id)} onKeyDown={(e) => key(e, card)}>
                    <KbCard card={card} />
                  </div>
                </li>
              ))}
              {drag && drag.over === col.id && drag.at >= cards.length && <div className="gbl-kb-gap" style={{ height: drag.h }} aria-hidden="true" />}
              {!cards.length && !(drag && drag.over === col.id) && <li className="gbl-kb-empty">Drop a card here</li>}
            </ol>
          </section>
        );
      })}
      {drag && <div className="gbl-kb-card gbl-kb-ghost" style={{ left: drag.x, top: drag.y, width: drag.w }} aria-hidden="true"><KbCard card={drag.card} /></div>}
      <p className="gbl-sr" aria-live="polite">{say}</p>
    </div>
  );
}
function KbCard({ card }) {
  return (
    <>
      <span className="gbl-kb-title">{card.title}</span>
      {card.meta && <span className="gbl-kb-meta">{card.meta}</span>}
      {(card.tags || card.people) && (
        <span className="gbl-kb-foot">
          <span className="gbl-kb-tags">{(card.tags || []).map((t) => <i key={t} style={{ "--h": hueOf(t) }}>{t}</i>)}</span>
          {card.people && card.people.length > 0 && <GlassAvatarGroup people={card.people.map((name) => ({ name }))} max={3} size="sm" />}
        </span>
      )}
    </>
  );
}

/* =====================================================================
   Filters: a search box, facet menus and the active filters as pills
   ===================================================================== */
/** facets [{ id, label, options: [{ value, label, count? }] }], value { [facetId]: [values] }, onChange(value), query, onQuery, count */
export function GlassFilters({ facets = [], value = {}, onChange, query = "", onQuery, count, placeholder = "Search", className = "" }) {
  const [open, setOpen] = useState(null);
  const set = (id, vals) => onChange && onChange({ ...value, [id]: vals });
  const active = facets.flatMap((f) => (value[f.id] || []).map((v) => ({ f, v, label: (f.options.find((o) => o.value === v) || { label: v }).label })));
  return (
    <div className={"gbl gbl-ft " + className}>
      <div className="gbl-ft-bar">
        {onQuery && (
          <label className="gbl-ft-search">
            <I d={P.search} size={15} />
            <span className="gbl-sr">{placeholder}</span>
            <input type="search" value={query} placeholder={placeholder} onChange={(e) => onQuery(e.target.value)} />
          </label>
        )}
        {facets.map((f) => <Facet key={f.id} facet={f} picked={value[f.id] || []} open={open === f.id} setOpen={(o) => setOpen(o ? f.id : null)} onPick={(vals) => set(f.id, vals)} />)}
      </div>
      {(active.length > 0 || count != null) && (
        <div className="gbl-ft-active">
          {count != null && <span className="gbl-ft-count" role="status">{count} result{count === 1 ? "" : "s"}</span>}
          {active.map(({ f, v, label }) => (
            <span key={f.id + v} className="gbl-ft-pill"><em>{f.label}:</em> {label}
              <button type="button" aria-label={`Remove ${f.label} ${label}`} onClick={() => set(f.id, (value[f.id] || []).filter((x) => x !== v))}><I d={P.x} size={12} w={2.2} /></button>
            </span>
          ))}
          {active.length > 0 && <button type="button" className="gbl-ft-clear" onClick={() => onChange && onChange({})}>Clear all</button>}
        </div>
      )}
    </div>
  );
}
function Facet({ facet, picked, open, setOpen, onPick }) {
  const btn = useRef(null), wrap = useRef(null), pop = useRef(null);
  useDismiss(open, setOpen, [wrap], btn);
  const up = usePlace(open, btn, pop);
  useEffect(() => { if (open && pop.current) { const f = pop.current.querySelector("input"); f && f.focus(); } }, [open]);
  const toggle = (v) => { onPick(picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v]); gsnd("tick"); };
  const keys = (e) => {
    const items = [...pop.current.querySelectorAll("input")]; const i = items.indexOf(document.activeElement);
    const n = { ArrowDown: 1, ArrowUp: -1 }[e.key]; if (!n) return; e.preventDefault(); items[(i + n + items.length) % items.length].focus();
  };
  return (
    <div className="gbl-ft-facet" ref={wrap}>
      <button ref={btn} type="button" className="gbl-chip gbl-ft-btn" aria-haspopup="true" aria-expanded={open} data-on={picked.length ? "" : undefined} onClick={() => setOpen(!open)}>
        {facet.label}{picked.length > 0 && <span className="gbl-ft-n">{picked.length}</span>}<I d={P.down} size={14} />
      </button>
      {open && (
        <div ref={pop} className="gbl-pop gbl-ft-pop" role="group" aria-label={facet.label} data-up={up ? "" : undefined} onKeyDown={keys}>
          {facet.options.map((o) => (
            <label key={o.value} className="gbl-ft-opt">
              <input type="checkbox" checked={picked.includes(o.value)} onChange={() => toggle(o.value)} />
              <span className="gbl-ft-box" aria-hidden="true"><I d={P.check} size={12} w={2.6} /></span>
              <span className="gbl-ft-l">{o.label}</span>
              {o.count != null && <span className="gbl-ft-c">{o.count}</span>}
            </label>
          ))}
          {picked.length > 0 && <button type="button" className="gbl-ft-reset" onClick={() => onPick([])}>Clear {facet.label.toLowerCase()}</button>}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Pricing: plans side by side with a monthly / yearly switch
   ===================================================================== */
/** plans [{ id, name, desc, price: { month, year }, features: [], cta, featured? }], billing "month"|"year", onBilling, onSelect(id), currency, saveLabel */
export function GlassPricing({ plans = [], billing = "month", onBilling, onSelect, currency = "$", saveLabel = "Save 20%", className = "" }) {
  return (
    <div className={"gbl gbl-pr " + className}>
      {onBilling && (
        <div className="gbl-pr-switch" role="radiogroup" aria-label="Billing">
          {[["month", "Monthly"], ["year", "Yearly"]].map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={billing === v} onClick={() => { onBilling(v); gsnd("tick"); }}>
              {l}{v === "year" && saveLabel && <em>{saveLabel}</em>}
            </button>
          ))}
        </div>
      )}
      <div className="gbl-pr-grid" data-n={plans.length}>
        {plans.map((p) => {
          const amount = p.price[billing];
          return (
            <article key={p.id} className="gbl-pr-card" data-featured={p.featured ? "" : undefined} aria-label={p.name}>
              <header>
                <span className="gbl-pr-name">{p.name}{p.featured && <span className="gbl-pr-badge">Most popular</span>}</span>
                {p.desc && <p>{p.desc}</p>}
              </header>
              <p className="gbl-pr-price">
                <b key={billing + amount}>{amount === 0 ? "Free" : currency + amount}</b>
                {amount > 0 && <span>/ {billing === "year" ? "month, billed yearly" : "month"}</span>}
              </p>
              <button type="button" className="gbl-pr-cta" data-main={p.featured ? "" : undefined} onClick={() => onSelect && onSelect(p.id)}>{p.cta || "Choose " + p.name}</button>
              <ul>{p.features.map((f) => <li key={f}><I d={P.check} size={15} w={2.2} />{f}</li>)}</ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* =====================================================================
   Workspace switcher: the menu at the top of a sidebar
   ===================================================================== */
/** workspaces [{ id, name, plan? }], value, onChange(id), onCreate, user { name, email }, onAction("settings"|"logout") */
export function GlassWorkspaceSwitcher({ workspaces = [], value, onChange, onCreate, user, onAction, className = "" }) {
  const [open, setOpen] = useState(false);
  const btn = useRef(null), wrap = useRef(null), menu = useRef(null);
  useDismiss(open, setOpen, [wrap], btn);
  const up = usePlace(open, btn, menu);
  const cur = workspaces.find((w) => w.id === value) || workspaces[0];
  useEffect(() => { if (open && menu.current) { const el = menu.current.querySelector('[aria-checked="true"]') || menu.current.querySelector('[role^="menuitem"]'); el && el.focus(); } }, [open]);
  const close = () => { setOpen(false); btn.current && btn.current.focus(); };
  const keys = (e) => {
    const items = [...menu.current.querySelectorAll('[role^="menuitem"]')]; const i = items.indexOf(document.activeElement);
    const n = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" }[e.key]; if (n == null) return; e.preventDefault();
    const to = n === "first" ? 0 : n === "last" ? items.length - 1 : (i + n + items.length) % items.length; items[to].focus();
  };
  if (!cur) return null;
  return (
    <div className={"gbl gbl-ws " + className} ref={wrap}>
      <button ref={btn} type="button" className="gbl-ws-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <WsMark name={cur.name} />
        <span className="gbl-ws-t"><b>{cur.name}</b>{cur.plan && <span>{cur.plan}</span>}</span>
        <I d={P.updown} size={15} />
      </button>
      {open && (
        <div ref={menu} className="gbl-pop gbl-ws-menu" role="menu" aria-label="Workspaces" data-up={up ? "" : undefined} onKeyDown={keys}>
          <p className="gbl-ws-h">Workspaces</p>
          {workspaces.map((w) => (
            <button key={w.id} type="button" role="menuitemradio" aria-checked={w.id === cur.id} className="gbl-ws-item" onClick={() => { onChange && onChange(w.id); gsnd("tick"); close(); }}>
              <WsMark name={w.name} small /><span className="gbl-ws-name">{w.name}</span>{w.plan && <span className="gbl-ws-plan">{w.plan}</span>}
              <span className="gbl-ws-check">{w.id === cur.id && <I d={P.check} size={15} w={2.2} />}</span>
            </button>
          ))}
          {onCreate && <button type="button" role="menuitem" className="gbl-ws-item gbl-ws-new" onClick={() => { onCreate(); close(); }}><span className="gbl-ws-plus"><I d={P.plus} size={14} /></span>New workspace</button>}
          {user && (
            <>
              <span className="gbl-ws-sep" role="separator" />
              <div className="gbl-ws-user"><GlassAvatar name={user.name} size="sm" /><span><b>{user.name}</b>{user.email && <span>{user.email}</span>}</span></div>
              {onAction && <button type="button" role="menuitem" className="gbl-ws-item" onClick={() => { onAction("settings"); close(); }}><I d={P.gear} size={15} />Settings</button>}
              {onAction && <button type="button" role="menuitem" className="gbl-ws-item" onClick={() => { onAction("logout"); close(); }}><I d={P.out} size={15} />Log out</button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
function WsMark({ name, small }) {
  return <span className="gbl-ws-mark" data-small={small ? "" : undefined} style={{ "--h": hueOf(name) }} aria-hidden="true">{name.trim()[0].toUpperCase()}</span>;
}
