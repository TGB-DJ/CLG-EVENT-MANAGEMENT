// Input Validation Utilities
export class Validator {
    // Email validation
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Roll number validation (customize pattern for your college)
    static isValidRollNumber(rollNo) {
        // Example: Accepts alphanumeric, 6-15 characters
        const rollRegex = /^[A-Z0-9]{6,15}$/i;
        return rollRegex.test(rollNo);
    }

    // Name validation
    static isValidName(name) {
        return name && name.trim().length >= 2 && name.trim().length <= 100;
    }

    // Phone validation (Indian format)
    static isValidPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Sanitize HTML to prevent XSS
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Validate event capacity
    static isValidCapacity(capacity) {
        const num = parseInt(capacity);
        return !isNaN(num) && num > 0 && num <= 10000;
    }

    // Validate date (not in past)
    static isValidFutureDate(dateString) {
        const inputDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate >= today;
    }
}

// Form validation helper
export function validateForm(formElement, rules) {
    const errors = [];
    const formData = new FormData(formElement);

    for (const [field, validators] of Object.entries(rules)) {
        const value = formData.get(field);

        for (const validator of validators) {
            const result = validator(value);
            if (result !== true) {
                errors.push({ field, message: result });
                break;
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Show validation errors
export function showValidationErrors(errors) {
    errors.forEach(({ field, message }) => {
        const input = document.querySelector(`[name="${field}"]`);
        if (input) {
            input.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.style.cssText = 'color: var(--danger); font-size: 0.875rem; margin-top: 0.25rem;';
            input.parentElement.appendChild(errorDiv);
        }
    });
}

// Clear validation errors
export function clearValidationErrors(formElement) {
    formElement.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    formElement.querySelectorAll('.error-message').forEach(el => el.remove());
}
