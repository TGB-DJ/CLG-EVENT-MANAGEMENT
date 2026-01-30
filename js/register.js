/**
 * CLG Event Management - Registration Logic
 * Refactored for Firebase (Async)
 */
import { dbManager as db } from './db-firestore.js';

const Utils = window.Utils;

document.addEventListener('DOMContentLoaded', async () => {
    // --- Elements ---
    const formRegister = document.getElementById('form-register');
    const inputEventId = document.getElementById('input-eventId');

    const regSection = document.getElementById('registration-section');
    const ticketSection = document.getElementById('ticket-section');

    const eventTitleDisplay = document.getElementById('event-title-display');
    const eventDateDisplay = document.getElementById('event-date-display');

    const ticketEventName = document.getElementById('ticket-event-name');
    const ticketEventDetails = document.getElementById('ticket-event-details');
    const ticketStudentName = document.getElementById('ticket-student-name');
    const ticketId = document.getElementById('ticket-id');
    const btnDownload = document.getElementById('btn-download-ticket');

    // --- State ---
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    let currentEvent = null;

    // --- Initialization ---
    if (!eventId) {
        alert('No event specified! Redirecting to home.');
        window.location.href = 'admin.html';
        return;
    }

    // Load Event Data
    try {
        eventTitleDisplay.textContent = 'Loading Event Details...';
        currentEvent = await db.getEvent(eventId);

        if (!currentEvent) {
            throw new Error('Event not found');
        }

        // Populate UI
        inputEventId.value = eventId;
        eventTitleDisplay.textContent = currentEvent.title;
        eventDateDisplay.textContent = `${Utils.formatDate(currentEvent.date)} @ ${currentEvent.venue}`;

        // CHECK FOR TICKET ID (View Mode)
        const ticketId = urlParams.get('ticket');
        if (ticketId) {
            console.log("Viewing Ticket:", ticketId);
            const registration = await db.getRegistration(ticketId);
            if (registration) {
                showTicket(registration);
            } else {
                Utils.showToast('Ticket not found!', 'error');
            }
        }

    } catch (e) {
        console.error(e);
        alert('Invalid Event. Redirecting to home.');
        window.location.href = 'admin.html';
    }

    // --- Event Listeners ---

    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = formRegister.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        const formData = new FormData(formRegister);
        const regData = {
            eventId: eventId,
            name: formData.get('name'),
            rollNo: formData.get('rollNo'),
            email: formData.get('email'),
            dept: formData.get('dept')
        };

        try {
            // 1. Check if already registered
            const regs = await db.getRegistrations(eventId);
            const existingReg = regs.find(r => r.email.toLowerCase() === regData.email.toLowerCase());

            if (existingReg) {
                Utils.showToast('Welcome back! Showing your existing ticket.', 'info');
                showTicket(existingReg);
            } else {
                // 2. New Registration
                const newReg = await db.registerParticipant(regData);
                Utils.showToast('Registration successful!', 'success');
                showTicket(newReg);
            }
        } catch (error) {
            console.error(error);
            Utils.showToast(error.message || 'Registration failed', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirm Registration';

            // Re-enable input if failed (but not if success/existing)
            if (!document.getElementById('ticket-section').classList.contains('hidden')) {
                // Ticket showing, leave disabled/processed
            }
        }
    });

    // --- Functions ---

    function showTicket(registration) {
        regSection.classList.add('hidden');
        ticketSection.classList.remove('hidden');

        ticketEventName.textContent = currentEvent.title;
        ticketEventDetails.textContent = `${Utils.formatDate(currentEvent.date)} • ${Utils.formatTime(currentEvent.time)}`;
        ticketStudentName.textContent = registration.name;
        ticketId.textContent = `ID: ${registration.id}`;

        const qrData = JSON.stringify({
            id: registration.id,
            eventId: registration.eventId,
            name: registration.name
        });

        document.getElementById('qrcode').innerHTML = "";

        new QRCode(document.getElementById("qrcode"), {
            text: qrData,
            width: 150,
            height: 150,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Smart Sharing Buttons
        const shareContainer = document.createElement('div');
        shareContainer.style.marginTop = '1rem';
        shareContainer.style.display = 'flex';
        shareContainer.style.gap = '0.5rem';
        shareContainer.style.justifyContent = 'center';

        // 1. WhatsApp Share
        const waBtn = document.createElement('a');
        waBtn.className = 'btn btn-secondary';
        waBtn.style.backgroundColor = '#25D366'; // WhatsApp Green
        waBtn.style.color = 'white';
        waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Share';
        waBtn.target = '_blank';
        const ticketUrl = `${window.location.origin}${window.location.pathname}?event=${eventId}&ticket=${registration.id}`;
        const waText = `Here is my ticket for ${currentEvent.title}.\nID: ${registration.id}\nDate: ${Utils.formatDate(currentEvent.date)}\n\nView Ticket: ${ticketUrl}`;
        waBtn.href = `https://wa.me/?text=${encodeURIComponent(waText)}`;

        // 2. Google Calendar
        const calBtn = document.createElement('button');
        calBtn.className = 'btn btn-secondary';
        calBtn.innerHTML = '<i class="fa-regular fa-calendar-plus"></i> Add to Cal';
        calBtn.onclick = () => {
            // Construct GCal Link
            // Need dates in YYYYMMDDTHHMMSSZ format. Simple approx for now or use library.
            // Let's assume date is YYYY-MM-DD and Time is HH:MM
            const startD = currentEvent.date.replace(/-/g, '') + 'T' + currentEvent.time.replace(':', '') + '00';
            const endD = startD; // 1 hour duration assumption?
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(currentEvent.title)}&dates=${startD}/${endD}&details=${encodeURIComponent(currentEvent.description)}&location=${encodeURIComponent(currentEvent.venue)}`;
            window.open(gcalUrl, '_blank');
        };

        shareContainer.appendChild(waBtn);
        shareContainer.appendChild(calBtn);

        document.getElementById('ticket-card').after(shareContainer);

        btnDownload.onclick = () => {
            const ticketCard = document.getElementById('ticket-card');

            html2canvas(ticketCard, {
                scale: 2,
                backgroundColor: null
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `Ticket_${registration.name.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
        };
    }
});
