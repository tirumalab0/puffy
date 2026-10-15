"use client";
import { useEffect, useRef, useState } from "react";
import "./glass-prism.css";

/* Prism: a thin rainbow of light runs around the edge of any logo or icon,
   like light through glass. A small WebGL shader reads the picture's shape,
   finds its rim and lights it from the pointer (or the phone's tilt). If
   WebGL isn't there, a CSS shimmer stands in. */

const VS = "attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;v.y=1.0-v.y;gl_Position=vec4(p,0.,1.);}";
const FS = `precision mediump float;
uniform sampler2D u_img;uniform float u_t;uniform vec2 u_l;uniform float u_k;uniform float u_r;uniform float u_dark;
varying vec2 v;
float A(vec2 q){return texture2D(u_img,q).a;}
float B(vec2 q){float s=0.;for(int i=0;i<12;i++){float a=float(i)*0.5236;vec2 o=vec2(cos(a),sin(a));s+=A(q+o*u_r)+A(q+o*u_r*0.5);}return s/24.;}
void main(){
  vec4 c=texture2D(u_img,v);
  if(c.a<0.004){gl_FragColor=vec4(0.);return;}
  float b=B(v);
  float e=u_r*0.6;
  vec2 g=vec2(B(v+vec2(e,0.))-B(v-vec2(e,0.)),B(v+vec2(0.,e))-B(v-vec2(0.,e)));
  vec2 n=normalize(-g+1e-5);
  float rim=c.a*(1.-smoothstep(0.42,0.98,b));
  vec2 L=normalize(u_l);
  float f=dot(n,L)*0.5+0.5;
  vec3 ir=0.5+0.5*cos(6.2831*(f*1.25+u_t*0.07+(v.x+v.y)*0.35+vec3(0.,0.33,0.67)));
  ir=mix(ir,vec3(1.),0.12);
  float spec=pow(max(0.,dot(n,L)),10.)*rim;
  vec3 base=c.rgb;
  base=mix(base,base*0.55,u_dark*rim);
  vec3 col=mix(base,ir*1.15,clamp(rim*1.35*u_k,0.,1.))+spec*0.9;
  float s=fract((v.x*0.7+v.y*0.5)-u_t*0.1);
  col+=smoothstep(0.06,0.,abs(s-0.5))*0.22*c.a*u_k;
  gl_FragColor=vec4(col*c.a,c.a);
}`;

function setup(cv, img) {
  const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
  if (!gl) return null;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Draw the picture into a padded square so the rim never touches the edge
  const pad = document.createElement("canvas"); pad.width = cv.width; pad.height = cv.height;
  const pc = pad.getContext("2d"); const m = 0.06 * cv.width;
  const sc = Math.min((cv.width - 2 * m) / img.width, (cv.height - 2 * m) / img.height);
  pc.drawImage(img, (cv.width - img.width * sc) / 2, (cv.height - img.height * sc) / 2, img.width * sc, img.height * sc);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pad);
  const U = (n) => gl.getUniformLocation(pr, n);
  return { gl, u: { t: U("u_t"), l: U("u_l"), k: U("u_k"), r: U("u_r"), dark: U("u_dark") } };
}

export function GlassPrism({ src, size = 160, intensity = 1, rim = 0.045, dark = 0, active = true, follow = true, alt = "", className = "", style }) {
  const cv = useRef(null);
  const box = useRef(null);
  const st = useRef({ lx: -0.6, ly: -0.8, tx: -0.6, ty: -0.8, k: active ? intensity : 0, want: active ? intensity : 0 });
  const [ok, setOk] = useState(true);
  const kick = useRef(null);
  useEffect(() => {
    const el = cv.current; if (!el || !src) return;
    let ctx = null, raf = 0, alive = true, t0 = performance.now();
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!alive) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.round(size * dpr); el.height = Math.round(size * dpr);
      try { ctx = setup(el, img); } catch (e) { ctx = null; }
      if (!ctx) { setOk(false); return; }
      const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const loop = () => {
        const s = st.current, { gl, u } = ctx;
        s.lx += (s.tx - s.lx) * 0.08; s.ly += (s.ty - s.ly) * 0.08;
        s.k += ((st.current.want != null ? st.current.want : intensity) - s.k) * 0.08;
        gl.viewport(0, 0, el.width, el.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(u.t, calm ? 0 : (performance.now() - t0) / 1000); gl.uniform2f(u.l, s.lx, s.ly); gl.uniform1f(u.k, s.k); gl.uniform1f(u.r, rim); gl.uniform1f(u.dark, dark);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // rest when the light is off and has faded out
        const idle = s.want === 0 && s.k < 0.004;
        if (alive && !calm && !idle) raf = requestAnimationFrame(loop); else raf = 0;
      };
      kick.current = () => { if (!raf && alive) loop(); };
      loop();
    };
    img.onerror = () => setOk(false);
    img.src = src;
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [src, size, rim, dark]);
  useEffect(() => { st.current.want = active ? intensity : 0; kick.current && kick.current(); }, [active, intensity]);
  useEffect(() => {
    if (!follow) return;
    const mv = (e) => {
      const b = box.current; if (!b) return;
      const r = b.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / Math.max(200, r.width), y = (e.clientY - (r.top + r.height / 2)) / Math.max(200, r.height);
      st.current.tx = -0.4 + x * 2.2; st.current.ty = -0.8 + y * 2.2; kick.current && st.current.want !== 0 && kick.current();
    };
    const tilt = (e) => { if (e.gamma == null) return; st.current.tx = clampN(e.gamma / 30, -1.5, 1.5); st.current.ty = clampN((e.beta - 40) / 30, -1.5, 1.5); };
    window.addEventListener("pointermove", mv, { passive: true });
    window.addEventListener("deviceorientation", tilt, { passive: true });
    return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("deviceorientation", tilt); };
  }, [follow]);
  return (
    <span ref={box} className={"gpz " + className} style={{ width: size, height: size, ...style }} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} data-off={!active ? "" : undefined}>
      {ok ? <canvas ref={cv} /> : (
        <span className="gpz-css" style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }}><img src={src} alt="" /><i /></span>
      )}
    </span>
  );
}
const clampN = (v, a, b) => Math.min(b, Math.max(a, v));

/* A speech bubble and a rounded app tile to try the effect on */
export const PRISM_SHAPES = {
  bubble: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="g" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#2a3550"/><stop offset=".6" stop-color="#0b1020"/><stop offset="1" stop-color="#05070d"/></radialGradient></defs><path d="M100 22c46 0 80 30 80 70s-34 70-80 70c-9 0-17-1-25-3l-30 20 7-30c-20-13-32-34-32-57 0-40 34-70 80-70z" fill="url(#g)"/></svg>'),
  tile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#22232a"/><stop offset="1" stop-color="#0c0c10"/></linearGradient></defs><rect x="20" y="20" width="160" height="160" rx="44" fill="url(#g)"/><path d="M78 140V62h30a24 24 0 0 1 0 48H78" fill="none" stroke="#3a3b45" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
};
