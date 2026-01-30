/**
 * Officer Dashboard Logic
 * Handles QR Code Scanning and Attendance
 */
import { dbManager as db } from './db-firestore.js';
import { authService } from './auth.js';

// Auth Check (Officer or Admin)
authService.monitorAuth('officer');

const Utils = window.Utils;

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const successCard = document.getElementById('scan-success');
    const errorCard = document.getElementById('scan-error');
    const errorText = document.getElementById('error-text');

    // Output Elements
    const outName = document.getElementById('student-name');
    const outEvent = document.getElementById('event-name');
    const outId = document.getElementById('ticket-id-display');

    // State
    let isScanning = true;
    let lastScanTime = 0;

    // Initialize Scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        },
        /* verbose= */ false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText, decodedResult) {
        // Debounce scanning (prevent multiple triggers for same code in short time)
        const now = Date.now();
        if (now - lastScanTime < 3000) return;
        lastScanTime = now;

        console.log(`Code scanned = ${decodedText}`, decodedResult);

        // Hide previous results
        successCard.style.display = 'none';
        errorCard.style.display = 'none';

        try {
            // 1. Parse Data
            let ticketData;
            try {
                ticketData = JSON.parse(decodedText);
            } catch (e) {
                throw new Error("Invalid QR Code Format");
            }

            if (!ticketData.id || !ticketData.eventId) {
                throw new Error("Incomplete Ticket Data");
            }

            Utils.showToast('Verifying...', 'info');

            // 2. Mark Attendance in DB
            // We pass the current user (officer) ID as the verifier
            const officerId = authService.user ? authService.user.uid : 'search_terminal';

            // 3. Verify & Update
            const result = await db.markAttendance(ticketData.id, officerId);

            // 4. Show Success
            successCard.style.display = 'block';
            const sName = result.studentName || ticketData.name || 'Student';
            const eName = result.eventName || 'Event';

            outName.textContent = sName;
            outEvent.textContent = eName;
            outId.textContent = ticketData.id;

            // UPDATE STATS & LIST
            updateSessionStats(sName, eName, ticketData.id);

            // Play success sound (beep)
            playSound('success');

        } catch (error) {
            console.error("Scan Error:", error);

            // Show Error
            errorCard.style.display = 'block';
            errorText.textContent = error.message;

            // Play error sound
            playSound('error');
        }
    }

    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    }

    // Sound Helper
    function playSound(type) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } else {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        }
    }

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        authService.logout();
    });

    // Stats Helper
    let sessionCount = 0;
    function updateSessionStats(name, event, id) {
        sessionCount++;
        document.getElementById('session-count').textContent = sessionCount;

        const list = document.getElementById('recent-scans-list');
        const emptyMsg = document.getElementById('no-scans-msg');
        if (emptyMsg) emptyMsg.style.display = 'none';

        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem; border-left: 3px solid var(--success); display: flex; justify-content: space-between; align-items: center;';

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
            <div>
                <div style="font-weight: bold; font-size: 0.9rem;">${name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${event}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 0.8rem; font-family: monospace;">${id.substr(0, 8)}...</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${time}</div>
            </div>
        `;

        // Prepend logic
        list.insertBefore(item, list.firstChild);
    }
});
