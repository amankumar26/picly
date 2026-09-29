import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'feature/adjust',
    loadComponent: () => import('./feature/adjust/adjust.page').then((m) => m.AdjustPage),
  },
  {
    path: 'feature/filter',
    loadComponent: () => import('./feature/filter/filter.page').then((m) => m.FilterPage),
  },
  {
    path: 'feature/crop',
    loadComponent: () => import('./feature/crop/crop.page').then((m) => m.CropPage),
  },
  {
    path: 'feature/save',
    loadComponent: () => import('./feature/save/save.page').then((m) => m.SavePage),
  },
  // Friendly shortcuts
  {
    path: 'adjust',
    redirectTo: 'feature/adjust',
    pathMatch: 'full'
  },
  {
    path: 'filter',
    redirectTo: 'feature/filter',
    pathMatch: 'full'
  },
  {
    path: 'crop',
    redirectTo: 'feature/crop',
    pathMatch: 'full'
  },
  {
    path: 'save',
    redirectTo: 'feature/save',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home',
  }
];
