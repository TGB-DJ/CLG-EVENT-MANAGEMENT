# First Admin Setup Guide

## Quick Start: Become the First Admin

### Step 1: Add Your Email to Whitelist

1. Open `js/db-firestore.js`
2. Find the `ADMIN_EMAILS` array (around line 14)
3. Replace `'pradeep@college.edu'` with **your actual email**
4. Save the file

```javascript
const ADMIN_EMAILS = [
    'your-email@gmail.com',  // ← Put your email here
    'admin@college.edu',
];
```

### Step 2: Sign Up

1. Visit your website
2. Click "Sign in with Google" (recommended) or use email/password
3. Complete authentication

### Step 3: Verify Admin Access

1. After login, you should be redirected to the **Admin Dashboard**
2. Check browser console (F12) - you should see: `🎉 Admin account created for: your-email@gmail.com`
3. You now have full admin privileges!

## Adding More Admins

### Method 1: Add to Whitelist (Before They Sign Up)
Add their email to `ADMIN_EMAILS` array before they create an account.

### Method 2: Promote Existing Users
1. Login as admin
2. Click "Team" button in navbar
3. Find the user
4. Click "Promote to Admin"

## How It Works

The system checks your email against the whitelist when you first sign up:

```javascript
// Auto-promotion logic
const isAdmin = ADMIN_EMAILS.some(email => 
    email.toLowerCase() === user.email.toLowerCase()
);

const userData = {
    role: isAdmin ? 'admin' : 'user'
};
```

## Important Notes

⚠️ **Email Must Match Exactly**
- Use the same email you'll sign in with
- Case-insensitive (ADMIN@COLLEGE.EDU = admin@college.edu)

⚠️ **Google Sign-In Users**
- Use the Gmail address you'll sign in with
- Example: `yourname@gmail.com`

⚠️ **Email/Password Users**
- Use the exact email you'll register with

## Troubleshooting

**Problem**: Logged in but still showing as "user" role

**Solutions**:
1. Check if email in whitelist matches your login email exactly
2. Logout and login again
3. Check browser console for errors
4. Clear browser cache and try again

**Problem**: Can't access admin dashboard

**Solution**:
1. Open browser console (F12)
2. Check what role you have: Look for `User: your-email, Role: user`
3. If role is "user", your email isn't in the whitelist
4. Add email to whitelist and logout/login again

## Security Recommendations

### For Production:
1. **Remove test emails** from whitelist
2. **Keep whitelist small** - only trusted admins
3. **Use college/organization emails** - not personal emails
4. **Review regularly** - remove emails of former admins

### Example Production Whitelist:
```javascript
const ADMIN_EMAILS = [
    'principal@college.edu',
    'dean@college.edu',
    'event-coordinator@college.edu'
];
```

## Alternative: Manual Firestore Edit

If you can't edit code, you can manually promote yourself in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Find **users** collection
5. Find your user document (by email)
6. Edit the `role` field from `"user"` to `"admin"`
7. Save
8. Logout and login again

---

**That's it!** You're now the first admin of your College Event Management System. 🎉
