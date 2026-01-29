/**
 * QR Scanner for Officer Portal
 * Handles ticket verification and attendance marking
 */

import { dbManager } from './db-firestore.js';
import { authService } from './auth.js';
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const Utils = window.Utils;

console.log('🔍 [OFFICER PORTAL] Initializing...');

// Elements
const authLoader = document.getElementById('auth-loader');
const mainNav = document.getElementById('main-nav');
const mainContent = document.getElementById('main-content');
const officerEmail = document.getElementById('officer-email');
const btnStartScan = document.getElementById('btn-start-scan');
const btnStopScan = document.getElementById('btn-stop-scan');
const btnManualVerify = document.getElementById('btn-manual-verify');
const manualTicketId = document.getElementById('manual-ticket-id');
const scanResult = document.getElementById('scan-result');
const recentScans = document.getElementById('recent-scans');
const statScans = document.getElementById('stat-scans');
const statVerified = document.getElementById('stat-verified');
const statInvalid = document.getElementById('stat-invalid');
const btnLogout = document.getElementById('btn-logout');

// Scanner instance
let html5QrcodeScanner = null;
let isScanning = false;

// Statistics
let stats = {
    scans: 0,
    verified: 0,
    invalid: 0
};

// Recent scans array
let recentScansArray = [];

// Monitor auth state
onAuthStateChanged(auth, async (user) => {
    console.log('🔔 [OFFICER PORTAL] Auth state:', user ? user.email : 'No user');

    if (!user) {
        console.log('❌ [OFFICER PORTAL] No user, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Check if user is officer
        const userDoc = await dbManager.getUser(user.uid);

        if (!userDoc || userDoc.role !== 'officer') {
            console.log('❌ [OFFICER PORTAL] Not an officer, redirecting');
            Utils.showToast('Access denied. Officer account required.', 'error');
            await authService.logout();
            window.location.href = 'login.html';
            return;
        }

        console.log('✅ [OFFICER PORTAL] Officer verified:', userDoc);

        // Show UI
        authLoader.classList.add('hidden');
        mainNav.classList.remove('hidden');
        mainContent.classList.remove('hidden');

        // Display officer info
        officerEmail.textContent = user.email;

    } catch (error) {
        console.error('❌ [OFFICER PORTAL] Error:', error);
        Utils.showToast('Error verifying access', 'error');
        window.location.href = 'login.html';
    }
});

// Start QR Scanner
btnStartScan.addEventListener('click', startScanner);

async function startScanner() {
    if (isScanning) return;

    try {
        html5QrcodeScanner = new Html5Qrcode("qr-reader");

        await html5QrcodeScanner.start(
            { facingMode: "environment" }, // Use back camera
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            onScanSuccess,
            onScanError
        );

        isScanning = true;
        btnStartScan.style.display = 'none';
        btnStopScan.style.display = 'inline-block';
        Utils.showToast('Scanner started', 'info');

    } catch (error) {
        console.error('Scanner error:', error);
        Utils.showToast('Failed to start scanner. Check camera permissions.', 'error');
    }
}

// Stop QR Scanner
btnStopScan.addEventListener('click', stopScanner);

async function stopScanner() {
    if (!isScanning || !html5QrcodeScanner) return;

    try {
        await html5QrcodeScanner.stop();
        html5QrcodeScanner.clear();

        isScanning = false;
        btnStartScan.style.display = 'inline-block';
        btnStopScan.style.display = 'none';
        Utils.showToast('Scanner stopped', 'info');

    } catch (error) {
        console.error('Error stopping scanner:', error);
    }
}

// QR Scan Success
async function onScanSuccess(decodedText, decodedResult) {
    console.log('QR Code scanned:', decodedText);

    // Stop scanner temporarily to prevent multiple scans
    if (isScanning) {
        await stopScanner();
    }

    // Verify ticket
    await verifyTicket(decodedText);
}

// QR Scan Error (ignore)
function onScanError(error) {
    // Ignore scanning errors (happens continuously while scanning)
}

// Manual Verify
btnManualVerify.addEventListener('click', async () => {
    const ticketId = manualTicketId.value.trim();

    if (!ticketId) {
        Utils.showToast('Please enter a ticket ID', 'warning');
        return;
    }

    await verifyTicket(ticketId);
    manualTicketId.value = '';
});

// Verify Ticket
async function verifyTicket(ticketId) {
    try {
        stats.scans++;
        updateStats();

        // Show loading
        showScanResult('loading', 'Verifying ticket...', ticketId);

        // Get registration by ID
        const registration = await dbManager.getRegistration(ticketId);

        if (!registration) {
            // Invalid ticket
            stats.invalid++;
            updateStats();
            showScanResult('error', 'Invalid Ticket', ticketId, 'This ticket does not exist.');
            addToRecentScans(ticketId, 'Invalid', null);
            return;
        }

        // Check if already attended
        if (registration.attended) {
            stats.invalid++;
            updateStats();
            const attendedTime = new Date(registration.attendedAt).toLocaleString();
            showScanResult('warning', 'Already Scanned', ticketId, `This ticket was already scanned at ${attendedTime}`);
            addToRecentScans(ticketId, 'Duplicate', registration);
            return;
        }

        // Get event details
        const event = await dbManager.getEvent(registration.eventId);

        // Mark attendance
        const user = auth.currentUser;
        await dbManager.markAttendance(ticketId, user.uid);

        stats.verified++;
        updateStats();

        // Show success
        showScanResult('success', 'Valid Ticket ✓', ticketId, `
            <strong>Student:</strong> ${registration.name}<br>
            <strong>Email:</strong> ${registration.email}<br>
            <strong>Event:</strong> ${event?.title || 'Unknown'}<br>
            <strong>Status:</strong> Attendance marked successfully!
        `);

        addToRecentScans(ticketId, 'Verified', registration, event);

        // Play success sound (optional)
        playSuccessSound();

    } catch (error) {
        console.error('Verification error:', error);
        stats.invalid++;
        updateStats();
        showScanResult('error', 'Verification Failed', ticketId, error.message);
        addToRecentScans(ticketId, 'Error', null);
    }
}

// Show Scan Result
function showScanResult(type, title, ticketId, message = '') {
    const colors = {
        loading: 'var(--primary)',
        success: 'var(--success)',
        error: 'var(--danger)',
        warning: 'var(--warning)'
    };

    const icons = {
        loading: 'fa-spinner fa-spin',
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle'
    };

    scanResult.innerHTML = `
        <div style="padding: 1.5rem; border-radius: 8px; background: ${colors[type]}22; border: 2px solid ${colors[type]};">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <i class="fa-solid ${icons[type]}" style="font-size: 2rem; color: ${colors[type]};"></i>
                <div>
                    <h3 style="margin: 0; color: ${colors[type]};">${title}</h3>
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem;">ID: ${ticketId}</p>
                </div>
            </div>
            ${message ? `<div style="margin-top: 1rem; color: var(--text-light);">${message}</div>` : ''}
        </div>
    `;
    scanResult.style.display = 'block';
}

// Update Statistics
function updateStats() {
    statScans.textContent = stats.scans;
    statVerified.textContent = stats.verified;
    statInvalid.textContent = stats.invalid;
}

// Add to Recent Scans
function addToRecentScans(ticketId, status, registration, event = null) {
    const scan = {
        ticketId,
        status,
        timestamp: new Date().toLocaleString(),
        studentName: registration?.name || 'Unknown',
        eventTitle: event?.title || 'Unknown'
    };

    recentScansArray.unshift(scan);

    // Keep only last 10
    if (recentScansArray.length > 10) {
        recentScansArray.pop();
    }

    renderRecentScans();
}

// Render Recent Scans
function renderRecentScans() {
    if (recentScansArray.length === 0) {
        recentScans.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No scans yet.</p>';
        return;
    }

    const statusColors = {
        'Verified': 'var(--success)',
        'Invalid': 'var(--danger)',
        'Duplicate': 'var(--warning)',
        'Error': 'var(--danger)'
    };

    recentScans.innerHTML = recentScansArray.map(scan => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 500; color: white;">${scan.studentName}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${scan.eventTitle}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${scan.timestamp}</div>
            </div>
            <div>
                <span style="padding: 0.25rem 0.75rem; border-radius: 12px; background: ${statusColors[scan.status]}22; color: ${statusColors[scan.status]}; font-size: 0.85rem; font-weight: 500;">
                    ${scan.status}
                </span>
            </div>
        </div>
    `).join('');
}

// Play Success Sound
function playSuccessSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// Logout
btnLogout.addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
        if (isScanning) {
            await stopScanner();
        }
        await authService.logout();
        window.location.href = 'login.html';
    }
});

console.log('✅ [OFFICER PORTAL] Initialized');
