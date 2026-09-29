// Shared Photo Editor State Store
const STORAGE_KEY = 'pe_frontend_state';

const DEFAULT_SAMPLE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="%2385B7EB"/>
  <circle cx="620" cy="140" r="65" fill="%23FAC775"/>
  <ellipse cx="250" cy="620" rx="420" ry="250" fill="%231D9E75"/>
  <ellipse cx="600" cy="640" rx="450" ry="240" fill="%230F6E56"/>
</svg>`;

const defaultState = {
  imageUrl: DEFAULT_SAMPLE_SVG,
  brightness: 20,
  contrast: 10,
  saturation: 0,
  exposure: 0,
  filter: 'none',
  aspectRatio: 'free',
  rotation: 0,
  flipH: false,
  flipV: false
};

function getEditorState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
  } catch (e) {
    return { ...defaultState };
  }
}

function saveEditorState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function computeFilterCss(state) {
  const b = 1 + (state.brightness / 100);
  const c = 1 + (state.contrast / 100);
  const s = 1 + (state.saturation / 100);

  let css = `brightness(${b}) contrast(${c}) saturate(${s})`;

  switch (state.filter) {
    case 'bw': css += ' grayscale(100%)'; break;
    case 'sepia': css += ' sepia(85%) contrast(110%)'; break;
    case 'warm': css += ' sepia(35%) saturate(140%) hue-rotate(-15deg)'; break;
    case 'cool': css += ' hue-rotate(180deg) saturate(110%)'; break;
    case 'vintage': css += ' sepia(40%) contrast(120%) brightness(90%)'; break;
    case 'vivid': css += ' saturate(190%) contrast(115%)'; break;
    case 'drama': css += ' contrast(150%) brightness(90%) saturate(120%)'; break;
  }
  return css;
}

function applyPreviewStyles(imgElement, state) {
  if (!imgElement) return;
  imgElement.src = state.imageUrl;
  imgElement.style.filter = computeFilterCss(state);
  imgElement.style.transform = `rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`;
}
