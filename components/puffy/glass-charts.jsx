"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./glass-charts.css";

/* Charts with light in them: a range brush, bars made of blocks, radial
   rings, a radar and a flow chart. Drawn in SVG, no chart library, and they
   take the theme colour. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmtN = (v) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + "M" : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + "k" : String(Math.round(v)));
function useWidth(min = 200) {
  const ref = useRef(null);
  const [w, setW] = useState(480);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(min, e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, w];
}
function smoothPath(pts) {
  if (!pts.length) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

/* ---------- Range brush: a small overview with a window you drag ---------- */
export function GlassBrush({ values = [], value, onChange, height = 56, label = "Range", minSpan = 2, className = "" }) {
  const [ref, w] = useWidth(160);
  const n = values.length;
  const [a, b] = value || [0, n - 1];
  const max = Math.max(1, ...values);
  const x = (i) => (n < 2 ? 0 : (i / (n - 1)) * w);
  const d = smoothPath(values.map((v, i) => [x(i), height - 4 - (v / max) * (height - 10)]));
  const drag = useRef(null);
  const toI = (px) => Math.max(0, Math.min(n - 1, Math.round((px / w) * (n - 1))));
  const down = (mode) => (e) => {
    e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
    const r = ref.current.getBoundingClientRect();
    drag.current = { mode, x0: e.clientX - r.left, a, b };
  };
  const move = (e) => {
    const g = drag.current; if (!g) return;
    const r = ref.current.getBoundingClientRect();
    const di = toI(e.clientX - r.left) - toI(g.x0);
    let na = g.a, nb = g.b;
    if (g.mode === "move") { const span = g.b - g.a; na = Math.max(0, Math.min(n - 1 - span, g.a + di)); nb = na + span; }
    if (g.mode === "a") na = Math.max(0, Math.min(g.b - minSpan, g.a + di));
    if (g.mode === "b") nb = Math.min(n - 1, Math.max(g.a + minSpan, g.b + di));
    if (na !== a || nb !== b) onChange && onChange([na, nb]);
  };
  const up = () => { drag.current = null; };
  const key = (which) => (e) => {
    const dlt = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!dlt) return; e.preventDefault();
    if (which === "a") onChange && onChange([Math.max(0, Math.min(b - minSpan, a + dlt)), b]);
    else onChange && onChange([a, Math.min(n - 1, Math.max(a + minSpan, b + dlt))]);
  };
  return (
    <div className={"gbr " + className} ref={ref} style={{ height }} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <svg width={w} height={height} aria-hidden="true">
        <path d={`${d} L${w},${height} L0,${height} Z`} className="gbr-area" />
        <path d={d} className="gbr-line" />
      </svg>
      <span className="gbr-shade" style={{ left: 0, width: x(a) }} />
      <span className="gbr-shade" style={{ left: x(b), right: 0 }} />
      <span className="gbr-win" style={{ left: x(a), width: x(b) - x(a) }} onPointerDown={down("move")}>
        <span className="gbr-h" role="slider" tabIndex={0} aria-label={label + " start"} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={a} onPointerDown={down("a")} onKeyDown={key("a")} />
        <span className="gbr-h gbr-h-b" role="slider" tabIndex={0} aria-label={label + " end"} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={b} onPointerDown={down("b")} onKeyDown={key("b")} />
      </span>
    </div>
  );
}

/* ---------- Block bars: each bar is a stack of small squares that fill in ---------- */
export function GlassBlockBars({ labels = [], values = [], blocks = 12, format = fmtN, highlight, height = 220, label = "Bar chart", className = "" }) {
  const [hot, setHot] = useState(null);
  const max = Math.max(1, ...values);
  const best = highlight != null ? highlight : values.indexOf(max);
  return (
    <div className={"gbb " + className} role="img" aria-label={`${label}: ${labels.map((l, i) => `${l} ${format(values[i])}`).join(", ")}`} style={{ "--rows": blocks, height }}>
      {values.map((v, i) => {
        const on = Math.max(1, Math.round((v / max) * blocks));
        return (
          <div key={labels[i] || i} className="gbb-col" data-best={i === best ? "" : undefined} data-hot={hot === i ? "" : undefined} onPointerEnter={() => setHot(i)} onPointerLeave={() => setHot(null)}>
            <span className="gbb-val">{format(v)}</span>
            <span className="gbb-stack">
              {Array.from({ length: blocks }, (_, k) => <i key={k} data-on={blocks - k <= on ? "" : undefined} style={{ "--d": (i * 40 + (blocks - k) * 22) + "ms" }} />)}
            </span>
            <span className="gbb-lab">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Radial rings: one ring per value, made of short segments ---------- */
export function GlassRadial({ items = [], size = 200, segments = 48, format = (v, m) => Math.round((v / m) * 100) + "%", center, className = "" }) {
  const [hot, setHot] = useState(0);
  const cx = size / 2, gap = 14, w = 9;
  const it = items[hot] || items[0] || {};
  return (
    <div className={"grd " + className} style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={items.map((x) => `${x.name} ${format(x.value, x.max)}`).join(", ")}>
        {items.map((x, r) => {
          const R = cx - 8 - r * gap, on = Math.round((x.value / x.max) * segments);
          return (
            <g key={x.name} data-k={r} data-hot={r === hot ? "" : undefined} onPointerEnter={() => setHot(r)} className="grd-ring">
              {Array.from({ length: segments }, (_, s) => {
                const a0 = (s / segments) * Math.PI * 2 - Math.PI / 2, a1 = ((s + 0.62) / segments) * Math.PI * 2 - Math.PI / 2;
                return <path key={s} d={`M${cx + Math.cos(a0) * R},${cx + Math.sin(a0) * R} A${R},${R} 0 0 1 ${cx + Math.cos(a1) * R},${cx + Math.sin(a1) * R}`} strokeWidth={w} data-on={s < on ? "" : undefined} style={{ "--d": s * 14 + r * 120 + "ms" }} />;
              })}
            </g>
          );
        })}
      </svg>
      <div className="grd-mid">{center ? center(it) : <><b>{format(it.value || 0, it.max || 1)}</b><span>{it.name}</span></>}</div>
      <div className="grd-keys">{items.map((x, r) => <button key={x.name} type="button" data-k={r} aria-pressed={r === hot} onClick={() => setHot(r)}><i />{x.name}</button>)}</div>
    </div>
  );
}

/* ---------- Radar: several measures around a circle, one or two shapes ---------- */
export function GlassRadar({ axes = [], series = [], max = 100, size = 260, className = "" }) {
  const [hot, setHot] = useState(null);
  const c = size / 2, R = c - 34, n = axes.length;
  const pt = (i, v) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return [c + Math.cos(a) * R * (v / max), c + Math.sin(a) * R * (v / max)]; };
  return (
    <div className={"grr " + className}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={series.map((s) => `${s.name}: ${axes.map((a, i) => `${a} ${s.values[i]}`).join(", ")}`).join("; ")}>
        {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={axes.map((_, i) => pt(i, max * k).join(",")).join(" ")} className="grr-web" />)}
        {axes.map((a, i) => { const [x, y] = pt(i, max); const [lx, ly] = pt(i, max * 1.16); return <g key={a}><line x1={c} y1={c} x2={x} y2={y} className="grr-spoke" /><text x={lx} y={ly} className="grr-lab" data-on={hot === i ? "" : undefined}>{a}</text></g>; })}
        {series.map((s, k) => <polygon key={s.name} points={s.values.map((v, i) => pt(i, v).join(",")).join(" ")} className="grr-shape" data-k={k} />)}
        {series.map((s, k) => s.values.map((v, i) => { const [x, y] = pt(i, v); return <circle key={k + "-" + i} cx={x} cy={y} r={hot === i ? 5 : 3} className="grr-dot" data-k={k} onPointerEnter={() => setHot(i)} onPointerLeave={() => setHot(null)} />; }))}
      </svg>
      <div className="grr-read" aria-live="polite">{hot == null ? <span>Point at a corner</span> : <><b>{axes[hot]}</b>{series.map((s, k) => <span key={s.name}><i data-k={k} />{s.name} {s.values[hot]}</span>)}</>}</div>
    </div>
  );
}

/* ---------- Flow: where things come from and where they go ---------- */
export function GlassFlow({ from = [], to = [], links = [], height = 260, format = fmtN, className = "" }) {
  const [ref, w] = useWidth(220);
  const [hot, setHot] = useState(null);
  const total = links.reduce((a, l) => a + l.value, 0) || 1;
  const gap = 10, nodeW = 10;
  const layout = (names) => {
    const sums = names.map((n) => links.filter((l) => l.from === n || l.to === n).reduce((a, l) => a + l.value, 0));
    const avail = height - gap * (names.length - 1);
    let yy = 0;
    return Object.fromEntries(names.map((n, i) => { const h = (sums[i] / total) * avail; const r = [n, { y: yy, h, off: 0 }]; yy += h + gap; return r; }));
  };
  const L = layout(from), Rt = layout(to);
  const nar = w < 480; // narrow: the value goes under the name so labels fit
  const x0 = nar ? 64 : 110, x1 = w - (nar ? 76 : 120);
  const paths = links.map((l) => {
    const a = L[l.from], b = Rt[l.to], h = (l.value / total) * (height - gap * (Math.max(from.length, to.length) - 1));
    const ya = a.y + a.off + h / 2, yb = b.y + b.off + h / 2; a.off += h; b.off += h;
    const mx = (x0 + nodeW + x1) / 2;
    return { l, h, d: `M${x0 + nodeW},${ya} C${mx},${ya} ${mx},${yb} ${x1},${yb}` };
  });
  return (
    <div className={"gfl " + className} ref={ref}>
      <svg width={w} height={height} role="img" aria-label={links.map((l) => `${l.from} to ${l.to}: ${format(l.value)}`).join(", ")}>
        {paths.map(({ l, h, d }, i) => <path key={i} d={d} strokeWidth={Math.max(1.5, h)} className="gfl-link" data-dim={hot && hot !== l.from && hot !== l.to ? "" : undefined} style={{ "--d": i * 70 + "ms" }} />)}
        {from.map((n) => <g key={n} onPointerEnter={() => setHot(n)} onPointerLeave={() => setHot(null)}><rect x={x0} y={L[n].y} width={nodeW} height={Math.max(2, L[n].h)} rx="3" className="gfl-node" /><text x={x0 - 10} y={L[n].y + L[n].h / 2} className="gfl-lab" textAnchor="end">{n}</text></g>)}
        {to.map((n) => <g key={n} onPointerEnter={() => setHot(n)} onPointerLeave={() => setHot(null)}><rect x={x1} y={Rt[n].y} width={nodeW} height={Math.max(2, Rt[n].h)} rx="3" className="gfl-node gfl-node-b" /><text x={x1 + nodeW + 8} y={Rt[n].y + Rt[n].h / 2 - (nar ? 8 : 0)} className="gfl-lab">{n}{nar ? <tspan x={x1 + nodeW + 8} dy="17" className="gfl-v">{format(links.filter((l) => l.to === n).reduce((a, l) => a + l.value, 0))}</tspan> : <> <tspan className="gfl-v">{format(links.filter((l) => l.to === n).reduce((a, l) => a + l.value, 0))}</tspan></>}</text></g>)}
      </svg>
    </div>
  );
}
