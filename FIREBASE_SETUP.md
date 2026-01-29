# Firebase Authentication Setup Guide 🔐

If you cannot log in, it is 99% likely because the **Firebase Console** is not configured yet. Follow these exact steps:

## 1. Enable Sign-In Methods (The Most Common Issue)
You must explicitly "turn on" the login features in Firebase.
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: **col-evt-mgr-2026**.
3.  Click **Authentication** in the left sidebar.
4.  Click **Get Started** (if you haven't already).
5.  Click the **Sign-in method** tab.
6.  **Enable Google**:
    *   Click **Google**.
    *   Toggle the **Enable** switch.
    *   Select a **Support email** (your email).
    *   Click **Save**.
7.  **Enable Email/Password** (Optional, but recommended):
    *   Click **Email/Password**.
    *   Toggle **Enable**.
    *   Click **Save**.

## 2. Authorize Your Domain (For Google Login)
If you are running on GitHub Pages (e.g., `pradeep.github.io`), Google blocks it by default.
1.  Still in **Authentication**, click the **Settings** tab.
2.  Click **Authorized domains**.
3.  Click **Add domain**.
4.  Copy the URL of your website (just the domain, e.g., `pradeep.github.io`) and paste it there.
5.  Click **Add**.

## 3. Important Note on "Email Login"
*   The "Sign In with Email" form on your site is for **Existing Users Only**.
*   It **DOES NOT** create an account.
*   **Solution**: Always use **"Sign in / Sign up with Google"** for the first time. This *automatically* creates your account.
