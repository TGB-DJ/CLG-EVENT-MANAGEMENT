# Admin Login & Management Guide 🛡️

This guide explains how to access the Admin Dashboard and manage the Event System.

## 1. First Time Access (Critical)
By default, **EVERYONE** who logs in is treated as a "Student". To get Admin access:

### Option A: Ask an Existing Admin
1.  Log in to the app (you will see the Student Portal).
2.  Ask an existing Admin to go to their dashboard, click **"Manage Team"**, find your name, and click **"Promote"**.
3.  Refresh your page. You will now be in the Admin Portal.

### Option B: Self-Promotion (If you are the owner)
1.  Log in to the app.
2.  Go to the [Firebase Console](https://console.firebase.google.com/).
3.  Navigate to **Firestore Database** -> `users` collection.
4.  Find your user document (search by your email).
5.  Change the `role` field from `"user"` to `"admin"`.
6.  Refresh the app.

## 2. Dashboard Overview
*   **Stats**: View total events and registrations at a glance.
*   **Manage Events**:
    *   **Create Event**: Add new events with Date, Time, Venue, and Description.
    *   **Delete Event**: Remove old events (be careful!).
    *   **Export Data**: Download a JSON file of all system data for backup.
*   **Manage Team**: Add or remove other admins.

## 3. Scanners (Checking In Students)
1.  On the Dashboard, click **"Open Scanner"** (or use the Quick Action).
2.  Allow camera permissions.
3.  Point the camera at a student's QR Code.
4.  **Green Beep**: Success! Attendance marked.
5.  **Red Alert**: Invalid ticket or already used.

## 4. Troubleshooting
*   **"Domain Blocked"**: If Google Login fails, ensure the domain is added in Firebase Console > Auth > Settings > Authorized Domains.
*   **App not loading**: Ensure you are online. The app caches data, but needs internet for the first load and for syncing.
