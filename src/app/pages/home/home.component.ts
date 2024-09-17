import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  title = 'Buse & Aydoğan';
  date = '28.09.24';
  eventId: string | null = null;
  uploadedFileUrl = '';

  constructor(
    private router: Router,
    private storageService: StorageService,
    private firestore: Firestore,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(user => {
      console.log('Current user:', user);
      if (user) {
        this.eventId = user.eventId || null;
        console.log('Current user eventId:', this.eventId);
      } else {
        console.log('No user logged in');
        this.router.navigate(['/login']);
      }
    });
  }

  triggerFileInput() {
    document.getElementById('fileInput')?.click();
  }

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      console.log('File selected:', fileList[0].name);
      this.uploadFile(fileList[0]);
    } else {
      console.log('No file selected');
    }
  }

  uploadFile(file: File) {
    console.log('Starting file upload');
    this.storageService.uploadPhoto(file)
      .then(url => {
        this.uploadedFileUrl = url;
        console.log('File uploaded successfully:', url);
        this.saveFileData(url, file.name);
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        alert('File upload failed. Please try again.');
      });
  }

  saveFileData(url: string, fileName: string) {
    console.log('Saving file data to Firestore');
    addDoc(collection(this.firestore, 'photos'), {
      eventId: this.eventId,
      url: url,
      name: fileName,
      createdAt: new Date()
    }).then(() => {
      console.log('File data saved to Firestore');
      alert('File uploaded and saved successfully!');
    }).catch(error => {
      console.error('Error saving file data:', error);
      alert('Failed to save file data. Please try again.');
    });
  }

  goToGallery() {
    this.router.navigate(['/gallery']);
  }

  goToSettings() {
    this.router.navigate(['/manage']);
  }
}