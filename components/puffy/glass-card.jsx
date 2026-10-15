"use client";
import "./glass-surface.css";
import "./glass-card.css";

/**
 * GlassCard: a panel to group content. Cards can sit inside cards.
 * title, text  optional heading and supporting line
 * level        1 (default) or 2 for a card inside another card
 * active       highlights the card with the brand colour
 * effect       "flat" | "glass" | "bubble"
 */
export function GlassCard({ title, text, level = 1, active = false, effect = "flat", className = "", children, ...rest }) {
  return (
    <div className={`gc ${className}`.trim()} data-level={level} data-effect={effect} data-active={active ? "" : undefined} {...rest}>
      {title && <h3 className="gc-title">{title}</h3>}
      {text && <p className="gc-text">{text}</p>}
      {children}
    </div>
  );
}

/**
 * GlassProgress
 * value, max   numbers; max defaults to 100
 * label        text on the left; the percentage shows on the right
 * accent       fill with the brand colour and a soft glow
 */
export function GlassProgress({ value = 0, max = 100, label, showValue = true, accent = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="gpr" data-accent={accent ? "" : undefined}>
      {(label || showValue) && (
        <div className="gpr-head">
          <span>{label}</span>
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="gpr-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="gpr-fill" style={{ "--gpr-value": pct }} />
      </div>
    </div>
  );
}
