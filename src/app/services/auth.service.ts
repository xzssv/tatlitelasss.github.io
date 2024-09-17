import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
    Auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
    private readonly isBrowser: boolean;

    constructor(
        private auth: Auth,
        private firestore: Firestore,
        @Inject(PLATFORM_ID) platformId: Object,
        private router: Router
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.initAuthListener();
        }
    }

    private initAuthListener() {
        onAuthStateChanged(this.auth, (firebaseUser) => {
            if (firebaseUser) {
                this.getUserData(firebaseUser.uid).then(userData => {
                    console.log('User data fetched:', userData);
                    this.currentUserSubject.next(userData);
                    if (this.router.url === '/login') {
                        this.router.navigate(['/home']);
                    }
                });
            } else {
                console.log('No user logged in');
                this.currentUserSubject.next(null);
                if (this.router.url !== '/login') {
                    this.router.navigate(['/login']);
                }
            }
        });
    }

    private async getUserData(userId: string): Promise<User | null> {
        console.log('Fetching user data for userId:', userId);
        const userDoc = await getDoc(doc(this.firestore, 'users', userId));
        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('User data from Firestore:', userData);
            return userData;
        }
        console.log('No user document found in Firestore for userId:', userId);
        return null;
    }

    async login(email: string, password: string): Promise<void> {
        if (this.isBrowser) {
            try {
                const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
                let userData = await this.getUserData(userCredential.user.uid);
                if (!userData) {
                    userData = {
                        id: userCredential.user.uid,
                        name: userCredential.user.displayName || 'Unknown',
                        email: userCredential.user.email || '',
                        isEventOwner: false,
                        eventId: undefined
                    };
                    await setDoc(doc(this.firestore, 'users', userData.id), {
                        ...userData,
                        eventId: null
                    });
                    console.log('Created new user document in Firestore:', userData);
                }
                this.currentUserSubject.next(userData);
                this.router.navigate(['/home']);
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        }
    }

    async register(email: string, password: string, name: string, isEventOwner: boolean): Promise<void> {
        if (this.isBrowser) {
            try {
                const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
                const user: User = {
                    id: userCredential.user.uid,
                    name,
                    email,
                    isEventOwner,
                    eventId: isEventOwner ? this.generateEventId() : undefined
                };
                await setDoc(doc(this.firestore, 'users', user.id), {
                    ...user,
                    eventId: user.eventId || null
                });
                console.log('User registered and saved to Firestore:', user);
                this.currentUserSubject.next(user);
                this.router.navigate(['/home']);
            } catch (error) {
                console.error('Registration error:', error);
                throw error;
            }
        }
    }

    private generateEventId(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async logout(): Promise<void> {
        if (this.isBrowser) {
            await signOut(this.auth);
            this.currentUserSubject.next(null);
            this.router.navigate(['/login']);
        }
    }

    getCurrentUser(): Observable<User | null> {
        return this.currentUserSubject.asObservable();
    }

    isLoggedIn(): boolean {
        return this.currentUserSubject.value !== null;
    }

    isEventOwner(): boolean {
        const user = this.currentUserSubject.value;
        return user ? user.isEventOwner : false;
    }

    async getEventSettings(): Promise<any> {
        const user = this.currentUserSubject.value;
        if (user && user.isEventOwner && user.eventId) {
            const eventDoc = await getDoc(doc(this.firestore, 'events', user.eventId));
            if (eventDoc.exists()) {
                return eventDoc.data();
            }
        }
        return null;
    }

    async saveEventSettings(settings: any): Promise<void> {
        const user = this.currentUserSubject.value;
        if (user && user.isEventOwner && user.eventId) {
            await updateDoc(doc(this.firestore, 'events', user.eventId), settings);
        }
    }
}