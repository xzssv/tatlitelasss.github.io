import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Event } from '../models/event.model';

@Injectable({
    providedIn: 'root'
})
export class FirestoreService {
    constructor(private firestore: Firestore) { }

    async createEvent(event: Event): Promise<string> {
        const eventRef = await addDoc(collection(this.firestore, 'events'), event);
        await addDoc(collection(this.firestore, 'user_events'), {
            userId: event.ownerId,
            eventId: eventRef.id
        });
        return eventRef.id;
    }

    async updateEvent(event: Event): Promise<void> {
        const eventRef = doc(this.firestore, 'events', event.id);
        await updateDoc(eventRef, { ...event });
    }

    async deleteEvent(eventId: string): Promise<void> {
        await deleteDoc(doc(this.firestore, 'events', eventId));
        // Also delete the user_event link
        const userEventQuery = query(collection(this.firestore, 'user_events'), where('eventId', '==', eventId));
        const userEventDocs = await getDocs(userEventQuery);
        userEventDocs.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
    }

    async getEvent(eventId: string): Promise<Event | null> {
        const eventDoc = await getDoc(doc(this.firestore, 'events', eventId));
        return eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } as Event : null;
    }

    async getUserEvents(userId: string): Promise<Event[]> {
        const userEventQuery = query(collection(this.firestore, 'user_events'), where('userId', '==', userId));
        const userEventDocs = await getDocs(userEventQuery);
        const events: Event[] = [];
        for (const doc of userEventDocs.docs) {
            const eventId = doc.data()['eventId'] as string; // Düzeltme burada
            const event = await this.getEvent(eventId);
            if (event) events.push(event);
        }
        return events;
    }
}