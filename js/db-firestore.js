import { db } from './firebase-config.js';
import {
    collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
    query, where, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTIONS = {
    EVENTS: 'events',
    REGISTRATIONS: 'registrations',
    USERS: 'users' // Added USERS collection
};

// ADMIN EMAIL WHITELIST - Add your email here to become first admin
const ADMIN_EMAILS = [
    'chirenjeevi7616@gmail.com',  // First admin
    'chiru@gmail.com',             // Second admin
    // Add more emails below:
];

export class FirestoreManager {
    constructor() {
        this.eventsCol = collection(db, COLLECTIONS.EVENTS);
        this.regsCol = collection(db, COLLECTIONS.REGISTRATIONS);
        this.usersCol = collection(db, COLLECTIONS.USERS);
        console.log("Firestore Manager Initialized");
    }

    // --- User Management ---
    async getUserProfile(uid) {
        const docRef = doc(this.usersCol, uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }

    async createUserProfile(user) {
        const docRef = doc(this.usersCol, user.uid);

        // Check if email is in admin whitelist (case-insensitive)
        const isAdmin = ADMIN_EMAILS.some(email =>
            email.toLowerCase() === user.email.toLowerCase()
        );

        const userData = {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL,
            role: isAdmin ? 'admin' : 'user', // Auto-promote if whitelisted
            createdAt: new Date().toISOString()
        };

        // Use setDoc with merge to avoid overwriting if exists (idempotent)
        await setDoc(docRef, userData, { merge: true });

        if (isAdmin) {
            console.log(`🎉 Admin account created for: ${user.email} `);
        }

        return { id: user.uid, ...userData };
    }

    async getAllUsers() {
        const querySnapshot = await getDocs(this.usersCol);
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    }

    async updateUserRole(uid, newRole) {
        const docRef = doc(this.usersCol, uid);
        await updateDoc(docRef, { role: newRole });
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

    getAllEvents() {
        return this.getEvents();
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

    async updateEvent(id, eventData) {
        const docRef = doc(db, COLLECTIONS.EVENTS, id);
        const updateData = {
            ...eventData,
            updatedAt: new Date().toISOString()
        };
        await updateDoc(docRef, updateData);
        return { id, ...updateData };
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
        // 1. Check event capacity
        const event = await this.getEvent(registrationData.eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        // Get current registration count
        const eventRegs = await this.getRegistrations(registrationData.eventId);
        if (event.capacity && eventRegs.length >= event.capacity) {
            throw new Error(`Event is full! Maximum capacity: ${event.capacity}`);
        }

        // 2. Check for duplicates
        const q = query(
            collection(db, COLLECTIONS.REGISTRATIONS),
            where("eventId", "==", registrationData.eventId),
            where("email", "==", registrationData.email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error('You are already registered for this event');
        }

        // 3. Create registration
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
    async getAllUsers() {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    }

    async exportData() {
        const events = await this.getEvents();
        const registrations = await this.getRegistrations();
        const users = await this.getAllUsers();

        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            events: events,
            registrations: registrations,
            users: users.map(u => ({
                id: u.id,
                email: u.email,
                displayName: u.displayName,
                role: u.role,
                createdAt: u.createdAt
            })),
            stats: {
                totalEvents: events.length,
                totalRegistrations: registrations.length,
                totalUsers: users.length,
                adminUsers: users.filter(u => u.role === 'admin').length,
                upcomingEvents: events.filter(e => new Date(e.date) >= new Date()).length
            }
        };

        return JSON.stringify(exportData, null, 2);
    }
}

export const dbManager = new FirestoreManager();
