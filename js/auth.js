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
    }

    // Login methods
    login(email, password) { return signInWithEmailAndPassword(auth, email, password); }
    loginWithGoogle() { return signInWithPopup(auth, this.googleProvider); }
    logout() { return signOut(auth); }

    // Password reset
    resetPassword(email) { return sendPasswordResetEmail(auth, email); }

    // Sign up (for email/password users)
    signup(email, password) { return createUserWithEmailAndPassword(auth, email, password); }

    monitorAuth(requiredRole = null) {
        onAuthStateChanged(auth, async (user) => {
            this.user = user;

            // Cleanup previous listener if any
            if (this.unsubscribeProfile) {
                this.unsubscribeProfile();
                this.unsubscribeProfile = null;
            }

            const loader = document.getElementById('auth-loader');
            const nav = document.getElementById('main-nav');
            const main = document.getElementById('main-content');
            const isLoginPage = document.getElementById('form-login');

            if (user) {
                // 1. Ensure User Exists / Whitelist
                try {
                    await dbManager.ensureAdminSync(user);
                } catch (e) {
                    console.error("DB Error:", e);
                }

                // 2. Start Real-time Listener
                this.unsubscribeProfile = dbManager.listenToUserProfile(user.uid, (profile) => {
                    const myRole = profile.role || 'user';
                    console.log(`Live Role Update: ${myRole}`);

                    // A. Login Page Redirect
                    if (isLoginPage) {
                        if (loader) loader.style.display = 'flex';
                        if (myRole === 'admin') window.location.href = 'admin.html';
                        else if (myRole === 'officer') window.location.href = 'officer.html';
                        else window.location.href = 'student.html';
                        return;
                    }

                    // B. Access Control (Demotion check)
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
                });

            } else {
                // Not logged in
                if (!isLoginPage && requiredRole) {
                    window.location.href = 'login.html';
                } else if (isLoginPage) {
                    if (loader) loader.style.display = 'none';
                }
            }
        });
    }
}

export const authService = new AuthService();
