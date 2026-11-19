// Vice Cover Studio - cover rendering engine.
// Everything here is procedural: photos are posterized, outlined and
// gradient-mapped on a canvas, laid out in panels, and lettered with a
// bold condensed caption. No external assets, no network.

// ---------------------------------------------------------------- grades
// Each grade is a gradient map: luminance 0..1 -> colour stops, plus the
// accent used for lettering shadows, bands and the frame background.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    accent: '#ff9e2c',
    deep: '#160a2e',
    stops: [
      [0.0, [22, 6, 44]], [0.28, [94, 20, 84]], [0.52, [199, 44, 92]],
      [0.74, [244, 110, 66]], [1.0, [255, 214, 130]],
    ],
  },
  neon: {
    label: 'Neon Nights',
    accent: '#22e6ff',
    deep: '#05081f',
    stops: [
      [0.0, [4, 8, 38]], [0.3, [24, 38, 120]], [0.55, [146, 32, 168]],
      [0.78, [255, 46, 136]], [1.0, [120, 245, 255]],
    ],
  },
  vicepink: {
    label: 'Vice Pink',
    accent: '#ff5da2',
    deep: '#1d0722',
    stops: [
      [0.0, [30, 6, 44]], [0.32, [94, 24, 110]], [0.58, [196, 52, 140]],
      [0.8, [255, 110, 168]], [1.0, [255, 224, 196]],
    ],
  },
  noir: {
    label: 'Palm Noir',
    accent: '#ffc94d',
    deep: '#02181a',
    stops: [
      [0.0, [2, 20, 24]], [0.34, [8, 66, 70]], [0.6, [30, 128, 116]],
      [0.82, [196, 158, 62]], [1.0, [250, 232, 178]],
    ],
  },
};

function lutFor(grade) {
  const lut = new Uint8Array(256 * 3);
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const f = (t - a[0]) / Math.max(0.0001, b[0] - a[0]);
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
  }
  return lut;
}
const lutCache = new Map();
function gradeLut(name) {
  if (!lutCache.has(name)) lutCache.set(name, lutFor(GRADES[name]));
  return lutCache.get(name);
}

// ---------------------------------------------------------------- layouts
// A panel is {x, y, w, h} in cover pixels, or {poly: [[x,y],...]} for the
// slanted duo layout. Panels are returned in drawing order.
export function layoutPanels(layout, W, H) {
  const g = Math.max(6, Math.round(W * 0.011));
  if (layout === 'strip') {
    // Five vertical strips of varied width, separated by thin gaps.
    const fr = [0.27, 0.18, 0.21, 0.16, 0.18];
    const panels = [];
    let edge = 0;
    for (let i = 0; i < fr.length; i++) {
      edge += W * fr[i];
      const right = i === fr.length - 1 ? W : Math.round(edge - g / 2);
      const left = panels.length === 0 ? 0 : panels[panels.length - 1].x + panels[panels.length - 1].w + g;
      panels.push({ x: left, y: 0, w: right - left, h: H });
    }
    return panels;
  }
  if (layout === 'duo') {
    const top = 0, slant = W * 0.09;
    return [
      { poly: [[0, 0], [W * 0.60, 0], [W * 0.60 - slant, H], [0, H]] },
      { poly: [[W * 0.60 + g, top], [W, 0], [W, H], [W * 0.60 - slant + g, H]] },
    ];
  }
  // Sunset Grid: one hero, two stacked at right, one wide along the bottom.
  const heroW = Math.round(W * 0.565);
  const rightX = heroW + g;
  const rightW = W - rightX;
  const heroH = Math.round(H * 0.655);
  const botY = heroH + g;
  const botH = H - botY;
  const halfH = Math.round((heroH - g) / 2);
  return [
    { x: 0, y: 0, w: heroW, h: heroH },
    { x: rightX, y: 0, w: rightW, h: halfH },
    { x: rightX, y: halfH + g, w: rightW, h: heroH - halfH - g },
    { x: 0, y: botY, w: heroW, h: botH },
    { x: rightX, y: botY, w: rightW, h: botH },
  ];
}

export function panelBox(panel) {
  if (!panel.poly) return panel;
  const xs = panel.poly.map((p) => p[0]), ys = panel.poly.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// ---------------------------------------------------------------- treatment
const TREAT_MAX = 660;
const treatCache = new Map();

function cropCanvas(img, w, h, t) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, w); c.height = Math.max(2, h);
  const ctx = c.getContext('2d');
  const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
  const base = Math.max(w / iw, h / ih);
  const scale = base * (t.zoom || 1);
  const dw = iw * scale, dh = ih * scale;
  const dx = (w - dw) / 2 + (t.ox || 0) * w;
  const dy = (h - dh) / 2 + (t.oy || 0) * h;
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, dx, dy, dw, dh);
  return c;
}

// Posterize + gradient map + Sobel comic outline, in one pixel pass pair.
export function treatPhoto(img, w, h, t, st) {
  const scaleDown = Math.min(1, TREAT_MAX / Math.max(w, h));
  const tw = Math.max(2, Math.round(w * scaleDown));
  const th = Math.max(2, Math.round(h * scaleDown));
  const key = [st.photoId, tw, th, st.grade, st.poster, st.outline, st.gradeAmt,
    st.halftone, t.zoom.toFixed(3), t.ox.toFixed(3), t.oy.toFixed(3)].join('|');
  if (treatCache.has(key)) return treatCache.get(key);

  const src = cropCanvas(img, tw, th, t);
  const ctx = src.getContext('2d');
  const data = ctx.getImageData(0, 0, tw, th);
  const px = data.data;
  const lum = new Float32Array(tw * th);
  const levels = Math.max(3, st.poster | 0);
  const lut = gradeLut(st.grade);
  const gAmt = st.gradeAmt / 100;

  for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
    // Saturation + contrast push before quantising, so flat areas form.
    let r = px[p], g = px[p + 1], b = px[p + 2];
    const l0 = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = 1.35;
    r = l0 + (r - l0) * sat; g = l0 + (g - l0) * sat; b = l0 + (b - l0) * sat;
    r = (r - 128) * 1.12 + 128; g = (g - 128) * 1.12 + 128; b = (b - 128) * 1.12 + 128;
    const q = (v) => {
      const n = Math.min(255, Math.max(0, v)) / 255;
      return Math.round(Math.round(n * (levels - 1)) / (levels - 1) * 255);
    };
    r = q(r); g = q(g); b = q(b);
    const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    lum[i] = l;
    const li = l * 3;
    px[p] = r + (lut[li] - r) * gAmt;
    px[p + 1] = g + (lut[li + 1] - g) * gAmt;
    px[p + 2] = b + (lut[li + 2] - b) * gAmt;
  }
  // Sobel edges darken toward ink, the comic-print outline.
  const strength = (st.outline / 100) * 1.15;
  if (strength > 0.01) {
    const copy = new Uint8ClampedArray(px);
    for (let y = 1; y < th - 1; y++) {
      for (let x = 1; x < tw - 1; x++) {
        const i = y * tw + x;
        const gx = -lum[i - tw - 1] - 2 * lum[i - 1] - lum[i + tw - 1]
          + lum[i - tw + 1] + 2 * lum[i + 1] + lum[i + tw + 1];
        const gy = -lum[i - tw - 1] - 2 * lum[i - tw] - lum[i - tw + 1]
          + lum[i + tw - 1] + 2 * lum[i + tw] + lum[i + tw + 1];
        const mag = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 620);
        const ink = 1 - mag * strength;
        const p = i * 4;
        px[p] = copy[p] * ink; px[p + 1] = copy[p + 1] * ink; px[p + 2] = copy[p + 2] * ink;
      }
    }
  }
  ctx.putImageData(data, 0, 0);

  if (st.halftone) {
    const step = 7;
    ctx.fillStyle = 'rgba(10,4,20,0.34)';
    for (let y = step / 2; y < th; y += step) {
      for (let x = step / 2; x < tw; x += step) {
        const l = lum[Math.min(lum.length - 1, (y | 0) * tw + (x | 0))];
        const rad = Math.max(0, (1 - l / 255) - 0.35) * step * 0.62;
        if (rad > 0.4) { ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill(); }
      }
    }
  }
  if (treatCache.size > 60) treatCache.clear();
  treatCache.set(key, src);
  return src;
}

// ---------------------------------------------------------------- cover
let grainCanvas = null;
function grain() {
  if (grainCanvas) return grainCanvas;
  const c = document.createElement('canvas');
  c.width = c.height = 140;
  const ctx = c.getContext('2d');
  const d = ctx.createImageData(140, 140);
  let seed = 1234567;
  for (let i = 0; i < d.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = 118 + (seed % 120);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  grainCanvas = c;
  return c;
}

function drawPanel(ctx, panel, img, t, st) {
  const box = panelBox(panel);
  const treated = treatPhoto(img, box.w, box.h, t, st);
  ctx.save();
  ctx.beginPath();
  if (panel.poly) {
    ctx.moveTo(panel.poly[0][0], panel.poly[0][1]);
    for (let i = 1; i < panel.poly.length; i++) ctx.lineTo(panel.poly[i][0], panel.poly[i][1]);
    ctx.closePath();
  } else {
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
  }
  ctx.clip();
  ctx.drawImage(treated, box.x, box.y, box.w, box.h);
  ctx.restore();
  // White keyline + black outer edge, the printed-cover frame.
  ctx.save();
  ctx.beginPath();
  if (panel.poly) {
    ctx.moveTo(panel.poly[0][0], panel.poly[0][1]);
    for (let i = 1; i < panel.poly.length; i++) ctx.lineTo(panel.poly[i][0], panel.poly[i][1]);
    ctx.closePath();
  } else ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.lineWidth = Math.max(3, box.w * 0.012);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}

function fitFont(ctx, text, maxW, startPx, weight) {
  let px = startPx;
  while (px > 12) {
    ctx.font = `${weight} ${px}px Anton, sans-serif`;
    if (ctx.measureText(text).width <= maxW) break;
    px -= 4;
  }
  return px;
}

function drawCaption(ctx, W, H, st) {
  const grade = GRADES[st.grade];
  const text = (st.caption || '').toUpperCase();
  const sub = (st.sub || '').toUpperCase();
  const cx = W / 2;
  const atBottom = st.captionPos !== 'top';
  ctx.save();
  ctx.translate(cx, atBottom ? H * 0.90 : H * 0.10);
  ctx.rotate(-0.022);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (text) {
    const px = fitFont(ctx, text, W * 0.94, H * 0.145, '');
    ctx.font = `${px}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    // Accent drop shadow first, then black outline, then white face.
    ctx.fillStyle = grade.accent;
    ctx.fillText(text, px * 0.075, px * 0.085);
    ctx.lineWidth = px * 0.20;
    ctx.strokeStyle = '#0a0512';
    ctx.strokeText(text, 0, 0);
    const grad = ctx.createLinearGradient(0, -px / 2, 0, px / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#ffe9f4');
    grad.addColorStop(1, '#ffb9d9');
    ctx.fillStyle = st.grade === 'neon' ? '#eaffff' : grad;
    ctx.fillText(text, 0, 0);
  }
  if (sub) {
    const spx = Math.round(H * 0.034);
    ctx.font = `${spx}px Anton, sans-serif`;
    const w = ctx.measureText(sub).width + spx * 1.6;
    const y = (atBottom ? -1 : 1) * H * 0.108;
    ctx.save();
    ctx.translate(0, y);
    ctx.rotate(0.012);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(-w / 2, -spx * 0.85, w, spx * 1.7);
    ctx.fillStyle = '#0a0512';
    ctx.fillText(sub, 0, spx * 0.06);
    ctx.restore();
  }
  ctx.restore();
}

export function renderCover(ctx, W, H, st) {
  const grade = GRADES[st.grade];
  // Frame background: deep grade colour with a low sun band.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, grade.deep);
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.5;
  const sun = ctx.createRadialGradient(W * 0.82, H * 0.1, 10, W * 0.82, H * 0.1, W * 0.36);
  sun.addColorStop(0, grade.accent);
  sun.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  const panels = layoutPanels(st.layout, W, H);
  panels.forEach((panel, i) => {
    const photo = st.photos[st.panelPhoto[i] ?? 0] || st.photos[0];
    if (!photo) return;
    drawPanel(ctx, panel, photo.img, photo, { ...st, photoId: st.panelPhoto[i] ?? 0 });
  });

  // Selected panel marker (editor only; skipped when st.markIndex < 0).
  if (st.markIndex >= 0 && panels[st.markIndex]) {
    const b = panelBox(panels[st.markIndex]);
    ctx.save();
    ctx.setLineDash([14, 10]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#22e6ff';
    ctx.strokeRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
    ctx.restore();
  }

  // Vignette + grain over everything except lettering.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.36, W / 2, H / 2, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,0,10,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(grain(), 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  drawCaption(ctx, W, H, st);
  return panels;
}
