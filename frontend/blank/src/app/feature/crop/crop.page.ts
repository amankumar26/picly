import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PhotoStateService, EditorState, AspectRatioType } from '../photo-state.service';
import { EditorHeaderComponent } from '../components/editor-header.component';
import { EditorBottomBarComponent } from '../components/editor-bottom-bar.component';

interface AspectRatioOption {
  id: AspectRatioType;
  label: string;
  ratio?: number; // width / height
}

interface ImageRenderBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-crop',
  standalone: true,
  imports: [CommonModule, EditorHeaderComponent, EditorBottomBarComponent],
  templateUrl: './crop.page.html',
  styleUrls: ['./crop.page.scss']
})
export class CropPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('previewStage', { static: false }) previewStage!: ElementRef<HTMLDivElement>;
  @ViewChild('targetImg', { static: false }) targetImg!: ElementRef<HTMLImageElement>;

  public state!: EditorState;
  public filterCss: string = '';
  public cropSuccessMessage: string | null = null;
  private sub = new Subscription();

  public aspectRatios: AspectRatioOption[] = [
    { id: 'free', label: 'Free' },
    { id: '1:1', label: '1:1', ratio: 1 },
    { id: '4:3', label: '4:3', ratio: 4 / 3 },
    { id: '16:9', label: '16:9', ratio: 16 / 9 },
    { id: '9:16', label: '9:16', ratio: 9 / 16 }
  ];

  // Crop box in pixels relative to previewStage
  public cropBox = {
    x: 10,
    y: 10,
    width: 200,
    height: 150
  };

  private currentImgBounds: ImageRenderBounds = { x: 0, y: 0, width: 300, height: 200 };
  private isDragging = false;
  private dragAction: 'move' | 'tl' | 'tr' | 'bl' | 'br' | null = null;
  private startPointer = { x: 0, y: 0 };
  private startBox = { x: 0, y: 0, width: 0, height: 0 };

  constructor(
    public photoState: PhotoStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub.add(
      this.photoState.state$.subscribe((s) => {
        this.state = s;
        this.filterCss = this.photoState.getFilterCssString(s);
      })
    );
  }

  ngAfterViewInit() {
    setTimeout(() => this.recalculateImageBounds(), 150);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onImageLoaded() {
    setTimeout(() => {
      this.recalculateImageBounds();
      this.initCropBoxForCurrentBounds();
    }, 50);
  }

  // Accurately calculates where the image is rendered inside previewStage with object-fit: contain
  private recalculateImageBounds() {
    if (!this.targetImg?.nativeElement || !this.previewStage?.nativeElement) return;

    const img = this.targetImg.nativeElement;
    const stage = this.previewStage.nativeElement;
    const stageW = stage.clientWidth || 340;
    const stageH = stage.clientHeight || 240;

    const naturalW = img.naturalWidth || 800;
    const naturalH = img.naturalHeight || 600;
    const imgAspect = naturalW / naturalH;
    const stageAspect = stageW / stageH;

    let renderW: number;
    let renderH: number;
    let renderX: number;
    let renderY: number;

    if (imgAspect > stageAspect) {
      // Fit to stage width
      renderW = stageW;
      renderH = renderW / imgAspect;
      renderX = 0;
      renderY = (stageH - renderH) / 2;
    } else {
      // Fit to stage height
      renderH = stageH;
      renderW = renderH * imgAspect;
      renderX = (stageW - renderW) / 2;
      renderY = 0;
    }

    this.currentImgBounds = {
      x: Math.round(renderX),
      y: Math.round(renderY),
      width: Math.round(renderW),
      height: Math.round(renderH)
    };
  }

  // Snaps the initial crop box snugly to the actual rendered image
  private initCropBoxForCurrentBounds() {
    const b = this.currentImgBounds;
    const pad = 6;
    const w = Math.max(30, b.width - pad * 2);
    const h = Math.max(30, b.height - pad * 2);

    this.cropBox = {
      x: b.x + pad,
      y: b.y + pad,
      width: w,
      height: h
    };

    // Reapply selected aspect ratio if active
    if (this.state.aspectRatio && this.state.aspectRatio !== 'free') {
      this.selectAspectRatio(this.state.aspectRatio);
    }
  }

  // Unified Pointer events for touch and mouse
  onPointerDown(event: PointerEvent, action: 'move' | 'tl' | 'tr' | 'bl' | 'br') {
    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.dragAction = action;
    this.startPointer = { x: event.clientX, y: event.clientY };
    this.startBox = { ...this.cropBox };

    const target = event.target as HTMLElement;
    if (target && target.setPointerCapture) {
      try {
        target.setPointerCapture(event.pointerId);
      } catch {}
    }
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDragging || !this.dragAction) return;
    event.preventDefault();

    const deltaX = event.clientX - this.startPointer.x;
    const deltaY = event.clientY - this.startPointer.y;
    const b = this.currentImgBounds;

    if (this.dragAction === 'move') {
      let newX = this.startBox.x + deltaX;
      let newY = this.startBox.y + deltaY;

      // Constrain inside image rendered bounds
      newX = Math.max(b.x, Math.min(b.x + b.width - this.startBox.width, newX));
      newY = Math.max(b.y, Math.min(b.y + b.height - this.startBox.height, newY));

      this.cropBox.x = Math.round(newX);
      this.cropBox.y = Math.round(newY);
    } else {
      // Resize handles
      let newX = this.startBox.x;
      let newY = this.startBox.y;
      let newW = this.startBox.width;
      let newH = this.startBox.height;

      const minSize = 25;

      if (this.dragAction === 'br') {
        newW = Math.max(minSize, Math.min(b.x + b.width - this.startBox.x, this.startBox.width + deltaX));
        newH = Math.max(minSize, Math.min(b.y + b.height - this.startBox.y, this.startBox.height + deltaY));
      } else if (this.dragAction === 'bl') {
        const potentialW = this.startBox.width - deltaX;
        if (potentialW >= minSize && this.startBox.x + deltaX >= b.x) {
          newX = this.startBox.x + deltaX;
          newW = potentialW;
        }
        newH = Math.max(minSize, Math.min(b.y + b.height - this.startBox.y, this.startBox.height + deltaY));
      } else if (this.dragAction === 'tr') {
        newW = Math.max(minSize, Math.min(b.x + b.width - this.startBox.x, this.startBox.width + deltaX));
        const potentialH = this.startBox.height - deltaY;
        if (potentialH >= minSize && this.startBox.y + deltaY >= b.y) {
          newY = this.startBox.y + deltaY;
          newH = potentialH;
        }
      } else if (this.dragAction === 'tl') {
        const potentialW = this.startBox.width - deltaX;
        const potentialH = this.startBox.height - deltaY;
        if (potentialW >= minSize && this.startBox.x + deltaX >= b.x) {
          newX = this.startBox.x + deltaX;
          newW = potentialW;
        }
        if (potentialH >= minSize && this.startBox.y + deltaY >= b.y) {
          newY = this.startBox.y + deltaY;
          newH = potentialH;
        }
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
    if (!this.isDragging) return;
    this.isDragging = false;
    this.dragAction = null;
    const target = event.target as HTMLElement;
    if (target && target.releasePointerCapture) {
      try {
        target.releasePointerCapture(event.pointerId);
      } catch {}
    }
  }

  selectAspectRatio(ratio: AspectRatioType) {
    this.photoState.setAspectRatio(ratio);
    const opt = this.aspectRatios.find((r) => r.id === ratio);
    const b = this.currentImgBounds;

    if (!opt?.ratio) {
      // Free: set to 95% of image
      this.initCropBoxForCurrentBounds();
      return;
    }

    const targetRatio = opt.ratio; // W / H
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

  resetCrop() {
    this.photoState.setAspectRatio('free');
    this.initCropBoxForCurrentBounds();
  }

  // Executes high-resolution crop so the image never degrades or shrinks
  applyCrop(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.targetImg?.nativeElement) {
        resolve(null);
        return;
      }

      const img = this.targetImg.nativeElement;
      const b = this.currentImgBounds;

      if (!b.width || !b.height) {
        resolve(null);
        return;
      }

      // Exact relative coordinates on the rendered image (0.0 to 1.0)
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

      // Keep resolution high (target at least 1400px on the longest dimension)
      const maxCropDim = Math.max(srcW, srcH);
      const outputScale = Math.max(1, 1400 / maxCropDim);
      const outW = Math.round(srcW * outputScale);
      const outH = Math.round(srcH * outputScale);

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(60, outW);
      canvas.height = Math.max(60, outH);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const sourceImage = new Image();
      sourceImage.crossOrigin = 'anonymous';
      sourceImage.onload = () => {
        if (this.state.rotation !== 0 || this.state.flipH || this.state.flipV) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = naturalW;
          tempCanvas.height = naturalH;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.save();
            tempCtx.translate(naturalW / 2, naturalH / 2);
            tempCtx.rotate((this.state.rotation * Math.PI) / 180);
            tempCtx.scale(this.state.flipH ? -1 : 1, this.state.flipV ? -1 : 1);
            tempCtx.drawImage(sourceImage, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
            tempCtx.restore();

            ctx.drawImage(tempCanvas, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
          }
        } else {
          ctx.drawImage(sourceImage, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
        }

        const croppedDataUrl = canvas.toDataURL('image/png');
        this.photoState.applyCroppedImage(croppedDataUrl);

        this.cropSuccessMessage = 'Crop applied! Image fills frame.';
        setTimeout(() => {
          this.cropSuccessMessage = null;
        }, 2500);

        resolve(croppedDataUrl);
      };
      sourceImage.src = this.state.imageUrl;
    });
  }

  applyCropAndProceed = async () => {
    await this.applyCrop();
    this.router.navigate(['/feature/save']);
  };

  @HostListener('window:resize')
  onResize() {
    this.onImageLoaded();
  }
}
