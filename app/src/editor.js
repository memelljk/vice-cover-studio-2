// Vice Cover Studio - editor state and interactions.
// Photos stay on the user's machine: uploads are read as local object
// URLs and drawn to canvas, never sent anywhere.

import { GRADES, layoutPanels, panelBox, renderCover } from './cover.js';

export const SIZES = [
  [1080, 1080, 'Square 1080x1080'],
  [1080, 1350, 'Portrait 1080x1350'],
  [1920, 1080, 'Wide 1920x1080'],
];

export function createEditor(photos, els) {
  const st = {
    photos,
    panelPhoto: [0, 1, 2, 0, 1],
    selectedPanel: 0,
    layout: 'sunset',
    grade: 'sunset',
    caption: 'VICE CITY NIGHTS',
    sub: 'MY VICE STORY',
    captionPos: 'bottom',
    poster: 6,
    outline: 72,
    gradeAmt: 58,
    halftone: false,
    size: [1080, 1350],
    markIndex: 0,
  };

  const preview = els.preview;
  const pctx = preview.getContext('2d');

  function render() {
    const [ew, eh] = st.size;
    const scale = Math.min(1, 780 / ew, 780 / eh);
    preview.width = Math.round(ew * scale);
    preview.height = Math.round(eh * scale);
    renderCover(pctx, preview.width, preview.height, { ...st, markIndex: st.markIndex });
    els.panelInfo.textContent =
      `Panel ${st.selectedPanel + 1} - photo: ${(st.photos[st.panelPhoto[st.selectedPanel]] || {}).name || '-'}`;
    markActive();
  }

  function markActive() {
    document.querySelectorAll('[data-layout]').forEach((b) =>
      b.classList.toggle('active', b.dataset.layout === st.layout));
    document.querySelectorAll('[data-grade]').forEach((b) =>
      b.classList.toggle('active', b.dataset.grade === st.grade));
    document.querySelectorAll('[data-size]').forEach((b) =>
      b.classList.toggle('active', b.dataset.size === st.size.join('x')));
    document.querySelectorAll('.thumb').forEach((t, i) =>
      t.classList.toggle('active', i === (st.panelPhoto[st.selectedPanel] ?? 0)));
  }

  function refreshThumbs() {
    els.thumbs.innerHTML = '';
    st.photos.forEach((photo, i) => {
      const b = document.createElement('button');
      b.className = 'thumb';
      b.title = photo.name;
      const c = document.createElement('canvas');
      c.width = 84; c.height = 64;
      c.getContext('2d').drawImage(photo.img, 0, 0, 84, 64);
      const label = document.createElement('span');
      label.textContent = photo.name;
      b.append(c, label);
      b.addEventListener('click', () => {
        st.panelPhoto[st.selectedPanel] = i;
        render();
      });
      els.thumbs.append(b);
    });
  }

  function addFiles(files) {
    const imgs = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 5);
    let pending = imgs.length;
    if (!pending) return;
    imgs.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        st.photos.push({ img, name: file.name.slice(0, 24), zoom: 1, ox: 0, oy: 0 });
        if (--pending === 0) {
          st.panelPhoto[st.selectedPanel] = st.photos.length - imgs.length;
          refreshThumbs();
          render();
          els.status.textContent = `${imgs.length} photo(s) added - click a panel, then a photo to place it.`;
        }
      };
      img.src = url;
    });
  }

  // ------------------------------------------------------------ wiring
  els.fileInput.addEventListener('change', () => {
    addFiles(els.fileInput.files);
    els.fileInput.value = '';
  });
  ['dragover', 'dragleave', 'drop'].forEach((ev) =>
    els.dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.dropZone.classList.toggle('dragging', ev === 'dragover');
      if (ev === 'drop') addFiles(e.dataTransfer.files);
    }));

  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.addEventListener('click', () => { st.layout = b.dataset.layout; render(); }));
  document.querySelectorAll('[data-grade]').forEach((b) =>
    b.addEventListener('click', () => { st.grade = b.dataset.grade; render(); }));
  document.querySelectorAll('[data-size]').forEach((b) =>
    b.addEventListener('click', () => {
      st.size = b.dataset.size.split('x').map(Number);
      render();
    }));

  const bindRange = (el, key, fmt) => {
    el.addEventListener('input', () => {
      st[key] = Number(el.value);
      if (fmt) fmt(el.value);
      render();
    });
  };
  bindRange(els.posterRange, 'poster');
  bindRange(els.outlineRange, 'outline');
  bindRange(els.gradeRange, 'gradeAmt');
  els.halftoneCheck.addEventListener('change', () => { st.halftone = els.halftoneCheck.checked; render(); });
  els.captionInput.addEventListener('input', () => { st.caption = els.captionInput.value; render(); });
  els.subInput.addEventListener('input', () => { st.sub = els.subInput.value; render(); });
  els.posSelect.addEventListener('change', () => { st.captionPos = els.posSelect.value; render(); });
  els.zoomRange.addEventListener('input', () => {
    const photo = st.photos[st.panelPhoto[st.selectedPanel]];
    if (photo) { photo.zoom = Number(els.zoomRange.value); render(); }
  });
  els.resetViewBtn.addEventListener('click', () => {
    const photo = st.photos[st.panelPhoto[st.selectedPanel]];
    if (photo) { photo.zoom = 1; photo.ox = 0; photo.oy = 0; els.zoomRange.value = 1; render(); }
  });
  els.fillAllBtn.addEventListener('click', () => {
    const cur = st.panelPhoto[st.selectedPanel] ?? 0;
    st.panelPhoto = st.panelPhoto.map(() => cur);
    render();
  });

  // Drag on the preview: select the panel under the pointer and pan its
  // photo; the zoom slider scales the same photo.
  let drag = null;
  const toCover = (e) => {
    const r = preview.getBoundingClientRect();
    return [(e.clientX - r.left) * preview.width / r.width,
      (e.clientY - r.top) * preview.height / r.height];
  };
  const inPanel = (panel, x, y) => {
    if (panel.poly) {
      let inside = false;
      const p = panel.poly;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const [xi, yi] = p[i], [xj, yj] = p[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }
    return x >= panel.x && x <= panel.x + panel.w && y >= panel.y && y <= panel.y + panel.h;
  };
  preview.addEventListener('pointerdown', (e) => {
    const [x, y] = toCover(e);
    const panels = layoutPanels(st.layout, preview.width, preview.height);
    const idx = panels.findIndex((p) => inPanel(p, x, y));
    if (idx >= 0) {
      st.selectedPanel = idx;
      st.markIndex = idx;
      const photo = st.photos[st.panelPhoto[idx]];
      drag = { x, y, ox: photo.ox, oy: photo.oy, box: panelBox(panels[idx]) };
      els.zoomRange.value = photo.zoom;
      preview.setPointerCapture(e.pointerId);
      render();
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [x, y] = toCover(e);
    const photo = st.photos[st.panelPhoto[st.selectedPanel]];
    photo.ox = drag.ox + (x - drag.x) / drag.box.w;
    photo.oy = drag.oy + (y - drag.y) / drag.box.h;
    render();
  });
  ['pointerup', 'pointercancel'].forEach((ev) =>
    preview.addEventListener(ev, () => { drag = null; }));

  function exportPNG(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    renderCover(c.getContext('2d'), w, h, { ...st, markIndex: -1 });
    return c;
  }
  els.exportBtn.addEventListener('click', () => {
    const [w, h] = st.size;
    exportPNG(w, h).toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      els.status.textContent = `Exported vice-cover-${w}x${h}.png`;
    }, 'image/png');
  });

  refreshThumbs();
  render();

  return {
    state: st,
    render,
    exportPNG,
    applyShot(opts) {
      if (opts.layout) st.layout = opts.layout;
      if (opts.grade) st.grade = opts.grade;
      if (opts.caption !== undefined) st.caption = opts.caption;
      if (opts.sub !== undefined) st.sub = opts.sub;
      if (opts.pos) st.captionPos = opts.pos;
      if (opts.panels) st.panelPhoto = opts.panels.split(',').map(Number);
      st.markIndex = -1;
      render();
    },
  };
}

export { GRADES };
