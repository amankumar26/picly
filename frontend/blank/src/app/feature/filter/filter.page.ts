import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PhotoStateService, EditorState, FilterType } from '../photo-state.service';
import { EditorHeaderComponent } from '../components/editor-header.component';
import { EditorBottomBarComponent } from '../components/editor-bottom-bar.component';

interface FilterPresetItem {
  id: FilterType;
  name: string;
  cssStyle: string;
}

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, EditorHeaderComponent, EditorBottomBarComponent],
  templateUrl: './filter.page.html',
  styleUrls: ['./filter.page.scss']
})
export class FilterPage implements OnInit, OnDestroy {
  public state!: EditorState;
  public filterCss: string = '';
  private sub = new Subscription();

  public filterPresets: FilterPresetItem[] = [
    { id: 'none', name: 'None', cssStyle: 'none' },
    { id: 'bw', name: 'B&W', cssStyle: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', cssStyle: 'sepia(85%) contrast(110%)' },
    { id: 'warm', name: 'Warm', cssStyle: 'sepia(35%) saturate(140%) hue-rotate(-15deg)' },
    { id: 'cool', name: 'Cool', cssStyle: 'hue-rotate(180deg) saturate(110%)' },
    { id: 'vintage', name: 'Vintage', cssStyle: 'sepia(40%) contrast(120%) brightness(90%)' },
    { id: 'vivid', name: 'Vivid', cssStyle: 'saturate(190%) contrast(115%)' },
    { id: 'drama', name: 'Drama', cssStyle: 'contrast(150%) brightness(90%) saturate(120%)' }
  ];

  constructor(public photoState: PhotoStateService) {}

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

  selectFilter(filter: FilterType) {
    this.photoState.setFilter(filter);
  }
}
