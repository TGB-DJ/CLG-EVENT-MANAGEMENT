# Officer Account Setup

## Account Details
- **Email**: chiru1@gmail.com
- **Password**: 123456789
- **Role**: Officer

## Setup Instructions

### Step 1: Sign In First
1. Go to your EventFlow application
2. Click "Login" 
3. Sign in with Google using **chiru1@gmail.com**
4. This will create the user account in Firestore

### Step 2: Promote to Officer Role

**Option A: Firebase Console (Recommended)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Firestore Database" in the left menu
4. Navigate to the `users` collection
5. Find the document with email `chiru1@gmail.com`
6. Click on the document
7. Find the `role` field
8. Change the value from `"student"` to `"officer"`
9. Click "Update"

**Option B: Using Browser Console (After Login)**
1. Login to the app as chiru1@gmail.com
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run this code:
```javascript
import { dbManager } from './js/db-firestore.js';
import { auth } from './js/firebase-config.js';

const user = auth.currentUser;
await dbManager.updateUser(user.uid, { role: 'officer' });
console.log('✅ Promoted to officer!');
```
5. Refresh the page

### Step 3: Access Officer Portal
1. Logout and login again as chiru1@gmail.com
2. You will be redirected to `/officer.html`
3. You can now scan QR codes and mark attendance

## Verification
- After promotion, logging in should redirect to Officer Portal
- You should see the QR scanner interface
- You should be able to scan student tickets

## Troubleshooting
- **Still showing student dashboard?** 
  - Clear browser cache and cookies
  - Logout and login again
  
- **Can't find user in Firestore?**
  - Make sure you've logged in at least once
  - Check the `users` collection exists
  
- **Permission denied?**
  - Check Firestore security rules allow user updates
