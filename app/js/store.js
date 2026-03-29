// Initialize settings first
const settings = {
  theme: 'cream',
  paperStyle: 'paper',
  brushSize: 3,
  brushColor: '#2c2825'
};

// Initialize box data
const boxData = [
  { id: 1, name: 'Notes', drawings: [], texts: [], images: [] },
  { id: 2, name: 'Sketches', drawings: [], texts: [], images: [] },
  { id: 3, name: 'Ideas', drawings: [], texts: [], images: [] },
  { id: 4, name: 'Drafts', drawings: [], texts: [], images: [] }
];

// State for each box
const boxStates = {};

// Undo / Redo Stacks (per box id)
const undoStacks = { 1: [], 2: [], 3: [], 4: [] };
const redoStacks = { 1: [], 2: [], 3: [], 4: [] };

// Global drag state
let activeDrag = null;

// Track active canvas for global undo/redo 
window.lastActiveBoxId = 1;

// Auto-save logic
function saveToLocal() {
  try {
    const data = JSON.stringify({ settings, boxData });
    localStorage.setItem('4box_app_data', data);
  } catch (e) {
    console.warn('LocalStorage quota exceeded or unavailable. Auto-save failed.');
  }
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem('4box_app_data');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.settings) Object.assign(settings, data.settings);
      if (data.boxData) {
        data.boxData.forEach((box, i) => {
          if (boxData[i]) Object.assign(boxData[i], box);
        });
      }
      return true;
    }
  } catch(e) {
    console.warn('Could not read from LocalStorage', e);
  }
  return false;
}
