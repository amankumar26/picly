import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PhotoStateService } from '../photo-state.service';

@Component({
  selector: 'app-editor-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="editor-header">
      <button class="icon-btn" (click)="onClose()" title="Close editor" aria-label="Close editor">
        <i class="ti ti-x"></i>
      </button>

      <div class="history-actions">
        <button 
          class="icon-btn" 
          [class.disabled]="!(canUndo$ | async)" 
          [disabled]="!(canUndo$ | async)"
          (click)="onUndo()" 
          title="Undo"
          aria-label="Undo">
          <i class="ti ti-arrow-back-up"></i>
        </button>
        <button 
          class="icon-btn" 
          [class.disabled]="!(canRedo$ | async)" 
          [disabled]="!(canRedo$ | async)"
          (click)="onRedo()" 
          title="Redo"
          aria-label="Redo">
          <i class="ti ti-arrow-forward-up"></i>
        </button>
      </div>

      <button class="icon-btn check-btn" (click)="onDone()" title="Save & Export" aria-label="Done">
        <i class="ti ti-check"></i>
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
      transition: background-color 0.2s, color 0.2s, opacity 0.2s;
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
    }

    .check-btn i {
      font-size: 18px;
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
    private photoState: PhotoStateService
  ) {}

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
