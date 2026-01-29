# Logout Not Working - Quick Fix

## Problem
Logout button in student portal doesn't work when clicked.

## Possible Causes
1. Button not found (ID mismatch)
2. Event listener not attached
3. authService not imported correctly
4. Firebase signOut failing

## Quick Fix

### Option 1: Direct Firebase Logout
Add this to your student.html script section:

```javascript
// Replace the logout handler with this:
document.getElementById('btn-logout-student').addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Direct Firebase signOut
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        }
    }
});
```

### Option 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click logout button
4. Look for error messages
5. Share the error here

## Debug Steps

1. **Check if button exists:**
   - Open DevTools Console
   - Type: `document.getElementById('btn-logout-student')`
   - Should show the button element, not `null`

2. **Check if authService is loaded:**
   - Type: `authService`
   - Should show the AuthService object

3. **Try manual logout:**
   - Type: `await authService.logout()`
   - Should log you out

## Temporary Workaround

If logout still doesn't work, you can manually clear your session:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Storage** → **Clear site data**
4. Refresh page

This will log you out immediately.
