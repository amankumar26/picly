import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PhotoStateService, RecentEdit } from '../feature/photo-state.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface GalleryPhoto {
  id: string;
  title: string;
  imageUrl: string;
  date?: string;
  album: 'all' | 'recent' | 'camera' | 'downloads';
  aspectRatio?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;

  public isSelectMode = false;
  public selectedPhotoIds = new Set<string>();
  public selectedPhoto: GalleryPhoto | null = null;
  public showAlbumDropdown = false;
  public showMoreMenu = false;
  public currentAlbum = 'ALL';
  public viewMode: 'grid' | 'list' = 'grid';
  public toastMessage = '';

  // Gallery Photos matching the Snapseed home grid aesthetic
  public galleryPhotos: GalleryPhoto[] = [];

  constructor(
    public photoState: PhotoStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initGallery();
  }

  private initGallery() {
    const deletedIds = this.getDeletedPhotoIds();

    // Deduplicate recents from photoState
    const uniqueRecents: GalleryPhoto[] = [];
    const seenRecentUrls = new Set<string>();
    for (const r of this.photoState.recentEdits) {
      if (!deletedIds.has(r.id) && !seenRecentUrls.has(r.imageUrl)) {
        seenRecentUrls.add(r.imageUrl);
        uniqueRecents.push({
          id: r.id,
          title: r.title,
          imageUrl: r.imageUrl,
          date: r.date,
          album: 'recent'
        });
      }
    }

    // Curated gallery images matching the user's screenshot
    const curatedPhotos: GalleryPhoto[] = [
      {
        id: 'cur-1',
        title: 'Man in Chair Portrait',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        date: 'Today, 1:49 PM',
        album: 'camera'
      },
      {
        id: 'cur-2',
        title: 'Community Gathering',
        imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
        date: 'Today, 1:15 PM',
        album: 'camera'
      },
      {
        id: 'cur-3',
        title: 'Newspaper Document',
        imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
        date: 'Yesterday',
        album: 'downloads'
      },
      {
        id: 'cur-4',
        title: 'Daily Bulletin Notice',
        imageUrl: 'https://images.unsplash.com/photo-1572945753563-804956783134?auto=format&fit=crop&w=600&q=80',
        date: 'Yesterday',
        album: 'downloads'
      },
      {
        id: 'cur-5',
        title: 'Student Portrait',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
        date: '2 days ago',
        album: 'camera'
      },
      {
        id: 'cur-6',
        title: 'Stairway to Clouds',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        date: '3 days ago',
        album: 'downloads'
      },
      {
        id: 'cur-7',
        title: 'Express Train News',
        imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
        date: '4 days ago',
        album: 'downloads'
      },
      {
        id: 'cur-8',
        title: 'Village Rural Event',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
        date: '5 days ago',
        album: 'camera'
      },
      {
        id: 'cur-9',
        title: 'Urban Architecture',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        date: 'Last week',
        album: 'camera'
      }
    ];

    const activeCurated = curatedPhotos.filter(p => !deletedIds.has(p.id));
    const savedUserPhotos = this.getSavedUserPhotos().filter(p => !deletedIds.has(p.id));

    // Combine and strictly deduplicate every photo by imageUrl
    const combined: GalleryPhoto[] = [];
    const seenUrls = new Set<string>();

    for (const p of [...savedUserPhotos, ...uniqueRecents, ...activeCurated]) {
      if (!seenUrls.has(p.imageUrl)) {
        seenUrls.add(p.imageUrl);
        combined.push(p);
      }
    }

    this.galleryPhotos = combined;

    // Clean up duplicates in storage
    try {
      this.photoState.recentEdits = this.photoState.recentEdits.filter(
        (r, idx, self) => !deletedIds.has(r.id) && self.findIndex(e => e.imageUrl === r.imageUrl) === idx
      );
      localStorage.setItem('pe_recent_edits', JSON.stringify(this.photoState.recentEdits));
    } catch {}

    // If an image was recently active in state, select it
    const currentState = this.photoState.currentState;
    if (currentState && currentState.imageUrl) {
      const match = this.galleryPhotos.find(p => p.imageUrl === currentState.imageUrl);
      if (match) {
        this.selectedPhoto = match;
      }
    }
  }

  private getDeletedPhotoIds(): Set<string> {
    try {
      const stored = localStorage.getItem('pe_deleted_photo_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveDeletedPhotoId(id: string) {
    try {
      const current = this.getDeletedPhotoIds();
      current.add(id);
      localStorage.setItem('pe_deleted_photo_ids', JSON.stringify(Array.from(current)));
    } catch {}
  }

  private saveDeletedPhotoIds(ids: string[]) {
    try {
      const current = this.getDeletedPhotoIds();
      ids.forEach(id => current.add(id));
      localStorage.setItem('pe_deleted_photo_ids', JSON.stringify(Array.from(current)));
    } catch {}
  }

  private getSavedUserPhotos(): GalleryPhoto[] {
    try {
      const stored = localStorage.getItem('pe_user_gallery_photos');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveUserPhoto(photo: GalleryPhoto) {
    try {
      const existing = this.getSavedUserPhotos();
      const updated = [photo, ...existing.filter(p => p.id !== photo.id)].slice(0, 20);
      localStorage.setItem('pe_user_gallery_photos', JSON.stringify(updated));
    } catch {
      // Storage quota or disabled
    }
  }

  get filteredPhotos(): GalleryPhoto[] {
    if (this.currentAlbum === 'ALL') {
      return this.galleryPhotos;
    }
    const cat = this.currentAlbum.toLowerCase();
    return this.galleryPhotos.filter(p => p.album === cat);
  }

  // User Actions
  onAddPhotoClick() {
    this.fileInput.nativeElement.click();
  }

  async onCameraClick() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        this.processNewImage(image.dataUrl, 'Captured Photo');
      }
    } catch {
      // Fallback for desktop / web without camera permissions: trigger file camera input
      this.cameraInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const title = file.name.replace(/\.[^/.]+$/, '');
          this.processNewImage(result, title);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  private processNewImage(dataUrl: string, title: string) {
    const newPhoto: GalleryPhoto = {
      id: 'photo-' + Date.now(),
      title,
      imageUrl: dataUrl,
      date: 'Just now',
      album: 'camera'
    };

    // Prepend to gallery
    this.galleryPhotos.unshift(newPhoto);
    this.saveUserPhoto(newPhoto);

    // Set as selected photo and push to state
    this.selectedPhoto = newPhoto;
    this.photoState.setImage(dataUrl, title);

    this.showToast('Photo uploaded! Tap "EDIT" to customize.');
  }

  onPhotoClick(photo: GalleryPhoto) {
    if (this.isSelectMode) {
      if (this.selectedPhotoIds.has(photo.id)) {
        this.selectedPhotoIds.delete(photo.id);
      } else {
        this.selectedPhotoIds.add(photo.id);
      }
      return;
    }

    // Toggle selection or select
    if (this.selectedPhoto?.id === photo.id) {
      // Tapping already-selected photo launches directly into editor
      this.openEditorWithSelected();
    } else {
      this.selectedPhoto = photo;
      this.photoState.setImage(photo.imageUrl, photo.title);
      this.showToast(`Selected "${photo.title}". Tap EDIT to start.`);
    }
  }

  openEditorWithSelected() {
    if (this.selectedPhoto) {
      this.photoState.setImage(this.selectedPhoto.imageUrl, this.selectedPhoto.title);
      this.router.navigate(['/feature/adjust']);
    } else if (this.galleryPhotos.length > 0) {
      this.selectedPhoto = this.galleryPhotos[0];
      this.photoState.setImage(this.selectedPhoto.imageUrl, this.selectedPhoto.title);
      this.router.navigate(['/feature/adjust']);
    }
  }

  // Header pill & filter actions
  toggleSelectMode() {
    this.isSelectMode = !this.isSelectMode;
    if (!this.isSelectMode) {
      this.selectedPhotoIds.clear();
    }
  }

  toggleAlbumDropdown() {
    this.showAlbumDropdown = !this.showAlbumDropdown;
  }

  selectAlbum(album: string) {
    this.currentAlbum = album;
    this.showAlbumDropdown = false;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  toggleMoreMenu() {
    this.showMoreMenu = !this.showMoreMenu;
  }

  clearSelection() {
    this.selectedPhoto = null;
  }

  get isAllSelected(): boolean {
    const list = this.filteredPhotos;
    return list.length > 0 && this.selectedPhotoIds.size === list.length;
  }

  toggleSelectAll() {
    const list = this.filteredPhotos;
    if (this.isAllSelected) {
      this.selectedPhotoIds.clear();
    } else {
      list.forEach(p => this.selectedPhotoIds.add(p.id));
    }
  }

  deleteSelectedPhotos() {
    if (this.selectedPhotoIds.size === 0) return;

    const count = this.selectedPhotoIds.size;
    const idsToDelete = Array.from(this.selectedPhotoIds);

    // Record deleted IDs so curated or user photos won't reappear on reload
    this.saveDeletedPhotoIds(idsToDelete);

    // Remove from galleryPhotos
    this.galleryPhotos = this.galleryPhotos.filter(p => !this.selectedPhotoIds.has(p.id));

    // Remove from saved user photos
    try {
      const remaining = this.getSavedUserPhotos().filter(p => !this.selectedPhotoIds.has(p.id));
      localStorage.setItem('pe_user_gallery_photos', JSON.stringify(remaining));
    } catch {}

    // Remove from recent edits
    this.photoState.deleteRecentEdits(idsToDelete);

    if (this.selectedPhoto && this.selectedPhotoIds.has(this.selectedPhoto.id)) {
      this.selectedPhoto = null;
    }

    this.selectedPhotoIds.clear();
    this.isSelectMode = false;

    this.showToast(`Deleted ${count} photo${count > 1 ? 's' : ''}`);
  }

  deleteSinglePhoto(photo: GalleryPhoto | null) {
    if (!photo) return;

    this.saveDeletedPhotoId(photo.id);
    this.galleryPhotos = this.galleryPhotos.filter(p => p.id !== photo.id);

    try {
      const remaining = this.getSavedUserPhotos().filter(p => p.id !== photo.id);
      localStorage.setItem('pe_user_gallery_photos', JSON.stringify(remaining));
    } catch {}

    this.photoState.deleteRecentEdit(photo.id);

    if (this.selectedPhoto?.id === photo.id) {
      this.selectedPhoto = null;
    }

    this.showToast(`"${photo.title}" deleted`);
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = '';
      }
    }, 2800);
  }
}
