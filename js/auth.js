import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
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

    // Login methods remain same...
    login(email, password) { return signInWithEmailAndPassword(auth, email, password); }
    loginWithGoogle() { return signInWithPopup(auth, this.googleProvider); }
    logout() { return signOut(auth); }

    monitorAuth(requiredRole = null) {
        onAuthStateChanged(auth, async (user) => {
            this.user = user;

            if (user) {
                // User is signed in. Check DB Role.
                let profile = null;
                try {
                    profile = await dbManager.getUserProfile(user.uid);
                    if (!profile) {
                        profile = await dbManager.createUserProfile(user);
                    }
                } catch (e) {
                    console.error("DB Error:", e);
                    // Fallback if DB fails (e.g. permissions): treat as user
                    profile = { role: 'user' };
                    alert("Database Access Failed. Logging in with limited access. Please check Firestore Rules.");
                }

                console.log(`User: ${user.email}, Role: ${profile.role}`);

                // Detect if we are on login page (Logic: if form exists or path has login)
                const isLoginPage = document.getElementById('form-login') || window.location.pathname.includes('login');
                const isRoot = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/event-manager/');

                // 1. If on Login Page -> Redirect
                if (isLoginPage) {
                    if (profile.role === 'admin') window.location.href = 'index.html';
                    else window.location.href = 'student.html';
                    return;
                }

                // 2. Access Control
                if (requiredRole) {
                    if (requiredRole === 'admin' && profile.role !== 'admin') {
                        // Not allowed, go to student portal
                        window.location.href = 'student.html';
                    }
                    // If requiredRole is 'user', admins are usually allowed too, or we strictly enforce.
                    // For now, Admins can access everything, Users only student.html
                }

            } else {
                // Not logged in
                if (requiredRole) {
                    window.location.href = 'login.html';
                }
            }
        });
    }
}

export const authService = new AuthService();
