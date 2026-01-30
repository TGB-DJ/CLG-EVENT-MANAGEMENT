import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { dbManager } from './db-firestore.js';

export class AuthService {
    constructor() {
        this.user = null;
        this.googleProvider = new GoogleAuthProvider();
        this.unsubscribeProfile = null; // Store listener to clean up
        this.sessionTimeout = null;
        this.SESSION_DURATION = 15 * 60 * 1000; // 15 Minutes
    }

    // Login methods
    login(email, password) { return signInWithEmailAndPassword(auth, email, password); }
    loginWithGoogle() { return signInWithPopup(auth, this.googleProvider); }

    async logout() {
        try {
            // 1. Clear session timers
            this.clearSessionTimer();
            // 2. Clear all local storage (cache)
            localStorage.clear();
            sessionStorage.clear();
            // 3. Firebase SignOut
            await signOut(auth);
            // 4. Force Reload to clear memory
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout failed", error);
            // Force redirect anyway
            window.location.href = 'login.html';
        }
    }

    // Password reset
    resetPassword(email) { return sendPasswordResetEmail(auth, email); }

    // Sign up (for email/password users)
    signup(email, password) { return createUserWithEmailAndPassword(auth, email, password); }

    monitorAuth(requiredRole = null) {
        onAuthStateChanged(auth, async (user) => {
            this.user = user;

            // Cleanup previous listener
            if (this.unsubscribeProfile) {
                this.unsubscribeProfile();
                this.unsubscribeProfile = null;
            }

            const loader = document.getElementById('auth-loader');
            const nav = document.getElementById('main-nav');
            const main = document.getElementById('main-content');
            const isLoginPage = document.getElementById('form-login');

            if (user) {
                // Initialize Session Timeout Monitoring
                this.startSessionTimer();

                let initialProfile = null;

                // 1. Ensure User Exists & Get Initial Profile
                // We race the DB sync against a 4-second timeout
                const syncPromise = dbManager.ensureAdminSync(user);
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, 4000));

                try {
                    // Start both, see which finishes first (usually sync)
                    const result = await Promise.race([syncPromise, timeoutPromise]);
                    if (result) initialProfile = result;
                } catch (e) {
                    console.warn("DB Sync slow or failed, proceeding...", e);
                }

                // If DB timed out, we might not have a profile yet. use 'user' as default.
                const initialRole = initialProfile ? (initialProfile.role || 'user') : 'user';

                // --- IMMEDIATE UI RENDER (Don't wait for listener) ---
                this.handleRoleRouting(initialRole, isLoginPage, requiredRole, loader, nav, main);

                // 2. Start Real-time Listener for FUTURE updates
                this.unsubscribeProfile = dbManager.listenToUserProfile(user.uid, (profile) => {
                    const myRole = profile.role || 'user';
                    // Only re-run routing if role changed significantly or we are still on login page
                    this.handleRoleRouting(myRole, isLoginPage, requiredRole, loader, nav, main);
                });

            } else {
                // Not logged in
                this.clearSessionTimer();
                if (!isLoginPage && requiredRole) {
                    window.location.href = 'login.html';
                } else if (isLoginPage) {
                    if (loader) loader.style.display = 'none';
                }
            }
        });
    }

    // Helper to avoid duplicate code
    handleRoleRouting(myRole, isLoginPage, requiredRole, loader, nav, main) {
        // A. Login Page Redirect
        if (isLoginPage) {
            if (loader) loader.style.display = 'flex'; // Keep showing loader until redirect
            if (myRole === 'admin') window.location.href = 'admin.html';
            else if (myRole === 'officer') window.location.href = 'officer.html';
            else window.location.href = 'student.html';
            return;
        }

        // B. Access Control
        if (requiredRole) {
            if (requiredRole === 'admin' && myRole !== 'admin') {
                window.location.href = 'student.html';
                return;
            }
            if (requiredRole === 'officer' && myRole !== 'admin' && myRole !== 'officer') {
                window.location.href = 'student.html';
                return;
            }
        }

        // Success - UI Reveal
        if (loader) loader.style.display = 'none';
        if (nav) nav.classList.remove('hidden');
        if (main) main.classList.remove('hidden');
    }

    // --- Session Management ---
    startSessionTimer() {
        this.clearSessionTimer();

        // Activity listeners
        ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
            document.addEventListener(event, this.resetSessionTimer.bind(this));
        });

        this.resetSessionTimer();
    }

    clearSessionTimer() {
        if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
        // Remove listeners
        ['mousemove', 'keydown', 'click', 'scroll'].forEach(event => {
            document.removeEventListener(event, this.resetSessionTimer.bind(this));
        });
    }

    resetSessionTimer() {
        if (this.sessionTimeout) clearTimeout(this.sessionTimeout);
        this.sessionTimeout = setTimeout(() => {
            console.log("Session Timeout - Logging out");
            alert("Session timed out due to inactivity.");
            this.logout();
        }, this.SESSION_DURATION);
    }
}

export const authService = new AuthService();
