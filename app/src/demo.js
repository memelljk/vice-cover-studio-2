// Vice Cover Studio - built-in demo scenes.
// Each scene is drawn by the app itself on a canvas at load: flat, bold
// illustration shapes (a portrait, a palm beach, a convertible at dusk)
// so a first-time user sees a finished cover before uploading anything.
// No real person's photo is used anywhere.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function sky(ctx, w, h, top, mid, low) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, low);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function stripedSun(ctx, cx, cy, r, colour) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.clip();
  ctx.fillStyle = colour;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20,4,34,0.85)';
  for (let i = 0; i < 5; i++) {
    const y = cy + r * (0.08 + i * 0.19);
    ctx.fillRect(cx - r, y, r * 2, r * (0.035 + i * 0.016));
  }
  ctx.restore();
}

function palm(ctx, x, y, s, lean, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 13 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * 30 * s, -120 * s, lean * 62 * s, -215 * s);
  ctx.stroke();
  const tx = lean * 62 * s, ty = -215 * s;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + i * 0.14);
    const len = (95 - Math.abs(i - 3) * 11) * s;
    ctx.lineWidth = 8 * s;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * len * 0.6, ty - Math.sin(a) * len * 0.75 - 14 * s,
      tx + Math.cos(a) * len, ty - Math.sin(a) * len * 0.28 + 26 * s);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(tx - 8 * s, ty + 8 * s, 9 * s, 0, 6.2832); ctx.fill();
  ctx.beginPath(); ctx.arc(tx + 10 * s, ty + 11 * s, 7.5 * s, 0, 6.2832); ctx.fill();
  ctx.restore();
}

function sea(ctx, w, y0, y1, deep, shine) {
  ctx.fillStyle = deep;
  ctx.fillRect(0, y0, w, y1 - y0);
  ctx.fillStyle = shine;
  for (let i = 0; i < 26; i++) {
    const y = y0 + 12 + ((i * 53) % Math.max(20, y1 - y0 - 24));
    const x = (i * 197) % w;
    const len = 26 + (i % 5) * 17;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, y, len, 4);
  }
  ctx.globalAlpha = 1;
}

// Portrait: a figure in sunglasses and a loud shirt against the sunset.
export function makePortraitScene() {
  const [c, ctx] = canvas(880, 1080);
  sky(ctx, 880, 1080, '#2b0f54', '#b03072', '#ff7a3c');
  stripedSun(ctx, 620, 330, 215, '#ffd23e');
  sea(ctx, 880, 560, 760, '#173a6e', '#ffb37a');
  ctx.fillStyle = '#f7c873';
  ctx.fillRect(0, 760, 880, 320);
  palm(ctx, 96, 790, 1.15, 1, '#20082f');
  palm(ctx, 806, 800, 0.95, -1, '#20082f');

  // Shoulders and shirt.
  ctx.fillStyle = '#0fb5a8';
  ctx.beginPath();
  ctx.moveTo(150, 1080);
  ctx.quadraticCurveTo(180, 830, 330, 780);
  ctx.lineTo(560, 780);
  ctx.quadraticCurveTo(720, 830, 745, 1080);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff5da2';
  ctx.beginPath();
  ctx.moveTo(330, 780); ctx.lineTo(445, 940); ctx.lineTo(560, 780);
  ctx.lineTo(505, 762); ctx.lineTo(445, 850); ctx.lineTo(390, 762);
  ctx.closePath(); ctx.fill();
  // Necklace.
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(445, 800, 62, 0.35, 2.79); ctx.stroke();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath(); ctx.arc(445, 872, 15, 0, 6.2832); ctx.fill();
  // Neck and head.
  ctx.fillStyle = '#c97b4a';
  ctx.fillRect(408, 690, 76, 110);
  ctx.beginPath(); ctx.ellipse(446, 560, 128, 158, 0, 0, 6.2832); ctx.fill();
  // Hair.
  ctx.fillStyle = '#180a20';
  ctx.beginPath(); ctx.ellipse(446, 452, 134, 82, 0, 3.35, 6.05); ctx.fill();
  ctx.fillRect(312, 440, 34, 150);
  ctx.fillRect(546, 440, 34, 150);
  // Sunglasses.
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(330, 540, 104, 62);
  ctx.fillRect(458, 540, 104, 62);
  ctx.fillRect(428, 556, 36, 12);
  ctx.fillStyle = 'rgba(120,240,255,0.75)';
  ctx.fillRect(344, 548, 40, 14);
  ctx.fillRect(472, 548, 40, 14);
  // Mouth.
  ctx.fillStyle = '#8c3f28';
  ctx.beginPath(); ctx.ellipse(446, 664, 34, 13, 0, 0, 6.2832); ctx.fill();
  // Face modelling: cheek + jaw shadow, nose, brow shadow - flat shapes
  // that survive posterizing as shaded planes, not a blank oval.
  ctx.fillStyle = 'rgba(146,62,32,0.55)';
  ctx.beginPath(); ctx.ellipse(520, 612, 52, 84, 0.25, 0, 6.2832); ctx.fill();
  ctx.beginPath(); ctx.ellipse(446, 706, 74, 20, 0, 0, 3.1416); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(446, 585); ctx.lineTo(428, 640); ctx.lineTo(452, 644);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,170,0.5)';
  ctx.beginPath(); ctx.ellipse(382, 596, 34, 66, -0.2, 0, 6.2832); ctx.fill();
  // Gold earrings.
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(322, 640, 17, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.arc(570, 640, 17, 0, 6.2832); ctx.stroke();
  // Hair shine streak.
  ctx.strokeStyle = 'rgba(120,70,180,0.8)';
  ctx.lineWidth = 13;
  ctx.beginPath(); ctx.arc(446, 470, 105, 3.6, 4.5); ctx.stroke();
  // Shirt print: dark palm sprigs on the teal.
  ctx.fillStyle = 'rgba(4,80,74,0.85)';
  const sprigs = [[250, 920], [620, 905], [300, 1010], [585, 1025], [445, 985]];
  for (const [sx, sy] of sprigs) {
    for (let i = 0; i < 5; i++) {
      const a = -0.5 + i * 0.28;
      ctx.beginPath();
      ctx.ellipse(sx + Math.sin(a) * 26, sy - Math.cos(a) * 22, 7, 24, a, 0, 6.2832);
      ctx.fill();
    }
    ctx.fillRect(sx - 3, sy - 6, 6, 30);
  }
  return c;
}

// Beach: palms, striped sun and shoreline, no people.
export function makeBeachScene() {
  const [c, ctx] = canvas(1100, 820);
  sky(ctx, 1100, 820, '#38106b', '#c93a7d', '#ff8b47');
  stripedSun(ctx, 545, 330, 205, '#ffcf3d');
  sea(ctx, 1100, 430, 610, '#14406e', '#ffc98a');
  ctx.fillStyle = '#f9d488';
  ctx.beginPath();
  ctx.moveTo(0, 610);
  ctx.quadraticCurveTo(360, 560, 700, 606);
  ctx.quadraticCurveTo(950, 640, 1100, 612);
  ctx.lineTo(1100, 820); ctx.lineTo(0, 820);
  ctx.closePath(); ctx.fill();
  palm(ctx, 150, 700, 1.5, 1, '#1c0730');
  palm(ctx, 950, 715, 1.3, -1, '#1c0730');
  palm(ctx, 838, 690, 0.85, -1, '#2a0c40');
  // Beach umbrella and towel blocks.
  ctx.fillStyle = '#ff3860';
  ctx.beginPath();
  ctx.moveTo(430, 640); ctx.lineTo(610, 640); ctx.lineTo(520, 566);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#30104a'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(520, 640); ctx.lineTo(520, 716); ctx.stroke();
  ctx.fillStyle = '#22b8e6';
  ctx.fillRect(452, 722, 140, 44);
  return c;
}

// Dusk drive: a convertible silhouette under neon palms.
export function makeDriveScene() {
  const [c, ctx] = canvas(1100, 820);
  sky(ctx, 1100, 820, '#0b1038', '#5c1e78', '#e83e6b');
  stripedSun(ctx, 545, 300, 175, '#ff9e2c');
  ctx.fillStyle = '#2de2e6';
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.35 + (i % 4) * 0.15;
    ctx.fillRect((i * 263) % 1100, (i * 97) % 300, 4, 4);
  }
  ctx.globalAlpha = 1;
  // Distant towers.
  ctx.fillStyle = '#12082b';
  const towers = [[40, 300, 90], [150, 240, 70], [950, 260, 80], [1030, 320, 60]];
  for (const [x, top, w] of towers) ctx.fillRect(x, top, w, 520 - top + 130);
  ctx.fillStyle = '#ffd23e';
  for (let i = 0; i < 30; i++) ctx.fillRect(50 + (i * 331) % 1000, 280 + (i * 67) % 220, 7, 10);
  // Road.
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 560, 1100, 260);
  ctx.fillStyle = '#ff5da2';
  ctx.fillRect(0, 556, 1100, 6);
  ctx.fillStyle = '#f5f5f5';
  for (let i = 0; i < 6; i++) ctx.fillRect(60 + i * 180, 700, 92, 12);
  palm(ctx, 90, 580, 1.25, 1, '#070313');
  palm(ctx, 1015, 585, 1.15, -1, '#070313');
  // Convertible silhouette with two riders.
  ctx.fillStyle = '#05050d';
  ctx.beginPath();
  ctx.moveTo(215, 690);
  ctx.quadraticCurveTo(240, 622, 360, 610);
  ctx.lineTo(430, 548); ctx.lineTo(700, 548);
  ctx.lineTo(770, 606);
  ctx.quadraticCurveTo(905, 618, 920, 690);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(215, 684, 705, 32);
  ctx.beginPath(); ctx.arc(330, 692, 47, 0, 6.2832); ctx.fill();
  ctx.beginPath(); ctx.arc(778, 692, 47, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#22e6ff';
  ctx.beginPath(); ctx.arc(330, 692, 20, 0, 6.2832); ctx.fill();
  ctx.beginPath(); ctx.arc(778, 692, 20, 0, 6.2832); ctx.fill();
  // Riders' heads.
  ctx.fillStyle = '#05050d';
  ctx.beginPath(); ctx.arc(520, 522, 30, 0, 6.2832); ctx.fill();
  ctx.beginPath(); ctx.arc(648, 518, 27, 0, 6.2832); ctx.fill();
  // Headlight glow.
  const glow = ctx.createRadialGradient(918, 676, 4, 918, 676, 90);
  glow.addColorStop(0, 'rgba(255,240,180,0.9)');
  glow.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(820, 580, 200, 190);
  return c;
}

export function demoScenes() {
  return [
    { canvas: makePortraitScene(), name: 'Demo portrait' },
    { canvas: makeBeachScene(), name: 'Demo beach' },
    { canvas: makeDriveScene(), name: 'Demo drive' },
  ];
}
