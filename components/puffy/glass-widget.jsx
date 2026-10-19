"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./glass-widget.css";

/* Widget cards: a soft frame with a small mono title, and an inner card that
   holds one story. Plus the charts that live in them: a smooth trend line
   with a crosshair, a breakdown bar with its list, a calendar heatmap, a
   row of key numbers, a change chip and a hint from your assistant. */

const fmtK = (v) => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(/\.0$/, "") + "k" : String(v));

/**
 * GlassWidget: the frame.
 * title      short, shown in small capitals
 * info       a sentence shown on the (i)
 * actions    elements on the right of the title row
 * onMore     shows a “more” button
 * footer     anything under the inner card
 */
export function GlassWidget({ title, info, actions, onMore, moreItems, children, className = "", ...rest }) {
  const tip = useId();
  const [menu, setMenu] = useState(false);
  const moreRef = useRef(null);
  useEffect(() => {
    if (!menu) return;
    const off = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMenu(false); };
    const esc = (e) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc); };
  }, [menu]);
  return (
    <section className={("gwg " + className).trim()} aria-label={typeof title === "string" ? title : undefined} {...rest}>
      <header className="gwg-head">
        <span className="gwg-title">{title}{info && <span className="gwg-info" tabIndex={0} aria-describedby={tip}><svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M8 7.2v3.6M8 5.2v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg><span role="tooltip" id={tip} className="gwg-tip">{info}</span></span>}</span>
        <span className="gwg-actions">
          {actions}
          {(onMore || moreItems) && <span className="gwg-more-wrap" ref={moreRef}><button type="button" className="gwg-more" aria-label="More" aria-haspopup={moreItems ? "menu" : undefined} aria-expanded={moreItems ? menu : undefined} onClick={moreItems ? () => setMenu(!menu) : onMore}><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="3.5" cy="8" r="1.4" fill="currentColor" /><circle cx="8" cy="8" r="1.4" fill="currentColor" /><circle cx="12.5" cy="8" r="1.4" fill="currentColor" /></svg></button>
            {menu && moreItems && <span className="gwg-menu" role="menu">{moreItems.map((it) => <button key={it.label} type="button" role="menuitem" data-danger={it.danger ? "" : undefined} onClick={() => { setMenu(false); it.onClick && it.onClick(); }}>{it.label}</button>)}</span>}</span>}
        </span>
      </header>
      <div className="gwg-body">{children}</div>
    </section>
  );
}

/** GlassDelta: a change, as a small chip. value is a percentage; invert when a fall is good. */
export function GlassDelta({ value = 0, invert = false, suffix = "%" }) {
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span className="gdl2" data-good={good ? "" : undefined}>
      <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true" style={up ? undefined : { transform: "scaleY(-1)" }}><path d="M3 9L9 3M4.5 3H9v4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {up ? "+" : "−"}{Math.abs(value)}{suffix}
    </span>
  );
}

/** GlassKpiRow: a few numbers side by side, split by hairlines. items [{ label, value }] */
export function GlassKpiRow({ items = [] }) {
  return (
    <dl className="gkr" style={{ "--n": items.length }}>
      {items.map((it) => <div key={it.label} className="gkr-cell"><dt>{it.label}</dt><dd>{it.value}</dd></div>)}
    </dl>
  );
}

/** GlassHint: one line from your assistant, with a way in. */
export function GlassHint({ children, onClick, icon }) {
  return (
    <button type="button" className="ghn" onClick={onClick}>
      <span className="ghn-icon" aria-hidden="true">{icon || <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M12 3c.6 3.9 2.1 5.4 6 6-3.9.6-5.4 2.1-6 6-.6-3.9-2.1-5.4-6-6 3.9-.6 5.4-2.1 6-6zM19 15c.3 1.7 1 2.4 2.7 2.7-1.7.3-2.4 1-2.7 2.7-.3-1.7-1-2.4-2.7-2.7 1.7-.3 2.4-1 2.7-2.7z" /></svg>}</span>
      <span className="ghn-text">{children}</span>
      <svg className="ghn-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  );
}

/* Smooth path through points (Catmull-Rom turned into cubic curves) */
function smooth(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  const m = [1, 1.5, 2, 2.5, 4, 5, 8, 10].find((k) => k * p >= v) || 10;
  return m * p;
}

/**
 * GlassLineChart: smooth lines with a crosshair and a readout.
 * labels      x-axis labels
 * series      [{ name, values, color? }]  the first takes the ink colour, the second the brand colour
 * format      (number) => text for the readout
 * title       (index) => the readout's heading
 * height      px
 * defaultIndex  a point to show before anyone points
 * ------------------------------------------------------------------------- */
export function GlassLineChart({ labels = [], series = [], format = (v) => "$" + fmtK(v), title = (i) => labels[i], height = 260, defaultIndex = null, label = "Trend" }) {
  const box = useRef(null);
  const gid = useId().replace(/:/g, "");
  const [w, setW] = useState(640);
  const [idx, setIdx] = useState(defaultIndex);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(160, e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const padL = 40, padR = 8, padT = 10, padB = 34;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const iw = w - padL - padR, ih = height - padT - padB;
  const x = (i) => padL + (labels.length < 2 ? iw / 2 : (i / (labels.length - 1)) * iw);
  const y = (v) => padT + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * max);
  const paths = useMemo(() => series.map((s) => smooth(s.values.map((v, i) => [x(i), y(v)]))), [series, w, height, max]);
  const pick = (e) => {
    const r = box.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round(((px - padL) / iw) * (labels.length - 1));
    setIdx(Math.max(0, Math.min(labels.length - 1, i)));
  };
  const key = (e) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return; e.preventDefault();
    setIdx((i) => Math.max(0, Math.min(labels.length - 1, (i == null ? 0 : i + d))));
  };
  const band = Math.min(56, iw / Math.max(1, labels.length - 1) * 0.9);
  const tipLeft = idx != null && x(idx) > w * (w < 520 ? 0.45 : 0.62);
  const every = Math.max(1, Math.ceil(Math.max(38, Math.max(...labels.map((l) => String(l).length)) * 8 + 14) / (iw / Math.max(1, labels.length - 1))));
  return (
    <div className="glc" ref={box} style={{ height }} tabIndex={0} role="img" aria-label={`${label}: ${series.map((s) => `${s.name} from ${format(s.values[0])} to ${format(s.values[s.values.length - 1])}`).join("; ")}. Use the arrow keys to read each point.`}
      onPointerMove={pick} onPointerLeave={() => setIdx(defaultIndex)} onKeyDown={key}>
      <svg width={w} height={height} aria-hidden="true">
        <defs>
          <pattern id={`${gid}dots`} width="14" height="14" patternUnits="userSpaceOnUse" x={padL} y={padT}><circle cx="1" cy="1" r="1" className="glc-dotgrid" /></pattern>
          <linearGradient id={`${gid}beam`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="glc-beam-s" stopOpacity="0" /><stop offset="0.5" className="glc-beam-s" stopOpacity="0.9" /><stop offset="1" className="glc-beam-s" stopOpacity="0.15" /></linearGradient>
          <clipPath id={`${gid}upto`}><rect x="0" y="0" width={idx != null ? x(idx) : w} height={height} /></clipPath>
        </defs>
        <rect x={padL} y={padT} width={iw} height={ih} fill={`url(#${gid}dots)`} className="glc-dots" />
        {ticks.map((t) => <g key={t}>{t === 0 && <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className="glc-base" />}<text x={padL - 10} y={y(t)} className="glc-y">{fmtK(t)}</text></g>)}
        {idx != null && <rect x={x(idx) - band / 2} y={padT - 4} width={band} height={ih + 4} rx="6" className="glc-band" />}
        {idx != null && <rect x={x(idx) - 1} y={padT} width="2" height={ih} rx="1" fill={`url(#${gid}beam)`} className="glc-beam" />}
        <defs>{series.map((s, k) => (
          <linearGradient key={k} id={`${gid}g${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="glc-stop" data-k={k} style={s.color ? { stopColor: s.color } : undefined} stopOpacity={k === 0 ? 0.22 : 0.16} />
            <stop offset="100%" className="glc-stop" data-k={k} style={s.color ? { stopColor: s.color } : undefined} stopOpacity="0" />
          </linearGradient>
        ))}</defs>
        {paths.map((d, k) => <path key={"a" + k + series[k].name} d={`${d} L${x(series[k].values.length - 1)},${padT + ih} L${x(0)},${padT + ih} Z`} className="glc-area" fill={`url(#${gid}g${k})`} />)}
        {paths.map((d, k) => <path key={k + ":" + series[k].name} d={d} className="glc-line" data-k={k} data-dim={idx != null ? "" : undefined} style={series[k].color ? { stroke: series[k].color } : undefined} pathLength="1" />)}
        {/* Hover trace: the line up to the pointer stays bright, the rest dims */}
        {idx != null && <g clipPath={`url(#${gid}upto)`}>{paths.map((d, k) => <path key={"t" + k} d={d} className="glc-line glc-lit" data-k={k} style={series[k].color ? { stroke: series[k].color } : undefined} />)}</g>}
        {idx != null && series.map((s, k) => <circle key={k} cx={x(idx)} cy={y(s.values[idx])} r="5.5" className="glc-dot" data-k={k} style={s.color ? { stroke: s.color } : undefined} />)}
        {labels.map((l, i) => ((i % every === 0 && !(idx != null && i !== idx && Math.abs(i - idx) < every)) || i === idx) && <text key={l + i} x={x(i)} y={height - 8} className="glc-x" data-on={i === idx ? "" : undefined}>{l}</text>)}
      </svg>
      {idx != null && (
        <div className="glc-tip" style={w < 520 ? { left: padL + 6, top: 0 } : { left: x(idx), top: Math.max(padT, Math.min(...series.map((s) => y(s.values[idx]))) - 10) }} data-left={tipLeft && w >= 520 ? "" : undefined} data-fixed={w < 520 ? "" : undefined} role="status">
          <span className="glc-tip-h">{title(idx)}</span>
          {series.map((s, k) => <span key={s.name} className="glc-tip-row"><i data-k={k} style={s.color ? { background: s.color } : undefined} />{s.name}<b>{format(s.values[idx])}</b></span>)}
        </div>
      )}
    </div>
  );
}

/** GlassLegend: dots and names in small capitals. items [{ name, color? }] */
export function GlassLegend({ items = [] }) {
  return <span className="glg">{items.map((it, k) => <span key={it.name}><i data-k={k} style={it.color ? { background: it.color } : undefined} />{it.name}</span>)}</span>;
}

/**
 * GlassBreakdown: a whole split into parts, as one bar and a list.
 * parts    [{ name, value }] biggest first
 * format   (number) => text
 * Point at a row or a piece of the bar and the other parts step back.
 */
export function GlassBreakdown({ parts = [], format = (v) => "$" + v.toLocaleString() }) {
  const [hl, setHl] = useState(null);
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const on = (i) => ({ onPointerEnter: () => setHl(i), onPointerLeave: () => setHl(null), "data-dim": hl != null && hl !== i ? "" : undefined });
  return (
    <div className="gbk">
      <div className="gbk-bar" role="img" aria-label={parts.map((p) => `${p.name} ${Math.round((p.value / total) * 100)}%`).join(", ")}>
        {parts.map((p, i) => <span key={p.name} className="gbk-seg" data-i={Math.min(i, 4)} style={{ flexGrow: p.value / total, "--i": i }} {...on(i)} />)}
      </div>
      <ul className="gbk-list">
        {parts.map((p, i) => (
          <li key={p.name} {...on(i)} tabIndex={0} onFocus={() => setHl(i)} onBlur={() => setHl(null)}>
            <i data-i={Math.min(i, 4)} />{p.name}<b>{format(p.value)}</b><em>{Math.round((p.value / total) * 100)}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * GlassHeatmap: a calendar of squares, darker where more happened.
 * rows      row labels, e.g. ["M","T","W","T","F","S","S"]
 * values    rows × columns of numbers
 * months    [{ label, col }] labels over the columns
 * format    (value, row, col) => readout text
 */
export function GlassHeatmap({ rows = [], values = [], months = [], format = (v) => `${v} orders`, levels = 5 }) {
  const [hl, setHl] = useState(null);
  const cols = values[0] ? values[0].length : 0;
  const all = values.flat();
  const lo = Math.min(...all), hi = Math.max(...all);
  const level = (v) => (hi === lo ? 0 : Math.min(levels - 1, Math.floor(((v - lo) / (hi - lo)) * levels)));
  return (
    <div className="ghm" style={{ "--cols": cols }}>
      <div className="ghm-months" aria-hidden="true">{months.map((m) => <span key={m.label} style={{ gridColumn: m.col + 2 }}>{m.label}</span>)}</div>
      <div className="ghm-grid" role="grid" aria-label="Activity by day">
        {rows.map((r, ri) => (
          <div key={ri} className="ghm-row" role="row">
            <span className="ghm-rl" role="rowheader">{r}</span>
            {values[ri].map((v, ci) => (
              <span key={ci} role="gridcell" tabIndex={-1} className="ghm-cell" data-l={level(v)} style={{ "--d": `${(ci * 18 + ri * 9)}ms` }}
                aria-label={format(v, ri, ci)} onPointerEnter={() => setHl([ri, ci, v])} onPointerLeave={() => setHl(null)} />
            ))}
          </div>
        ))}
      </div>
      <div className="ghm-foot">
        <span className="ghm-legend">Less{Array.from({ length: levels }, (_, i) => <i key={i} data-l={i} />)}More</span>
        <span className="ghm-read" role="status">{hl ? format(hl[2], hl[0], hl[1]) : ""}</span>
      </div>
    </div>
  );
}
