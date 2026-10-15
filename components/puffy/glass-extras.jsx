"use client";
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom/client";
import "./glass-extras.css";

/* More parts: a wheel picker, a sortable list, a multi select, a context
   menu, a button that grows into a dialog, tabs that open up, a bloom menu,
   and three for agents — a file diff, a tool permission card and rotating
   "thinking" phrases. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const I = ({ d, size = 16, w = 1.8 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
export const XP = {
  check: "M5 12.5l4.5 4.5L19 7.5", x: "M6 6l12 12M18 6L6 18", grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  down: "M6 9l6 6 6-6", plus: "M12 5v14M5 12h14", file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", terminal: "M4 5h16v14H4zM8 10l3 2.5-3 2.5M13 15h3",
};

/* Portalled layers carry the theme with them */
function useCarryTheme(anchor, on) {
  const [v, setV] = useState(null);
  useLayoutEffect(() => {
    if (!on || !anchor.current) return;
    const cs = getComputedStyle(anchor.current), s = {};
    ["--glass-tint", "--glass-on-tint", "--glass-fg", "--glass-shadow", "--glass-radius", "--bg", "--fg", "--line", "--muted", "--band"].forEach((k) => { const x = cs.getPropertyValue(k); if (x) s[k] = x.trim(); });
    const t = anchor.current.closest("[data-glass-tint]"), th = anchor.current.closest("[data-glass-theme]");
    setV({ style: s, tint: t ? t.getAttribute("data-glass-tint") : undefined, theme: th ? th.getAttribute("data-glass-theme") : undefined });
  }, [on]);
  return v ? { style: v.style, "data-glass-tint": v.tint, "data-glass-theme": v.theme } : {};
}

/* =====================================================================
   Wheel picker: columns that spin like a phone's time picker
   ===================================================================== */
const ROW = 36, SIDE = 3;   // row height, and rows shown above and below the chosen one
const STEP = Math.PI / 9, DRUM = ROW / STEP;   // 20° per row on a drum of that radius
function Wheel({ options, value, onChange, label, width, align = "center" }) {
  const box = useRef(null);
  const i = Math.max(0, options.findIndex((o) => (o.value ?? o) === value));
  const [pos, setPos] = useState(i * ROW);
  const last = useRef(i), timer = useRef(0), from = useRef(false), valRef = useRef(value);
  valRef.current = value;
  useEffect(() => { const el = box.current; if (!el || from.current) { from.current = false; return; } el.scrollTop = i * ROW; setPos(i * ROW); }, [value]);
  const scroll = () => {
    const el = box.current; setPos(el.scrollTop);
    const k = clamp(Math.round(el.scrollTop / ROW), 0, options.length - 1);
    if (k !== last.current) { last.current = k; gsnd("tick"); try { navigator.vibrate && navigator.vibrate(2); } catch (e) {} }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // settle exactly on a row, even where the browser doesn't snap
      if (Math.abs(el.scrollTop - k * ROW) > 1) el.scrollTo({ top: k * ROW, behavior: reduce() ? "auto" : "smooth" });
      const o = options[k]; const v = o.value ?? o; if (v !== valRef.current) { from.current = true; onChange && onChange(v); }
    }, 140);
  };
  const go = (k) => box.current.scrollTo({ top: clamp(k, 0, options.length - 1) * ROW, behavior: reduce() ? "auto" : "smooth" });
  const key = (e) => {
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : e.key === "PageDown" ? 5 : e.key === "PageUp" ? -5 : 0;
    if (!d) return; e.preventDefault(); go(i + d);
  };
  return (
    <div className="gxw-col" data-align={align} style={width ? { flex: "none", width } : undefined}>
      <div ref={box} className="gxw-scroll" tabIndex={0} role="spinbutton" aria-label={label} aria-valuetext={String(options[i]?.label ?? options[i])} onScroll={scroll} onKeyDown={key}>
        <div className="gxw-pad" />
        {options.map((o, k) => {
          // each label sits on a drum: it tilts away, shrinks and fades as it leaves the middle
          // rows sit on a cylinder: 20° apart, pulled in toward the middle as they curve away
          const d = (k * ROW - pos) / ROW, a = clamp(d, -SIDE - 0.8, SIDE + 0.8), far = Math.abs(a);
          const th = a * STEP, dy = DRUM * Math.sin(th) - a * ROW;
          return (
            // the row snaps; only the label inside it moves, so the snap points never shift
            <div key={k} className="gxw-row" onClick={() => go(k)}>
              <span className="gxw-item" data-on={far < 0.5 ? "" : undefined}
                style={{ transform: `translateY(${dy.toFixed(2)}px) rotateX(${(-th * 180 / Math.PI).toFixed(2)}deg)`, opacity: Math.max(0, 1 - far * 0.26) }}>{o.label ?? o}</span>
            </div>
          );
        })}
        <div className="gxw-pad" />
      </div>
    </div>
  );
}
/** GlassWheelPicker: columns [{ options: [value | { value, label }], value, onChange, label, width, align }], or { sep: ":" } between them */
export function GlassWheelPicker({ columns = [], label = "Picker", className = "" }) {
  return (
    <div className={"gxw " + className} role="group" aria-label={label}>
      <span className="gxw-lens" aria-hidden="true" />
      {columns.map((c, k) => (c.sep != null ? <span key={k} className="gxw-sep" aria-hidden="true">{c.sep}</span> : <Wheel key={k} {...c} />))}
    </div>
  );
}

/* =====================================================================
   Sortable list: drag the handle (or press space and the arrows)
   ===================================================================== */
/** items [{ id, ... }], onChange(newItems), render(item) */
export function GlassSortableList({ items = [], onChange, render = (it) => it.label, label = "Sortable list", className = "" }) {
  const list = useRef(null);
  const [drag, setDrag] = useState(null); // { id, from, to, dy, h }
  const [held, setHeld] = useState(null);
  const [say, setSay] = useState("");
  const begin = (e, id, from) => {
    const li = e.currentTarget.closest("li"); const h = li.getBoundingClientRect().height + 8;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, from, to: from, y0: e.clientY, dy: 0, h }); gsnd("pick");
  };
  const move = (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y0;
    const to = clamp(drag.from + Math.round(dy / drag.h), 0, items.length - 1);
    if (to !== drag.to) gsnd("tick");
    setDrag({ ...drag, dy, to });
  };
  const end = () => {
    if (!drag) return;
    const { from, to } = drag; setDrag(null);
    if (from !== to) { const n = items.slice(); const [x] = n.splice(from, 1); n.splice(to, 0, x); onChange && onChange(n); }
    gsnd("drop");
  };
  const key = (e, idx) => {
    const id = items[idx].id;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (held === id) { setHeld(null); setSay("Dropped"); gsnd("drop"); } else { setHeld(id); setSay(`Picked up. Use the arrow keys to move, space to drop.`); gsnd("pick"); } return; }
    if (held !== id) return;
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0; if (!d) return;
    e.preventDefault();
    const to = clamp(idx + d, 0, items.length - 1); if (to === idx) return;
    const n = items.slice(); const [x] = n.splice(idx, 1); n.splice(to, 0, x); onChange && onChange(n);
    setSay(`Moved to position ${to + 1} of ${items.length}`); gsnd("tick");
    requestAnimationFrame(() => { const b = list.current && list.current.querySelectorAll(".gxs-grip")[to]; b && b.focus(); });
  };
  return (
    <>
      <ul ref={list} className={"gxs " + className} aria-label={label} data-dragging={drag ? "" : undefined}>
        {items.map((it, k) => {
          let y = 0;
          if (drag) {
            if (it.id === drag.id) y = drag.dy;
            else if (drag.from < drag.to && k > drag.from && k <= drag.to) y = -drag.h;
            else if (drag.from > drag.to && k < drag.from && k >= drag.to) y = drag.h;
          }
          const lifted = drag && it.id === drag.id;
          return (
            <li key={it.id} className="gxs-item" data-lifted={lifted ? "" : undefined} data-held={held === it.id ? "" : undefined} style={{ transform: `translateY(${y}px)${lifted ? " scale(1.02)" : ""}`, transition: lifted ? "none" : undefined }}>
              <button type="button" className="gxs-grip" aria-label={`Move ${typeof it.label === "string" ? it.label : "item"}`} aria-pressed={held === it.id} data-sound="off"
                onPointerDown={(e) => begin(e, it.id, k)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={(e) => key(e, k)}><I d={XP.grip} size={16} w={2.6} /></button>
              <div className="gxs-body">{render(it)}</div>
            </li>
          );
        })}
      </ul>
      <span className="gx-sr" aria-live="assertive">{say}</span>
    </>
  );
}

/* =====================================================================
   Multi select: chips in the field, a list that filters as you type
   ===================================================================== */
/** options [{ value, label, hint? }], value [values], onChange */
export function GlassMultiSelect({ options = [], value = [], onChange, label = "Choose", placeholder = "Search…", max, className = "" }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(0);
  const box = useRef(null), inp = useRef(null);
  const list = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  const has = (v) => value.includes(v);
  const toggle = (v) => {
    if (has(v)) { onChange && onChange(value.filter((x) => x !== v)); gsnd("toggleOff"); }
    else if (!max || value.length < max) { onChange && onChange([...value, v]); gsnd("toggleOn"); }
    setQ(""); inp.current && inp.current.focus();
  };
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", off); return () => document.removeEventListener("pointerdown", off);
  }, [open]);
  useEffect(() => { setAct(0); }, [q]);
  const key = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setAct((a) => Math.min(list.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" && open && list[act]) { e.preventDefault(); toggle(list[act].value); }
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Backspace" && !q && value.length) { onChange && onChange(value.slice(0, -1)); gsnd("delete"); }
  };
  return (
    <div className={"gxm " + className} ref={box} data-open={open ? "" : undefined}>
      <label className="gxm-label" htmlFor={id}>{label}</label>
      <div className="gxm-field" onClick={() => { inp.current && inp.current.focus(); setOpen(true); }}>
        {value.map((v) => { const o = options.find((x) => x.value === v); return (
          <span key={v} className="gxm-chip">{o ? o.label : v}<button type="button" aria-label={`Remove ${o ? o.label : v}`} onClick={(e) => { e.stopPropagation(); toggle(v); }}><I d={XP.x} size={11} w={2.4} /></button></span>
        ); })}
        <input ref={inp} id={id} value={q} placeholder={value.length ? "" : placeholder} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={key}
          role="combobox" aria-expanded={open} aria-controls={id + "-l"} aria-activedescendant={open && list[act] ? `${id}-o${act}` : undefined} autoComplete="off" />
        <span className="gxm-caret" aria-hidden="true"><I d={XP.down} size={15} /></span>
      </div>
      {open && (
        <ul className="gxm-list" id={id + "-l"} role="listbox" aria-multiselectable="true" aria-label={label}>
          {list.length ? list.map((o, k) => (
            <li key={o.value} id={`${id}-o${k}`} role="option" aria-selected={has(o.value)} data-act={k === act ? "" : undefined} data-sound="off" onPointerDown={(e) => e.preventDefault()} onClick={() => toggle(o.value)} onPointerEnter={() => setAct(k)}>
              <span className="gxm-box">{has(o.value) && <I d={XP.check} size={12} w={2.8} />}</span>
              <span className="gxm-txt">{o.label}{o.hint && <em>{o.hint}</em>}</span>
            </li>
          )) : <li className="gxm-none">Nothing matches “{q}”</li>}
        </ul>
      )}
    </div>
  );
}

/* =====================================================================
   Context menu: right-click, long-press, or the menu key
   ===================================================================== */
/** items [{ label, icon?, keys?, danger?, onSelect } | "divider"]; children is the area */
export function GlassContextMenu({ items = [], children, label = "Actions", className = "" }) {
  const area = useRef(null), menu = useRef(null);
  const [at, setAt] = useState(null);
  const [act, setAct] = useState(0);
  const carry = useCarryTheme(area, !!at);
  const real = items.filter((x) => x !== "divider");
  const open = (x, y) => { setAt({ x, y }); setAct(0); gsnd("pop"); };
  const close = () => { setAt(null); };
  const press = useRef(0);
  useLayoutEffect(() => {
    if (!at || !menu.current) return;
    // offset sizes: the opening animation scales the menu, which would fool getBoundingClientRect
    const r = { width: menu.current.offsetWidth, height: menu.current.offsetHeight }, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const x = Math.min(at.x, vw - r.width - 8), y = at.y + r.height > vh - 8 ? Math.max(8, at.y - r.height) : at.y;
    if (x !== at.x || y !== at.y) setAt({ x: Math.max(8, x), y, fixed: true });
    menu.current.focus({ preventScroll: true });
  }, [at && at.fixed, !!at]);
  useEffect(() => {
    if (!at) return;
    const off = (e) => { if (menu.current && !menu.current.contains(e.target)) close(); };
    const k = (e) => { if (e.key === "Escape") { close(); area.current && area.current.focus(); } };
    document.addEventListener("pointerdown", off, true); document.addEventListener("keydown", k); window.addEventListener("scroll", close, true); window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", off, true); document.removeEventListener("keydown", k); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [!!at]);
  const pick = (it) => { close(); gsnd(it.danger ? "delete" : "tick"); it.onSelect && it.onSelect(); };
  const nav = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAct((a) => (a + 1) % real.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => (a - 1 + real.length) % real.length); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); real[act] && pick(real[act]); }
    else if (e.key === "Tab") close();
  };
  let n = -1;
  return (
    <>
      <div ref={area} className={"gxc-area " + className} tabIndex={0} aria-haspopup="menu" aria-label={label}
        onContextMenu={(e) => { e.preventDefault(); open(e.clientX, e.clientY); }}
        onKeyDown={(e) => { if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) { e.preventDefault(); const r = area.current.getBoundingClientRect(); open(r.left + 24, r.top + 24); } }}
        onPointerDown={(e) => { if (e.pointerType !== "mouse") { const { clientX: x, clientY: y } = e; clearTimeout(press.current); press.current = setTimeout(() => { try { navigator.vibrate && navigator.vibrate(10); } catch (z) {} open(x, y); }, 480); } }}
        onPointerUp={() => clearTimeout(press.current)} onPointerMove={() => clearTimeout(press.current)} onPointerCancel={() => clearTimeout(press.current)}>
        {children}
      </div>
      {at && typeof document !== "undefined" && createPortal(
        <div ref={menu} className="gxc-menu" role="menu" aria-label={label} tabIndex={-1} onKeyDown={nav} style={{ ...carry.style, left: at.x, top: at.y }} data-glass-tint={carry["data-glass-tint"]} data-glass-theme={carry["data-glass-theme"]}>
          {items.map((it, k) => {
            if (it === "divider") return <hr key={"d" + k} />;
            n++; const me = n;
            return (
              <button key={it.label} type="button" role="menuitem" data-act={me === act ? "" : undefined} data-danger={it.danger ? "" : undefined} data-sound="off" tabIndex={-1} style={{ "--i": me }}
                onPointerEnter={() => setAct(me)} onClick={() => pick(it)}>
                {it.icon && <span className="gxc-ic">{typeof it.icon === "string" ? <I d={it.icon} size={15} /> : it.icon}</span>}
                <span className="gxc-l">{it.label}</span>
                {it.keys && <kbd>{it.keys}</kbd>}
              </button>
            );
          })}
        </div>, document.body)}
    </>
  );
}

/* =====================================================================
   Morphing modal: the button grows into the dialog, and shrinks back
   ===================================================================== */
export function GlassMorphModal({ label = "Open", icon, title, children, actions, width = 420, className = "" }) {
  const btn = useRef(null), panel = useRef(null);
  const [phase, setPhase] = useState("closed"); // closed | opening | open | closing
  const [from, setFrom] = useState(null);
  const carry = useCarryTheme(btn, phase !== "closed");
  const openIt = () => {
    const r = btn.current.getBoundingClientRect();
    setFrom({ x: r.left, y: r.top, w: r.width, h: r.height, rad: getComputedStyle(btn.current).borderRadius });
    setPhase(reduce() ? "open" : "opening"); gsnd("pop");
  };
  const close = () => { if (phase === "closed" || phase === "closing") return; setPhase(reduce() ? "closed" : "closing"); gsnd("popClose"); };
  // FLIP: start the panel where the button is, then let it settle in the middle
  useLayoutEffect(() => {
    const p = panel.current; if (!p || !from) return;
    if (phase === "opening" || phase === "closing") {
      const r = p.getBoundingClientRect();
      const t = `translate(${from.x - r.left}px, ${from.y - r.top}px) scale(${from.w / r.width}, ${from.h / r.height})`;
      if (phase === "opening") {
        p.style.transition = "none"; p.style.transform = t; p.style.borderRadius = from.rad; p.dataset.morph = "";
        p.getBoundingClientRect();
        requestAnimationFrame(() => { p.style.transition = ""; p.style.transform = ""; p.style.borderRadius = ""; delete p.dataset.morph; });
        const done = setTimeout(() => setPhase("open"), 520); return () => clearTimeout(done);
      } else {
        p.style.transform = t; p.style.borderRadius = from.rad; p.dataset.morph = "";
        const done = setTimeout(() => setPhase("closed"), 420); return () => clearTimeout(done);
      }
    }
  }, [phase]);
  useEffect(() => {
    if (phase !== "open") return;
    const k = (e) => e.key === "Escape" && close(); document.addEventListener("keydown", k);
    panel.current && panel.current.focus({ preventScroll: true });
    return () => document.removeEventListener("keydown", k);
  }, [phase]);
  useEffect(() => { if (phase === "closed" && from) btn.current && btn.current.focus({ preventScroll: true }); }, [phase]);
  return (
    <>
      <button ref={btn} type="button" className={"gxo-btn " + className} data-sound="off" aria-haspopup="dialog" onClick={openIt} style={{ visibility: phase === "closed" ? undefined : "hidden" }}>
        {icon && <span className="gxo-bi">{icon}</span>}{label}
      </button>
      {phase !== "closed" && typeof document !== "undefined" && createPortal(
        <div className="gxo-wrap" data-phase={phase} style={carry.style} data-glass-tint={carry["data-glass-tint"]} data-glass-theme={carry["data-glass-theme"]}>
          <div className="gxo-back" onClick={close} />
          <div ref={panel} className="gxo-panel" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} style={{ width: `min(${width}px, calc(100vw - 32px))` }}>
            <div className="gxo-in">
              <div className="gxo-head"><b>{title}</b><button type="button" className="gxo-x" aria-label="Close" onClick={close}><I d={XP.x} size={15} /></button></div>
              <div className="gxo-body">{children}</div>
              {actions && <div className="gxo-acts">{typeof actions === "function" ? actions(close) : actions}</div>}
            </div>
          </div>
        </div>, document.body)}
    </>
  );
}

/* =====================================================================
   Expandable tabs: icons only, the chosen one opens up to show its name
   ===================================================================== */
/** tabs [{ id, label, icon }], value, onChange */
export function GlassExpandTabs({ tabs = [], value, onChange, label = "Sections", className = "" }) {
  const refs = useRef([]);
  const key = (e, k) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
    e.preventDefault(); const n = (k + d + tabs.length) % tabs.length; onChange && onChange(tabs[n].id); refs.current[n] && refs.current[n].focus();
  };
  return (
    <div className={"gxt " + className} role="tablist" aria-label={label}>
      {tabs.map((t, k) => {
        const on = t.id === value;
        return (
          <button key={t.id} ref={(el) => (refs.current[k] = el)} type="button" role="tab" aria-selected={on} tabIndex={on ? 0 : -1} aria-label={t.label} data-on={on ? "" : undefined}
            onClick={() => onChange && onChange(t.id)} onKeyDown={(e) => key(e, k)} title={on ? undefined : t.label}>
            <span className="gxt-ic">{typeof t.icon === "string" ? <I d={t.icon} size={18} /> : t.icon}</span>
            <span className="gxt-l"><span>{t.label}</span></span>
          </button>
        );
      })}
    </div>
  );
}

/* =====================================================================
   Bloom menu: one round button that fans out into a ring of actions
   ===================================================================== */
/** items [{ label, icon, onClick }]; spread degrees; radius px; dir "up" | "around" */
export function GlassBloomMenu({ items = [], label = "Actions", spread = 150, radius = 92, dir = "up", className = "" }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", k); };
  }, [open]);
  const n = items.length, total = dir === "around" ? 360 : spread, start = dir === "around" ? -90 : -90 - spread / 2;
  return (
    <div className={"gxb " + className} ref={box} data-open={open ? "" : undefined}>
      <ul className="gxb-ring" role="menu" aria-label={label} aria-hidden={!open}>
        {items.map((it, k) => {
          const a = ((start + (dir === "around" ? (k / n) * total : n > 1 ? (k / (n - 1)) * total : 0)) * Math.PI) / 180;
          return (
            <li key={it.label} style={{ "--x": Math.cos(a) * radius + "px", "--y": Math.sin(a) * radius + "px", "--d": k * 35 + "ms" }}>
              <button type="button" role="menuitem" aria-label={it.label} tabIndex={open ? 0 : -1} data-sound="off" onClick={() => { setOpen(false); gsnd("tick"); it.onClick && it.onClick(); }}>
                {typeof it.icon === "string" ? <I d={it.icon} size={18} /> : it.icon}
                <span className="gxb-tip">{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="gxb-main" aria-expanded={open} aria-label={open ? "Close" : label} onClick={() => setOpen(!open)}><I d={XP.plus} size={22} w={2.2} /></button>
    </div>
  );
}

/* =====================================================================
   Agents: file diff with line numbers, streamed in
   ===================================================================== */
/** file, lines [{ t: " " | "+" | "-", s: text }], start line; streaming plays rows in; collapsible */
export function GlassFileDiff({ file = "src/app.tsx", lines = [], start = 1, streaming = false, speed = 70, onDone, defaultOpen = true, className = "" }) {
  const rows = useMemo(() => {
    let a = start, b = start;
    return lines.map((l) => { const r = { ...l, a: l.t === "+" ? "" : a, b: l.t === "-" ? "" : b }; if (l.t !== "+") a++; if (l.t !== "-") b++; return r; });
  }, [lines, start]);
  const [shown, setShown] = useState(streaming && !reduce() ? 0 : rows.length);
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { setShown(streaming && !reduce() ? 0 : rows.length); }, [rows, streaming]);
  useEffect(() => {
    if (shown >= rows.length) { if (streaming) onDone && onDone(); return; }
    const t = setTimeout(() => setShown((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [shown, rows.length]);
  const add = rows.filter((r) => r.t === "+").length, del = rows.filter((r) => r.t === "-").length;
  const done = shown >= rows.length;
  return (
    <div className={"gxd " + className} data-open={open ? "" : undefined}>
      <button type="button" className="gxd-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <I d={XP.file} size={15} /><span className="gxd-file">{file}</span>
        {!done && <span className="gxd-live" aria-label="Writing"><i /><i /><i /></span>}
        <span className="gxd-n"><b className="gxd-add">+{rows.slice(0, shown).filter((r) => r.t === "+").length}</b><b className="gxd-del">−{rows.slice(0, shown).filter((r) => r.t === "-").length}</b></span>
        <span className="gxd-bars" aria-hidden="true">{Array.from({ length: 5 }, (_, k) => <i key={k} data-k={k < Math.round((add / Math.max(1, add + del)) * 5) ? "add" : "del"} />)}</span>
        <span className="gxd-chev"><I d={XP.down} size={14} /></span>
      </button>
      <div className="gxd-body" hidden={!open}>
        <table>
          <tbody>
            {rows.slice(0, shown).map((r, k) => (
              <tr key={k} data-t={r.t === "+" ? "add" : r.t === "-" ? "del" : "ctx"}>
                <td className="gxd-ln">{r.a}</td><td className="gxd-ln">{r.b}</td>
                <td className="gxd-sign">{r.t === " " ? "" : r.t === "-" ? "−" : "+"}</td>
                <td className="gxd-code"><code>{r.s || " "}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =====================================================================
   Agents: a tool asks for permission
   ===================================================================== */
/** tool, action, target, details (text, shown as code), onDecide("once" | "always" | "deny") */
export function GlassToolApproval({ tool = "Terminal", action = "wants to run a command", target, details, risk, onDecide, className = "" }) {
  const [more, setMore] = useState(false);
  const [state, setState] = useState(null);
  const decide = (v) => { setState(v); gsnd(v === "deny" ? "warn" : "success"); onDecide && onDecide(v); };
  const words = { once: "Allowed this once", always: `Always allowed for ${tool}`, deny: "Not allowed" };
  return (
    <div className={"gxa " + className} data-state={state || undefined} role="group" aria-label={`${tool} ${action}`}>
      <div className="gxa-top">
        <span className="gxa-ic"><I d={XP.terminal} size={17} /></span>
        <div className="gxa-txt"><b>{tool}</b> <span>{action}</span>{target && <code className="gxa-target">{target}</code>}</div>
      </div>
      {risk && <p className="gxa-risk"><I d={XP.shield} size={14} />{risk}</p>}
      {details && (
        <>
          <button type="button" className="gxa-more" aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Hide details" : "Show details"}<I d={XP.down} size={13} /></button>
          {more && <pre className="gxa-pre"><code>{details}</code></pre>}
        </>
      )}
      {state ? <p className="gxa-done" role="status">{state === "deny" ? <I d={XP.x} size={14} w={2.4} /> : <I d={XP.check} size={14} w={2.4} />}{words[state]}<button type="button" onClick={() => setState(null)}>Undo</button></p> : (
        <div className="gxa-acts">
          <button type="button" className="gxa-b gxa-main" data-sound="off" onClick={() => decide("once")}>Allow once</button>
          <button type="button" className="gxa-b" data-sound="off" onClick={() => decide("always")}>Always allow</button>
          <button type="button" className="gxa-b gxa-deny" data-sound="off" onClick={() => decide("deny")}>Deny</button>
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Agents: rotating "what I'm doing" phrases, with a shimmer and a timer
   ===================================================================== */
export function GlassThinkingPhrases({ phrases = ["Thinking"], interval = 1800, running = true, showTime = true, className = "" }) {
  const [i, setI] = useState(0);
  const [sec, setSec] = useState(0);
  useEffect(() => { if (!running) return; const t = setInterval(() => setI((x) => (x + 1) % phrases.length), interval); return () => clearInterval(t); }, [running, phrases.length, interval]);
  useEffect(() => { if (!running) return; setSec(0); const t = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(t); }, [running]);
  return (
    <div className={"gxp " + className} role="status" aria-live="polite" data-running={running ? "" : undefined}>
      <span className="gxp-dot" aria-hidden="true" />
      <span className="gxp-roll"><span key={i} className="gxp-p">{phrases[i]}…</span></span>
      {showTime && running && <span className="gxp-t">{sec}s</span>}
    </div>
  );
}
