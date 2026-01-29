/**
 * CLG Event Management - Admin Dashboard Logic
 * Refactored for Firebase (Async)
 */
import { dbManager as db } from './db-firestore.js';
import { authService } from './auth.js';

// Protect this page
authService.monitorAuth(true);

const Utils = window.Utils;

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const eventsGrid = document.getElementById('events-grid');
    const modalCreate = document.getElementById('modal-create-event');
    const btnCreate = document.getElementById('btn-create-event');
    const btnExport = document.getElementById('btn-export-data');
    const formCreate = document.getElementById('form-create-event');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    const statEvents = document.getElementById('stat-total-events');
    const statRegs = document.getElementById('stat-total-regs');

    // --- Initialization ---
    renderDashboard();

    // --- Event Listeners ---

    btnCreate.addEventListener('click', () => {
        modalCreate.classList.remove('hidden');
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modalCreate.classList.add('hidden');
        });
    });

    modalCreate.addEventListener('click', (e) => {
        if (e.target === modalCreate) {
            modalCreate.classList.add('hidden');
        }
    });

    formCreate.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(formCreate);
        const eventData = {
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            venue: formData.get('venue'),
            description: formData.get('description'),
        };

        try {
            await db.createEvent(eventData);
            Utils.showToast('Event created successfully!', 'success');
            formCreate.reset();
            modalCreate.classList.add('hidden');
            renderDashboard();
        } catch (error) {
            console.error(error);
            Utils.showToast('Failed to create event.', 'error');
        }
    });

    eventsGrid.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-delete-event')) {
            const btn = e.target.closest('.btn-delete-event');
            const id = btn.dataset.id;

            if (confirm('Are you sure you want to delete this event?')) {
                try {
                    await db.deleteEvent(id);
                    Utils.showToast('Event deleted.', 'info');
                    renderDashboard();
                } catch (error) {
                    console.error(error);
                    Utils.showToast('Failed to delete.', 'error');
                }
            }
        }
    });

    btnExport.addEventListener('click', async () => {
        try {
            const dataStr = await db.exportData();
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `event_manager_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Utils.showToast('Data exported successfully!', 'success');
        } catch (e) {
            Utils.showToast('Export failed', 'error');
        }
    });

    // --- Render Functions ---

    async function renderDashboard() {
        // Show Loading
        eventsGrid.innerHTML = `
            <div class="glass-panel" style="padding: 2rem; text-align: center; grid-column: span 2;">
                <p style="color: var(--text-muted)">Loading events from Firebase...</p>
            </div>
        `;

        try {
            const events = await db.getEvents();
            const allRegs = await db.getRegistrations();

            // Update Stats
            statEvents.textContent = events.length;
            statRegs.textContent = allRegs.length;

            eventsGrid.innerHTML = '';

            if (events.length === 0) {
                eventsGrid.innerHTML = `
                    <div class="glass-panel" style="padding: 2rem; text-align: center; grid-column: span 2; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                        <i class="fa-solid fa-calendar-xmark" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                        <p style="color: var(--text-muted)">No events found. Create your first event!</p>
                    </div>
                `;
                return;
            }

            // Sort events by date (newest first)
            events.sort((a, b) => new Date(b.date) - new Date(a.date));

            events.forEach(event => {
                const eventRegs = allRegs.filter(r => r.eventId === event.id);
                const scannedCount = eventRegs.filter(r => r.scanned).length;

                const card = document.createElement('div');
                card.className = 'glass-panel';
                card.style.padding = '1.5rem';
                card.style.position = 'relative';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">${event.title}</h3>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">
                                <i class="fa-regular fa-calendar"></i> ${Utils.formatDate(event.date)} &bull; ${event.venue}
                            </p>
                        </div>
                        <button class="btn-delete-event btn-icon" data-id="${event.id}" title="Delete Event" style="color: var(--danger);">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>

                    <div style="margin-bottom: 1.5rem; color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${event.description || 'No description provided.'}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 0.5rem;">
                        <div class="text-center">
                            <span style="display: block; font-size: 1.25rem; font-weight: 700; color: var(--secondary);">${eventRegs.length}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Registered</span>
                        </div>
                        <div class="text-center">
                            <span style="display: block; font-size: 1.25rem; font-weight: 700; color: var(--success);">${scannedCount}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Attended</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 0.5rem;">
                        <a href="register.html?event=${event.id}" target="_blank" class="btn btn-secondary" style="flex: 1; font-size: 0.9rem;">
                            <i class="fa-solid fa-share-nodes"></i> Share Reg
                        </a>
                    </div>
                `;
                eventsGrid.appendChild(card);
            });

            renderChart(events, allRegs);

        } catch (error) {
            console.error(error);
            eventsGrid.innerHTML = `
                <div class="glass-panel" style="padding: 2rem; text-align: center; grid-column: span 2;">
                    <p style="color: var(--danger)">Error loading data from Firebase.</p>
                </div>
            `;
        }
    }

    // --- Chart Logic ---
    let myChart = null;
    function renderChart(events, registrations) {
        const ctx = document.getElementById('registrationsChart');
        if (!ctx) return;

        const labels = events.map(e => e.title);
        const dataRegs = events.map(e => registrations.filter(r => r.eventId === e.id).length);
        const dataAttended = events.map(e => registrations.filter(r => r.eventId === e.id && r.scanned).length);

        if (myChart) {
            myChart.destroy();
        }

        // Check if Chart is loaded
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js not loaded yet");
            return;
        }

        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Registered',
                        data: dataRegs,
                        backgroundColor: 'rgba(236, 72, 153, 0.5)',
                        borderColor: 'rgba(236, 72, 153, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Attended',
                        data: dataAttended,
                        backgroundColor: 'rgba(16, 185, 129, 0.5)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8' } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
});
