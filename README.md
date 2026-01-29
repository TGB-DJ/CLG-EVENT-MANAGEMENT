# EventFlow - College Event Management System

> **Developed by Team CJ**  
> **Under CJ Productions**

A comprehensive web-based event management system for colleges, featuring real-time registration, QR code-based attendance tracking, and role-based access control.

---

## 📋 Table of Contents

- [Features Overview](#features-overview)
- [Detailed Feature Breakdown](#detailed-feature-breakdown)
- [Tech Stack](#tech-stack)
- [All Functions & Methods](#all-functions--methods)
- [Firebase Operations](#firebase-operations)
- [UI Components](#ui-components)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Firebase Configuration](#firebase-configuration)
- [User Roles](#user-roles)
- [Deployment](#deployment)
- [Viva Preparation](#viva-preparation)
- [Team](#team)

---

## ✨ Features Overview

### For Students
- **Google Sign-In Authentication** - Secure login with Google accounts
- **Browse Upcoming Events** - Real-time event listings with filters
- **One-Click Event Registration** - Instant registration with capacity checks
- **Digital Tickets** - QR code-based tickets for entry
- **My Tickets Dashboard** - View all registered events with status
- **Push Notifications** - Get notified about new events
- **Event Sharing** - Share events via WhatsApp or copy link

### For Admins
- **Complete Event Management** - Create, edit, delete events
- **Registration Analytics** - Interactive charts with attendance data
- **Export Data** - Download all data as JSON
- **User Management** - View and promote users
- **Real-time Dashboard** - Live statistics and metrics
- **Confetti Animations** - Visual feedback on event creation
- **Capacity Management** - Set and track event capacity

### For Officers
- **QR Code Scanner** - Camera-based ticket scanning
- **Manual Ticket Lookup** - Fallback for camera issues
- **Attendance Marking** - Track who attended with timestamps
- **Real-time Statistics** - Scans, verified, invalid counts
- **Scan History** - Last 10 scans with details
- **Duplicate Prevention** - Prevent double scanning

### General Features
- **Progressive Web App (PWA)** - Installable, offline-capable
- **Responsive Design** - Works on mobile, tablet, desktop
- **Push Notifications** - Service worker-based notifications
- **Secure Authentication** - Firebase Auth with role-based access
- **Real-time Database** - Firestore with live updates
- **Support System** - FAQ and contact form
- **Legal Pages** - Terms & Privacy Policy
- **Toast Notifications** - User-friendly feedback messages

---

## 🔍 Detailed Feature Breakdown

### 1. Authentication System

**Files**: `login.html`, `js/auth.js`, `js/firebase-config.js`

**Features**:
- Google Sign-In integration
- Automatic user creation in Firestore
- Role-based redirection (admin/student/officer)
- Session persistence
- Logout functionality

**Functions Used**:
```javascript
// Firebase Auth
signInWithPopup(auth, provider)
signOut(auth)
onAuthStateChanged(auth, callback)

// Custom Functions
handleGoogleSignIn()
checkUserRole(user)
redirectBasedOnRole(role)
```

### 2. Event Management (Admin)

**Files**: `admin.html`, `js/app.js`, `js/db-firestore.js`

**Features**:
- Create events with validation
- Edit existing events
- Delete events with confirmation
- Set event capacity
- Prevent past dates
- Confetti animation on success
- Push notification trigger

**Functions Used**:
```javascript
// Event CRUD
createEvent(eventData)
updateEvent(eventId, updates)
deleteEvent(eventId)
getEvents()
getAllEvents()

// UI Functions
renderDashboard()
renderEventCard(event)
openEditModal(eventId)
handleEventSubmit(e)
```

**Form Validation**:
- Title: Required, max 100 chars
- Date: Required, not in past
- Time: Required
- Venue: Required, max 200 chars
- Capacity: Optional, positive integer
- Description: Optional, max 500 chars

### 3. Registration System

**Files**: `register.html`, `student.html`, `js/db-firestore.js`

**Features**:
- One-click registration
- Capacity checking
- Duplicate prevention
- QR code generation
- Registration confirmation
- Email tracking

**Functions Used**:
```javascript
// Registration
registerParticipant(eventId, userData)
getRegistrations()
checkExistingRegistration(eventId, email)
generateQRCode(registrationId)

// Validation
checkEventCapacity(eventId)
validateUserEmail(email)
```

**Registration Flow**:
1. Student clicks "Buy Ticket"
2. System checks capacity
3. Checks for duplicate registration
4. Creates registration document
5. Generates QR code
6. Shows success message
7. Updates event stats

### 4. QR Code System

**Files**: `officer.html`, `js/qr-scanner.js`, `register.html`

**Features**:
- Camera-based scanning
- QR code generation
- Ticket verification
- Attendance marking
- Scan history tracking

**Functions Used**:
```javascript
// QR Generation (QRCode.js)
new QRCode(element, {
    text: registrationId,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.H
})

// QR Scanning (html5-qrcode)
const scanner = new Html5Qrcode("reader")
scanner.start(cameraId, config, onScanSuccess, onScanError)
scanner.stop()

// Verification
verifyTicket(ticketId)
markAttendance(registrationId, officerId)
getRegistration(id)
```

**Scan Process**:
1. Officer opens scanner
2. Camera activates
3. QR code detected
4. Ticket ID extracted
5. Verified in database
6. Attendance marked
7. Visual/audio feedback
8. Statistics updated

### 5. Analytics Dashboard

**Files**: `admin.html`, `js/app.js`

**Features**:
- Stacked bar chart (attended vs pending)
- Per-event breakdown
- Attendance rate calculation
- Capacity utilization
- Fill rate percentages
- Detailed tooltips
- Statistics summary panel

**Functions Used**:
```javascript
// Chart Rendering (Chart.js)
renderChart(events, registrations)
new Chart(ctx, {
    type: 'bar',
    data: {...},
    options: {...}
})

// Statistics Calculation
calculateAttendanceRate()
getEventFillRate(event)
getTotalRegistrations()
getAttendedCount()
```

**Metrics Displayed**:
- Total Events
- Total Registrations
- Attended Count
- Pending Count
- Attendance Rate %
- Per-event capacity
- Fill rate per event

### 6. Data Export

**Files**: `admin.html`, `js/app.js`

**Features**:
- Export all data to JSON
- Includes events, registrations, users
- Statistics summary
- Timestamped filename
- One-click download

**Functions Used**:
```javascript
// Export Function
exportData()
JSON.stringify(data, null, 2)
new Blob([dataStr], { type: 'application/json' })
URL.createObjectURL(blob)
```

**Export Structure**:
```json
{
  "exportDate": "2026-01-30T...",
  "exportedBy": "admin@email.com",
  "statistics": {
    "totalEvents": 15,
    "totalRegistrations": 45,
    "totalUsers": 30,
    "attendedCount": 20
  },
  "events": [...],
  "registrations": [...],
  "users": [...]
}
```

### 7. Push Notifications

**Files**: `service-worker.js`, `js/app.js`, `js/push-config.js`

**Features**:
- Service worker registration
- Push subscription
- New event notifications
- Background notifications
- Click handling

**Functions Used**:
```javascript
// Service Worker
navigator.serviceWorker.register('/service-worker.js')
self.addEventListener('push', handlePush)
self.addEventListener('notificationclick', handleClick)
self.registration.showNotification(title, options)

// Push Trigger
registration.active.postMessage({
    type: 'NEW_EVENT',
    event: eventData
})
```

### 8. User Management

**Files**: `admin.html`, `js/db-firestore.js`

**Features**:
- View all users
- See user roles
- Promote users (via Firestore)
- Track user activity

**Functions Used**:
```javascript
// User Operations
getAllUsers()
updateUserRole(uid, role)
getUserByEmail(email)
createUser(userData)
```

### 9. Support System

**Files**: `support.html`, `js/db-firestore.js`

**Features**:
- Contact form
- FAQ section
- Ticket submission
- Email validation
- Success feedback

**Functions Used**:
```javascript
// Support
createSupportTicket(ticketData)
validateEmail(email)
submitContactForm(formData)
```

### 10. Utility Functions

**Files**: `js/utils.js`

**Features**:
- Date formatting
- Time formatting
- Toast notifications
- Input validation

**Functions Used**:
```javascript
// Utils
Utils.formatDate(dateString)
Utils.formatTime(timeString)
Utils.showToast(message, type)
Utils.validateEmail(email)
```

---

## 🛠️ Tech Stack

### Frontend Technologies
- **HTML5** - Semantic markup, forms, validation
- **CSS3** - Custom properties, flexbox, grid, animations
- **Vanilla JavaScript (ES6+)** - Async/await, modules, arrow functions
- **ES6 Modules** - Import/export for code organization

### Backend & Services
- **Firebase Authentication** - Google OAuth 2.0
- **Cloud Firestore** - NoSQL database with real-time sync
- **Firebase Hosting** - Static site hosting with SSL
- **Service Workers** - PWA functionality, offline support

### JavaScript Libraries
- **QRCode.js** (v1.0.0) - QR code generation
- **html5-qrcode** (v2.3.8) - Camera-based QR scanning
- **Chart.js** (v4.4.0) - Data visualization
- **Canvas Confetti** (v1.6.0) - Particle animations
- **Font Awesome** (v6.4.0) - Icon library

### APIs Used
- **Firebase Auth API** - Authentication
- **Firestore API** - Database operations
- **Web Push API** - Push notifications
- **Camera API** - QR code scanning
- **Clipboard API** - Copy to clipboard
- **Geolocation API** (optional) - Location services

---

## 📚 All Functions & Methods

### Authentication Functions (`js/auth.js`)

```javascript
// Sign In/Out
handleGoogleSignIn()          // Initiates Google sign-in flow
handleLogout()                 // Signs out current user
checkAuthState()               // Monitors auth state changes

// User Management
createUserDocument(user)       // Creates user in Firestore
getUserRole(uid)               // Fetches user role
redirectBasedOnRole(role)      // Redirects to appropriate dashboard
```

### Database Functions (`js/db-firestore.js`)

```javascript
class DatabaseManager {
    // Event Operations
    createEvent(eventData)              // Create new event
    updateEvent(eventId, updates)       // Update event details
    deleteEvent(eventId)                // Delete event
    getEvents()                         // Get all events
    getAllEvents()                      // Alias for getEvents
    getEventById(id)                    // Get single event
    
    // Registration Operations
    registerParticipant(eventId, userData)  // Register for event
    getRegistrations()                      // Get all registrations
    getRegistration(id)                     // Get single registration
    getUserRegistrations(email)             // Get user's registrations
    markAttendance(regId, officerId)        // Mark attendance
    
    // User Operations
    createUser(userData)                // Create user document
    getAllUsers()                       // Get all users
    updateUserRole(uid, role)           // Update user role
    getUserByEmail(email)               // Find user by email
    
    // Support Operations
    createSupportTicket(ticketData)     // Create support ticket
    
    // Analytics
    getEventStats(eventId)              // Get event statistics
    getAttendanceRate()                 // Calculate attendance rate
    
    // Export
    exportAllData()                     // Export data to JSON
}
```

### Admin Dashboard Functions (`js/app.js`)

```javascript
// Dashboard Rendering
renderDashboard()                   // Main dashboard render
renderEventCard(event)              // Render single event card
renderUserList()                    // Render user management
updateStatistics()                  // Update stat cards

// Event Management
handleCreateEvent(e)                // Handle event creation
handleEditEvent(eventId)            // Handle event editing
handleDeleteEvent(eventId)          // Handle event deletion
openEditModal(eventId)              // Open edit modal
closeModal()                        // Close modals

// Analytics
renderChart(events, registrations)  // Render analytics chart
calculateStats(data)                // Calculate statistics
updateChartData()                   // Update chart with new data

// Export
exportData()                        // Export all data to JSON
downloadJSON(data, filename)        // Download JSON file
```

### Student Portal Functions (`student.html` inline)

```javascript
// Event Display
loadUpcomingEvents()                // Load and display events
renderEventGrid(events)             // Render event cards
filterEvents(criteria)              // Filter events

// Ticket Management
loadMyTickets()                     // Load user's tickets
renderTicketCard(registration)      // Render ticket card
viewTicketQR(ticketId)              // View QR code

// Registration
handleRegistration(eventId)         // Handle event registration
checkDuplicateRegistration()        // Check if already registered
```

### Officer Scanner Functions (`js/qr-scanner.js`)

```javascript
// Scanner Control
initScanner()                       // Initialize QR scanner
startScanner()                      // Start camera scanning
stopScanner()                       // Stop camera
switchCamera()                      // Toggle front/back camera

// Ticket Verification
verifyTicket(ticketId)              // Verify ticket validity
handleScanSuccess(decodedText)      // Handle successful scan
handleScanError(error)              // Handle scan errors

// Attendance
markAttendance(regId)               // Mark student as attended
updateScanHistory(scan)             // Update scan history
updateStatistics()                  // Update scan stats

// Manual Entry
handleManualEntry(ticketId)         // Manual ticket lookup
validateTicketFormat(id)            // Validate ticket ID format
```

### Utility Functions (`js/utils.js`)

```javascript
const Utils = {
    // Date/Time
    formatDate(dateString)          // Format date (e.g., "Jan 30, 2026")
    formatTime(timeString)          // Format time (e.g., "2:30 PM")
    getRelativeTime(date)           // Get relative time (e.g., "2 hours ago")
    
    // Validation
    validateEmail(email)            // Validate email format
    validatePhone(phone)            // Validate phone number
    sanitizeInput(input)            // Sanitize user input
    
    // UI Feedback
    showToast(message, type)        // Show toast notification
    showLoading(element)            // Show loading spinner
    hideLoading(element)            // Hide loading spinner
    
    // Data Processing
    truncateText(text, length)      // Truncate long text
    generateId()                    // Generate unique ID
    debounce(func, delay)           // Debounce function calls
}
```

### Service Worker Functions (`service-worker.js`)

```javascript
// Lifecycle
self.addEventListener('install', handleInstall)
self.addEventListener('activate', handleActivate)
self.addEventListener('fetch', handleFetch)

// Push Notifications
self.addEventListener('push', handlePush)
self.addEventListener('notificationclick', handleNotificationClick)
self.addEventListener('message', handleMessage)

// Caching
cacheAssets(assets)                 // Cache static assets
getCachedResponse(request)          // Get from cache
updateCache(request, response)      // Update cache

// Notifications
showNotification(title, options)    // Show notification
handleNewEventNotification(event)   // Handle new event notification
```

---

## 🔥 Firebase Operations

### Firestore Collections

```javascript
// Collections Structure
users/                              // User profiles
    {userId}/
        email: string
        displayName: string
        photoURL: string
        role: "student" | "admin" | "officer"
        createdAt: timestamp

events/                             // Events
    {eventId}/
        title: string
        date: string
        time: string
        venue: string
        capacity: number
        description: string
        createdBy: string
        createdAt: timestamp

registrations/                      // Event registrations
    {registrationId}/
        eventId: string
        userId: string
        email: string
        displayName: string
        registeredAt: timestamp
        attended: boolean
        attendedAt: timestamp
        scannedBy: string

support_tickets/                    // Support tickets
    {ticketId}/
        name: string
        email: string
        category: string
        message: string
        status: "open" | "closed"
        createdAt: timestamp
```

### Firestore Operations Used

```javascript
// Read Operations
getDoc(docRef)                      // Get single document
getDocs(collectionRef)              // Get all documents
onSnapshot(query, callback)         // Real-time listener
query(collection, where(...))       // Query with filters

// Write Operations
addDoc(collectionRef, data)         // Add new document
setDoc(docRef, data)                // Set document (create/overwrite)
updateDoc(docRef, updates)          // Update specific fields
deleteDoc(docRef)                   // Delete document

// Batch Operations
writeBatch(db)                      // Create batch
batch.set(docRef, data)             // Batch set
batch.update(docRef, data)          // Batch update
batch.commit()                      // Commit batch
```

### Firebase Auth Operations

```javascript
// Authentication
signInWithPopup(auth, provider)     // Google sign-in
signOut(auth)                       // Sign out
onAuthStateChanged(auth, callback)  // Auth state listener

// User Info
auth.currentUser                    // Current user object
user.uid                            // User ID
user.email                          // User email
user.displayName                    // Display name
user.photoURL                       // Profile photo
```

---

## 🎨 UI Components

### Modal Components

```javascript
// Create Event Modal
<div id="modal-create-event">
    - Event form
    - Validation
    - Submit/Cancel buttons
</div>

// Edit Event Modal
<div id="modal-edit-event">
    - Pre-filled form
    - Update/Cancel buttons
</div>

// Confirmation Modal
<div id="modal-confirm">
    - Warning message
    - Confirm/Cancel buttons
</div>
```

### Card Components

```javascript
// Event Card
<div class="event-card">
    - Event title
    - Date/time/venue
    - Capacity indicator
    - Action buttons (Edit/Delete/Register)
</div>

// Ticket Card
<div class="ticket-card">
    - QR code
    - Event details
    - Status badge
    - View button
</div>

// Stat Card
<div class="stat-card">
    - Icon
    - Number
    - Label
</div>
```

### Form Components

```javascript
// Event Form Fields
<input type="text" name="title" required>
<input type="date" name="date" required>
<input type="time" name="time" required>
<input type="text" name="venue" required>
<input type="number" name="capacity">
<textarea name="description"></textarea>

// Validation Attributes
required
min/max
pattern
maxlength
```

### Navigation Components

```javascript
// Navbar
<nav class="navbar">
    - Logo
    - Navigation links
    - User menu
    - Logout button
</nav>

// Sidebar (Admin)
<aside class="sidebar">
    - Dashboard link
    - Events link
    - Users link
    - Analytics link
</aside>
```

---

## 📁 Project Structure

```
CLG EVENT MANAGEMENT/
├── index.html              # Landing page with hero section
├── login.html              # Google Sign-In page
├── admin.html              # Admin dashboard
├── student.html            # Student portal
├── officer.html            # Officer QR scanner
├── register.html           # Event registration page
├── support.html            # Support center with FAQ
├── terms.html              # Terms & Conditions
├── privacy.html            # Privacy Policy
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for PWA
│
├── css/
│   └── style.css           # Main stylesheet (2000+ lines)
│       ├── CSS Variables
│       ├── Reset & Base Styles
│       ├── Layout Components
│       ├── Card Styles
│       ├── Form Styles
│       ├── Button Styles
│       ├── Modal Styles
│       ├── Animations
│       └── Responsive Media Queries
│
├── js/
│   ├── firebase-config.js  # Firebase initialization
│   ├── auth.js             # Authentication logic
│   ├── db-firestore.js     # Database operations (250+ lines)
│   ├── app.js              # Admin dashboard logic (500+ lines)
│   ├── qr-scanner.js       # Officer scanner logic (160+ lines)
│   ├── push-config.js      # Push notification config
│   └── utils.js            # Utility functions (80+ lines)
│
├── OFFICER_SETUP.md        # Officer account setup guide
├── FIRST_ADMIN_SETUP.md    # Admin setup instructions
└── README.md               # This file
```

---

## 🚀 Setup Instructions

### Prerequisites
- Google account
- Modern web browser (Chrome, Firefox, Edge)
- Text editor (VS Code recommended)
- Firebase account
- Node.js (optional, for local server)

### Step 1: Clone/Download Project
```bash
git clone <repository-url>
cd "CLG EVENT MANAGEMENT"
```

### Step 2: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Enter project name (e.g., "college-events")
   - Disable Google Analytics (optional)
   - Click "Create Project"

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable "Google" provider
   - Add your domain to authorized domains
   - For localhost: `http://localhost:8000`

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create Database"
   - Start in **production mode**
   - Choose location (e.g., us-central)

4. **Set Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null;
       }
       match /events/{eventId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && 
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       match /registrations/{regId} {
         allow read, write: if request.auth != null;
       }
       match /support_tickets/{ticketId} {
         allow create: if request.auth != null;
         allow read: if request.auth != null && 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
     }
   }
   ```

5. **Get Firebase Config**
   - Go to Project Settings → General
   - Scroll to "Your apps"
   - Click "Web" icon (</>) 
   - Register app with nickname
   - Copy the config object

### Step 3: Configure Project

1. **Update `js/firebase-config.js`**
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

2. **Create First Admin**
   - Run the app locally
   - Sign in with Google
   - Go to Firestore Console
   - Find your user document in `users` collection
   - Edit the document and set `role: "admin"`

### Step 4: Run Locally

**Option 1: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html`
- Select "Open with Live Server"

**Option 2: Python HTTP Server**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`

**Option 3: Node.js HTTP Server**
```bash
npx http-server -p 8000
```

---

## 🔐 User Roles

### Student (Default)
- Automatically assigned on first login
- Can browse and register for events
- Access to student dashboard
- View personal tickets

### Admin
- Manually assigned in Firestore
- Full event management access
- View analytics and export data
- Promote other users
- Access to admin dashboard

### Officer
- Manually assigned in Firestore
- Access to QR scanner portal
- Mark attendance for events
- View scan statistics
- Access to officer dashboard

**To Promote a User:**
1. Go to Firestore Console
2. Navigate to `users` collection
3. Find user document by email
4. Edit `role` field to `"admin"` or `"officer"`
5. User must logout and login again

---

## 🌐 Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory: `.` (current directory)
   - Configure as single-page app: **No**
   - Don't overwrite existing files

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

5. **Access Your App**
   - URL: `https://YOUR_PROJECT_ID.web.app`
   - Update Google Auth authorized domains

### GitHub Pages (Alternative)

1. Create GitHub repository
2. Push code to `main` branch
3. Go to Settings → Pages
4. Select `main` branch as source
5. Save and wait for deployment
6. Update Firebase authorized domains

---

## 🎓 Viva Preparation

### Common Questions & Answers

#### 1. **What is your project about?**
**Answer:** EventFlow is a comprehensive college event management system that streamlines the entire event lifecycle - from creation and registration to attendance tracking. It features role-based access control with three user types: students who can browse and register for events, admins who manage events and analytics, and officers who verify attendance using QR code scanning.

#### 2. **What technologies did you use and why?**
**Answer:** We used:
- **Frontend**: HTML, CSS, JavaScript (Vanilla) - for simplicity, performance, and no framework overhead
- **Backend**: Firebase (Authentication, Firestore, Hosting) - for real-time data, scalability, serverless architecture, and easy deployment
- **Libraries**: QRCode.js for ticket generation, html5-qrcode for camera-based scanning, Chart.js for data visualization
- **Architecture**: Progressive Web App with service workers for offline support and push notifications

#### 3. **How does the QR code system work?**
**Answer:** When a student registers for an event, we generate a unique registration ID stored in Firestore. This ID is converted into a QR code using QRCode.js library and displayed on their ticket. Officers use the html5-qrcode library to access the device camera and scan these codes. The scanned ID is verified against the Firestore database, and if valid, attendance is marked with a timestamp and officer ID. We prevent duplicate scans by checking the `attended` field.

#### 4. **Explain your database structure.**
**Answer:** We use Cloud Firestore with four main collections:
- `users`: Stores user profiles with email, role (student/admin/officer), and metadata
- `events`: Contains event details like title, date, venue, capacity, description
- `registrations`: Links users to events with registration ID, attendance status, timestamps
- `support_tickets`: Stores user support requests with status tracking

Each collection uses auto-generated document IDs, and we implement security rules to restrict access based on user roles.

#### 5. **How do you handle authentication?**
**Answer:** We use Firebase Authentication with Google Sign-In provider. When a user signs in, Firebase creates an authentication token and returns user data. We then check if the user exists in our Firestore `users` collection. If not, we create a new user document with default role "student". For subsequent logins, we fetch their role from Firestore and redirect them to the appropriate dashboard (admin.html, student.html, or officer.html) based on their role.

#### 6. **What security measures did you implement?**
**Answer:** 
- Firebase Authentication for user verification
- Firestore Security Rules to restrict database access based on roles
- Client-side role checks before rendering UI components
- Server-side validation through Firestore security rules
- HTTPS-only communication via Firebase Hosting
- Input sanitization to prevent XSS attacks
- No sensitive data stored in client-side code
- CORS configuration for API requests

#### 7. **How does the admin promote users?**
**Answer:** Currently, admins promote users by updating the `role` field in the user's Firestore document through the Firebase Console. The process involves:
1. Navigating to the Firestore `users` collection
2. Finding the user by email
3. Editing the `role` field to "admin" or "officer"
4. The user must logout and login again for changes to take effect

In a production system, we would add an admin panel UI with email validation and programmatic role updates using Firestore's `updateDoc()` function.

#### 8. **What is a Progressive Web App (PWA)?**
**Answer:** A PWA is a web application that uses modern web capabilities to deliver an app-like experience. Our app implements:
- **Service Worker**: For offline functionality, caching, and background sync
- **Web App Manifest**: Defines app name, icons, colors for installability
- **Push Notifications**: For event updates even when app is closed
- **Responsive Design**: Adapts to all screen sizes
- **HTTPS**: Required for PWA features

Users can install it on their home screen and use it like a native app without app store distribution.

#### 9. **How do push notifications work?**
**Answer:** We use the Web Push API with service workers:
1. User grants notification permission
2. Service worker registers in the background
3. When an admin creates an event, the app sends a message to the service worker using `postMessage()`
4. Service worker receives the message and triggers `showNotification()`
5. Notification appears even if the app is closed
6. Clicking the notification opens the app to the relevant page

The service worker runs independently of the main app, enabling background notifications.

#### 10. **What challenges did you face?**
**Answer:** 
- **Real-time sync**: Solved using Firestore's `onSnapshot()` listeners for live updates
- **QR scanning on mobile**: Used html5-qrcode library with proper camera permissions handling
- **Role-based access**: Implemented with Firestore security rules and client-side role checks
- **Offline support**: Implemented service worker caching strategy for static assets
- **Cross-browser compatibility**: Tested on Chrome, Firefox, Edge and handled browser-specific issues
- **Capacity management**: Added real-time capacity checking to prevent over-registration

#### 11. **How would you scale this system?**
**Answer:**
- Use Firebase Cloud Functions for server-side logic and email notifications
- Implement pagination for large event lists using Firestore cursors
- Add Redis caching for frequently accessed data
- Use Firebase Cloud Messaging for more reliable push notifications
- Implement CDN for static assets
- Add database indexing for faster queries
- Use Firestore composite indexes for complex queries
- Implement rate limiting to prevent abuse

#### 12. **What improvements would you make?**
**Answer:**
- Payment integration for paid events (Stripe/Razorpay)
- Email notifications for registrations and reminders
- Advanced analytics with attendance trends and charts
- Native mobile apps for iOS and Android
- Event categories and advanced search/filtering
- Social media integration for event sharing
- Automated email reminders before events
- Certificate generation for attendees
- Multi-language support
- Dark mode toggle

#### 13. **Explain the confetti animation feature.**
**Answer:** When an admin successfully creates an event, we trigger a celebratory confetti animation using the canvas-confetti library. This provides immediate positive visual feedback and makes the interface more engaging. The animation is non-blocking, runs on the HTML5 Canvas API, and doesn't affect functionality. It enhances user experience by making the action feel rewarding and confirms success in a delightful way.

#### 14. **How do you handle errors?**
**Answer:** We implement comprehensive error handling:
- Try-catch blocks around all async operations (Firebase calls)
- User-friendly error messages via toast notifications
- Console logging for debugging during development
- Fallback UI for failed data loads (empty states)
- Input validation before database operations
- Network error detection with retry logic
- Firestore error codes handling (permission-denied, not-found, etc.)
- Form validation with HTML5 attributes and custom JavaScript

#### 15. **What is Team CJ?**
**Answer:** Team CJ is our development team under CJ Productions. We developed this project as a comprehensive solution for college event management, focusing on user experience, security, scalability, and modern web technologies. Our team handled all aspects from planning and design to implementation and testing.

---

## 👥 Team

**Team CJ**  
*Under CJ Productions*

### Project Roles
- **Project Lead**: Overall architecture and coordination
- **Frontend Developer**: UI/UX design and implementation
- **Backend Developer**: Firebase integration and database design
- **QA Tester**: Testing and bug fixes

---

## 📞 Support

For issues or questions:
- **Email**: support@teamcj.dev
- **Phone**: +91 9363963853
- **Support Page**: [/support.html](./support.html)

---

## 📄 License

This project is developed by Team CJ under CJ Productions for educational purposes.

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Font Awesome for icons
- Chart.js for analytics visualization
- QRCode.js and html5-qrcode libraries
- Canvas Confetti for animations
- Google Fonts for typography

---

**Made with ❤️ by Team CJ | CJ Productions**

---

## ✨ Features

### For Students
- **Google Sign-In Authentication**
- **Browse Upcoming Events** with real-time updates
- **One-Click Event Registration**
- **Digital Tickets** with QR codes
- **My Tickets Dashboard** to view all registered events
- **Push Notifications** for new events

### For Admins
- **Complete Event Management** (Create, Edit, Delete)
- **Registration Analytics** with interactive charts
- **Export Data** to JSON format
- **User Management** and role assignment
- **Real-time Dashboard** with statistics

### For Officers
- **QR Code Scanner** for ticket verification
- **Manual Ticket Lookup** as fallback
- **Attendance Marking** with timestamp tracking
- **Real-time Statistics** (scans, verified, invalid)
- **Scan History** with student details

### General Features
- **Progressive Web App** (PWA) with offline support
- **Responsive Design** works on all devices
- **Push Notifications** via service worker
- **Secure Authentication** with Firebase
- **Real-time Database** with Firestore
- **Support System** with FAQ and contact form
- **Legal Pages** (Terms & Privacy Policy)

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with custom properties
- **Vanilla JavaScript** - Logic and interactivity
- **ES6 Modules** - Code organization

### Backend & Services
- **Firebase Authentication** - Google Sign-In
- **Cloud Firestore** - NoSQL database
- **Firebase Hosting** - Deployment
- **Service Workers** - PWA and push notifications

### Libraries
- **QRCode.js** - QR code generation
- **html5-qrcode** - QR code scanning
- **Chart.js** - Analytics visualization
- **Canvas Confetti** - Success animations
- **Font Awesome** - Icons

---

## 📁 Project Structure

```
CLG EVENT MANAGEMENT/
├── index.html              # Landing page
├── login.html              # Authentication page
├── admin.html              # Admin dashboard
├── student.html            # Student portal
├── officer.html            # Officer QR scanner
├── register.html           # Event registration
├── support.html            # Support center
├── terms.html              # Terms & Conditions
├── privacy.html            # Privacy Policy
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for PWA
│
├── css/
│   └── style.css           # Main stylesheet
│
├── js/
│   ├── firebase-config.js  # Firebase configuration
│   ├── auth.js             # Authentication logic
│   ├── db-firestore.js     # Database operations
│   ├── app.js              # Admin dashboard logic
│   ├── qr-scanner.js       # Officer scanner logic
│   ├── push-config.js      # Push notification config
│   └── utils.js            # Utility functions
│
└── README.md               # This file
```

---

## 🚀 Setup Instructions

### Prerequisites
- Google account
- Modern web browser (Chrome, Firefox, Edge)
- Text editor (VS Code recommended)
- Firebase account

### Step 1: Clone/Download Project
```bash
git clone <repository-url>
cd "CLG EVENT MANAGEMENT"
```

### Step 2: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Enter project name (e.g., "college-events")
   - Disable Google Analytics (optional)
   - Click "Create Project"

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable "Google" provider
   - Add your domain to authorized domains

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create Database"
   - Start in **production mode**
   - Choose location (e.g., us-central)

4. **Set Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null;
       }
       match /events/{eventId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && 
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       match /registrations/{regId} {
         allow read, write: if request.auth != null;
       }
       match /support_tickets/{ticketId} {
         allow create: if request.auth != null;
         allow read: if request.auth != null && 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
     }
   }
   ```

5. **Get Firebase Config**
   - Go to Project Settings → General
   - Scroll to "Your apps"
   - Click "Web" icon (</>) 
   - Register app with nickname
   - Copy the config object

### Step 3: Configure Project

1. **Update `js/firebase-config.js`**
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

2. **Create First Admin**
   - Run the app locally
   - Sign in with Google
   - Go to Firestore Console
   - Find your user document in `users` collection
   - Edit the document and set `role: "admin"`

### Step 4: Run Locally

**Option 1: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html`
- Select "Open with Live Server"

**Option 2: Python HTTP Server**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`

**Option 3: Node.js HTTP Server**
```bash
npx http-server -p 8000
```

---

## 🔐 User Roles

### Student (Default)
- Automatically assigned on first login
- Can browse and register for events
- Access to student dashboard

### Admin
- Manually assigned in Firestore
- Full event management access
- View analytics and export data
- Promote other users

### Officer
- Manually assigned in Firestore
- Access to QR scanner portal
- Mark attendance for events
- View scan statistics

**To Promote a User:**
1. Go to Firestore Console
2. Navigate to `users` collection
3. Find user document by email
4. Edit `role` field to `"admin"` or `"officer"`

---

## 🌐 Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory: `.` (current directory)
   - Configure as single-page app: **No**
   - Don't overwrite existing files

4. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

5. **Access Your App**
   - URL: `https://YOUR_PROJECT_ID.web.app`

### GitHub Pages (Alternative)

1. Create GitHub repository
2. Push code to `main` branch
3. Go to Settings → Pages
4. Select `main` branch as source
5. Save and wait for deployment

---

## 🎓 Viva Preparation

### Common Questions & Answers

#### 1. **What is your project about?**
**Answer:** EventFlow is a comprehensive college event management system that streamlines the entire event lifecycle - from creation and registration to attendance tracking. It features role-based access control with three user types: students who can browse and register for events, admins who manage events and analytics, and officers who verify attendance using QR code scanning.

#### 2. **What technologies did you use and why?**
**Answer:** We used:
- **Frontend**: HTML, CSS, JavaScript (Vanilla) - for simplicity and performance
- **Backend**: Firebase (Authentication, Firestore, Hosting) - for real-time data, scalability, and easy deployment
- **Libraries**: QRCode.js for ticket generation, html5-qrcode for scanning, Chart.js for analytics
- **Architecture**: Progressive Web App with service workers for offline support and push notifications

#### 3. **How does the QR code system work?**
**Answer:** When a student registers for an event, we generate a unique registration ID stored in Firestore. This ID is converted into a QR code using QRCode.js and displayed on their ticket. Officers use the html5-qrcode library to scan these codes via their device camera. The scanned ID is verified against the database, and if valid, attendance is marked with a timestamp and officer ID.

#### 4. **Explain your database structure.**
**Answer:** We use Cloud Firestore with four main collections:
- `users`: Stores user profiles with email, role, and metadata
- `events`: Contains event details like title, date, venue, capacity
- `registrations`: Links users to events with registration ID, attendance status
- `support_tickets`: Stores user support requests

Each collection uses document IDs for relationships, and we implement security rules to restrict access based on user roles.

#### 5. **How do you handle authentication?**
**Answer:** We use Firebase Authentication with Google Sign-In provider. When a user signs in, Firebase creates an authentication token. We then check if the user exists in our Firestore `users` collection. If not, we create a new user document with default role "student". For subsequent logins, we fetch their role and redirect them to the appropriate dashboard (admin, student, or officer).

#### 6. **What security measures did you implement?**
**Answer:** 
- Firebase Authentication for user verification
- Firestore Security Rules to restrict database access based on roles
- Client-side role checks before rendering UI
- Server-side validation through security rules
- HTTPS-only communication via Firebase Hosting
- No sensitive data stored in client-side code

#### 7. **How does the admin promote users?**
**Answer:** Admins can promote users by updating the `role` field in the user's Firestore document. Currently, this is done manually through the Firebase Console. In a production system, we would add an admin panel with a promote user feature that validates the email and updates the role programmatically.

#### 8. **What is a Progressive Web App (PWA)?**
**Answer:** A PWA is a web application that uses modern web capabilities to deliver an app-like experience. Our app implements:
- Service Worker for offline functionality and caching
- Web App Manifest for installability
- Push Notifications for event updates
- Responsive design for all devices

Users can install it on their home screen and use it like a native app.

#### 9. **How do push notifications work?**
**Answer:** We use the Web Push API with service workers. When an admin creates an event, the app sends a message to the service worker, which triggers a notification to all subscribed users. The service worker runs in the background and can show notifications even when the app is closed.

#### 10. **What challenges did you face?**
**Answer:** 
- **Real-time sync**: Solved using Firestore's real-time listeners
- **QR scanning on mobile**: Used html5-qrcode library with camera permissions
- **Role-based access**: Implemented with Firestore security rules and client-side checks
- **Offline support**: Implemented service worker caching strategy
- **Cross-browser compatibility**: Tested on Chrome, Firefox, Edge

#### 11. **How would you scale this system?**
**Answer:**
- Use Firebase Cloud Functions for server-side logic
- Implement pagination for large event lists
- Add caching with Redis for frequently accessed data
- Use Firebase Cloud Messaging for better push notifications
- Implement email notifications via SendGrid or similar
- Add image optimization and CDN for event images

#### 12. **What improvements would you make?**
**Answer:**
- Payment integration for paid events
- Email notifications for registrations
- Advanced analytics with attendance trends
- Mobile apps for iOS and Android
- Event categories and search functionality
- Social media integration for event sharing
- Automated reminders before events
- Certificate generation for attendees

#### 13. **Explain the confetti animation feature.**
**Answer:** When an admin successfully creates an event, we trigger a celebratory confetti animation using the canvas-confetti library. This provides immediate positive feedback and makes the interface more engaging. The animation is non-blocking and enhances user experience without affecting functionality.

#### 14. **How do you handle errors?**
**Answer:** We implement comprehensive error handling:
- Try-catch blocks around async operations
- User-friendly error messages via toast notifications
- Console logging for debugging
- Fallback UI for failed data loads
- Validation before database operations
- Network error detection and retry logic

#### 15. **What is Team CJ?**
**Answer:** Team CJ is our development team under CJ Productions. We developed this project as a comprehensive solution for college event management, focusing on user experience, security, and scalability.

---

## 👥 Team

**Team CJ**  
*Under CJ Productions*

### Project Roles
- **Project Lead**: Overall architecture and coordination
- **Frontend Developer**: UI/UX design and implementation
- **Backend Developer**: Firebase integration and database design
- **QA Tester**: Testing and bug fixes

---

## 📞 Support

For issues or questions:
- **Email**: support@teamcj.dev
- **Phone**: +91 9363963853
- **Support Page**: [/support.html](./support.html)

---

## 📄 License

This project is developed by Team CJ under CJ Productions for educational purposes.

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Font Awesome for icons
- Chart.js for analytics visualization
- QRCode.js and html5-qrcode libraries
- Canvas Confetti for animations

---

**Made with ❤️ by Team CJ | CJ Productions**
