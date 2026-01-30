/**
 * CLG Event Management - Admin Dashboard Logic
 * Refactored for Firebase (Async)
 */
import { dbManager as db } from './db-firestore.js';
import { authService } from './auth.js';

// Protect this page (Admin Only)
authService.monitorAuth('admin');

const Utils = window.Utils;

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const eventsGrid = document.getElementById('events-grid');
    const modalCreate = document.getElementById('modal-create-event');
    const btnCreate = document.getElementById('btn-create-event');
    const btnExport = document.getElementById('btn-export-data');
    const formCreate = document.getElementById('form-create-event');
    const modalEdit = document.getElementById('modal-edit-event');
    const formEdit = document.getElementById('form-edit-event');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // Manage Team Elements
    const btnManageTeam = document.getElementById('btn-manage-team');
    const modalManageUsers = document.getElementById('modal-manage-users');
    const closeUserModalBtns = document.querySelectorAll('.close-modal-users');
    const usersList = document.getElementById('users-list');

    const statEvents = document.getElementById('stat-total-events');
    const statRegs = document.getElementById('stat-total-regs');

    // --- Initialization ---
    renderDashboard();

    // Set minimum date for event creation (today)
    const dateInput = document.getElementById('event-date-input');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // --- Event Listeners ---

    // Create Event Modal
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

    // Manage Team Modal
    if (btnManageTeam) {
        btnManageTeam.addEventListener('click', () => {
            modalManageUsers.classList.remove('hidden');
            renderUserList();
        });

        closeUserModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modalManageUsers.classList.add('hidden');
            });
        });

        modalManageUsers.addEventListener('click', (e) => {
            if (e.target === modalManageUsers) {
                modalManageUsers.classList.add('hidden');
            }
        });
    }

    async function renderUserList() {
        usersList.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Loading...</div>';
        try {
            const users = await db.getAllUsers();
            const currentUser = authService.user;

            usersList.innerHTML = '';

            if (users.length === 0) {
                usersList.innerHTML = '<p class="text-center">No users found.</p>';
                return;
            }

            // SORT Users: Admin > Officer > User
            const roleOrder = { 'admin': 1, 'officer': 2, 'user': 3 };
            users.sort((a, b) => {
                const rA = roleOrder[a.role || 'user'] || 3;
                const rB = roleOrder[b.role || 'user'] || 3;
                return rA - rB;
            });

            let lastRole = null;

            users.forEach(user => {
                const role = user.role || 'user';
                const isMe = currentUser && currentUser.uid === user.id;

                // ADD SPLITTER (Header) if role changes
                if (role !== lastRole) {
                    const header = document.createElement('h4');
                    header.style.cssText = 'margin: 1.5rem 0 0.5rem 0; color: var(--primary); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.25rem;';

                    let roleTitle = 'Students';
                    if (role === 'admin') roleTitle = 'Administrators';
                    if (role === 'officer') roleTitle = 'Officers';

                    header.textContent = roleTitle;
                    usersList.appendChild(header);
                    lastRole = role;
                }

                const row = document.createElement('div');
                row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 0.5rem;';

                let badgeClass = 'badge-warning'; // User
                if (role === 'admin') badgeClass = 'badge-success';
                if (role === 'officer') badgeClass = 'badge-secondary';

                const isSuper = db.isSuperAdmin(user.email);
                let controlsHtml;

                if (isSuper) {
                    controlsHtml = `<span class="badge badge-success" style="background: linear-gradient(135deg, #F59E0B, #B45309); border: 1px solid #F59E0B; color: white; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-crown"></i> Super Admin</span>`;
                } else {
                    controlsHtml = `
                        <span class="badge ${badgeClass}" style="text-transform: capitalize;">${role}</span>
                        ${!isMe ? `
                            <select class="form-control role-select" data-id="${user.id}" style="padding: 0.25rem; font-size: 0.85rem; width: auto;">
                                <option value="user" ${role === 'user' ? 'selected' : ''}>Student</option>
                                <option value="officer" ${role === 'officer' ? 'selected' : ''}>Officer</option>
                                <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                            <button class="btn-delete-user btn-icon" data-id="${user.id}" title="Delete User" style="color: var(--danger); margin-left: 0.5rem;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        ` : ''}
                    `;
                }

                row.innerHTML = `
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--secondary); display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            ${user.photoURL ? `<img src="${user.photoURL}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 0.8rem; color: #fff;">${(user.displayName || 'U').charAt(0).toUpperCase()}</span>`}
                        </div>
                        <div>
                            <div style="font-weight: 500; font-size: 0.9rem;">${user.displayName || 'Unknown User'} ${isMe ? '(You)' : ''}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${controlsHtml}
                    </div>
                `;
                usersList.appendChild(row);
            });

            // Add Listeners to dropdowns
            document.querySelectorAll('.role-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const uid = e.target.dataset.id;
                    const newRole = e.target.value;
                    const originalValue = e.target.defaultValue; // To revert on error

                    e.target.disabled = true;

                    try {
                        await db.updateUserRole(uid, newRole);
                        Utils.showToast(`Role updated to ${newRole}`, 'success');
                        renderUserList(); // Refresh UI
                    } catch (err) {
                        console.error(err);
                        Utils.showToast('Failed to update role', 'error');
                        e.target.value = originalValue; // Revert
                        e.target.disabled = false;
                    }
                });
            });

            // Add Listeners to delete buttons
            document.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const uid = e.target.closest('button').dataset.id;
                    if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
                        try {
                            await db.deleteUser(uid);
                            Utils.showToast('User deleted successfully', 'success');
                            renderUserList();
                        } catch (err) {
                            console.error(err);
                            Utils.showToast('Failed to delete user', 'error');
                        }
                    }
                });
            });

        } catch (error) {
            console.error(error);
            usersList.innerHTML = '<p class="text-center text-danger">Error loading users.</p>';
        }
    }

    formCreate.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = formCreate.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Prevent duplicate submissions
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Event...';

        const formData = new FormData(formCreate);
        const eventData = {
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            venue: formData.get('venue'),
            capacity: parseInt(formData.get('capacity')) || null,
            description: formData.get('description'),
        };

        try {
            const newEvent = await db.createEvent(eventData);

            // Success animation - Confetti!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981']
            });

            Utils.showToast('🎉 Event created successfully!', 'success');

            // Send push notification to all users (if service worker registered)
            try {
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    if (registration.active) {
                        // Trigger notification via service worker message
                        registration.active.postMessage({
                            type: 'NEW_EVENT',
                            event: newEvent
                        });
                    }
                }
            } catch (notifError) {
                console.log('Push notification not sent:', notifError);
            }

            formCreate.reset();
            modalCreate.classList.add('hidden');
            renderDashboard();

        } catch (error) {
            console.error(error);
            Utils.showToast('Failed to create event.', 'error');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Edit Event Form Submit
    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();

        const eventId = document.getElementById('edit-event-id').value;
        const formData = new FormData(formEdit);
        const eventData = {
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            venue: formData.get('venue'),
            capacity: parseInt(formData.get('capacity')) || null,
            description: formData.get('description'),
        };

        try {
            await db.updateEvent(eventId, eventData);
            Utils.showToast('Event updated successfully!', 'success');
            modalEdit.classList.add('hidden');
            renderDashboard();
        } catch (error) {
            console.error(error);
            Utils.showToast('Failed to update event.', 'error');
        }
    });

    // Event Grid Click Handler
    eventsGrid.addEventListener('click', async (e) => {
        if (e.target.closest('.btn-delete-event')) {
            const btn = e.target.closest('.btn-delete-event');
            const id = btn.dataset.id;

            // Get event details for better confirmation
            try {
                const events = await db.getAllEvents();
                const event = events.find(e => e.id === id);
                const eventTitle = event ? event.title : 'this event';

                const confirmMsg = `Delete "${eventTitle}"?\n\n⚠️ This will permanently delete:\n• The event\n• All registrations\n\nThis cannot be undone.`;

                if (!confirm(confirmMsg)) {
                    return;
                }

                await db.deleteEvent(id);
                Utils.showToast(`"${eventTitle}" deleted successfully`, 'info');
                renderDashboard();
            } catch (error) {
                console.error(error);
                Utils.showToast('Failed to delete event', 'error');
            }
        }

        // Handle Edit Button
        if (e.target.closest('.btn-edit-event')) {
            const btn = e.target.closest('.btn-edit-event');
            const id = btn.dataset.id;

            try {
                const events = await db.getAllEvents();
                const event = events.find(e => e.id === id);

                if (!event) {
                    Utils.showToast('Event not found', 'error');
                    return;
                }

                // Pre-fill form
                document.getElementById('edit-event-id').value = id;
                document.getElementById('edit-title').value = event.title;
                document.getElementById('edit-date').value = event.date;
                document.getElementById('edit-time').value = event.time || '';
                document.getElementById('edit-venue').value = event.venue;
                document.getElementById('edit-capacity').value = event.capacity || '';
                document.getElementById('edit-description').value = event.description || '';

                // Open modal
                modalEdit.classList.remove('hidden');
            } catch (error) {
                console.error(error);
                Utils.showToast('Failed to load event details', 'error');
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

    // Logout Handler
    document.getElementById('btn-logout').addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await authService.logout();
                Utils.showToast('Logged out successfully', 'success');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                Utils.showToast('Logout failed', 'error');
            }
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
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-edit-event btn-icon" data-id="${event.id}" title="Edit Event" style="color: var(--primary);">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn-delete-event btn-icon" data-id="${event.id}" title="Delete Event" style="color: var(--danger);">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem; color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${event.description || 'No description provided.'}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 0.5rem;">
                        <div class="text-center">
                             <span style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--text-light);">${event.capacity || '∞'}</span>
                             <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Total</span>
                        </div>
                        <div class="text-center">
                            <span style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--secondary);">${eventRegs.length}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Filled</span>
                        </div>
                        <div class="text-center">
                            <span style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--success);">${scannedCount}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Attended</span>
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
