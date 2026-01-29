# College Event Management System 🎓

A modern, cloud-native web application for managing college events, registrations, and attendance. Built with **Vanilla JavaScript** and **Firebase**, functioning as a **Progressive Web App (PWA)**.

## 🌟 Features

### 🔐 Role-Based Access
*   **Student Portal**: Students log in via Google to view their registered events, access digital tickets (QR Codes), and share them via WhatsApp.
*   **Admin Dashboard**: Admins have full control to create events, view analytics, and manage the team.

### ⚡ Core Functionality
*   **Event Management**: Create, Edit, and Delete events.
*   **Real-time Database**: All data is synced instantly across devices using Cloud Firestore.
*   **QR Code Scanner**: Built-in camera scanner for checking in students at the venue.
*   **Team Management**: Admins can promote other users to 'Admin' status directly from the dashboard.

### 📱 Mobile First (PWA)
*   Computes as a native app on Android/iOS.
*   Works offline (cached assets).
*   Glassmorphism UI design for a premium feel.

## 🛠️ Tech Stack
*   **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules).
*   **Backend**: Firebase (Authentication, Firestore Database).
*   **Hosting**: GitHub Pages (or any static host).
*   **Libraries**: `html5-qrcode` (Scanner), `Chart.js` (Analytics), `FontAwesome` (Icons).

## 🚀 Setup & Deployment

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/your-username/col-evt-mgr.git
    cd col-evt-mgr
    ```

2.  **Firebase Configuration**:
    *   The app is pre-configured with a Firebase project (`col-evt-mgr-2026`).
    *   Configuration is located in `js/firebase-config.js`.

3.  **Run Locally**:
    *   You **cannot** run this by double-clicking `index.html` due to security policies.
    *   Use a local server (e.g., Live Server in VS Code):
        ```bash
        # Python example
        python -m http.server 8000
        ```

4.  **Deploy**:
    *   Push to GitHub and enable **GitHub Pages**.
    *   **IMPORTANT**: Go to [Firebase Console](https://console.firebase.google.com/) -> Authentication -> Settings -> Authorized Domains and add your GitHub Pages domain.

## 📄 License
MIT License. Free for educational use.
