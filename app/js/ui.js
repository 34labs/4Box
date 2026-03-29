// Render all boxes
function renderBoxes() {
  const grid = document.getElementById('canvasGrid');
  grid.innerHTML = '';

  boxData.forEach((box, index) => {
    const boxEl = createBox(box, index);
    grid.appendChild(boxEl);
  });
}

// Create a single box
function createBox(box, index) {
  const div = document.createElement('div');
  div.className = 'box-enter flex flex-col rounded-xl overflow-hidden shadow-lg';
  div.style.cssText = `background: var(--card); border: 1px solid var(--border); animation-delay: ${index * 0.1}s;`;

  div.innerHTML = `
    <div class="flex items-center justify-between px-3 py-2 border-b" style="background: var(--bg); border-color: var(--border);">
      <input type="text" value="${box.name}" class="title-input font-display text-base font-semibold w-full max-w-[140px] truncate mr-2" style="color: var(--fg);" onchange="updateBoxName(${box.id}, this.value)" aria-label="Box name">
      <div class="flex gap-1 items-center shrink-0" onmouseenter="window.lastActiveBoxId = ${box.id}">
        <button onclick="undo(${box.id})" class="p-1 rounded hover:opacity-70" title="Undo (Ctrl+Z)" aria-label="Undo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path></svg>
        </button>
        <button onclick="redo(${box.id})" class="p-1 rounded hover:opacity-70" title="Redo (Ctrl+Y)" aria-label="Redo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path></svg>
        </button>
        <div class="w-px h-4 mx-1" style="background: var(--border);"></div>
        <button onclick="exportBoxImage(${box.id})" class="p-1 rounded hover:opacity-70" title="Download Image" aria-label="Download Image">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
        <button onclick="clearBox(${box.id})" class="p-1 rounded hover:opacity-70 text-red-600" title="Clear box" aria-label="Clear box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
    
    <div class="relative flex-1" id="canvasContainer${box.id}" style="min-height: 0;" onmouseenter="window.lastActiveBoxId = ${box.id}">
      <canvas id="canvas${box.id}" class="absolute inset-0 ${settings.paperStyle}-texture cursor-crosshair"></canvas>
      <div id="objectLayer${box.id}" class="absolute inset-0 overflow-hidden pointer-events-none"></div>
    </div>
    
    <div class="flex items-center gap-1 px-2 py-1.5 border-t" style="background: var(--bg); border-color: var(--border);" onmouseenter="window.lastActiveBoxId = ${box.id}">
      <button onclick="setTool(${box.id}, 'draw')" class="tool-btn p-1.5 rounded" data-box="${box.id}" data-tool="draw" title="Draw" aria-label="Draw tool">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path></svg>
      </button>
      <button onclick="setTool(${box.id}, 'highlight')" class="tool-btn p-1.5 rounded" data-box="${box.id}" data-tool="highlight" title="Highlight" aria-label="Highlight tool">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path><path d="M15 5l4 4"></path><path d="M9 15l2 2"></path></svg>
      </button>
      <button onclick="setTool(${box.id}, 'erase')" class="tool-btn p-1.5 rounded" data-box="${box.id}" data-tool="erase" title="Erase" aria-label="Erase tool">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16c-.6-.6-.6-1.5 0-2.1l10-10c.6-.6 1.5-.6 2.1 0l6.9 6.9c.6.6.6 1.5 0 2.1L15 20"></path><path d="M6.5 13.5L12 8"></path></svg>
      </button>
      <button onclick="addText(${box.id})" class="tool-btn p-1.5 rounded ml-2" data-box="${box.id}" data-tool="text" title="Add text" aria-label="Add text">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
      </button>
      <label class="tool-btn p-1.5 rounded cursor-pointer" title="Add image" aria-label="Add image">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        <input type="file" accept="image/*" class="hidden" onchange="addImage(${box.id}, event)">
      </label>
      
      <div class="flex-1"></div>
      
      <input type="color" value="${settings.brushColor}" class="w-6 h-6 rounded cursor-pointer" style="border: none;" onchange="setBrushColor(${box.id}, this.value)" aria-label="Brush color">
      <input type="range" min="1" max="20" value="${settings.brushSize}" class="w-16" onchange="setBrushSize(${box.id}, this.value)" aria-label="Brush size">
    </div>
  `;

  setTimeout(() => initCanvas(box.id), 0);
  return div;
}

// Tool functions
function setTool(boxId, tool) {
  const state = boxStates[boxId];
  if (!state) return;
  
  state.tool = tool;
  
  document.querySelectorAll(`[data-box="${boxId}"]`).forEach(btn => {
    btn.classList.remove('tool-active');
    if (btn.dataset.tool === tool) {
      btn.classList.add('tool-active');
    }
  });

  const canvas = document.getElementById(`canvas${boxId}`);
  if (canvas) {
    if (tool === 'erase') canvas.style.cursor = 'cell';
    else if (tool === 'highlight') canvas.style.cursor = 'crosshair';
    else canvas.style.cursor = 'crosshair';
  }
}

function setBrushColor(boxId, color) {
  if (boxStates[boxId]) {
    boxStates[boxId].brushColor = color;
  }
}

function setBrushSize(boxId, size) {
  if (boxStates[boxId]) {
    boxStates[boxId].brushSize = parseInt(size);
  }
}

function addText(boxId) {
  const objectLayer = document.getElementById(`objectLayer${boxId}`);
  const container = document.getElementById(`canvasContainer${boxId}`);
  const box = boxData.find(b => b.id === boxId);
  if (!objectLayer || !container || !box) return;

  const textEl = createTextElement(boxId, 'Type here...', 20, 20 + (box.texts.length * 35), settings.brushColor, objectLayer, container);
  
  setTimeout(() => {
    textEl.focus();
    const range = document.createRange();
    range.selectNodeContents(textEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, 50);
  
  saveObjects(boxId);
}

function addImage(boxId, event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const box = boxData.find(b => b.id === boxId);
    const objectLayer = document.getElementById(`objectLayer${boxId}`);
    const container = document.getElementById(`canvasContainer${boxId}`);
    
    if (!box || !objectLayer || !container) return;

    const imgCount = box.images ? box.images.length : 0;
    createImageElement(boxId, e.target.result, 20 + (imgCount * 10), 20 + (imgCount * 10), objectLayer, container);
    saveObjects(boxId);
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function clearBox(boxId) {
  if (!confirm('Clear this box?')) return;

  saveSnapshot(boxId, true);

  const canvas = document.getElementById(`canvas${boxId}`);
  const objectLayer = document.getElementById(`objectLayer${boxId}`);
  const box = boxData.find(b => b.id === boxId);

  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (objectLayer) objectLayer.innerHTML = '';
  if (box) {
    box.drawings = [];
    box.texts = [];
    box.images = [];
  }
  saveToLocal();
}

function updateBoxName(boxId, name) {
  const box = boxData.find(b => b.id === boxId);
  if (box) {
    box.name = name;
    saveToLocal();
  }
}

function openSettings() {
  document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('active');
}

function setTheme(theme) {
  settings.theme = theme;
  document.body.dataset.theme = theme;
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.style.borderColor = btn.dataset.themeBtn === theme ? 'var(--accent)' : 'var(--border)';
  });
  saveToLocal();
}

function setPaperStyle(style) {
  settings.paperStyle = style;
  
  document.querySelectorAll('canvas').forEach(canvas => {
    canvas.classList.remove('paper-texture', 'grid-texture', 'dot-texture');
    canvas.classList.add(`${style}-texture`);
  });

  document.querySelectorAll('.paper-btn').forEach(btn => {
    btn.style.borderColor = btn.dataset.paperBtn === style ? 'var(--accent)' : 'var(--border)';
  });
  saveToLocal();
}

function updateBrushSize(value) {
  settings.brushSize = parseInt(value);
  document.getElementById('brushSizeValue').textContent = value + 'px';
  saveToLocal();
}

function setDefaultColor(color) {
  settings.brushColor = color;
  document.getElementById('customColorPicker').value = color;
  saveToLocal();
}

function applySettings() {
  setTheme(settings.theme);
  setPaperStyle(settings.paperStyle);
  document.getElementById('brushSizeSetting').value = settings.brushSize;
  document.getElementById('brushSizeValue').textContent = settings.brushSize + 'px';
  document.getElementById('customColorPicker').value = settings.brushColor;
}

// Share/Export functions
function shareSession() {
  boxData.forEach(box => saveObjects(box.id));
  
  const lightBoxData = boxData.map(box => ({
    id: box.id,
    name: box.name,
    texts: box.texts,
    drawings: [],     
    images: []        
  }));
  
  const data = JSON.stringify({ settings, boxData: lightBoxData });
  const encoded = btoa(encodeURIComponent(data));
  const url = window.location.origin + window.location.pathname + '#' + encoded;
  
  document.getElementById('shareLink').value = url;
  
  const hasHeavyData = boxData.some(b => 
    (b.drawings && b.drawings.length > 0) || 
    (b.images && b.images.length > 0)
  );
  
  const warningEl = document.getElementById('shareWarning');
  if (warningEl) {
    if (hasHeavyData) {
      warningEl.textContent = 'Note: Images and drawings are omitted from URL sharing due to length limits. Please use Export Session to save full data.';
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
      warningEl.textContent = '';
    }
  }

  document.getElementById('shareModal').classList.add('active');
}

function closeShare() {
  document.getElementById('shareModal').classList.remove('active');
}

function copyShareLink() {
  const input = document.getElementById('shareLink');
  input.select();
  document.execCommand('copy');
  alert('Link copied!');
}

function loadFromURL() {
  const hash = window.location.hash.slice(1);
  if (!hash) return false;

  try {
    const data = JSON.parse(decodeURIComponent(atob(hash)));
    if (data.settings) Object.assign(settings, data.settings);
    if (data.boxData) {
      data.boxData.forEach((box, i) => {
        if (boxData[i]) Object.assign(boxData[i], box);
      });
    }
    return true;
  } catch (e) {
    console.log('Could not load from URL');
    return false;
  }
}

function exportData() {
  boxData.forEach(box => saveObjects(box.id));
  const data = JSON.stringify({ settings, boxData }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'textbook-canvas-' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.settings) Object.assign(settings, data.settings);
      if (data.boxData) {
        data.boxData.forEach((box, i) => {
          if (boxData[i]) Object.assign(boxData[i], box);
        });
      }
      applySettings();
      renderBoxes();
      closeSettings();
      saveToLocal();
    } catch (err) {
      alert('Invalid file format');
    }
  };
  reader.readAsText(file);
}

function clearAll() {
  if (!confirm('Clear all boxes and reset settings?')) return;
  boxData.forEach(box => {
    box.drawings = [];
    box.texts = [];
    box.images = [];
    box.name = ['Notes', 'Sketches', 'Ideas', 'Drafts'][box.id - 1];
  });
  renderBoxes();
  closeSettings();
  saveToLocal();
}

function exportBoxImage(boxId) {
  saveObjects(boxId); 
  
  const box = boxData.find(b => b.id === boxId);
  const canvas = document.getElementById(`canvas${boxId}`);
  const container = document.getElementById(`canvasContainer${boxId}`);
  if (!box || !canvas || !container) return;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');

  ctx.fillStyle = getComputedStyle(canvas).backgroundColor;
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  ctx.drawImage(canvas, 0, 0);

  const objectLayer = document.getElementById(`objectLayer${boxId}`);
  
  const images = objectLayer.querySelectorAll('.draggable-image img');
  images.forEach(imgEl => {
    const parent = imgEl.parentElement;
    const x = parseInt(parent.style.left) || 0;
    const y = parseInt(parent.style.top) || 0;
    ctx.drawImage(imgEl, x, y, imgEl.width, imgEl.height);
  });

  const texts = objectLayer.querySelectorAll('.draggable-text');
  texts.forEach(wrapper => {
    const x = parseInt(wrapper.style.left) || 0;
    const y = parseInt(wrapper.style.top) || 0;
    const color = getComputedStyle(wrapper).color;
    
    // Draw sticky note background matching the visual UI
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x, y, wrapper.offsetWidth, wrapper.offsetHeight);
    
    const textEl = wrapper.querySelector('.sticky-content');
    if (textEl) {
      ctx.font = '16px "Source Sans 3", sans-serif';
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      const rawText = textEl.textContent.trim();
      if (rawText) {
        ctx.fillText(rawText, x + 16, y + 16);
      }
    }
  });

  const link = document.createElement('a');
  link.download = `textbook-box-${boxId}-${box.name}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}
