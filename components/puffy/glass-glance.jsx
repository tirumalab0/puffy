"use client";
import { Children, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./glass-glance.css";

/* Glance widgets: small cards that answer one question at a look — the
   weather, a flight, last night's sleep, a list, the markets, a paycheck.
   Each one builds itself in when it scrolls into view: the header first,
   then each row in turn while the card grows to fit. Any of them can be
   filled with a colour instead of white. */

const reduce = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };
const I = ({ d, size = 16, w = 1.8, fill = "none" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={fill === "none" ? "currentColor" : "none"} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
export const GLANCE_ICONS = {
  cloud: "M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18z",
  rain: "M7 15h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 6.1 4.5 4.5 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3",
  plane: "M2.5 13.5l7-1.5 5-8h2.5l-2.2 7.6 4.6-1 1.6-2.6H23l-1.2 4.2L23 16.4h-1.9l-1.6-2.6-4.6-1 2.2 7.6h-2.5l-5-8-7-1.5z",
  bed: "M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3M7 11.5a1.5 1.5 0 1 0 0-.01",
  cart: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01",
  chart: "M4 19V5M4 19h16M8 15l3-4 3 2 5-6",
  wallet: "M4 7a2 2 0 0 1 2-2h12v4M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2zM16 14h.01",
  flame: "M12 3c1 3.5 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .5 2 1.5 3 2.5 3-1-3 0-5.5 0-8z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 2v2M12 20v2M4 12H2M22 12h-2",
};

/* ---------- The build-in: header first, then each row, card grows to fit ---------- */
function useReveal(on) {
  const ref = useRef(null);
  const [shown, setShown] = useState(!on || reduce());
  useEffect(() => {
    if (shown || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [shown]);
  return [ref, shown];
}

/**
 * GlassGlance: the card every glance widget sits in.
 * icon, title    a small coloured heading (icon is a GLANCE_ICONS name or an element)
 * meta           text on the right of the heading, like a time
 * tone           the accent colour (heading, charts)
 * fill           true fills the card with the tone; or pass any colour
 * reveal         build in on first view (header, then rows)
 * size           "s" | "m" | "l" — width of the card
 * children       each child is one row and arrives in turn
 */
export function GlassGlance({ icon, title, meta, tone = "#2f7cf6", fill = false, reveal = true, size = "m", label, className = "", children, ...rest }) {
  const [box, shown] = useReveal(reveal);
  const body = useRef(null);
  const [h, setH] = useState(null);
  const rows = Children.toArray(children).filter(Boolean);
  const bg = fill === true ? tone : fill || null;
  // grow to fit smoothly, and keep fitting if the content changes
  useLayoutEffect(() => {
    const el = body.current; if (!el) return;
    const fit = () => setH(el.scrollHeight);
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <section ref={box} className={("ggl " + className).trim()} data-size={size} data-shown={shown ? "" : undefined} data-fill={bg ? "" : undefined}
      style={{ "--gg-tone": tone, ...(bg ? { "--gg-bg": bg } : null) }} aria-label={label || (typeof title === "string" ? title : undefined)} {...rest}>
      {(title || meta || icon) && (
        <header className="ggl-head">
          <span className="ggl-title">{icon && <span className="ggl-ic">{typeof icon === "string" ? <I d={GLANCE_ICONS[icon] || icon} size={17} /> : icon}</span>}{title}</span>
          {meta && <span className="ggl-meta">{meta}</span>}
        </header>
      )}
      <div className="ggl-clip" style={{ height: shown ? (h != null ? h : "auto") : 0 }}>
        <div className="ggl-body" ref={body}>
          {rows.map((r, i) => <div key={i} className="ggl-row" style={{ "--i": i }}>{r}</div>)}
        </div>
      </div>
    </section>
  );
}

/* ---------- Weather: now, and the chance of rain for the next hours ---------- */
/** hours [{ label, chance }] (chance 0..1); rain draws falling streaks behind */
export function GlassWeatherGlance({ place = "Lisbon", time, temp = 18, unit = "°C", sky = "Light rain", hours = [], rain, tone = "#5865c8", fill = "#3b4365", ...rest }) {
  const wet = rain != null ? rain : /rain|drizzle|shower|storm/i.test(sky);
  const streaks = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: (i * 37) % 100, d: (i * 0.23) % 1.4, s: 0.9 + ((i * 7) % 5) * 0.12 })), []);
  return (
    <GlassGlance title={place} meta={time} tone={tone} fill={fill} className="ggl-weather" label={`${place}: ${temp}${unit}, ${sky}`} {...rest}>
      <div className="ggw-now"><b>{temp}</b><span>{unit} · {sky}</span></div>
      {hours.length > 0 && (
        <div className="ggw-hours" role="list" aria-label="Chance of rain by hour">
          {hours.map((h, i) => (
            <span key={i} className="ggw-h" role="listitem" aria-label={`${h.label || "Later"}: ${Math.round(h.chance * 100)}%`}>
              <em>{i % 2 === 0 ? h.label : ""}</em>
              <i className="ggw-pill" style={{ "--c": h.chance, "--d": i * 60 + "ms" }}><s /></i>
              <strong data-low={h.chance < 0.3 ? "" : undefined}>{i % 2 === 0 ? Math.round(h.chance * 100) + "%" : ""}</strong>
            </span>
          ))}
        </div>
      )}
      {wet && !reduce() && <span className="ggw-rain" aria-hidden="true">{streaks.map((r, i) => <i key={i} style={{ left: r.x + "%", animationDelay: -r.d + "s", animationDuration: r.s + "s" }} />)}</span>}
    </GlassGlance>
  );
}

/* ---------- Live weather for where the person is ----------
   Asks the browser for the location (the person sees a permission prompt),
   then reads Open-Meteo, which is free and needs no key. Spread the result
   straight into the card: <GlassWeatherGlance {...w.props} />.
   status: idle, asking, loading, live, denied or error. */
const WMO = [[0, "Clear"], [1, "Mostly clear"], [2, "Partly cloudy"], [3, "Cloudy"], [48, "Foggy"], [55, "Drizzle"], [57, "Freezing drizzle"], [61, "Light rain"], [63, "Rain"], [67, "Heavy rain"], [77, "Snow"], [82, "Showers"], [86, "Snow showers"], [99, "Thunderstorm"]];
const skyFor = (c) => (WMO.find(([n]) => c <= n) || WMO[WMO.length - 1])[1];
const clock = (iso, short) => {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  const hh = h % 12 || 12, ap = h < 12 ? "AM" : "PM";
  return short ? `${hh} ${ap}` : `${hh}:${String(m).padStart(2, "0")} ${ap}`;
};
export function useLiveWeather({ unit = "celsius", hours = 6 } = {}) {
  const [state, setState] = useState({ status: "idle", props: null, error: "" });
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const set = (s) => alive.current && setState(s);
  const request = () => {
    if (!navigator.geolocation) return set({ status: "error", props: null, error: "This browser can't share a location." });
    set({ status: "asking", props: null, error: "" });
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      set({ status: "loading", props: null, error: "" });
      const lat = coords.latitude.toFixed(3), lon = coords.longitude.toFixed(3);
      try {
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=precipitation_probability&forecast_hours=${hours + 1}&temperature_unit=${unit}&timezone=auto`;
        const [wx, where] = await Promise.all([
          fetch(u).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        const h = wx.hourly, now = wx.current;
        const from = Math.max(0, h.time.findIndex((t) => t.slice(0, 13) === now.time.slice(0, 13)) + 1);
        const list = h.time.slice(from, from + hours).map((t, i) => ({ label: i % 2 === 0 ? clock(t, true) : "", chance: (h.precipitation_probability[from + i] || 0) / 100 }));
        set({ status: "live", error: "", props: {
          place: (where && (where.city || where.locality)) || "Your location",
          time: clock(now.time), temp: Math.round(now.temperature_2m), unit: unit === "celsius" ? "°C" : "°F",
          sky: skyFor(now.weather_code), hours: list,
        } });
      } catch (e) { set({ status: "error", props: null, error: "Couldn't reach the weather service." }); }
    }, (err) => set({ status: err && err.code === 1 ? "denied" : "error", props: null, error: err && err.code === 1 ? "Location was not shared." : "Couldn't find your location." }), { timeout: 12000, maximumAge: 600000 });
  };
  return { ...state, request };
}

/* ---------- Today's temperature: the range, where it is now, and the day's curve ---------- */
/** points [number] from first hour to last; hours [label]; low/high for the bar */
export function GlassTempGlance({ place = "Oslo", time, temp = 12, unit = "°", sky = "Foggy", feels, low, high, points = [], hours = [], sunrise, sunset, humidity, wind, tone = "#13b5c8", fill = false, ...rest }) {
  const lo = low != null ? low : Math.min(...points), hi = high != null ? high : Math.max(...points);
  const p = Math.max(0, Math.min(1, (temp - lo) / (hi - lo || 1)));
  const W = 300, H = 92, pad = 4;
  const mn = Math.min(...points) - 1, mx = Math.max(...points) + 1;
  const pt = points.map((v, i) => [pad + (i / Math.max(1, points.length - 1)) * (W - pad * 2), H - 6 - ((v - mn) / (mx - mn || 1)) * (H - 18)]);
  const line = pt.reduce((d, [x, y], i) => {
    if (!i) return `M${x},${y}`;
    const [px, py] = pt[i - 1], cx = (px + x) / 2;
    return d + ` C${cx},${py} ${cx},${y} ${x},${y}`;
  }, "");
  const area = pt.length ? `${line} L${pt[pt.length - 1][0]},${H} L${pt[0][0]},${H} Z` : "";
  const gid = useMemo(() => "ggt" + Math.random().toString(36).slice(2, 7), []);
  return (
    <GlassGlance icon="cloud" title={place} meta={time} tone={tone} fill={fill} className="ggl-temp" label={`${place}: ${temp}${unit}, ${sky}`} {...rest}>
      <div className="ggt-top">
        <div className="ggt-now"><b>{temp}<small>{unit}</small></b><span>{sky}</span>{feels && <em>{feels}</em>}</div>
        {(humidity || wind) && <dl className="ggt-side">{humidity && <><dt>Humidity</dt><dd>{humidity}</dd></>}{wind && <dd className="ggt-wind">{wind}</dd>}</dl>}
      </div>
      <div className="ggt-range" aria-label={`Today from ${lo} to ${hi}, now ${temp}`}>
        <span className="ggt-bar"><i style={{ left: p * 100 + "%" }}><b>{temp}{unit}</b></i></span>
        <span className="ggt-ends"><span>{lo}</span><span>Today</span><span>{hi}</span></span>
      </div>
      {pt.length > 1 && (
        <figure className="ggt-curve">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--gg-tone)" stopOpacity="0.38" /><stop offset="1" stopColor="var(--gg-tone)" stopOpacity="0.02" /></linearGradient></defs>
            <path d={area} fill={`url(#${gid})`} />
            <path className="ggt-line" d={line} fill="none" stroke="var(--gg-tone)" strokeWidth="2.2" vectorEffect="non-scaling-stroke" pathLength="1" />
          </svg>
          {hours.length > 0 && <figcaption className="ggt-hours">{hours.map((h) => <span key={h}>{h}</span>)}</figcaption>}
        </figure>
      )}
      {(sunrise || sunset) && <div className="ggt-sun"><span><I d={GLANCE_ICONS.sun} size={13} />Sunrise {sunrise}</span><span><I d={GLANCE_ICONS.moon} size={13} />Sunset {sunset}</span></div>}
    </GlassGlance>
  );
}

/* ---------- Flight: when it leaves, where to, and how it's doing ---------- */
export function GlassFlightGlance({ departs = "10:40", from = "BLR", to = "SIN", gate, status = "On time", note, progress = 0, tone = "#2f7cf6", fill = false, ...rest }) {
  const late = /late|delay/i.test(status), gone = /board|depart|air/i.test(status);
  return (
    <GlassGlance tone={tone} fill={fill} className="ggl-flight" label={`Flight ${from} to ${to}, departs ${departs}, ${status}`}
      title={<span className="ggf-dep"><em>Departs</em> {departs}</span>} {...rest}>
      <div className="ggf-route">
        <b>{from}</b>
        <span className="ggf-track"><i style={{ "--p": progress }} /><span style={{ left: progress * 100 + "%" }}><I d={GLANCE_ICONS.plane} size={15} fill="currentColor" /></span></span>
        <b>{to}</b>
        <span className="ggf-status" data-late={late ? "" : undefined} data-gone={gone ? "" : undefined}>{status}</span>
      </div>
      {gate && <p className="ggf-gate">{gate}</p>}
      {note && <p className="ggf-note">{note}</p>}
    </GlassGlance>
  );
}

/* ---------- Sleep: a score ring, the hours, and the night in stages ---------- */
const STAGES = ["Awake", "REM", "Core", "Deep"];
const STAGE_TONE = { Awake: "#ff9b3d", REM: "#2fd0e0", Core: "#2f8af6", Deep: "#6d5ef0" };
/** stages [{ stage: "Awake"|"REM"|"Core"|"Deep", from, to }] in hours from bedtime; ticks [{ at, label }] */
export function GlassSleepGlance({ date, score = 80, hours = 7, mins = 0, window: win, awake, stages = [], ticks = [], bedtime, usual, tone = "#6d5ef0", fill = false, ...rest }) {
  const end = stages.length ? stages[stages.length - 1].to : 8;
  const W = 300, rowH = 22, H = rowH * STAGES.length;
  const y = (s) => STAGES.indexOf(s) * rowH + rowH / 2;
  const x = (t) => (t / end) * W;
  const C = 2 * Math.PI * 22;
  return (
    <GlassGlance icon="bed" title="Sleep" meta={date} tone={tone} fill={fill} className="ggl-sleep" label={`Sleep score ${score}, ${hours} hours ${mins} minutes`} {...rest}>
      <div className="ggs-top">
        <span className="ggs-ring" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" /><circle cx="26" cy="26" r="22" className="ggs-arc" style={{ strokeDasharray: C, strokeDashoffset: C * (1 - score / 100) }} /></svg><b>{score}</b></span>
        <div className="ggs-dur"><b>{hours}<small>hr</small> {mins}<small>min</small></b>{win && <span>{win}</span>}{awake && <span>{awake}</span>}</div>
      </div>
      {stages.length > 0 && (
        <figure className="ggs-chart">
          <div className="ggs-labels" aria-hidden="true">{STAGES.map((s) => <span key={s}>{s}</span>)}</div>
          <div className="ggs-plot">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Sleep stages through the night">
              {ticks.map((t) => <line key={t.at} x1={x(t.at)} x2={x(t.at)} y1="0" y2={H} className="ggs-grid" />)}
              {stages.slice(1).map((s, i) => { const a = stages[i]; return <line key={"v" + i} x1={x(s.from)} x2={x(s.from)} y1={y(a.stage)} y2={y(s.stage)} className="ggs-step" />; })}
              {stages.map((s, i) => <rect key={i} x={x(s.from)} y={y(s.stage) - 4.5} width={Math.max(3, x(s.to) - x(s.from))} height="9" rx="3" fill={STAGE_TONE[s.stage]} className="ggs-seg" style={{ "--d": i * 40 + "ms" }} />)}
            </svg>
            {ticks.length > 0 && <div className="ggs-ticks">{ticks.map((t) => <span key={t.at} style={{ left: (t.at / end) * 100 + "%" }}>{t.label}</span>)}</div>}
          </div>
        </figure>
      )}
      {(bedtime || usual) && <div className="ggs-bed"><span><I d={GLANCE_ICONS.moon} size={14} />Bedtime</span><span>{bedtime}{usual && <em> · Usual {usual}</em>}</span></div>}
    </GlassGlance>
  );
}

/* ---------- Checklist: a short list in sections; tap to tick ---------- */
/** sections [{ name, items: [{ id, text, note, done }] }]; onToggle(id, done) */
export function GlassChecklistGlance({ title = "Groceries", icon = "cart", sections = [], onToggle, tone = "#1fb85a", fill = false, ...rest }) {
  const [done, setDone] = useState(() => new Set(sections.flatMap((s) => s.items.filter((i) => i.done).map((i) => i.id))));
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const flip = (id) => setDone((d) => { const n = new Set(d); const on = !n.has(id); on ? n.add(id) : n.delete(id); gsnd(on ? "toggleOn" : "toggleOff"); onToggle && onToggle(id, on); return n; });
  return (
    <GlassGlance icon={icon} title={title} meta={`${total - done.size} remaining`} tone={tone} fill={fill} className="ggl-list" {...rest}>
      {sections.map((s) => (
        <div key={s.name} className="ggc-sec">
          <h4>{s.name}</h4>
          <ul>
            {s.items.map((it) => {
              const on = done.has(it.id);
              return (
                <li key={it.id}>
                  <button type="button" role="checkbox" aria-checked={on} data-sound="off" onClick={() => flip(it.id)}>
                    <span className="ggc-box">{on && <I d={GLANCE_ICONS.check} size={11} w={3} />}</span>
                    <span className="ggc-txt"><span>{it.text}</span>{it.note && <em>{it.note}</em>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </GlassGlance>
  );
}

/* ---------- Movers: today's change, as bars either side of zero ---------- */
/** rows [{ name, change }] in %; lead is the name shown big; spark [numbers] for the lead's day */
export function GlassMoversGlance({ lead, leadName, rows = [], date, price, spark = [], tone = "#1fb85a", fill = false, ...rest }) {
  const top = rows.find((r) => r.name === lead) || rows[0] || { name: "", change: 0 };
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.change)));
  const W = 140, H = 44;
  const mn = Math.min(...spark), mx = Math.max(...spark);
  const sp = spark.map((v, i) => `${i ? "L" : "M"}${(i / Math.max(1, spark.length - 1)) * W},${H - 3 - ((v - mn) / (mx - mn || 1)) * (H - 8)}`).join(" ");
  const up = top.change >= 0;
  return (
    <GlassGlance tone={up ? tone : "#ef4f5f"} fill={fill} className="ggl-movers" meta={date} label={`${top.name} ${up ? "up" : "down"} ${Math.abs(top.change)}%`}
      title={<span className="ggm-lead"><b>{top.name}</b><strong data-down={up ? undefined : ""}>{up ? "+" : "−"}{Math.abs(top.change)}%</strong></span>} {...rest}>
      {leadName && <p className="ggm-name">{leadName}</p>}
      <div className="ggm-rows">
        <span className="ggm-cap">Today's change · %</span>
        {rows.map((r, i) => {
          const pos = r.change >= 0, w = (Math.abs(r.change) / max) * 24;
          return (
            <div key={r.name} className="ggm-row" data-lead={r.name === top.name ? "" : undefined}>
              <span className="ggm-sym">{r.name}</span>
              <span className="ggm-axis"><i data-down={pos ? undefined : ""} style={{ width: w + "%", [pos ? "left" : "right"]: "50%", "--d": i * 70 + "ms" }} /><em style={pos ? { left: `calc(50% + ${w}% + 6px)` } : { right: `calc(50% + ${w}% + 6px)` }} data-down={pos ? undefined : ""}>{pos ? "+" : "−"}{Math.abs(r.change)}%</em></span>
            </div>
          );
        })}
      </div>
      {(price || spark.length > 1) && (
        <div className="ggm-day"><span>{top.name} today</span>{price && <b>{price}</b>}
          {spark.length > 1 && <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path d={sp} fill="none" stroke="var(--gg-tone)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" pathLength="1" className="ggm-spark" /></svg>}
        </div>
      )}
    </GlassGlance>
  );
}

/* ---------- Paycheck: what came in, and where it's going ---------- */
/** income number; parts [{ name, amount }]; currency symbol */
export function GlassPaycheckGlance({ title = "Paycheck", income = 0, parts = [], currency = "$", tone = "#1fb85a", fill = false, ...rest }) {
  const fmt = (n) => currency + n.toLocaleString("en-US");
  const left = income - parts.reduce((n, p) => n + p.amount, 0);
  return (
    <GlassGlance tone={tone} fill={fill} className="ggl-pay" label={`${title} ${fmt(income)}, ${fmt(left)} left`}
      title={<span className="ggp-head"><em>{title}</em> <b>{fmt(income)}</b></span>} {...rest}>
      <div className="ggp-rows">
        <div className="ggp-row ggp-in"><span>Income</span><span className="ggp-bar"><i style={{ width: "100%" }} /></span><b>{fmt(income)}</b></div>
        {parts.map((p, i) => (
          <div key={p.name} className="ggp-row"><span>{p.name}</span><span className="ggp-bar"><i style={{ width: (p.amount / income) * 100 + "%", "--d": i * 60 + "ms" }} /></span><b>{fmt(p.amount)}</b></div>
        ))}
      </div>
      <div className="ggp-left"><span>Left to save</span><b>{fmt(left)}</b></div>
    </GlassGlance>
  );
}

/* ---------- Range today: a number between its usual low and high ---------- */
/** value, low, high; segments draws the bar as ticks; caption under it */
export function GlassRangeGlance({ title = "Climbed today", icon = "flame", value = 0, unit = "", low = 0, high = 100, segments = 22, caption, tone = "#ff7a1a", fill = false, ...rest }) {
  const p = Math.max(0, Math.min(1, (value - low) / (high - low || 1)));
  return (
    <GlassGlance icon={icon} title={<span className="ggr-title"><b>{value}{unit}</b> {title}</span>} tone={tone} fill={fill} className="ggl-range" label={`${value}${unit} ${title}`} {...rest}>
      <div className="ggr-bar"><span>{low}</span><span className="ggr-ticks">{Array.from({ length: segments }, (_, i) => <i key={i} data-on={i / segments < p ? "" : undefined} style={{ "--d": i * 22 + "ms" }} />)}</span><span>{high}</span></div>
      {caption && <p className="ggr-cap">{caption}</p>}
    </GlassGlance>
  );
}
