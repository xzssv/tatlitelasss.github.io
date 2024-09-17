import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Firestore, doc, deleteDoc } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class StorageService {
    constructor(private storage: Storage, private firestore: Firestore) { }

    async uploadPhoto(file: File): Promise<string> {
        const storageRef = ref(this.storage, 'photos/' + file.name);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    }

    async deletePhoto(photoId: string, fileName: string): Promise<void> {
        // Delete from Storage
        const storageRef = ref(this.storage, 'photos/' + fileName);
        await deleteObject(storageRef);

        // Delete from Firestore
        await deleteDoc(doc(this.firestore, 'photos', photoId));
    }
}