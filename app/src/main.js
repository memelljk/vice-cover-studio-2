// Vice Cover Studio - bootstrap.
// Loads the procedural demo scenes as the starter photos, wires the
// editor, and (only for screenshot capture) honours a ?shot=1 query
// that applies a fixed layout/grade and hides the editor chrome.

import { demoScenes } from './demo.js';
import { createEditor } from './editor.js';

const $ = (id) => document.getElementById(id);

async function ready() {
  // The caption lettering needs the bundled Anton face before first render.
  try { await document.fonts.load('80px Anton'); } catch { /* fallback stack still renders */ }

  const photos = demoScenes().map(({ canvas, name }) => ({
    img: canvas, name, zoom: 1, ox: 0, oy: 0,
  }));

  const editor = createEditor(photos, {
    preview: $('preview'),
    thumbs: $('thumbs'),
    fileInput: $('fileInput'),
    dropZone: $('stage'),
    panelInfo: $('panelInfo'),
    status: $('status'),
    posterRange: $('posterRange'),
    outlineRange: $('outlineRange'),
    gradeRange: $('gradeRange'),
    halftoneCheck: $('halftoneCheck'),
    captionInput: $('captionInput'),
    subInput: $('subInput'),
    posSelect: $('posSelect'),
    zoomRange: $('zoomRange'),
    resetViewBtn: $('resetViewBtn'),
    fillAllBtn: $('fillAllBtn'),
    exportBtn: $('exportBtn'),
  });

  // Screenshot hooks: used by the repo's capture script through CDP.
  window.__viceExport = (w, h) => editor.exportPNG(w, h).toDataURL('image/png');
  const q = new URLSearchParams(location.search);
  if (q.has('shot')) {
    editor.applyShot({
      layout: q.get('layout') || undefined,
      grade: q.get('grade') || undefined,
      caption: q.get('caption') ?? undefined,
      sub: q.get('sub') ?? undefined,
      pos: q.get('pos') || undefined,
      panels: q.get('panels') || undefined,
    });
    document.body.classList.add('shot');
    window.__shotReady = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ready);
} else {
  ready();
}
