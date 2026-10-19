"use client";
import { useEffect, useRef } from "react";
import "./glass-grain.css";

/* GlassGrainient: a moving, grainy colour field drawn on the graphics card.
   Streaks of light, soft folds, a glowing horizon or a single ribbon, with
   film grain on top. It pauses when it is off screen and stands still for
   people who ask for less motion. Without WebGL it falls back to a still
   CSS gradient that looks close. */

const PRESETS = {
  meadow:  { mode: 0, angle: -0.72, colours: ["#0e3a2a", "#3f7a3a", "#9cc46a", "#8fb8cf"], grain: 0.09, dark: false },
  dune:    { mode: 1, angle: 0.35, colours: ["#6b2f12", "#b9612a", "#e3a35f", "#f2d3a3"], grain: 0.13, dark: false },
  ember:   { mode: 4, angle: 0.0, colours: ["#0a0504", "#3a160a", "#b4521f", "#f08a4b"], grain: 0.12, dark: true },
  horizon: { mode: 2, angle: 0.0, colours: ["#050409", "#2a1460", "#7b4dff", "#d9c9ff"], grain: 0.08, dark: true },
  silk:    { mode: 1, angle: -0.6, colours: ["#7a1606", "#e2481c", "#ff8a3d", "#ffd0a0"], grain: 0.06, dark: false },
  ribbon:  { mode: 3, angle: 0.0, colours: ["#04050a", "#ff4f5e", "#53e0ff", "#ffffff"], grain: 0.07, dark: true },
  streaks: { mode: 0, angle: 0.18, colours: ["#05070f", "#1d3b8f", "#ff9a4a", "#cfe3ff"], grain: 0.08, dark: true },
  mist:    { mode: 1, angle: 0.9, colours: ["#c9cfd8", "#e6e2ef", "#f6efe6", "#ffffff"], grain: 0.05, dark: false },
};
export const GRAINIENTS = Object.keys(PRESETS);

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `precision highp float;
uniform vec2 res; uniform float t; uniform int mode; uniform float ang; uniform float grain;
uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), u.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
vec3 pal(float x){ x = clamp(x, 0.0, 1.0);
  if (x < 0.3333) return mix(c0, c1, smoothstep(0.0, 1.0, x * 3.0));
  if (x < 0.6666) return mix(c1, c2, smoothstep(0.0, 1.0, x * 3.0 - 1.0));
  return mix(c2, c3, smoothstep(0.0, 1.0, x * 3.0 - 2.0)); }
void main(){
  vec2 uv = gl_FragCoord.xy / res; float asp = res.x / res.y; vec2 q = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
  float s = sin(ang), c = cos(ang); vec2 r = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  vec3 col;
  if (mode == 0) {            // streaks: noise stretched along one direction, like a long exposure
    vec2 p = vec2(r.x * 0.22, r.y * 3.2);
    float v = fbm(p * 1.3 + vec2(t * 0.05, 0.0)) * 0.7 + fbm(p * 0.45 - vec2(t * 0.025, 0.0)) * 0.55 + fbm(q * 0.8 + t * 0.01) * 0.25;
    col = pal(v * 0.95 - 0.2 + (1.0 - uv.y) * 0.05 + uv.y * 0.32);
  } else if (mode == 1) {     // folds: soft diagonal bands bent by noise, shaded like cloth
    float w = fbm(q * 1.1 + vec2(t * 0.03, -t * 0.02)) * 1.5 + fbm(q * 0.5 - t * 0.015) * 0.8;
    float b = r.x * 4.2 + r.y * 0.6 + w;
    float v = 0.5 + 0.5 * sin(b * 1.7);
    float shade = 0.5 + 0.5 * cos(b * 1.7 + 0.8);
    float tone = mix(v, 1.0 - uv.y * 0.6 + uv.x * 0.3, 0.45);
    col = pal(tone) * (0.78 + 0.32 * shade);
  } else if (mode == 2) {     // horizon: a glowing rim of a planet rising from below
    vec2 o = vec2(0.0, -1.25); float d = length(q - o) - 1.12;
    float rim = exp(-abs(d) * 18.0), halo = exp(-max(d, 0.0) * 3.2) * 0.55, flick = fbm(q * 3.0 + t * 0.08);
    col = c0 + c1 * halo * (0.6 + flick) + c2 * rim * 1.4 + c3 * pow(rim, 6.0) * 0.8;
    col *= 1.0 - smoothstep(0.0, 0.35, -d) * 0.85;
  } else if (mode == 3) {     // ribbon: one silky wave of light with a red and cyan edge
    float x = q.x;
    float y = 0.08 * sin(x * 2.6 + t * 0.5) + 0.06 * sin(x * 5.3 - t * 0.35) + (fbm(vec2(x * 1.4, t * 0.1)) - 0.5) * 0.25;
    float d = q.y - y;
    float body = exp(-abs(d) * 9.0) * 0.55;
    float red = exp(-abs(d - 0.035) * 60.0), cyan = exp(-abs(d + 0.03) * 55.0);
    col = c0 + body * mix(c1, c2, 0.5) * 0.6 + red * c1 * 0.9 + cyan * c2 * 0.8 + pow(max(red, cyan), 8.0) * c3 * 0.5;
  } else {                    // glow: light pooling in from one side
    float v = fbm(q * 1.4 + vec2(t * 0.04, t * 0.02));
    float g = smoothstep(-0.2, 1.2, uv.x * 0.9 + uv.y * 0.35 + (v - 0.5) * 0.7);
    col = pal(g);
  }
  float gr = h(gl_FragCoord.xy + fract(t * 7.0) * 113.0) - 0.5;
  col += gr * grain;
  gl_FragColor = vec4(col, 1.0);
}`;

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/**
 * GlassGrainient
 * preset     "meadow" | "dune" | "ember" | "horizon" | "silk" | "ribbon" | "streaks" | "mist"
 * colours    four hex colours, dark to light, to make your own
 * speed      1 is gentle; 0 holds still
 * grain      0 to 0.2, how much film grain
 * className, style, children (laid on top)
 */
export function GlassGrainient({ preset = "meadow", colours, speed = 1, grain, className = "", style, children, ...rest }) {
  const ref = useRef(null);
  const P = PRESETS[preset] || PRESETS.meadow;
  const cols = colours && colours.length === 4 ? colours : P.colours;
  const key = cols.join(",") + P.mode + (grain ?? P.grain);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let gl;
    try { gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false }); } catch (err) { gl = null; }
    if (!gl) { cv.dataset.off = ""; return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.dataset.off = ""; return; }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(pr, n);
    gl.uniform1i(U("mode"), P.mode); gl.uniform1f(U("ang"), P.angle); gl.uniform1f(U("grain"), grain ?? P.grain);
    ["c0", "c1", "c2", "c3"].forEach((n, i) => gl.uniform3fv(U(n), rgb(cols[i])));
    const uRes = U("res"), uT = U("t");
    const still = speed === 0 || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    let raf = 0, visible = true, last = 0, t0 = performance.now() - Math.random() * 20000;
    const size = () => {
      const k = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(cv.clientWidth * k)), h = Math.max(1, Math.round(cv.clientHeight * k));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uRes, w, h);
    };
    const draw = (now) => {
      size();
      gl.uniform1f(uT, ((now - t0) / 1000) * (still ? 0 : speed));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now) => {
      raf = 0;
      if (!visible) return;
      if (now - last > 33) { draw(now); last = now; }
      if (!still) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: "100px" });
    io.observe(cv);
    const ro = new ResizeObserver(() => { if (still) draw(performance.now()); });
    ro.observe(cv);
    draw(performance.now());
    delete cv.dataset.off;
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); const ext = gl.getExtension("WEBGL_lose_context"); ext && ext.loseContext(); };
  }, [key, speed]);
  return (
    <div className={("ggr " + className).trim()} data-preset={preset} data-dark={P.dark ? "" : undefined} style={{ ...style, "--ggr-0": cols[0], "--ggr-1": cols[1], "--ggr-2": cols[2], "--ggr-3": cols[3] }} {...rest}>
      <canvas key={key + "|" + speed} ref={ref} className="ggr-canvas" aria-hidden="true" data-off="" />
      {children && <div className="ggr-body">{children}</div>}
    </div>
  );
}
export const grainientIsDark = (preset) => !!(PRESETS[preset] && PRESETS[preset].dark);
