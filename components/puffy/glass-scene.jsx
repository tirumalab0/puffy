"use client";
/*
 * Liquid glass, drawn for real.
 *
 * CSS can blur what is behind an element but cannot bend it. This file draws
 * the background picture and every glass shape on the graphics card (WebGL),
 * so glass refracts like thick glass: the picture bends and magnifies along
 * the rim, the colours split a little at the very edge, the rim catches a
 * light that follows the pointer, and pressing pushes a small lens into it.
 *
 * Use it two ways:
 *
 *   1. As a scene, the same shape as other liquid glass kits:
 *      <GlassScene material="clear" appearance="dark" style={{ height: 400 }}>
 *        <GlassContent><img src="/landscape.jpg" alt="" /></GlassContent>
 *        <div className="your-layout">
 *          <GlassSurface interactive radius={28}>Your content</GlassSurface>
 *        </div>
 *      </GlassScene>
 *
 *   2. As a backdrop inside any box: <GlassBackdrop src="/landscape.jpg" />.
 *      Every Puffy component inside that box with effect="glass" or
 *      effect="bubble" turns into real glass on its own.
 *
 * The glass sees only the picture you give the scene, not the rest of the
 * page. Where WebGL is missing, the picture is shown as a normal image and
 * components keep their CSS glass.
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import "./glass-scene.css";

const MAX = 24;
const AUTO =
  '[data-glass-surface], .gb:not([data-variant="ghost"])[data-effect="glass"], .gb:not([data-variant="ghost"])[data-effect="bubble"], ' +
  '.gf[data-effect="glass"], .gf[data-effect="bubble"], .gp[data-effect="glass"], .gp[data-effect="bubble"], ' +
  '.gc[data-effect="glass"], .gc[data-effect="bubble"]';

const VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
const FRAG = `
precision highp float;
#define MAX ${MAX}
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uScale;
uniform vec2 uPan;
uniform float uTexel;
uniform float uDpr;
uniform int uCount;
uniform vec4 uRect[MAX];
uniform vec4 uShape[MAX];
uniform vec4 uPress[MAX];
uniform vec2 uLight;
uniform float uDark;

vec2 toUV(vec2 px) { return (px / uRes - 0.5) * uScale + 0.5 + uPan; }
vec3 bg(vec2 px, float blur) {
  return texture2D(uTex, toUV(px), log2(max(blur * uTexel, 1.0))).rgb;
}
float box(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 col = bg(p, 0.0);
  int hit = -1;
  vec4 R = vec4(0.0);
  vec4 S = vec4(0.0);
  vec4 P = vec4(0.0);
  for (int i = 0; i < MAX; i++) {
    if (i >= uCount) break;
    vec4 r = uRect[i];
    vec4 s = uShape[i];
    if (box(p - r.xy, r.zw, s.x) < 1.0) { hit = i; R = r; S = s; P = uPress[i]; }
  }
  if (hit >= 0) {
    vec2 q = p - R.xy;
    float sd = box(q, R.zw, S.x);
    vec2 e = vec2(1.0, 0.0);
    vec2 n = normalize(vec2(box(q + e.xy, R.zw, S.x) - box(q - e.xy, R.zw, S.x),
                            box(q + e.yx, R.zw, S.x) - box(q - e.yx, R.zw, S.x)) + 1e-5);
    float d = -sd;
    float bev = S.y;
    float t = clamp(d / bev, 0.0, 1.0);
    float bend = pow(1.0 - t, 2.6);
    // Thick-glass rim: look inward near the edge, so the picture bends and magnifies
    vec2 disp = -n * bend * bev * 0.9;
    // The body magnifies a touch, like a thick clear lens
    vec2 sp = R.xy + q * 0.955 + disp;
    // The press lens: a soft bulge that magnifies under the finger
    float lens = 0.0, lensIn = 0.0;
    if (P.z > 0.001) {
      vec2 dq = p - P.xy;
      float pd = length(dq) / P.w;
      if (pd < 1.0) {
        float m = P.z * (1.0 - pd * pd);
        sp = P.xy + (sp - P.xy) * (1.0 - 0.5 * m);
      }
      lens = P.z * smoothstep(0.1, 0.0, abs(pd - 0.9));
      lensIn = P.z * (1.0 - smoothstep(0.85, 1.0, pd));
    }
    float blur = S.z + bend * 0.6 * uDpr;
    vec2 ca = disp * 0.18;
    vec3 g = vec3(bg(sp + ca, blur).r, bg(sp, blur).g, bg(sp - ca, blur).b);
    // Material: clear glass barely changes the picture; regular frosts it
    if (S.w > 1.5) g = mix(g, mix(vec3(0.97), vec3(0.11, 0.12, 0.16), uDark), 0.38);
    // Glass lifts the picture slightly, more near the rim where it is thickest
    g = g * 1.06 + 0.035 + bend * 0.06;
    // Light: a bright hairline rim, strongest on the side facing the light
    vec2 L = normalize(uLight - R.xy + 1e-3);
    float facing = max(dot(n, L), 0.0);
    float away = max(dot(n, -L), 0.0);
    // Light catches the rim on two opposite corners and fades elsewhere: no flat stroke
    float rim = smoothstep(1.2 * uDpr, 0.0, d);
    float glow = 1.0 - smoothstep(0.0, bev * 0.7, d);
    float diag = pow(abs(dot(n, normalize(vec2(-1.0, -1.25)))), 3.0);
    g += rim * (0.06 + 0.55 * max(facing, diag * 0.8) + 0.12 * away);
    g += glow * (0.07 * facing + 0.05 * diag);
    // Thickness: a faint shade just inside the rim, then light gathered at the
    // top (where it enters) and the bottom (where it is focused)
    float inner = smoothstep(0.0, bev * 0.35, d) * (1.0 - smoothstep(bev * 0.35, bev, d));
    g *= 1.0 - inner * 0.07;
    float yy = q.y / max(R.w, 1.0);
    float topLight = smoothstep(-0.15, -1.0, yy) * smoothstep(0.0, bev * 0.25, d);
    float botLight = smoothstep(0.55, 1.0, yy) * smoothstep(0.0, bev * 0.3, d) * (1.0 - smoothstep(bev * 0.3, bev * 1.2, d));
    g += topLight * 0.11 + botLight * 0.16;
    // Bubble: a gloss across the top
    if (S.w > 0.5 && S.w < 1.5) {
      // A glossy band over the top half, set in from the rim, with a crisp lower edge
      float gy = q.y / max(R.w, 1.0);
      float gloss = (1.0 - smoothstep(-0.08, 0.04, gy)) * smoothstep(-1.0, -0.55, gy);
      gloss *= smoothstep(bev * 0.35, bev * 0.9, d);
      g = mix(g, vec3(1.0), gloss * 0.32);
      // and a small hot spot near the top left
      vec2 hs = (q - vec2(-R.z * 0.55, -R.w * 0.55)) / vec2(max(R.w, 1.0) * 0.9, max(R.w, 1.0) * 0.35);
      g += exp(-dot(hs, hs) * 2.0) * 0.35;
    }
    g += lens * 0.45 + lensIn * 0.06;
    float a = smoothstep(0.75, -0.75, sd);
    col = mix(col, g, a);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}

/* Runs the glass on `root`: draws `media` (an <img> or <video>) and every
   surface found inside root. Returns a stop function. */
function startGlass(root, canvas, media, opts) {
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) return null;
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  } catch (err) {
    return null;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ["uTex", "uRes", "uScale", "uPan", "uTexel", "uDpr", "uCount", "uRect", "uShape", "uPress", "uLight", "uDark"].forEach((k) => (U[k] = gl.getUniformLocation(prog, k)));

  // The picture goes into a power-of-two texture so it can be blurred cheaply with mipmaps
  const TW = 2048, TH = 1024;
  const pot = document.createElement("canvas");
  pot.width = TW;
  pot.height = TH;
  const pctx = pot.getContext("2d");
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  let mw = 0, mh = 0, ready = false;
  const upload = () => {
    mw = media.videoWidth || media.naturalWidth;
    mh = media.videoHeight || media.naturalHeight;
    if (!mw || !mh) return;
    pctx.drawImage(media, 0, 0, TW, TH);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pot);
    gl.generateMipmap(gl.TEXTURE_2D);
    ready = true;
  };
  const isVideo = media.tagName === "VIDEO";
  if (isVideo ? media.readyState >= 2 : media.complete) upload();
  media.addEventListener(isVideo ? "loadeddata" : "load", upload);

  // Surfaces: found by selector, refreshed when the content changes
  let els = [];
  const find = () => {
    els = Array.from(root.querySelectorAll(opts.selector || AUTO));
  };
  find();
  const mo = new MutationObserver(find);
  mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-effect", "data-glass-surface", "class"] });

  // Pointer: the light follows it, and a press grows a lens on the surface under it
  const press = new Map();
  let light = null;
  const local = (e) => {
    const r = root.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const onMove = (e) => { light = local(e); };
  const onLeave = () => { light = null; };
  const onDown = (e) => {
    const el = e.target.closest && e.target.closest(opts.selector || AUTO);
    if (!el || !root.contains(el)) return;
    if (el.hasAttribute("data-glass-surface") && !el.hasAttribute("data-glass-interactive")) return;
    const b = el.getBoundingClientRect();
    const [x, y] = local(e);
    press.set(el, { x, y, a: press.get(el)?.a || 0, to: 1, ox: x - (b.left - root.getBoundingClientRect().left), oy: y - (b.top - root.getBoundingClientRect().top) });
  };
  const onUp = () => press.forEach((p) => (p.to = 0));
  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rects = new Float32Array(MAX * 4), shapes = new Float32Array(MAX * 4), presses = new Float32Array(MAX * 4);
  let raf = 0, visible = true, t0 = performance.now();
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  });
  io.observe(root);

  function frame(now) {
    raf = 0;
    if (!visible) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(root.clientWidth * dpr), H = Math.round(root.clientHeight * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    if (isVideo && media.readyState >= 2) upload();
    if (ready && W && H) {
      gl.viewport(0, 0, W, H);
      const rb = root.getBoundingClientRect();
      let n = 0;
      for (const el of els) {
        if (n >= MAX) break;
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height || b.right < rb.left || b.left > rb.right || b.bottom < rb.top || b.top > rb.bottom) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.opacity === "0") continue;
        const hw = b.width / 2, hh = b.height / 2;
        const rad = Math.min(parseFloat(el.dataset.glassRadius || cs.borderTopLeftRadius) || 0, hw, hh);
        const kind = el.classList.contains("gp") || el.dataset.glassMaterial === "regular" ? 2 : el.dataset.effect === "bubble" ? 1 : 0;
        // Bend only a band along the rim; the middle stays clear
        const bev = Math.max(5, Math.min(Math.max(rad, 10) * 0.45, hh * 0.42, hw * 0.35, kind === 1 ? 14 : 11));
        rects.set([(b.left - rb.left + hw) * dpr, (b.top - rb.top + hh) * dpr, hw * dpr, hh * dpr], n * 4);
        shapes.set([rad * dpr, bev * dpr, (kind === 2 ? 14 : 0.6) * dpr, kind], n * 4);
        const pr = press.get(el);
        if (pr) {
          pr.a += (pr.to - pr.a) * (calm ? 1 : 0.18);
          if (pr.to === 0 && pr.a < 0.01) press.delete(el);
          const lr = Math.min(hh * 1.6, 46);
          presses.set([(b.left - rb.left + pr.ox) * dpr, (b.top - rb.top + pr.oy) * dpr, pr.a, lr * dpr], n * 4);
        } else presses.set([0, 0, 0, 1], n * 4);
        n++;
      }
      // Cover the box with the picture, drifting slowly
      const ca = W / H, ia = mw / mh;
      const zoom = 1.08;
      const sx = (ca > ia ? 1 : ca / ia) / zoom, sy = (ca > ia ? ia / ca : 1) / zoom;
      const tm = calm ? 0 : (now - t0) / 1000;
      gl.uniform1i(U.uTex, 0);
      gl.uniform2f(U.uRes, W, H);
      gl.uniform2f(U.uScale, sx, sy);
      gl.uniform2f(U.uPan, Math.sin(tm * 0.05) * 0.025, (opts.shiftY || 0) + Math.cos(tm * 0.04) * 0.015);
      gl.uniform1f(U.uTexel, (TW * sx) / W);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1i(U.uCount, n);
      gl.uniform4fv(U.uRect, rects);
      gl.uniform4fv(U.uShape, shapes);
      gl.uniform4fv(U.uPress, presses);
      const lp = light || [root.clientWidth * 0.25, -root.clientHeight * 0.3];
      gl.uniform2f(U.uLight, lp[0] * dpr, lp[1] * dpr);
      gl.uniform1f(U.uDark, opts.appearance === "light" ? 0 : 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    mo.disconnect();
    media.removeEventListener(isVideo ? "loadeddata" : "load", upload);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    const lose = gl.getExtension("WEBGL_lose_context");
    if (lose) lose.loseContext();
  };
}

/* Turns `rootRef` into a live glass scene. `findMedia` returns the <img> or <video> to draw. */
function useGlassEngine(rootRef, canvasRef, findMedia, opts) {
  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    const media = root && findMedia(root);
    if (!root || !canvas || !media) return;
    const stop = startGlass(root, canvas, media, opts);
    if (!stop) return;
    root.setAttribute("data-glass-live", "");
    return () => {
      stop();
      root.removeAttribute("data-glass-live");
    };
  }, [opts.selector, opts.appearance, opts.shiftY, opts.media]);
}

const SceneCtx = createContext(null);

/** GlassScene: a box whose GlassContent is seen through every glass surface inside it.
 *  material "clear" (default) or "regular" (frosted); appearance "dark" (default) or "light". */
export function GlassScene({ material = "clear", appearance = "dark", className = "", children, ...rest }) {
  const root = useRef(null), canvas = useRef(null);
  useGlassEngine(root, canvas, (r) => r.querySelector(".glass-content img, .glass-content video"), { appearance });
  return (
    <SceneCtx.Provider value={{ material }}>
      <div ref={root} className={`glass-scene ${className}`} data-glass-on={appearance} data-material={material} {...rest}>
        <canvas ref={canvas} className="glass-canvas" aria-hidden="true" />
        {children}
      </div>
    </SceneCtx.Provider>
  );
}

/** GlassContent: what the glass looks through. Put one <img> or <video> inside. */
export function GlassContent({ children }) {
  return <div className="glass-content">{children}</div>;
}

/** GlassSurface: one piece of glass. interactive adds the press lens; radius sets the corners; as sets the tag. */
export function GlassSurface({ as: Tag = "div", interactive = false, radius = 24, material, className = "", style, children, ...rest }) {
  const scene = useContext(SceneCtx);
  return (
    <Tag
      className={`glass-surface ${className}`}
      data-glass-surface=""
      data-glass-interactive={interactive ? "" : undefined}
      data-glass-material={material || (scene && scene.material) || "clear"}
      data-glass-radius={radius}
      style={{ borderRadius: radius, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** GlassBackdrop: put inside any positioned box. It fills the box with the picture
 *  (or a looping, muted video) and turns every Puffy glass component in that box
 *  into real glass. src: a picture; video: a video file; poster: shown while it loads. */
export function GlassBackdrop({ src, video, poster, alt = "", appearance = "dark", shiftY = 0 }) {
  const layer = useRef(null), canvas = useRef(null);
  // If the video can't play here, fall back to its poster picture
  const [failed, setFailed] = useState(false);
  // The box this sits in becomes the scene
  const host = useRef({ get current() { return layer.current && layer.current.parentElement; } }).current;
  useGlassEngine(host, canvas, () => layer.current && layer.current.querySelector("video, img"), { appearance, shiftY, media: failed ? "img" : "video" });
  return (
    <div ref={layer} className="glass-backdrop" aria-hidden={alt ? undefined : "true"}>
      {video && !failed ? <LoopVideo key="v" src={video} poster={poster || src} onFail={() => setFailed(true)} /> : <img key="i" src={src || poster} alt={alt} />}
      <canvas ref={canvas} className="glass-canvas" />
    </div>
  );
}

/** A muted, looping background video that starts on its own (and stays still
 *  for people who ask for less motion). */
export function LoopVideo({ src, poster, className, onFail }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }, [src]);
  const fail = () => { setFailed(true); onFail && onFail(); };
  if (failed && !onFail) return <img className={className} src={poster} alt="" aria-hidden="true" />;
  return <video ref={ref} className={className} src={src} poster={poster} muted loop playsInline autoPlay preload="auto" aria-hidden="true" onError={fail} />;
}
