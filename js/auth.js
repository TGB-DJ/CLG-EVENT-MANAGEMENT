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
            const loader = document.getElementById('auth-loader');
            const nav = document.getElementById('main-nav');
            const main = document.getElementById('main-content');
            const isLoginPage = document.getElementById('form-login');

            if (user) {
                // User is signed in. Sync Role & Profile.
                let profile = null;
                try {
                    // This handles creation AND auto-promotion if whitelisted
                    profile = await dbManager.ensureAdminSync(user);
                } catch (e) {
                    console.error("DB Error:", e);
                    profile = { role: 'user' };
                }

                console.log(`User: ${user.email}, Role: ${profile.role}`);

                // 1. If on Login Page -> Redirect
                if (isLoginPage) {
                    if (loader) loader.style.display = 'flex'; // Show loader during redirect
                    if (profile.role === 'admin') window.location.href = 'admin.html';
                    else window.location.href = 'student.html';
                    return;
                }

                // 2. Access Control
                if (requiredRole) {
                    const myRole = profile.role || 'user';

                    if (requiredRole === 'admin') {
                        if (myRole !== 'admin') {
                            window.location.href = 'student.html';
                            return;
                        }
                    } else if (requiredRole === 'officer') {
                        if (myRole !== 'admin' && myRole !== 'officer') {
                            window.location.href = 'student.html';
                            return;
                        }
                    }
                }

                // Success! Reveal Page
                if (loader) loader.style.display = 'none';
                if (nav) nav.classList.remove('hidden');
                if (main) main.classList.remove('hidden');

            } else {
                // Not logged in
                if (!isLoginPage && requiredRole) {
                    // Redirect to login
                    console.log("No user, redirecting to login...");
                    window.location.href = 'login.html';
                    // Keep loader visible during redirect
                } else if (isLoginPage) {
                    // On login page and not logged in - this is normal, hide loader
                    if (loader) loader.style.display = 'none';
                }
            }
        });
    }
}

export const authService = new AuthService();
