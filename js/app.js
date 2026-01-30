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
    const usersListBody = document.getElementById('users-list-body');
    const userSearchInput = document.getElementById('user-search-input');
    const usersLoading = document.getElementById('users-loading');

    const statEvents = document.getElementById('stat-total-events');
    const statRegs = document.getElementById('stat-total-regs');

    // Analytics Elements
    const timeFilter = document.getElementById('analytics-time-filter');

    // Event Details Elements
    const modalEventDetails = document.getElementById('modal-event-details');
    const closeDetailsBtn = document.querySelector('.close-modal-details');
    const detailSearchInput = document.getElementById('detail-search-input');
    const detailStudentsList = document.getElementById('detail-students-list');
    const detailLoading = document.getElementById('detail-loading');

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

        // User Search Listener
        userSearchInput.addEventListener('input', (e) => {
            renderUserList(e.target.value);
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

    // Event Details Listeners
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            modalEventDetails.classList.add('hidden');
        });
        modalEventDetails.addEventListener('click', (e) => {
            if (e.target === modalEventDetails) {
                modalEventDetails.classList.add('hidden');
            }
        });

        detailSearchInput.addEventListener('input', (e) => {
            // Need current event context. 
            // We can store currentEventId in a variable or re-fetch active list.
            // For simplicity, let's look at the dataset of the modal or a global var.
            const eventId = modalEventDetails.dataset.eventId;
            if (eventId) {
                renderEventStudentList(eventId, e.target.value);
            }
        });
    }

    async function renderUserList(searchTerm = '') {
        usersListBody.innerHTML = '';
        usersLoading.style.display = 'block';

        try {
            const users = await db.getAllUsers();
            const currentUser = authService.user;

            usersLoading.style.display = 'none';

            if (users.length === 0) {
                usersListBody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 1rem;">No users found.</td></tr>';
                return;
            }

            // FILTER
            const term = searchTerm.toLowerCase();
            const filteredUsers = users.filter(user =>
                (user.displayName || '').toLowerCase().includes(term) ||
                (user.email || '').toLowerCase().includes(term)
            );

            if (filteredUsers.length === 0) {
                usersListBody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 1rem;">No matching users found.</td></tr>';
                return;
            }

            // SORT: Super Admin > Admin > Officer > User, then by Name
            const roleOrder = { 'admin': 1, 'officer': 2, 'user': 3 };
            filteredUsers.sort((a, b) => {
                const isSuperA = db.isSuperAdmin(a.email);
                const isSuperB = db.isSuperAdmin(b.email);

                if (isSuperA && !isSuperB) return -1;
                if (!isSuperA && isSuperB) return 1;

                const rA = roleOrder[a.role || 'user'] || 3;
                const rB = roleOrder[b.role || 'user'] || 3;
                if (rA !== rB) return rA - rB;
                return (a.displayName || '').localeCompare(b.displayName || '');
            });

            filteredUsers.forEach(user => {
                const role = user.role || 'user';
                const isMe = currentUser && currentUser.uid === user.id;
                const isSuper = db.isSuperAdmin(user.email);

                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05);';

                // Avatar & Name
                const avatarHtml = `
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--secondary); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                             ${user.photoURL ? `<img src="${user.photoURL}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 0.8rem; color: #fff;">${(user.displayName || 'U').charAt(0).toUpperCase()}</span>`}
                        </div>
                        <div>
                            <div style="font-weight: 500; font-size: 0.9rem; color: var(--text-light);">${user.displayName || 'Unknown'} ${isMe ? '<span style="color: var(--primary); font-size: 0.75rem;">(You)</span>' : ''}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email}</div>
                        </div>
                    </div>
                `;

                // Role Badge
                let badgeClass = 'badge-warning';
                if (role === 'admin') badgeClass = 'badge-success';
                if (role === 'officer') badgeClass = 'badge-secondary';

                const roleHtml = isSuper
                    ? `<span class="badge badge-success" style="background: linear-gradient(135deg, #F59E0B, #B45309); border: 1px solid #F59E0B; color: white;"><i class="fa-solid fa-crown" style="margin-right:4px;"></i> Super Admin</span>`
                    : `<span class="badge ${badgeClass}" style="text-transform: capitalize;">${role}</span>`;

                // Joined Date
                const joinedDate = user.createdAt ? Utils.formatDate(user.createdAt) : 'Unknown';

                // Actions
                let actionsHtml = '';
                if (!isSuper && !isMe) {
                    actionsHtml = `
                        <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                            <select class="form-control role-select" data-id="${user.id}" style="padding: 0.25rem; font-size: 0.8rem; width: auto; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border);">
                                <option value="user" ${role === 'user' ? 'selected' : ''}>Student</option>
                                <option value="officer" ${role === 'officer' ? 'selected' : ''}>Officer</option>
                                <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                            <button class="btn-delete-user btn-icon" data-id="${user.id}" title="Delete User">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    `;
                } else if (isMe) {
                    actionsHtml = `<span style="color: var(--text-muted); font-size: 0.8rem;">Current Session</span>`;
                } else {
                    actionsHtml = `<span style="color: var(--text-muted); font-size: 0.8rem;">Protected</span>`;
                }

                tr.innerHTML = `
                    <td style="padding: 0.75rem;">${avatarHtml}</td>
                    <td style="padding: 0.75rem;">${roleHtml}</td>
                    <td style="padding: 0.75rem; color: var(--text-muted); font-size: 0.9rem;">${joinedDate}</td>
                    <td style="padding: 0.75rem; text-align: right;">${actionsHtml}</td>
                `;

                usersListBody.appendChild(tr);
            });

            // Re-attach listeners
            attachUserActionListeners();

        } catch (error) {
            console.error(error);
            usersListBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger" style="padding: 1rem;">Error loading users.</td></tr>';
        } finally {
            usersLoading.style.display = 'none';
        }
    }

    function attachUserActionListeners() {
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const uid = e.target.dataset.id;
                const newRole = e.target.value;
                const originalValue = e.target.defaultValue;

                e.target.disabled = true;

                try {
                    await db.updateUserRole(uid, newRole);
                    Utils.showToast(`Role updated to ${newRole}`, 'success');
                    renderUserList(userSearchInput.value);
                } catch (err) {
                    console.error(err);
                    Utils.showToast('Failed to update role', 'error');
                    e.target.value = originalValue;
                    e.target.disabled = false;
                }
            });
        });

        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const uid = e.target.closest('button').dataset.id;
                if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
                    try {
                        await db.deleteUser(uid);
                        Utils.showToast('User deleted successfully', 'success');
                        renderUserList(userSearchInput.value);
                    } catch (err) {
                        console.error(err);
                        Utils.showToast('Failed to delete user', 'error');
                    }
                }
            });
        });
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
        // Handle Manage / Details Button
        if (e.target.closest('.btn-manage-event')) {
            const btn = e.target.closest('.btn-manage-event');
            const id = btn.dataset.id;
            openEventDetails(id);
        }

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

    // --- Advanced Export Logic ---
    const modalExportOptions = document.getElementById('modal-export-options');
    const closeExportBtn = document.querySelector('.close-modal-export');
    const exportScopeRadios = document.getElementsByName('export-scope');
    const exportEventSelectContainer = document.getElementById('export-event-select-container');
    const exportEventSelect = document.getElementById('export-event-select');
    const btnExportActions = document.querySelectorAll('.btn-export-action');

    // Open/Close Modal
    btnExport.addEventListener('click', async () => {
        modalExportOptions.classList.remove('hidden');
        // Pre-load events for selector
        if (exportEventSelect.options.length <= 1) {
            try {
                const events = await db.getEvents();
                exportEventSelect.innerHTML = '<option value="">Select an event...</option>';
                events.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
                events.forEach(event => {
                    const option = document.createElement('option');
                    option.value = event.id;
                    option.textContent = `${event.title} (${Utils.formatDate(event.date)})`;
                    exportEventSelect.appendChild(option);
                });
            } catch (e) {
                console.error("Failed to load events for export", e);
                exportEventSelect.innerHTML = '<option value="">Error loading events</option>';
            }
        }
    });

    closeExportBtn.addEventListener('click', () => {
        modalExportOptions.classList.add('hidden');
    });

    // Close on background click
    modalExportOptions.addEventListener('click', (e) => {
        if (e.target === modalExportOptions) modalExportOptions.classList.add('hidden');
    });

    // Scope Toggle
    exportScopeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'single') {
                exportEventSelectContainer.style.display = 'block';
            } else {
                exportEventSelectContainer.style.display = 'none';
            }
        });
    });

    // Handle Export Actions
    btnExportActions.forEach(btn => {
        btn.addEventListener('click', async () => {
            const format = btn.dataset.format;
            const scope = Array.from(exportScopeRadios).find(r => r.checked).value;
            let data = null;
            let filename = 'export';

            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                // 1. Fetch Data
                if (scope === 'all') {
                    data = await db.exportData(); // Returns raw object
                    filename = `Backup_Full_${new Date().toISOString().slice(0, 10)}`;
                } else {
                    const eventId = exportEventSelect.value;
                    if (!eventId) {
                        Utils.showToast("Please select an event first", "warning");
                        throw new Error("No event selected");
                    }
                    data = await db.exportEventData(eventId);
                    filename = `Report_${data.event.title.replace(/[^a-z0-9]/gi, '_').substring(0, 20)}_${new Date().toISOString().slice(0, 10)}`;
                }

                // 2. Process Format
                if (format === 'json') {
                    downloadJSON(data, filename);
                } else if (format === 'excel') {
                    generateExcel(data, scope, filename);
                } else if (format === 'pdf') {
                    generatePDF(data, scope, filename);
                }

                Utils.showToast(`${format.toUpperCase()} Export generated!`, 'success');
                modalExportOptions.classList.add('hidden');

            } catch (error) {
                console.error("Export failed:", error);
                if (error.message !== "No event selected") Utils.showToast("Export failed. Check console.", "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    });

    function downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function generateExcel(data, scope, filename) {
        if (!window.XLSX) {
            Utils.showToast("Excel library not loaded", "error");
            return;
        }

        const wb = XLSX.utils.book_new();

        if (scope === 'all') {
            // Sheet 1: Users (PRIORITY - Display First)
            const cleanUsers = data.users.map(u => {
                const userRegs = data.registrations.filter(r => r.email === u.email);
                const eventNames = userRegs.map(r => {
                    const evt = data.events.find(e => e.id === r.eventId);
                    return evt ? evt.title : 'Unknown Event';
                }).join(', ');

                return {
                    "User ID": u.id,
                    "Name": u.displayName,
                    "Email": u.email,
                    "Role": (u.role || 'user').toUpperCase(),
                    "Access Level": db.isSuperAdmin(u.email) ? "SUPER ADMIN" : (u.role || 'user').toUpperCase(),
                    "Joined At": u.createdAt ? (u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleString() : new Date(u.createdAt).toLocaleString()) : 'Unknown',
                    "Events Registered": eventNames || 'None'
                };
            });
            const wsUsers = XLSX.utils.json_to_sheet(cleanUsers);
            XLSX.utils.book_append_sheet(wb, wsUsers, "Users List");

            // Sheet 2: Registrations
            const cleanRegs = data.registrations.map(r => ({
                "Student Name": r.studentName || r.name,
                "Email": r.email,
                "Event ID": r.eventId,
                "Status": r.scanned ? "Attended" : "Registered",
                "Registered At": r.registeredAt ? new Date(r.registeredAt).toLocaleString() : ''
            }));
            const wsRegs = XLSX.utils.json_to_sheet(cleanRegs);
            XLSX.utils.book_append_sheet(wb, wsRegs, "All Registrations");

            // Sheet 3: Events
            const cleanEvents = data.events.map(e => ({
                "Event Title": e.title,
                "Date": Utils.formatDate(e.date),
                "Time": e.time,
                "Venue": e.venue,
                "Capacity": e.capacity || 'Unlimited',
                "Description": e.description
            }));
            const wsEvents = XLSX.utils.json_to_sheet(cleanEvents);
            XLSX.utils.book_append_sheet(wb, wsEvents, "Event List");

            // Sheet 4: Summary (Stats)
            const statsData = [
                ["Metric", "Value"],
                ["Export Date", new Date(data.exportDate).toLocaleString()],
                ["Total Events", data.stats.totalEvents],
                ["Total Registrations", data.stats.totalRegistrations],
                ["Total Users", data.stats.totalUsers],
                ["Admin Users", data.stats.adminUsers],
                ["Upcoming Events", data.stats.upcomingEvents]
            ];
            const wsStats = XLSX.utils.aoa_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, wsStats, "Summary Stats");

        } else {
            // SINGLE EVENT
            // Sheet 1: Event Info
            const eventInfo = [
                ["Title", data.event.title],
                ["Date", Utils.formatDate(data.event.date)],
                ["Venue", data.event.venue],
                ["Total Registers", data.stats.totalRegistrations],
                ["Attended", data.stats.attended]
            ];
            const wsInfo = XLSX.utils.aoa_to_sheet(eventInfo);
            XLSX.utils.book_append_sheet(wb, wsInfo, "Event Info");

            // Sheet 2: Student List
            const studentList = data.registrations.map(r => ({
                "Student Name": r.studentName || r.name,
                "Email": r.email,
                "Registration Date": r.registeredAt ? new Date(r.registeredAt).toLocaleString() : 'Unknown',
                "Attendance Status": r.scanned ? "ATTENDED" : "Registered"
            }));
            const wsStudents = XLSX.utils.json_to_sheet(studentList);
            XLSX.utils.book_append_sheet(wb, wsStudents, "Student List");
        }

        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    function generatePDF(data, scope, filename) {
        if (!window.jspdf) {
            Utils.showToast("PDF library not loaded", "error");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(scope === 'all' ? "System Backup Report" : "Event Report", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.setTextColor(0);

        if (scope === 'all') {
            doc.setFontSize(14);
            doc.text("Summary", 14, 40);

            const summaryData = [
                ["Total Events", "" + data.stats.totalEvents],
                ["Total Registrations", "" + data.stats.totalRegistrations],
                ["Total Users", "" + data.stats.totalUsers]
            ];

            doc.autoTable({
                startY: 45,
                head: [['Metric', 'Value']],
                body: summaryData,
                theme: 'grid'
            });

            // Users Table for PDF
            doc.text("System Users", 14, doc.lastAutoTable.finalY + 15);

            const userColumns = ["Name", "Email", "Role", "Events Registered", "Photo URL"];
            const userRows = data.users.map(u => {
                const userRegs = data.registrations.filter(r => r.email === u.email);
                const eventNames = userRegs.map(r => {
                    const evt = data.events.find(e => e.id === r.eventId);
                    return evt ? evt.title : 'Unknown';
                }).join(', ');

                return [
                    u.displayName,
                    u.email,
                    db.isSuperAdmin(u.email) ? "SUPER ADMIN" : (u.role || 'user').toUpperCase(),
                    eventNames || 'None',
                    u.photoURL || ''
                ];
            });

            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 20,
                head: [userColumns],
                body: userRows,
                theme: 'striped',
                headStyles: { fillColor: [75, 85, 99] }, // Dark gray
                styles: { fontSize: 8, overflow: 'linebreak' },
                columnStyles: {
                    3: { cellWidth: 40 }, // Events Registered
                    4: { cellWidth: 40 }  // Photo URL
                }
            });

        } else {
            // SINGLE EVENT
            doc.setFontSize(16);
            doc.text(data.event.title, 14, 40);

            doc.setFontSize(11);
            doc.text(`Date: ${Utils.formatDate(data.event.date)}`, 14, 50);
            doc.text(`Venue: ${data.event.venue}`, 14, 56);
            doc.text(`Total Registrations: ${data.stats.totalRegistrations}`, 14, 62);
            doc.text(`Attended: ${data.stats.attended}`, 14, 68);

            // Student Table
            const columns = ["Name", "Email", "Status", "Registered At"];
            const rows = data.registrations.map(r => [
                r.studentName || r.name,
                r.email,
                r.scanned ? "Attended" : "Registered",
                new Date(r.registeredAt).toLocaleDateString()
            ]);

            doc.autoTable({
                startY: 75,
                head: [columns],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [99, 102, 241] } // Primary color
            });
        }

        doc.save(`${filename}.pdf`);
    }

    // Analytics Time Filter Listener
    timeFilter.addEventListener('change', () => {
        // We need the data to re-render. 
        // Best approach: Store data in a module-level variable or re-fetch.
        // Since we are already in renderDashboard scope, let's just trigger renderDashboard.
        // But to avoid network cost, let's use a cached variable if possible.
        // For simplicity, we will re-call renderDashboard() but relies on Firebase cache mostly.
        renderDashboard();
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

    // --- Event Details Logic ---
    async function openEventDetails(eventId) {
        modalEventDetails.classList.remove('hidden');
        modalEventDetails.dataset.eventId = eventId;

        // Reset UI
        document.getElementById('detail-event-title').textContent = 'Loading...';
        document.getElementById('detail-event-meta').textContent = '';
        document.getElementById('detail-stat-registered').textContent = '-';
        document.getElementById('detail-stat-attended').textContent = '-';
        document.getElementById('detail-stat-pending').textContent = '-';
        detailStudentsList.innerHTML = '';
        detailLoading.style.display = 'block';
        detailSearchInput.value = '';

        try {
            const event = await db.getEvent(eventId);
            if (!event) throw new Error("Event not found");

            document.getElementById('detail-event-title').textContent = event.title;
            document.getElementById('detail-event-meta').textContent = `${Utils.formatDate(event.date)} • ${event.venue}`;

            await renderEventStudentList(eventId);

        } catch (error) {
            console.error(error);
            Utils.showToast("Failed to load event details", "error");
            modalEventDetails.classList.add('hidden');
        }
    }

    async function renderEventStudentList(eventId, searchTerm = '') {
        try {
            // We fetch simple list. For scale, we might want to cache or pass data.
            const allRegs = await db.getRegistrations(eventId);

            // Stats Calculation
            const total = allRegs.length;
            const attended = allRegs.filter(r => r.scanned).length;
            const pending = total - attended;

            document.getElementById('detail-stat-registered').textContent = total;
            document.getElementById('detail-stat-attended').textContent = attended;
            document.getElementById('detail-stat-pending').textContent = pending;

            // Render List
            detailLoading.style.display = 'none';
            detailStudentsList.innerHTML = '';

            if (allRegs.length === 0) {
                detailStudentsList.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 1rem;">No students registered yet.</td></tr>';
                return;
            }

            const term = searchTerm.toLowerCase();
            const filteredRegs = allRegs.filter(r =>
                (r.name || '').toLowerCase().includes(term) ||
                (r.email || '').toLowerCase().includes(term)
            );

            if (filteredRegs.length === 0) {
                detailStudentsList.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 1rem;">No matching students found.</td></tr>';
                return;
            }

            // Sort: Attended first, then by Name
            filteredRegs.sort((a, b) => {
                if (a.scanned !== b.scanned) return b.scanned - a.scanned; // true (1) before false (0)
                return (a.name || '').localeCompare(b.name || '');
            });

            filteredRegs.forEach(reg => {
                const tr = document.createElement('tr');
                tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05);';

                // Display Date & Time of Registration
                // reg.registeredAt is ISO string
                const regDate = reg.registeredAt
                    ? `${Utils.formatDate(reg.registeredAt)} <span style="font-size:0.8rem; color:var(--text-muted); margin-left:4px;">${Utils.formatTime(reg.registeredAt)}</span>`
                    : 'Unknown';

                let statusBadge = `<span class="badge badge-warning">Registered</span>`;
                if (reg.scanned) {
                    statusBadge = `<span class="badge badge-success">Attended</span>`;
                }

                tr.innerHTML = `
                    <td style="padding: 0.75rem;">
                        <div style="font-weight: 500; font-size: 0.9rem; color: var(--text-light);">${reg.name}</div>
                    </td>
                    <td style="padding: 0.75rem; color: var(--text-muted); font-size: 0.9rem;">${reg.email}</td>
                    <td style="padding: 0.75rem; font-size: 0.9rem;">${regDate}</td>
                    <td style="padding: 0.75rem; text-align: right;">${statusBadge}</td>
                `;
                detailStudentsList.appendChild(tr);
            });

        } catch (error) {
            console.error(error);
            detailStudentsList.innerHTML = '<tr><td colspan="4" class="text-center text-danger" style="padding: 1rem;">Error loading list.</td></tr>';
        }
    }

    // --- Render Functions ---

    async function renderDashboard() {
        // 1. Initial Loading State
        if (!eventsGrid.hasChildNodes()) {
            eventsGrid.innerHTML = `
                <div class="glass-panel" style="padding: 2rem; text-align: center; grid-column: span 2;">
                    <p style="color: var(--text-muted)">Loading events...</p>
                </div>
            `;
        }

        try {
            // 2. Fetch Events (Fast)
            const events = await db.getEvents();

            // Update Event Count Immediately
            statEvents.textContent = events.length;

            eventsGrid.innerHTML = '';

            if (events.length === 0) {
                eventsGrid.innerHTML = `
                    <div class="glass-panel" style="padding: 2rem; text-align: center; grid-column: span 2; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                        <i class="fa-solid fa-calendar-xmark" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                        <p style="color: var(--text-muted)">No events found. Create your first event!</p>
                    </div>
                `;
                // Clear regs if no events
                statRegs.textContent = '0';
                return;
            }

            // Sort events by date (newest first)
            events.sort((a, b) => new Date(b.date) - new Date(a.date));

            // 3. Render Cards with Placeholders (Instant)
            events.forEach(event => {
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
                            <button class="btn-manage-event btn-icon" data-id="${event.id}" title="Manage Event / View Details" style="color: var(--text-light);">
                                <i class="fa-solid fa-eye"></i>
                            </button>
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
                            <span id="stat-filled-${event.id}" style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--secondary);">...</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Filled</span>
                        </div>
                        <div class="text-center">
                            <span id="stat-attended-${event.id}" style="display: block; font-size: 1.1rem; font-weight: 700; color: var(--success);">...</span>
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

            // 4. Fetch Registrations (Slow) in Background
            const allRegs = await db.getRegistrations();

            // 5. Update Stats
            // Filter Logic: Only count registrations for CURRENT events
            const eventIds = new Set(events.map(e => e.id));
            const activeRegs = allRegs.filter(r => eventIds.has(r.eventId));
            statRegs.textContent = activeRegs.length;

            // Update Card Stats
            events.forEach(event => {
                const eventRegs = allRegs.filter(r => r.eventId === event.id);
                const scannedCount = eventRegs.filter(r => r.scanned).length;

                const filledEl = document.getElementById(`stat-filled-${event.id}`);
                const attendedEl = document.getElementById(`stat-attended-${event.id}`);

                if (filledEl) filledEl.textContent = eventRegs.length;
                if (attendedEl) attendedEl.textContent = scannedCount;
            });

            // 6. Render Chart (Non-blocking usually, but good to be last)
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

        // Apply Time Filter
        const days = timeFilter.value;
        let filteredEvents = events;

        if (days !== 'all') {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
            filteredEvents = events.filter(e => new Date(e.date) >= cutoffDate);
        }

        // Sort by Date (Oldest to Newest for Chart)
        filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        const labels = filteredEvents.map(e => e.title);
        const dataRegs = filteredEvents.map(e => registrations.filter(r => r.eventId === e.id).length);
        const dataAttended = filteredEvents.map(e => registrations.filter(r => r.eventId === e.id && r.scanned).length);

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
