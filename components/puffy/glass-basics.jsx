"use client";
import { Children, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./glass-basics.css";

/* Basics every app reaches for: a button group, toggles, a navigation menu
   with panels, a video player, a slide carousel, a spinner and keyboard keys.
   They share the lit surface every Puffy part uses, follow --glass-radius
   for their shape and --glass-tint for their colour. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const I = ({ d, size = 16, w = 1.8, fill }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill || "none"} stroke={fill ? "none" : "currentColor"} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P = {
  left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6", down: "M6 9l6 6 6-6",
  play: "M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z", pause: "M7 5h3v14H7zM14 5h3v14h-3z",
  vol: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11", mute: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5",
  full: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5", exit: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5", replay: "M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5",
};
const fmtTime = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, "0"); return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };

/* Measures the chosen item inside a row, for a sliding indicator */
function useIndicator(box, sel, deps) {
  const [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => { const on = el.querySelector(sel); setPos(on ? { x: on.offsetLeft, w: on.offsetWidth } : null); };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, deps); // eslint-disable-line
  return pos;
}

/* =====================================================================
   Button group: several actions joined into one bar
   ===================================================================== */
/** items [{ id, text?, icon?, label?, onClick, disabled? }]; variant "secondary" | "primary"; size "sm" | "md" */
export function GlassButtonGroup({ items = [], variant = "secondary", size = "md", label = "Actions", className = "" }) {
  return (
    <div className={"gbs-bg " + className} role="group" aria-label={label} data-variant={variant} data-size={size}>
      {items.map((it, k) => (
        <button key={it.id || k} type="button" className="gbs-bg-btn" disabled={it.disabled} data-icon-only={!it.text ? "" : undefined}
          aria-label={!it.text ? it.label : undefined} title={!it.text ? it.label : undefined} onClick={it.onClick}>
          {it.icon && (typeof it.icon === "string" ? <I d={it.icon} size={size === "sm" ? 15 : 16} /> : it.icon)}{it.text}
        </button>
      ))}
    </div>
  );
}

/* =====================================================================
   Toggle and toggle group
   ===================================================================== */
/** A button that stays pressed: pressed, onChange(next), icon, children, label (for icon-only) */
export function GlassToggle({ pressed = false, onChange, icon, children, label, size = "md", className = "" }) {
  return (
    <button type="button" className={"gbs-tg-btn gbs-toggle " + className} data-size={size} aria-pressed={pressed} aria-label={!children ? label : undefined} title={!children ? label : undefined}
      onClick={() => { gsnd(pressed ? "toggleOff" : "toggleOn"); onChange && onChange(!pressed); }}>
      {icon && (typeof icon === "string" ? <I d={icon} /> : icon)}{children}
    </button>
  );
}
/** items [{ id, text?, icon?, label? }]; single: value + onChange(id); multiple: value [ids] + onChange([ids]) */
export function GlassToggleGroup({ items = [], value, onChange, multiple = false, label = "Options", size = "md", className = "" }) {
  const box = useRef(null);
  const on = (id) => (multiple ? (value || []).includes(id) : value === id);
  const pos = useIndicator(box, '[data-on="1"]', [value, items.length]);
  const pick = (id) => {
    gsnd("tick");
    if (!multiple) return onChange && onChange(id);
    const v = value || [];
    onChange && onChange(v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  };
  const key = (e) => {
    const btns = [...box.current.querySelectorAll(".gbs-tg-btn")];
    const i = btns.indexOf(document.activeElement);
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d || i < 0) return;
    e.preventDefault();
    const n = btns[(i + d + btns.length) % btns.length]; n.focus();
    if (!multiple) pick(items[btns.indexOf(n)].id);
  };
  return (
    <div ref={box} className={"gbs-tg " + className} role="group" aria-label={label} data-size={size} data-multiple={multiple ? "" : undefined} onKeyDown={key}>
      {!multiple && pos && <span className="gbs-tg-pill" aria-hidden="true" style={{ transform: `translateX(${pos.x}px)`, width: pos.w }} />}
      {items.map((it) => (
        <button key={it.id} type="button" className="gbs-tg-btn" data-on={on(it.id) ? "1" : undefined} aria-pressed={on(it.id)} tabIndex={multiple || on(it.id) || (!value && it === items[0]) ? 0 : -1}
          aria-label={!it.text ? it.label : undefined} title={!it.text ? it.label : undefined} onClick={() => pick(it.id)}>
          {it.icon && (typeof it.icon === "string" ? <I d={it.icon} /> : it.icon)}{it.text}
        </button>
      ))}
    </div>
  );
}

/* =====================================================================
   Navigation menu: a top bar whose items open panels; the panel slides
   and resizes between items instead of closing and reopening
   ===================================================================== */
/** brand, items [{ id, label, href? } | { id, label, links: [{ title, desc?, icon?, href?, onClick? }] }], actions */
export function GlassNavMenu({ brand, items = [], actions, label = "Main", className = "" }) {
  const bar = useRef(null);
  const panels = useRef({});
  const [open, setOpen] = useState(null);
  const [dir, setDir] = useState(0);
  const [box, setBox] = useState(null);
  const [compact, setCompact] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [sub, setSub] = useState(null);
  const timer = useRef(0);
  const order = items.filter((x) => x.links).map((x) => x.id);
  useLayoutEffect(() => {
    const el = bar.current; if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setCompact(el.offsetWidth < 620)); ro.observe(el); setCompact(el.offsetWidth < 620);
    return () => ro.disconnect();
  }, []);
  const show = (id) => {
    clearTimeout(timer.current);
    setOpen((cur) => { if (cur && id && cur !== id) setDir(order.indexOf(id) > order.indexOf(cur) ? 1 : -1); else setDir(0); return id; });
  };
  const hideSoon = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(null), 160); };
  // size and place the shared panel under its trigger
  useLayoutEffect(() => {
    if (!open || compact) return;
    const p = panels.current[open], b = bar.current; if (!p || !b) return;
    const t = b.querySelector(`[data-trigger="${open}"]`);
    const w = p.scrollWidth, h = p.scrollHeight, bw = b.offsetWidth;
    const cx = t ? t.offsetLeft + t.offsetWidth / 2 : bw / 2;
    setBox({ w, h, x: clamp(cx - w / 2, 8, Math.max(8, bw - w - 8)), arrow: cx });
  }, [open, compact]);
  useEffect(() => {
    if (!open && !sheet) return;
    const esc = (e) => { if (e.key === "Escape") { setOpen(null); setSheet(false); } };
    const out = (e) => { if (bar.current && !bar.current.contains(e.target)) { setOpen(null); setSheet(false); } };
    document.addEventListener("keydown", esc); document.addEventListener("pointerdown", out);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("pointerdown", out); };
  }, [open, sheet]);
  const link = (l, k, close) => {
    const Tag = l.href ? "a" : "button";
    return (
      <Tag key={k} className="gbs-nav-link" {...(l.href ? { href: l.href } : { type: "button" })} onClick={(e) => { l.onClick && l.onClick(e); close(); }}>
        {l.icon && <span className="gbs-nav-ic">{typeof l.icon === "string" ? <I d={l.icon} size={17} /> : l.icon}</span>}
        <span><b>{l.title}</b>{l.desc && <em>{l.desc}</em>}</span>
      </Tag>
    );
  };
  return (
    <nav ref={bar} className={"gbs-nav " + className} aria-label={label} data-compact={compact ? "" : undefined} onPointerLeave={(e) => { if (e.pointerType === "mouse") hideSoon(); }}>
      <div className="gbs-nav-bar">
        {brand && <span className="gbs-nav-brand">{brand}</span>}
        {!compact && (
          <ul className="gbs-nav-items">
            {items.map((it) => (
              <li key={it.id}>
                {it.links ? (
                  <button type="button" className="gbs-nav-item" data-trigger={it.id} aria-expanded={open === it.id} aria-controls={`${it.id}-panel`}
                    onPointerEnter={(e) => { if (e.pointerType === "mouse") show(it.id); }} onClick={() => show(open === it.id ? null : it.id)}>
                    {it.label}<span className="gbs-nav-chev"><I d={P.down} size={13} w={2} /></span>
                  </button>
                ) : (
                  <a className="gbs-nav-item" href={it.href || "#"} onPointerEnter={(e) => { if (e.pointerType === "mouse") show(null); }}>{it.label}</a>
                )}
              </li>
            ))}
          </ul>
        )}
        <span className="gbs-nav-actions">
          {actions}
          {compact && (
            <button type="button" className="gbs-nav-burger" aria-label={sheet ? "Close menu" : "Open menu"} aria-expanded={sheet} onClick={() => { setSheet(!sheet); setSub(null); }}>
              <span data-open={sheet ? "" : undefined}><i /><i /></span>
            </button>
          )}
        </span>
      </div>
      {!compact && (
        <div className="gbs-nav-pop" data-open={open ? "" : undefined} onPointerEnter={() => clearTimeout(timer.current)}
          style={box ? { width: box.w, height: box.h, transform: `translateX(${box.x}px)`, "--ax": box.arrow - box.x + "px" } : undefined}>
          {items.filter((x) => x.links).map((it) => (
            <div key={it.id} id={`${it.id}-panel`} ref={(el) => (panels.current[it.id] = el)} className="gbs-nav-panel"
              data-on={open === it.id ? "" : undefined} data-from={open === it.id ? dir : order.indexOf(it.id) < order.indexOf(open) ? -1 : 1}
              aria-hidden={open !== it.id} inert={open !== it.id ? "" : undefined}>
              <div className="gbs-nav-grid" data-cols={it.links.length > 3 ? 2 : 1}>{it.links.map((l, k) => link(l, k, () => setOpen(null)))}</div>
            </div>
          ))}
        </div>
      )}
      {compact && sheet && (
        <div className="gbs-nav-sheet">
          {items.map((it) => it.links ? (
            <div key={it.id} className="gbs-nav-sec" data-open={sub === it.id ? "" : undefined}>
              <button type="button" className="gbs-nav-row" aria-expanded={sub === it.id} onClick={() => setSub(sub === it.id ? null : it.id)}>{it.label}<I d={P.down} size={15} w={2} /></button>
              {sub === it.id && <div className="gbs-nav-sub">{it.links.map((l, k) => link(l, k, () => setSheet(false)))}</div>}
            </div>
          ) : <a key={it.id} className="gbs-nav-row" href={it.href || "#"} onClick={() => setSheet(false)}>{it.label}</a>)}
        </div>
      )}
    </nav>
  );
}

/* =====================================================================
   Video player: custom controls over a native video
   ===================================================================== */
/** src, poster, title, autoPlay?, loop?, muted? */
export function GlassVideoPlayer({ src, poster, title, autoPlay = false, loop = false, muted: startMuted = false, className = "" }) {
  const wrap = useRef(null), vid = useRef(null), track = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [buf, setBuf] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(startMuted);
  const [rate, setRate] = useState(1);
  const [full, setFull] = useState(false);
  const [wait, setWait] = useState(false);
  const [ended, setEnded] = useState(false);
  const [idle, setIdle] = useState(false);
  const [hover, setHover] = useState(null);
  const [rates, setRates] = useState(false);
  const [drag, setDrag] = useState(false);
  const idleT = useRef(0);
  const wake = useCallback(() => { setIdle(false); clearTimeout(idleT.current); idleT.current = setTimeout(() => setIdle(true), 2600); }, []);
  useEffect(() => () => clearTimeout(idleT.current), []);
  useEffect(() => { const f = () => setFull(document.fullscreenElement === wrap.current); document.addEventListener("fullscreenchange", f); return () => document.removeEventListener("fullscreenchange", f); }, []);
  useEffect(() => { const v = vid.current; if (v) { v.volume = vol; v.muted = muted; } }, [vol, muted]);
  useEffect(() => { const v = vid.current; if (v) v.playbackRate = rate; }, [rate]);
  const [bad, setBad] = useState(false);
  const toggle = () => { const v = vid.current; if (!v) return; if (wrap.current && document.activeElement !== wrap.current && !wrap.current.contains(document.activeElement)) wrap.current.focus({ preventScroll: true }); else if (document.activeElement && document.activeElement.classList.contains("gbs-vp-big")) wrap.current.focus({ preventScroll: true }); if (v.paused || v.ended) { v.play().catch(() => {}); } else v.pause(); wake(); };
  const seek = (s) => { const v = vid.current; if (!v || !dur) return; v.currentTime = clamp(s, 0, dur); setT(v.currentTime); setEnded(false); };
  const fromX = (x) => { const r = track.current.getBoundingClientRect(); return clamp((x - r.left) / r.width, 0, 1) * dur; };
  const fullscreen = () => { const w = wrap.current; if (!w) return; if (document.fullscreenElement) document.exitFullscreen(); else w.requestFullscreen && w.requestFullscreen().catch(() => {}); };
  const key = (e) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); toggle(); }
    else if (k === "arrowright") { e.preventDefault(); seek(t + 5); }
    else if (k === "arrowleft") { e.preventDefault(); seek(t - 5); }
    else if (k === "arrowup") { e.preventDefault(); setMuted(false); setVol((v) => clamp(v + 0.1, 0, 1)); }
    else if (k === "arrowdown") { e.preventDefault(); setVol((v) => clamp(v - 0.1, 0, 1)); }
    else if (k === "m") setMuted((m) => !m);
    else if (k === "f") fullscreen();
    else return;
    wake();
  };
  const p = dur ? t / dur : 0;
  const shown = !playing || !idle || rates || drag;
  return (
    <div ref={wrap} className={"gbs-vp " + className} data-full={full ? "" : undefined} data-controls={shown ? "" : undefined} tabIndex={0} role="group" aria-label={title ? `Video: ${title}` : "Video"}
      onKeyDown={key} onPointerMove={wake} onPointerLeave={() => playing && setIdle(true)}>
      <video ref={vid} className="gbs-vp-video" src={src} poster={poster} playsInline preload="metadata" autoPlay={autoPlay} loop={loop} muted={startMuted}
        onClick={toggle} onDoubleClick={fullscreen}
        onPlay={() => { setPlaying(true); setEnded(false); wake(); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setEnded(true); }}
        onTimeUpdate={(e) => !drag && setT(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)} onDurationChange={(e) => setDur(e.currentTarget.duration || 0)}
        onProgress={(e) => { const v = e.currentTarget; if (v.buffered.length && v.duration) setBuf(v.buffered.end(v.buffered.length - 1) / v.duration); }}
        onError={() => { setBad(true); setWait(false); }} onLoadedData={() => setBad(false)}
        onWaiting={() => setWait(true)} onPlaying={() => setWait(false)} onCanPlay={() => setWait(false)} />
      {title && <div className="gbs-vp-title">{title}</div>}
      {bad && <div className="gbs-vp-bad" role="alert">This video can’t play in this browser.</div>}
      {!playing && !wait && !bad && (
        <button type="button" className="gbs-vp-big" aria-label={ended ? "Play again" : "Play"} onClick={toggle}><I d={ended ? P.replay : P.play} size={26} w={2} fill={ended ? undefined : "currentColor"} /></button>
      )}
      {wait && <span className="gbs-vp-wait" aria-label="Loading"><GlassSpinner size={30} label="Loading video" tone="light" /></span>}
      <div className="gbs-vp-bar">
        <div ref={track} className="gbs-vp-track" role="slider" tabIndex={-1} aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(t)} aria-valuetext={`${fmtTime(t)} of ${fmtTime(dur)}`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); seek(fromX(e.clientX)); }}
          onPointerMove={(e) => { const s = fromX(e.clientX); setHover({ s, x: clamp((s / (dur || 1)) * 100, 4, 96) }); if (drag) seek(s); }}
          onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)} onPointerLeave={() => setHover(null)}>
          <span className="gbs-vp-rail"><i className="gbs-vp-buf" style={{ width: buf * 100 + "%" }} /><i className="gbs-vp-done" style={{ width: p * 100 + "%" }} /></span>
          <span className="gbs-vp-thumb" style={{ left: p * 100 + "%" }} />
          {hover && dur > 0 && <span className="gbs-vp-tip" style={{ left: hover.x + "%" }}>{fmtTime(hover.s)}</span>}
        </div>
        <div className="gbs-vp-row">
          <button type="button" className="gbs-vp-btn" aria-label={playing ? "Pause" : "Play"} onClick={toggle}><I d={playing ? P.pause : P.play} size={18} fill="currentColor" /></button>
          <span className="gbs-vp-vol">
            <button type="button" className="gbs-vp-btn" aria-label={muted || vol === 0 ? "Unmute" : "Mute"} onClick={() => setMuted(!muted)}><I d={muted || vol === 0 ? P.mute : P.vol} size={18} /></button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} aria-label="Volume" style={{ "--v": (muted ? 0 : vol) * 100 + "%" }}
              onChange={(e) => { setVol(+e.target.value); setMuted(+e.target.value === 0); }} />
          </span>
          <span className="gbs-vp-time">{fmtTime(t)} <em>/ {fmtTime(dur)}</em></span>
          <span className="gbs-vp-gap" />
          <span className="gbs-vp-rates">
            <button type="button" className="gbs-vp-btn gbs-vp-rate" aria-haspopup="menu" aria-expanded={rates} onClick={() => setRates(!rates)}>{rate}×</button>
            {rates && (
              <span className="gbs-vp-menu" role="menu">
                {[0.5, 1, 1.25, 1.5, 2].map((r) => <button key={r} type="button" role="menuitemradio" aria-checked={r === rate} onClick={() => { setRate(r); setRates(false); }}>{r === 1 ? "Normal" : r + "×"}</button>)}
              </span>
            )}
          </span>
          <button type="button" className="gbs-vp-btn" aria-label={full ? "Exit full screen" : "Full screen"} onClick={fullscreen}><I d={full ? P.exit : P.full} size={18} /></button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   Carousel: slides you swipe, drag or step through
   ===================================================================== */
/** slides [any], render(slide, i, active), perView 1..3, loop, autoPlay ms (pauses on hover/focus), label */
export function GlassCarousel({ slides = [], render, perView = 1, loop = true, autoPlay = 0, label = "Carousel", className = "" }) {
  const n = slides.length, last = Math.max(0, n - perView);
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [hold, setHold] = useState(false);
  const drag = useRef(null), view = useRef(null);
  const go = useCallback((k) => { setI((cur) => { const nx = loop ? (k < 0 ? last : k > last ? 0 : k) : clamp(k, 0, last); if (nx !== cur) gsnd("tick"); return nx; }); }, [last, loop]);
  useEffect(() => { if (!autoPlay || hold || reduce()) return; const id = setInterval(() => go(i + 1), autoPlay); return () => clearInterval(id); }, [autoPlay, hold, i, go]);
  const down = (e) => { if (e.button !== 0) return; drag.current = { x: e.clientX, y: e.clientY, on: false, id: e.pointerId }; };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    const mx = e.clientX - d.x;
    if (!d.on) { if (Math.abs(mx) < 6 || Math.abs(mx) < Math.abs(e.clientY - d.y)) return; d.on = true; e.currentTarget.setPointerCapture(d.id); }
    const edge = !loop && ((i === 0 && mx > 0) || (i === last && mx < 0));
    setDx(edge ? mx / 3 : mx);
  };
  const up = () => {
    const d = drag.current; drag.current = null; if (!d || !d.on) return;
    const w = view.current ? view.current.offsetWidth / perView : 300;
    if (dx < -w * 0.18) go(i + 1); else if (dx > w * 0.18) go(i - 1);
    setDx(0);
  };
  const pages = last + 1;
  return (
    <section className={"gbs-car " + className} aria-roledescription="carousel" aria-label={label} style={{ "--per": perView }}
      onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); } if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); } }}>
      <div ref={view} className="gbs-car-view" tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onClickCapture={(e) => { if (Math.abs(dx) > 6) e.stopPropagation(); }}>
        <div className="gbs-car-track" data-drag={dx ? "" : undefined} style={{ transform: `translateX(calc(${-i} * (100% + var(--gap)) / var(--per) + ${dx}px))` }}>
          {slides.map((s, k) => (
            <div key={k} className="gbs-car-slide" role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`} aria-hidden={k < i || k >= i + perView} inert={k < i || k >= i + perView ? "" : undefined}>
              {render ? render(s, k, k >= i && k < i + perView) : s}
            </div>
          ))}
        </div>
      </div>
      <div className="gbs-car-foot">
        <button type="button" className="gbs-car-arrow" aria-label="Previous slide" disabled={!loop && i === 0} onClick={() => go(i - 1)}><I d={P.left} size={18} w={2} /></button>
        <div className="gbs-car-dots" role="group" aria-label="Choose a slide">
          {Array.from({ length: pages }, (_, k) => <button key={k} type="button" aria-label={`Go to slide ${k + 1}`} aria-current={k === i} onClick={() => go(k)}><i style={k === i && autoPlay && !hold && !reduce() ? { animationDuration: autoPlay + "ms" } : undefined} data-run={k === i && autoPlay && !hold && !reduce() ? "" : undefined} key={k === i ? i : undefined} /></button>)}
        </div>
        <button type="button" className="gbs-car-arrow" aria-label="Next slide" disabled={!loop && i === last} onClick={() => go(i + 1)}><I d={P.right} size={18} w={2} /></button>
      </div>
      <p className="gbs-sr" aria-live="polite">Slide {i + 1} of {n}</p>
    </section>
  );
}

/* =====================================================================
   Spinner
   ===================================================================== */
/** variant "ring" | "dots" | "bars"; size px; tone "current" | "accent" | "light"; label for screen readers */
export function GlassSpinner({ variant = "ring", size = 20, tone = "current", label = "Loading", className = "" }) {
  return (
    <span className={"gbs-sp " + className} data-v={variant} data-tone={tone} role="status" aria-label={label} style={{ "--s": size + "px" }}>
      {variant === "ring" && <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" className="gbs-sp-bg" /><circle cx="12" cy="12" r="9.5" className="gbs-sp-arc" /></svg>}
      {variant === "dots" && <span aria-hidden="true"><i /><i /><i /></span>}
      {variant === "bars" && <span aria-hidden="true">{Array.from({ length: 8 }, (_, k) => <i key={k} style={{ "--k": k }} />)}</span>}
    </span>
  );
}

/* =====================================================================
   Kbd: keyboard keys; with live, a key presses down when you press it
   ===================================================================== */
const KEYMAP = { "⌘": "Meta", "⇧": "Shift", "⌥": "Alt", "⌃": "Control", "↵": "Enter", "⎋": "Escape", "⌫": "Backspace", "⇥": "Tab", "←": "ArrowLeft", "→": "ArrowRight", "↑": "ArrowUp", "↓": "ArrowDown", Ctrl: "Control", Cmd: "Meta", Alt: "Alt", Shift: "Shift", Enter: "Enter", Esc: "Escape", Tab: "Tab", Space: " " };
/** keys ["⌘", "K"]; live: light up as the person presses them; size "sm" | "md" */
export function GlassKbd({ keys = [], live = false, size = "md", className = "" }) {
  const [down, setDown] = useState(() => new Set());
  useEffect(() => {
    if (!live) return;
    const name = (k) => KEYMAP[k] || k;
    const on = (e) => setDown((s) => { const n = new Set(s); keys.forEach((k) => { const nm = name(k); if (nm.toLowerCase() === e.key.toLowerCase() || (nm === "Meta" && e.metaKey) || (nm === "Control" && e.ctrlKey && e.key === "Control")) n.add(k); }); return n; });
    const off = (e) => setDown((s) => { const n = new Set(s); keys.forEach((k) => { if (name(k).toLowerCase() === e.key.toLowerCase()) n.delete(k); }); if (e.key === "Meta" || e.key === "Control") n.clear(); return n; });
    const blur = () => setDown(new Set());
    window.addEventListener("keydown", on); window.addEventListener("keyup", off); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", on); window.removeEventListener("keyup", off); window.removeEventListener("blur", blur); };
  }, [live, keys.join("|")]); // eslint-disable-line
  const all = keys.length > 1 && keys.every((k) => down.has(k));
  return (
    <span className={"gbs-kbds " + className} data-size={size} data-all={all ? "" : undefined}>
      {keys.map((k, n) => <kbd key={n} className="gbs-kbd" data-down={down.has(k) ? "" : undefined} data-wide={k.length > 1 ? "" : undefined}>{k}</kbd>)}
    </span>
  );
}
