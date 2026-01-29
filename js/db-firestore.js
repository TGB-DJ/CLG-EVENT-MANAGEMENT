import { db } from './firebase-config.js';
import {
    collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
    query, where, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTIONS = {
    EVENTS: 'events',
    REGISTRATIONS: 'registrations'
};

export class FirestoreManager {
    constructor() {
        console.log("Firestore Manager Initialized");
    }

    // --- Events ---
    async getEvents() {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.EVENTS));
        const events = [];
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        return events;
    }

    async getEvent(id) {
        const docRef = doc(db, COLLECTIONS.EVENTS, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    }

    async createEvent(eventData) {
        const newEvent = {
            createdAt: new Date().toISOString(),
            status: 'active',
            ...eventData
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), newEvent);
        return { id: docRef.id, ...newEvent };
    }

    async deleteEvent(id) {
        await deleteDoc(doc(db, COLLECTIONS.EVENTS, id));
        // Note: Firestore doesn't cascade delete sub-collections or related docs automatically
        // For this simple version, we'll leave orphaned registrations or handle them if needed
    }

    // --- Registrations ---
    async getRegistrations(eventId = null) {
        let q;
        if (eventId) {
            q = query(collection(db, COLLECTIONS.REGISTRATIONS), where("eventId", "==", eventId));
        } else {
            q = collection(db, COLLECTIONS.REGISTRATIONS);
        }

        const querySnapshot = await getDocs(q);
        const regs = [];
        querySnapshot.forEach((doc) => {
            regs.push({ id: doc.id, ...doc.data() });
        });
        return regs;
    }

    async registerParticipant(registrationData) {
        // Check for duplicates
        const q = query(
            collection(db, COLLECTIONS.REGISTRATIONS),
            where("eventId", "==", registrationData.eventId),
            where("email", "==", registrationData.email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error('Participant already registered for this event.');
        }

        const newRegistration = {
            registeredAt: new Date().toISOString(),
            scanned: false,
            ...registrationData
        };

        const docRef = await addDoc(collection(db, COLLECTIONS.REGISTRATIONS), newRegistration);
        return { id: docRef.id, ...newRegistration };
    }

    async markAttendance(registrationId) {
        const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) throw new Error('Registration not found');

        const data = docSnap.data();
        if (data.scanned) throw new Error('Already scanned in!');

        const updateData = {
            scanned: true,
            scannedAt: new Date().toISOString()
        };

        await updateDoc(docRef, updateData);
        return { id: registrationId, ...data, ...updateData };
    }

    // --- Utils ---
    async exportData() {
        const events = await this.getEvents();
        const registrations = await this.getRegistrations();
        return JSON.stringify({ events, registrations, exportedAt: new Date().toISOString() });
    }
}

export const dbManager = new FirestoreManager();
