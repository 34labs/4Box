// Global drag listeners
function setupGlobalDragListeners() {
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('touchmove', handleDragMove, { passive: false });
  document.addEventListener('touchend', handleDragEnd);
}

// Drag handlers
function handleDragMove(e) {
  if (!activeDrag) return;
  
  e.preventDefault();
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const container = activeDrag.container;
  const element = activeDrag.element;
  const rect = container.getBoundingClientRect();
  
  let newX = clientX - rect.left - activeDrag.offsetX;
  let newY = clientY - rect.top - activeDrag.offsetY;
  
  // Constrain to container bounds strictly
  const maxX = Math.max(0, rect.width - element.offsetWidth);
  const maxY = Math.max(0, rect.height - element.offsetHeight);
  
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));
  
  element.style.left = newX + 'px';
  element.style.top = newY + 'px';
  
  // Triggers autosave internally seamlessly without extreme spam: it resolves when dropped in canvas.js or via ui.js sync.
}

function handleDragEnd() {
  if (activeDrag) {
    activeDrag.element.classList.remove('dragging');
    
    // Auto-save location after dragging drop finishes via a global check
    if (typeof saveObjects === 'function' && window.lastActiveBoxId) {
      saveObjects(window.lastActiveBoxId);
    }
    
    activeDrag = null;
  }
}

// Make element draggable
function makeDraggable(element, container) {
  const startDrag = (e) => {
    // Don't intercept if they are actively editing text inside the sticky note
    if (element.classList.contains('editing')) return;
    
    // Ignore clicks specifically on the delete element control
    if (e.target.classList.contains('element-delete')) return;
    
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const rect = container.getBoundingClientRect();
    const elemRect = element.getBoundingClientRect();
    
    activeDrag = {
      element: element,
      container: container,
      offsetX: clientX - elemRect.left,
      offsetY: clientY - elemRect.top
    };
    
    element.classList.add('dragging');
    
    // We strictly block default browser behaviors ONLY for touch scrolling, retaining native text selection click/focus events gracefully!
    if (isTouch) {
      e.preventDefault();
    }
  };

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag, { passive: false });
}
