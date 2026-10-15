"use client";
import { useEffect, useState } from "react";

/* Glass sound: small, soft UI sounds made on the fly with Web Audio.
   There are no audio files. Everything is off until you turn it on:

     import { glassSound, GlassSounds } from "./glass-sound.jsx";
     <GlassSounds />                      // once, near the root: on, with typing
     glassSound.set({ on: false })        // a mute switch
     glassSound.set({ volume: 0.4 })      // 0 to 1
     glassSound.play("success")           // play one yourself
     glassSound.play("chime", { force: true }) // the reply chime normally
                                          // waits for a send first

   Every Puffy part looks for window.glassSound, so the parts stay silent
   when this file isn't there. Sound stays off when the person has asked
   for reduced motion, and nothing plays until their first tap or key. */

const S = { on: false, volume: 0.7, typing: true, ctx: null, out: null, noise: null, last: {}, lastAny: 0, subs: new Set(), rustle: null, touched: 0 };
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const calm = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const rnd = (a, b) => a + Math.random() * (b - a);

function wake() {
  if (!S.on || typeof window === "undefined") return;
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    if (!S.ctx) {
      S.ctx = new A();
      S.out = S.ctx.createGain(); S.out.gain.value = S.volume;
      // a gentle limiter so stacked sounds never clip
      const lim = S.ctx.createDynamicsCompressor(); lim.threshold.value = -10; lim.ratio.value = 8; lim.attack.value = 0.002; lim.release.value = 0.1;
      S.out.connect(lim).connect(S.ctx.destination);
      const len = S.ctx.sampleRate, b = S.ctx.createBuffer(1, len, S.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      S.noise = b;
      // a silent blip unlocks audio on iPhone
      const s = S.ctx.createBufferSource(); s.buffer = S.ctx.createBuffer(1, 1, 22050); s.connect(S.ctx.destination); s.start(0);
    }
    if (S.ctx.state !== "running") S.ctx.resume();
  } catch (e) {}
}
// Is this inside a tap or key press? Browsers only start audio then.
const active = () => { try { const u = navigator.userActivation; return !u || u.isActive; } catch (e) { return true; } };
function ready() {
  if (!S.on || calm() || !S.ctx) return null;
  if (S.ctx.state === "running") return S.ctx;
  if (S.ctx.state === "closed" || !active()) return null;
  try { S.ctx.resume(); } catch (e) {}
  return S.ctx;
}

/* Building blocks. LIFT sets how loud the whole set sits before volume. */
const LIFT = 2.6;
function tone(c, { f, to, dur = 0.08, gain = 0.06, type = "sine", at = 0, attack = 0.004, lp }) {
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * LIFT, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o.connect(g);
  if (lp) { const f2 = c.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = lp; n = n.connect(f2); }
  n.connect(S.out); o.start(t); o.stop(t + dur + 0.02);
  return o;
}
function hiss(c, { dur = 0.1, gain = 0.04, type = "bandpass", f = 2000, to, q = 1, at = 0, attack = 0.005 }) {
  const t = c.currentTime + at, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = S.noise; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain * LIFT, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(S.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

/* The sound set. Each one is short and quiet; typing is the quietest. */
const SOUNDS = {
  tick: [(c) => { tone(c, { f: 1250, to: 950, dur: 0.035, gain: 0.05, type: "triangle" }); }, 4, 30],
  toggleOn: [(c) => { tone(c, { f: 520, to: 560, dur: 0.06, gain: 0.06 }); tone(c, { f: 780, to: 820, dur: 0.08, gain: 0.06, at: 0.045 }); }, 8, 40],
  toggleOff: [(c) => { tone(c, { f: 700, to: 660, dur: 0.06, gain: 0.05 }); tone(c, { f: 470, to: 430, dur: 0.08, gain: 0.05, at: 0.045 }); }, 6, 40],
  type: [(c, o) => {
    // a tiny bubble: the pitch rises as it pops
    const soft = o && o.soft, f = soft ? rnd(520, 640) : rnd(820, 1250);
    tone(c, { f, to: f * 1.55, dur: soft ? 0.05 : 0.035, gain: soft ? 0.018 : 0.022, attack: 0.002 });
  }, 0, 32],
  pop: [(c) => { tone(c, { f: 320, to: 880, dur: 0.075, gain: 0.07 }); }, 6, 50],
  popClose: [(c) => { tone(c, { f: 760, to: 300, dur: 0.07, gain: 0.05 }); }, 4, 50],
  send: [(c) => { hiss(c, { dur: 0.24, gain: 0.05, f: 600, to: 3600, q: 0.9, attack: 0.08 }); tone(c, { f: 480, to: 960, dur: 0.14, gain: 0.04, at: 0.04 }); }, 10, 120],
  chime: [(c) => { tone(c, { f: 1046.5, dur: 0.42, gain: 0.04, attack: 0.006 }); tone(c, { f: 1568, dur: 0.5, gain: 0.035, at: 0.09, attack: 0.006 }); }, 0, 1500],
  success: [(c) => { [660, 880, 1320].forEach((f, i) => tone(c, { f, dur: 0.16 + i * 0.05, gain: 0.05, at: i * 0.06 })); }, [8, 40, 12], 200],
  error: [(c) => { tone(c, { f: 240, to: 200, dur: 0.11, gain: 0.07, type: "triangle", lp: 1400 }); tone(c, { f: 220, to: 170, dur: 0.14, gain: 0.07, type: "triangle", at: 0.13, lp: 1400 }); }, [20, 50, 20], 200],
  warn: [(c) => { tone(c, { f: 420, to: 360, dur: 0.1, gain: 0.05, type: "triangle", lp: 2000 }); }, 14, 80],
  delete: [(c) => { hiss(c, { dur: 0.16, gain: 0.04, f: 3000, to: 700, q: 0.8 }); tone(c, { f: 520, to: 200, dur: 0.14, gain: 0.05, at: 0.02 }); }, 14, 100],
  ding: [(c) => { tone(c, { f: 1760, dur: 0.6, gain: 0.04, attack: 0.003 }); tone(c, { f: 2637, dur: 0.35, gain: 0.015, attack: 0.003 }); }, 8, 250],
  pick: [(c) => { tone(c, { f: 380, to: 720, dur: 0.06, gain: 0.05 }); }, 6, 40],
  drop: [(c) => { tone(c, { f: 520, to: 240, dur: 0.09, gain: 0.06 }); tone(c, { f: 110, to: 70, dur: 0.1, gain: 0.08, lp: 400 }); }, 12, 60],
  /* Puffy */
  boop: [(c) => {
    // soft and round, a new pitch each tap
    const f = rnd(300, 420);
    tone(c, { f, to: f * 0.78, dur: 0.16, gain: 0.11, attack: 0.008, lp: 1800 });
    tone(c, { f: f * 2, to: f * 1.5, dur: 0.07, gain: 0.02, attack: 0.004 });
  }, 8, 60],
  squish: [(c) => { hiss(c, { dur: 0.26, gain: 0.05, type: "lowpass", f: 700, to: 180, q: 3, attack: 0.03 }); tone(c, { f: 170, to: 110, dur: 0.24, gain: 0.07, attack: 0.03, lp: 600 }); }, 12, 80],
  boing: [(c) => {
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), w = c.createOscillator(), wg = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(470, t + 0.05); o.frequency.exponentialRampToValueAtTime(330, t + 0.38);
    w.frequency.value = 17; wg.gain.setValueAtTime(42, t); wg.gain.exponentialRampToValueAtTime(1, t + 0.38); w.connect(wg).connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * LIFT, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    o.connect(g).connect(S.out); o.start(t); w.start(t); o.stop(t + 0.45); w.stop(t + 0.45);
  }, [6, 30, 6], 120],
  hi: [(c) => { tone(c, { f: 520, to: 700, dur: 0.12, gain: 0.07, attack: 0.01 }); tone(c, { f: 760, to: 980, dur: 0.2, gain: 0.07, at: 0.11, attack: 0.01 }); }, [6, 40, 6], 600],
  trill: [(c) => { [784, 988, 1175, 1568].forEach((f, i) => tone(c, { f, to: f * 1.04, dur: 0.09, gain: 0.045, at: i * 0.055 })); }, 0, 300],
};

function play(name, opts) {
  const s = SOUNDS[name]; if (!s) return false;
  const t = now(); if (t - (S.last[name] || 0) < s[2]) return false;
  if (!S.on || calm()) return false;
  // A reply chime only answers something that was just sent
  if (name === "chime" && !(opts && opts.force) && t - (S.last.send || -1e9) > 60000) return false;
  // Sounds that follow something the person did (a reply arriving, a task
  // finishing) are fine for a little while; demos that play by themselves
  // long after the last tap stay quiet.
  if (active()) S.touched = t;
  else if (t - S.touched > 12000 || (typeof document !== "undefined" && document.hidden)) return false;
  if (!S.ctx && active()) wake();
  const c = ready();
  S.last[name] = t; S.lastAny = t;
  if (c) { try { s[0](c, opts); } catch (e) {} }
  if (glassSound.onPlay) { try { glassSound.onPlay(name, opts); } catch (e) {} }
  if (s[1] && !(opts && opts.quiet)) buzz(s[1]);
  return true;
}

/* Brushing Puffy: a soft feather swish, airy and smooth, with a few faint
   glints as you stroke faster. Only plays while pressing or touching,
   never on hover. Call it on every move with a speed from 0 to 1 and an
   optional pan from -1 (left) to 1 (right); it fades out on its own. */
const FEATHER = 0.26;
const GLINTS = [1568, 1760, 2093, 2349, 2637, 3136];
function featherNoise(c) {
  // pink noise in two slightly different channels: smoother than white
  // noise, and wide like air rather than a scrape
  const len = c.sampleRate * 2, b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
    // fade the loop point so it never clicks
    const f = 2000; for (let i = 0; i < f; i++) { const k = i / f; d[i] *= k; d[len - 1 - i] *= k; }
  }
  return b;
}
function rustle(v, pan = 0) {
  if (!S.on || calm()) return;
  const c = ready(); if (!c) return;
  try {
    if (!S.rustle) {
      const s = c.createBufferSource(), bp = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain();
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      s.buffer = featherNoise(c); s.loop = true;
      bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 0.6;
      lp.type = "lowpass"; lp.frequency.value = 2600; lp.Q.value = 0.3;
      g.gain.value = 0;
      let n = s.connect(bp).connect(lp).connect(g); if (p) n = n.connect(p); n.connect(S.out); s.start();
      S.rustle = { s, g, bp, lp, p, lvl: 0, glint: 0, stop: 0 };
    }
    const R = S.rustle, t = c.currentTime, k = Math.max(0, Math.min(1, v));
    // smooth the speed so quick pointer events don't flutter the sound
    R.lvl += (k - R.lvl) * 0.35;
    const L = Math.pow(R.lvl, 1.2);
    R.g.gain.cancelScheduledValues(t);
    R.g.gain.setTargetAtTime(L * FEATHER * LIFT, t, 0.06);
    R.bp.frequency.setTargetAtTime(700 + L * 1100, t, 0.12);
    R.lp.frequency.setTargetAtTime(2000 + L * 1800, t, 0.12);
    if (R.p) R.p.pan.setTargetAtTime(Math.max(-0.6, Math.min(0.6, pan * 0.6)), t, 0.1);
    clearTimeout(R.stop);
    R.stop = setTimeout(() => { try { R.lvl = 0; R.g.gain.setTargetAtTime(0, c.currentTime, 0.18); } catch (e) {} }, 90);
    // faint glints, like light catching the feathers
    const now2 = now();
    if (L > 0.3 && now2 - R.glint > 160 + Math.random() * 220) {
      R.glint = now2;
      const f = GLINTS[(Math.random() * GLINTS.length) | 0];
      const o = c.createOscillator(), og = c.createGain(), op = c.createStereoPanner ? c.createStereoPanner() : null;
      o.type = "sine"; o.frequency.value = f;
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.006 * LIFT * (0.6 + L * 0.6), t + 0.012); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      let n = o.connect(og); if (op) { op.pan.value = Math.max(-0.8, Math.min(0.8, pan + (Math.random() - 0.5) * 0.6)); n = n.connect(op); } n.connect(S.out);
      o.start(t); o.stop(t + 0.6);
    }
  } catch (e) {}
}

function emit() { S.subs.forEach((f) => f(get())); }
function get() { return { on: S.on, volume: S.volume, typing: S.typing }; }
function set(p) {
  if ("on" in p) S.on = !!p.on;
  if ("volume" in p) S.volume = Math.max(0, Math.min(1, +p.volume || 0));
  if ("typing" in p) S.typing = !!p.typing;
  if (S.out) S.out.gain.setTargetAtTime(S.volume, S.ctx.currentTime, 0.02);
  if (!S.on && S.rustle) S.rustle.g.gain.value = 0;
  emit();
}
function subscribe(f) { S.subs.add(f); return () => S.subs.delete(f); }

/* Parts that already play a sound call this; the page-wide listener
   below then stays quiet for that tap so nothing doubles up. */
const recent = (ms = 70) => now() - S.lastAny < ms;

/* ---------- Page-wide listener: sounds for plain HTML controls ----------
   Tabs, segmented buttons, options and radios tick. Switches and
   checkboxes go up when on and down when off. Anything with
   aria-expanded pops open and closed. Buttons named "Remove…" or
   "Delete…" make the delete sound. Add data-sound="name" to any
   element to pick a sound, or data-sound="off" to keep a part quiet. */
const PICK = '[role="tab"],[role="radio"],[role="option"],[role="menuitem"],[role="menuitemradio"],input[type="radio"],[aria-pressed]';
const FLIP = '[role="switch"],[role="checkbox"],[role="menuitemcheckbox"],input[type="checkbox"]';
const stateOf = (el) => {
  if (!el) return null;
  if (el.matches("input")) return String(el.checked);
  return el.getAttribute("aria-checked") || el.getAttribute("aria-selected") || el.getAttribute("aria-pressed") || el.getAttribute("aria-current");
};
let listeners = 0, off = null;
function listen() {
  listeners++;
  if (off) return () => unlisten();
  const pre = new WeakMap();
  const down = () => { S.touched = now(); wake(); };
  const capture = (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const el = t.closest(`${FLIP},${PICK},[aria-expanded],[data-sound],button,a`);
    if (el) pre.set(el, { s: stateOf(el), x: el.getAttribute("aria-expanded"), at: S.lastAny });
  };
  const click = (e) => {
    if (!S.on) return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest('[data-sound="off"]')) return;
    const el = t.closest(`[data-sound],${FLIP},${PICK},[aria-expanded],button`); if (!el) return;
    const before = pre.get(el) || {};
    setTimeout(() => {
      if (S.lastAny !== before.at && recent(120)) return; // the part played its own
      const named = el.getAttribute("data-sound");
      if (named) { play(named); return; }
      if (el.matches(FLIP)) {
        // a real checkbox has already flipped by the time its click arrives
        const s = stateOf(el); if (s === before.s && !el.matches("input")) return;
        play(s === "true" || s === "mixed" ? "toggleOn" : "toggleOff"); return;
      }
      const x = el.getAttribute("aria-expanded");
      if (x != null && x !== before.x) { play(x === "true" ? "pop" : "popClose"); return; }
      if (el.matches(PICK)) {
        const s = stateOf(el);
        if (el.hasAttribute("aria-pressed")) {
          // one toggle on its own, or one of a row?
          const row = el.parentElement && el.parentElement.querySelectorAll(":scope > [aria-pressed]").length > 1;
          if (!row) { if (s !== before.s) play(s === "true" ? "toggleOn" : "toggleOff"); return; }
          if (s === before.s && s === "true") return;
        } else if (before.s === "true" && s === "true" && !el.matches('[role="menuitem"]')) return;
        play("tick"); return;
      }
      const name = (el.getAttribute("aria-label") || el.textContent || "").trim();
      if (/^(remove|delete|discard)\b/i.test(name) && el.matches("button")) play("delete");
    }, 0);
  };
  const key = (e) => {
    if (!S.on || !S.typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target; if (!t || !t.matches) return;
    if (t.closest('[data-sound="off"]')) return;
    const field = t.matches("textarea,[contenteditable=''],[contenteditable='true'],input:not([type]),input[type='text'],input[type='search'],input[type='email'],input[type='url'],input[type='tel'],input[type='password'],input[type='number']");
    if (!field || t.readOnly || t.disabled) return;
    wake();
    const k = e.key;
    if (k === " " || k === "Backspace" || k === "Delete") play("type", { soft: true });
    else if (k && k.length === 1) play("type");
  };
  document.addEventListener("pointerdown", down, true);
  document.addEventListener("keydown", down, true);
  document.addEventListener("click", capture, true);
  document.addEventListener("click", click);
  document.addEventListener("keydown", key);
  off = () => {
    document.removeEventListener("pointerdown", down, true);
    document.removeEventListener("keydown", down, true);
    document.removeEventListener("click", capture, true);
    document.removeEventListener("click", click);
    document.removeEventListener("keydown", key);
    off = null;
  };
  return () => unlisten();
}
function unlisten() { listeners = Math.max(0, listeners - 1); if (!listeners && off) off(); }

export const glassSound = {
  play, rustle, set, get, subscribe, wake, listen, recent,
  /* for parts that draw their own sound (the knob, the slider) */
  context: () => { if (!S.ctx && active()) wake(); return ready(); },
  output: () => S.out,
  names: Object.keys(SOUNDS),
  onPlay: null, // set a function to see each sound as it plays
};
if (typeof window !== "undefined") window.glassSound = glassSound;

/* Turn sound on for everything inside your app. Render it once. */
export function GlassSounds({ on = true, volume, typing = true }) {
  useEffect(() => { set({ on, typing, ...(volume != null ? { volume } : {}) }); }, [on, volume, typing]);
  useEffect(() => listen(), []);
  return null;
}

/* Read and change the sound settings from a component */
export function useGlassSound() {
  const [s, setS] = useState(get);
  useEffect(() => { const off = subscribe(setS); setS(get()); return off; }, []);
  return [s, set];
}
