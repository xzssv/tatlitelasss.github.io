import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { Event } from '../../models/event.model';
import Swal from 'sweetalert2';
import Choices from 'choices.js';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage.component.html'
})
export class ManageComponent implements OnInit, AfterViewInit {
  eventTypes = [
    'Düğün Etkinlikleri',
    'Doğum Günü',
    'Lansman',
    'Festival',
    'Fuar',
    'Kurumsal Etkinlikler'
  ];

  userEvents: Event[] = [];
  currentEvent: Partial<Event> = this.initializeNewEvent();
  showBrideGroomNames: boolean = false;
  currentStep: number = 0;
  isSubmitting: boolean = false;
  isEditing: boolean = false;
  showValidationErrors: boolean = false;
  showEventList: boolean = false;

  constructor(
    private authService: AuthService,
    private firestoreService: FirestoreService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadUserEvents();
  }

  loadUserEvents() {
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        this.firestoreService.getUserEvents(user.id).then(events => {
          this.userEvents = events;
        });
      }
    });
  }

  createNewEvent() {
    this.currentEvent = this.initializeNewEvent();
    this.showBrideGroomNames = false;
    this.currentStep = 0;
    this.isEditing = false;
    this.showValidationErrors = false;
  }

  editEvent(event: Event) {
    this.currentEvent = { ...event };
    this.showBrideGroomNames = event.eventType === 'Düğün Etkinlikleri';
    this.currentStep = 0;
    this.isEditing = true;
    this.showValidationErrors = false;
  }

  deleteEvent(event: Event) {
    if (confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
      this.firestoreService.deleteEvent(event.id).then(() => {
        this.loadUserEvents();
        alert('Etkinlik başarıyla silindi!');
      }).catch(error => {
        console.error('Etkinlik silinirken hata oluştu:', error);
        alert('Etkinlik silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      });
    }
  }

  initializeNewEvent(): Partial<Event> {
    return {
      name: '',
      eventType: '',
      brideName: '',
      groomName: '',
      startDateTime: this.formatDateTimeForInput(new Date()),
      endDateTime: this.formatDateTimeForInput(new Date(Date.now() + 3600000)),
      eventCode: this.generateUniqueEventCode(),
      description: '',
      hideEventName: false,
      qrOnly: false
    };
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const element = document.getElementById('choices-eventType');
      if (element) {
        new Choices(element as HTMLSelectElement, {
          searchEnabled: false,
          itemSelectText: '',
          shouldSort: false,
        });
      }
    }, 0);
  }

  onEventTypeChange() {
    this.showBrideGroomNames = this.currentEvent.eventType === 'Düğün Etkinlikleri';
  }

  generateUniqueEventCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  saveEventSettings() {
    if (this.isSubmitting) return;

    if (this.isEditing) {
      this.showConfirmationDialog();
    } else {
      this.performSaveOperation();
    }
  }

  showConfirmationDialog() {
    Swal.fire({
      title: 'Değişiklikleri kaydetmek istiyor musunuz?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Kaydet',
      denyButtonText: `Kaydetme`,
      cancelButtonText: 'İptal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performSaveOperation();
      } else if (result.isDenied) {
        Swal.fire('Değişiklikler kaydedilmedi', '', 'info');
      }
    });
  }

  performSaveOperation() {
    this.isSubmitting = true;
    this.authService.getCurrentUser().subscribe(user => {
      if (user) {
        const eventData: Event = {
          ...this.currentEvent as Event,
          ownerId: user.id
        };

        const saveOperation = this.isEditing
          ? this.firestoreService.updateEvent(eventData)
          : this.firestoreService.createEvent(eventData);

        saveOperation.then(() => {
          this.loadUserEvents();
          this.isSubmitting = false;
          this.showSuccessMessage();
          if (!this.isEditing) {
            this.createNewEvent();
          }
        }).catch(error => {
          console.error('Etkinlik kaydedilirken hata oluştu:', error);
          Swal.fire({
            icon: 'error',
            title: 'Hata!',
            text: 'Etkinlik kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.',
          });
          this.isSubmitting = false;
        });
      }
    });
  }

  setStep(step: number) {
    if (this.canProceed() || step < this.currentStep) {
      this.currentStep = step;
      this.showValidationErrors = false;
    } else {
      this.showValidationErrors = true;
    }
  }

  getQRCodeUrl(): string {
    const eventCode = this.currentEvent.eventCode || '';
    const currentUrl = window.location.origin;
    const qrData = `${currentUrl}/event/${eventCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  }

  nextStep() {
    if (this.canProceed()) {
      this.currentStep++;
      this.showValidationErrors = false;
    } else {
      this.showValidationErrors = true;
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showValidationErrors = false;
    }
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 0:
        return !!this.currentEvent.eventType && !!this.currentEvent.name &&
          (!this.showBrideGroomNames || (!!this.currentEvent.brideName && !!this.currentEvent.groomName));
      case 1:
        return !!this.currentEvent.startDateTime && !!this.currentEvent.endDateTime;
      default:
        return true;
    }
  }

  showSuccessMessage() {
    Swal.fire({
      icon: 'success',
      title: 'Başarılı!',
      text: this.isEditing ? 'Etkinlik başarıyla güncellendi!' : 'Yeni etkinlik başarıyla oluşturuldu!',
      confirmButtonText: 'Tamam'
    });
  }

  toggleEventList() {
    this.showEventList = !this.showEventList;
  }

  private formatDateTimeForInput(date: Date): string {
    return date.toISOString().slice(0, 16);
  }
}