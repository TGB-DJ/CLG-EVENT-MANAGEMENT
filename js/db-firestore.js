import { db } from './firebase-config.js';
import {
    collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
    query, where, getDoc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTIONS = {
    EVENTS: 'events',
    REGISTRATIONS: 'registrations',
    USERS: 'users' // Added USERS collection
};

// ADMIN EMAIL WHITELIST - Add your email here to become first admin
const ADMIN_EMAILS = [
    'chirenjeevi7616@gmail.com',  // First admin
    // Add more emails below:
];

export class FirestoreManager {
    constructor() {
        this.eventsCol = collection(db, COLLECTIONS.EVENTS);
        this.regsCol = collection(db, COLLECTIONS.REGISTRATIONS);
        this.usersCol = collection(db, COLLECTIONS.USERS);
        console.log("Firestore Manager Initialized");
    }

    // Helper: Super Admin Check
    isSuperAdmin(email) {
        if (!email) return false;
        return ADMIN_EMAILS.some(e => e.toLowerCase() === (email || '').toLowerCase());
    }

    // Unified User Sync (Handles Creation & Promotion)
    async ensureAdminSync(user) {
        if (!user || !user.email) return null;

        const docRef = doc(this.usersCol, user.uid);
        const docSnap = await getDoc(docRef);

        // Check Whitelist
        const isAdminEmail = ADMIN_EMAILS.some(email =>
            email.toLowerCase() === user.email.toLowerCase()
        );

        let profile;
        if (docSnap.exists()) {
            profile = { id: docSnap.id, ...docSnap.data() };

            // AUTO-PROMOTE CHECK: If in whitelist but not admin, fix it.
            if (isAdminEmail && profile.role !== 'admin') {
                console.log(`✨ Auto-promoting ${user.email} to Admin (Whitelist Match)`);
                await updateDoc(docRef, { role: 'admin' });
                profile.role = 'admin';
            }
        } else {
            // Create New
            const userData = {
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL,
                role: isAdminEmail ? 'admin' : 'user',
                createdAt: new Date().toISOString()
            };
            await setDoc(docRef, userData);
            profile = { id: user.uid, ...userData };
            console.log(`👤 New User Created: ${user.email} (${profile.role})`);
        }

        return profile;
    }

    // Real-time User Listener (Lightweight - Single Doc)
    listenToUserProfile(uid, onUpdate) {
        const docRef = doc(this.usersCol, uid);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                onUpdate({ id: docSnap.id, ...docSnap.data() });
            }
        });
    }

    // --- User Management ---
    async getUserProfile(uid) {
        const docRef = doc(this.usersCol, uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
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
        // Protect Super Admin
        const docRef = doc(this.usersCol, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && this.isSuperAdmin(docSnap.data().email)) {
            throw new Error("Action Denied: Cannot modify Super Admin account.");
        }
        await updateDoc(docRef, { role: newRole });
    }

    async deleteUser(uid) {
        // Protect Super Admin
        const docRef = doc(this.usersCol, uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && this.isSuperAdmin(docSnap.data().email)) {
            throw new Error("Action Denied: Cannot delete Super Admin account.");
        }
        await deleteDoc(docRef);
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
        // Validation
        if (!eventData.title || eventData.title.length < 3) throw new Error("Title must be at least 3 characters");
        if (!eventData.date) throw new Error("Date is required");
        if (new Date(eventData.date) < new Date()) throw new Error("Event date cannot be in the past");
        if (eventData.capacity && eventData.capacity < 1) throw new Error("Capacity must be at least 1");

        const newEvent = {
            createdAt: new Date().toISOString(),
            status: 'active',
            ...eventData
        };
        const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), newEvent);
        return { id: docRef.id, ...newEvent };
    }

    async deleteEvent(id) {
        // 1. Delete all registrations for this event first
        const regs = await this.getRegistrations(id);
        const deletePromises = regs.map(reg => deleteDoc(doc(db, COLLECTIONS.REGISTRATIONS, reg.id)));
        await Promise.all(deletePromises);

        // 2. Delete the event itself
        await deleteDoc(doc(db, COLLECTIONS.EVENTS, id));
        console.log(`Deleted event ${id} and ${regs.length} associated registrations.`);
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

    // Get single registration by ID
    async getRegistration(id) {
        const docRef = doc(db, COLLECTIONS.REGISTRATIONS, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    }

    async markAttendance(registrationId, officerId) {
        const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) throw new Error('Registration not found');

        const data = docSnap.data();

        // Prevent Duplicate Scans
        if (data.attended || data.scanned) {
            const time = data.scannedAt ? new Date(data.scannedAt).toLocaleTimeString() : 'Unknown Time';
            throw new Error(`ALREADY USED! Scanned at ${time}`);
        }

        const updateData = {
            attended: true,
            scanned: true, // Keep for backwards compatibility
            scannedAt: new Date().toISOString(),
            scannedBy: officerId
        };

        await updateDoc(docRef, updateData);

        // Fetch Event Details for confirmation
        let eventName = 'Unknown Event';
        if (data.eventId) {
            const eventSnap = await getDoc(doc(db, COLLECTIONS.EVENTS, data.eventId));
            if (eventSnap.exists()) {
                eventName = eventSnap.data().title;
            }
        }

        return {
            id: registrationId,
            studentName: data.name,
            eventName: eventName,
            ...updateData
        };
    }

    // --- Utils ---
    async exportData() {
        const events = await this.getEvents();
        const registrations = await this.getRegistrations();
        const users = await this.getAllUsers();

        // SORT: Super Admin > Admin > Officer > User > A-Z
        const roleOrder = { 'admin': 2, 'officer': 3, 'user': 4 };

        users.sort((a, b) => {
            // Priority 1: Super Admin
            const isSuperA = this.isSuperAdmin(a.email);
            const isSuperB = this.isSuperAdmin(b.email);

            if (isSuperA && !isSuperB) return -1;
            if (!isSuperA && isSuperB) return 1;

            // Priority 2: Role
            const rA = roleOrder[a.role || 'user'] || 4;
            const rB = roleOrder[b.role || 'user'] || 4;
            if (rA !== rB) return rA - rB;

            // Priority 3: Name A-Z
            return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
        });

        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            events: events,
            registrations: registrations,
            users: users,
            stats: {
                totalEvents: events.length,
                totalRegistrations: registrations.length,
                totalUsers: users.length,
                adminUsers: users.filter(u => u.role === 'admin' || this.isSuperAdmin(u.email)).length,
                upcomingEvents: events.filter(e => new Date(e.date) >= new Date()).length
            }
        };

        return exportData;
    }
    async exportEventData(eventId) {
        const event = await this.getEvent(eventId);
        if (!event) return null;
        const registrations = await this.getRegistrations(eventId);

        return {
            exportDate: new Date().toISOString(),
            type: 'single_event',
            event: event,
            registrations: registrations,
            stats: {
                totalRegistrations: registrations.length,
                attended: registrations.filter(r => r.scanned).length
            }
        };
    }
}

export const dbManager = new FirestoreManager();
