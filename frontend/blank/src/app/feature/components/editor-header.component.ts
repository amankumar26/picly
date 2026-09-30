import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PhotoStateService } from '../photo-state.service';

@Component({
  selector: 'app-editor-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="editor-header">
      <button class="icon-btn close-btn" (click)="onClose()" title="Close editor (Esc)" aria-label="Close editor">
        <i class="ti ti-x"></i>
        <span class="desktop-text">Exit</span>
      </button>

      <div class="header-center-info">
        <span class="desktop-badge">STUDIO</span>
        <span class="desktop-title">{{ (photoState.state$ | async)?.title || 'Photo' }}</span>
      </div>

      <div class="history-actions">
        <button 
          class="icon-btn" 
          [class.disabled]="!(canUndo$ | async)" 
          [disabled]="!(canUndo$ | async)"
          (click)="onUndo()" 
          title="Undo (Ctrl+Z)"
          aria-label="Undo">
          <i class="ti ti-arrow-back-up"></i>
        </button>
        <button 
          class="icon-btn" 
          [class.disabled]="!(canRedo$ | async)" 
          [disabled]="!(canRedo$ | async)"
          (click)="onRedo()" 
          title="Redo (Ctrl+Y)"
          aria-label="Redo">
          <i class="ti ti-arrow-forward-up"></i>
        </button>
      </div>

      <button class="icon-btn check-btn" (click)="onDone()" title="Save & Export" aria-label="Done">
        <i class="ti ti-check"></i>
        <span class="desktop-done-text">Done</span>
      </button>
    </header>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      flex-shrink: 0;
      z-index: 20;
    }

    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: max(12px, env(safe-area-inset-top, 12px)) 16px 12px;
      font-size: 15px;
      background: var(--surface-bg, #0e0f12);
      border-bottom: 0.5px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
    }

    .desktop-text,
    .desktop-done-text {
      display: none;
    }

    .header-center-info {
      display: none;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--text-primary, #ffffff);
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s, color 0.2s, opacity 0.2s, transform 0.15s;
    }

    .icon-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .icon-btn:active:not(:disabled) {
      transform: scale(0.92);
    }

    .icon-btn.disabled,
    .icon-btn:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }

    .history-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .icon-btn i {
      font-size: 20px;
    }

    .check-btn {
      color: #000000;
      background: #ffffff;
      border-radius: 50%;
      padding: 6px;
      box-shadow: 0 2px 10px rgba(255, 255, 255, 0.3);
      font-weight: 700;
    }

    .check-btn i {
      font-size: 18px;
    }

    @media (min-width: 768px) {
      .editor-header {
        padding: 14px 32px 14px;
      }

      .desktop-text,
      .desktop-done-text {
        display: inline;
        font-size: 13px;
        font-weight: 600;
        margin-left: 6px;
      }

      .close-btn {
        padding: 6px 14px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.06);
      }

      .header-center-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .desktop-badge {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.25);
        padding: 2px 7px;
        border-radius: 4px;
      }

      .desktop-title {
        font-size: 14px;
        font-weight: 700;
        color: #ffffff;
        max-width: 240px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .check-btn {
        border-radius: 9999px;
        padding: 7px 18px;
      }
    }
  `]
})
export class EditorHeaderComponent {
  @Input() nextRoute: string = '/feature/save';
  @Input() customDoneAction?: () => void;

  public canUndo$ = this.photoState.canUndo$;
  public canRedo$ = this.photoState.canRedo$;

  constructor(
    private router: Router,
    public photoState: PhotoStateService
  ) {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  onClose() {
    this.router.navigate(['/home']);
  }

  onUndo() {
    this.photoState.undo();
  }

  onRedo() {
    this.photoState.redo();
  }

  onDone() {
    if (this.customDoneAction) {
      this.customDoneAction();
    } else {
      this.router.navigate([this.nextRoute]);
    }
  }
}
