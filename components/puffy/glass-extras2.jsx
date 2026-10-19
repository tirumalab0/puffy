"use client";
import { Children, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom/client";
import "./glass-extras2.css";

/* Even more parts: a colour picker, an image viewer, a file tree, a marquee,
   a tilt card, pull to refresh, a cylinder carousel, a theme toggle, a
   sliding hover highlight, a morphing search, overflowing actions, a card
   folder, an availability grid, an endless masonry wall, a wallet card and
   a not-found page. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const I = ({ d, size = 16, w = 1.8 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const P2 = {
  x: "M6 6l12 12M18 6L6 18", left: "M15 6l-6 6 6 6", right: "M9 6l6 6-6 6", search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  more: "M5 12h.01M12 12h.01M19 12h.01", folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
  chev: "M9 6l6 6-6 6", drop: "M20 4l-2-2-5 5-1.5-1.5-1.5 1.5L12 9l-7 7v3h3l7-7 2 2 1.5-1.5L17 11l3-3z", sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
};

/* ---------- colour maths ---------- */
const hexToRgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return null; const v = parseInt(m[1], 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const rgbToHex = (r, g, b) => "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
function rgbToHsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; }
function hsvToRgb(h, s, v) { const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5) * 255, f(3) * 255, f(1) * 255]; }

/* =====================================================================
   Colour picker
   ===================================================================== */
export function GlassColorPicker({ value = "#6d5ef0", onChange, swatches = ["#17171a", "#2f6df6", "#6d5ef0", "#1f9d55", "#e8692a", "#e5484d", "#f4c430", "#0e8f8a"], label = "Colour", className = "" }) {
  const rgb = hexToRgb(value) || [109, 94, 240];
  const [hsv, setHsv] = useState(() => rgbToHsv(...rgb));
  const [txt, setTxt] = useState(value);
  const own = useRef(false);
  useEffect(() => { if (own.current) { own.current = false; return; } const c = hexToRgb(value); if (c) setHsv((o) => { const n = rgbToHsv(...c); return n[1] === 0 || n[2] === 0 ? [o[0], n[1], n[2]] : n; }); setTxt(value); }, [value]);
  const emit = (h, s, v) => { setHsv([h, s, v]); const hx = rgbToHex(...hsvToRgb(h, s, v)); setTxt(hx); own.current = true; onChange && onChange(hx); };
  const sq = useRef(null), hue = useRef(null);
  const dragSq = (e) => { const r = sq.current.getBoundingClientRect(); emit(hsv[0], clamp((e.clientX - r.left) / r.width, 0, 1), 1 - clamp((e.clientY - r.top) / r.height, 0, 1)); };
  const dragHue = (e) => { const r = hue.current.getBoundingClientRect(); emit(clamp((e.clientX - r.left) / r.width, 0, 1) * 360, hsv[1], hsv[2]); };
  const grab = (fn) => (e) => { e.currentTarget.setPointerCapture(e.pointerId); fn(e); };
  const keySq = (e) => { const st = e.shiftKey ? 0.1 : 0.02; const m = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[e.key]; if (!m) return; e.preventDefault(); emit(hsv[0], clamp(hsv[1] + m[0], 0, 1), clamp(hsv[2] + m[1], 0, 1)); };
  const keyHue = (e) => { const st = e.shiftKey ? 15 : 2; const m = { ArrowLeft: -st, ArrowRight: st, ArrowDown: -st, ArrowUp: st }[e.key]; if (m == null) return; e.preventDefault(); emit((hsv[0] + m + 360) % 360, hsv[1], hsv[2]); };
  const hueHex = rgbToHex(...hsvToRgb(hsv[0], 1, 1));
  const drop = typeof window !== "undefined" && "EyeDropper" in window;
  return (
    <div className={"gcp " + className} role="group" aria-label={label}>
      <div ref={sq} className="gcp-sq" style={{ background: hueHex }} tabIndex={0} role="slider" aria-label="Saturation and brightness" aria-valuetext={`Saturation ${Math.round(hsv[1] * 100)}%, brightness ${Math.round(hsv[2] * 100)}%`}
        onPointerDown={grab(dragSq)} onPointerMove={(e) => e.buttons && dragSq(e)} onKeyDown={keySq}>
        <i className="gcp-knob" style={{ left: hsv[1] * 100 + "%", top: (1 - hsv[2]) * 100 + "%", background: value }} />
      </div>
      <div ref={hue} className="gcp-hue" tabIndex={0} role="slider" aria-label="Hue" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hsv[0])}
        onPointerDown={grab(dragHue)} onPointerMove={(e) => e.buttons && dragHue(e)} onKeyDown={keyHue}>
        <i className="gcp-knob" style={{ left: (hsv[0] / 360) * 100 + "%", background: hueHex }} />
      </div>
      <div className="gcp-row">
        <span className="gcp-now" style={{ background: value }} />
        <label className="gcp-hex"><span>Hex</span><input value={txt} spellCheck={false} onChange={(e) => { setTxt(e.target.value); const v = e.target.value.trim(); const c = hexToRgb(v.startsWith("#") ? v : "#" + v); if (c) { setHsv(rgbToHsv(...c)); own.current = true; onChange && onChange(rgbToHex(...c)); } }} /></label>
        {drop && <button type="button" className="gcp-drop" aria-label="Pick a colour from the screen" onClick={async () => { try { const r = await new window.EyeDropper().open(); r && r.sRGBHex && onChange && onChange(r.sRGBHex); } catch (e) {} }}><I d={P2.drop} size={15} /></button>}
      </div>
      {swatches.length > 0 && (
        <div className="gcp-sw" role="radiogroup" aria-label="Presets">
          {swatches.map((s) => <button key={s} type="button" role="radio" aria-checked={s.toLowerCase() === (value || "").toLowerCase()} aria-label={s} style={{ background: s }} onClick={() => onChange && onChange(s)} />)}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Image viewer: thumbnails that open into a full view
   ===================================================================== */
/** images [{ src, alt, caption? }] */
export function GlassImageViewer({ images = [], columns = 3, className = "" }) {
  const [at, setAt] = useState(-1);
  const [zoom, setZoom] = useState(false);
  const [from, setFrom] = useState(null);
  const [dx, setDx] = useState(0);
  const thumbs = useRef([]), img = useRef(null), drag = useRef(null);
  const open = (k) => { const r = thumbs.current[k].getBoundingClientRect(); setFrom(r); setAt(k); setZoom(false); gsnd("pop"); };
  const close = () => { setAt(-1); gsnd("popClose"); thumbs.current[at] && thumbs.current[at].focus(); };
  const go = (d) => { setAt((a) => (a + d + images.length) % images.length); setZoom(false); gsnd("tick"); };
  useEffect(() => {
    if (at < 0) return;
    const k = (e) => { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", k); const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = o; };
  }, [at]);
  // the first picture grows out of its thumbnail
  useLayoutEffect(() => {
    const el = img.current; if (at < 0 || !el || !from || reduce()) return;
    const r = el.getBoundingClientRect(); if (!r.width) return;
    el.style.transition = "none"; el.style.transform = `translate(${from.left - r.left}px, ${from.top - r.top}px) scale(${from.width / r.width}, ${from.height / r.height})`;
    el.getBoundingClientRect(); requestAnimationFrame(() => { el.style.transition = ""; el.style.transform = ""; });
    setFrom(null);
  }, [at, from]);
  const cur = images[at];
  return (
    <>
      <div className={"giv " + className} style={{ "--cols": columns }}>
        {images.map((m, k) => (
          <button key={k} ref={(el) => (thumbs.current[k] = el)} type="button" className="giv-th" aria-label={`Open ${m.alt || "image " + (k + 1)}`} data-sound="off" onClick={() => open(k)}>
            <img src={m.src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {cur && typeof document !== "undefined" && createPortal(
        <div className="giv-full" role="dialog" aria-modal="true" aria-label={cur.alt || "Image"}>
          <div className="giv-back" onClick={close} />
          <div className="giv-stage" onPointerDown={(e) => { if (zoom) return; drag.current = e.clientX; }} onPointerMove={(e) => { if (drag.current != null) setDx(e.clientX - drag.current); }}
            onPointerUp={() => { if (drag.current == null) return; drag.current = null; if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1); setDx(0); }} onPointerCancel={() => { drag.current = null; setDx(0); }}>
            <img key={at} ref={img} src={cur.src} alt={cur.alt || ""} className="giv-img" data-zoom={zoom ? "" : undefined} style={dx ? { transform: `translateX(${dx}px)`, transition: "none" } : undefined}
              onDoubleClick={() => setZoom(!zoom)} draggable={false} />
          </div>
          <div className="giv-bar">
            <span className="giv-count">{at + 1} / {images.length}</span>
            {cur.caption && <span className="giv-cap">{cur.caption}</span>}
            <button type="button" className="giv-b" aria-label={zoom ? "Zoom out" : "Zoom in"} onClick={() => setZoom(!zoom)}><I d={zoom ? "M5 12h14" : "M12 5v14M5 12h14"} size={16} /></button>
            <button type="button" className="giv-b" aria-label="Close" onClick={close} autoFocus><I d={P2.x} size={16} /></button>
          </div>
          {images.length > 1 && <>
            <button type="button" className="giv-nav giv-prev" aria-label="Previous" onClick={() => go(-1)}><I d={P2.left} size={20} /></button>
            <button type="button" className="giv-nav giv-next" aria-label="Next" onClick={() => go(1)}><I d={P2.right} size={20} /></button>
          </>}
        </div>, document.body)}
    </>
  );
}

/* =====================================================================
   File tree
   ===================================================================== */
const EXT = { tsx: "#2f6df6", ts: "#2f6df6", jsx: "#0ea5c6", js: "#e3b100", css: "#9b59f0", md: "#6b7280", json: "#e8692a", png: "#1f9d55", svg: "#1f9d55" };
/** tree [{ name, children? }], value (path), onSelect(path) */
export function GlassFileTree({ tree = [], value, onSelect, defaultOpen = [], label = "Files", className = "" }) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const flat = [];
  const walk = (nodes, depth, base) => nodes.forEach((n) => { const p = base ? base + "/" + n.name : n.name; flat.push({ ...n, depth, path: p, dir: !!n.children }); if (n.children && open.has(p)) walk(n.children, depth + 1, p); });
  walk(tree, 0, "");
  const refs = useRef({});
  const [focus, setFocus] = useState(flat[0] && flat[0].path);
  const toggle = (p) => setOpen((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); gsnd("tick"); return n; });
  const key = (e, k) => {
    const n = flat[k]; let to = null;
    if (e.key === "ArrowDown") to = flat[k + 1]; else if (e.key === "ArrowUp") to = flat[k - 1];
    else if (e.key === "ArrowRight") { if (n.dir && !open.has(n.path)) toggle(n.path); else if (n.dir) to = flat[k + 1]; }
    else if (e.key === "ArrowLeft") { if (n.dir && open.has(n.path)) toggle(n.path); else { const par = n.path.split("/").slice(0, -1).join("/"); to = flat.find((x) => x.path === par); } }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); n.dir ? toggle(n.path) : onSelect && onSelect(n.path); return; }
    else return;
    e.preventDefault(); if (to) { setFocus(to.path); refs.current[to.path] && refs.current[to.path].focus(); }
  };
  return (
    <ul className={"gft " + className} role="tree" aria-label={label}>
      {flat.map((n, k) => {
        const ext = n.name.split(".").pop();
        return (
          <li key={n.path} role="treeitem" aria-expanded={n.dir ? open.has(n.path) : undefined} aria-selected={value === n.path} aria-level={n.depth + 1}
            ref={(el) => (refs.current[n.path] = el)} tabIndex={focus === n.path ? 0 : -1} data-sound="off"
            onClick={() => { setFocus(n.path); n.dir ? toggle(n.path) : onSelect && onSelect(n.path); }} onKeyDown={(e) => key(e, k)} style={{ "--d": n.depth }}>
            <span className="gft-chev" data-dir={n.dir ? "" : undefined}>{n.dir && <I d={P2.chev} size={12} w={2.4} />}</span>
            <span className="gft-ic" style={n.dir ? undefined : { color: EXT[ext] || "currentColor" }}><I d={n.dir ? P2.folder : P2.file} size={15} /></span>
            <span className="gft-name">{n.name}</span>
            {n.badge && <span className="gft-badge" data-tone={n.badge}>{n.badge === "new" ? "U" : "M"}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* =====================================================================
   Marquee: a strip that drifts sideways, forever
   ===================================================================== */
export function GlassMarquee({ children, speed = 40, reverse = false, pauseOnHover = true, gap = 40, label, className = "" }) {
  const row = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = row.current; if (!el) return;
    const fit = () => setW(el.scrollWidth); fit();
    if (typeof ResizeObserver === "undefined") return; const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  const items = Children.toArray(children);
  return (
    <div className={"gmq " + className} data-pause={pauseOnHover ? "" : undefined} role={label ? "region" : undefined} aria-label={label} style={{ "--gap": gap + "px", "--dur": (w ? w / speed : 20) + "s", "--dir": reverse ? "reverse" : "normal" }}>
      <div className="gmq-track">
        <div className="gmq-row" ref={row}>{items.map((c, k) => <span key={k} className="gmq-item">{c}</span>)}</div>
        <div className="gmq-row" aria-hidden="true">{items.map((c, k) => <span key={k} className="gmq-item">{c}</span>)}</div>
      </div>
    </div>
  );
}

/* =====================================================================
   Tilt card: leans toward the pointer, with a soft glare
   ===================================================================== */
export function GlassTiltCard({ children, max = 10, glare = true, scale = 1.02, className = "", ...rest }) {
  const el = useRef(null);
  const raf = useRef(0);
  const set = (x, y, on) => { const c = el.current; if (!c) return; c.style.setProperty("--rx", (-y * max).toFixed(2) + "deg"); c.style.setProperty("--ry", (x * max).toFixed(2) + "deg"); c.style.setProperty("--gx", (x * 50 + 50).toFixed(1) + "%"); c.style.setProperty("--gy", (y * 50 + 50).toFixed(1) + "%"); c.style.setProperty("--s", on ? scale : 1); c.dataset.on = on ? "1" : ""; };
  const move = (e) => { if (reduce() || e.pointerType === "touch") return; const r = el.current.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1; cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(() => set(x, y, true)); };
  return (
    <div ref={el} className={"gtlt " + className} onPointerMove={move} onPointerLeave={() => set(0, 0, false)} {...rest}>
      <div className="gtlt-in">{children}{glare && <span className="gtlt-glare" aria-hidden="true" />}</div>
    </div>
  );
}

/* =====================================================================
   Pull to refresh
   ===================================================================== */
/** onRefresh: returns a promise; children scroll inside */
export function GlassPullToRefresh({ onRefresh, children, height = 360, threshold = 70, className = "" }) {
  const box = useRef(null);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const st = useRef(null), armed = useRef(false);
  const down = (e) => { if (busy || box.current.scrollTop > 0) return; st.current = e.clientY; armed.current = false; };
  const move = (e) => {
    if (st.current == null) return; const d = e.clientY - st.current;
    if (d <= 0) { setPull(0); return; }
    if (e.cancelable) e.preventDefault();
    const p = Math.min(140, d * 0.55); setPull(p);
    if (p > threshold && !armed.current) { armed.current = true; gsnd("tick"); try { navigator.vibrate && navigator.vibrate(8); } catch (x) {} }
    if (p <= threshold) armed.current = false;
  };
  const up = async () => {
    if (st.current == null) return; st.current = null;
    if (pull > threshold && onRefresh) { setBusy(true); setPull(threshold * 0.8); try { await onRefresh(); } finally { setBusy(false); setPull(0); gsnd("success", { quiet: true }); } }
    else setPull(0);
  };
  const p = Math.min(1, pull / threshold);
  return (
    <div className={"gptr " + className} style={{ height }}>
      <div className="gptr-ind" style={{ height: pull, opacity: busy ? 1 : p }} aria-hidden={!busy}>
        <span className="gptr-spin" data-busy={busy ? "" : undefined} style={{ transform: busy ? undefined : `rotate(${p * 300}deg) scale(${0.5 + p * 0.5})` }}><I d={P2.refresh} size={18} w={2.2} /></span>
        <span className="gptr-txt">{busy ? "Refreshing…" : p >= 1 ? "Let go to refresh" : "Pull to refresh"}</span>
      </div>
      <div ref={box} className="gptr-scroll" style={{ transform: `translateY(${pull}px)`, transition: st.current != null ? "none" : undefined, touchAction: pull > 0 ? "none" : "pan-y" }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {children}
      </div>
      <span className="gx-sr" role="status">{busy ? "Refreshing" : ""}</span>
    </div>
  );
}

/* =====================================================================
   Cylinder carousel: cards round a drum that you spin
   ===================================================================== */
export function GlassCylinder({ items = [], value = 0, onChange, width = 180, height = 240, label = "Carousel", className = "" }) {
  const n = Math.max(3, items.length), step = 360 / n, radius = Math.round(width / 2 / Math.tan(Math.PI / n)) + 14;
  const [rot, setRot] = useState(-value * step);
  const drag = useRef(null);
  useEffect(() => { setRot((r) => { const tgt = -value * step; const k = Math.round((r - tgt) / 360); return tgt + k * 360; }); }, [value]);
  const settle = (r) => { const i = ((Math.round(-r / step) % n) + n) % n; setRot(Math.round(r / step) * step); if (i !== value) { onChange && onChange(i); gsnd("tick"); } };
  const go = (d) => { const i = ((value + d) % n + n) % n; onChange && onChange(i); gsnd("tick"); setRot((r) => r - d * step); };
  return (
    <div className={"gcy " + className} role="region" aria-roledescription="carousel" aria-label={label} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } }}>
      <div className="gcy-stage" style={{ height: height + 40 }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, r: rot }; }}
        onPointerMove={(e) => { if (!drag.current) return; setRot(drag.current.r + (e.clientX - drag.current.x) * 0.35); }}
        onPointerUp={() => { if (!drag.current) return; drag.current = null; settle(rot); }} onPointerCancel={() => { drag.current = null; settle(rot); }}>
        <div className="gcy-drum" data-drag={drag.current ? "" : undefined} style={{ width, height, transform: `translateZ(${-radius}px) rotateY(${rot}deg)` }}>
          {items.map((it, k) => (
            <div key={k} className="gcy-card" aria-hidden={k !== value} data-on={k === value ? "" : undefined} style={{ width, height, transform: `rotateY(${k * step}deg) translateZ(${radius}px)` }}>{it}</div>
          ))}
        </div>
      </div>
      <div className="gcy-ctl">
        <button type="button" aria-label="Previous" onClick={() => go(-1)}><I d={P2.left} size={16} /></button>
        <span aria-live="polite">{value + 1} / {items.length}</span>
        <button type="button" aria-label="Next" onClick={() => go(1)}><I d={P2.right} size={16} /></button>
      </div>
    </div>
  );
}

/* =====================================================================
   Theme toggle: the sun sets into a moon
   ===================================================================== */
export function GlassThemeToggle({ value = "light", onChange, size = 44, className = "" }) {
  const dark = value === "dark"; const id = useId().replace(/:/g, "");
  return (
    <button type="button" className={"gthm " + className} data-dark={dark ? "" : undefined} style={{ width: size, height: size }} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark}
      onClick={() => onChange && onChange(dark ? "light" : "dark")}>
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} aria-hidden="true">
        <mask id={id}><rect width="24" height="24" fill="#fff" /><circle className="gthm-bite" cx={dark ? 17 : 30} cy={dark ? 8 : -6} r="7" fill="#000" /></mask>
        <circle className="gthm-body" cx="12" cy="12" r={dark ? 8.5 : 5} fill="currentColor" mask={`url(#${id})`} />
        <g className="gthm-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />)}
        </g>
      </svg>
    </button>
  );
}

/* =====================================================================
   Hover highlight: one soft pill slides to whatever you point at
   ===================================================================== */
/** items [{ id, label, icon? }], value, onChange; direction "row" | "column" */
export function GlassHoverHighlight({ items = [], value, onChange, direction = "row", label = "Navigation", className = "" }) {
  const box = useRef(null), refs = useRef({});
  const [hov, setHov] = useState(null);
  const [r, setR] = useState(null);
  const target = hov || value;
  useLayoutEffect(() => {
    const el = refs.current[target], b = box.current; if (!el || !b) { setR(null); return; }
    // offsets ignore transforms, so the pill lines up even when a parent is scaled
    setR({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [target, items.length]);
  return (
    <nav ref={box} className={"ghh " + className} data-dir={direction} aria-label={label} onPointerLeave={() => setHov(null)}>
      <span className="ghh-pill" aria-hidden="true" data-hover={hov && hov !== value ? "" : undefined} style={r ? { transform: `translate(${r.x}px, ${r.y}px)`, width: r.w, height: r.h, opacity: 1 } : { opacity: 0 }} />
      {items.map((it) => (
        <button key={it.id} ref={(el) => (refs.current[it.id] = el)} type="button" aria-current={it.id === value ? "page" : undefined} data-on={it.id === value ? "" : undefined}
          onPointerEnter={() => setHov(it.id)} onFocus={() => setHov(it.id)} onBlur={() => setHov(null)} onClick={() => onChange && onChange(it.id)}>
          {it.icon && <I d={it.icon} size={16} />}<span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* =====================================================================
   Morphing search: a search icon that opens into a field with results
   ===================================================================== */
/** items [{ id, label, hint? }]; onPick(item); hotkey "/" opens it */
export function GlassMorphSearch({ items = [], onPick, placeholder = "Search…", width = 320, hotkey = true, className = "" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [act, setAct] = useState(0);
  const box = useRef(null), inp = useRef(null);
  const list = q.trim() ? items.filter((x) => x.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : items.slice(0, 4);
  const shut = () => { setOpen(false); setQ(""); };
  useEffect(() => { if (open) setTimeout(() => inp.current && inp.current.focus(), 60); }, [open]);
  useEffect(() => {
    if (!hotkey) return;
    const k = (e) => { if (e.key === "/" && !open && !/input|textarea/i.test(document.activeElement && document.activeElement.tagName)) { e.preventDefault(); setOpen(true); gsnd("pop"); } };
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [open, hotkey]);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (box.current && !box.current.contains(e.target)) shut(); };
    document.addEventListener("pointerdown", off); return () => document.removeEventListener("pointerdown", off);
  }, [open]);
  useEffect(() => setAct(0), [q]);
  const pick = (it) => { onPick && onPick(it); gsnd("tick"); shut(); };
  return (
    <div ref={box} className={"gms " + className} data-open={open ? "" : undefined} style={{ "--w": `min(${width}px, calc(100vw - 48px))` }}>
      <div className="gms-bar">
        <button type="button" className="gms-ic" aria-label={open ? "Search" : "Open search"} aria-expanded={open} tabIndex={open ? -1 : 0} onClick={() => setOpen(true)}><I d={P2.search} size={18} /></button>
        <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} tabIndex={open ? 0 : -1} aria-hidden={!open} role="combobox" aria-expanded={open && list.length > 0} aria-autocomplete="list"
          onKeyDown={(e) => { if (e.key === "Escape") shut(); else if (e.key === "ArrowDown") { e.preventDefault(); setAct((a) => Math.min(list.length - 1, a + 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(0, a - 1)); } else if (e.key === "Enter" && list[act]) pick(list[act]); }} />
        {open ? <button type="button" className="gms-x" aria-label="Close search" onClick={shut}><I d={P2.x} size={15} /></button> : hotkey && <kbd className="gms-k">/</kbd>}
      </div>
      {open && list.length > 0 && (
        <ul className="gms-list" role="listbox">
          {list.map((it, k) => <li key={it.id} role="option" aria-selected={k === act} data-sound="off" onPointerEnter={() => setAct(k)} onPointerDown={(e) => e.preventDefault()} onClick={() => pick(it)} style={{ "--i": k }}><span>{it.label}</span>{it.hint && <em>{it.hint}</em>}</li>)}
        </ul>
      )}
    </div>
  );
}

/* =====================================================================
   Overflow actions: buttons that don't fit fold into "More"
   ===================================================================== */
/** actions [{ id, label, icon, onClick, danger? }] */
export function GlassOverflowActions({ actions = [], label = "Actions", className = "" }) {
  const box = useRef(null), meas = useRef(null), moreRef = useRef(null);
  const [fit, setFit] = useState(actions.length);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const b = box.current, m = meas.current; if (!b || !m) return;
    const calc = () => {
      const avail = b.clientWidth, ws = [...m.children].map((c) => (c.offsetWidth || c.getBoundingClientRect().width) + 6), moreW = 46;
      let used = 0, k = 0; const total = ws.reduce((a, c) => a + c, 0);
      if (total <= avail) { setFit(ws.length); return; }
      while (k < ws.length && used + ws[k] + moreW <= avail) { used += ws[k]; k++; }
      setFit(k);
    };
    calc(); if (typeof ResizeObserver === "undefined") return; const ro = new ResizeObserver(calc); ro.observe(b); return () => ro.disconnect();
  }, [actions.length]);
  useEffect(() => {
    if (!open) return; const off = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", k); };
  }, [open]);
  const shown = actions.slice(0, fit), rest = actions.slice(fit);
  return (
    <div ref={box} className={"goa " + className} role="toolbar" aria-label={label}>
      <div className="goa-meas" ref={meas} aria-hidden="true">{actions.map((a) => <span key={a.id} className="goa-b"><I d={a.icon} size={16} />{a.label}</span>)}</div>
      {shown.map((a) => <button key={a.id} type="button" className="goa-b" data-danger={a.danger ? "" : undefined} onClick={a.onClick}><I d={a.icon} size={16} />{a.label}</button>)}
      {rest.length > 0 && (
        <span className="goa-more" ref={moreRef}>
          <button type="button" className="goa-b goa-dots" aria-label={`${rest.length} more`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}><I d={P2.more} size={18} w={3} /></button>
          {open && <span className="goa-menu" role="menu">{rest.map((a) => <button key={a.id} type="button" role="menuitem" data-danger={a.danger ? "" : undefined} onClick={() => { setOpen(false); a.onClick && a.onClick(); }}><I d={a.icon} size={15} />{a.label}</button>)}</span>}
        </span>
      )}
    </div>
  );
}

/* =====================================================================
   Card folder: a folder that opens and fans out what's inside
   ===================================================================== */
/** name, count, cards [element], colour */
export function GlassCardFolder({ name = "Folder", meta, cards = [], color = "#6d8cff", className = "" }) {
  const [open, setOpen] = useState(false);
  const n = Math.min(cards.length, 3);
  return (
    <button type="button" className={"gcf " + className} data-open={open ? "" : undefined} aria-expanded={open} aria-label={`${name}, ${cards.length} items`} style={{ "--fc": color }}
      onClick={() => { setOpen(!open); gsnd(open ? "popClose" : "pick"); }} onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)} onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}>
      <span className="gcf-back" />
      {cards.slice(0, 3).map((c, k) => <span key={k} className="gcf-card" style={{ "--k": k - (n - 1) / 2, "--z": k }}>{c}</span>)}
      <span className="gcf-front"><span className="gcf-name">{name}</span>{meta && <span className="gcf-meta">{meta}</span>}</span>
    </button>
  );
}

/* =====================================================================
   Availability: paint the times you're free across the week
   ===================================================================== */
/** days [labels], from/to hour, step minutes; value Set of "d-slot" keys; onChange */
export function GlassScheduler({ days = ["Mon", "Tue", "Wed", "Thu", "Fri"], from = 9, to = 17, step = 60, value, onChange, label = "Availability", className = "" }) {
  const slots = Math.round(((to - from) * 60) / step);
  const [inner, setInner] = useState(() => new Set());
  const sel = value || inner;
  const set = (s) => { value ? onChange && onChange(s) : setInner(s); };
  const paint = useRef(null);
  const apply = (key) => { const n = new Set(sel); paint.current ? n.add(key) : n.delete(key); set(n); };
  const start = (key) => { paint.current = !sel.has(key); apply(key); gsnd(paint.current ? "toggleOn" : "toggleOff", { quiet: true }); };
  useEffect(() => { const up = () => (paint.current = null); window.addEventListener("pointerup", up); return () => window.removeEventListener("pointerup", up); }, []);
  const time = (i) => { const m = from * 60 + i * step, h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`; };
  const hours = sel.size * (step / 60);
  return (
    <div className={"gsc " + className} role="group" aria-label={label}>
      <div className="gsc-grid" style={{ "--days": days.length }} onPointerLeave={() => {}}>
        <span />
        {days.map((d) => <span key={d} className="gsc-day">{d}</span>)}
        {Array.from({ length: slots }, (_, i) => (
          <Fragment2 key={i}>
            <span className="gsc-time">{time(i)}</span>
            {days.map((d, k) => {
              const key = k + "-" + i, on = sel.has(key);
              return <button key={key} type="button" className="gsc-cell" aria-pressed={on} aria-label={`${d} ${time(i)}`} data-sound="off"
                onPointerDown={(e) => { e.preventDefault(); e.currentTarget.releasePointerCapture && e.currentTarget.releasePointerCapture(e.pointerId); start(key); }}
                onPointerEnter={() => paint.current != null && apply(key)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); start(key); paint.current = null; } }} />;
            })}
          </Fragment2>
        ))}
      </div>
      <p className="gsc-sum" role="status">{sel.size ? `${hours} hour${hours === 1 ? "" : "s"} free this week` : "Drag across the grid to mark when you're free"}</p>
    </div>
  );
}
const Fragment2 = ({ children }) => <>{children}</>;

/* =====================================================================
   Masonry that loads more as you scroll
   ===================================================================== */
/** items [{ id, h (px), content }]; loadMore: () => promise; hasMore */
export function GlassMasonry({ items = [], loadMore, hasMore = true, columns = 3, gap = 10, height = 420, render, className = "" }) {
  const box = useRef(null), end = useRef(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loadMore || !hasMore || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(async ([e]) => { if (e.isIntersecting && !busy) { setBusy(true); try { await loadMore(); } finally { setBusy(false); } } }, { root: box.current, rootMargin: "120px" });
    end.current && io.observe(end.current); return () => io.disconnect();
  }, [items.length, hasMore, busy]);
  const cols = Array.from({ length: columns }, () => ({ h: 0, list: [] }));
  items.forEach((it) => { const c = cols.reduce((a, b) => (b.h < a.h ? b : a)); c.list.push(it); c.h += it.h + gap; });
  return (
    <div ref={box} className={"gmy " + className} style={{ height, "--gap": gap + "px" }}>
      <div className="gmy-cols">
        {cols.map((c, k) => <div key={k} className="gmy-col">{c.list.map((it) => <div key={it.id} className="gmy-item" style={{ height: it.h }}>{render ? render(it) : it.content}</div>)}</div>)}
      </div>
      <div ref={end} className="gmy-end">{hasMore ? (busy ? <span className="gmy-dots"><i /><i /><i /></span> : " ") : "That's everything"}</div>
    </div>
  );
}

/* =====================================================================
   Wallet card: a payment card that tilts and flips
   ===================================================================== */
export function GlassWalletCard({ brand = "Northwind", name = "Alex Morgan", last4 = "4821", expiry = "09/29", balance, network = "VISA", tone = "#1d2b64", tone2 = "#6d5ef0", className = "" }) {
  const [flip, setFlip] = useState(false);
  return (
    <GlassTiltCard max={8} className={"gwc-tilt " + className}>
      <button type="button" className="gwc" data-flip={flip ? "" : undefined} style={{ "--c1": tone, "--c2": tone2 }} aria-label={flip ? "Card back. Show the front" : `${brand} card ending ${last4}. Show the back`} onClick={() => { setFlip(!flip); gsnd("pick"); }}>
        <span className="gwc-face gwc-front">
          <span className="gwc-top"><b>{brand}</b>{balance && <span className="gwc-bal"><em>Balance</em>{balance}</span>}</span>
          <span className="gwc-chip" aria-hidden="true" />
          <span className="gwc-num" aria-hidden="true">•••• •••• •••• {last4}</span>
          <span className="gwc-bot"><span><em>Card holder</em>{name}</span><span><em>Expires</em>{expiry}</span><b className="gwc-net">{network}</b></span>
        </span>
        <span className="gwc-face gwc-backside" aria-hidden={!flip}>
          <span className="gwc-strip" />
          <span className="gwc-cvv"><em>CVV</em><b>•••</b></span>
          <span className="gwc-note">Tap again to turn it over</span>
        </span>
      </button>
    </GlassTiltCard>
  );
}

/* =====================================================================
   Not found
   ===================================================================== */
export function GlassNotFound({ code = "404", title = "This page wandered off", text = "The link may be old, or the page has moved.", art, actions, className = "" }) {
  return (
    <section className={"gnf " + className} aria-labelledby="gnf-t">
      <div className="gnf-code" aria-hidden="true">{code.split("").map((c, k) => <span key={k} style={{ "--k": k }}>{c === "0" && art ? <span className="gnf-art">{art}</span> : c}</span>)}</div>
      <h2 id="gnf-t">{title}</h2>
      <p>{text}</p>
      {actions && <div className="gnf-acts">{actions}</div>}
    </section>
  );
}
