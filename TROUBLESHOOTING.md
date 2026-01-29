# Troubleshooting Guide 🔧

If you are facing issues with the **College Event Management System**, specifically with **Login**, follow these steps.

## 1. Login Issues 🔐

### "Domain Blocked" or "Unauthorized Domain"
**Error Message:** `auth/unauthorized-domain`
**Reason:** Firebase security prevents your app from running on unauthorized websites (including `localhost` or your `github.io` page) to prevent abuse.

**Fix:**
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (**col-evt-mgr-2026**).
3.  Go to **Authentication** (in the left sidebar) -> **Settings** tab.
4.  Click on **Authorized Domains**.
5.  Click **Add Domain**.
6.  Enter the domain where you are running the app (e.g., `pradeep.github.io` or `localhost` or `127.0.0.1`).

### "Security Error" (File System)
**Error Message:** `auth/operation-not-supported-in-this-environment`
**Reason:** Google Login **cannot** run directly from a file (e.g., address bar starts with `file:///C:/Users/...`). It requires a web server.

**Fix:**
*   **Option A (Recommended):** Use VS Code "Live Server" extension. Right-click `index.html` -> "Open with Live Server".
*   **Option B (Python):** Open terminal in project folder: `python -m http.server`. Then go to `http://localhost:8000`.

### "Popup Closed by User"
**Reason:** You closed the Google popup window before signing in.
**Fix:** Try again and complete the sign-in flow.

### Nothing Happens When Warning Clicked
1.  Open **Developer Tools** (Press `F12` or `Ctrl+Shift+I`).
2.  Go to the **Console** tab.
3.  Look for red error messages.
4.  If you see `api-key-not-valid`, your API Key in `js/firebase-config.js` might be deleted or expired.

## 2. Setup Issues 🛠️

### "Firebase Config Issue"
Check `js/firebase-config.js`. It should look like this:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "col-evt-mgr-2026.firebaseapp.com",
    projectId: "col-evt-mgr-2026",
    // ... other fields
};
```

### Resetting the App
If the app is stuck in a weird state:
1.  Open **Developer Tools** (`F12`).
2.  Go to **Application** tab -> **Storage** -> **Local Storage**.
3.  Right-click your site -> **Clear**.
4.  Reload the page.
5.  If using "Offline Mode" (PWA), try **Unregister Service Worker** in the Application tab.
