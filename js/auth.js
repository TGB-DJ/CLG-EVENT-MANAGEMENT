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
                let profile = await dbManager.getUserProfile(user.uid);

                if (!profile) {
                    // First time login? Create profile
                    profile = await dbManager.createUserProfile(user);
                }

                console.log(`User: ${user.email}, Role: ${profile.role}`);

                // 1. If we are on Login Page -> Redirect
                if (window.location.pathname.includes('login.html')) {
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
                if (requiredRole) { // If page requires auth
                    window.location.href = 'login.html';
                }
            }
        });
    }
}

export const authService = new AuthService();
