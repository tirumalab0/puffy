"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { GlassNumber } from "./glass-motion.jsx";
import "./glass-surface.css";
import "./glass-app.css";

/* App parts for SaaS screens: sidebar, breadcrumbs, avatars, stat card,
   charts and a full data table. They sit on the same surfaces as the other
   Puffy parts, so every theme, dark mode and finish applies to them too. */

const Svg = ({ d, size = 16, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <path d={d} />
  </svg>
);
const CHEV = "M9 6l6 6-6 6";
const UP = "M7 14l5-5 5 5";
const DOWN = "M7 10l5 5 5-5";
const TICK = "M6 12.5l4 4 8-9";

/* ---------- Avatar ---------- */
const hueOf = (s = "") => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

/** GlassAvatar: name (for initials and colour), src (photo), size "sm" | "md" | "lg", status "online" | "away" | "busy" */
export function GlassAvatar({ name, src, size = "md", status }) {
  return (
    <span className="gav" data-size={size} style={{ "--h": hueOf(name) }} role="img" aria-label={name + (status ? `, ${status}` : "")}>
      {src ? <img src={src} alt="" /> : <span aria-hidden="true">{initials(name)}</span>}
      {status && <i className="gav-dot" data-status={status} aria-hidden="true" />}
    </span>
  );
}

/** GlassAvatarGroup: people [{ name, src? }], max shown before "+N" */
export function GlassAvatarGroup({ people = [], max = 4, size = "md" }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="gavg" role="group" aria-label={`${people.length} people`}>
      {shown.map((p) => <GlassAvatar key={p.name} {...p} size={size} />)}
      {rest > 0 && <span className="gav gav-more" data-size={size} aria-label={`${rest} more`}>+{rest}</span>}
    </span>
  );
}

/* ---------- Breadcrumbs ---------- */
/** GlassBreadcrumbs: items [{ label, href? }]; the last one is the current page */
export function GlassBreadcrumbs({ items = [] }) {
  return (
    <nav className="gbc" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {last ? <span aria-current="page">{it.label}</span> : <a href={it.href || "#"} onClick={it.onClick}>{it.label}</a>}
              {!last && <Svg d={CHEV} size={14} className="gbc-sep" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------- Sidebar ---------- */
/**
 * GlassSidebar: the main navigation of an app.
 * sections  [{ label?, items: [{ id, label, icon, count? }] }]
 * value, onChange(id)   the current page
 * header, footer        elements at the top (workspace) and bottom (account)
 * collapsed             icons only
 * effect                "flat" | "glass" | "bubble"
 */
export function GlassSidebar({ sections = [], value, onChange, header, footer, collapsed = false, effect = "flat", label = "Main" }) {
  return (
    <aside className="gc gsb" data-effect={effect} data-collapsed={collapsed ? "" : undefined}>
      {header && <div className="gsb-head">{header}</div>}
      <nav aria-label={label} className="gsb-nav">
        {sections.map((sec, si) => (
          <div key={si} className="gsb-sec">
            {sec.label && !collapsed && <span className="gsb-label">{sec.label}</span>}
            {sec.items.map((it) => (
              <button
                key={it.id}
                type="button"
                className="gsb-item"
                aria-current={value === it.id ? "page" : undefined}
                title={collapsed ? it.label : undefined}
                aria-label={collapsed ? it.label : undefined}
                onClick={() => onChange && onChange(it.id)}
              >
                <span className="gsb-icon">{it.icon}</span>
                {!collapsed && <span className="gsb-text">{it.label}</span>}
                {!collapsed && it.count != null && <span className="gsb-count">{it.count}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      {footer && <div className="gsb-foot">{footer}</div>}
    </aside>
  );
}

/* ---------- Charts ---------- */
const smooth = (pts) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] || pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] || pts[i + 1];
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x2},${y2}`;
  }
  return d;
};
const niceMax = (v) => {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  return Math.ceil(v / p / (v / p > 5 ? 2 : 1)) * p * (v / p > 5 ? 2 : 1);
};
const fmt = (n) => (Math.abs(n) >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + "k" : String(n));

/**
 * GlassChart: line, area or bar chart.
 * type     "area" (default) | "line" | "bar"
 * labels   x-axis labels
 * series   [{ name, values: number[] }]   the first uses the brand colour
 * height   in px; the width fills the parent
 * format   (n) => string for values
 */
export function GlassChart({ type = "area", labels = [], series = [], height = 220, format = fmt, label = "Chart" }) {
  const W = 600, H = height, pl = 36, pr = 8, pt = 12, pb = 26;
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const n = labels.length;
  const iw = W - pl - pr, ih = H - pt - pb;
  const x = (i) => pl + (type === "bar" ? (iw / n) * (i + 0.5) : n > 1 ? (iw / (n - 1)) * i : iw / 2);
  const y = (v) => pt + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    labels.forEach((_, i) => { const d = Math.abs(x(i) - px); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };
  const bw = Math.min(28, (iw / n) * 0.7 / Math.max(1, series.length));
  return (
    <div className="gch" data-type={type}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="gch-grid" x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} />
            <text className="gch-axis" x={pl - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => (n <= 12 || i % Math.ceil(n / 12) === 0) && (
          <text key={i} className="gch-axis" x={x(i)} y={H - 8} textAnchor="middle">{l}</text>
        ))}
        {type === "bar"
          ? series.map((s, si) => s.values.map((v, i) => (
              <rect key={si + "-" + i} className="gch-bar" data-series={si} data-on={hover === i ? "" : undefined}
                x={x(i) - (bw * series.length) / 2 + si * bw + 1} y={y(v)} width={bw - 2} height={Math.max(0, pt + ih - y(v))} rx={Math.min(6, bw / 3)} />
            )))
          : series.map((s, si) => {
              const pts = s.values.map((v, i) => [x(i), y(v)]);
              const line = smooth(pts);
              return (
                <g key={si} data-series={si}>
                  {type === "area" && <path className="gch-area" data-series={si} d={`${line} L${x(n - 1)},${pt + ih} L${x(0)},${pt + ih} Z`} />}
                  <path className="gch-line" data-series={si} d={line} />
                </g>
              );
            })}
        {hover != null && type !== "bar" && (
          <g>
            <line className="gch-cursor" x1={x(hover)} x2={x(hover)} y1={pt} y2={pt + ih} />
            {series.map((s, si) => <circle key={si} className="gch-dot" data-series={si} cx={x(hover)} cy={y(s.values[hover])} r="4" />)}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="gch-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status">
          <strong>{labels[hover]}</strong>
          {series.map((s, si) => (
            <span key={si}><i data-series={si} />{s.name} <b>{format(s.values[hover])}</b></span>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="gch-legend">{series.map((s, si) => <span key={si}><i data-series={si} />{s.name}</span>)}</div>
      )}
    </div>
  );
}

/** GlassSparkline: a tiny trend line. values number[] */
export function GlassSparkline({ values = [], width = 96, height = 30, tone = "accent" }) {
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 3 - ((v - min) / (max - min || 1)) * (height - 6)]);
  const d = smooth(pts);
  return (
    <svg className="gsp" data-tone={tone} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className="gsp-area" d={`${d} L${width - 2},${height} L2,${height} Z`} />
      <path className="gsp-line" d={d} />
    </svg>
  );
}

/** GlassDonut: parts [{ label, value }], a total in the middle */
export function GlassDonut({ parts = [], size = 150, label = "Total", format = fmt }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const r = 52, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="gdn">
      <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label={parts.map((p) => `${p.name || p.label} ${p.value}`).join(", ")}>
        <circle cx="64" cy="64" r={r} className="gdn-track" />
        {parts.map((p, i) => {
          const len = (p.value / total) * c;
          const el = <circle key={i} cx="64" cy="64" r={r} className="gdn-part" data-series={i} strokeDasharray={`${Math.max(0, len - 3)} ${c}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
        <text x="64" y="62" textAnchor="middle" className="gdn-total">{format(total)}</text>
        <text x="64" y="80" textAnchor="middle" className="gdn-label">{label}</text>
      </svg>
      <ul className="gdn-legend">
        {parts.map((p, i) => <li key={i}><i data-series={i} />{p.name || p.label}<b>{Math.round((p.value / total) * 100)}%</b></li>)}
      </ul>
    </div>
  );
}

/* ---------- Stat card ---------- */
/**
 * GlassStat: one number that matters.
 * label, value, change (e.g. 12.5 for +12.5%), trend number[] for a sparkline,
 * footnote, invert (a fall is good, e.g. churn), effect
 */
export function GlassStat({ label, value, change, trend, footnote, invert = false, effect = "flat" }) {
  const up = change > 0;
  const good = invert ? !up : up;
  return (
    <div className="gc gst" data-effect={effect}>
      <span className="gst-label">{label}</span>
      <div className="gst-row">
        <span className="gst-value">{typeof value === "string" || typeof value === "number" ? <GlassNumber value={value} /> : value}</span>
        {trend && <GlassSparkline values={trend} tone={change == null ? "accent" : good ? "good" : "bad"} />}
      </div>
      {(change != null || footnote) && (
        <div className="gst-foot">
          {change != null && (
            <span className="gst-change" data-good={good ? "" : undefined}>
              <Svg d={up ? UP : DOWN} size={14} />{Math.abs(change)}%
            </span>
          )}
          {footnote && <span>{footnote}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------- Data table ---------- */
function Check({ checked, indeterminate, onChange, label }) {
  return (
    <label className="gopt gdt-check" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} aria-label={label} ref={(el) => el && (el.indeterminate = !!indeterminate)} onChange={(e) => onChange(e.target.checked)} />
      <span className="gck" aria-hidden="true">
        {indeterminate ? <Svg d="M7 12h10" size={14} strokeWidth="3" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={TICK} /></svg>}
      </span>
    </label>
  );
}

/** GlassPagination: page (1-based), pages, onChange(page) */
export function GlassPagination({ page, pages, onChange }) {
  const nums = useMemo(() => {
    const out = new Set([1, pages, page - 1, page, page + 1]);
    return [...out].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  }, [page, pages]);
  return (
    <nav className="gpg" aria-label="Pages">
      <button type="button" className="gpg-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><Svg d="M15 6l-6 6 6 6" /></button>
      {nums.map((n, i) => (
        <Fragment key={n}>
          {i > 0 && n - nums[i - 1] > 1 && <span className="gpg-gap" aria-hidden="true">…</span>}
          <button type="button" className="gpg-btn" aria-current={n === page ? "page" : undefined} onClick={() => onChange(n)}>{n}</button>
        </Fragment>
      ))}
      <button type="button" className="gpg-btn" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><Svg d={CHEV} /></button>
    </nav>
  );
}

/**
 * GlassDataTable: a table for real data.
 * columns   [{ key, label, sortable?, align?, render?(row) }]
 * rows      [{ id, ... }]
 * selectable   rows get checkboxes; bulkActions(selectedIds, clear) renders the bar
 * searchable   a search field filters every text column
 * pageSize     rows per page
 * toolbar      extra elements next to the search
 * rowActions(row)  element at the end of each row (e.g. a menu)
 * empty        what to show when nothing matches
 */
export function GlassDataTable({ columns = [], rows = [], selectable = false, bulkActions, searchable = true, pageSize = 5, toolbar, rowActions, empty, caption = "Data", searchPlaceholder = "Search", query, total }) {
  const [q0, setQ] = useState("");
  const q = query ?? q0;
  useEffect(() => { if (query != null) setPage(1); }, [query]);
  const [sort, setSort] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = t ? rows.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(t))) : rows;
    if (sort) {
      out = [...out].sort((a, b) => {
        const va = a[sort.key], vb = b[sort.key];
        const d = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sort.dir === "asc" ? d : -d;
      });
    }
    return out;
  }, [rows, q, sort, columns]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * pageSize, cur * pageSize);
  const allOn = shown.length > 0 && shown.every((r) => sel.has(r.id));
  const someOn = shown.some((r) => sel.has(r.id));
  const toggle = (id, on) => setSel((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });
  const toggleAll = (on) => setSel((s) => { const n = new Set(s); shown.forEach((r) => (on ? n.add(r.id) : n.delete(r.id))); return n; });
  const clear = () => setSel(new Set());
  const sortBy = (key) => setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  return (
    <div className="gdt">
      {(searchable || toolbar || sel.size > 0) && (
        <div className="gdt-bar">
          {sel.size > 0 && bulkActions ? (
            <div className="gdt-bulk" role="status">
              <strong>{sel.size} selected</strong>
              <div className="gdt-bulk-actions">{bulkActions([...sel], clear)}</div>
              <button type="button" className="gdt-clear" onClick={clear}>Clear</button>
            </div>
          ) : (
            <>
              {searchable && (
                <div className="gf gdt-search" data-effect="flat">
                  <span className="gf-icon"><Svg d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm9 2l-4.35-4.35" /></span>
                  <input className="gf-input" type="search" placeholder={searchPlaceholder} aria-label={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
                </div>
              )}
              {toolbar && <div className="gdt-tools">{toolbar}</div>}
            </>
          )}
        </div>
      )}
      <div className="gtb">
        <table>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {selectable && <th className="gdt-cell-check"><Check checked={allOn} indeterminate={!allOn && someOn} onChange={toggleAll} label="Select all rows on this page" /></th>}
              {columns.map((c) => (
                <th key={c.key} scope="col" data-align={c.align} aria-sort={sort && sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                  {c.sortable ? (
                    <button type="button" className="gdt-sort" onClick={() => sortBy(c.key)}>
                      {c.label}
                      <Svg d={sort && sort.key === c.key && sort.dir === "desc" ? DOWN : UP} size={13} data-on={sort && sort.key === c.key ? "" : undefined} />
                    </button>
                  ) : c.label}
                </th>
              ))}
              {rowActions && <th className="gdt-cell-actions"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="gdt-empty">{empty || "Nothing matches your search."}</td></tr>
            ) : shown.map((r) => (
              <tr key={r.id} data-selected={sel.has(r.id) ? "" : undefined}>
                {selectable && <td className="gdt-cell-check"><Check checked={sel.has(r.id)} onChange={(on) => toggle(r.id, on)} label={`Select row ${r.id}`} /></td>}
                {columns.map((c) => <td key={c.key} data-align={c.align}>{c.render ? c.render(r) : r[c.key]}</td>)}
                {rowActions && <td className="gdt-cell-actions">{rowActions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="gdt-foot">
        <span>{filtered.length === 0 ? "0 results" : total ? `Showing ${shown.length} of ${total.toLocaleString()}` : `${(cur - 1) * pageSize + 1}–${Math.min(cur * pageSize, filtered.length)} of ${filtered.length}`}</span>
        {pages > 1 && <GlassPagination page={cur} pages={pages} onChange={setPage} />}
      </div>
    </div>
  );
}
