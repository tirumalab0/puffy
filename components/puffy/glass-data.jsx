"use client";
import { useRef, useState } from "react";
import "./glass-data.css";
import { GlassNumber } from "./glass-motion.jsx";

/* Story parts for data: they say one thing clearly, the way a person would.
   Capacity meter, square grid, forecast bar, stat strip, activity timeline
   and tag list. Colours come from the theme: the first part takes the brand
   colour, later parts are lighter steps of it, and empty space stays grey. */

const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 }));

/**
 * GlassMeter: how much of a limit is used.
 * value, max          the numbers
 * variant             "striped" (a filled bar, the rest striped) | "ticks" (one tick per item) | "solid"
 * startLabel, endLabel   text under each end, e.g. "128 active", "150 licensed"
 * tone                "accent" | "danger" | "warning" | "good"
 */
export function GlassMeter({ value = 0, max = 100, variant = "striped", startLabel, endLabel, tone = "accent", ticks = 40, label }) {
  const p = Math.max(0, Math.min(1, value / (max || 1)));
  const name = label || `${fmt(value)} of ${fmt(max)}`;
  return (
    <div className="gmt" data-tone={tone} data-variant={variant} title={name}>
      {variant === "ticks" ? (
        <div className="gmt-ticks" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={name}>
          {Array.from({ length: ticks }, (_, i) => <i key={i} data-on={i < Math.round(p * ticks) ? "" : undefined} />)}
        </div>
      ) : (
        <div className="gmt-bar" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={name}>
          <span className="gmt-fill" style={{ flexGrow: p }} />
          {p < 1 && <span className="gmt-rest" style={{ flexGrow: 1 - p }} />}
        </div>
      )}
      {(startLabel || endLabel) && (
        <div className="gmt-foot"><span>{startLabel}</span><span>{endLabel}</span></div>
      )}
    </div>
  );
}

/**
 * GlassWaffle: a part-of-a-whole as a grid of squares, read at a glance.
 * parts    [{ name, value }]   in order; the first is the darkest
 * total    the whole (squares left over are free space)
 * cells    how many squares (default 100, in rows of 10)
 * note     a short label shown in a dashed box on the last row, e.g. "90% · scales to 12 GB"
 * unit     added after values in the legend
 */
export function GlassWaffle({ parts = [], total, cells = 100, columns = 10, note, unit = "" }) {
  const whole = total || parts.reduce((a, p) => a + p.value, 0) || 1;
  let acc = 0;
  const counts = parts.map((p) => {
    const start = Math.round((acc / whole) * cells);
    acc += p.value;
    return Math.round((acc / whole) * cells) - start;
  });
  const used = counts.reduce((a, b) => a + b, 0);
  const noteCells = note ? Math.min(columns - 2, Math.max(0, cells - used - 2)) : 0;
  const squares = [];
  counts.forEach((n, pi) => { for (let i = 0; i < n; i++) squares.push({ part: pi }); });
  while (squares.length < cells - noteCells) squares.push({ part: -1 });
  const [hover, setHover] = useState(null);
  return (
    <div className="gwf">
      <div className="gwf-grid" style={{ "--cols": columns }} role="img" aria-label={parts.map((p) => `${p.name} ${fmt(p.value)}${unit}`).join(", ") + ` of ${fmt(whole)}${unit}`}>
        {squares.map((s, i) => (
          <i key={i} data-part={s.part} data-dim={hover != null && s.part !== hover ? "" : undefined}
            onPointerEnter={() => s.part >= 0 && setHover(s.part)} onPointerLeave={() => setHover(null)}
            title={s.part >= 0 ? `${parts[s.part].name} ${fmt(parts[s.part].value)}${unit}` : "Free"} />
        ))}
        {noteCells > 0 && <span className="gwf-note" style={{ gridColumn: `span ${noteCells}` }}>{note}</span>}
      </div>
      <ul className="gwf-legend">
        {parts.map((p, i) => (
          <li key={p.name} data-dim={hover != null && hover !== i ? "" : undefined} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <i data-part={i} />{p.name}<b>{fmt(p.value)}{unit && ` ${unit}`}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * GlassForecast: a stacked bar of what is used today, a striped stretch for
 * what is expected, and a marker where a limit is reached.
 * parts      [{ name, value }]   used today, darkest first
 * forecast   how much more is expected by the marker
 * max        the whole bar
 * marker     { label } shown above the end of the forecast, e.g. "Oct 24 · 90%"
 * todayLabel, maxLabel   text under the bar
 */
export function GlassForecast({ parts = [], forecast = 0, max = 100, marker, todayLabel, maxLabel, unit = "" }) {
  const [hover, setHover] = useState(null);
  const used = parts.reduce((a, p) => a + p.value, 0);
  const pct = (v) => `${(Math.min(v, max) / (max || 1)) * 100}%`;
  const end = Math.min(max, used + forecast);
  const hl = (k) => ({ onPointerEnter: () => setHover(k), onPointerLeave: () => setHover(null), "data-dim": hover != null && hover !== k ? "" : undefined });
  const readout = hover == null ? null : hover === "fc" ? `Expected +${fmt(+forecast.toFixed(1))}${unit && " " + unit}` : hover === "free" ? `Free ${fmt(+(max - used).toFixed(1))}${unit && " " + unit}` : `${parts[hover].name} ${fmt(parts[hover].value)}${unit && " " + unit}`;
  return (
    <div className="gfc">
      {marker && <div className="gfc-mark-label" style={{ left: pct(end) }}>{marker.label}</div>}
      <div className="gfc-bar" role="img" aria-label={`${parts.map((p) => `${p.name} ${fmt(p.value)}`).join(", ")}; ${fmt(forecast)} more expected${marker ? " by " + marker.label : ""}; ${fmt(max)}${unit} in all`}>
        {parts.map((p, i) => <span key={p.name} className="gfc-seg" data-part={i} style={{ width: pct(p.value) }} {...hl(i)} />)}
        {forecast > 0 && <span className="gfc-seg gfc-forecast" style={{ width: pct(end - used) }} {...hl("fc")} />}
        <span className="gfc-free" {...hl("free")} />
        {marker && <span className="gfc-marker" style={{ left: pct(end) }} />}
        <span className="gfc-today" style={{ left: pct(used) }} />
        {readout && <span className="gfc-tip" role="status">{readout}</span>}
      </div>
      <div className="gfc-axis">
        <span>0</span>
        {todayLabel && <span className="gfc-axis-today" style={{ left: pct(used) }}>{todayLabel}</span>}
        <span>{maxLabel || `${fmt(max)}${unit && " " + unit}`}</span>
      </div>
      <ul className="gwf-legend">
        {parts.map((p, i) => <li key={p.name} {...hl(i)}><i data-part={i} />{p.name}<b>{fmt(p.value)}</b></li>)}
        <li {...hl("free")}><i data-part="free" />Free<b>{fmt(+Math.max(0, max - used).toFixed(1))}</b></li>
      </ul>
    </div>
  );
}

/**
 * GlassStatStrip: a row of numbers in one panel, split by hairlines.
 * items  [{ id?, icon?, label, value, change?, since?, invert?, children? }]
 *        change is a percentage; invert when a fall is good.
 *        children sit at the bottom of the cell (e.g. a GlassMeter).
 * value, onChange   make the cells selectable: the chosen one is marked and
 *                   arrow keys move between them. Use it to switch a chart.
 */
export function GlassStatStrip({ items = [], value, onChange, label = "Key numbers" }) {
  const selectable = typeof onChange === "function";
  const ids = items.map((it, i) => it.id ?? String(i));
  const refs = useRef([]);
  const move = (e, i) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + items.length) % items.length;
    onChange(ids[n]);
    refs.current[n] && refs.current[n].focus();
  };
  return (
    <div className="gss" style={{ "--n": items.length }} role={selectable ? "radiogroup" : undefined} aria-label={selectable ? label : undefined} data-selectable={selectable ? "" : undefined}>
      {items.map((it, i) => {
        const up = it.change > 0;
        const good = it.invert ? !up : up;
        const on = selectable && value === ids[i];
        const Tag = selectable ? "button" : "div";
        return (
          <Tag key={ids[i]} ref={(el) => (refs.current[i] = el)} type={selectable ? "button" : undefined} className="gss-cell"
            role={selectable ? "radio" : undefined} aria-checked={selectable ? on : undefined} tabIndex={selectable ? (on || (value == null && i === 0) ? 0 : -1) : undefined}
            data-on={on ? "" : undefined} onClick={selectable ? () => onChange(ids[i]) : undefined} onKeyDown={selectable ? (e) => move(e, i) : undefined}>
            <span className="gss-label">{it.icon && <span className="gss-icon">{it.icon}</span>}{it.label}</span>
            <span className="gss-value">{typeof it.value === "string" || typeof it.value === "number" ? <GlassNumber value={it.value} /> : it.value}</span>
            {it.change != null && (
              <span className="gss-change">
                <b data-good={good ? "" : undefined}>
                  <svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><path d={up ? "M5 1.5L9 8.5H1z" : "M5 8.5L1 1.5h8z"} fill="currentColor" /></svg>
                  {up ? "+" : "−"}{Math.abs(it.change)}%
                </b>
                {it.since && <span> {it.since}</span>}
              </span>
            )}
            {it.children && <span className="gss-foot">{it.children}</span>}
          </Tag>
        );
      })}
    </div>
  );
}

/**
 * GlassTimeline: what happened, newest first.
 * items  [{ title, detail?, time, tone: "good" | "bad" | "info" | "neutral" }]
 */
export function GlassTimeline({ items = [] }) {
  return (
    <ol className="gtl">
      {items.map((it, i) => (
        <li key={i} className="gtl-item" data-tone={it.tone || "neutral"}>
          <span className="gtl-mark" aria-hidden="true" />
          <div className="gtl-body">
            <strong>{it.title}</strong>
            {it.detail && <span className="gtl-detail">{it.detail}</span>}
            {it.time && <time className="gtl-time">{it.time}</time>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** GlassTagList: tags in a row, folding the rest into "+N". tags [string], max */
export function GlassTagList({ tags = [], max = 2 }) {
  const shown = tags.slice(0, max);
  const rest = tags.slice(max);
  return (
    <span className="gtg">
      {shown.map((t) => <span key={t} className="gtg-tag">{t}</span>)}
      {rest.length > 0 && <span className="gtg-tag gtg-more" title={rest.join(", ")}>+{rest.length}</span>}
    </span>
  );
}
