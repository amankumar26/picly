import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editor-bottom-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="editor-bottom-nav">
      <button 
        type="button" 
        class="nav-item" 
        [class.active]="activeTab === 'adjust'"
        (click)="navigate('/feature/adjust')">
        <i class="ti ti-adjustments"></i>
        <span>Adjust</span>
      </button>

      <button 
        type="button" 
        class="nav-item" 
        [class.active]="activeTab === 'filters'"
        (click)="navigate('/feature/filter')">
        <i class="ti ti-wand"></i>
        <span>Filters</span>
      </button>

      <button 
        type="button" 
        class="nav-item" 
        [class.active]="activeTab === 'crop'"
        (click)="navigate('/feature/crop')">
        <i class="ti ti-crop"></i>
        <span>Crop</span>
      </button>

      <button 
        type="button" 
        class="nav-item" 
        [class.active]="activeTab === 'save'"
        (click)="navigate('/feature/save')">
        <i class="ti ti-download"></i>
        <span>Save</span>
      </button>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      flex-shrink: 0;
      z-index: 20;
    }

    .editor-bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 10px 8px max(14px, env(safe-area-inset-bottom, 14px));
      background: var(--surface-bg, #0e0f12);
      border-top: 0.5px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
    }

    .nav-item {
      background: transparent;
      border: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-secondary, #9da3af);
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 8px;
      transition: color 0.2s, transform 0.15s, background-color 0.2s;
    }

    .nav-item i {
      font-size: 20px;
    }

    .nav-item:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    .nav-item:active {
      transform: scale(0.92);
    }

    .nav-item.active {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    }

    .nav-item.active i {
      transform: translateY(-1px);
    }
  `]
})
export class EditorBottomBarComponent {
  @Input() activeTab: 'adjust' | 'filters' | 'crop' | 'save' = 'adjust';

  constructor(private router: Router) {}

  navigate(url: string) {
    this.router.navigate([url]);
  }
}
