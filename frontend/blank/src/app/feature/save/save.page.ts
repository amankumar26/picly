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
    const img = await this.photoState.loadSafeImage(this.state.imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    let width = img.naturalWidth || img.width || 800;
    let height = img.naturalHeight || img.height || 600;

    // Apply crop aspect ratio if chosen
    if (this.state.aspectRatio === '1:1') {
      const side = Math.min(width, height);
      width = side;
      height = side;
    } else if (this.state.aspectRatio === '4:3') {
      height = Math.round(width * 3 / 4);
    } else if (this.state.aspectRatio === '16:9') {
      height = Math.round(width * 9 / 16);
    }

    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (this.filterCss && this.filterCss.trim() !== '' && this.filterCss !== 'none') {
      try {
        ctx.filter = this.filterCss;
      } catch {}
    }
    
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((this.state.rotation * Math.PI) / 180);
    ctx.scale(this.state.flipH ? -1 : 1, this.state.flipV ? -1 : 1);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();

    return await this.photoState.getCanvasOutput(canvas, this.selectedFormat, this.selectedQuality);
  }

  private async renderFinalCanvas(): Promise<string> {
    const { dataUrl } = await this.renderFinalCanvasOutput();
    return dataUrl;
  }
}
