# Manual Admin Promotion Guide

## Problem
`chiru@gmail.com` is still showing as "Student" because they registered BEFORE being added to the admin whitelist.

The admin auto-promotion only works during **new signups**, not for existing users.

## Solution: Update Role in Firebase Console

### **Step-by-Step Instructions:**

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project

2. **Navigate to Firestore Database**
   - Click **Firestore Database** in left sidebar
   - Click **Data** tab

3. **Find the User**
   - Click on **users** collection
   - Look for document with email `chiru@gmail.com`
   - Click on that document

4. **Edit the Role**
   - Find the `role` field
   - Click the value (currently shows `"user"`)
   - Change it to: `admin` (without quotes in the editor)
   - Click **Update**

5. **Verify the Change**
   - The role field should now show: `admin`

6. **Test It**
   - Have user logout
   - Login again with `chiru@gmail.com`
   - Should now redirect to **Admin Dashboard**

---

## Alternative: Use Firebase Console Search

If you have many users:

1. In Firestore Database
2. Click **users** collection
3. Use browser search (Ctrl+F) to find `chiru@gmail.com`
4. Click on that document
5. Change `role` from `user` to `admin`

---

## Visual Guide

```
Firebase Console
  └── Firestore Database
      └── users (collection)
          └── [user-id-here] (document)
              ├── email: "chiru@gmail.com"
              ├── displayName: "..."
              ├── role: "user"  ← Change this to "admin"
              └── createdAt: "..."
```

---

## Quick Verification

After updating:
1. User logs out
2. User logs in again
3. Should see:
   - ✅ Admin Dashboard (not student portal)
   - ✅ "Create Event" button
   - ✅ Event management features

---

## Why This Happened

The admin whitelist (`ADMIN_EMAILS`) only works during **account creation**:
- ✅ New signups → Auto-promoted to admin
- ❌ Existing users → Need manual promotion

This is by design for security - we don't automatically change existing user roles.
