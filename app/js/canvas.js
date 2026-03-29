// Initialize canvas for a box
function initCanvas(boxId) {
  const canvas = document.getElementById(`canvas${boxId}`);
  const container = document.getElementById(`canvasContainer${boxId}`);
  
  if (!canvas || !container) return;

  // Set up state
  boxStates[boxId] = {
    isDrawing: false,
    tool: 'draw',
    brushColor: settings.brushColor,
    brushSize: settings.brushSize,
    lastX: 0,
    lastY: 0
  };

  // We use ResizeObserver to accurately synchronize physical CSS pixels and Canvas bitmap width/height.
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const rect = entry.contentRect;
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      
      let tempCanvas = null;
      if (canvas.width > 1 && canvas.height > 1) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tempCanvas) {
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        restoreDrawings(boxId);
      }
    }
  });

  resizeObserver.observe(container);
  restoreObjects(boxId);

  // Event listeners
  canvas.addEventListener('mousedown', (e) => startDrawing(boxId, e));
  canvas.addEventListener('mousemove', (e) => draw(boxId, e));
  canvas.addEventListener('mouseup', () => stopDrawing(boxId));
  canvas.addEventListener('mouseleave', () => stopDrawing(boxId));

  // Touch events
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(boxId, e.touches[0]);
  }, { passive: false });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(boxId, e.touches[0]);
  }, { passive: false });
  
  canvas.addEventListener('touchend', () => stopDrawing(boxId));

  setTool(boxId, 'draw');
}

// History stack logic (Undo/Redo)
function saveSnapshot(boxId, clearRedo = true) {
  const canvas = document.getElementById(`canvas${boxId}`);
  if (!canvas) return;
  undoStacks[boxId].push(canvas.toDataURL());
  if (clearRedo) redoStacks[boxId] = [];
}

function undo(boxId) {
  if (undoStacks[boxId] && undoStacks[boxId].length > 0) {
    const canvas = document.getElementById(`canvas${boxId}`);
    if (!canvas) return;
    redoStacks[boxId].push(canvas.toDataURL());
    const snapshot = undoStacks[boxId].pop();
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveDrawings(boxId); 
    };
    img.src = snapshot;
  }
}

function redo(boxId) {
  if (redoStacks[boxId] && redoStacks[boxId].length > 0) {
    const canvas = document.getElementById(`canvas${boxId}`);
    if (!canvas) return;
    undoStacks[boxId].push(canvas.toDataURL());
    const snapshot = redoStacks[boxId].pop();
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveDrawings(boxId);
    };
    img.src = snapshot;
  }
}

// Drawing functions
function startDrawing(boxId, e) {
  const state = boxStates[boxId];
  if (!state) return;
  
  saveSnapshot(boxId); // Save purely before lines are drawn
  window.lastActiveBoxId = boxId;
  
  state.isDrawing = true;
  const canvas = document.getElementById(`canvas${boxId}`);
  const rect = canvas.getBoundingClientRect();
  state.lastX = e.clientX - rect.left;
  state.lastY = e.clientY - rect.top;
}

function draw(boxId, e) {
  const state = boxStates[boxId];
  if (!state || !state.isDrawing) return;

  const canvas = document.getElementById(`canvas${boxId}`);
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.beginPath();
  ctx.moveTo(state.lastX, state.lastY);
  ctx.lineTo(x, y);

  if (state.tool === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = Math.max(1, state.brushSize * 3);
  } else if (state.tool === 'highlight') {
    // Highlighter mode
    ctx.globalCompositeOperation = 'multiply';
    let color = state.brushColor || '#c45c3e';
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1,3), 16);
      const g = parseInt(color.slice(3,5), 16);
      const b = parseInt(color.slice(5,7), 16);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
    } else {
      ctx.strokeStyle = color; 
      ctx.globalAlpha = 0.3;
    }
    ctx.lineWidth = Math.max(1, state.brushSize * 3);
  } else {
    // Standard Draw mode
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = state.brushColor || '#2c2825';
    ctx.lineWidth = Math.max(1, state.brushSize);
  }

  ctx.stroke();
  ctx.globalAlpha = 1.0; 

  state.lastX = x;
  state.lastY = y;
}

function stopDrawing(boxId) {
  const state = boxStates[boxId];
  if (!state) return;
  
  if (state.isDrawing) {
    saveDrawings(boxId);
  }
  state.isDrawing = false;
}

// Save/restore drawings
function saveDrawings(boxId) {
  const canvas = document.getElementById(`canvas${boxId}`);
  if (!canvas) return;
  
  const box = boxData.find(b => b.id === boxId);
  if (box) {
    box.drawings = canvas.toDataURL(); // Persist internally natively
    saveToLocal(); // Trigger auto-save locally after drawing stroke completes
  }
}

function restoreDrawings(boxId) {
  const box = boxData.find(b => b.id === boxId);
  const canvas = document.getElementById(`canvas${boxId}`);
  if (!box || !canvas || !box.drawings || box.drawings.length === 0) return;

  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };
  img.src = box.drawings;
}

// Restore objects (texts and images)
function restoreObjects(boxId) {
  const box = boxData.find(b => b.id === boxId);
  const objectLayer = document.getElementById(`objectLayer${boxId}`);
  const container = document.getElementById(`canvasContainer${boxId}`);
  
  if (!box || !objectLayer || !container) return;

  objectLayer.innerHTML = '';
  
  if (box.texts && box.texts.length > 0) {
    box.texts.forEach((textData, index) => {
      createTextElement(boxId, textData.content, textData.x, textData.y, textData.color, objectLayer, container);
    });
  }

  if (box.images && box.images.length > 0) {
    box.images.forEach((imgData, index) => {
      createImageElement(boxId, imgData.src, imgData.x, imgData.y, objectLayer, container);
    });
  }
}

// Create text element (Sticky Note representation)
function createTextElement(boxId, content, x, y, color, objectLayer, container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'draggable draggable-text absolute';
  wrapper.style.cssText = `left: ${x}px; top: ${y}px; color: ${color || settings.brushColor};`;
  
  const textEl = document.createElement('div');
  textEl.className = 'sticky-content';
  textEl.contentEditable = true;
  textEl.textContent = content;
  
  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'element-delete';
  deleteBtn.innerHTML = '&times;';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    wrapper.remove();
    saveObjects(boxId);
  };

  wrapper.appendChild(textEl);
  wrapper.appendChild(deleteBtn);

  // Trigger editing focuses dynamically mimicking native apps precisely
  textEl.addEventListener('focus', () => {
    wrapper.classList.add('editing');
  });

  textEl.addEventListener('blur', () => {
    wrapper.classList.remove('editing');
    if (!textEl.textContent.trim()) {
      wrapper.remove();
    }
    saveObjects(boxId);
  });
  
  // Single clicks on wrapper naturally push selection into inner node smoothly
  wrapper.addEventListener('click', (e) => {
    if (!wrapper.classList.contains('editing') && e.target !== deleteBtn) {
      textEl.focus();
    }
  });

  makeDraggable(wrapper, container);
  objectLayer.appendChild(wrapper);
  
  return textEl;
}

// Create image element
function createImageElement(boxId, src, x, y, objectLayer, container) {
  const wrapper = document.createElement('div');
  wrapper.className = 'draggable draggable-image absolute';
  wrapper.style.cssText = `left: ${x}px; top: ${y}px;`;
  
  const img = document.createElement('img');
  img.src = src;
  img.className = 'max-w-[120px] max-h-[120px] object-contain rounded shadow pointer-events-none';
  img.draggable = false;
  wrapper.appendChild(img);
  
  const deleteBtn = document.createElement('span');
  deleteBtn.className = 'element-delete';
  deleteBtn.innerHTML = '&times;';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    wrapper.remove();
    saveObjects(boxId);
  };
  wrapper.appendChild(deleteBtn);

  makeDraggable(wrapper, container);
  objectLayer.appendChild(wrapper);
  
  return wrapper;
}

// Save objects to boxData
function saveObjects(boxId) {
  const box = boxData.find(b => b.id === boxId);
  const objectLayer = document.getElementById(`objectLayer${boxId}`);
  const container = document.getElementById(`canvasContainer${boxId}`);
  
  if (!box || !objectLayer || !container) return;

  box.texts = [];
  objectLayer.querySelectorAll('.draggable-text').forEach(wrapper => {
    const textEl = wrapper.querySelector('.sticky-content');
    if (textEl) {
      let rawText = textEl.textContent.trim();
      if (rawText) {
        box.texts.push({
          content: rawText,
          x: parseInt(wrapper.style.left) || 0,
          y: parseInt(wrapper.style.top) || 0,
          color: wrapper.style.color // Wrapper preserves color natively
        });
      }
    }
  });

  box.images = [];
  objectLayer.querySelectorAll('.draggable-image').forEach(imgWrapper => {
    const img = imgWrapper.querySelector('img');
    if (img) {
      box.images.push({
        src: img.src,
        x: parseInt(imgWrapper.style.left) || 0,
        y: parseInt(imgWrapper.style.top) || 0
      });
    }
  });
  
  saveToLocal();
}
