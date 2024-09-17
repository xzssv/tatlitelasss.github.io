import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, collection, query, where, orderBy, collectionData, deleteDoc, doc, DocumentData } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Storage, ref, deleteObject } from '@angular/fire/storage';

interface Photo {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  selected?: boolean;
  eventId: string;
}

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class GalleryComponent implements OnInit, OnDestroy {
  photos$: Observable<Photo[]>;
  selectedPhotos: Photo[] = [];
  eventId: string | null = null;
  private photosSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private firestore: Firestore,
    private storage: Storage,
    private authService: AuthService // AuthService'i constructor'da enjekte ediyoruz
  ) {
    this.photos$ = new Observable<Photo[]>();
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user: any) => {
      console.log('Mevcut kullanıcı:', user);
      if (user) {
        this.eventId = user.eventId || null;
        console.log('Mevcut kullanıcı eventId:', this.eventId);
        this.loadPhotos();
      } else {
        console.log('Giriş yapmış kullanıcı yok');
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy() {
    if (this.photosSubscription) {
      this.photosSubscription.unsubscribe();
    }
  }

  loadPhotos() {
    console.log('Fotoğraflar yükleniyor, eventId:', this.eventId);
    const photosRef = collection(this.firestore, 'photos');
    let q;
    if (this.eventId) {
      q = query(photosRef,
        where('eventId', '==', this.eventId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(photosRef, orderBy('createdAt', 'desc'));
    }

    this.photos$ = collectionData(q, { idField: 'id' }).pipe(
      map((actions: DocumentData[]) => {
        console.log('Alınan fotoğraflar:', actions);
        return actions.map((photo: DocumentData) => ({
          id: photo['id'] as string,
          name: photo['name'] as string,
          url: photo['url'] as string,
          createdAt: (photo['createdAt'] as unknown as { toDate: () => Date }).toDate(),
          eventId: photo['eventId'] as string,
          selected: false
        } as Photo));
      })
    );

    this.photosSubscription = this.photos$.subscribe(
      photos => {
        console.log('Yüklenen fotoğraf sayısı:', photos.length);
        this.updateSelectedPhotos();
      },
      error => console.error('Fotoğrafları alırken hata oluştu:', error)
    );
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  selectAllPhotos() {
    this.photos$ = this.photos$.pipe(
      map(photos => photos.map(photo => ({ ...photo, selected: true })))
    );
    this.updateSelectedPhotos();
  }

  deselectAllPhotos() {
    this.photos$ = this.photos$.pipe(
      map(photos => photos.map(photo => ({ ...photo, selected: false })))
    );
    this.updateSelectedPhotos();
  }

  togglePhotoSelection(photo: Photo) {
    photo.selected = !photo.selected;
    this.updateSelectedPhotos();
  }

  updateSelectedPhotos() {
    this.photos$.pipe(
      map(photos => photos.filter(photo => photo.selected))
    ).subscribe(selectedPhotos => {
      this.selectedPhotos = selectedPhotos;
      console.log('Seçilen fotoğraflar:', this.selectedPhotos.length);
    });
  }

  async deleteSelectedPhotos() {
    console.log('Seçilen fotoğraflar siliniyor:', this.selectedPhotos.length);
    for (const photo of this.selectedPhotos) {
      await this.deletePhoto(photo);
    }
    this.loadPhotos();
  }

  async deleteAllPhotos() {
    try {
      const photos = await firstValueFrom(this.photos$);
      if (photos) {
        for (const photo of photos) {
          await this.deletePhoto(photo);
        }
      }
      this.loadPhotos();
    } catch (error) {
      console.error('Tüm fotoğrafları silerken hata oluştu:', error);
    }
  }

  private async deletePhoto(photo: Photo) {
    try {
      // Firestore'dan sil
      await deleteDoc(doc(this.firestore, 'photos', photo.id));

      // Storage'dan sil
      const storageRef = ref(this.storage, photo.url);
      await deleteObject(storageRef);

      console.log('Fotoğraf başarıyla silindi:', photo.id);
    } catch (error) {
      console.error('Fotoğraf silinirken hata oluştu:', error);
    }
  }

  downloadSelectedPhotos() {
    this.selectedPhotos.forEach(photo => {
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = photo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}