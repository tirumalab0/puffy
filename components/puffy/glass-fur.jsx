"use client";
import { useEffect, useRef, useState } from "react";
import "./glass-fur.css";

/* Fluffy Puffy: a soft, furry Puffy drawn in real time on the GPU.
   The fur is many thin layers (shells) around the body; each layer keeps
   only the tips of the hairs that reach it, so the edge looks fuzzy and
   light passes softly through the tips. Brush over it and the hairs lean
   the way you move, press and they flatten, let go and they spring back.
   Falls back to the flat Puffy picture when WebGL isn't there. */

const VS = `
attribute vec3 p; attribute vec3 n;
uniform mat4 u_mvp; uniform mat4 u_m;
uniform float u_layer, u_len, u_press, u_hand;
uniform vec3 u_grav, u_touch, u_brush, u_eL, u_eR;
varying vec3 v_dir; varying vec3 v_n; varying float v_eye;
void main(){
  vec3 dir = normalize(p);
  float eye = min(distance(dir, u_eL), distance(dir, u_eR));
  v_eye = eye;
  float m = u_hand > 0.5 ? 1.0 : smoothstep(0.14, 0.32, eye);   // short fur round the eyes (hands have none)
  float d = distance(dir, u_touch);
  float w = exp(-d * d / 0.18);                          // how close to the finger
  float t = u_layer;
  // fur is combed down and out like plush, with soft clumps
  vec3 flow = vec3(dir.x * 0.35 + sin(dir.y * 9.0 + dir.z * 7.0) * 0.12, -0.55, dir.z * 0.25 + cos(dir.x * 8.0) * 0.1);
  vec3 bend = (u_grav + flow * 0.5 + u_brush * w) * t * t;  // tips move more than roots
  float h = u_len * t * mix(0.3, 1.0, m) * (1.0 - 0.55 * u_press * w);
  vec3 pos = p + n * h + bend * u_len * 1.6;
  v_dir = dir; v_n = normalize((u_m * vec4(n + bend * 0.8, 0.0)).xyz);
  gl_Position = u_mvp * vec4(pos, 1.0);
}`;
const FS = `
precision highp float;
uniform float u_layer, u_dens, u_blink, u_glow, u_hand, u_happy;
uniform vec3 u_col, u_tip, u_eL, u_eR, u_eyeCol;
varying vec3 v_dir; varying vec3 v_n; varying float v_eye;
float h3(vec3 q){ return fract(sin(dot(q, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main(){
  vec3 L = normalize(vec3(-0.45, 0.7, 0.85));
  // eyes: glossy dark ovals on the skin, no fur on top
  vec3 eD = distance(v_dir, u_eL) < distance(v_dir, u_eR) ? u_eL : u_eR;
  vec3 de = v_dir - eD; de.y /= max(0.08, u_blink);
  float er = length(de);
  // happy eyes: two little arcs, like a smile with the eyes
  if (u_hand < 0.5 && u_happy > 0.5 && length(v_dir - eD) < 0.13) {
    vec3 hq = v_dir - eD;
    float arc = abs(length(vec2(hq.x, hq.y + 0.045)) - 0.07);
    if (arc < 0.06 && hq.y > -0.045) {
      if (u_layer > 0.0) discard;                 // keep the fur off the smile
      if (arc < 0.026) { gl_FragColor = vec4(u_eyeCol, 1.0); return; }
    }
    er = 1.0;
  }
  if (u_hand < 0.5 && er < 0.13) {
    if (u_layer > 0.0) discard;
    float dome = sqrt(max(0.0, 1.0 - er * er / 0.0169));
    float spec = smoothstep(0.04, 0.0, length(de - vec3(-0.035, 0.045, 0.0)));
    float spec2 = smoothstep(0.018, 0.0, length(de - vec3(0.04, -0.035, 0.0))) * 0.5;
    vec3 ec = u_eyeCol * mix(0.55, 1.15, dome);
    gl_FragColor = vec4(mix(ec, vec3(1.0), clamp(spec * 0.95 + spec2, 0.0, 1.0)), 1.0); return;
  }
  // hairs: each little cell of the surface holds one hair of random length
  vec3 g = v_dir * u_dens;
  vec3 id = floor(g); vec3 f = fract(g) - 0.5;
  vec3 nn = normalize(v_dir);
  vec3 tp = f - dot(f, nn) * nn;
  vec3 jit = vec3(h3(id + 1.7), h3(id + 4.1), h3(id + 9.3)) - 0.5;
  tp -= (jit - dot(jit, nn) * nn) * 0.55;
  float r = h3(id), len = mix(0.55, 1.0, r);
  float a = 1.0;
  if (u_layer > 0.0) {
    float q = u_layer / len;
    float rad = 0.58 * pow(1.0 - q, 0.7);
    if (q > 1.0 || length(tp) > rad) discard;
    a = 1.0 - 0.75 * smoothstep(0.45, 1.0, q);           // the tips are soft and see-through
  }
  vec3 N = normalize(v_n);
  float lam = clamp(dot(N, L), 0.0, 1.0);
  float wrap = lam * 0.5 + 0.6;                           // soft light wraps round fur
  float ao = mix(0.74, 1.0, pow(u_layer, 0.6));           // roots in soft shadow, tips lit
  float rim = pow(1.0 - clamp(N.z, 0.0, 1.0), 2.0) * u_layer;
  vec3 c = mix(u_col, u_tip, u_layer * 0.8) * wrap * ao;
  c += rim * 0.45 * u_tip;
  c += pow(clamp(dot(reflect(-L, N), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 12.0) * 0.12 * u_layer;  // a soft sheen on the tips
  c *= mix(0.95, 1.05, r) * 1.08;
  c *= mix(1.0, 0.9, u_hand);                     // the hands sit a shade deeper so they read
  // a soft sheen across the top, like light on velvet
  c += pow(clamp(N.y * 0.8 + N.z * 0.35, 0.0, 1.0), 5.0) * 0.1 * u_layer;
  // glow: the outer tips light up from inside, brightest round the edge,
  // like a soft lamp behind the fur
  float edge = pow(1.0 - clamp(N.z, 0.0, 1.0), 2.4);
  vec3 lit = mix(u_col, vec3(1.0), 0.3);
  c += lit * u_glow * (edge * 0.9 + 0.03) * pow(u_layer, 1.5);
  a = min(1.0, a + u_glow * edge * 0.18 * u_layer);
  gl_FragColor = vec4(min(c, vec3(1.0)), a);
}`;

function mat() { return new Float32Array(16); }
function mul(a, b) { const o = mat(); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
function persp(fov, asp, n, f) { const t = 1 / Math.tan(fov / 2), o = mat(); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = (2 * f * n) / (n - f); return o; }
function rot(ax, ay, sx = 1, sy = 1, sz = 1) {
  const c = Math.cos(ax), sn = Math.sin(ax), cy = Math.cos(ay), syn = Math.sin(ay);
  const X = mat(); X[0] = 1; X[5] = c; X[6] = sn; X[9] = -sn; X[10] = c; X[15] = 1;
  const Y = mat(); Y[0] = cy; Y[2] = -syn; Y[5] = 1; Y[8] = syn; Y[10] = cy; Y[15] = 1;
  const S = mat(); S[0] = sx; S[5] = sy; S[10] = sz; S[15] = 1;
  return mul(X, mul(Y, S));
}
function tr(x, y, z) { const o = mat(); o[0] = o[5] = o[10] = o[15] = 1; o[12] = x; o[13] = y; o[14] = z; return o; }

function blob(seg = 64, rings = 48) {
  const P = [], N = [], I = [];
  for (let r = 0; r <= rings; r++) {
    const v = r / rings, th = v * Math.PI;
    for (let s = 0; s <= seg; s++) {
      const u = s / seg, ph = u * Math.PI * 2;
      let x = Math.sin(th) * Math.sin(ph), y = Math.cos(th), z = Math.sin(th) * Math.cos(ph);
      // a soft, slightly pear-shaped body that sits on its bottom
      const sy = y < -0.7 ? -0.7 + (y + 0.7) * 0.55 : y;
      const k = 1 + 0.05 * (1 - y) * 0.5;
      P.push(x * k, sy * 0.95, z * k * 0.95); N.push(x, y, z);
    }
  }
  for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) { const a = r * (seg + 1) + s, b = a + seg + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  return { P: new Float32Array(P), N: new Float32Array(N), I: new Uint16Array(I) };
}
const hex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec((h || "").trim()); if (!m) return null; const v = parseInt(m[1], 16); return [(v >> 16) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]; };

/* The glow behind Puffy: the fur colour, made a little richer so it still
   shows on white pages; near-white fur gets an icy blue glow */
function glowOf(h) {
  const c = hex(h) || [0.8, 0.75, 1];
  const mx = Math.max(...c), mn = Math.min(...c), l = (mx + mn) / 2, d = mx - mn;
  let hue = 0, sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) { hue = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4; hue *= 60; if (hue < 0) hue += 360; }
  if (sat < 0.12) return "hsl(205 85% 74%)";
  return `hsl(${Math.round(hue)} ${Math.round(Math.max(sat, 0.75) * 100)}% ${Math.round(Math.min(l, 0.7) * 100)}%)`;
}

/* The wave: hands pop up, one waves while the eyes smile, then they tuck away.
   Times are in seconds. */
const GREET = 2.7;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const pop = (x) => { if (x <= 0) return 0; if (x >= 1) return 1; return 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2); };
function greetPose(g) {
  // g: seconds since the greeting started
  const grow = g < 2.3 ? pop(g / 0.35) : 1 - ease((g - 2.3) / 0.35);
  const lift = g < 0.35 ? 0 : g < 0.7 ? ease((g - 0.35) / 0.35) : g < 1.9 ? 1 : 1 - ease((g - 1.9) / 0.38);
  const wave = g > 0.65 && g < 1.95 ? Math.sin((g - 0.65) * Math.PI * 2 * 2.3) * Math.min(1, (g - 0.65) / 0.15) * Math.min(1, (1.95 - g) / 0.15) : 0;
  return { grow: Math.max(0, grow), lift, wave, happy: g > 0.5 && g < 2.05, bubble: g > 0.45 && g < 2.15 };
}

export function GlassFurMascot({ color = "#cdbfff", size = 240, layers, length = 0.17, density = 72, eyes = "#1d1838", glow = 0.7, greet = 0, greetOnLoad = false, tapToGreet = true, hello = "Hi!", onGreet, fallback, label = "Puffy, soft and furry. Brush it.", sound = true, className = "" }) {
  const cv = useRef(null);
  const [saying, setSaying] = useState(false);
  const greetRef = useRef(null);
  const wrap = useRef(null);
  const glowRef = useRef(glow);
  glowRef.current = glow;
  const st = useRef({ yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, b: [0, 0, 0], bv: [0, 0, 0], touch: [0, 0, 1], press: 0, want: 0, last: null, sq: 0, sqv: 0, blink: 1, col: hex(color) || [0.72, 0.65, 1] });
  const [ok, setOk] = useState(true);
  useEffect(() => { const c = hex(color); if (c) st.current.col = c; }, [color]);
  useEffect(() => {
    const el = cv.current; if (!el) return;
    // The blend leaves colour already multiplied by alpha, so the canvas must say so; otherwise the browser
    // darkens every see-through hair tip a second time and the edge turns grey and gritty.
    const gl = el.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) { setOk(false); return; }
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    let pr;
    try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link"); }
    catch (e) { setOk(false); return; }
    gl.useProgram(pr);
    const mesh = blob();
    const buf = (data, loc, n) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); const l = gl.getAttribLocation(pr, loc); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0); };
    buf(mesh.P, "p", 3); buf(mesh.N, "n", 3);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.I, gl.STATIC_DRAW);
    const U = {}; ["u_mvp", "u_m", "u_layer", "u_len", "u_press", "u_grav", "u_touch", "u_brush", "u_eL", "u_eR", "u_dens", "u_blink", "u_col", "u_tip", "u_eyeCol", "u_glow", "u_hand", "u_happy"].forEach((k) => (U[k] = gl.getUniformLocation(pr, k)));
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const phone = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
    const N = layers || (phone ? 32 : 48);
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = Math.round(size * dpr); el.height = Math.round(size * dpr);
    const eL = [-0.32, 0.14, 0.94], eR = [0.32, 0.14, 0.94];
    const nz = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
    const ec = hex(eyes) || [0.11, 0.09, 0.22];
    let raf = 0, visible = true, t0 = performance.now(), nextBlink = 2500;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); });
    io.observe(el);
    let lastAct = 0, skip = false;
    // greeting: start time, and whether the speech bubble is showing
    let gStart = -1, bubbleOn = false;
    const startGreet = () => {
      if (gStart >= 0 && performance.now() - gStart < GREET * 1000) return;
      gStart = performance.now(); lastAct = gStart; st.current.sqv -= 0.03;
      const g = sound && typeof window !== "undefined" && window.glassSound; g && g.play("hi");
      onGreet && onGreet();
      if (calm) { setSaying(true); setTimeout(() => setSaying(false), 1600); }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    greetRef.current = startGreet;
    const loop = (now) => {
      raf = 0;
      // when nobody is touching it, draw every other frame to save battery
      if (now - lastAct > 2500 && gStart < 0) { skip = !skip; if (skip) { if (visible) raf = requestAnimationFrame(loop); return; } }
      const s = st.current, t = (now - t0) / 1000;
      // spring the brush back, so the fur sways and settles
      for (let k = 0; k < 3; k++) { s.bv[k] += -s.b[k] * 0.12; s.bv[k] *= 0.86; s.b[k] += s.bv[k]; }
      s.press += (s.want - s.press) * 0.18;
      s.sqv += (-s.sq * 0.2); s.sqv *= 0.82; s.sq += s.sqv;
      s.yaw += (s.tyaw - s.yaw) * 0.06; s.pitch += (s.tpitch - s.pitch) * 0.06;
      if (!calm && now - t0 > nextBlink) { s.blinkT = now; nextBlink = now - t0 + 2600 + Math.random() * 2600; }
      s.blink = s.blinkT && now - s.blinkT < 160 ? Math.max(0.08, Math.abs((now - s.blinkT) / 80 - 1)) : 1;
      const breathe = calm ? 0 : Math.sin(t * 1.6) * 0.012;
      const sy = 1 + breathe - s.sq * 0.6 - s.press * 0.035, sx = 1 - breathe * 0.5 + s.sq * 0.4 + s.press * 0.025;
      const M = rot(s.pitch + (calm ? 0 : Math.sin(t * 0.7) * 0.03), s.yaw + (calm ? 0 : Math.sin(t * 0.5) * 0.06), sx, sy, sx);
      const P = persp(0.62, 1, 0.1, 20), V = tr(0, -0.02, -4.1);
      const MVP = mul(P, mul(V, M));
      gl.viewport(0, 0, el.width, el.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.u_mvp, false, MVP); gl.uniformMatrix4fv(U.u_m, false, M);
      const wind = calm ? 0 : Math.sin(t * 1.3) * 0.04;
      gl.uniform3f(U.u_grav, wind, -0.32, 0.0);
      gl.uniform3fv(U.u_touch, s.touch); gl.uniform3fv(U.u_brush, s.b);
      gl.uniform3fv(U.u_eL, nz(eL)); gl.uniform3fv(U.u_eR, nz(eR));
      gl.uniform1f(U.u_len, length); gl.uniform1f(U.u_press, s.press); gl.uniform1f(U.u_dens, density); gl.uniform1f(U.u_blink, s.blink);
      const c = s.col, tip = c.map((x) => Math.min(1, x * 0.72 + 0.34));
      gl.uniform3fv(U.u_col, c); gl.uniform3fv(U.u_tip, tip); gl.uniform3fv(U.u_eyeCol, ec);
      // the glow swells gently with the breath, and brightens while pressed
      const gw = glowRef.current * (0.85 + (calm ? 0 : Math.sin(t * 1.6) * 0.15) + s.press * 0.45);
      gl.uniform1f(U.u_glow, gw);
      // the greeting: where the hands are, and how the eyes look
      let pose = null;
      if (gStart >= 0) {
        const g = (now - gStart) / 1000;
        if (g > GREET || calm) { gStart = -1; } else pose = greetPose(g);
      }
      const say = !!(pose && pose.bubble);
      if (say !== bubbleOn) { bubbleOn = say; setSaying(say); }
      gl.uniform1f(U.u_happy, pose && pose.happy ? 1 : 0);
      const hands = [];
      if (pose && pose.grow > 0.01) {
        const k = 0.17 * pose.grow;
        // left hand holds on at the front; the right one lifts and waves
        hands.push(mul(M, mul(tr(-0.44, -0.52, 0.86), rot(0, 0, k, k, k))));
        const L = pose.lift, wx = pose.wave * 0.1;
        const rx = 0.44 + (0.7 - 0.44) * L + wx, ry = -0.52 + (0.3 + 0.52) * L - Math.abs(wx) * 0.4, rz = 0.86 + (0.72 - 0.86) * L;
        hands.push(mul(M, mul(tr(rx, ry, rz), rot(0, pose.wave * 0.3, k, k, k))));
      }
      const hmvp = hands.map((H) => mul(P, mul(V, H)));
      for (let i = 0; i <= N; i++) {
        gl.uniform1f(U.u_layer, i / N);
        gl.uniform1f(U.u_hand, 0); gl.uniform1f(U.u_len, length);
        gl.uniformMatrix4fv(U.u_mvp, false, MVP); gl.uniformMatrix4fv(U.u_m, false, M);
        gl.drawElements(gl.TRIANGLES, mesh.I.length, gl.UNSIGNED_SHORT, 0);
        if (hands.length && i % 2 === 0) {
          gl.uniform1f(U.u_hand, 1); gl.uniform1f(U.u_len, length * 3.2);
          for (let h = 0; h < hands.length; h++) { gl.uniformMatrix4fv(U.u_mvp, false, hmvp[h]); gl.uniformMatrix4fv(U.u_m, false, hands[h]); gl.drawElements(gl.TRIANGLES, mesh.I.length, gl.UNSIGNED_SHORT, 0); }
        }
      }
      const moving = gStart >= 0 || Math.abs(s.b[0]) + Math.abs(s.b[1]) + Math.abs(s.bv[0]) > 0.001 || Math.abs(s.press - s.want) > 0.001 || Math.abs(s.sq) > 0.0005;
      if (visible && (!calm || moving)) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // pointer: where on the body, and how fast you're brushing
    const hit = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const k = 1 / 0.56, px = x * k, py = y * k, q = px * px + py * py;
      return { x, y, inside: q < 1.15, dir: q < 1 ? [px, py, Math.sqrt(1 - q)] : nz([px, py, 0.05]) };
    };
    // Sounds (from glass-sound.jsx, when it's loaded and on): a boop per tap,
    // a squish when held, a boing on letting go, a feather swish while you
    // press and brush (hovering stays silent),
    // and a little trill for three quick taps.
    const snd = (n, o) => { const g = sound && typeof window !== "undefined" && window.glassSound; return g ? g.play(n, o) : false; };
    const rus = (v, pan) => { const g = sound && typeof window !== "undefined" && window.glassSound; g && g.rustle(v, pan); };
    let taps = [], held = 0, squished = false;
    const move = (e) => {
      const s = st.current, h = hit(e); lastAct = performance.now();
      // only while a finger or button is actually down: hovering never makes a sound
      // (buttons is 0 when nothing is pressed, so a missed pointerup can't leave it on)
      if (!e.buttons && e.pointerType !== "touch") s.want = 0;
      if (s.want && e.buttons && h.inside && s.last) { const d = Math.hypot(h.x - s.last.x, h.y - s.last.y); if (d > 0.003) rus(Math.min(1, d * 14), h.x); }
      s.tyaw = Math.max(-0.5, Math.min(0.5, h.x * 0.45)); s.tpitch = Math.max(-0.35, Math.min(0.35, -h.y * 0.3));
      if (h.inside) {
        s.touch = h.dir;
        if (s.last) { const dx = h.x - s.last.x, dy = h.y - s.last.y; s.bv[0] += dx * (s.want ? 3.2 : 1.6); s.bv[1] += dy * (s.want ? 3.2 : 1.6); }
      }
      s.last = { x: h.x, y: h.y };
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };
    let downAt = 0, downXY = null, moved = 0;
    const down = (e) => { lastAct = performance.now(); const h = hit(e); if (!h.inside) return; const s = st.current; s.want = 1; s.touch = h.dir; s.sqv -= 0.02;
      downAt = performance.now(); downXY = [e.clientX, e.clientY]; moved = 0;
      const t = performance.now(); taps = taps.filter((x) => t - x < 650); taps.push(t);
      if (taps.length >= 3) { taps = []; snd("trill"); } else if (!snd("boop")) { try { navigator.vibrate && navigator.vibrate(8); } catch (x) {} }
      squished = false; clearTimeout(held); held = setTimeout(() => { if (st.current.want) { squished = true; snd("squish"); } }, 280);
      wrap.current && wrap.current.setAttribute("data-press", "");
      if (!raf) raf = requestAnimationFrame(loop); };
    const up = (e) => {
      // a quick tap (not a brush or a hold) says hi
      if (tapToGreet && downXY && e && e.type === "pointerup" && performance.now() - downAt < 300 && Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) < 10 && taps.length) startGreet();
      downXY = null;
      const s = st.current; clearTimeout(held); wrap.current && wrap.current.removeAttribute("data-press"); if (s.want) { s.want = 0; s.sqv += 0.035; if (squished) snd("boing"); squished = false; } if (!raf) raf = requestAnimationFrame(loop); };
    const leave = () => { st.current.tyaw = 0; st.current.tpitch = 0; st.current.last = null; };
    const cancel = () => up();
    window.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); el.addEventListener("pointerleave", leave);
    window.addEventListener("pointercancel", cancel); window.addEventListener("blur", cancel);
    let firstHi = 0;
    if (greetOnLoad) firstHi = setTimeout(startGreet, 700);
    return () => { clearTimeout(firstHi); greetRef.current = null; window.removeEventListener("pointercancel", cancel); window.removeEventListener("blur", cancel); clearTimeout(held); cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("pointermove", move); el.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); el.removeEventListener("pointerleave", leave); };
  }, [size, layers, length, density, eyes, sound]);
  // greet={n}: change the number to make Puffy wave again
  const lastGreet = useRef(greet);
  useEffect(() => { if (greet !== lastGreet.current) { lastGreet.current = greet; greetRef.current && greetRef.current(); } }, [greet]);
  return (
    <span ref={wrap} className={"gfur " + className} style={{ width: size, height: size, "--gfur-glow": glowOf(color), "--gfur-g": glow }} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      {glow > 0 && <span className="gfur-aura" aria-hidden="true" />}
      {hello && <span className="gfur-hi" data-on={saying ? "" : undefined} aria-live="polite">{saying ? hello : ""}</span>}
      {ok ? <canvas ref={cv} /> : fallback || null}
    </span>
  );
}
