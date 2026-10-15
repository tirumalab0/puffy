"use client";
import { useRef } from "react";
import "./glass-motion.css";

/* Small motion parts. They only move when something changes, and they keep
   still for people who ask their computer for less motion. */

/**
 * GlassNumber: a value whose characters roll when it changes, like a
 * counter. Pass the formatted text ("$1,240.00", "87%", "12 / 20").
 * value      the text or number to show
 * Characters are matched from the right, so units stay put and only the
 * digits that changed roll. Rolls up when the number grows, down when it shrinks.
 */
export function GlassNumber({ value, className = "" }) {
  const text = String(value);
  const prev = useRef(text);
  const dir = useRef("up");
  if (prev.current !== text) {
    const a = parseFloat(prev.current.replace(/[^0-9.-]/g, ""));
    const b = parseFloat(text.replace(/[^0-9.-]/g, ""));
    dir.current = !isNaN(a) && !isNaN(b) && b < a ? "down" : "up";
    prev.current = text;
  }
  const chars = [...text];
  return (
    <span className={("gnum " + className).trim()} data-dir={dir.current}>
      <span className="gnum-sr">{text}</span>
      <span aria-hidden="true" className="gnum-row">
        {chars.map((c, i) => (
          <span key={chars.length - i + ":" + c} className="gnum-c" data-digit={/\d/.test(c) ? "" : undefined}>{c === " " ? " " : c}</span>
        ))}
      </span>
    </span>
  );
}

/**
 * GlassReveal: text that arrives word by word, each one sharpening out of a
 * soft blur. Use it for headlines and AI answers.
 * text       the words
 * as         the tag to render (h1, h2, p…)
 * step       ms between words (default 45)
 * delay      ms before the first word
 */
export function GlassReveal({ text = "", as: Tag = "span", step = 45, delay = 0, className = "", ...rest }) {
  const words = String(text).split(/(\s+)/);
  let n = 0;
  return (
    <Tag className={("grv " + className).trim()} aria-label={text} {...rest}>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? w : (
          <span key={i + w} aria-hidden="true" className="grv-w" style={{ "--d": `${delay + n++ * step}ms` }}>{w}</span>
        )
      )}
    </Tag>
  );
}

/* Wavy lines drawn across the art, like contour lines on a map */
function Lines({ count = 16 }) {
  const paths = [];
  for (let i = 0; i < count; i++) {
    const y = (i + 0.5) * (100 / count);
    const amp = 2.4 + (i % 3);
    let d = `M -5 ${y}`;
    for (let x = 0; x <= 110; x += 10) d += ` Q ${x + 5} ${y + ((x / 10) % 2 ? amp : -amp)} ${x + 10} ${y}`;
    paths.push(<path key={i} d={d} />);
  }
  return <svg className="gart-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{paths}</svg>;
}

/**
 * GlassArt: a grainy colour field for covers, cards and empty space, in the
 * spirit of a printed poster. No image file needed.
 * tone       "dusk" | "ember" | "moss" | "sea" | "plum" | "tint" (built from your brand colour)
 * lines      draw soft contour lines over it
 * still      stop the slow drift
 * children   text or parts laid on top (centred by default)
 */
export function GlassArt({ tone = "dusk", lines = false, still = false, className = "", children, ...rest }) {
  return (
    <div className={("gart " + className).trim()} data-tone={tone} data-still={still ? "" : undefined} {...rest}>
      {lines && <Lines />}
      {children && <div className="gart-body">{children}</div>}
    </div>
  );
}
