import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export class AuthService {
    constructor() {
        this.user = null;
    }

    login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    logout() {
        return signOut(auth);
    }

    monitorAuth(protectedPage = true) {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (user) {
                console.log("User logged in:", user.email);
                // If on login page, go to dashboard
                if (window.location.pathname.includes('login.html')) {
                    window.location.href = 'index.html';
                }
            } else {
                console.log("User logged out");
                // If on protected page, go to login
                // We consider index.html and scanner.html as protected
                // register.html is PUBLIC
                if (protectedPage) {
                    window.location.href = 'login.html';
                }
            }
        });
    }
}

export const authService = new AuthService();
