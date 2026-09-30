import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  highlights: number; // -100 to 100
  shadows: number;    // -100 to 100
  warmth: number;     // -100 to 100
  vignette: number;   // 0 to 100
  exposure?: number;  // optional backwards compatibility
}

export type FilterType = 'none' | 'portrait' | 'pop' | 'smooth' | 'bw' | 'sepia' | 'warm' | 'cool' | 'vintage' | 'vivid' | 'drama' | 'fade';

export type AspectRatioType = 'free' | 'original' | 'square' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2' | '2:3';

export interface ImageLayer {
  id: string;
  name: string;
  type: 'base' | 'overlay' | 'image' | 'sticker';
  imageUrl: string;
  visible: boolean;
  opacity: number; // 0 to 100
  blendMode: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'color-dodge';
  x: number; // % (default 50)
  y: number; // % (default 50)
  scale: number; // default 1.0
  rotation: number; // deg (default 0)
  flipH: boolean;
  flipV: boolean;
}

export interface EditorState {
  imageUrl: string;
  originalImageUrl?: string;
  title?: string;
  adjustments: ImageAdjustments;
  filter: FilterType;
  aspectRatio: AspectRatioType;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  layers?: ImageLayer[];
  wbTemperature?: number;
  wbTint?: number;
  hdrStrength?: number;
  actionDescription?: string;
}

export interface RecentEdit {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  state: EditorState;
}

// Default scenic SVG artwork matching mockup illustration
const DEFAULT_SAMPLE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="800" height="600" fill="%2385B7EB"/>
  <circle cx="620" cy="140" r="65" fill="%23FAC775"/>
  <ellipse cx="250" cy="620" rx="420" ry="250" fill="%231D9E75"/>
  <ellipse cx="600" cy="640" rx="450" ry="240" fill="%230F6E56"/>
</svg>`;

const SAMPLE_RECENT_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="%2385B7EB"/>
  <circle cx="310" cy="70" r="32" fill="%23FAC775"/>
  <ellipse cx="120" cy="310" rx="210" ry="120" fill="%231D9E75"/>
  <ellipse cx="300" cy="320" rx="225" ry="120" fill="%230F6E56"/>
</svg>`;

const SAMPLE_RECENT_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="%23F0997B"/>
  <circle cx="310" cy="70" r="32" fill="%23FAEEDA"/>
  <ellipse cx="120" cy="310" rx="210" ry="120" fill="%23993C1D"/>
  <ellipse cx="300" cy="320" rx="225" ry="120" fill="%23712B13"/>
</svg>`;

const SAMPLE_RECENT_3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="%23AFA9EC"/>
  <circle cx="310" cy="70" r="32" fill="%23FAC775"/>
  <ellipse cx="120" cy="310" rx="210" ry="120" fill="%23534AB7"/>
  <ellipse cx="300" cy="320" rx="225" ry="120" fill="%233C3489"/>
</svg>`;

const SAMPLE_RECENT_4 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="%23D3D1C7"/>
  <circle cx="310" cy="70" r="32" fill="%23F1EFE8"/>
  <ellipse cx="120" cy="310" rx="210" ry="120" fill="%235F5E5A"/>
  <ellipse cx="300" cy="320" rx="225" ry="120" fill="%23444441"/>
</svg>`;

@Injectable({
  providedIn: 'root'
})
export class PhotoStateService {
  private initialState: EditorState = {
    imageUrl: DEFAULT_SAMPLE_SVG,
    originalImageUrl: DEFAULT_SAMPLE_SVG,
    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      highlights: 0,
      shadows: 0,
      warmth: 0,
      vignette: 0
    },
    filter: 'none',
    aspectRatio: 'free',
    rotation: 0,
    flipH: false,
    flipV: false
  };

  private stateSubject = new BehaviorSubject<EditorState>(this.initialState);
  public state$ = this.stateSubject.asObservable();

  private undoStack: EditorState[] = [];
  private redoStack: EditorState[] = [];

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  public canUndo$ = this.canUndoSubject.asObservable();

  private canRedoSubject = new BehaviorSubject<boolean>(false);
  public canRedo$ = this.canRedoSubject.asObservable();

  public recentEdits: RecentEdit[] = [
    {
      id: 'rec-1',
      title: 'Verdant Hills',
      imageUrl: SAMPLE_RECENT_1,
      date: 'Just now',
      state: { ...this.initialState, imageUrl: SAMPLE_RECENT_1 }
    },
    {
      id: 'rec-2',
      title: 'Terracotta Sunset',
      imageUrl: SAMPLE_RECENT_2,
      date: 'Yesterday',
      state: {
        imageUrl: SAMPLE_RECENT_2,
        adjustments: { brightness: 10, contrast: 25, saturation: 15, highlights: 0, shadows: 0, warmth: 30, vignette: 10 },
        filter: 'warm',
        aspectRatio: '1:1',
        rotation: 0,
        flipH: false,
        flipV: false
      }
    },
    {
      id: 'rec-3',
      title: 'Violet Dusk',
      imageUrl: SAMPLE_RECENT_3,
      date: '2 days ago',
      state: {
        imageUrl: SAMPLE_RECENT_3,
        adjustments: { brightness: 0, contrast: 15, saturation: 20, highlights: 0, shadows: 0, warmth: -10, vignette: 5 },
        filter: 'cool',
        aspectRatio: '4:3',
        rotation: 0,
        flipH: false,
        flipV: false
      }
    },
    {
      id: 'rec-4',
      title: 'Monochrome Stone',
      imageUrl: SAMPLE_RECENT_4,
      date: '3 days ago',
      state: {
        imageUrl: SAMPLE_RECENT_4,
        adjustments: { brightness: 5, contrast: 30, saturation: -100, highlights: 0, shadows: 0, warmth: 0, vignette: 20 },
        filter: 'bw',
        aspectRatio: '16:9',
        rotation: 0,
        flipH: false,
        flipV: false
      }
    }
  ];

  constructor() {
    this.loadPersistedRecents();
  }

  get currentState(): EditorState {
    return this.stateSubject.value;
  }

  public setImage(url: string, title: string = 'New Edit') {
    this.clearHistory();
    const newState: EditorState = {
      imageUrl: url,
      originalImageUrl: url,
      title,
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        highlights: 0,
        shadows: 0,
        warmth: 0,
        vignette: 0
      },
      filter: 'none',
      aspectRatio: 'free',
      rotation: 0,
      flipH: false,
      flipV: false
    };
    this.stateSubject.next(newState);
  }

  public applyCroppedImage(croppedDataUrl: string, actionName: string = 'Crop') {
    this.pushHistory(undefined, actionName);
    const current = this.stateSubject.value;
    let updatedLayers = current.layers ? JSON.parse(JSON.stringify(current.layers)) : undefined;
    if (updatedLayers && Array.isArray(updatedLayers)) {
      const base = updatedLayers.find((l: ImageLayer) => l.type === 'base');
      if (base) {
        base.imageUrl = croppedDataUrl;
      }
    }
    this.stateSubject.next({
      ...current,
      imageUrl: croppedDataUrl,
      layers: updatedLayers,
      aspectRatio: 'free',
      rotation: 0,
      flipH: false,
      flipV: false,
      actionDescription: actionName
    });
  }

  public loadRecentEdit(edit: RecentEdit) {
    this.pushHistory(undefined, `Open: ${edit.title}`);
    this.stateSubject.next({ ...edit.state });
  }

  public updateAdjustments(
    adjustments: Partial<ImageAdjustments>,
    actionDescription: string = 'Tune Image',
    skipPushHistory: boolean = false
  ) {
    if (!skipPushHistory) {
      this.pushHistory(undefined, actionDescription);
    }
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      adjustments: {
        ...current.adjustments,
        ...adjustments
      },
      actionDescription
    });
  }

  public setAdjustmentQuick(key: keyof ImageAdjustments, value: number) {
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      adjustments: {
        ...current.adjustments,
        [key]: value
      }
    });
  }

  public commitAdjustmentHistory(actionName: string = 'Tune Image') {
    this.pushHistory(undefined, actionName);
  }

  public setFilter(filter: FilterType) {
    this.pushHistory(undefined, `Filter: ${filter}`);
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      filter
    });
  }

  public setAspectRatio(aspectRatio: AspectRatioType) {
    this.pushHistory(undefined, `Aspect: ${aspectRatio}`);
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      aspectRatio
    });
  }

  public rotate() {
    this.pushHistory(undefined, 'Rotate 90°');
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      rotation: (current.rotation + 90) % 360
    });
  }

  public flipHorizontal() {
    this.pushHistory(undefined, 'Flip Horizontal');
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      flipH: !current.flipH
    });
  }

  public flipVertical() {
    this.pushHistory(undefined, 'Flip Vertical');
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      flipV: !current.flipV
    });
  }

  public resetAll() {
    this.pushHistory(undefined, 'Reset Adjustments');
    const current = this.stateSubject.value;
    this.stateSubject.next({
      ...current,
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        highlights: 0,
        shadows: 0,
        warmth: 0,
        vignette: 0
      },
      filter: 'none',
      aspectRatio: 'free',
      rotation: 0,
      flipH: false,
      flipV: false
    });
  }

  public undo(): EditorState | null {
    if (this.undoStack.length === 0) return null;
    const previous = this.undoStack.pop()!;
    const current = this.cloneState(this.stateSubject.value);
    this.redoStack.push(current);
    this.stateSubject.next(previous);
    this.updateHistorySubjects();
    return previous;
  }

  public redo(): EditorState | null {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop()!;
    const current = this.cloneState(this.stateSubject.value);
    this.undoStack.push(current);
    this.stateSubject.next(next);
    this.updateHistorySubjects();
    return next;
  }

  public pushHistory(stateToPush?: EditorState, actionDescription?: string) {
    const toPush = stateToPush ? this.cloneState(stateToPush) : this.cloneState(this.stateSubject.value);
    if (actionDescription) {
      toPush.actionDescription = actionDescription;
    }
    this.undoStack.push(toPush);
    if (this.undoStack.length > 35) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.updateHistorySubjects();
  }

  public clearHistory() {
    this.undoStack = [];
    this.redoStack = [];
    this.updateHistorySubjects();
  }

  public setStateDirectly(state: EditorState) {
    this.stateSubject.next(this.cloneState(state));
  }

  private updateHistorySubjects() {
    this.canUndoSubject.next(this.undoStack.length > 0);
    this.canRedoSubject.next(this.redoStack.length > 0);
  }

  public cloneState(state: EditorState): EditorState {
    if (!state) return { ...this.initialState };
    return JSON.parse(JSON.stringify(state));
  }

  public addRecentEdit(title: string, imageUrl: string, state: EditorState) {
    const existingIndex = this.recentEdits.findIndex(
      e => e.imageUrl === imageUrl || (e.title === title && e.title !== 'Untitled Photo')
    );
    if (existingIndex !== -1) {
      const existing = this.recentEdits[existingIndex];
      existing.date = 'Just now';
      existing.imageUrl = imageUrl;
      existing.state = this.cloneState(state);
      this.recentEdits.splice(existingIndex, 1);
      this.recentEdits.unshift(existing);
    } else {
      const newEdit: RecentEdit = {
        id: 'rec-' + Date.now(),
        title,
        imageUrl,
        date: 'Just now',
        state: this.cloneState(state)
      };
      this.recentEdits.unshift(newEdit);
      if (this.recentEdits.length > 10) {
        this.recentEdits.pop();
      }
    }
    this.persistRecents();
  }

  public deleteRecentEdit(id: string) {
    this.recentEdits = this.recentEdits.filter(e => e.id !== id);
    this.persistRecents();
  }

  public deleteRecentEdits(ids: string[]) {
    const idSet = new Set(ids);
    this.recentEdits = this.recentEdits.filter(e => !idSet.has(e.id));
    this.persistRecents();
  }

  public persistRecents() {
    try {
      localStorage.setItem('pe_recent_edits', JSON.stringify(this.recentEdits));
    } catch {
      // Ignore quota exceeded for very large images
      try {
        if (this.recentEdits.length > 4) {
          localStorage.setItem('pe_recent_edits', JSON.stringify(this.recentEdits.slice(0, 4)));
        }
      } catch {}
    }
  }

  public loadPersistedRecents() {
    try {
      const data = localStorage.getItem('pe_recent_edits');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.recentEdits = parsed;
        }
      }
    } catch {
      // Use defaults
    }
  }

  public saveToUserGallery(photo: { id?: string; title: string; imageUrl: string; album: 'downloads' | 'recent' | 'camera' }) {
    try {
      const raw = localStorage.getItem('pe_user_gallery_photos');
      const existing = raw ? JSON.parse(raw) : [];
      const newEntry = {
        id: photo.id || ('user-gal-' + Date.now()),
        title: photo.title || 'Edited Photo',
        imageUrl: photo.imageUrl,
        date: 'Just now',
        album: photo.album
      };
      // Keep max 25, deduplicate by imageUrl
      const updated = [newEntry, ...existing.filter((p: any) => p.imageUrl !== photo.imageUrl && p.id !== newEntry.id)].slice(0, 25);
      try {
        localStorage.setItem('pe_user_gallery_photos', JSON.stringify(updated));
      } catch (quotaErr) {
        // Quota exceeded: trim down to 6 most recent
        const trimmed = [newEntry, ...existing.slice(0, 5)];
        localStorage.setItem('pe_user_gallery_photos', JSON.stringify(trimmed));
      }
    } catch (e) {
      console.warn('Error saving to user gallery storage:', e);
    }
  }

  public createStorageOptimizedDataUrl(dataUrl: string, maxDim: number = 1000): Promise<string> {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:') || dataUrl.length < 200000) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  public loadSafeImage(src: string): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
      if (!src) {
        reject(new Error('No image URL'));
        return;
      }

      // If already a data URL or blob URL, load directly
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
        return;
      }

      // Try fetching as Blob with CORS and convert to persistent Data URL (never tainted, never revoked)
      try {
        const separator = src.includes('?') ? '&' : '?';
        const res = await fetch(`${src}${separator}_cors=${Date.now()}`, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => this.fallbackLoadImage(src).then(resolve).catch(reject);
            img.src = dataUrl;
          };
          reader.onerror = () => this.fallbackLoadImage(src).then(resolve).catch(reject);
          reader.readAsDataURL(blob);
          return;
        }
      } catch (fetchErr) {
        // Fallback to Image with anonymous
      }

      this.fallbackLoadImage(src).then(resolve).catch(reject);
    });
  }

  private fallbackLoadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Last resort: load without anonymous
        const raw = new Image();
        raw.onload = () => resolve(raw);
        raw.onerror = reject;
        raw.src = src;
      };
      img.src = src;
    });
  }

  public getCanvasOutput(
    canvas: HTMLCanvasElement,
    format: string = 'image/jpeg',
    quality: number = 0.92
  ): Promise<{ dataUrl: string; blob: Blob }> {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              let dataUrl = '';
              try {
                dataUrl = canvas.toDataURL(format, quality);
              } catch {
                dataUrl = await new Promise<string>((res) => {
                  const r = new FileReader();
                  r.onloadend = () => res(r.result as string);
                  r.readAsDataURL(blob);
                });
              }
              resolve({ dataUrl, blob });
            } else {
              const dataUrl = canvas.toDataURL(format, quality);
              const parts = dataUrl.split(',');
              const bstr = atob(parts[1]);
              let n = bstr.length;
              const u8 = new Uint8Array(n);
              while (n--) u8[n] = bstr.charCodeAt(n);
              const b = new Blob([u8], { type: format });
              resolve({ dataUrl, blob: b });
            }
          },
          format,
          quality
        );
      } catch (err) {
        try {
          const dataUrl = canvas.toDataURL(format, quality);
          const parts = dataUrl.split(',');
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8 = new Uint8Array(n);
          while (n--) u8[n] = bstr.charCodeAt(n);
          const b = new Blob([u8], { type: format });
          resolve({ dataUrl, blob: b });
        } catch (fatal) {
          reject(fatal);
        }
      }
    });
  }

  public downloadBlobOrDataUrl(data: Blob | string, filename: string) {
    let objectUrl: string;
    let needsRevoke = false;

    if (data instanceof Blob) {
      objectUrl = URL.createObjectURL(data);
      needsRevoke = true;
    } else if (typeof data === 'string' && data.startsWith('data:')) {
      try {
        const parts = data.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        objectUrl = URL.createObjectURL(blob);
        needsRevoke = true;
      } catch {
        objectUrl = data;
      }
    } else {
      objectUrl = data;
    }

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.style.position = 'fixed';
    a.style.top = '-9999px';
    a.style.left = '-9999px';
    a.style.opacity = '0';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      if (needsRevoke) {
        URL.revokeObjectURL(objectUrl);
      }
    }, 6000);
  }

  public saveProject(title: string, state: EditorState): RecentEdit {
    const existingIndex = this.recentEdits.findIndex(
      e => (state.originalImageUrl && e.state?.originalImageUrl === state.originalImageUrl) ||
           (e.imageUrl === state.imageUrl) ||
           (e.title === title && e.title !== 'Untitled Photo')
    );
    let saved: RecentEdit;
    if (existingIndex !== -1) {
      saved = this.recentEdits[existingIndex];
      saved.date = 'Just now';
      saved.title = title || saved.title;
      saved.imageUrl = state.imageUrl;
      saved.state = this.cloneState(state);
      this.recentEdits.splice(existingIndex, 1);
      this.recentEdits.unshift(saved);
    } else {
      saved = {
        id: 'rec-' + Date.now(),
        title: title || 'Saved Project',
        imageUrl: state.imageUrl,
        date: 'Just now',
        state: this.cloneState(state)
      };
      this.recentEdits.unshift(saved);
      if (this.recentEdits.length > 15) {
        this.recentEdits.pop();
      }
    }
    this.persistRecents();
    return saved;
  }

  public getFilterCssString(state: EditorState): string {
    const adj = state.adjustments;
    const b = 1 + (adj.brightness / 100);
    const c = 1 + (adj.contrast / 100);
    const s = 1 + (adj.saturation / 100);
    const hl = 1 + (adj.highlights / 200);
    const sh = 1 + (adj.shadows / 200);

    let filterCss = `brightness(${b * hl * sh}) contrast(${c}) saturate(${s})`;

    if (adj.warmth !== 0) {
      if (adj.warmth > 0) {
        filterCss += ` sepia(${adj.warmth * 0.35}%) hue-rotate(${-adj.warmth * 0.15}deg)`;
      } else {
        filterCss += ` hue-rotate(${-adj.warmth * 0.3}deg)`;
      }
    }

    switch (state.filter) {
      case 'portrait':
        filterCss += ' contrast(106%) brightness(104%) saturate(112%)';
        break;
      case 'pop':
        filterCss += ' contrast(118%) saturate(135%) brightness(105%)';
        break;
      case 'smooth':
        filterCss += ' contrast(95%) brightness(108%) saturate(92%)';
        break;
      case 'fade':
        filterCss += ' contrast(90%) brightness(110%) sepia(20%)';
        break;
      case 'bw':
        filterCss += ' grayscale(100%) contrast(120%)';
        break;
      case 'sepia':
        filterCss += ' sepia(85%) contrast(110%)';
        break;
      case 'warm':
        filterCss += ' sepia(35%) saturate(140%) hue-rotate(-15deg)';
        break;
      case 'cool':
        filterCss += ' hue-rotate(180deg) saturate(110%)';
        break;
      case 'vintage':
        filterCss += ' sepia(40%) contrast(120%) brightness(90%)';
        break;
      case 'vivid':
        filterCss += ' saturate(190%) contrast(115%)';
        break;
      case 'drama':
        filterCss += ' contrast(150%) brightness(90%) saturate(120%)';
        break;
      default:
        break;
    }
    return filterCss;
  }
}
