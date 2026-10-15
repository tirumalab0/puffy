"use client";
import { forwardRef, useId, useState } from "react";
import "./glass-surface.css";

/**
 * GlassInput
 * label, hint   text above and below the field
 * error         message shown in place of the hint; marks the field invalid
 * iconLeft      icon element shown before the text
 * suffix        short text or element after it (a unit, a shortcut)
 * effect        "flat" | "glass" | "bubble"
 * Every other prop goes to the <input>.
 */
export const GlassInput = forwardRef(function GlassInput(
  { label, hint, error, iconLeft, suffix, effect = "flat", className = "", id, disabled, ...rest },
  ref
) {
  const auto = useId();
  const fieldId = id || auto;
  const note = error || hint;
  return (
    <div className={`gfield ${className}`.trim()} data-invalid={error ? "" : undefined}>
      {label && <label className="gfield-label" htmlFor={fieldId}>{label}</label>}
      <div className="gf" data-effect={effect} data-disabled={disabled ? "" : undefined}>
        {iconLeft && <span className="gf-icon" aria-hidden="true">{iconLeft}</span>}
        <input
          ref={ref}
          id={fieldId}
          className="gf-input"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? `${fieldId}-note` : undefined}
          {...rest}
        />
        {suffix && <span className="gf-suffix">{suffix}</span>}
      </div>
      {note && (
        <div className="gfield-foot">
          <span className="gfield-hint" id={`${fieldId}-note`}>{note}</span>
        </div>
      )}
    </div>
  );
});

/**
 * GlassInputCopy: a read-only value with a copy button inside the field.
 * value   the text to show and copy
 */
export function GlassInputCopy({ label, value, hint, effect = "flat", className = "" }) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    const input = e.currentTarget.parentElement.querySelector("input");
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      input.select(); // clipboard blocked: leave the text selected instead
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className={`gfield ${className}`.trim()}>
      {label && <label className="gfield-label" htmlFor={id}>{label}</label>}
      <div className="gf" data-effect={effect}>
        <input id={id} className="gf-input gf-mono" readOnly value={value} onFocus={(e) => e.target.select()} />
        <button type="button" className="gf-copy" onClick={copy} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
      </div>
      {hint && <div className="gfield-foot"><span className="gfield-hint">{hint}</span></div>}
    </div>
  );
}

/**
 * GlassTextarea
 * Same label, hint, error and effect as GlassInput.
 * maxLength  also shows a live character count
 */
export const GlassTextarea = forwardRef(function GlassTextarea(
  { label, hint, error, effect = "flat", className = "", id, disabled, maxLength, value, defaultValue, onChange, rows = 4, ...rest },
  ref
) {
  const auto = useId();
  const fieldId = id || auto;
  const note = error || hint;
  const [count, setCount] = useState(String(value ?? defaultValue ?? "").length);
  const used = value !== undefined ? String(value).length : count;
  return (
    <div className={`gfield ${className}`.trim()} data-invalid={error ? "" : undefined}>
      {label && <label className="gfield-label" htmlFor={fieldId}>{label}</label>}
      <div className="gf" data-effect={effect} data-multiline="" data-disabled={disabled ? "" : undefined}>
        <textarea
          ref={ref}
          id={fieldId}
          className="gf-input"
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={note ? `${fieldId}-note` : undefined}
          onChange={(e) => {
            setCount(e.target.value.length);
            if (onChange) onChange(e);
          }}
          {...rest}
        />
      </div>
      {(note || maxLength) && (
        <div className="gfield-foot">
          <span className="gfield-hint" id={`${fieldId}-note`}>{note}</span>
          {maxLength && <span>{used} / {maxLength}</span>}
        </div>
      )}
    </div>
  );
});
