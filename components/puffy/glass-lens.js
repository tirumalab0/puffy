/* Liquid glass refraction.
   Adds one hidden SVG filter (#glass-lens) to the page, once. Used as part of
   a backdrop-filter, it bends what sits behind a glass surface near its rim,
   the way thick glass does, while the middle stays clear.
   Only Chromium can use an SVG filter as a backdrop-filter, so the hook marks
   <html data-glass-lens> there and the CSS turns refraction on only then.
   Every other browser keeps the plain frosted glass. */
import { useEffect } from "react";

function lensMap() {
  const n = 128;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(n, n);
  const ramp = (a, b, t) => {
    const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * 2 - 1;
      const v = (j / (n - 1)) * 2 - 1;
      // Flat in the middle, bending hard in a band along the edge
      const kx = Math.sign(u) * ramp(0.7, 1, Math.abs(u));
      const ky = Math.sign(v) * ramp(0.3, 1, Math.abs(v));
      const o = (j * n + i) * 4;
      img.data[o] = 128 + 127 * kx;
      img.data[o + 1] = 128 + 127 * ky;
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function useGlassLens(on = true) {
  useEffect(() => {
    if (!on || typeof document === "undefined" || document.getElementById("glass-lens")) return;
    const chromium = !!(navigator.userAgentData && navigator.userAgentData.brands && navigator.userAgentData.brands.length);
    if (!chromium) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    // Sized in each element's own box, so one filter fits every button
    svg.innerHTML =
      '<filter id="glass-lens" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">' +
      '<feImage href="' + lensMap() + '" x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" scale="-0.2" xChannelSelector="R" yChannelSelector="G"/>' +
      "</filter>";
    document.body.appendChild(svg);
    document.documentElement.setAttribute("data-glass-lens", "");
  }, [on]);
}
