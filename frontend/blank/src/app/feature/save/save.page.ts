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
      const dataUrl = await this.renderFinalCanvas();
      const link = document.createElement('a');
      const ext = this.selectedFormat === 'image/png' ? 'png' : this.selectedFormat === 'image/webp' ? 'webp' : 'jpg';
      link.download = `photo-edit-${Date.now()}.${ext}`;
      link.href = dataUrl;
      link.click();
      
      this.exportSuccess = true;
      setTimeout(() => (this.exportSuccess = false), 3500);

      // Save to recent edits list
      this.photoState.addRecentEdit(`Edit ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, dataUrl, this.state);
    } catch (e) {
      console.error('Error rendering image:', e);
    } finally {
      this.isExporting = false;
    }
  }

  async shareImage() {
    try {
      const dataUrl = await this.renderFinalCanvas();
      if (navigator.share) {
        // Convert to blob for sharing
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'photo-edit.jpg', { type: this.selectedFormat });
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
      // Fallback if user cancels or unavailable
      console.log('Share dismissed or completed', e);
      this.downloadImage();
    }
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  private renderFinalCanvas(): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        let width = img.naturalWidth || 800;
        let height = img.naturalHeight || 600;

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

        ctx.filter = this.filterCss;
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((this.state.rotation * Math.PI) / 180);
        ctx.scale(this.state.flipH ? -1 : 1, this.state.flipV ? -1 : 1);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();

        const result = canvas.toDataURL(this.selectedFormat, this.selectedQuality);
        resolve(result);
      };
      img.onerror = reject;
      img.src = this.state.imageUrl;
    });
  }
}
