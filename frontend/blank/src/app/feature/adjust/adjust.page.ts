import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  PhotoStateService,
  EditorState,
  ImageAdjustments,
  FilterType,
  AspectRatioType
} from '../photo-state.service';
import { Share } from '@capacitor/share';

export interface TuneParamOption {
  id: keyof ImageAdjustments;
  label: string;
  min: number;
  max: number;
  icon: string;
}

export interface FilterStylePreset {
  id: FilterType;
  label: string;
  cssStyle: string;
}

interface ImageRenderBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ToolItem {
  id: string;
  label: string;
  icon: string;
  category: 'refine' | 'fix' | 'style';
  badge?: string;
  badgeColor?: 'blue' | 'purple' | 'orange';
}

export interface OverlayPreset {
  id: string;
  name: string;
  category: 'light' | 'texture' | 'sticker' | 'color';
  icon: string;
  dataUrl: string;
  recommendedBlend: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'color-dodge';
  defaultOpacity: number;
}

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

const PRESET_GOLDEN_LEAK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><defs><radialGradient id="gl" cx="20%" cy="15%" r="80%"><stop offset="0%" stop-color="%23fff1f2" stop-opacity="1"/><stop offset="25%" stop-color="%23f97316" stop-opacity="0.85"/><stop offset="55%" stop-color="%23e11d48" stop-opacity="0.5"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient><radialGradient id="gl2" cx="85%" cy="85%" r="60%"><stop offset="0%" stop-color="%23f59e0b" stop-opacity="0.6"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient></defs><rect width="800" height="600" fill="%23000000"/><rect width="800" height="600" fill="url(%23gl)"/><rect width="800" height="600" fill="url(%23gl2)"/></svg>';

const PRESET_BOKEH = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><defs><radialGradient id="b1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.95"/><stop offset="50%" stop-color="%2338bdf8" stop-opacity="0.5"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient><radialGradient id="b2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23fef08a" stop-opacity="0.95"/><stop offset="50%" stop-color="%23f59e0b" stop-opacity="0.6"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient><radialGradient id="b3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23f472b6" stop-opacity="0.9"/><stop offset="50%" stop-color="%23ec4899" stop-opacity="0.4"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient></defs><rect width="800" height="600" fill="%23000000"/><circle cx="160" cy="180" r="95" fill="url(%23b1)"/><circle cx="650" cy="220" r="115" fill="url(%23b2)"/><circle cx="340" cy="430" r="75" fill="url(%23b3)"/><circle cx="500" cy="110" r="55" fill="url(%23b2)"/><circle cx="210" cy="490" r="65" fill="url(%23b1)"/><circle cx="710" cy="470" r="85" fill="url(%23b3)"/><circle cx="420" cy="260" r="45" fill="url(%23b2)"/><circle cx="680" cy="90" r="35" fill="url(%23b1)"/></svg>';

const PRESET_FILM_DUST = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><rect width="800" height="600" fill="%23000000"/><g stroke="%23ffffff" opacity="0.75" stroke-linecap="round"><line x1="120" y1="40" x2="122" y2="110" stroke-width="1.2"/><line x1="450" y1="180" x2="453" y2="290" stroke-width="1.6"/><line x1="680" y1="80" x2="682" y2="190" stroke-width="1.2"/><line x1="260" y1="340" x2="264" y2="440" stroke-width="1.4"/><line x1="570" y1="420" x2="573" y2="530" stroke-width="1.5"/><circle cx="180" cy="140" r="1.5" fill="%23ffffff"/><circle cx="290" cy="90" r="2" fill="%23ffffff"/><circle cx="610" cy="320" r="1.5" fill="%23ffffff"/><circle cx="140" cy="460" r="2" fill="%23ffffff"/><circle cx="720" cy="490" r="1.5" fill="%23ffffff"/><circle cx="470" cy="110" r="2.2" fill="%23ffffff"/><circle cx="380" cy="510" r="1.8" fill="%23ffffff"/><path d="M 320 230 Q 325 245, 321 260" stroke-width="1.3" fill="none"/><path d="M 510 60 Q 516 75, 513 90" stroke-width="1.3" fill="none"/></g></svg>';

const PRESET_PRISM = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><defs><linearGradient id="rb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="15%" stop-color="%23000000" stop-opacity="0"/><stop offset="35%" stop-color="%23ef4444" stop-opacity="0.8"/><stop offset="45%" stop-color="%23f59e0b" stop-opacity="0.85"/><stop offset="55%" stop-color="%2310b981" stop-opacity="0.85"/><stop offset="65%" stop-color="%2306b6d4" stop-opacity="0.85"/><stop offset="75%" stop-color="%238b5cf6" stop-opacity="0.8"/><stop offset="90%" stop-color="%23000000" stop-opacity="0"/></linearGradient></defs><rect width="800" height="600" fill="%23000000"/><rect width="800" height="600" fill="url(%23rb)"/></svg>';

const PRESET_FOG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><defs><radialGradient id="fg1" cx="50%" cy="60%" r="50%"><stop offset="0%" stop-color="%23e2e8f0" stop-opacity="0.7"/><stop offset="60%" stop-color="%2394a3b8" stop-opacity="0.3"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient><radialGradient id="fg2" cx="30%" cy="30%" r="45%"><stop offset="0%" stop-color="%23cbd5e1" stop-opacity="0.6"/><stop offset="100%" stop-color="%23000000" stop-opacity="0"/></radialGradient></defs><rect width="800" height="600" fill="%23000000"/><rect width="800" height="600" fill="url(%23fg1)"/><rect width="800" height="600" fill="url(%23fg2)"/></svg>';

const PRESET_NEON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500"><defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(%23glow)"><path d="M 250 360 C 180 290, 110 230, 110 160 C 110 105, 150 65, 205 65 C 235 65, 260 80, 275 105 C 290 80, 315 65, 345 65 C 400 65, 440 105, 440 160 C 440 230, 370 290, 300 360 L 275 385 Z" fill="none" stroke="%23ec4899" stroke-width="14" stroke-linecap="round"/><polygon points="90,320 102,345 130,355 102,365 90,390 78,365 50,355 78,345" fill="%2338bdf8"/><polygon points="380,280 390,305 415,313 390,321 380,345 370,321 345,313 370,305" fill="%23facc15"/><circle cx="275" cy="180" r="16" fill="%23ffffff" opacity="0.8"/></g></svg>';

const PRESET_VINTAGE_STAMP = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500"><g stroke="%23ffffff" fill="none" opacity="0.85" stroke-linecap="round"><circle cx="250" cy="250" r="180" stroke-width="6" stroke-dasharray="12,8"/><circle cx="250" cy="250" r="150" stroke-width="3"/><polygon points="250,150 262,185 298,185 270,208 280,242 250,222 220,242 230,208 202,185 238,185" fill="%23ffffff"/><text x="250" y="295" font-family="sans-serif" font-size="28" font-weight="900" fill="%23ffffff" text-anchor="middle" letter-spacing="4">ORIGINAL</text><text x="250" y="325" font-family="sans-serif" font-size="16" font-weight="600" fill="%23ffffff" text-anchor="middle" letter-spacing="3">EDITION 1984</text></g></svg>';

const PRESET_EMBERS = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600"><rect width="800" height="600" fill="%23000000"/><g filter="blur(1px)"><circle cx="120" cy="450" r="6" fill="%23f59e0b"/><circle cx="240" cy="380" r="4" fill="%23ef4444"/><circle cx="380" cy="490" r="8" fill="%23fbbf24"/><circle cx="510" cy="340" r="5" fill="%23f97316"/><circle cx="650" cy="460" r="7" fill="%23f59e0b"/><circle cx="190" cy="240" r="3" fill="%23fbbf24"/><circle cx="430" cy="210" r="4" fill="%23f97316"/><circle cx="580" cy="260" r="3.5" fill="%23ef4444"/><circle cx="720" cy="290" r="5" fill="%23fbbf24"/><circle cx="310" cy="140" r="2.5" fill="%23f59e0b"/></g></svg>';

@Component({
  selector: 'app-adjust',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adjust.page.html',
  styleUrls: ['./adjust.page.scss']
})
export class AdjustPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('previewStage', { static: false }) previewStage!: ElementRef<HTMLDivElement>;
  @ViewChild('targetImg', { static: false }) targetImg!: ElementRef<HTMLImageElement>;
  @ViewChild('brushCanvas', { static: false }) brushCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('overlayFileInput', { static: false }) overlayFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('addLayerFileInput', { static: false }) addLayerFileInput!: ElementRef<HTMLInputElement>;

  public state!: EditorState;
  public filterCss: string = '';
  public isComparing = false;
  private sub = new Subscription();

  // Navigation & Tool State
  public activeMainTab: 'styles' | 'tools' | 'export' = 'tools';
  public activeToolMode:
    | 'none'
    | 'tune'
    | 'crop'
    | 'perspective'
    | 'expand'
    | 'hdr'
    | 'curves'
    | 'selective'
    | 'brush'
    | 'colorgrade'
    | 'whitebalance'
    | 'overlay'
    | 'healing' = 'none';

  // Tools Sheet State (Matching Snapseed Screenshots)
  public showCustomiseSheet = false;
  public toolFilterCategory: 'all' | 'refine' | 'fix' | 'style' = 'all';
  public toolSearchQuery = '';

  // All 30 Snapseed Tools with categories & badges matching user screenshots
  public allTools: ToolItem[] = [
    { id: 'tune', label: 'Tune image', icon: 'ti-adjustments-horizontal', category: 'refine' },
    { id: 'layers', label: 'Layers Panel', icon: 'ti-stack-2', category: 'refine', badge: 'PRO', badgeColor: 'purple' },
    { id: 'details', label: 'Details', icon: 'ti-triangle', category: 'refine' },
    { id: 'dehaze', label: 'Dehaze', icon: 'ti-cloud', category: 'refine', badge: 'NEW', badgeColor: 'blue' },
    { id: 'tonal', label: 'Tonal contrast', icon: 'ti-contrast-2', category: 'refine' },
    { id: 'curves', label: 'Curves', icon: 'ti-spline', category: 'refine' },
    { id: 'whitebalance', label: 'White balance', icon: 'ti-square-letter-w', category: 'refine' },
    { id: 'colour', label: 'Colour', icon: 'ti-palette', category: 'refine', badge: 'NEW', badgeColor: 'blue' },
    { id: 'colorgrade', label: 'Colour grade', icon: 'ti-color-swatch', category: 'refine', badge: 'NEW', badgeColor: 'blue' },
    { id: 'lensblur', label: 'Lens Blur', icon: 'ti-focus-2', category: 'style' },
    { id: 'vignette', label: 'Vignette', icon: 'ti-square-dot', category: 'style' },
    { id: 'selective', label: 'Selective', icon: 'ti-target', category: 'fix' },
    { id: 'brush', label: 'Brush', icon: 'ti-brush', category: 'fix' },
    { id: 'healing', label: 'Healing', icon: 'ti-bandage', category: 'fix' },
    { id: 'portrait', label: 'Portrait', icon: 'ti-mood-smile', category: 'style', badge: 'NEW', badgeColor: 'purple' },
    { id: 'crop', label: 'Crop', icon: 'ti-crop', category: 'fix' },
    { id: 'perspective', label: 'Perspective', icon: 'ti-box-model', category: 'fix' },
    { id: 'expand', label: 'Expand', icon: 'ti-arrows-maximize', category: 'fix' },
    { id: 'headpose', label: 'Head pose', icon: 'ti-face-id', category: 'fix' },
    { id: 'grainyfilm', label: 'Grainy film', icon: 'ti-dice-5', category: 'style', badge: 'NEW', badgeColor: 'orange' },
    { id: 'bloom', label: 'Bloom', icon: 'ti-sun', category: 'style', badge: 'NEW', badgeColor: 'orange' },
    { id: 'halation', label: 'Halation', icon: 'ti-inner-shadow-bottom-right', category: 'style', badge: 'NEW', badgeColor: 'orange' },
    { id: 'chromatic', label: 'Chromatic aberration', icon: 'ti-circles', category: 'style', badge: 'NEW', badgeColor: 'orange' },
    { id: 'glamour', label: 'Glamour glow', icon: 'ti-diamond', category: 'style' },
    { id: 'vintage', label: 'Vintage', icon: 'ti-lamp', category: 'style' },
    { id: 'bw', label: 'Black and white', icon: 'ti-contrast', category: 'style' },
    { id: 'hdr', label: 'HDR-scape', icon: 'ti-mountain', category: 'refine' },
    { id: 'overlay', label: 'Overlay / Double Exp', icon: 'ti-layers-intersect', category: 'style', badge: 'NEW', badgeColor: 'orange' },
    { id: 'frames', label: 'Frames', icon: 'ti-frame', category: 'style' },
    { id: 'text', label: 'Text', icon: 'ti-typography', category: 'style' },
    { id: 'retrolux', label: 'Retrolux', icon: 'ti-device-tv', category: 'style' },
    { id: 'drama', label: 'Drama', icon: 'ti-cloud-rain', category: 'style' },
    { id: 'noir', label: 'Noir', icon: 'ti-movie', category: 'style' },
    { id: 'grunge', label: 'Grunge', icon: 'ti-guitar-pick', category: 'style' }
  ];

  // 1. TUNE IMAGE STATE
  public activeTuneParam: keyof ImageAdjustments = 'brightness';
  public tuneParams: TuneParamOption[] = [
    { id: 'brightness', label: 'Brightness', min: -100, max: 100, icon: 'ti-sun' },
    { id: 'contrast', label: 'Contrast', min: -100, max: 100, icon: 'ti-contrast' },
    { id: 'saturation', label: 'Saturation', min: -100, max: 100, icon: 'ti-droplet' },
    { id: 'highlights', label: 'Highlights', min: -100, max: 100, icon: 'ti-sun-high' },
    { id: 'shadows', label: 'Shadows', min: -100, max: 100, icon: 'ti-moon' },
    { id: 'warmth', label: 'Warmth', min: -100, max: 100, icon: 'ti-flame' }
  ];
  private preTuneBackupAdjustments: ImageAdjustments | null = null;

  // 2. CROP STATE
  public aspectRatios: { id: AspectRatioType; label: string; ratio?: number; icon: string }[] = [
    { id: 'free', label: 'Free', icon: 'ti-vector' },
    { id: '1:1', label: '1:1', ratio: 1, icon: 'ti-square' },
    { id: '4:3', label: '4:3', ratio: 4 / 3, icon: 'ti-rectangle' },
    { id: '16:9', label: '16:9', ratio: 16 / 9, icon: 'ti-device-tv' },
    { id: '9:16', label: '9:16', ratio: 9 / 16, icon: 'ti-rectangle-vertical' }
  ];
  public cropBox = { x: 10, y: 10, width: 200, height: 150 };
  private currentImgBounds: ImageRenderBounds = { x: 0, y: 0, width: 300, height: 200 };
  private isDragging = false;
  private dragAction: 'move' | 'tl' | 'tr' | 'bl' | 'br' | null = null;
  private startPointer = { x: 0, y: 0 };
  private startBox = { x: 0, y: 0, width: 0, height: 0 };

  // 3. PERSPECTIVE STATE
  public perspectiveTiltX = 0; // -35 to 35
  public perspectiveTiltY = 0; // -35 to 35
  public perspectiveRotate = 0; // -30 to 30
  public perspectiveScale = 1.0; // 1.0 to 1.6
  public perspectiveParam: 'tiltX' | 'tiltY' | 'rotate' | 'scale' = 'tiltX';

  // 4. EXPAND STATE
  public expandAmount = 20; // 5% to 50%
  public expandFillMode: 'smart' | 'white' | 'black' = 'smart';

  // 5. HDR - HSL SCAPE STATE
  public hdrStrength = 45; // 0 to 100
  public hslChannel: 'all' | 'red' | 'green' | 'blue' | 'yellow' = 'all';
  public hslHue = 0; // -180 to 180
  public hslSaturation = 25; // -100 to 100
  public hslLuminance = 0; // -100 to 100

  // 6. CURVES & DETAILS STATE
  public curvesSubTab: 'curves' | 'details' = 'curves';
  public curvesChannel: 'rgb' | 'red' | 'green' | 'blue' = 'rgb';
  public curvePoints = { blacks: 0, shadows: 0, midtones: 0, highlights: 0, whites: 0 };
  public detailStructure = 25;
  public detailSharpening = 20;

  // 7. SELECTIVE STATE
  public selectivePoint = { x: 50, y: 50 }; // % of image
  public selectiveParam: 'brightness' | 'contrast' | 'saturation' | 'structure' = 'brightness';
  public selectiveBrightness = 0;
  public selectiveContrast = 0;
  public selectiveSaturation = 0;
  public selectiveRadius = 40;

  // 8. BRUSH STATE
  public brushMode: 'exposure' | 'temperature' | 'saturation' | 'eraser' = 'exposure';
  public brushSize = 35; // 10 to 80
  public brushIntensity = 50; // -100 to 100 (Dodge/Burn)
  private isBrushing = false;

  // 9. COLOR GRADE STATE
  public colorGradeTonal: 'shadows' | 'midtones' | 'highlights' = 'shadows';
  public colorGradeShadows = { hue: 200, sat: 25 }; // Cool shadows
  public colorGradeMidtones = { hue: 45, sat: 15 };
  public colorGradeHighlights = { hue: 35, sat: 30 }; // Warm highlights

  // 10. WHITE BALANCE STATE
  public wbTemperature = 0; // -100 (cool) to +100 (warm)
  public wbTint = 0; // -100 (green) to +100 (magenta)

  // 11. OVERLAY / DOUBLE EXPOSURE STATE
  public Math = Math;
  public overlaySubTab: 'transform' | 'blend' | 'presets' = 'transform';
  public activeOverlayPresetId = 'golden-leak';
  public overlayTransformParam: 'scale' | 'rotate' = 'scale';
  public overlayImageUrl: string | null = null;
  public overlayOpacity = 85; // 0 to 100
  public overlayBlendMode: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'color-dodge' = 'screen';
  public overlayScale = 1.0; // 0.1 to 3.0
  public overlayRotation = 0; // -180 to 180
  public overlayFlipH = false;
  public overlayFlipV = false;
  public overlayPos = { x: 50, y: 50 }; // % of image

  // Interactive On-Canvas Layer Resize & Transform State
  public activeDragMode: 'none' | 'move' | 'resize' | 'rotate' = 'none';
  public resizeCorner: 'tl' | 'tr' | 'bl' | 'br' = 'br';
  public dragLayerTarget: ImageLayer | null = null;
  public dragStartPointer = { x: 0, y: 0 };
  public dragStartLayerPos = { x: 50, y: 50 };
  public dragStartScale = 1.0;
  public dragStartRotation = 0;
  public dragLayerCenterScreen = { x: 0, y: 0 };
  public initialPinchDist = 0;

  public overlayPresets: OverlayPreset[] = [
    {
      id: 'golden-leak',
      name: 'Sun Flare',
      category: 'light',
      icon: 'ti-sun',
      dataUrl: PRESET_GOLDEN_LEAK,
      recommendedBlend: 'screen',
      defaultOpacity: 85
    },
    {
      id: 'bokeh-lights',
      name: 'Bokeh Glow',
      category: 'light',
      icon: 'ti-sparkles',
      dataUrl: PRESET_BOKEH,
      recommendedBlend: 'screen',
      defaultOpacity: 90
    },
    {
      id: 'vintage-dust',
      name: 'Film Dust',
      category: 'texture',
      icon: 'ti-grain',
      dataUrl: PRESET_FILM_DUST,
      recommendedBlend: 'screen',
      defaultOpacity: 75
    },
    {
      id: 'prism-rainbow',
      name: 'Rainbow Prism',
      category: 'light',
      icon: 'ti-rainbow',
      dataUrl: PRESET_PRISM,
      recommendedBlend: 'screen',
      defaultOpacity: 80
    },
    {
      id: 'moody-fog',
      name: 'Moody Mist',
      category: 'texture',
      icon: 'ti-cloud',
      dataUrl: PRESET_FOG,
      recommendedBlend: 'screen',
      defaultOpacity: 70
    },
    {
      id: 'neon-heart',
      name: 'Neon Sticker',
      category: 'sticker',
      icon: 'ti-heart',
      dataUrl: PRESET_NEON,
      recommendedBlend: 'normal',
      defaultOpacity: 95
    },
    {
      id: 'retro-stamp',
      name: 'Retro Stamp',
      category: 'sticker',
      icon: 'ti-badge',
      dataUrl: PRESET_VINTAGE_STAMP,
      recommendedBlend: 'overlay',
      defaultOpacity: 80
    },
    {
      id: 'golden-embers',
      name: 'Fire Embers',
      category: 'light',
      icon: 'ti-flame',
      dataUrl: PRESET_EMBERS,
      recommendedBlend: 'screen',
      defaultOpacity: 85
    }
  ];

  // Filter Styles Presets
  public filterStyles: FilterStylePreset[] = [
    { id: 'none', label: 'Current', cssStyle: 'none' },
    { id: 'portrait', label: 'Portrait', cssStyle: 'contrast(106%) brightness(104%) saturate(112%)' },
    { id: 'smooth', label: 'Smooth', cssStyle: 'contrast(95%) brightness(108%) saturate(92%)' },
    { id: 'pop', label: 'Pop', cssStyle: 'contrast(118%) saturate(135%) brightness(105%)' },
    { id: 'fade', label: 'Faded Glow', cssStyle: 'contrast(90%) brightness(110%) sepia(20%)' },
    { id: 'bw', label: 'B&W', cssStyle: 'grayscale(100%) contrast(120%)' },
    { id: 'sepia', label: 'Sepia', cssStyle: 'sepia(85%) contrast(110%)' },
    { id: 'warm', label: 'Morning', cssStyle: 'sepia(35%) saturate(140%) hue-rotate(-15deg)' },
    { id: 'cool', label: 'Cool', cssStyle: 'hue-rotate(180deg) saturate(110%)' },
    { id: 'vintage', label: 'Vintage', cssStyle: 'sepia(40%) contrast(120%) brightness(90%)' },
    { id: 'drama', label: 'Drama', cssStyle: 'contrast(150%) brightness(90%) saturate(120%)' }
  ];

  // Modals & Sheets
  public showExportSheet = false;
  public showEditsHistoryModal = false;
  public showLayersPanel = false;
  public showMoreMenu = false;
  public selectedFormat: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
  public exportQuality = 92;
  public toastMessage = '';
  public isExporting = false;

  // Layers System State
  public selectedLayerId = 'layer-base';
  public layers: ImageLayer[] = [];
  public isLayerDragging = false;
  public isOverlayDragging = false;
  private layerDragTarget: ImageLayer | null = null;
  private layerDragStartPointer = { x: 0, y: 0 };
  private layerDragStartPos = { x: 50, y: 50 };

  public blendModesList: { id: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'color-dodge'; label: string }[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'screen', label: 'Screen' },
    { id: 'overlay', label: 'Overlay' },
    { id: 'soft-light', label: 'Soft Light' },
    { id: 'multiply', label: 'Multiply' },
    { id: 'color-dodge', label: 'Color Dodge' }
  ];

  // Pre-edit Snapshots for Undo/Redo & Cancel
  private preEditSnapshot: EditorState | null = null;
  private preWbSnapshot: { wbTemperature: number; wbTint: number; state: EditorState } | null = null;
  private preHdrSnapshot: { hdrStrength: number; hslHue: number; hslSaturation: number; hslLuminance: number; state: EditorState } | null = null;
  private preColorGradeSnapshot: { shadows: any; midtones: any; highlights: any; state: EditorState } | null = null;

  public captureCurrentStateSnapshot(actionDescription?: string): EditorState {
    const snap = this.photoState.cloneState(this.state);
    snap.layers = JSON.parse(JSON.stringify(this.layers));
    snap.wbTemperature = this.wbTemperature;
    snap.wbTint = this.wbTint;
    snap.hdrStrength = this.hdrStrength;
    if (actionDescription) {
      snap.actionDescription = actionDescription;
    }
    return snap;
  }

  public commitLayerHistory(actionDescription: string) {
    const snap = this.captureCurrentStateSnapshot(actionDescription);
    this.photoState.pushHistory(snap, actionDescription);
  }

  constructor(
    public photoState: PhotoStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub.add(
      this.photoState.state$.subscribe((s) => {
        this.state = s;
        this.filterCss = this.photoState.getFilterCssString(s);

        // Restore secondary state if present in snapshot
        if (s.wbTemperature !== undefined) this.wbTemperature = s.wbTemperature;
        if (s.wbTint !== undefined) this.wbTint = s.wbTint;
        if (s.hdrStrength !== undefined) this.hdrStrength = s.hdrStrength;

        // Restore or sync layers
        if (s.layers && Array.isArray(s.layers) && s.layers.length > 0) {
          this.layers = JSON.parse(JSON.stringify(s.layers));
          if (!this.layers.some(l => l.id === this.selectedLayerId)) {
            this.selectedLayerId = this.layers[this.layers.length - 1].id;
          }
        } else if (this.layers.length === 0 && s.imageUrl) {
          this.layers = [
            {
              id: 'layer-base',
              name: 'Background Photo',
              type: 'base',
              imageUrl: s.imageUrl,
              visible: true,
              opacity: 100,
              blendMode: 'normal',
              x: 50,
              y: 50,
              scale: 1,
              rotation: 0,
              flipH: false,
              flipV: false
            }
          ];
          this.selectedLayerId = 'layer-base';
        } else if (this.layers.length > 0) {
          const base = this.layers.find(l => l.type === 'base');
          if (base && s.imageUrl && base.imageUrl !== s.imageUrl) {
            base.imageUrl = s.imageUrl;
          }
        }
      })
    );
  }

  // Layer Getters & Helpers
  get baseLayer(): ImageLayer | undefined {
    return this.layers.find(l => l.type === 'base');
  }

  get nonBaseLayers(): ImageLayer[] {
    return this.layers.filter(l => l.type !== 'base');
  }

  get displayLayers(): ImageLayer[] {
    // Reverse display order: top of list represents the front-most layer on the visual stack
    return [...this.layers].reverse();
  }

  get selectedLayer(): ImageLayer | undefined {
    return this.layers.find(l => l.id === this.selectedLayerId) || this.layers[this.layers.length - 1];
  }

  getLayerZIndex(layerId: string): number {
    return this.layers.findIndex(l => l.id === layerId);
  }

  isTopLayer(layerId: string): boolean {
    return this.layers.length <= 1 || this.layers[this.layers.length - 1]?.id === layerId;
  }

  isBottomLayer(layerId: string): boolean {
    return this.layers.length <= 1 || this.layers[0]?.id === layerId;
  }

  trackByLayerId(index: number, layer: ImageLayer): string {
    return layer.id;
  }

  toggleLayersPanel() {
    this.showLayersPanel = !this.showLayersPanel;
    if (this.showLayersPanel && !this.selectedLayerId && this.layers.length > 0) {
      this.selectedLayerId = this.layers[this.layers.length - 1].id;
    }
  }

  closeLayersPanel() {
    this.showLayersPanel = false;
  }

  selectLayer(layerId: string) {
    this.selectedLayerId = layerId;
  }

  // Reordering: Forward (closer to front) & Backward (closer to back)
  moveLayerForward(layerId: string, event?: Event) {
    event?.stopPropagation();
    const idx = this.layers.findIndex(l => l.id === layerId);
    if (idx < this.layers.length - 1) {
      this.commitLayerHistory(`Move "${this.layers[idx].name}" Forward`);
      const temp = this.layers[idx];
      this.layers[idx] = this.layers[idx + 1];
      this.layers[idx + 1] = temp;
      this.layers = [...this.layers];
      this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Move "${temp.name}" Forward`));
      this.showToast(`"${temp.name}" brought forward`);
    }
  }

  moveLayerBackward(layerId: string, event?: Event) {
    event?.stopPropagation();
    const idx = this.layers.findIndex(l => l.id === layerId);
    if (idx > 0) {
      this.commitLayerHistory(`Move "${this.layers[idx].name}" Backward`);
      const temp = this.layers[idx];
      this.layers[idx] = this.layers[idx - 1];
      this.layers[idx - 1] = temp;
      this.layers = [...this.layers];
      this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Move "${temp.name}" Backward`));
      this.showToast(`"${temp.name}" sent backward`);
    }
  }

  bringLayerToFront(layerId: string) {
    const idx = this.layers.findIndex(l => l.id === layerId);
    if (idx >= 0 && idx < this.layers.length - 1) {
      this.commitLayerHistory(`Bring "${this.layers[idx].name}" to Front`);
      const [layer] = this.layers.splice(idx, 1);
      this.layers.push(layer);
      this.layers = [...this.layers];
      this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Bring "${layer.name}" to Front`));
      this.showToast(`"${layer.name}" moved to top`);
    }
  }

  sendLayerToBack(layerId: string) {
    const idx = this.layers.findIndex(l => l.id === layerId);
    if (idx > 0) {
      this.commitLayerHistory(`Send "${this.layers[idx].name}" to Back`);
      const [layer] = this.layers.splice(idx, 1);
      this.layers.unshift(layer);
      this.layers = [...this.layers];
      this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Send "${layer.name}" to Back`));
      this.showToast(`"${layer.name}" moved to bottom`);
    }
  }

  toggleLayerVisibility(layer: ImageLayer, event?: Event) {
    event?.stopPropagation();
    this.commitLayerHistory(`${layer.visible ? 'Hide' : 'Show'} "${layer.name}"`);
    layer.visible = !layer.visible;
    this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`${layer.visible ? 'Show' : 'Hide'} "${layer.name}"`));
  }

  deleteLayer(layerId: string, event?: Event) {
    event?.stopPropagation();
    if (this.layers.length <= 1) {
      this.showToast('Cannot delete the only layer');
      return;
    }
    const idx = this.layers.findIndex(l => l.id === layerId);
    if (idx >= 0) {
      const removed = this.layers[idx];
      this.commitLayerHistory(`Delete "${removed.name}"`);
      this.layers.splice(idx, 1);
      this.layers = [...this.layers];
      if (this.selectedLayerId === layerId) {
        this.selectedLayerId = this.layers[Math.max(0, idx - 1)].id;
      }
      this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Delete "${removed.name}"`));
      this.showToast(`Deleted "${removed.name}"`);
    }
  }

  duplicateLayer(layer: ImageLayer, event?: Event) {
    event?.stopPropagation();
    this.commitLayerHistory(`Duplicate "${layer.name}"`);
    const newLayer: ImageLayer = {
      ...layer,
      id: 'layer-' + Date.now(),
      name: `${layer.name} (Copy)`,
      x: Math.min(90, (layer.x || 50) + 4),
      y: Math.min(90, (layer.y || 50) + 4)
    };
    const idx = this.layers.findIndex(l => l.id === layer.id);
    this.layers.splice(idx + 1, 0, newLayer);
    this.layers = [...this.layers];
    this.selectedLayerId = newLayer.id;
    this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Duplicate "${layer.name}"`));
    this.showToast(`Duplicated "${layer.name}"`);
  }

  promptRenameLayer(layer: ImageLayer, event?: Event) {
    event?.stopPropagation();
    const newName = window.prompt('Rename layer:', layer.name);
    if (newName && newName.trim()) {
      this.commitLayerHistory(`Rename "${layer.name}"`);
      layer.name = newName.trim();
      this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Rename "${layer.name}"`));
      this.showToast(`Renamed to "${layer.name}"`);
    }
  }

  triggerAddLayerFile() {
    const el = this.addLayerFileInput?.nativeElement || (document.getElementById('addLayerFileInput') as HTMLInputElement);
    if (el) {
      el.value = '';
      el.click();
    }
  }

  onAddLayerFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const url = e.target.result as string;
        const newLayer: ImageLayer = {
          id: 'layer-' + Date.now(),
          name: file.name.replace(/\.[^/.]+$/, "") || `Layer ${this.layers.length + 1}`,
          type: 'image',
          imageUrl: url,
          visible: true,
          opacity: 100,
          blendMode: 'normal',
          x: 50,
          y: 50,
          scale: 1.0,
          rotation: 0,
          flipH: false,
          flipV: false
        };
        this.commitLayerHistory(`Add Layer "${newLayer.name}"`);
        this.layers.push(newLayer);
        this.layers = [...this.layers];
        this.selectedLayerId = newLayer.id;
        this.photoState.setStateDirectly(this.captureCurrentStateSnapshot(`Add Layer "${newLayer.name}"`));
        this.closeLayersPanel();
        this.editLayerAsOverlay(newLayer);
        this.showToast(`"${newLayer.name}" added! Resize directly on canvas or use sliders.`);
      };
      reader.readAsDataURL(file);
      input.value = '';
    }
  }

  openOverlayFromLayers() {
    this.closeLayersPanel();
    this.openTool('overlay');
  }

  async mergeAllLayers() {
    if (this.layers.length <= 1) {
      this.showToast('Only one layer exists');
      return;
    }
    this.commitLayerHistory('Merge All Layers');
    const baked = await this.renderAllLayersToDataUrl();
    this.photoState.applyCroppedImage(baked);
    this.layers = [{
      id: 'layer-base',
      name: 'Merged Background',
      type: 'base',
      imageUrl: baked,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      flipH: false,
      flipV: false
    }];
    this.selectedLayerId = 'layer-base';
    this.showToast('All layers merged down');
  }

  public mapBlendModeToCanvasComposite(mode: string): GlobalCompositeOperation {
    switch (mode) {
      case 'screen': return 'screen';
      case 'multiply': return 'multiply';
      case 'overlay': return 'overlay';
      case 'soft-light': return 'soft-light';
      case 'color-dodge': return 'color-dodge';
      default: return 'source-over';
    }
  }

  private loadImageAsync(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image: ' + src));
      img.src = src;
    });
  }

  public async renderFinalCanvasOutput(
    format: string = this.selectedFormat,
    quality: number = this.exportQuality / 100
  ): Promise<{ dataUrl: string; blob: Blob }> {
    const baseSrc = this.baseLayer?.imageUrl || this.state.imageUrl;
    let baseImg: HTMLImageElement;
    try {
      baseImg = await this.photoState.loadSafeImage(baseSrc);
    } catch (e) {
      if (this.targetImg?.nativeElement?.complete && this.targetImg.nativeElement.naturalWidth > 0) {
        baseImg = this.targetImg.nativeElement;
      } else {
        throw new Error('Base photo could not be loaded for export');
      }
    }

    const naturalW = baseImg.naturalWidth || baseImg.width || 1200;
    const naturalH = baseImg.naturalHeight || baseImg.height || 900;
    const rot = ((this.state.rotation || 0) % 360 + 360) % 360;
    const isRotated90 = rot === 90 || rot === 270;

    const canvas = document.createElement('canvas');
    canvas.width = isRotated90 ? naturalH : naturalW;
    canvas.height = isRotated90 ? naturalW : naturalH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw Base Photo Layer with Filters & Rotation
    if (!this.baseLayer || this.baseLayer.visible) {
      ctx.save();
      const filterParts = [
        this.filterCss,
        this.hdrCssFilter,
        this.wbCssFilter,
        this.colorGradeCssFilter
      ].filter(f => f && f.trim() !== '' && f !== 'none');

      if (filterParts.length > 0) {
        try {
          ctx.filter = filterParts.join(' ').trim();
        } catch {}
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, (this.baseLayer?.opacity ?? 100) / 100));
      ctx.globalCompositeOperation = this.mapBlendModeToCanvasComposite(this.baseLayer?.blendMode ?? 'normal');

      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rot !== 0) {
        ctx.rotate((rot * Math.PI) / 180);
      }
      ctx.scale(this.state.flipH ? -1 : 1, this.state.flipV ? -1 : 1);
      ctx.drawImage(baseImg, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
      ctx.restore();
    }

    // 2. Draw Upper Layers (Overlays, Stickers, Added Photos)
    for (const layer of this.nonBaseLayers) {
      if (!layer.visible) continue;
      try {
        const lImg = await this.photoState.loadSafeImage(layer.imageUrl);
        ctx.save();
        const cx = ((layer.x ?? 50) / 100) * canvas.width;
        const cy = ((layer.y ?? 50) / 100) * canvas.height;
        ctx.translate(cx, cy);
        if (layer.rotation) {
          ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
        }
        const sx = (layer.flipH ? -1 : 1) * (layer.scale || 1);
        const sy = (layer.flipV ? -1 : 1) * (layer.scale || 1);
        ctx.scale(sx, sy);
        ctx.globalAlpha = Math.max(0.01, Math.min(1.0, (layer.opacity ?? 100) / 100));
        ctx.globalCompositeOperation = this.mapBlendModeToCanvasComposite(layer.blendMode);

        const overW = canvas.width * 0.85;
        const lNatW = lImg.naturalWidth || lImg.width || 800;
        const lNatH = lImg.naturalHeight || lImg.height || 600;
        const overH = (overW * lNatH) / lNatW;
        ctx.drawImage(lImg, -overW / 2, -overH / 2, overW, overH);
        ctx.restore();
      } catch (err) {
        console.warn('Could not composite layer:', layer.name, err);
      }
    }

    // 3. Draw Brush Canvas if painted
    if (this.brushCanvas?.nativeElement) {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.brushCanvas.nativeElement, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    return await this.photoState.getCanvasOutput(canvas, format, quality);
  }

  public async renderFinalCanvas(
    format: string = this.selectedFormat,
    quality: number = this.exportQuality / 100
  ): Promise<string> {
    const { dataUrl } = await this.renderFinalCanvasOutput(format, quality);
    return dataUrl;
  }

  async renderAllLayersToDataUrl(format: string = 'image/jpeg', quality: number = 0.95): Promise<string> {
    return this.renderFinalCanvas(format, quality);
  }

  async saveToDeviceAction() {
    if (this.isExporting) return;
    this.isExporting = true;
    try {
      const { dataUrl, blob } = await this.renderFinalCanvasOutput();
      const ext = this.selectedFormat === 'image/png' ? 'png' : this.selectedFormat === 'image/webp' ? 'webp' : 'jpg';
      const cleanTitle = (this.state.title || 'picly-photo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'picly-photo';
      const filename = `${cleanTitle}-${Date.now()}.${ext}`;

      // 1. Download image to user's device storage
      this.photoState.downloadBlobOrDataUrl(blob, filename);

      // 2. Automatically save project state in local storage
      try {
        const storageUrl = await this.photoState.createStorageOptimizedDataUrl(dataUrl, 1080);
        this.photoState.saveProject(cleanTitle, {
          ...this.state,
          imageUrl: storageUrl
        });
      } catch (saveErr) {
        console.warn('Could not auto-sync project to recents:', saveErr);
      }

      this.showToast(`Saved ${ext.toUpperCase()} to device storage!`);
      this.showExportSheet = false;
    } catch (err) {
      console.error('Save to device failed:', err);
      this.showToast('Download failed. Please try again.');
    } finally {
      this.isExporting = false;
    }
  }

  async saveProjectAction() {
    if (this.isExporting) return;
    this.isExporting = true;
    try {
      const { dataUrl } = await this.renderFinalCanvasOutput();
      const storageUrl = await this.photoState.createStorageOptimizedDataUrl(dataUrl, 1080);
      const title = this.state.title || `Project ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // 2. Save edit as project in localStorage in-place without creating gallery replicas
      this.photoState.saveProject(title, {
        ...this.state,
        imageUrl: storageUrl
      });

      // Update current active editor image
      this.state.imageUrl = dataUrl;
      if (this.baseLayer) {
        this.baseLayer.imageUrl = dataUrl;
      }

      this.showToast('Project edit saved in local storage!');
      this.showExportSheet = false;
    } catch (err) {
      console.error('Save project failed:', err);
      this.showToast('Save project failed. Please try again.');
    } finally {
      this.isExporting = false;
    }
  }

  async sharePhotoAction() {
    if (this.isExporting) return;
    this.isExporting = true;
    try {
      const { dataUrl, blob } = await this.renderFinalCanvasOutput();
      const ext = this.selectedFormat === 'image/png' ? 'png' : this.selectedFormat === 'image/webp' ? 'webp' : 'jpg';
      const filename = `picly-photo-${Date.now()}.${ext}`;

      // 3. Share directly through multiple apps (WhatsApp, Instagram, etc.) without gallery replicas
      if (navigator.share) {
        try {
          const file = new File([blob], filename, { type: this.selectedFormat });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: this.state.title || 'My Edited Photo',
              text: 'Check out this photo edited with Picly!',
              files: [file]
            });
            this.showToast('Photo shared successfully!');
            this.showExportSheet = false;
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            this.showExportSheet = false;
            return;
          }
        }
      }

      // Capacitor Share fallback for native apps
      try {
        await Share.share({
          title: this.state.title || 'My Edited Photo',
          text: 'Edited with Picly',
          url: dataUrl,
          dialogTitle: 'Share to apps'
        });
        this.showToast('Shared successfully!');
        this.showExportSheet = false;
        return;
      } catch (capErr: any) {
        if (capErr?.message?.includes('cancel') || capErr?.message?.includes('dismiss')) {
          this.showExportSheet = false;
          return;
        }
      }

      // Notice if Web Share is unsupported in desktop browser
      this.showToast('Share is available on mobile devices & supported browsers');
      this.showExportSheet = false;
    } catch (err) {
      console.error('Share failed:', err);
      this.showToast('Sharing failed');
    } finally {
      this.isExporting = false;
    }
  }

  // Aliases for compatibility
  exportPhotoAction() {
    return this.saveToDeviceAction();
  }

  saveToLocalStorageAction() {
    return this.saveProjectAction();
  }

  resetLayerPosition(layer: ImageLayer) {
    layer.x = 50;
    layer.y = 50;
    layer.scale = 1.0;
    layer.rotation = 0;
    layer.flipH = false;
    layer.flipV = false;
    this.showToast(`Centered "${layer.name}"`);
  }

  flipLayerH(layer: ImageLayer) {
    layer.flipH = !layer.flipH;
  }

  flipLayerV(layer: ImageLayer) {
    layer.flipV = !layer.flipV;
  }

  formatBlendMode(m: string): string {
    switch (m) {
      case 'screen': return 'Screen';
      case 'overlay': return 'Overlay';
      case 'soft-light': return 'Soft Light';
      case 'multiply': return 'Multiply';
      case 'color-dodge': return 'Color Dodge';
      default: return 'Normal';
    }
  }

  // Direct On-Canvas Resize, Rotate, and Drag Pointer Events
  onResizeHandlePointerDown(event: PointerEvent, layer: ImageLayer, corner: 'tl' | 'tr' | 'bl' | 'br') {
    event.stopPropagation();
    event.preventDefault();
    this.selectedLayerId = layer.id;
    this.syncActiveLayerToOverlay(layer);
    this.activeDragMode = 'resize';
    this.resizeCorner = corner;
    this.dragLayerTarget = layer;
    this.dragStartPointer = { x: event.clientX, y: event.clientY };
    this.dragStartScale = layer.scale || 1.0;

    if (this.previewStage?.nativeElement) {
      const stageRect = this.previewStage.nativeElement.getBoundingClientRect();
      this.dragLayerCenterScreen = {
        x: stageRect.left + ((layer.x ?? 50) / 100) * stageRect.width,
        y: stageRect.top + ((layer.y ?? 50) / 100) * stageRect.height
      };
    }

    try {
      (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
    } catch {}
  }

  onRotateHandlePointerDown(event: PointerEvent, layer: ImageLayer) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedLayerId = layer.id;
    this.syncActiveLayerToOverlay(layer);
    this.activeDragMode = 'rotate';
    this.dragLayerTarget = layer;
    this.dragStartRotation = layer.rotation || 0;

    if (this.previewStage?.nativeElement) {
      const stageRect = this.previewStage.nativeElement.getBoundingClientRect();
      this.dragLayerCenterScreen = {
        x: stageRect.left + ((layer.x ?? 50) / 100) * stageRect.width,
        y: stageRect.top + ((layer.y ?? 50) / 100) * stageRect.height
      };
    }

    try {
      (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
    } catch {}
  }

  onCanvasLayerPointerDown(event: PointerEvent, layer: ImageLayer) {
    if (layer.type === 'base') return;
    this.selectedLayerId = layer.id;
    this.syncActiveLayerToOverlay(layer);

    // If not currently in a tool, automatically open the overlay tool for instant control!
    if (this.activeToolMode === 'none') {
      this.activeToolMode = 'overlay';
      this.overlaySubTab = 'transform';
      this.preEditSnapshot = this.captureCurrentStateSnapshot(`Overlay: ${layer.name}`);
    }

    this.activeDragMode = 'move';
    this.dragLayerTarget = layer;
    this.dragStartPointer = { x: event.clientX, y: event.clientY };
    this.dragStartLayerPos = { x: layer.x ?? 50, y: layer.y ?? 50 };

    if (this.previewStage?.nativeElement) {
      const stageRect = this.previewStage.nativeElement.getBoundingClientRect();
      this.dragLayerCenterScreen = {
        x: stageRect.left + ((layer.x ?? 50) / 100) * stageRect.width,
        y: stageRect.top + ((layer.y ?? 50) / 100) * stageRect.height
      };
    }

    try {
      (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
    } catch {}
  }

  // Multi-Touch Pinch to Zoom / Scale
  onStageTouchMove(event: TouchEvent) {
    if (event.touches.length === 2 && this.selectedLayer && this.selectedLayer.type !== 'base') {
      const t1 = event.touches[0];
      const t2 = event.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (!this.initialPinchDist) {
        this.initialPinchDist = dist;
        this.dragStartScale = this.selectedLayer.scale || 1.0;
      } else {
        const factor = dist / Math.max(10, this.initialPinchDist);
        const newScale = Math.max(0.1, Math.min(3.5, +(this.dragStartScale * factor).toFixed(2)));
        this.selectedLayer.scale = newScale;
        this.overlayScale = newScale;
      }
    }
  }

  onStageTouchEnd() {
    this.initialPinchDist = 0;
  }

  // Overlay & Layer Synchronization
  editLayerAsOverlay(layer: ImageLayer) {
    this.selectedLayerId = layer.id;
    this.closeLayersPanel();
    this.activeMainTab = 'tools';
    this.activeToolMode = 'overlay';
    this.overlaySubTab = 'transform';
    this.preEditSnapshot = this.captureCurrentStateSnapshot(`Overlay: ${layer.name}`);
    this.syncActiveLayerToOverlay(layer);
  }

  editLayerFromList(layer: ImageLayer, event?: Event) {
    event?.stopPropagation();
    if (layer.type === 'base') {
      this.selectedLayerId = layer.id;
      return;
    }
    this.editLayerAsOverlay(layer);
  }

  syncActiveLayerToOverlay(layer: ImageLayer) {
    this.overlayImageUrl = layer.imageUrl;
    this.overlayOpacity = layer.opacity ?? 100;
    this.overlayBlendMode = layer.blendMode || 'normal';
    this.overlayScale = layer.scale || 1.0;
    this.overlayRotation = layer.rotation || 0;
    this.overlayFlipH = layer.flipH || false;
    this.overlayFlipV = layer.flipV || false;
    this.overlayPos = { x: layer.x ?? 50, y: layer.y ?? 50 };
  }

  syncOverlayToActiveLayer() {
    if (!this.selectedLayer || this.selectedLayer.type === 'base') return;
    this.selectedLayer.scale = this.overlayScale;
    this.selectedLayer.rotation = this.overlayRotation;
    this.selectedLayer.flipH = this.overlayFlipH;
    this.selectedLayer.flipV = this.overlayFlipV;
    this.selectedLayer.opacity = this.overlayOpacity;
    this.selectedLayer.blendMode = this.overlayBlendMode;
    this.selectedLayer.x = this.overlayPos.x;
    this.selectedLayer.y = this.overlayPos.y;
    if (this.overlayImageUrl && this.overlayImageUrl !== this.selectedLayer.imageUrl) {
      this.selectedLayer.imageUrl = this.overlayImageUrl;
    }
  }

  // Precision Slider Handlers
  onScaleSliderChange(val: any) {
    this.overlayScale = parseFloat(val) || 1.0;
    if (this.selectedLayer) {
      this.selectedLayer.scale = this.overlayScale;
    }
  }

  onRotationSliderChange(val: any) {
    this.overlayRotation = parseInt(val, 10) || 0;
    if (this.selectedLayer) {
      this.selectedLayer.rotation = this.overlayRotation;
    }
  }

  onOpacitySliderChange(val: any) {
    this.overlayOpacity = parseInt(val, 10) || 100;
    if (this.selectedLayer) {
      this.selectedLayer.opacity = this.overlayOpacity;
    }
  }

  setOverlayBlendMode(m: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'color-dodge') {
    this.overlayBlendMode = m;
    if (this.selectedLayer) {
      this.selectedLayer.blendMode = m;
    }
  }

  setQuickScale(scale: number) {
    this.overlayScale = scale;
    if (this.selectedLayer) {
      this.selectedLayer.scale = scale;
    }
    this.showToast(`Scale set to ${scale}x`);
  }

  onLayerScaleChange(layer: ImageLayer) {
    this.overlayScale = layer.scale || 1.0;
  }

  onLayerRotationChange(layer: ImageLayer) {
    this.overlayRotation = layer.rotation || 0;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.recalculateImageBounds();
      this.initCropBoxForCurrentBounds();
    }, 150);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  get canUndo$() {
    return this.photoState.canUndo$;
  }

  get canRedo$() {
    return this.photoState.canRedo$;
  }

  // Header Navigation & History
  goBackHome() {
    this.router.navigate(['/home']);
  }

  onUndo() {
    const restored = this.photoState.undo();
    if (restored) {
      const desc = restored.actionDescription || 'Previous change';
      this.showToast(`Undid: ${desc}`);
    }
  }

  onRedo() {
    const restored = this.photoState.redo();
    if (restored) {
      const desc = restored.actionDescription || 'Change';
      this.showToast(`Redid: ${desc}`);
    }
  }

  startCompare() {
    this.isComparing = true;
  }

  endCompare() {
    this.isComparing = false;
  }

  toggleMoreMenu() {
    this.showMoreMenu = !this.showMoreMenu;
  }

  toggleEditsHistory() {
    this.toggleLayersPanel();
  }

  // Lower Bar Navigation
  setMainTab(tab: 'styles' | 'tools' | 'export') {
    if (tab === 'export') {
      this.showExportSheet = true;
      return;
    }
    if (tab === 'tools') {
      this.activeMainTab = 'tools';
      this.showCustomiseSheet = true; // Directly open the full Tools sheet!
      return;
    }
    this.activeMainTab = tab;
    this.activeToolMode = 'none';
    this.showCustomiseSheet = false;
  }

  // Filtered tools list for the Snapseed sheet
  get filteredTools(): ToolItem[] {
    let list = this.allTools;
    if (this.toolFilterCategory !== 'all') {
      list = list.filter((t) => t.category === this.toolFilterCategory);
    }
    if (this.toolSearchQuery.trim()) {
      const q = this.toolSearchQuery.toLowerCase().trim();
      list = list.filter((t) => t.label.toLowerCase().includes(q));
    }
    return list;
  }

  // Tool Launcher
  openTool(toolId: string) {
    this.showCustomiseSheet = false;

    switch (toolId) {
      case 'layers':
        this.showLayersPanel = true;
        break;

      case 'tune':
        this.activeToolMode = 'tune';
        this.preEditSnapshot = this.captureCurrentStateSnapshot('Tune Image');
        this.preTuneBackupAdjustments = { ...this.state.adjustments };
        this.activeTuneParam = 'brightness';
        break;

      case 'crop':
        this.activeToolMode = 'crop';
        setTimeout(() => {
          this.recalculateImageBounds();
          this.initCropBoxForCurrentBounds();
        }, 50);
        break;

      case 'perspective':
        this.activeToolMode = 'perspective';
        this.preEditSnapshot = this.captureCurrentStateSnapshot('Perspective');
        this.perspectiveTiltX = 0;
        this.perspectiveTiltY = 0;
        this.perspectiveRotate = 0;
        this.perspectiveScale = 1.0;
        break;

      case 'expand':
        this.activeToolMode = 'expand';
        this.preEditSnapshot = this.captureCurrentStateSnapshot('Expand Canvas');
        this.expandAmount = 20;
        this.expandFillMode = 'smart';
        break;

      case 'hdr':
        this.activeToolMode = 'hdr';
        this.preHdrSnapshot = {
          hdrStrength: this.hdrStrength,
          hslHue: this.hslHue,
          hslSaturation: this.hslSaturation,
          hslLuminance: this.hslLuminance,
          state: this.captureCurrentStateSnapshot('HDR-scape')
        };
        break;

      case 'curves':
      case 'details':
        this.activeToolMode = 'curves';
        this.preEditSnapshot = this.captureCurrentStateSnapshot('Curves & Details');
        this.curvesSubTab = toolId === 'details' ? 'details' : 'curves';
        break;

      case 'selective':
        this.activeToolMode = 'selective';
        this.preEditSnapshot = this.captureCurrentStateSnapshot('Selective Adjustment');
        break;

      case 'brush':
        this.activeToolMode = 'brush';
        setTimeout(() => this.initBrushCanvas(), 50);
        break;

      case 'colorgrade':
        this.activeToolMode = 'colorgrade';
        this.preColorGradeSnapshot = {
          shadows: { ...this.colorGradeShadows },
          midtones: { ...this.colorGradeMidtones },
          highlights: { ...this.colorGradeHighlights },
          state: this.captureCurrentStateSnapshot('Colour Grade')
        };
        break;

      case 'whitebalance':
        this.activeToolMode = 'whitebalance';
        this.preWbSnapshot = {
          wbTemperature: this.wbTemperature,
          wbTint: this.wbTint,
          state: this.captureCurrentStateSnapshot('White Balance')
        };
        break;

      case 'overlay':
        this.activeToolMode = 'overlay';
        this.overlaySubTab = 'transform';
        if (this.selectedLayer && this.selectedLayer.type !== 'base') {
          this.syncActiveLayerToOverlay(this.selectedLayer);
          this.preEditSnapshot = this.captureCurrentStateSnapshot(`Overlay: ${this.selectedLayer.name}`);
        } else {
          const firstNonBase = this.layers.find(l => l.type !== 'base');
          if (firstNonBase) {
            this.selectedLayerId = firstNonBase.id;
            this.syncActiveLayerToOverlay(firstNonBase);
            this.preEditSnapshot = this.captureCurrentStateSnapshot(`Overlay: ${firstNonBase.name}`);
          } else {
            this.preEditSnapshot = this.captureCurrentStateSnapshot('Add Overlay');
            const defaultPreset = this.overlayPresets[0];
            const newLayer: ImageLayer = {
              id: 'layer-' + Date.now(),
              name: defaultPreset.name,
              type: 'overlay',
              imageUrl: defaultPreset.dataUrl,
              visible: true,
              opacity: defaultPreset.defaultOpacity,
              blendMode: defaultPreset.recommendedBlend,
              x: 50,
              y: 50,
              scale: 1.0,
              rotation: 0,
              flipH: false,
              flipV: false
            };
            this.layers.push(newLayer);
            this.layers = [...this.layers];
            this.selectedLayerId = newLayer.id;
            this.syncActiveLayerToOverlay(newLayer);
            this.overlaySubTab = 'presets';
          }
        }
        break;

      case 'healing':
        this.activeToolMode = 'healing';
        this.preEditSnapshot = this.captureCurrentStateSnapshot('Healing');
        break;

      case 'customise':
        this.showCustomiseSheet = true;
        break;

      case 'bw':
        this.photoState.pushHistory(this.captureCurrentStateSnapshot('Filter: B&W'), 'Filter: B&W');
        this.photoState.setFilter('bw');
        this.showToast('Applied Black & White');
        break;

      case 'vignette':
        this.photoState.pushHistory(this.captureCurrentStateSnapshot('Vignette'), 'Vignette');
        this.photoState.setAdjustmentQuick('vignette', 35);
        this.showToast('Applied Vignette');
        break;

      default:
        // Preset / Filter fallback
        this.showToast(`Opened ${toolId}`);
        break;
    }
  }

  // ==============================================================
  // 1. TUNE IMAGE LOGIC
  // ==============================================================
  selectTuneParam(param: keyof ImageAdjustments) {
    this.activeTuneParam = param;
  }

  get currentTuneParamMeta(): TuneParamOption {
    return this.tuneParams.find((p) => p.id === this.activeTuneParam) || this.tuneParams[0];
  }

  get currentTuneParamValue(): number {
    return this.state.adjustments[this.activeTuneParam] || 0;
  }

  onTuneSliderInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const val = parseInt(target.value, 10);
    this.photoState.setAdjustmentQuick(this.activeTuneParam, val);
  }

  applyTune() {
    if (this.preEditSnapshot) {
      this.photoState.pushHistory(this.preEditSnapshot, 'Tune Image');
      this.preEditSnapshot = null;
    }
    this.activeToolMode = 'none';
    this.preTuneBackupAdjustments = null;
    this.showToast('Tune adjustments applied');
  }

  cancelTune() {
    if (this.preEditSnapshot) {
      this.photoState.setStateDirectly(this.preEditSnapshot);
      this.preEditSnapshot = null;
    }
    this.activeToolMode = 'none';
    this.preTuneBackupAdjustments = null;
  }

  // ==============================================================
  // 2. CROP LOGIC
  // ==============================================================
  selectAspectRatio(ratio: AspectRatioType) {
    this.photoState.setAspectRatio(ratio);
    const opt = this.aspectRatios.find((r) => r.id === ratio);
    const b = this.currentImgBounds;

    if (!opt?.ratio) {
      this.initCropBoxForCurrentBounds();
      return;
    }

    const targetRatio = opt.ratio;
    let targetW = b.width * 0.9;
    let targetH = targetW / targetRatio;

    if (targetH > b.height * 0.9) {
      targetH = b.height * 0.9;
      targetW = targetH * targetRatio;
    }

    targetW = Math.min(b.width, Math.max(30, targetW));
    targetH = Math.min(b.height, Math.max(30, targetH));

    const centerX = b.x + (b.width - targetW) / 2;
    const centerY = b.y + (b.height - targetH) / 2;

    this.cropBox = {
      x: Math.round(centerX),
      y: Math.round(centerY),
      width: Math.round(targetW),
      height: Math.round(targetH)
    };
  }

  rotate() {
    this.photoState.rotate();
    setTimeout(() => this.onImageLoaded(), 260);
  }

  flipHorizontal() {
    this.photoState.flipHorizontal();
  }

  flipVertical() {
    this.photoState.flipVertical();
  }

  applyCrop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.targetImg?.nativeElement) {
        this.activeToolMode = 'none';
        resolve();
        return;
      }

      const img = this.targetImg.nativeElement;
      const b = this.currentImgBounds;
      if (!b.width || !b.height) {
        this.activeToolMode = 'none';
        resolve();
        return;
      }

      const relX = Math.max(0, Math.min(1, (this.cropBox.x - b.x) / b.width));
      const relY = Math.max(0, Math.min(1, (this.cropBox.y - b.y) / b.height));
      const relW = Math.max(0.05, Math.min(1 - relX, this.cropBox.width / b.width));
      const relH = Math.max(0.05, Math.min(1 - relY, this.cropBox.height / b.height));

      const naturalW = img.naturalWidth || 1200;
      const naturalH = img.naturalHeight || 900;

      const srcX = Math.round(relX * naturalW);
      const srcY = Math.round(relY * naturalH);
      const srcW = Math.round(relW * naturalW);
      const srcH = Math.round(relH * naturalH);

      const maxCropDim = Math.max(srcW, srcH);
      const outputScale = Math.max(1, 1400 / maxCropDim);
      const outW = Math.round(srcW * outputScale);
      const outH = Math.round(srcH * outputScale);

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(60, outW);
      canvas.height = Math.max(60, outH);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        this.activeToolMode = 'none';
        resolve();
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
      this.photoState.applyCroppedImage(croppedUrl, 'Crop');

      this.activeToolMode = 'none';
      this.showToast('Image cropped successfully');
      resolve();
    });
  }

  cancelCrop() {
    this.activeToolMode = 'none';
  }

  // ==============================================================
  // 3. PERSPECTIVE LOGIC
  // ==============================================================
  get perspectiveCssTransform(): string {
    if (this.activeToolMode !== 'perspective') return 'none';
    return `perspective(800px) rotateX(${this.perspectiveTiltX}deg) rotateY(${this.perspectiveTiltY}deg) rotateZ(${this.perspectiveRotate}deg) scale(${this.perspectiveScale})`;
  }

  applyPerspective() {
    if (!this.targetImg?.nativeElement) {
      this.activeToolMode = 'none';
      return;
    }
    const img = this.targetImg.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 900;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((this.perspectiveRotate * Math.PI) / 180);
      ctx.scale(this.perspectiveScale, this.perspectiveScale);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();

      const result = canvas.toDataURL('image/jpeg', 0.95);
      this.photoState.applyCroppedImage(result, 'Perspective');
      this.showToast('Perspective applied');
    }
    this.activeToolMode = 'none';
  }

  cancelPerspective() {
    this.activeToolMode = 'none';
  }

  // ==============================================================
  // 4. EXPAND LOGIC
  // ==============================================================
  applyExpand() {
    if (!this.targetImg?.nativeElement) {
      this.activeToolMode = 'none';
      return;
    }
    const img = this.targetImg.nativeElement;
    const baseW = img.naturalWidth || 1200;
    const baseH = img.naturalHeight || 900;

    const padFactor = 1 + this.expandAmount / 100;
    const newW = Math.round(baseW * padFactor);
    const newH = Math.round(baseH * padFactor);

    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (this.expandFillMode === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, newW, newH);
      } else if (this.expandFillMode === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, newW, newH);
      } else {
        // Smart Fill: Mirror/stretch image background
        ctx.drawImage(img, 0, 0, newW, newH);
        ctx.filter = 'blur(16px)';
        ctx.drawImage(img, 0, 0, newW, newH);
        ctx.filter = 'none';
      }

      // Draw center original
      const offsetX = Math.round((newW - baseW) / 2);
      const offsetY = Math.round((newH - baseH) / 2);
      ctx.drawImage(img, offsetX, offsetY, baseW, baseH);

      const result = canvas.toDataURL('image/jpeg', 0.95);
      this.photoState.applyCroppedImage(result, 'Expand Canvas');
      this.showToast('Image expanded');
    }
    this.activeToolMode = 'none';
  }

  cancelExpand() {
    this.activeToolMode = 'none';
  }

  // ==============================================================
  // 5. HDR - HSL SCAPE LOGIC
  // ==============================================================
  get hdrCssFilter(): string {
    if (this.activeToolMode !== 'hdr') return '';
    const contrast = 100 + this.hdrStrength * 0.4;
    const saturate = 100 + this.hslSaturation * 0.5 + this.hdrStrength * 0.2;
    const brightness = 100 + this.hslLuminance * 0.3;
    const hue = this.hslHue;
    return `contrast(${contrast}%) saturate(${saturate}%) brightness(${brightness}%) hue-rotate(${hue}deg)`;
  }

  applyHdr() {
    if (this.preHdrSnapshot) {
      this.photoState.pushHistory(this.preHdrSnapshot.state, 'HDR-scape');
      this.preHdrSnapshot = null;
    }
    this.photoState.updateAdjustments({
      contrast: Math.min(100, (this.state.adjustments.contrast || 0) + Math.round(this.hdrStrength * 0.3)),
      saturation: Math.min(100, (this.state.adjustments.saturation || 0) + Math.round(this.hslSaturation * 0.4))
    }, 'HDR-scape', true);
    this.activeToolMode = 'none';
    this.showToast('HDR / HSL applied');
  }

  cancelHdr() {
    if (this.preHdrSnapshot) {
      this.hdrStrength = this.preHdrSnapshot.hdrStrength;
      this.hslHue = this.preHdrSnapshot.hslHue;
      this.hslSaturation = this.preHdrSnapshot.hslSaturation;
      this.hslLuminance = this.preHdrSnapshot.hslLuminance;
      this.photoState.setStateDirectly(this.preHdrSnapshot.state);
      this.preHdrSnapshot = null;
    }
    this.activeToolMode = 'none';
  }

  // ==============================================================
  // 6. CURVES & DETAILS LOGIC
  // ==============================================================
  applyCurves() {
    if (this.preEditSnapshot) {
      this.photoState.pushHistory(this.preEditSnapshot, 'Curves & Details');
      this.preEditSnapshot = null;
    }
    this.photoState.updateAdjustments({
      contrast: Math.min(100, (this.state.adjustments.contrast || 0) + Math.round(this.curvePoints.highlights * 0.5)),
      brightness: Math.min(100, (this.state.adjustments.brightness || 0) + Math.round(this.curvePoints.midtones * 0.4))
    }, 'Curves & Details', true);
    this.activeToolMode = 'none';
    this.showToast('Curves & Details applied');
  }

  cancelCurves() {
    if (this.preEditSnapshot) {
      this.photoState.setStateDirectly(this.preEditSnapshot);
      this.preEditSnapshot = null;
    }
    this.activeToolMode = 'none';
  }

  setCurvePreset(preset: 'linear' | 'contrast' | 'bright' | 'fade') {
    switch (preset) {
      case 'contrast':
        this.curvePoints = { blacks: -10, shadows: -15, midtones: 0, highlights: 20, whites: 10 };
        break;
      case 'bright':
        this.curvePoints = { blacks: 5, shadows: 15, midtones: 25, highlights: 15, whites: 5 };
        break;
      case 'fade':
        this.curvePoints = { blacks: 20, shadows: 10, midtones: 0, highlights: -10, whites: -15 };
        break;
      default:
        this.curvePoints = { blacks: 0, shadows: 0, midtones: 0, highlights: 0, whites: 0 };
        break;
    }
  }

  // ==============================================================
  // 7. SELECTIVE LOGIC
  // ==============================================================
  onImageTap(event: MouseEvent | TouchEvent) {
    if (this.activeToolMode !== 'selective' || !this.previewStage) return;
    const stage = this.previewStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const x = Math.round(((clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((clientY - rect.top) / rect.height) * 100);

    this.selectivePoint = { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) };
  }

  applySelective() {
    if (this.preEditSnapshot) {
      this.photoState.pushHistory(this.preEditSnapshot, 'Selective Adjustment');
      this.preEditSnapshot = null;
    }
    this.activeToolMode = 'none';
    this.showToast('Selective adjustment applied');
  }

  cancelSelective() {
    if (this.preEditSnapshot) {
      this.photoState.setStateDirectly(this.preEditSnapshot);
      this.preEditSnapshot = null;
    }
    this.activeToolMode = 'none';
  }

  // ==============================================================
  // 8. BRUSH LOGIC (Interactive Canvas Painting)
  // ==============================================================
  private initBrushCanvas() {
    if (!this.brushCanvas?.nativeElement || !this.previewStage?.nativeElement) return;
    const cvs = this.brushCanvas.nativeElement;
    const rect = this.previewStage.nativeElement.getBoundingClientRect();
    cvs.width = rect.width;
    cvs.height = rect.height;
  }

  onBrushPointerDown(event: PointerEvent) {
    if (this.activeToolMode !== 'brush') return;
    this.isBrushing = true;
    this.paintBrushStroke(event);
  }

  onBrushPointerMove(event: PointerEvent) {
    if (!this.isBrushing || this.activeToolMode !== 'brush') return;
    this.paintBrushStroke(event);
  }

  onBrushPointerUp() {
    this.isBrushing = false;
  }

  private paintBrushStroke(event: PointerEvent) {
    if (!this.brushCanvas?.nativeElement) return;
    const cvs = this.brushCanvas.nativeElement;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const rect = cvs.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.save();
    if (this.brushMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, this.brushSize);
      if (this.brushMode === 'exposure') {
        const isDodge = this.brushIntensity >= 0;
        const color = isDodge ? '255, 255, 255' : '0, 0, 0';
        const alpha = Math.abs(this.brushIntensity) / 250;
        grad.addColorStop(0, `rgba(${color}, ${alpha})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
      } else if (this.brushMode === 'temperature') {
        grad.addColorStop(0, `rgba(255, 170, 60, ${Math.abs(this.brushIntensity) / 300})`);
        grad.addColorStop(1, 'rgba(255, 170, 60, 0)');
      } else {
        grad.addColorStop(0, `rgba(255, 40, 100, ${Math.abs(this.brushIntensity) / 300})`);
        grad.addColorStop(1, 'rgba(255, 40, 100, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  applyBrush() {
    if (!this.targetImg?.nativeElement || !this.brushCanvas?.nativeElement) {
      this.activeToolMode = 'none';
      return;
    }
    const img = this.targetImg.nativeElement;
    const brushCvs = this.brushCanvas.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 900;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(brushCvs, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL('image/jpeg', 0.95);
      this.photoState.applyCroppedImage(result, 'Brush Strokes');
      this.showToast('Brush strokes applied');
    }
    this.activeToolMode = 'none';
  }

  cancelBrush() {
    if (this.brushCanvas?.nativeElement) {
      const ctx = this.brushCanvas.nativeElement.getContext('2d');
      ctx?.clearRect(0, 0, this.brushCanvas.nativeElement.width, this.brushCanvas.nativeElement.height);
    }
    this.activeToolMode = 'none';
  }

  // ==============================================================
  // 8. COLOR GRADE LOGIC
  // ==============================================================
  get colorGradeCssFilter(): string {
    if (this.activeToolMode !== 'colorgrade') return '';
    const shSat = this.colorGradeShadows.sat;
    const shHue = this.colorGradeShadows.hue;
    return `sepia(${Math.round(shSat * 0.3)}%) hue-rotate(${Math.round((shHue - 180) * 0.15)}deg)`;
  }

  applyColorGrade() {
    const pre = this.preColorGradeSnapshot?.state;
    this.preColorGradeSnapshot = null;
    this.photoState.pushHistory(pre || this.captureCurrentStateSnapshot('Colour Grade'), 'Colour Grade');
    const hueDiff = (this.colorGradeHighlights.hue - 180) / 18;
    this.photoState.setStateDirectly({
      ...this.photoState.currentState,
      adjustments: {
        ...this.photoState.currentState.adjustments,
        warmth: Math.max(-100, Math.min(100, (this.photoState.currentState.adjustments.warmth || 0) + Math.round(hueDiff * 2))),
        saturation: Math.max(-100, Math.min(100, (this.photoState.currentState.adjustments.saturation || 0) + Math.round(this.colorGradeShadows.sat * 0.2)))
      },
      actionDescription: 'Colour Grade'
    });
    this.activeToolMode = 'none';
    this.showToast('Color grading applied');
  }

  cancelColorGrade() {
    if (this.preColorGradeSnapshot) {
      this.colorGradeShadows = { ...this.preColorGradeSnapshot.shadows };
      this.colorGradeMidtones = { ...this.preColorGradeSnapshot.midtones };
      this.colorGradeHighlights = { ...this.preColorGradeSnapshot.highlights };
      this.photoState.setStateDirectly(this.preColorGradeSnapshot.state);
      this.preColorGradeSnapshot = null;
    }
    this.activeToolMode = 'none';
  }

  setColorGradePreset(preset: 'teal-orange' | 'sunset' | 'cold' | 'vintage') {
    if (preset === 'teal-orange') {
      this.colorGradeShadows = { hue: 195, sat: 40 }; // Teal
      this.colorGradeHighlights = { hue: 35, sat: 50 }; // Orange
      this.colorGradeMidtones = { hue: 45, sat: 15 };
    } else if (preset === 'sunset') {
      this.colorGradeShadows = { hue: 280, sat: 30 };
      this.colorGradeHighlights = { hue: 40, sat: 60 };
      this.colorGradeMidtones = { hue: 20, sat: 25 };
    } else if (preset === 'cold') {
      this.colorGradeShadows = { hue: 215, sat: 45 };
      this.colorGradeHighlights = { hue: 190, sat: 20 };
      this.colorGradeMidtones = { hue: 210, sat: 25 };
    } else {
      this.colorGradeShadows = { hue: 50, sat: 25 };
      this.colorGradeHighlights = { hue: 60, sat: 30 };
      this.colorGradeMidtones = { hue: 40, sat: 20 };
    }
  }

  // ==============================================================
  // 9. WHITE BALANCE LOGIC
  // ==============================================================
  get wbCssFilter(): string {
    if (this.activeToolMode !== 'whitebalance') return '';
    const warmth = this.wbTemperature;
    const tint = this.wbTint;
    return `sepia(${Math.abs(warmth) * 0.4}%) hue-rotate(${warmth < 0 ? 180 : tint}deg)`;
  }

  autoWhiteBalance() {
    this.wbTemperature = 0;
    this.wbTint = 0;
    this.showToast('White balance normalized');
  }

  applyWhiteBalance() {
    const pre = this.preWbSnapshot?.state;
    this.preWbSnapshot = null;
    const current = this.photoState.currentState;
    this.photoState.pushHistory(pre || this.captureCurrentStateSnapshot('White Balance'), 'White Balance');
    this.photoState.setStateDirectly({
      ...current,
      wbTemperature: this.wbTemperature,
      wbTint: this.wbTint,
      adjustments: {
        ...current.adjustments,
        warmth: this.wbTemperature
      },
      actionDescription: 'White Balance'
    });
    this.activeToolMode = 'none';
    this.showToast('White balance applied');
  }

  cancelWhiteBalance() {
    if (this.preWbSnapshot) {
      this.wbTemperature = this.preWbSnapshot.wbTemperature;
      this.wbTint = this.preWbSnapshot.wbTint;
      this.photoState.setStateDirectly(this.preWbSnapshot.state);
      this.preWbSnapshot = null;
    } else {
      this.wbTemperature = 0;
      this.wbTint = 0;
    }
    this.activeToolMode = 'none';
  }

  // ==============================================================
  // 10. OVERLAY / DOUBLE EXPOSURE LOGIC (Add image, PNG or Presets)
  // ==============================================================
  onOverlayFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const fileName = file.name.replace(/\.[^/.]+$/, "") || 'Overlay Photo';
          this.overlayImageUrl = result;
          this.activeOverlayPresetId = 'custom';
          this.overlayBlendMode = 'normal';
          this.overlayOpacity = 100;
          this.overlayScale = 1.0;
          this.overlayRotation = 0;
          this.overlayFlipH = false;
          this.overlayFlipV = false;
          this.overlayPos = { x: 50, y: 50 };

          if (this.selectedLayer && this.selectedLayer.type !== 'base') {
            this.selectedLayer.imageUrl = result;
            this.selectedLayer.name = fileName;
            this.selectedLayer.blendMode = 'normal';
            this.selectedLayer.opacity = 100;
            this.selectedLayer.visible = true;
            this.selectedLayer.x = 50;
            this.selectedLayer.y = 50;
            this.selectedLayer.scale = 1.0;
            this.selectedLayer.rotation = 0;
            this.selectedLayer.flipH = false;
            this.selectedLayer.flipV = false;
          } else {
            const newLayer: ImageLayer = {
              id: 'layer-' + Date.now(),
              name: fileName,
              type: 'overlay',
              imageUrl: result,
              visible: true,
              opacity: 100,
              blendMode: 'normal',
              x: 50,
              y: 50,
              scale: 1.0,
              rotation: 0,
              flipH: false,
              flipV: false
            };
            this.layers.push(newLayer);
            this.selectedLayerId = newLayer.id;
          }

          this.layers = [...this.layers];
          this.overlaySubTab = 'transform';
          this.showToast(`"${fileName}" uploaded! Drag or scale to position.`);
        }
        input.value = '';
      };
      reader.readAsDataURL(file);
    } else {
      input.value = '';
    }
  }

  triggerOverlayUpload() {
    const el = this.overlayFileInput?.nativeElement || (document.getElementById('overlayFileInput') as HTMLInputElement);
    if (el) {
      el.value = '';
      el.click();
    }
  }

  selectOverlayPreset(presetId: string) {
    const preset = this.overlayPresets.find(p => p.id === presetId);
    if (!preset) return;
    this.activeOverlayPresetId = preset.id;
    this.overlayImageUrl = preset.dataUrl;
    this.overlayBlendMode = preset.recommendedBlend;
    this.overlayOpacity = preset.defaultOpacity;

    if (this.selectedLayer && this.selectedLayer.type !== 'base') {
      this.selectedLayer.imageUrl = preset.dataUrl;
      this.selectedLayer.name = preset.name;
      this.selectedLayer.blendMode = preset.recommendedBlend;
      this.selectedLayer.opacity = preset.defaultOpacity;
      this.selectedLayer.visible = true;
    } else {
      const newLayer: ImageLayer = {
        id: 'layer-' + Date.now(),
        name: preset.name,
        type: 'overlay',
        imageUrl: preset.dataUrl,
        visible: true,
        opacity: preset.defaultOpacity,
        blendMode: preset.recommendedBlend,
        x: 50,
        y: 50,
        scale: 1.0,
        rotation: 0,
        flipH: false,
        flipV: false
      };
      this.layers.push(newLayer);
      this.selectedLayerId = newLayer.id;
    }
    this.layers = [...this.layers];
    this.showToast(`Applied "${preset.name}" overlay`);
  }

  resetOverlayPosition() {
    this.overlayPos = { x: 50, y: 50 };
    this.overlayScale = 1.0;
    this.overlayRotation = 0;
    this.overlayFlipH = false;
    this.overlayFlipV = false;
    this.showToast('Overlay reset to center');
  }

  flipOverlayH() {
    this.overlayFlipH = !this.overlayFlipH;
  }

  flipOverlayV() {
    this.overlayFlipV = !this.overlayFlipV;
  }

  onOverlayPointerDown(event: PointerEvent) {
    this.isOverlayDragging = true;
    (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
  }

  onOverlayPointerMove(event: PointerEvent) {
    if (!this.isOverlayDragging || !this.previewStage?.nativeElement) return;
    const rect = this.previewStage.nativeElement.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    this.overlayPos = { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  }

  onOverlayPointerUp(event: PointerEvent) {
    this.isOverlayDragging = false;
    (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
  }

  applyOverlay() {
    this.syncOverlayToActiveLayer();
    const layerName = this.selectedLayer?.name || 'Overlay Layer';
    if (this.preEditSnapshot) {
      this.photoState.pushHistory(this.preEditSnapshot, `Overlay: ${layerName}`);
      this.preEditSnapshot = null;
    }
    const updatedState = this.captureCurrentStateSnapshot(`Overlay: ${layerName}`);
    this.photoState.setStateDirectly(updatedState);

    this.activeToolMode = 'none';
    this.showToast(`Overlay "${layerName}" applied!`);
  }

  cancelOverlay() {
    if (this.preEditSnapshot) {
      this.photoState.setStateDirectly(this.preEditSnapshot);
      this.preEditSnapshot = null;
    }
    this.activeToolMode = 'none';
  }

  // Healing placeholder
  applyHealing() {
    this.activeToolMode = 'none';
    this.showToast('Spot healed');
  }

  cancelHealing() {
    this.activeToolMode = 'none';
  }

  // Filter Styles Presets
  applyFilterStyle(preset: FilterStylePreset) {
    this.photoState.setFilter(preset.id);
  }

  // Bounds & Layout
  onImageLoaded() {
    this.recalculateImageBounds();
    this.initCropBoxForCurrentBounds();
  }

  private recalculateImageBounds() {
    if (!this.targetImg?.nativeElement || !this.previewStage?.nativeElement) return;
    const img = this.targetImg.nativeElement;
    const stage = this.previewStage.nativeElement;

    const imgRect = img.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();

    this.currentImgBounds = {
      x: Math.max(0, imgRect.left - stageRect.left),
      y: Math.max(0, imgRect.top - stageRect.top),
      width: Math.max(40, imgRect.width),
      height: Math.max(40, imgRect.height)
    };
  }

  private initCropBoxForCurrentBounds() {
    const b = this.currentImgBounds;
    const padX = b.width * 0.08;
    const padY = b.height * 0.08;
    this.cropBox = {
      x: Math.round(b.x + padX),
      y: Math.round(b.y + padY),
      width: Math.round(b.width - padX * 2),
      height: Math.round(b.height - padY * 2)
    };
  }

  // Crop Box Pointer Events
  onPointerDown(event: PointerEvent, action: 'move' | 'tl' | 'tr' | 'bl' | 'br') {
    this.isDragging = true;
    this.dragAction = action;
    this.startPointer = { x: event.clientX, y: event.clientY };
    this.startBox = { ...this.cropBox };
    (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (this.activeDragMode !== 'none' && this.dragLayerTarget) {
      if (this.activeDragMode === 'resize') {
        const currentDist = Math.hypot(
          event.clientX - this.dragLayerCenterScreen.x,
          event.clientY - this.dragLayerCenterScreen.y
        );
        const startDist = Math.hypot(
          this.dragStartPointer.x - this.dragLayerCenterScreen.x,
          this.dragStartPointer.y - this.dragLayerCenterScreen.y
        );
        const ratio = currentDist / Math.max(12, startDist);
        const newScale = Math.max(0.1, Math.min(3.5, +(this.dragStartScale * ratio).toFixed(2)));
        this.dragLayerTarget.scale = newScale;
        this.overlayScale = newScale;
      } else if (this.activeDragMode === 'rotate') {
        const angleRad = Math.atan2(
          event.clientY - this.dragLayerCenterScreen.y,
          event.clientX - this.dragLayerCenterScreen.x
        );
        let deg = Math.round((angleRad * 180) / Math.PI + 90);
        if (deg > 180) deg -= 360;
        if (deg < -180) deg += 360;
        this.dragLayerTarget.rotation = deg;
        this.overlayRotation = deg;
      } else if (this.activeDragMode === 'move') {
        if (this.previewStage?.nativeElement) {
          const stageRect = this.previewStage.nativeElement.getBoundingClientRect();
          const dx = ((event.clientX - this.dragStartPointer.x) / stageRect.width) * 100;
          const dy = ((event.clientY - this.dragStartPointer.y) / stageRect.height) * 100;
          const newX = Math.max(0, Math.min(100, Math.round(this.dragStartLayerPos.x + dx)));
          const newY = Math.max(0, Math.min(100, Math.round(this.dragStartLayerPos.y + dy)));
          this.dragLayerTarget.x = newX;
          this.dragLayerTarget.y = newY;
          this.overlayPos = { x: newX, y: newY };
        }
      }
      return;
    }

    if (!this.isDragging || !this.dragAction) return;

    const dx = event.clientX - this.startPointer.x;
    const dy = event.clientY - this.startPointer.y;
    const b = this.currentImgBounds;

    if (this.dragAction === 'move') {
      const minX = b.x;
      const maxX = b.x + b.width - this.startBox.width;
      const minY = b.y;
      const maxY = b.y + b.height - this.startBox.height;

      this.cropBox = {
        ...this.cropBox,
        x: Math.round(Math.max(minX, Math.min(maxX, this.startBox.x + dx))),
        y: Math.round(Math.max(minY, Math.min(maxY, this.startBox.y + dy)))
      };
    } else {
      let newX = this.startBox.x;
      let newY = this.startBox.y;
      let newW = this.startBox.width;
      let newH = this.startBox.height;

      if (this.dragAction.includes('t')) {
        newY = Math.min(this.startBox.y + this.startBox.height - 30, Math.max(b.y, this.startBox.y + dy));
        newH = this.startBox.height - (newY - this.startBox.y);
      }
      if (this.dragAction.includes('b')) {
        newH = Math.max(30, Math.min(b.y + b.height - this.startBox.y, this.startBox.height + dy));
      }
      if (this.dragAction.includes('l')) {
        newX = Math.min(this.startBox.x + this.startBox.width - 30, Math.max(b.x, this.startBox.x + dx));
        newW = this.startBox.width - (newX - this.startBox.x);
      }
      if (this.dragAction.includes('r')) {
        newW = Math.max(30, Math.min(b.x + b.width - this.startBox.x, this.startBox.width + dx));
      }

      this.cropBox = {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH)
      };
    }
  }

  onPointerUp(event: PointerEvent) {
    if (this.activeDragMode !== 'none') {
      this.activeDragMode = 'none';
      this.dragLayerTarget = null;
      try {
        (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
      } catch {}
      this.photoState.setStateDirectly(this.captureCurrentStateSnapshot());
      return;
    }

    if (!this.isDragging) return;
    this.isDragging = false;
    this.dragAction = null;
    try {
      (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
    } catch {}
  }

  formatValue(val: number): string {
    return val > 0 ? `+${val}` : `${val}`;
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.recalculateImageBounds();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.target as HTMLElement)?.tagName === 'INPUT') return;

    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' || event.key === 'Z') {
        if (event.shiftKey) {
          event.preventDefault();
          this.onRedo();
        } else {
          event.preventDefault();
          this.onUndo();
        }
      } else if (event.key === 'y' || event.key === 'Y') {
        event.preventDefault();
        this.onRedo();
      }
    } else if (event.key === 'Escape') {
      if (this.showCustomiseSheet) {
        this.showCustomiseSheet = false;
      } else if (this.showExportSheet) {
        this.showExportSheet = false;
      } else if (this.showLayersPanel) {
        this.closeLayersPanel();
      } else if (this.activeToolMode !== 'none') {
        this.activeToolMode = 'none';
      } else if (this.showMoreMenu) {
        this.showMoreMenu = false;
      }
    }
  }

  public showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = '';
      }
    }, 2500);
  }
}
