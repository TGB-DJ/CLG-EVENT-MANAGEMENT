/**
 * CLG Event Management - Storage Layer
 * Handles all interactions with LocalStorage
 */

const DB_KEYS = {
    EVENTS: 'cem_events',
    REGISTRATIONS: 'cem_registrations',
    SETTINGS: 'cem_settings'
};

class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(DB_KEYS.EVENTS)) {
            localStorage.setItem(DB_KEYS.EVENTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_KEYS.REGISTRATIONS)) {
            localStorage.setItem(DB_KEYS.REGISTRATIONS, JSON.stringify([]));
        }
    }

    // --- Helpers ---
    _get(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    _save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // --- Event Methods ---
    getEvents() {
        return this._get(DB_KEYS.EVENTS);
    }

    getEvent(id) {
        const events = this.getEvents();
        return events.find(e => e.id === id);
    }

    createEvent(eventData) {
        const events = this.getEvents();
        const newEvent = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            status: 'active', // active, closed
            ...eventData
        };
        events.push(newEvent);
        this._save(DB_KEYS.EVENTS, events);
        return newEvent;
    }

    deleteEvent(id) {
        let events = this.getEvents();
        events = events.filter(e => e.id !== id);
        this._save(DB_KEYS.EVENTS, events);

        // Cleanup registrations for this event
        let regs = this._get(DB_KEYS.REGISTRATIONS);
        regs = regs.filter(r => r.eventId !== id);
        this._save(DB_KEYS.REGISTRATIONS, regs);
    }

    // --- Registration Methods ---
    getRegistrations(eventId = null) {
        const regs = this._get(DB_KEYS.REGISTRATIONS);
        if (eventId) {
            return regs.filter(r => r.eventId === eventId);
        }
        return regs;
    }

    registerParticipant(registrationData) {
        const regs = this.getRegistrations();

        // Simple duplicate check (email + eventId)
        const exists = regs.find(r =>
            r.email === registrationData.email &&
            r.eventId === registrationData.eventId
        );

        if (exists) {
            throw new Error('Participant already registered for this event.');
        }

        const newRegistration = {
            id: this.generateId(),
            registeredAt: new Date().toISOString(),
            scanned: false,
            ...registrationData
        };

        regs.push(newRegistration);
        this._save(DB_KEYS.REGISTRATIONS, regs);
        return newRegistration;
    }

    markAttendance(registrationId) {
        const regs = this.getRegistrations();
        const regIndex = regs.findIndex(r => r.id === registrationId);

        if (regIndex === -1) throw new Error('Registration not found');
        if (regs[regIndex].scanned) throw new Error('Already scanned in!');

        regs[regIndex].scanned = true;
        regs[regIndex].scannedAt = new Date().toISOString();

        this._save(DB_KEYS.REGISTRATIONS, regs);
        return regs[regIndex];
    }

    // --- System Methods ---
    exportData() {
        const data = {
            events: this._get(DB_KEYS.EVENTS),
            registrations: this._get(DB_KEYS.REGISTRATIONS),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.events) this._save(DB_KEYS.EVENTS, data.events);
            if (data.registrations) this._save(DB_KEYS.REGISTRATIONS, data.registrations);
            return true;
        } catch (e) {
            console.error('Import failed', e);
            return false;
        }
    }
}

const db = new StorageManager();
