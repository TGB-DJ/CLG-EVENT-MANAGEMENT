/**
 * CLG Event Management - Scanner Logic
 * Refactored for Firebase (Async)
 */
import { dbManager as db } from './db-firestore.js';
import { authService } from './auth.js';

// Protect this page
authService.monitorAuth(true);

const Utils = window.Utils;

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const btnStart = document.getElementById('btn-start-scan');
    const btnStop = document.getElementById('btn-stop-scan');
    const resultContainer = document.getElementById('result-container');

    const badge = document.getElementById('scan-status-badge');
    const nameEl = document.getElementById('scan-name');
    const detailEl = document.getElementById('scan-detail');
    const msgEl = document.getElementById('scan-message');

    // --- State ---
    let html5QrCode;
    let isScanning = false;
    let lastScannedId = null;
    let lastScanTime = 0;

    // --- Audio ---
    const audioSuccess = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3?v=1');
    const audioError = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3?v=1');

    // --- Listeners ---
    btnStart.addEventListener('click', startScanning);
    btnStop.addEventListener('click', stopScanning);

    // --- Functions ---

    function startScanning() {
        if (isScanning) return;

        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
        ).then(() => {
            isScanning = true;
            btnStart.classList.add('hidden');
            btnStop.classList.remove('hidden');
            resultContainer.classList.add('hidden');
        }).catch(err => {
            console.error(err);
            Utils.showToast("Camera error.", "error");
        });
    }

    function stopScanning() {
        if (!isScanning) return;
        html5QrCode.stop().then(() => {
            isScanning = false;
            btnStart.classList.remove('hidden');
            btnStop.classList.add('hidden');
            html5QrCode.clear();
        });
    }

    function onScanSuccess(decodedText, decodedResult) {
        const now = Date.now();
        // Prevent rapid re-scans of same code
        if (decodedText === lastScannedId && now - lastScanTime < 3000) {
            return;
        }
        lastScannedId = decodedText;
        lastScanTime = now;

        handleScanData(decodedText);
    }

    function onScanFailure(error) {
        // ignore
    }

    async function handleScanData(jsonString) {
        // Show scanning state?
        // Utils.showToast('Verifying...', 'info');

        try {
            const data = JSON.parse(jsonString);
            if (!data.id) throw new Error("Invalid QR Code");

            // Verify in Firestore
            try {
                // Determine if we are just marking it or checking first
                // markAttendance checks existence and 'scanned' status atomically(ish)
                // in our implementation it reads then writes.

                const updatedReg = await db.markAttendance(data.id);

                // Fetch event name for nicer display
                const event = await db.getEvent(updatedReg.eventId);
                const eventName = event ? event.title : 'Event';

                showResult('success', 'Verified', updatedReg.name, `Welcome to ${eventName}!`);
                audioSuccess.play();

            } catch (err) {
                // Error from markAttendance (Not found, or Already Scanned)
                showResult('error', 'Error', data.name || 'Unknown', err.message);
                audioError.play();
            }

        } catch (e) {
            console.error(e);
            showResult('error', 'Invalid', 'Unknown', 'QR format not recognized.');
            audioError.play();
        }
    }

    function showResult(type, badgeText, name, message) {
        resultContainer.classList.remove('hidden');
        resultContainer.className = `glass-panel result-card ${type}`;

        badge.textContent = badgeText;
        badge.className = `status-badge ${type}`;

        nameEl.textContent = name;
        detailEl.textContent = new Date().toLocaleTimeString();
        msgEl.textContent = message;
    }
});
