# Firebase Authentication & Database Setup Guide 🔐

If you are stuck, check these 3 things in your [Firebase Console](https://console.firebase.google.com/).

## 1. Enable Firestore Database (CRITICAL) 🗄️
If the database is "off", nothing will work.
1.  Go to **Build** -> **Firestore Database** in the left menu.
2.  Click **Create Database**.
3.  **Location**: Choose one near you (e.g., `nam5` or `us-central`).
4.  **Rules**: select **Start in Test Mode** (This is the easiest way to get started).
5.  Click **Create**.

## 2. Enable Sign-In Methods 👤
1.  Go to **Build** -> **Authentication**.
2.  Click **Sign-in method** tab.
3.  Ensure **Google** is enabled.
4.  Ensure **Email/Password** is enabled.

## 3. Authorize Your Domain 🌐
1.  In Authentication, click **Settings** tab -> **Authorized domains**.
2.  Add your GitHub Pages domain (e.g., `yourname.github.io`).

## 4. Check Security Rules (If Login Fails)
If you didn't select "Test Mode", you might be locked out.
1.  Go to **Firestore Database** -> **Rules** tab.
2.  Paste this to allow everything (for testing):
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
    ```
3.  Click **Publish**.
