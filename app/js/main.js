// Initialize the application
function init() {
  const urlLoaded = loadFromURL();
  if (!urlLoaded) {
    loadFromLocal();
  }
  renderBoxes();
  applySettings();
  setupGlobalDragListeners();
}

// Global keybindings
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    // Only intercept if we aren't typing inside a focused input or text
    const tag = e.target.tagName;
    if (tag === 'INPUT' || e.target.classList.contains('editing') || e.target.isContentEditable) return;
    
    const boxId = window.lastActiveBoxId || 1;
    
    if (e.key === 'z' || e.key === 'Z') {
      if (e.shiftKey) redo(boxId);
      else undo(boxId);
      e.preventDefault();
    } else if (e.key === 'y' || e.key === 'Y') {
      redo(boxId);
      e.preventDefault();
    }
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
