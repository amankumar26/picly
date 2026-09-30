import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PhotoStateService, EditorState } from '../photo-state.service';
import { EditorHeaderComponent } from '../components/editor-header.component';
import { EditorBottomBarComponent } from '../components/editor-bottom-bar.component';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-save',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorHeaderComponent, EditorBottomBarComponent],
  templateUrl: './save.page.html',
  styleUrls: ['./save.page.scss']
})
export class SavePage implements OnInit, OnDestroy {
  public state!: EditorState;
  public filterCss: string = '';
  public selectedFormat: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/jpeg';
  public selectedQuality: number = 0.92;
  public isExporting = false;
  public exportSuccess = false;
  private sub = new Subscription();

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

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  async downloadImage() {
    this.isExporting = true;
    try {
      const { dataUrl, blob } = await this.renderFinalCanvasOutput();
      const ext = this.selectedFormat === 'image/png' ? 'png' : this.selectedFormat === 'image/webp' ? 'webp' : 'jpg';
      const cleanTitle = (this.state.title || 'photo-edit').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'picly-edit';
      const filename = `${cleanTitle}-${Date.now()}.${ext}`;

      // 1. Download to device storage
      this.photoState.downloadBlobOrDataUrl(blob, filename);

      // 2. Automatically save project state in local storage
      try {
        const storageUrl = await this.photoState.createStorageOptimizedDataUrl(dataUrl, 1080);
        this.photoState.saveProject(cleanTitle, {
          ...this.state,
          imageUrl: storageUrl
        });
      } catch (saveErr) {
        console.warn('Could not auto-sync project in recents:', saveErr);
      }
      
      this.exportSuccess = true;
      setTimeout(() => (this.exportSuccess = false), 3500);
    } catch (e) {
      console.error('Error rendering/exporting image:', e);
    } finally {
      this.isExporting = false;
    }
  }

  async shareImage() {
    try {
      const { dataUrl, blob } = await this.renderFinalCanvasOutput();
      const ext = this.selectedFormat === 'image/png' ? 'png' : this.selectedFormat === 'image/webp' ? 'webp' : 'jpg';
      const filename = `photo-edit-${Date.now()}.${ext}`;

      if (navigator.share) {
        const file = new File([blob], filename, { type: this.selectedFormat });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Edited Photo',
            text: 'Check out this photo edited with Photo Editor!',
            files: [file]
          });
          return;
        }
      }
      
      // Capacitor Share fallback
      await Share.share({
        title: 'My Photo Edit',
        text: 'Created with Photo Editor',
        url: dataUrl,
        dialogTitle: 'Share your photo'
      });
    } catch (e) {
      console.log('Share dismissed or completed', e);
    }
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  private async renderFinalCanvasOutput(): Promise<{ dataUrl: string; blob: Blob }> {
    const baseSrc = this.state.imageUrl;
    const img = await this.photoState.loadSafeImage(baseSrc);
    const naturalW = img.naturalWidth || img.width || 1200;
    const naturalH = img.naturalHeight || img.height || 900;
    const rot = ((this.state.rotation || 0) % 360 + 360) % 360;
    const isRotated90 = rot === 90 || rot === 270;

    let width = isRotated90 ? naturalH : naturalW;
    let height = isRotated90 ? naturalW : naturalH;

    // Apply crop aspect ratio if chosen
    if (this.state.aspectRatio === '1:1') {
      const side = Math.min(width, height);
      width = side;
      height = side;
    } else if (this.state.aspectRatio === '4:3') {
      height = Math.round((width * 3) / 4);
    } else if (this.state.aspectRatio === '16:9') {
      height = Math.round((width * 9) / 16);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const currentFilterCss = this.photoState.getFilterCssString(this.state);
    let filterAppliedSuccessfully = false;

    if (currentFilterCss && currentFilterCss !== 'none') {
      try {
        ctx.filter = currentFilterCss;
        if (ctx.filter && ctx.filter !== 'none') {
          filterAppliedSuccessfully = true;
        }
      } catch {
        ctx.filter = 'none';
      }
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    if (rot !== 0) {
      ctx.rotate((rot * Math.PI) / 180);
    }
    ctx.scale(this.state.flipH ? -1 : 1, this.state.flipV ? -1 : 1);
    ctx.drawImage(img, -naturalW / 2, -naturalH / 2, naturalW, naturalH);
    ctx.restore();

    if (currentFilterCss && currentFilterCss !== 'none' && !filterAppliedSuccessfully) {
      this.photoState.applySoftwareFilters(ctx, canvas.width, canvas.height, this.state);
    }

    // Vignette
    const vignetteAmount = (this.state.adjustments?.vignette || 0) / 100;
    if (vignetteAmount > 0) {
      ctx.save();
      const maxDim = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        maxDim * Math.max(0.1, 0.65 - vignetteAmount * 0.4),
        canvas.width / 2,
        canvas.height / 2,
        maxDim
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.95, vignetteAmount * 0.85)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Upper layers
    if (this.state.layers && Array.isArray(this.state.layers)) {
      for (const layer of this.state.layers) {
        if (layer.type === 'base' || !layer.visible) continue;
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

          const baseWidthRatio = ((layer as any).baseWidthPct ?? 100) / 100;
          const overW = canvas.width * baseWidthRatio;
          const lNatW = lImg.naturalWidth || lImg.width || 800;
          const lNatH = lImg.naturalHeight || lImg.height || 600;
          const overH = (overW * lNatH) / lNatW;
          ctx.drawImage(lImg, -overW / 2, -overH / 2, overW, overH);
          ctx.restore();
        } catch {}
      }
    }

    return await this.photoState.getCanvasOutput(canvas, this.selectedFormat, this.selectedQuality);
  }

  private async renderFinalCanvas(): Promise<string> {
    const { dataUrl } = await this.renderFinalCanvasOutput();
    return dataUrl;
  }
}
