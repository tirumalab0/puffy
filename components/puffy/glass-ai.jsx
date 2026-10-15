"use client";
import { useEffect, useRef, useState } from "react";
import { GlassButton } from "./glass-button.jsx";
import "./glass-surface.css";
import "./glass-card.css";
import "./glass-ai.css";

// Sound comes from glass-sound.jsx when it is loaded and switched on
const gsnd = (n, o) => { const g = typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };

const I = ({ d, w = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const CHEVRON = "M6 9l6 6 6-6";
const TICK = "M6 12.5l4 4 8-9";

/**
 * GlassChatMessage
 * role      "assistant" | "user"
 * name      optional label above an assistant message
 * avatar    element shown beside an assistant message
 * actions   elements under the message (copy, retry)
 * children  the message. Put thinking steps, tool calls and sources in here too.
 */
export function GlassChatMessage({ role = "assistant", name, avatar, actions, effect = "flat", children }) {
  return (
    <div className="gcm" data-role={role}>
      {role === "assistant" && <span className="gcm-avatar" aria-hidden="true">{avatar}</span>}
      <div className="gcm-main">
        {name && <span className="gcm-name">{name}</span>}
        {role === "user" ? <div className="gcm-bubble gf" data-effect={effect}>{children}</div> : <div className="gcm-text">{children}</div>}
        {actions && <div className="gcm-actions">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * GlassPromptInput: the box people type into.
 * value, onChange(text), onSend(text)
 * busy, onStop    while the assistant is working, the send button becomes Stop
 * suggestions     short prompts shown above the box; pressing one fills it
 * tools           elements at the bottom left (attach, model picker)
 * Enter sends, Shift+Enter adds a line.
 */
export function GlassPromptInput({ value = "", onChange, onSend, busy = false, onStop, suggestions = [], tools, placeholder = "Ask anything", hint, effect = "flat" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  const send = () => {
    const text = value.trim();
    if (text && !busy && onSend) { gsnd("send"); onSend(text); }
  };
  return (
    <div className="gpi">
      {suggestions.length > 0 && (
        <div className="gpi-chips">
          {suggestions.map((s) => (
            <GlassButton key={s} variant="secondary" size="sm" effect={effect} onClick={() => { onChange && onChange(s); ref.current && ref.current.focus(); }}>{s}</GlassButton>
          ))}
        </div>
      )}
      <div className="gf gpi-box" data-effect={effect} data-multiline="">
        <textarea
          ref={ref}
          className="gf-input"
          rows={1}
          aria-label={placeholder}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="gpi-bar">
          <div className="gpi-tools">{tools}{hint && <span className="gpi-hint">{hint}</span>}</div>
          {busy ? (
            <GlassButton iconOnly size="sm" effect={effect} aria-label="Stop" onClick={onStop}><I d="M8 8h8v8H8z" w={2.4} /></GlassButton>
          ) : (
            <GlassButton iconOnly size="sm" effect={effect} aria-label="Send" disabled={!value.trim()} onClick={send}><I d="M12 19V5M6 11l6-6 6 6" w={2.2} /></GlassButton>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * GlassThinkingSteps: what the assistant is doing, step by step.
 * steps  [{ id, label, detail?, status: "done" | "active" | "pending" }]
 */
export function GlassThinkingSteps({ title = "Working", steps = [], defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const done = steps.filter((s) => s.status === "done").length;
  return (
    <div className="gts">
      <button type="button" className="gts-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        {done === steps.length ? "Done" : title}
        <span className="gts-count">{done} of {steps.length} steps</span>
        <I d={CHEVRON} />
      </button>
      <div className="gts-panel" data-open={open ? "" : undefined} inert={open ? undefined : ""}>
        <ol className="gts-list">
          {steps.map((s) => (
            <li key={s.id} className="gts-step" data-status={s.status}>
              <span className="gts-mark" aria-hidden="true">{s.status === "done" && <I d={TICK} w={3.2} />}</span>
              <span className="gts-body">
                <span>{s.label}</span>
                {s.detail && <span className="gts-detail">{s.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/**
 * GlassToolCall: one call the assistant made to a tool.
 * name      the tool, shown in monospace
 * summary   one line on what it did
 * status    "running" | "done" | "error"
 * children  the details (input and output), shown when opened
 */
export function GlassToolCall({ name, summary, status = "done", defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const label = status === "running" ? "Running" : status === "error" ? "Failed" : "Done";
  return (
    <div className="gtc" data-status={status}>
      <button type="button" className="gtc-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="gtc-icon" aria-hidden="true"><I d="M4 5h16v14H4zM8 10l3 2.5-3 2.5M13 15h3" w={1.75} /></span>
        <span className="gtc-name">{name}</span>
        <span className="gtc-summary">{summary}</span>
        <span className="gtc-status">{label}</span>
        <span className="gtc-chev" aria-hidden="true"><I d={CHEVRON} /></span>
      </button>
      {open && children && <pre className="gtc-body">{children}</pre>}
    </div>
  );
}

/**
 * GlassApproval: the assistant asks before it acts.
 * title, children (what will happen)
 * status   "pending" | "approved" | "denied"
 * onApprove, onDeny
 */
export function GlassApproval({ title, children, status = "pending", onApprove, onDeny, approveLabel = "Approve", denyLabel = "Don't allow", effect = "flat" }) {
  return (
    <div className="gc gap" data-level="2" data-effect={effect} data-active={status === "pending" ? "" : undefined} role="group" aria-label={title}>
      <p className="gap-title">{title}</p>
      {children && <p className="gap-text">{children}</p>}
      {status === "pending" ? (
        <div className="gap-row">
          <GlassButton size="sm" effect={effect} onClick={onApprove}>{approveLabel}</GlassButton>
          <GlassButton size="sm" variant="secondary" effect={effect} onClick={onDeny}>{denyLabel}</GlassButton>
        </div>
      ) : (
        <p className="gap-done" role="status">{status === "approved" ? "Approved" : "Not allowed"}</p>
      )}
    </div>
  );
}

/**
 * GlassQuestions: the assistant asks a few things before it starts.
 * questions   [{ id, prompt, options: [{ value, label, hint? }] }]
 * onComplete(answers)   answers is { [id]: value } ; skipped questions are left out
 * Number keys pick an option while focus is inside.
 */
export function GlassQuestions({ questions = [], onComplete, allowSkip = true, effect = "flat" }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const q = questions[i];
  const next = (nextAnswers) => {
    setAnswers(nextAnswers);
    if (i + 1 < questions.length) setI(i + 1);
    else {
      setI(questions.length);
      if (onComplete) onComplete(nextAnswers);
    }
  };
  if (!q) {
    return (
      <div className="gc gq" data-level="1" data-effect={effect}>
        <p className="gq-prompt" role="status">Thanks, that's everything.</p>
        <div className="gq-row"><GlassButton size="sm" variant="secondary" effect={effect} onClick={() => { setI(0); setAnswers({}); }}>Start again</GlassButton></div>
      </div>
    );
  }
  return (
    <div
      className="gc gq"
      data-level="1"
      data-effect={effect}
      onKeyDown={(e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= q.options.length) next({ ...answers, [q.id]: q.options[n - 1].value });
      }}
    >
      <span className="gq-step">Question {i + 1} of {questions.length}</span>
      <p className="gq-prompt">{q.prompt}</p>
      <div className="gq-opts">
        {q.options.map((o, n) => (
          <button key={o.value} type="button" className="gf gq-opt" data-effect={effect} onClick={() => next({ ...answers, [q.id]: o.value })}>
            <span className="gq-opt-text">
              <span>{o.label}</span>
              {o.hint && <span className="gq-opt-hint">{o.hint}</span>}
            </span>
            <span className="gq-key" aria-hidden="true">{n + 1}</span>
          </button>
        ))}
      </div>
      <div className="gq-row">
        <GlassButton size="sm" variant="ghost" effect={effect} disabled={i === 0} onClick={() => setI(i - 1)}>Back</GlassButton>
        {allowSkip && <GlassButton size="sm" variant="ghost" effect={effect} onClick={() => next(answers)}>Skip</GlassButton>}
      </div>
    </div>
  );
}

/**
 * GlassSources: where an answer came from.
 * items  [{ id, title, domain?, href? }]
 */
export function GlassSources({ items = [] }) {
  return (
    <ol className="gsrc" aria-label="Sources">
      {items.map((s, n) => {
        const inner = (
          <>
            <span className="gsrc-n">{n + 1}</span>
            <span className="gsrc-title">{s.title}</span>
            {s.domain && <span className="gsrc-domain">{s.domain}</span>}
          </>
        );
        return (
          <li key={s.id}>
            {s.href ? <a className="gsrc-item" href={s.href} target="_blank" rel="noreferrer">{inner}</a> : <span className="gsrc-item">{inner}</span>}
          </li>
        );
      })}
    </ol>
  );
}

const short = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

/**
 * GlassUsage: how much of a limit is used.
 * used, limit   numbers
 * label, unit   text, e.g. "Context" and "tokens"
 * Turns red above 85%.
 */
export function GlassUsage({ label = "Context", used = 0, limit = 1, unit = "tokens" }) {
  const pct = Math.max(0, Math.min(100, (used / limit) * 100));
  return (
    <div className="gus" data-high={pct > 85 ? "" : undefined}>
      <div className="gus-head">
        <span>{label}</span>
        <span>{short(used)} of {short(limit)} {unit}</span>
      </div>
      <div className="gpr-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className="gpr-fill" style={{ "--gpr-value": pct }} />
      </div>
    </div>
  );
}
