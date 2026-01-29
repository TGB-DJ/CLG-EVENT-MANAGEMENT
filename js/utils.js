/**
 * Utility Functions for UI interactions
 */

const Utils = {
    // Format Date: DD MMM YYYY
    formatDate: (dateString) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    // Format Time: HH:MM AM/PM
    formatTime: (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Create a Toast Notification
    showToast: (message, type = 'info') => {
        // Create toast container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');

        // Colors
        const bgColors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        toast.style.cssText = `
            background-color: ${bgColors[type] || bgColors.info};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: var(--font-body);
            font-size: 0.9rem;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            min-width: 250px;
        `;
        toast.textContent = message;

        container.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after 3s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
