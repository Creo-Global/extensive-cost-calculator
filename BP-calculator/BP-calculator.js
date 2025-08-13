    // Global variables
    let selectedActivities = []; 
    let LicenseCost = 0;
    let VisaCost = 0;
    let firstStepData = null;
    let hasStartedForm = false;
    let isContactFormCompleted = false;
    
    // Pricing visibility management - SIMPLE APPROACH
    let pricingRevealed = false;
    
    // Section interaction tracking
    let sectionInteractions = {
        licenseSection: false,
        durationSection: false,
        shareholdersSection: false,
        businessActivitiesSection: false,
        visaSection: false,
        addonsSection: false
    };

    // User location info
    let userLocationInfo = {
        country: 'ae',
        country_name: 'United Arab Emirates',
        ip: null,
        city: null,
        region: null,
        timezone: null
    };

    // Robust initialization function for Webflow compatibility
    function initializeCalculator() {
        try {
            // Initialize user location detection
            if (typeof detectUserLocation === 'function') {
                detectUserLocation();
            }
            
            // Initialize all functions
            if (typeof initializeMobileAutoScroll === 'function') {
                initializeMobileAutoScroll();
            }
            
            if (typeof initializeStickyButtonsControl === 'function') {
                initializeStickyButtonsControl();
            }
            
            if (typeof initializeBackToTopButton === 'function') {
                initializeBackToTopButton();
            }
            
        } catch (error) {
            console.error('Error during calculator initialization:', error);
        }
    }

    // Multiple initialization strategies for Webflow compatibility
    
    // Strategy 1: Immediate execution if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeCalculator();
        });
    } else {
        initializeCalculator();
    }
    
    // Strategy 2: Window load event
    window.addEventListener('load', function() {
        initializeCalculator();
    });
    
    // Strategy 3: Fallback with timeout
    setTimeout(function() {
        initializeCalculator();
    }, 1000);

    // Success popup functionality
    function showSuccessPopup(firstName) {
        const popup = document.getElementById('success-popup-modal');
        const popupFirstName = document.getElementById('popup-success-first-name');
        const closeBtn = popup.querySelector('.success-popup-close');
        
        if (!popup || !popupFirstName) return;
        
        // Set the first name
        popupFirstName.textContent = firstName;
        
        // Show the popup
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        
        // Trigger animation after brief delay
        setTimeout(() => {
            popup.classList.add('show');
        }, 50);
        
        // Auto-close after 3 seconds
        const autoCloseTimer = setTimeout(() => {
            closeSuccessPopup(firstName);
        }, 3000);
        
        // Manual close functionality
        const closeHandler = () => {
            clearTimeout(autoCloseTimer);
            closeSuccessPopup(firstName);
        };
        
        closeBtn.addEventListener('click', closeHandler);
        
        // Close on overlay click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeHandler();
            }
        });
        
        // Store close handler for cleanup
        popup._closeHandler = closeHandler;
    }
    
    function closeSuccessPopup(firstName) {
        const popup = document.getElementById('success-popup-modal');
        
        if (!popup) return;
        
        // Remove event listeners
        if (popup._closeHandler) {
            popup.querySelector('.success-popup-close').removeEventListener('click', popup._closeHandler);
            popup.removeEventListener('click', popup._closeHandler);
            delete popup._closeHandler;
        }
        
        // Hide popup with animation
        popup.classList.remove('show');
        
        setTimeout(() => {
            popup.style.display = 'none';
            document.body.style.overflow = ''; // Restore scroll
            
            // Now show the in-place success messages
            showInPlaceSuccessMessages(firstName);
        }, 300);
    }
    
    function showInPlaceSuccessMessages(firstName) {
        const getCallBtn = document.querySelector('.get-call-btn');
        const mobileGetCallBtn = document.getElementById('mobile-get-call-btn');
        const successMessage = document.getElementById('theFinalSuccessMessage');
        const mobileSuccessMessage = document.getElementById('mobile-success-message');
        
        // Desktop/sticky summary success message
        if (getCallBtn) getCallBtn.style.display = 'none';
        if (successMessage) {
            document.getElementById('success-first-name').textContent = firstName;
            successMessage.classList.remove('d-none');
            successMessage.style.display = 'block';
            
            // Trigger animation after a brief delay
            setTimeout(() => {
                successMessage.classList.add('show');
            }, 100);
        }
        
        // Mobile footer success message
        if (mobileGetCallBtn) mobileGetCallBtn.style.display = 'none';
        if (mobileSuccessMessage) {
            document.getElementById('mobile-success-first-name').textContent = firstName;
            mobileSuccessMessage.classList.remove('d-none');
            mobileSuccessMessage.style.display = 'block';
            
            // Trigger animation after a brief delay
            setTimeout(() => {
                mobileSuccessMessage.classList.add('show');
            }, 150);
        }
    }

    // Helper function to mark all previous sections as interacted
    function markPreviousSectionsAsInteracted(currentSection) {
        const sectionOrder = [
            'licenseSection',
            'durationSection', 
            'shareholdersSection',
            'businessActivitiesSection',
            'visaSection',
            'addonsSection'
        ];
        
        const currentIndex = sectionOrder.indexOf(currentSection);
        if (currentIndex === -1) return;
        
        // Mark all sections up to and including the current one as interacted
        for (let i = 0; i <= currentIndex; i++) {
            sectionInteractions[sectionOrder[i]] = true;
        }
    }

    // Function to detect user's location and update phone country
    function detectUserLocation() {
        return fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                if (data && !data.error) {
                    userLocationInfo = {
                        country: data.country_code ? data.country_code.toLowerCase() : 'ae',
                        country_name: data.country_name || 'United Arab Emirates',
                        ip: data.ip || null,
                        city: data.city || null,
                        region: data.region || null,
                        timezone: data.timezone || null
                    };
                    return userLocationInfo.country;
                } else {
                    return 'ae';
                }
            })
            .catch(error => {
                return 'ae';
            });
    }

    // CENTRALIZED VALIDATION SYSTEM
    class FormValidator {
        constructor() {
            this.errorPrefix = 'calc-';
            this.phoneInput = null;
            this.validationRules = this.initializeValidationRules();
            this.errorMessages = this.initializeErrorMessages();
            this.countryData = this.initializeCountryData();
            this.init();
        }

        initializeValidationRules() {
            return {
                name: {
                    required: true,
                    minLength: 2,
                    maxLength: 50,
                    pattern: /^[a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF\u0370-\u03FF\u0400-\u04FF\u1E00-\u1EFF\u1F00-\u1FFF\u2100-\u214F\u0100-\u017F\u1EA0-\u1EF9\u00C0-\u024F\u1E00-\u1EFF.-]+$/,
                    forbiddenChars: /[0-9!@#$%^&*()_+=\[\]{};':"\\|,.<>?/~`]/
                },
                email: {
                    required: true,
                    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                    maxLength: 254
                },
                phone: {
                    required: true,
                    minDigits: 6,
                    maxDigits: 15
                }
            };
        }

        initializeErrorMessages() {
            return {
                name: {
                    required: 'Full name is required',
                    minLength: 'Name must be at least 2 characters long',
                    maxLength: 'Name cannot exceed 50 characters',
                    pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes',
                    forbiddenChars: 'Numbers and special characters are not allowed in names'
                },
                email: {
                    required: 'Email address is required',
                    pattern: 'Please enter a valid email address',
                    maxLength: 'Email address is too long'
                },
                phone: {
                    required: 'Phone number is required',
                    invalid: 'Please enter a valid phone number',
                    tooShort: 'Phone number is too short for {country}. Expected {expected} digits, got {actual}.',
                    tooLong: 'Phone number is too long for {country}. Expected {expected} digits, got {actual}.',
                    invalidFormat: 'Invalid phone number format for {country}',
                    invalidChars: 'Phone number can only contain digits, spaces, hyphens, and parentheses'
                }
            };
        }

        initializeCountryData() {
            return {
                'ae': { name: 'United Arab Emirates', digits: 9, placeholder: '50 123 4567' },
                'sa': { name: 'Saudi Arabia', digits: 9, placeholder: '50 123 4567' },
                'kw': { name: 'Kuwait', digits: 8, placeholder: '9999 9999' },
                'bh': { name: 'Bahrain', digits: 8, placeholder: '9999 9999' },
                'om': { name: 'Oman', digits: 8, placeholder: '9999 9999' },
                'qa': { name: 'Qatar', digits: 8, placeholder: '9999 9999' },
                'us': { name: 'United States', digits: 10, placeholder: '(201) 555-0123' },
                'ca': { name: 'Canada', digits: 10, placeholder: '(416) 555-0123' },
                'gb': { name: 'United Kingdom', digits: 11, placeholder: '07400 123456' },
                'au': { name: 'Australia', digits: 9, placeholder: '0400 123 456' },
                'nz': { name: 'New Zealand', digits: 9, placeholder: '021 123 456' },
                'ie': { name: 'Ireland', digits: 9, placeholder: '085 123 4567' },
                'za': { name: 'South Africa', digits: 9, placeholder: '082 123 4567' },
                'de': { name: 'Germany', digits: 11, placeholder: '0151 12345678' },
                'fr': { name: 'France', digits: 10, placeholder: '06 12 34 56 78' },
                'it': { name: 'Italy', digits: 10, placeholder: '320 123 4567' },
                'es': { name: 'Spain', digits: 9, placeholder: '612 34 56 78' },
                'pt': { name: 'Portugal', digits: 9, placeholder: '912 345 678' },
                'nl': { name: 'Netherlands', digits: 9, placeholder: '06 12345678' },
                'be': { name: 'Belgium', digits: 9, placeholder: '0470 12 34 56' },
                'at': { name: 'Austria', digits: 11, placeholder: '0664 1234567' },
                'ch': { name: 'Switzerland', digits: 9, placeholder: '078 123 45 67' },
                'se': { name: 'Sweden', digits: 9, placeholder: '070 123 45 67' },
                'no': { name: 'Norway', digits: 8, placeholder: '406 12 345' },
                'dk': { name: 'Denmark', digits: 8, placeholder: '20 12 34 56' },
                'fi': { name: 'Finland', digits: 9, placeholder: '040 123 4567' },
                'pl': { name: 'Poland', digits: 9, placeholder: '512 345 678' },
                'cz': { name: 'Czech Republic', digits: 9, placeholder: '601 123 456' },
                'hu': { name: 'Hungary', digits: 9, placeholder: '06 20 123 4567' },
                'ro': { name: 'Romania', digits: 9, placeholder: '0712 345 678' },
                'bg': { name: 'Bulgaria', digits: 9, placeholder: '087 123 4567' },
                'hr': { name: 'Croatia', digits: 9, placeholder: '091 234 5678' },
                'si': { name: 'Slovenia', digits: 8, placeholder: '031 234 567' },
                'sk': { name: 'Slovakia', digits: 9, placeholder: '0901 123 456' },
                'lt': { name: 'Lithuania', digits: 8, placeholder: '8612 34567' },
                'lv': { name: 'Latvia', digits: 8, placeholder: '2012 3456' },
                'ee': { name: 'Estonia', digits: 8, placeholder: '5123 4567' },
                'gr': { name: 'Greece', digits: 10, placeholder: '694 123 4567' },
                'cy': { name: 'Cyprus', digits: 8, placeholder: '9612 3456' },
                'mt': { name: 'Malta', digits: 8, placeholder: '9912 3456' },
                'lu': { name: 'Luxembourg', digits: 9, placeholder: '621 123 456' },
                'jp': { name: 'Japan', digits: 11, placeholder: '090 1234 5678' },
                'kr': { name: 'South Korea', digits: 11, placeholder: '010 1234 5678' },
                'cn': { name: 'China', digits: 11, placeholder: '138 0013 8000' },
                'hk': { name: 'Hong Kong', digits: 8, placeholder: '9123 4567' },
                'tw': { name: 'Taiwan', digits: 9, placeholder: '0912 345 678' },
                'sg': { name: 'Singapore', digits: 8, placeholder: '8123 4567' },
                'my': { name: 'Malaysia', digits: 10, placeholder: '012 345 6789' },
                'th': { name: 'Thailand', digits: 9, placeholder: '081 234 5678' },
                'ph': { name: 'Philippines', digits: 10, placeholder: '0917 123 4567' },
                'id': { name: 'Indonesia', digits: 12, placeholder: '0812 3456 7890' },
                'vn': { name: 'Vietnam', digits: 9, placeholder: '091 234 56 78' },
                'in': { name: 'India', digits: 10, placeholder: '91234 56789' },
                'pk': { name: 'Pakistan', digits: 10, placeholder: '0301 2345678' },
                'bd': { name: 'Bangladesh', digits: 10, placeholder: '01712 345678' },
                'lk': { name: 'Sri Lanka', digits: 9, placeholder: '071 234 5678' },
                'tr': { name: 'Turkey', digits: 10, placeholder: '0532 123 45 67' },
                'il': { name: 'Israel', digits: 9, placeholder: '050 123 4567' },
                'eg': { name: 'Egypt', digits: 10, placeholder: '0100 123 4567' },
                'ng': { name: 'Nigeria', digits: 10, placeholder: '0803 123 4567' },
                'mx': { name: 'Mexico', digits: 10, placeholder: '55 1234 5678' },
                'br': { name: 'Brazil', digits: 11, placeholder: '11 91234 5678' },
                'ar': { name: 'Argentina', digits: 10, placeholder: '11 1234 5678' },
                'ru': { name: 'Russia', digits: 10, placeholder: '8 912 345 6789' }
            };
        }

        init() {
            this.setupGlobalErrorHandling();
            this.initializePhoneInput();
            this.setupFormValidation();
            this.setupWebflowConflictPrevention();
        }

        setupGlobalErrorHandling() {
            document.addEventListener('DOMContentLoaded', () => {
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        return false;
                    });
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && (e.target.type === 'text' || e.target.type === 'email' || e.target.type === 'tel')) {
                        e.preventDefault();
                        const submitBtn = document.getElementById('submitBtn');
                        if (submitBtn && this.isContactFormVisible()) {
                            submitBtn.click();
                        }
                    }
                });

                // Override any existing validation functions that might be called
                this.overrideOldValidationCalls();
            });
        }

        overrideOldValidationCalls() {
            // Create global functions that redirect to the new validation system
            window.validateContactForm = () => this.validateContactForm();
            window.validatePhoneField = () => this.validateField('phone');
            window.validateNameField = () => this.validateField('full-name');
            window.validateEmailField = () => this.validateField('email');
            
            // Handle successful contact form submission globally
            window.handleContactFormSubmit = () => this.handleSuccessfulSubmission();
        }

        isContactFormVisible() {
            const contactSection = document.getElementById('personal-details-section');
            return contactSection && contactSection.offsetParent !== null;
        }

        initializePhoneInput() {
            const phoneField = document.getElementById('phone');
            if (!phoneField || this.phoneInput) return;

            try {
                this.phoneInput = window.intlTelInput(phoneField, {
                    preferredCountries: ["ae", "sa", "kw", "bh", "om", "qa"],
                    initialCountry: "auto",
                    geoIpLookup: function(success, failure) {
                        detectUserLocation()
                            .then(countryCode => success(countryCode))
                            .catch(() => success('ae'));
                    },
                    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js",
                    separateDialCode: true,
                    formatOnDisplay: true,
                    autoPlaceholder: "polite",
                    formatAsYouType: true,
                    strictMode: true
                });

                this.setupPhoneEventListeners(phoneField);
                this.setInitialPlaceholder();
            } catch (error) {
                this.setupBasicPhoneValidation(phoneField);
            }
        }

        setupPhoneEventListeners(phoneField) {
            phoneField.addEventListener('keydown', (e) => {
                this.handlePhoneKeydown(e);
            });

            phoneField.addEventListener('input', (e) => {
                this.clearFieldError('phone');
                this.restrictPhoneInput(e.target);
            });

            phoneField.addEventListener('blur', () => {
                this.validateField('phone');
            });

            if (this.phoneInput) {
                phoneField.addEventListener("countrychange", () => {
                    this.clearFieldError('phone');
                    this.updatePhonePlaceholder();
                });
            }
        }

        handlePhoneKeydown(e) {
            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight'];
            const isNumber = /[0-9]/.test(e.key);
            const isAllowedSpecial = /[\s\-\(\)\+]/.test(e.key);
            const isModifierKey = e.ctrlKey || e.metaKey || e.altKey;

            if (!allowedKeys.includes(e.key) && !isNumber && !isAllowedSpecial && !isModifierKey) {
                e.preventDefault();
            }
        }

        restrictPhoneInput(input) {
            const cleaned = input.value.replace(/[^\d\s\-\(\)\+]/g, '');
            if (cleaned !== input.value) {
                input.value = cleaned;
            }

            const countryData = this.getCurrentCountryData();
            const digitsOnly = cleaned.replace(/\D/g, '');
            if (digitsOnly.length > countryData.digits + 2) {
                const truncated = cleaned.substring(0, cleaned.length - 1);
                input.value = truncated;
            }
        }

        getCurrentCountryData() {
            if (this.phoneInput) {
                const selectedCountry = this.phoneInput.getSelectedCountryData();
                return this.countryData[selectedCountry.iso2] || { name: 'Unknown', digits: 10, placeholder: 'Phone number' };
            }
            return this.countryData['ae'];
        }

        setInitialPlaceholder() {
            const phoneField = document.getElementById('phone');
            const countryData = this.getCurrentCountryData();
            if (phoneField) {
                phoneField.placeholder = countryData.placeholder;
            }
        }

        updatePhonePlaceholder() {
            const phoneField = document.getElementById('phone');
            const countryData = this.getCurrentCountryData();
            if (phoneField) {
                phoneField.placeholder = countryData.placeholder;
            }
        }

        setupBasicPhoneValidation(phoneField) {
            phoneField.addEventListener('input', (e) => {
                this.clearFieldError('phone');
                this.restrictPhoneInput(e.target);
            });

            phoneField.addEventListener('blur', () => {
                this.validateField('phone');
            });
        }

        setupFormValidation() {
            const nameField = document.getElementById('full-name');
            if (nameField) {
                nameField.addEventListener('keydown', (e) => {
                    this.handleNameKeydown(e);
                });

                nameField.addEventListener('input', () => {
                    this.clearFieldError('full-name');
                });

                nameField.addEventListener('blur', () => {
                    this.validateField('full-name');
                });
            }

            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.addEventListener('input', () => {
                    this.clearFieldError('email');
                });

                emailField.addEventListener('blur', () => {
                    this.validateField('email');
                });
            }

            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    this.handleFormSubmit(e);
                });
            }
        }

        handleNameKeydown(e) {
            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight'];
            const isLetter = /[a-zA-Z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF\u0370-\u03FF\u0400-\u04FF\u1E00-\u1EFF\u1F00-\u1FFF\u2100-\u214F\u0100-\u017F\u1EA0-\u1EF9\u00C0-\u024F\u1E00-\u1EFF]/.test(e.key);
            const isAllowedSpecial = /[\s\-\.']/.test(e.key);
            const isModifierKey = e.ctrlKey || e.metaKey || e.altKey;

            if (!allowedKeys.includes(e.key) && !isLetter && !isAllowedSpecial && !isModifierKey) {
                e.preventDefault();
            }
        }

        setupWebflowConflictPrevention() {
            setTimeout(() => {
                const errorElements = document.querySelectorAll(`.${this.errorPrefix}error-message`);
                errorElements.forEach(el => {
                    el.style.cssText = `
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        position: relative !important;
                        z-index: 9 !important;
                        pointer-events: none !important;
                        color: #EB5F40 !important;
                        font-size: 14px !important;
                        margin-top: 5px !important;
                        font-family: "Plus Jakarta Sans", sans-serif !important;
                        line-height: 1.3 !important;
                    `;
                });
            }, 100);
        }

        validateField(fieldId) {
            const field = document.getElementById(fieldId);
            if (!field) return true;

            const fieldType = this.getFieldType(fieldId);
            const value = field.value.trim();
            const rules = this.validationRules[fieldType];

            this.clearFieldError(fieldId);

            if (rules.required && !value) {
                this.showFieldError(fieldId, fieldType, 'required');
                return false;
            }

            if (!value && !rules.required) return true;

            switch (fieldType) {
                case 'name':
                    return this.validateName(field, value);
                case 'email':
                    return this.validateEmail(field, value);
                case 'phone':
                    return this.validatePhone(field, value);
                default:
                    return true;
            }
        }

        getFieldType(fieldId) {
            if (fieldId === 'full-name') return 'name';
            if (fieldId === 'email') return 'email';
            if (fieldId === 'phone') return 'phone';
            return 'text';
        }

        validateName(field, value) {
            const rules = this.validationRules.name;

            if (value.length < rules.minLength) {
                this.showFieldError(field.id, 'name', 'minLength');
                return false;
            }

            if (value.length > rules.maxLength) {
                this.showFieldError(field.id, 'name', 'maxLength');
                return false;
            }

            if (rules.forbiddenChars.test(value)) {
                this.showFieldError(field.id, 'name', 'forbiddenChars');
                return false;
            }

            if (!rules.pattern.test(value)) {
                this.showFieldError(field.id, 'name', 'pattern');
                return false;
            }

            return true;
        }

        validateEmail(field, value) {
            const rules = this.validationRules.email;

            if (value.length > rules.maxLength) {
                this.showFieldError(field.id, 'email', 'maxLength');
                return false;
            }

            if (!rules.pattern.test(value)) {
                this.showFieldError(field.id, 'email', 'pattern');
                return false;
            }

            return true;
        }

        validatePhone(field, value) {
            if (!value) {
                this.showFieldError(field.id, 'phone', 'required');
                return false;
            }

            const digitsOnly = value.replace(/\D/g, '');
            const countryData = this.getCurrentCountryData();

            if (this.phoneInput && typeof this.phoneInput.isValidNumber === 'function') {
                try {
                    const isValid = this.phoneInput.isValidNumber();
                    const isPossible = this.phoneInput.isPossibleNumber ? this.phoneInput.isPossibleNumber() : true;

                    if (!isValid) {
                        if (digitsOnly.length < countryData.digits) {
                            this.showPhoneError(field.id, 'tooShort', countryData, digitsOnly.length);
                        } else if (digitsOnly.length > countryData.digits) {
                            this.showPhoneError(field.id, 'tooLong', countryData, digitsOnly.length);
                        } else if (!isPossible) {
                            this.showPhoneError(field.id, 'invalidFormat', countryData);
                        } else {
                            this.showPhoneError(field.id, 'invalid', countryData);
                        }
                        return false;
                    }
                    return true;
                } catch (error) {
                    // Fall back to basic validation
                }
            }

            if (digitsOnly.length < this.validationRules.phone.minDigits) {
                this.showFieldError(field.id, 'phone', 'invalid');
                return false;
            }

            if (digitsOnly.length > this.validationRules.phone.maxDigits) {
                this.showFieldError(field.id, 'phone', 'invalid');
                return false;
            }

            if (digitsOnly.length !== countryData.digits) {
                if (digitsOnly.length < countryData.digits) {
                    this.showPhoneError(field.id, 'tooShort', countryData, digitsOnly.length);
                } else {
                    this.showPhoneError(field.id, 'tooLong', countryData, digitsOnly.length);
                }
                return false;
            }

            return true;
        }

        showPhoneError(fieldId, errorType, countryData, actualLength = null) {
            const message = this.errorMessages.phone[errorType]
                .replace('{country}', countryData.name)
                .replace('{expected}', countryData.digits)
                .replace('{actual}', actualLength);
            
            this.displayError(fieldId, message);
        }

        showFieldError(fieldId, fieldType, errorType) {
            const message = this.errorMessages[fieldType][errorType];
            this.displayError(fieldId, message);
        }

        displayError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const errorId = `${this.errorPrefix}${fieldId}-error`;
            const errorElement = document.getElementById(errorId);

            if (field) {
                field.classList.add(`${this.errorPrefix}error`);
            }

            if (errorElement) {
                errorElement.textContent = message;
                errorElement.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    position: relative !important;
                    z-index: 99 !important;
                    pointer-events: none !important;
                    color: #EB5F40 !important;
                    font-size: 14px !important;
                    margin-top: 5px !important;
                    font-family: "Plus Jakarta Sans", sans-serif !important;
                    line-height: 1.3 !important;
                `;

                setTimeout(() => {
                    errorElement.style.cssText = `
                        display: block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        position: relative !important;
                        z-index: 99 !important;
                        pointer-events: none !important;
                        color: #EB5F40 !important;
                        font-size: 14px !important;
                        margin-top: 5px !important;
                        font-family: "Plus Jakarta Sans", sans-serif !important;
                        line-height: 1.3 !important;
                    `;
                }, 50);
            }
        }

        clearFieldError(fieldId) {
            const field = document.getElementById(fieldId);
            const errorId = `${this.errorPrefix}${fieldId}-error`;
            const errorElement = document.getElementById(errorId);

            if (field) {
                field.classList.remove(`${this.errorPrefix}error`);
            }

            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        }

        clearAllErrors() {
            const errorElements = document.querySelectorAll(`.${this.errorPrefix}error-message`);
            errorElements.forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });

            const errorFields = document.querySelectorAll(`.${this.errorPrefix}error`);
            errorFields.forEach(field => {
                field.classList.remove(`${this.errorPrefix}error`);
            });
        }

        validateContactForm() {
            this.clearAllErrors();
            
            const fields = ['full-name', 'email', 'phone'];
            let isValid = true;

            fields.forEach(fieldId => {
                if (!this.validateField(fieldId)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        handleFormSubmit(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const submitBtn = e.target;
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Validating...';

            // First, trigger validation for any prefilled fields
            triggerFormValidationAfterProgrammaticFill();

            setTimeout(() => {
                const isValid = this.validateContactForm();
                
                if (isValid) {
                    submitBtn.innerHTML = '✓ Valid';
                    submitBtn.classList.add('validated');
                    
                    // Ensure sections are revealed if they haven't been already
                    if (!isContactFormCompleted) {
                        isContactFormCompleted = true;
                        updateSectionLockState();
                        
                        // Mark license section as interacted for pricing display
                        setTimeout(() => {
                            sectionInteractions.licenseSection = true;
                            calculateCosts();
                        }, 1000);
                    }
                    
                    if (typeof window.handleContactFormSubmit === 'function') {
                        window.handleContactFormSubmit();
                    } else {
                        this.handleSuccessfulSubmission();
                    }
                } else {
                    submitBtn.innerHTML = 'Please fix errors';
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }, 2000);
                }
            }, 200);
        }

        handleSuccessfulSubmission() {
            // Scroll to the next section (company setup)
            const nextSection = document.getElementById('company-setup-section');
            if (nextSection) {
                const headerOffset = 60; // Account for any fixed headers
                const elementPosition = nextSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }

            // Also trigger the custom event for other parts of the application
            const nextStepEvent = new CustomEvent('contactFormValid', {
                detail: {
                    name: document.getElementById('full-name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value
                }
            });
            document.dispatchEvent(nextStepEvent);
        }

        getFormData() {
            return {
                name: document.getElementById('full-name')?.value?.trim() || '',
                email: document.getElementById('email')?.value?.trim() || '',
                phone: document.getElementById('phone')?.value?.trim() || ''
            };
        }

        resetForm() {
            this.clearAllErrors();
            const fields = ['full-name', 'email', 'phone'];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                }
            });
        }

        validateSpecificField(fieldId) {
            return this.validateField(fieldId);
        }
    }

    // Initialize the validator
    let formValidator;
    document.addEventListener('DOMContentLoaded', () => {
        formValidator = new FormValidator();
        window.formValidator = formValidator;
    });

    // Addon viewport detection function
    window.checkAddonViewport = function() {
        // Only check if pricing is revealed and addon section hasn't been interacted with yet
        if (!pricingRevealed || sectionInteractions.addonsSection) {
            return;
        }
        
        const addonsSection = document.getElementById('addons-section');
        if (!addonsSection) {
            return;
        }
        
        const rect = addonsSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isVisible = rect.top < windowHeight && rect.bottom > 0;
        
        if (isVisible) {
            markPreviousSectionsAsInteracted('addonsSection');
            calculateCosts();
        }
    };
    
    // Add missing functions to prevent JavaScript errors
    function updateProgressBar(step) {
        // This function may not be needed anymore but prevents errors
    }
    
    function initializePricingVisibility() {
        // This function may not be needed anymore but prevents errors
    }
    
    // Set up scroll event listener for addon viewport detection
    let scrollTimer;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
            window.checkAddonViewport();
        }, 100);
    });

    // Old viewport function removed - using simple detection now

    document.addEventListener('DOMContentLoaded', function() {
        try {
            hasStartedForm = false;
            
            document.querySelectorAll('.activity-count').forEach(count => {
                count.style.display = 'none';
            });
            
            const feeWarning = document.querySelector('.fee-warning');
            if (feeWarning) {
                feeWarning.style.display = 'none';
            }
            
            // Ensure default services are checked and pills are properly synced
            const defaultServices = ['bank-account', 'company-stamp', 'corporate-tax', 'vat-registration'];
            defaultServices.forEach(serviceId => {
                const input = document.getElementById(serviceId);
                const pill = document.querySelector(`.service-pill[data-service="${serviceId}"]`);
                
                if (input && pill) {
                    input.checked = true;
                    pill.classList.add('selected');
                    
                    // Ensure check icon is present for selected pills
                    const existingIcon = pill.querySelector('.check-icon');
                    if (!existingIcon) {
                        const checkIcon = document.createElement('span');
                        checkIcon.className = 'check-icon';
                        checkIcon.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M9.2806 0.666016C4.68893 0.666016 0.947266 4.40768 0.947266 8.99935C0.947266 13.591 4.68893 17.3327 9.2806 17.3327C13.8723 17.3327 17.6139 13.591 17.6139 8.99935C17.6139 4.40768 13.8723 0.666016 9.2806 0.666016ZM13.2639 7.08268L8.53893 11.8077C8.42227 11.9243 8.26393 11.991 8.09727 11.991C7.9306 11.991 7.77227 11.9243 7.6556 11.8077L5.29727 9.44935C5.0556 9.20768 5.0556 8.80768 5.29727 8.56602C5.53893 8.32435 5.93893 8.32435 6.1806 8.56602L8.09727 10.4827L12.3806 6.19935C12.6223 5.95768 13.0223 5.95768 13.2639 6.19935C13.5056 6.44102 13.5056 6.83268 13.2639 7.08268Z" fill="white"/>
                            </svg>
                        `;
                        pill.insertBefore(checkIcon, pill.firstChild);
                    }
                }
            });
            
            selectedActivities = [];
            
            setupLiveCalculations();
            
            initializeActivityGroups();
            
            initializeAddonModals();
            
            initializeLicenseModals();
            
            initializeVisaModals();
            
            initializeSummaryToggle();
            
            // Initialize with appropriate summary view
            autoToggleSummaryView();
            
            // Initialize change status event listeners
            initializeChangeStatusEventListeners();
            
            // Initialize section locking
            initializeSectionLocking();
            
            // Initialize Get a Call buttons
            initializeGetCallButtons();
            
            // Initialize pricing visibility
            initializePricingVisibility();
            
            // Initialize shareholder selector
            initializeShareholderSelector();
            
            // Initialize edit button functionality
            initializeEditButtons();
            
            // Initialize back to top button
            initializeBackToTopButton();
            
            calculateCosts();
            
        } catch (err) {
            console.error("Error during DOMContentLoaded initialization:", err);
        }
    });

    function setupLiveCalculations() {
        document.addEventListener('input', function(e) {
            if (e.target.matches('input, select')) {
                hasStartedForm = true;
                calculateCosts();
            }
        });

        document.addEventListener('change', function(e) {
            if (e.target.matches('input, select')) {
                hasStartedForm = true;
                calculateCosts();
            }
        });

        document.addEventListener('click', function(e) {
            if (e.target.matches('input[type="checkbox"], input[type="radio"]')) {
                setTimeout(() => calculateCosts(), 10); // Small delay to ensure state is updated
            }
        });

        // Setup license card selection
        setupLicenseCardSelection();
        
        // Setup pill option selections
        setupPillOptions();
        
        // Setup service pill selections
        setupServicePills();
    }

    // Setup license card selection functionality
    function setupLicenseCardSelection() {
        const licenseCards = document.querySelectorAll('.license-card');
        const licenseSelectBtns = document.querySelectorAll('.select-btn[data-license]');
        
        licenseCards.forEach(card => {
            card.addEventListener('click', function() {
                const licenseType = this.getAttribute('data-license');
                markPreviousSectionsAsInteracted('licenseSection');
                selectLicenseType(licenseType);
                });
            });
            
        licenseSelectBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click
                const licenseType = this.getAttribute('data-license');
                markPreviousSectionsAsInteracted('licenseSection');
                selectLicenseType(licenseType);
                    });
                });
    }
    
    function selectLicenseType(licenseType) {
        // Update all cards and buttons using unified approach
        document.querySelectorAll('.license-card').forEach(card => {
            const isSelected = card.getAttribute('data-license') === licenseType;
            card.classList.toggle('selected', isSelected);
        });
        
        document.querySelectorAll('.select-btn[data-license]').forEach(btn => {
            const isSelected = btn.getAttribute('data-license') === licenseType;
            updateButtonState(btn, isSelected);
        });
        
        // Update hidden input
        document.getElementById('license-type').value = licenseType;
        
        // Trigger calculation
        calculateCosts();
    }
    
    // Setup pill option selections
    function setupPillOptions() {
        // Duration options
        const durationOptions = document.querySelectorAll('#duration-options .pill-option');
        durationOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class and reset text to just numbers
                durationOptions.forEach(opt => {
                    opt.classList.remove('selected');
                    const optValue = opt.getAttribute('data-value');
                    opt.textContent = optValue;
                });
                
                // Add selected class and show "Year/Years" text
                this.classList.add('selected');
                const value = this.getAttribute('data-value');
                this.textContent = `${value} ${value === '1' ? 'Year' : 'Years'}`;
                
                document.getElementById('license-duration').value = value;
                
                // Mark duration section and all previous sections as interacted
                markPreviousSectionsAsInteracted('durationSection');
                calculateCosts();
                });
            });
            
        // Shareholders quantity selector is handled by separate functions
            }
    
    // Setup service pill selections
    function setupServicePills() {
        const servicePills = document.querySelectorAll('.service-pill');
        
        servicePills.forEach(pill => {
            pill.addEventListener('click', function() {
                const serviceId = this.getAttribute('data-service');
                const hiddenInput = document.getElementById(serviceId);
                
                if (!hiddenInput) return;
                
                // Toggle selected state
                if (this.classList.contains('selected')) {
                    this.classList.remove('selected');
                    hiddenInput.checked = false;
                    
                    // Remove check icon if it exists
                    const checkIcon = this.querySelector('.check-icon');
                    if (checkIcon) {
                        checkIcon.remove();
            }
                        } else {
                    this.classList.add('selected');
                    hiddenInput.checked = true;
                    
                    // Add check icon using unified approach
                    const existingIcon = this.querySelector('.check-icon');
                    if (!existingIcon) {
                        const checkIcon = document.createElement('span');
                        checkIcon.className = 'check-icon';
                        checkIcon.innerHTML = createSelectedButton().match(/<svg.*?<\/svg>/)[0];
                        this.insertBefore(checkIcon, this.firstChild);
                    }
                }
                
                // Clear any existing error messages when services are selected
                const existingErrors = document.querySelectorAll('.tax-compliance-warning, .calc-error-message');
                existingErrors.forEach(error => {
                    if (error.style.display !== 'none') {
                        error.style.display = 'none';
                    }
                });
                
                // Special handling for tax compliance pills
                if (this.classList.contains('tax-compliance-pill')) {
                    checkTaxCompliance();
                }
                
                // Mark addons section and all previous sections as interacted when any service pill is clicked
                markPreviousSectionsAsInteracted('addonsSection');
                
                // Trigger calculation
                calculateCosts();
                    });
                });
            }

    // Initialize Supabase client
    const supabaseUrl = 'https://bwommjnbmumvgtlyfddn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3b21tam5ibXVtdmd0bHlmZGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDM0NTAsImV4cCI6MjA2NTAxOTQ1MH0.1OxopB9p-yoGoYpY7AUyHs-T7Fe0cK2dUjFq_FbCL-I';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    window.selectedActivities = window.selectedActivities || [];

    // Initialize activity groups functionality
    function initializeActivityGroups() {
        const groups = [
            { name: "F&B, Rentals", group: "F&B,Rentals", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e641d24b90c96dfafdc34_d431eb034e1a686ed0a5ae255ad6cf5a9bbd5f8bdf1b61ed4f6d01c555ea3d78.png" },
            { name: "Financial", group: "financial", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e642316bbf305f8e487a3_38de45a3cb52fb4ab3afc9e833ae57e84444434efed8001b01a697990d7b35ea.png" },
            { name: "Education", group: "education", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e64260ad8af5c3d69f211_879ec5f9869afa804e916bb99888aad8ce26efbb286a02f5879c1941257397bb.png" },
            { name: "Transportation", group: "transportation", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e64208f117b22b75ec5ef_55c616434ce274d0e445905bfb2f80866fe3201a85ff5beeb6e469373fce2ede.png" },
            { name: "Maintenance", group: "maintenance", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e644dcfa0b9f15e914df6_89592b5bd60a9091d367ba0c123ab57389d3276ede8f8e9fc06f4540d5349b9a.png" },
            { name: "Realestate", group: "realestate", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e645f24b90c96dfb01ada_9d419d848a5d582d7fcbdd95afb68d2afea53b1583d707f615383ab652f39f29.png" },
            { name: "Administrative", group: "administrative", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e6800108c99cf14ab7d92_289b192ec79ecb38926fdb5e00570aef3306f5026282f58165024e31f1507bc7.png" },
            { name: "Agriculture", group: "agriculture", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e6441d775866c5a428411_2259ef99aba05e1260ed45d53205346e30587661bb6e0ea857a59b12ee92bc61.png" },
            { name: "Art", group: "art", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e645710be6e1a2c9c8859_3433ab633670e596ff531f10e43b4b4c4a2117b0ba5e17363b3618a5aad911eb.png" },
            { name: "ICT", group: "ict", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e6478b5d69a994162ea64_356a5ddca879de1a0a9d8b7efb588da5474b15bb46e3833303ce91097ef8b0db.png" },
            { name: "Health Care", group: "healthcare", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e644a7afd519c334e2dc5_ba72fb6b951ceb1bbe752d9c90d3bb4f797c9a8b711a8548d55b7774712d7e3d.png" },
            { name: "Services", group: "services", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e647b1f864562f8be0dce_427dca92cbdac3f7d860b97c442e62841bc613a6a1be5a7bd1e99c9af25cec12.png" },
            { name: "Professional", group: "professional", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e643e7cb5992fa0758299_841ae68fac18927fd0b0a8d3669eef41098c973cad8471d53bc4a244aaadd9a5.png" },
            { name: "Sewerage", group: "sewerage", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e649e493fb8933a8bc29b_85b78022048b39d8b16d509165289201a5ef0973c39681cb3384025e0af0f297.png" },
            { name: "Trading", group: "trading", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e649436c79ebb53083e4d_37610fecfe4fe44b5b17208f4ba91c4ea481fe3a1520f6d8de0c93b7422184ec.png" },
            { name: "Waste Collection", group: "waste", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e64994001239338faf90d_cd9b5d6d70e62b356547c76722455a54e960d708ee8c8769d2f5fb4f2323ece5.png" },
            { name: "Manufacturing", group: "manufacturing", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686e64a1516df3f972e8aff3_ec0fdf4e82cdbee6f54835bee98f804b24793be92e247687884fa73958b73e9f.png" },
        ];

        const container = document.querySelector('.activity-cards-container');
        container.innerHTML = ''; // Clear existing content

        groups.forEach(groupInfo => {
            const card = document.createElement('div');
            card.className = 'activity-card';
            card.dataset.group = groupInfo.group;
            
            card.innerHTML = `
                <div class="activity-card-header">
                    <span class="selected-activities-count" style="display: none;">Selected Activities: 0</span>
                    <div class="activity-checkbox">
                        <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="11" viewBox="0 0 14 11" fill="none">
                            <path d="M1 5.5L5 9.5L13 1.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
                <div class="activity-card-body">
                    <img src="${groupInfo.icon}" alt="${groupInfo.name} Icon" class="activity-icon">
                    <h3>${groupInfo.name}</h3>
                    <a href="#" class="select-activity-link">Select your activity <span class="link-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none">
  <path d="M8.97135 1.3842L8.97135 6.95266C8.97135 7.12702 8.90209 7.29423 8.77881 7.41751C8.6555 7.54082 8.48829 7.61008 8.31396 7.61005C8.13961 7.61005 7.97237 7.54082 7.84909 7.41754C7.72581 7.29426 7.65658 7.12702 7.65658 6.95266L7.65732 2.96966L1.97284 8.65414C1.84977 8.77721 1.68286 8.84636 1.50882 8.84636C1.33477 8.84636 1.16783 8.7772 1.04477 8.65414C0.921702 8.53108 0.852573 8.36417 0.852573 8.19012C0.852573 8.01607 0.921696 7.84913 1.04477 7.72606L6.72924 2.04159L2.74584 2.04045C2.57152 2.04042 2.40428 1.97119 2.281 1.8479C2.15772 1.72462 2.08848 1.55738 2.08846 1.38306C2.08846 1.20871 2.15772 1.0415 2.281 0.918217C2.40431 0.794907 2.57152 0.725644 2.74584 0.725672L8.3143 0.725666C8.40077 0.725573 8.48637 0.742556 8.56622 0.775628C8.64606 0.808698 8.71861 0.857237 8.77967 0.918428C8.84071 0.979589 8.88906 1.05226 8.92198 1.13219C8.95483 1.21213 8.97163 1.29779 8.97135 1.3842Z" fill="url(#paint0_linear_4640_6386)"/>
  <defs>
    <linearGradient id="paint0_linear_4640_6386" x1="-2.20508" y1="5.4043" x2="8.75062" y2="-1.23878" gradientUnits="userSpaceOnUse">
      <stop stop-color="#EB5F40"/>
      <stop offset="1" stop-color="#B5348B"/>
    </linearGradient>
  </defs></svg></span></a></div>
            `;
            
            container.appendChild(card);

            card.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Just open modal - don't select the group yet
                // Group will be selected only when activities are actually chosen
                openActivityModal(groupInfo);
            });
        });

        const closeModalBtn = document.getElementById('close-modal-btn');
        const modalOverlay = document.getElementById('activity-search-modal');
        closeModalBtn.addEventListener('click', closeActivityModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeActivityModal();
            }
        });

        // Setup scroll indicator
        setupScrollIndicator();
    }

    function toggleActivityGroup(card, forceSelect = false) {
        if (forceSelect) {
            card.classList.add('selected');
        } else {
            card.classList.toggle('selected');
        }
        
        const isSelected = card.classList.contains('selected');
        const countElement = card.querySelector('.selected-activities-count');
        const linkElement = card.querySelector('.select-activity-link');

        if (isSelected) {
            countElement.style.display = 'block';
            linkElement.innerHTML = 'Select more activities <span class="link-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M8.97135 1.3842L8.97135 6.95266C8.97135 7.12702 8.90209 7.29423 8.77881 7.41751C8.6555 7.54082 8.48829 7.61008 8.31396 7.61005C8.13961 7.61005 7.97237 7.54082 7.84909 7.41754C7.72581 7.29426 7.65658 7.12702 7.65658 6.95266L7.65732 2.96966L1.97284 8.65414C1.84977 8.77721 1.68286 8.84636 1.50882 8.84636C1.33477 8.84636 1.16783 8.7772 1.04477 8.65414C0.921702 8.53108 0.852573 8.36417 0.852573 8.19012C0.852573 8.01607 0.921696 7.84913 1.04477 7.72606L6.72924 2.04159L2.74584 2.04045C2.57152 2.04042 2.40428 1.97119 2.281 1.8479C2.15772 1.72462 2.08848 1.55738 2.08846 1.38306C2.08846 1.20871 2.15772 1.0415 2.281 0.918217C2.40431 0.794907 2.57152 0.725644 2.74584 0.725672L8.3143 0.725666C8.40077 0.725573 8.48637 0.742556 8.56622 0.775628C8.64606 0.808698 8.71861 0.857237 8.77967 0.918428C8.84071 0.979589 8.88906 1.05226 8.92198 1.13219C8.95483 1.21213 8.97163 1.29779 8.97135 1.3842Z" fill="url(#paint0_linear_4640_6386)"/><defs><linearGradient id="paint0_linear_4640_6386" x1="-2.20508" y1="5.4043" x2="8.75062" y2="-1.23878" gradientUnits="userSpaceOnUse"><stop stop-color="#EB5F40"/><stop offset="1" stop-color="#B5348B"/></linearGradient></defs></svg></span>';
        } else {
            countElement.style.display = 'none';
            // Also deselect all activities within this group
            const group = card.dataset.group;
            window.selectedActivities = window.selectedActivities.filter(act => act.groupName !== group);
            updateActivityCountOnCard(group);
        }
        
        updateSelectedGroupsCount();
        calculateCosts();
    }

    function setupScrollIndicator() {
        const container = document.querySelector('.activity-cards-container');
        const leftIndicator = document.getElementById('scroll-indicator-left');
        const rightIndicator = document.getElementById('scroll-indicator-right');
        
        if (!container || !leftIndicator || !rightIndicator) return;

        function updateScrollIndicators() {
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            
            // Hide both indicators if content doesn't overflow horizontally
            if (scrollWidth <= clientWidth + 5) {
                leftIndicator.classList.add('hidden');
                rightIndicator.classList.add('hidden');
                return;
            }
            
            // Show/hide left indicator based on scroll position
            if (scrollLeft <= 10) {
                leftIndicator.classList.add('hidden');
            } else {
                leftIndicator.classList.remove('hidden');
            }
            
            // Show/hide right indicator based on scroll position
            if (scrollLeft >= scrollWidth - clientWidth - 10) {
                rightIndicator.classList.add('hidden');
            } else {
                rightIndicator.classList.remove('hidden');
            }
        }

        // Update indicators on scroll
        container.addEventListener('scroll', updateScrollIndicators);
        
        // Update indicators on resize
        window.addEventListener('resize', updateScrollIndicators);
        
        // Initial update
        setTimeout(updateScrollIndicators, 100);

        // Click handler for left scroll indicator
        leftIndicator.addEventListener('click', () => {
            const cardWidth = 216; // 200px card + 16px gap
            const scrollAmount = cardWidth * 2; // Scroll by 2 columns (1 column per row)
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        // Click handler for right scroll indicator
        rightIndicator.addEventListener('click', () => {
            const cardWidth = 216; // 200px card + 16px gap
            const scrollAmount = cardWidth * 2; // Scroll by 2 columns (1 column per row)
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }
    function openActivityModal(groupInfo) {
        const modal = document.getElementById('activity-search-modal');
        const modalTitle = document.getElementById('modal-title');
        
        // Store current scroll position before opening modal
        window.scrollPositionBeforeModal = window.pageYOffset || document.documentElement.scrollTop;
        
        // Store current group info for reference
        window.currentModalGroup = groupInfo;
        
        // Initialize category select dropdown
        initializeModalCategorySelect();
        
        // Update all category select counts
        updateAllModalCategoryCounts();
        
        // Set the title statically instead of dynamically
        modalTitle.textContent = 'Explore The Full Business Activity List';
        
        if (groupInfo) {
            // Set the initial selected category
            setModalSelectedCategory(groupInfo.group);
            // Fetch activities for the selected group
            fetchActivitiesForModal(groupInfo.group);
        } else {
            setModalSelectedCategory(null);
        }
        
        // Setup modal event listeners
        setupModalEventListeners();
        
        // Show the modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add sheet-view-active class for mobile styling
        if (window.innerWidth <= 1200) {
            document.body.classList.add('sheet-view-active');
            const overlay = document.getElementById('bottom-sheet-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        }
    }

    function closeActivityModal() {
        const modal = document.getElementById('activity-search-modal');
        
        // Check if the current group has any selected activities
        if (window.currentModalGroup) {
            const groupName = window.currentModalGroup.group;
            const groupCard = document.querySelector(`.activity-card[data-group="${groupName}"]`);
            
            // Count activities selected for this group
            const activitiesInGroup = window.selectedActivities ? 
                window.selectedActivities.filter(activity => {
                    const activityGroupName = activity.groupName || mapCategoryToGroup(activity.Category, activity.Group);
                    return activityGroupName === groupName;
                }).length : 0;
            
            if (groupCard) {
                if (activitiesInGroup > 0) {
                    // Ensure group is selected and show count
                    groupCard.classList.add('selected');
                    const countElement = groupCard.querySelector('.selected-activities-count');
                    const linkElement = groupCard.querySelector('.select-activity-link');
                    if (countElement) {
                        countElement.style.display = 'block';
                        countElement.textContent = `Selected Activities: ${activitiesInGroup}`;
                    }
                    if (linkElement) {
                        linkElement.innerHTML = 'Select more activities <span class="link-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M8.97135 1.3842L8.97135 6.95266C8.97135 7.12702 8.90209 7.29423 8.77881 7.41751C8.6555 7.54082 8.48829 7.61008 8.31396 7.61005C8.13961 7.61005 7.97237 7.54082 7.84909 7.41754C7.72581 7.29426 7.65658 7.12702 7.65658 6.95266L7.65732 2.96966L1.97284 8.65414C1.84977 8.77721 1.68286 8.84636 1.50882 8.84636C1.33477 8.84636 1.16783 8.7772 1.04477 8.65414C0.921702 8.53108 0.852573 8.36417 0.852573 8.19012C0.852573 8.01607 0.921696 7.84913 1.04477 7.72606L6.72924 2.04159L2.74584 2.04045C2.57152 2.04042 2.40428 1.97119 2.281 1.8479C2.15772 1.72462 2.08848 1.55738 2.08846 1.38306C2.08846 1.20871 2.15772 1.0415 2.281 0.918217C2.40431 0.794907 2.57152 0.725644 2.74584 0.725672L8.3143 0.725666C8.40077 0.725573 8.48637 0.742556 8.56622 0.775628C8.64606 0.808698 8.71861 0.857237 8.77967 0.918428C8.84071 0.979589 8.88906 1.05226 8.92198 1.13219C8.95483 1.21213 8.97163 1.29779 8.97135 1.3842Z" fill="url(#paint0_linear_4640_6386)"/><defs><linearGradient id="paint0_linear_4640_6386" x1="-2.20508" y1="5.4043" x2="8.75062" y2="-1.23878" gradientUnits="userSpaceOnUse"><stop stop-color="#EB5F40"/><stop offset="1" stop-color="#B5348B"/></linearGradient></defs></svg></span>';
                    }
                } else {
                    // No activities selected, ensure group is deselected
                    groupCard.classList.remove('selected');
                    const countElement = groupCard.querySelector('.selected-activities-count');
                    const linkElement = groupCard.querySelector('.select-activity-link');
                    if (countElement) {
                        countElement.style.display = 'none';
                    }
                    if (linkElement) {
                        linkElement.innerHTML = 'Select activities <span class="link-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M8.97135 1.3842L8.97135 6.95266C8.97135 7.12702 8.90209 7.29423 8.77881 7.41751C8.6555 7.54082 8.48829 7.61008 8.31396 7.61005C8.13961 7.61005 7.97237 7.54082 7.84909 7.41754C7.72581 7.29426 7.65658 7.12702 7.65658 6.95266L7.65732 2.96966L1.97284 8.65414C1.84977 8.77721 1.68286 8.84636 1.50882 8.84636C1.33477 8.84636 1.16783 8.7772 1.04477 8.65414C0.921702 8.53108 0.852573 8.36417 0.852573 8.19012C0.852573 8.01607 0.921696 7.84913 1.04477 7.72606L6.72924 2.04159L2.74584 2.04045C2.57152 2.04042 2.40428 1.97119 2.281 1.8479C2.15772 1.72462 2.08848 1.55738 2.08846 1.38306C2.08846 1.20871 2.15772 1.0415 2.281 0.918217C2.40431 0.794907 2.57152 0.725644 2.74584 0.725672L8.3143 0.725666C8.40077 0.725573 8.48637 0.742556 8.56622 0.775628C8.64606 0.808698 8.71861 0.857237 8.77967 0.918428C8.84071 0.979589 8.88906 1.05226 8.92198 1.13219C8.95483 1.21213 8.97163 1.29779 8.97135 1.3842Z" fill="url(#paint0_linear_4640_6386)"/><defs><linearGradient id="paint0_linear_4640_6386" x1="-2.20508" y1="5.4043" x2="8.75062" y2="-1.23878" gradientUnits="userSpaceOnUse"><stop stop-color="#EB5F40"/><stop offset="1" stop-color="#B5348B"/></linearGradient></defs></svg></span>';
                    }
                }
            }
            
            // Update counts and costs
            updateSelectedGroupsCount();
            calculateCosts();
        }
        
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Clear search input
        const searchInput = document.getElementById('modal-search-input');
        if (searchInput) searchInput.value = '';
        
        // Remove sheet-view-active class
        document.body.classList.remove('sheet-view-active');
        const overlay = document.getElementById('bottom-sheet-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Restore scroll position after a brief delay to ensure body is properly unlocked
        if (typeof window.scrollPositionBeforeModal !== 'undefined') {
            setTimeout(() => {
                window.scrollTo(0, window.scrollPositionBeforeModal);
            }, 10);
        }
        
        // Clear the current modal group reference
        window.currentModalGroup = null;
    }

    function initializeModalCategorySelect() {
        const selectElement = document.getElementById('modal-category-select');
        const categories = [
            { name: 'Administrative', group: 'administrative' },
            { name: 'Agriculture', group: 'agriculture' },
            { name: 'Art', group: 'art' },
            { name: 'Education', group: 'education' },
            { name: 'ICT', group: 'ict' },
            { name: 'F&B, Rentals', group: 'F&B,Rentals' },
            { name: 'Financial', group: 'financial' },
            { name: 'Health Care', group: 'healthcare' },
            { name: 'Maintenance', group: 'maintenance' },
            { name: 'Services', group: 'services' },
            { name: 'Professional', group: 'professional' },
            { name: 'Real Estate', group: 'realestate' },
            { name: 'Sewerage', group: 'sewerage' },
            { name: 'Trading', group: 'trading' },
            { name: 'Transportation', group: 'transportation' },
            { name: 'Waste Collection', group: 'waste' },
            { name: 'Manufacturing', group: 'manufacturing' }
        ];

        let optionsHtml = '';
        categories.forEach(category => {
            const selectedCount = getSelectedActivitiesCountForGroup(category.group);
            const countText = selectedCount > 0 ? ` (${selectedCount} selected)` : '';
            optionsHtml += `<option value="${category.group}">${category.name}${countText}</option>`;
        });
        selectElement.innerHTML = optionsHtml;

        // Add change handler for select dropdown
        selectElement.addEventListener('change', function() {
            setModalSelectedCategory(this.value);
            fetchActivitiesForModal(this.value);
        });
    }

    function setModalSelectedCategory(groupName) {
        // Update selected category in dropdown
        const selectElement = document.getElementById('modal-category-select');
        if (selectElement && groupName) {
            selectElement.value = groupName;
        }
        
        // Store current group for reference
        if (window.currentModalGroup) {
            window.currentModalGroup.group = groupName;
        }
    }

    function setupModalEventListeners() {
        // Close modal handlers
        const closeBtn = document.getElementById('close-modal-btn');
        const modal = document.getElementById('activity-search-modal');
        const backBtn = document.getElementById('modal-back-btn');
        const continueBtn = document.getElementById('modal-continue-btn');
        const searchInput = document.getElementById('modal-search-input');
        
        // Remove any existing listeners
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        
        const newContinueBtn = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
        
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // Add fresh listeners
        document.getElementById('close-modal-btn').addEventListener('click', closeActivityModal);
        document.getElementById('modal-back-btn').addEventListener('click', closeActivityModal);
        document.getElementById('modal-continue-btn').addEventListener('click', closeActivityModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeActivityModal();
            }
        });

        // Search input handler
        let searchDebounce;
        document.getElementById('modal-search-input').addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            clearTimeout(searchDebounce);
            
            if (searchTerm === '') {
                // If search is cleared, show activities for currently selected category
                const selectedPill = document.querySelector('.modal-category-pill.selected');
                if (selectedPill) {
                    fetchActivitiesForModal(selectedPill.dataset.group);
                }
                return;
            }
            
            searchDebounce = setTimeout(() => {
                searchActivitiesInModal(searchTerm);
            }, 300);
        });
    }

    async function searchActivitiesInModal(searchTerm) {
        const modalList = document.getElementById('modal-activities-list');
        modalList.innerHTML = '<div class="loading-results">Searching...</div>';
        
        try {
            const { data, error } = await supabase
                .from('Activity List')
                .select('*')
                .or(`"Activity Name".ilike.%${searchTerm}%,Code.ilike.%${searchTerm}%`)
                .limit(50);

            if (error) throw error;

            if (data && data.length > 0) {
                displaySearchResultsInModal(data);
        } else {
                modalList.innerHTML = '<div class="no-results">No activities found matching your search.</div>';
            }
        } catch (error) {
            console.error('Search error:', error);
            modalList.innerHTML = '<div class="error-results">Error searching activities.</div>';
        }
    }

    function displaySearchResultsInModal(activities) {
        const modalList = document.getElementById('modal-activities-list');
        const selectedActivityCodes = window.selectedActivities.map(a => a.Code);

        let html = '';
        activities.forEach(activity => {
            const isSelected = selectedActivityCodes.includes(activity.Code);
            html += `
                <div class="modal-activity-item" data-code="${activity.Code}" data-name="${activity["Activity Name"]}" data-category="${activity.Category}" data-group="${activity.Group}">
                <div class="modal-activity-info">
                    <div class="modal-activity-code">${activity.Code}</div>
                    <div class="modal-activity-name">${activity["Activity Name"]}</div>
                </div>
                    <div class="modal-activity-checkbox ${isSelected ? 'checked' : ''}">
                        <span class="check-icon">✓</span>
                    </div>
                </div>`;
        });
        modalList.innerHTML = html;

        // Add click handlers for search result items
        modalList.querySelectorAll('.modal-activity-item').forEach(item => {
            item.addEventListener('click', function() {
                const checkbox = this.querySelector('.modal-activity-checkbox');
                const isCurrentlySelected = checkbox.classList.contains('checked');
                
                const activityData = { 
                    Code: this.dataset.code, 
                    "Activity Name": this.dataset.name, 
                    Category: this.dataset.category, 
                    Group: this.dataset.group 
                };
                
                const groupName = this.dataset.group;
                
                if (isCurrentlySelected) {
                    checkbox.classList.remove('checked');
                    removeActivity(activityData.Code);
            } else {
                    checkbox.classList.add('checked');
                    addActivityToSelected(activityData, groupName);
                    
                    // Ensure the group card is selected
                    const groupCard = document.querySelector(`.activity-card[data-group="${groupName}"]`);
                    if (groupCard && !groupCard.classList.contains('selected')) {
                        toggleActivityGroup(groupCard, true);
                    }
                }
                
                updateActivityCountOnCard(groupName);
                updateAllModalCategoryCounts();
                updateSelectedGroupsCount();
                calculateCosts();
        
                    });
                });
            }

    async function fetchActivitiesForModal(groupName) {
        const modalList = document.getElementById('modal-activities-list');
        modalList.innerHTML = '<div class="loading-results">Loading activities...</div>';
        
        try {
            const categoryName = mapGroupToCategory(groupName);
            const { data, error } = await supabase
                .from('Activity List')
                .select('Code, "Activity Name", Category, Group')
                .eq('Category', categoryName)
                .order('Code')
                .limit(200);

            if (error) throw error;
            
            displayActivitiesInModal(data, groupName);

        } catch (err) {
            console.error('Error fetching activities for modal:', err);
            modalList.innerHTML = '<div class="error-results">Error fetching activities.</div>';
        }
    }

    function displayActivitiesInModal(activities, groupName) {
        const modalList = document.getElementById('modal-activities-list');
        if (!activities || activities.length === 0) {
            modalList.innerHTML = '<div class="no-activities">No activities found for this category.</div>';
            return;
        }

        const selectedActivityCodes = window.selectedActivities
            .filter(a => a.groupName === groupName)
            .map(a => a.Code);

        let html = '';
        activities.forEach(activity => {
            const isSelected = selectedActivityCodes.includes(activity.Code);
            html += `
                <div class="modal-activity-item" data-code="${activity.Code}" data-name="${activity["Activity Name"]}" data-category="${activity.Category}" data-group="${activity.Group}">
                <div class="modal-activity-info">
                    <div class="modal-activity-code">${activity.Code}</div>
                    <div class="modal-activity-name">${activity["Activity Name"]}</div>
                </div>
                    <div class="modal-activity-checkbox ${isSelected ? 'checked' : ''}">
                        <span class="check-icon">✓</span>
                    </div>
                </div>`;
        });
        modalList.innerHTML = html;

        // Add click handlers for activity items
        modalList.querySelectorAll('.modal-activity-item').forEach(item => {
            item.addEventListener('click', function() {
                const checkbox = this.querySelector('.modal-activity-checkbox');
                const isCurrentlySelected = checkbox.classList.contains('checked');
                
                const activityData = { 
                    Code: this.dataset.code, 
                    "Activity Name": this.dataset.name, 
                    Category: this.dataset.category, 
                    Group: this.dataset.group 
                };
                
                if (isCurrentlySelected) {
                    checkbox.classList.remove('checked');
                    removeActivity(activityData.Code);
                 } else {
                    checkbox.classList.add('checked');
                    addActivityToSelected(activityData, groupName);
                }
                
                updateActivityCountOnCard(groupName);
                updateAllModalCategoryCounts();
                updateSelectedGroupsCount();
                calculateCosts();

            });
        });
    }
    
    function addActivityToSelected(activity, groupName) {
        if (!window.selectedActivities.some(item => item.Code === activity.Code)) {
            window.selectedActivities.push({ ...activity, groupName, Group: activity.Group });
            // Mark business activities section and all previous sections as interacted
            markPreviousSectionsAsInteracted('businessActivitiesSection');
        }
    }

    function removeActivity(code) {
        const activityToRemove = window.selectedActivities.find(a => a.Code === code);
        window.selectedActivities = window.selectedActivities.filter(a => a.Code !== code);
        
        // If activity was removed, update the card count and reorder
        if (activityToRemove) {
            updateActivityCountOnCard(activityToRemove.groupName);
        }
    }
    
    function getSelectedActivitiesCountForGroup(groupName) {
        if (!window.selectedActivities) return 0;
        // Filter by both Group and groupName to handle different data sources
        return window.selectedActivities.filter(activity => 
            activity.Group === groupName || activity.groupName === groupName
        ).length;
    }

    function updateActivityCountOnCard(groupName) {
        const card = document.querySelector(`.activity-card[data-group="${groupName}"]`);
        if (card) {
            const count = window.selectedActivities.filter(a => a.groupName === groupName).length;
            const countElement = card.querySelector('.selected-activities-count');
            countElement.textContent = `Selected Activities: ${count}`;
        }
        
        // Also update the modal category select count if modal is open
        updateModalCategorySelectCount(groupName);
        
        // Reorder the cards to show selected ones first
        reorderActivityCards();
    }

    function reorderActivityCards() {
        const container = document.querySelector('.activity-cards-container');
        if (!container) return;
        
        const cards = Array.from(container.querySelectorAll('.activity-card'));
        
        // Sort cards: selected cards with activities first (by activity count desc), then selected cards without activities, then unselected cards
        cards.sort((a, b) => {
            const aGroupName = a.dataset.group;
            const bGroupName = b.dataset.group;
            
            const aCount = window.selectedActivities.filter(activity => activity.groupName === aGroupName).length;
            const bCount = window.selectedActivities.filter(activity => activity.groupName === bGroupName).length;
            
            const aSelected = a.classList.contains('selected');
            const bSelected = b.classList.contains('selected');
            
            // First: Cards with selected activities (sorted by count descending)
            if (aCount > 0 && bCount > 0) {
                return bCount - aCount;
            }
            if (aCount > 0 && bCount === 0) return -1;
            if (aCount === 0 && bCount > 0) return 1;
            
            // Second: Selected cards without activities
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            
            // Third: Maintain original order for unselected cards
            return 0;
        });
        
        // Reattach cards in the new order
        cards.forEach(card => container.appendChild(card));
    }

    function updateModalCategorySelectCount(groupName) {
        const selectElement = document.getElementById('modal-category-select');
        if (selectElement) {
            // Update the specific option text
            const option = selectElement.querySelector(`option[value="${groupName}"]`);
            if (option) {
                const count = getSelectedActivitiesCountForGroup(groupName);
                const baseText = option.textContent.split(' (')[0]; // Get name without count
                const countText = count > 0 ? ` (${count} selected)` : '';
                option.textContent = baseText + countText;
            }
        }
    }

    function updateAllModalCategoryCounts() {
        const selectElement = document.getElementById('modal-category-select');
        if (selectElement) {
            const options = selectElement.querySelectorAll('option');
            options.forEach(option => {
                const groupName = option.value;
                const count = getSelectedActivitiesCountForGroup(groupName);
                const baseText = option.textContent.split(' (')[0]; // Get name without count
                const countText = count > 0 ? ` (${count} selected)` : '';
                option.textContent = baseText + countText;
                
        
            });
        }
    }

    // Initialize addon modal functionality
    function initializeAddonModals() {
        // Add click handlers to all learn-more buttons
        document.querySelectorAll('.learn-more-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const addonCard = this.closest('.addon-category-card');
                if (addonCard) {
                    const categoryName = addonCard.querySelector('h3').textContent;
                    const categoryDescription = addonCard.querySelector('.addon-category-description').textContent;
                    openAddonModal(categoryName, categoryDescription);
                }
            });
        });
    }

    function openAddonModal(categoryName, categoryDescription) {
    const modal = document.getElementById('addons-modal');
    const modalTitle = document.getElementById('addons-modal-title');
    const modalSubtitle = document.getElementById('addons-modal-subtitle');
    const modalHeader = document.querySelector('#addons-modal .activity-modal-header');
    
    // Category images
    const categoryImages = {
        'mCore': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686bc0009c49b9f6e1a1b8b5_349223d89f5e3538a23ec152a8746c6bc72d4e815a90ba5ed0d16e70cb902552.webp',
        'mResidency': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686f6afd5ddb5f1622f99baf_775fd8f4871640146c1e5f5c6af9c273275f1e4d307c502d91bb9baf561163fc.webp',
        'mAssist': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686f6aeaeb91eccdec925bcc_f03ef01cb46009b032f13938d1ce70d5c48295bb78648a5be0cff97a231d87de.webp',
        'mAccounting': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686f6ae3a479cb1ee9225627_b6c212f84a314ee75c93701d8cc4a1745ef6957b2ea1458e7e33513166368c0d.webp'
    };
    
    // Remove any existing category image
    const existingImage = modalHeader.querySelector('.addon-category-image-container');
    if (existingImage) {
        existingImage.remove();
    }
    
    // Add category image to the modal header content
    const modalHeaderContent = modalHeader.querySelector('.modal-header-content');
    if (categoryImages[categoryName] && modalHeaderContent) {
        const imageHtml = `
            <div class="addon-category-image-container">
                <img src="${categoryImages[categoryName]}" alt="${categoryName}" class="addon-category-image" />
            </div>`;
        modalHeaderContent.insertAdjacentHTML('afterbegin', imageHtml);
    }
    
    // Update title and subtitle text
    if (modalTitle && modalSubtitle) {
        modalTitle.textContent = categoryName;
        modalSubtitle.textContent = categoryDescription;
    }
        
        // Load services for this category
        loadServicesForCategory(categoryName);
        
        // Check tax compliance to update modal warning
        checkTaxCompliance();
        
        // Store current scroll position before opening modal
        window.scrollPositionBeforeModal = window.pageYOffset || document.documentElement.scrollTop;
        
        // Setup modal event listeners
        setupAddonModalEventListeners();
        
        // Show the modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add sheet-view-active class for mobile styling
        if (window.innerWidth <= 1200) {
            document.body.classList.add('sheet-view-active');
            const overlay = document.getElementById('bottom-sheet-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        }
    }

    function closeAddonModal() {
        const modal = document.getElementById('addons-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Remove sheet-view-active class
        document.body.classList.remove('sheet-view-active');
        const overlay = document.getElementById('bottom-sheet-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Restore scroll position after a brief delay to ensure body is properly unlocked
        if (typeof window.scrollPositionBeforeModal !== 'undefined') {
            setTimeout(() => {
                window.scrollTo(0, window.scrollPositionBeforeModal);
            }, 10);
        }
    }

    function setupAddonModalEventListeners() {
        const closeBtn = document.getElementById('addons-close-modal-btn');
        const modal = document.getElementById('addons-modal');
        const backBtn = document.getElementById('addons-modal-back-btn');
        const continueBtn = document.getElementById('addons-modal-continue-btn');
        
        // Remove existing listeners
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        
        const newContinueBtn = continueBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
        
        // Add fresh listeners
        document.getElementById('addons-close-modal-btn').addEventListener('click', closeAddonModal);
        document.getElementById('addons-modal-back-btn').addEventListener('click', closeAddonModal);
        document.getElementById('addons-modal-continue-btn').addEventListener('click', closeAddonModal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAddonModal();
            }
        });
    }

    function loadServicesForCategory(categoryName) {
    const servicesList = document.getElementById('addons-modal-services-list');
    const services = getServicesForCategory(categoryName);
    
    // Find existing services container or create one
    let servicesContainer = servicesList.querySelector('.addon-services-list');
    if (!servicesContainer) {
        servicesContainer = document.createElement('div');
        servicesContainer.className = 'addon-services-list';
        servicesList.appendChild(servicesContainer);
    }
    
    let html = '';
    
    // Add services list without individual images
    services.forEach(service => {
        const isSelected = isServiceSelected(service.id);
        html += `
            <div class="addon-service-item" data-service="${service.id}">
                <div class="addon-service-content">
                    <div class="addon-service-header">
                        <div class="addon-service-name">${service.name}</div>
                        <div class="addon-service-toggle-container">
                            <span class="addon-service-toggle-label ${isSelected ? 'selected' : ''}">
                                ${isSelected ? 'Selected' : ''}
                            </span>
                            <div class="addon-service-toggle ${isSelected ? 'checked' : ''}" data-service="${service.id}">
                                <div class="addon-service-toggle-slider"></div>
                            </div>
                        </div>
                    </div>
                    <div class="addon-service-description">${service.description}</div>
                </div>
            </div>`;
    });
    
    // Update the services container
    servicesContainer.innerHTML = html;
        
            // Add click handlers for toggle switches
    const toggles = servicesList.querySelectorAll('.addon-service-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const serviceId = this.dataset.service;
            const isCurrentlySelected = this.classList.contains('checked');
            const item = this.closest('.addon-service-item');
            const label = item.querySelector('.addon-service-toggle-label');
            
            if (isCurrentlySelected) {
                this.classList.remove('checked');
                label.classList.remove('selected');
                label.textContent = '';
                deselectService(serviceId);
            } else {
                this.classList.add('checked');
                label.classList.add('selected');
                label.textContent = 'Selected';
                selectService(serviceId);
            }
            
            // Clear any existing error messages when services are selected
            const existingErrors = document.querySelectorAll('.tax-compliance-warning, .calc-error-message');
            existingErrors.forEach(error => {
                if (error.style.display !== 'none') {
                    error.style.display = 'none';
                }
            });
            
            // Update costs and UI
            calculateCosts();
        });
    });
    }

    function getServicesForCategory(categoryName) {
        const servicesData = {
            'mCore': [
                {
                    id: 'bank-account',
                    name: 'Bank Account',
                    price: 1500,
                    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Open your UAE'
                },
                {
                    id: 'business-card',
                    name: 'Business Card',
                    price: 240,
                    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Get a professionally designed business card with logo, contact details, and ready-to-print digital formats included.'
                },
                {
                    id: 'company-stamp',
                    name: 'Company Stamp',
                    price: 200,
                    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Receive an official company stamp, required to authenticate contracts, invoices, and formal business correspondence in Dubai.'
                },
                {
                    id: 'ecommerce-starter',
                    name: 'E-commerce Starter',
                    price: 1000,
                    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Set up your seller profile on trusted e-commerce platforms and start selling with ease.'
                }
            ],
            'mResidency': [
                {
                    id: 'medical-emirates-id',
                    name: 'Medical & Emirates ID',
                    price: 2250,
                    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Get step-by-step help from a manager for medical test and Emirates ID processing.'
                },
                {
                    id: 'medical-insurance',
                    name: 'Medical Insurance',
                    price: 1080,
                    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Access UAE-compliant health coverage options tailored for you, your team, or dependents.'
                },
            ],
            'mAssist': [
                {
                    id: 'melite',
                    name: 'mElite',
                    price: 6000,
                    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Premium service with a dedicated manager for guided submissions via Meydan Free Zone portal.'
                },
                {
                    id: 'meeting-rooms',
                    name: 'Meeting Rooms',
                    price: 150,
                    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Book private rooms at Meydan Free Zone for business meetings, calls, and presentations.'
                },
                {
                    id: 'po-box',
                    name: 'PO Box',
                    price: 1700,
                    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Get a personal PO Box and keys for secure mail collection at Meydan Free Zone.'
                },
                {
                    id: 'document-translation',
                    name: 'Document Translation',
                    price: 250,
                    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Assigned PO Box and handling support to collect, store, or forward your official mail.'
                },
                {
                    id: 'mail-management',
                    name: 'Mail Management',
                    price: 750,
                    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Complete mail handling and forwarding service for your business correspondence.'
                },
                {
                    id: 'virtual-assistant',
                    name: 'Virtual Assistant',
                    price: 12000,
                    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Dedicated virtual assistant for administrative tasks and business support.'
                }
            ],
            'mAccounting': [
                {
                    id: 'corporate-tax',
                    name: 'Corporate Tax',
                    price: 1200,
                    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Corporate tax compliance and filing services to meet UAE regulatory requirements.'
                },
                {
                    id: 'vat-registration',
                    name: 'VAT Registration',
                    price: 1500,
                    image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Register with the FTA and get your VAT certificate aligned with UAE compliance laws.'
                },
                {
                    id: 'bookkeeping',
                    name: 'Book Keeping',
                    price: 1000,
                    image: 'https://images.unsplash.com/photo-1554224154-26032fced8bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Track and maintain your finances with expert bookkeeping that records and organises all transactions'
                },
                {
                    id: 'liquidation-report',
                    name: 'Liquidation Report',
                    price: 1000,
                    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Access reports and support for financial closure, regulatory filings, and full business liquidation requirements.'
                },
                {
                    id: 'financial-audit-report',
                    name: 'Financial Audit Report',
                    price: 250,
                    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Get a certified audit report to meet regulatory standards and ensure financial transparency.'
                },
                {
                    id: 'valuation-report',
                    name: 'Valuation Report',
                    price: 10000,
                    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Receive a professional valuation with insights into your business’s market worth and investment potential.'
                }
            ]
        };
        
        return servicesData[categoryName] || [];
    }

    function isServiceSelected(serviceId) {
        const checkbox = document.getElementById(serviceId);
        return checkbox && checkbox.checked;
    }

    function selectService(serviceId) {
        const checkbox = document.getElementById(serviceId);
        const servicePill = document.querySelector(`[data-service="${serviceId}"]`);
        
        if (checkbox) checkbox.checked = true;
        if (servicePill && !servicePill.classList.contains('selected')) {
            servicePill.classList.add('selected');
            // Add check icon if it doesn't exist
            if (!servicePill.querySelector('.check-icon')) {
                const checkIcon = document.createElement('span');
                checkIcon.className = 'check-icon';
                checkIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9.2806 0.666016C4.68893 0.666016 0.947266 4.40768 0.947266 8.99935C0.947266 13.591 4.68893 17.3327 9.2806 17.3327C13.8723 17.3327 17.6139 13.591 17.6139 8.99935C17.6139 4.40768 13.8723 0.666016 9.2806 0.666016ZM13.2639 7.08268L8.53893 11.8077C8.42227 11.9243 8.26393 11.991 8.09727 11.991C7.9306 11.991 7.77227 11.9243 7.6556 11.8077L5.29727 9.44935C5.0556 9.20768 5.0556 8.80768 5.29727 8.56602C5.53893 8.32435 5.93893 8.32435 6.1806 8.56602L8.09727 10.4827L12.3806 6.19935C12.6223 5.95768 13.0223 5.95768 13.2639 6.19935C13.5056 6.44102 13.5056 6.83268 13.2639 7.08268Z" fill="white"/>
                </svg>`;
                servicePill.insertBefore(checkIcon, servicePill.firstChild);
            }
        }
        
        // Don't automatically mark addons section as interacted
        // This should only happen through user clicks or viewport detection
    }

    function deselectService(serviceId) {
        const checkbox = document.getElementById(serviceId);
        const servicePill = document.querySelector(`[data-service="${serviceId}"]`);
        
        if (checkbox) checkbox.checked = false;
        if (servicePill && servicePill.classList.contains('selected')) {
            servicePill.classList.remove('selected');
            const checkIcon = servicePill.querySelector('.check-icon');
            if (checkIcon) checkIcon.remove();
        }
    }

    function mapGroupToCategory(groupName) {
        const groupToCategoryMap = { 
            'administrative': 'Administrative', 
            'agriculture': 'Agriculture', 
            'art': 'Art', 
            'education': 'Education', 
            'ict': 'ICT', 
            'F&B, Rentals': 'F&B,Rentals', 
            'financial': 'Financial', 
            'healthcare': 'HealthCare', 
            'maintenance': 'Maintenance', 
            'services': 'Services', 
            'professional': 'Professional', 
            'realestate': 'Realestate', 
            'sewerage': 'Sewerage', 
            'trading': 'Trading', 
            'transportation': 'Transportation', 
            'waste': 'Waste Collection', 
            'manufacturing': 'Manufacturing' 
        };
        return groupToCategoryMap[groupName] || groupName;
    }

    // License Modal Functions
    function initializeLicenseModals() {
        const learnMoreBtns = document.querySelectorAll('.license-card .learn-more-btn');
        
        learnMoreBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card selection
                const licenseCard = this.closest('.license-card');
                const licenseType = licenseCard.dataset.license;
                openLicenseModal(licenseType);
            });
        });
    }

    // Visa Modal Functions
    function initializeVisaModals() {
        const visaLearnMoreBtns = document.querySelectorAll('.visa-card .learn-more-btn');
        
        visaLearnMoreBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card selection
                const visaCard = this.closest('.visa-card');
                const visaType = visaCard.dataset.visa;
                openVisaModal(visaType);
            });
        });
    }

    function openVisaModal(visaType) {
        // Reuse the license modal for visas
        const modal = document.getElementById('license-modal');
        const modalTitle = document.getElementById('license-modal-title');
        const modalDescription = document.getElementById('license-modal-description');
        const modalAdditional = document.getElementById('license-modal-additional');
        const modalActionBtn = document.getElementById('license-modal-action-btn');
        const modalHeader = document.querySelector('#license-modal .activity-modal-header');
        
        // Visa data
        const visaData = {
            'investor': {
                title: 'Investor Visa',
                description: 'An Investor Visa in Dubai is a type of long-term residence visa designed for foreign nationals who wish to invest in or establish a business in Dubai. It allows you to live, work, and sponsor your family in Dubai, with renewals available as long as your investment remains valid. Only one investor visa is issued per business setup, even if multiple shareholders are involved.<br><br>Unlike a standard employment visa, this is a self-sponsored visa, directly tied to your ownership or role in the company. It’s ideal for founders, co-founders, and partners who want full control over their immigration status.',
                additional: 'At Meydan Free Zone, we streamline the process to be fast, compliant, and stress-free, allowing you to secure your visa and focus on growing your business.',
                actionText: 'Select Investor Visa',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686bbfae4fc11d7f87391fb4_349223d89f5e3538a23ec152a8746c6bc72d4e815a90ba5ed0d16e70cb902552.png'
            },
            'employee': {
                title: 'Employee Visa',
                description: 'An Employee Visa, also known as an Employment Visa or Work Visa, is a government-issued permit that allows foreign nationals to live and work legally in Dubai.<br><br>The employer is responsible for managing the full application process, including document preparation, government approvals, medical testing, Emirates ID registration, and timely renewals.',
                additional: 'At Meydan Free Zone, we simplify the entire process for you. Our dedicated support team ensures your Employee Visas are processed quickly, compliantly, and without delays, so your team can get to work without any administrative hassle.',
                actionText: 'Select Employee Visa',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686bc0004d1341d4ccb5b150_2193782fa28109786e70758b4f8700cf49d9201e377abc3571b6302582c10d9b.webp'
            },
            'dependent': {
                title: 'Dependent Visa',
                description: 'A Dependent Visa in Dubai allows UAE residents to sponsor their immediate family members, including spouses, children, and parents, to legally live in the UAE. It’s a residency visa linked to the sponsor’s visa status and remains valid as long as the sponsor’s visa is active and compliant.<br> <br>This visa is ideal for those who want their loved ones to join them in the UAE, ensuring legal residency, access to essential services, and peace of mind for families relocating together.',
                additional: 'At Meydan Free Zone, we simplify the Dependent Visa process to ensure fast, accurate submissions and full compliance, so you can bring your family over without delays or stress.',
                actionText: 'Select Dependent Visa',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686bc001b0a226a76d71d00d_de8b99eed6930d3f9455605a063e0514bbbcb91427bf01dca897e5aa4b11d820.webp'
            },
            'change-status': {
                title: 'Change of Status',
                description: 'If you\'re already in the UAE, whether on a tourist visa, family visa, or a previous employment visa, you\'ll need to apply for a Change of Status to switch to a residence visa under your new business.<br><br><strong>This applies to:</strong><br><br><span class="numbered-item">1.</span> <strong>You</strong> as a founder or shareholder moving to an Investor or Shareholder visa<br><br><span class="numbered-item">2.</span> <strong>Employees</strong> you\'re hiring who are switching jobs and changing sponsorship<br><br><span class="numbered-item">3.</span> <strong>Family members</strong> you\'re sponsoring (after obtaining your own visa) who are already in the UAE',
                additional: 'Meydan Free Zone manages the full Change of Status process for you, so you don\'t need to exit the country or restart your visa journey. It\'s a fast, compliant way to update your visa status, whether you\'re launching or growing your team from inside the UAE.<br><br>Just let us know who\'s already here, and we\'ll handle the rest.',
                actionText: 'Got It',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68763d4feb6dc26436a8d668_831cebae91bcfa5c27afa8ba08a0e68f314db7dbbb164f9bacbfcc9f88edc4bc.webp'
            }
        };
        
        const visa = visaData[visaType];
        if (!visa) return;
        
        // Remove any existing category image
        const existingImage = modalHeader.querySelector('.addon-category-image-container');
        if (existingImage) {
            existingImage.remove();
        }
        
        // Add visa image to the modal header content
        const modalHeaderContent = modalHeader.querySelector('.modal-header-content');
        if (modalHeaderContent) {
            const imageHtml = `
                <div class="addon-category-image-container">
                    <img src="${visa.image}" alt="${visa.title}" class="addon-category-image" />
                </div>`;
            modalHeaderContent.insertAdjacentHTML('afterbegin', imageHtml);
        }
        
        modalTitle.textContent = visa.title;
        modalDescription.innerHTML = visa.description;
        modalAdditional.innerHTML = visa.additional;
        modalActionBtn.innerHTML = `
            ${visa.actionText}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        
        // Remove any existing click handlers
        const newActionBtn = modalActionBtn.cloneNode(true);
        modalActionBtn.parentNode.replaceChild(newActionBtn, modalActionBtn);
        
        // Get fresh reference to the button
        const freshActionBtn = document.getElementById('license-modal-action-btn');
        
        // Update action button click handler with direct DOM manipulation
        if (visaType === 'investor') {
            freshActionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Select the visa
                document.getElementById('investor-visa-toggle').checked = true;
                toggleVisaCard('investor');
                
                // Force close the modal
                document.getElementById('license-modal').style.display = 'none';
                document.body.style.overflow = 'auto';
                document.body.classList.remove('sheet-view-active');
                
                // Hide overlay
                const overlay = document.getElementById('bottom-sheet-overlay');
                if (overlay) overlay.classList.remove('active');
                
                return false;
            });
        } else if (visaType === 'employee') {
            freshActionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Select the visa
                selectVisaCard('employee');
                
                // Force close the modal
                document.getElementById('license-modal').style.display = 'none';
                document.body.style.overflow = 'auto';
                document.body.classList.remove('sheet-view-active');
                
                // Hide overlay
                const overlay = document.getElementById('bottom-sheet-overlay');
                if (overlay) overlay.classList.remove('active');
                
                // Restore scroll position
                if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                    setTimeout(() => {
                        window.scrollTo(0, window.scrollPositionBeforeModal);
                    }, 10);
                }
                
                return false;
            });
        } else if (visaType === 'dependent') {
            freshActionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Select the visa
                selectVisaCard('dependent');
                
                // Force close the modal
                document.getElementById('license-modal').style.display = 'none';
                document.body.style.overflow = 'auto';
                document.body.classList.remove('sheet-view-active');
                
                // Hide overlay
                const overlay = document.getElementById('bottom-sheet-overlay');
                if (overlay) overlay.classList.remove('active');
                
                // Restore scroll position
                if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                    setTimeout(() => {
                        window.scrollTo(0, window.scrollPositionBeforeModal);
                    }, 10);
                }
                
                return false;
            });
        } else if (visaType === 'change-status') {
            freshActionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Just close the modal - no action needed since this is informational
                document.getElementById('license-modal').style.display = 'none';
                document.body.style.overflow = 'auto';
                document.body.classList.remove('sheet-view-active');
                
                // Hide overlay
                const overlay = document.getElementById('bottom-sheet-overlay');
                if (overlay) overlay.classList.remove('active');
                
                // Restore scroll position
                if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                    setTimeout(() => {
                        window.scrollTo(0, window.scrollPositionBeforeModal);
                    }, 10);
                }
                
                return false;
            });
        }
        
        // Store current scroll position before opening modal
        window.scrollPositionBeforeModal = window.pageYOffset || document.documentElement.scrollTop;
        
        // Setup modal event listeners
        setupLicenseModalEventListeners();
        
        // Show the modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add sheet-view-active class for mobile styling
        if (window.innerWidth <= 1200) {
            document.body.classList.add('sheet-view-active');
            const overlay = document.getElementById('bottom-sheet-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        }
    }

    function openLicenseModal(licenseType) {
        const modal = document.getElementById('license-modal');
        const modalTitle = document.getElementById('license-modal-title');
        const modalDescription = document.getElementById('license-modal-description');
        const modalAdditional = document.getElementById('license-modal-additional');
        const modalActionBtn = document.getElementById('license-modal-action-btn');
        const modalHeader = document.querySelector('#license-modal .activity-modal-header');
        
        // License data
        const licenseData = {
            'fawri': {
                title: 'What Is Fawri License? 🚀',
                description: 'Fawri is your express route to a 60-minute, compliance-led LLC license. This 100% digital, fast-track license is designed exclusively for ambitious solo entrepreneurs and freelancers who want speed, control, and minimal setup friction.',
                additional: 'With over 1,800 activities, Fawri gets you licensed, visa-ready, and enables bank account applications on the same day. It’s the fastest, most reliable way to launch your business in Dubai.',
                actionText: 'Select Fawri License',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686b8b601639b2df4bfdbec4_fawri.webp'
            },
            'regular': {
                title: 'Regular Business License 📨',
                description: 'The regular business license is built for founders who need flexibility, scalability, and full ownership. It’s a customisable license that supports multi-partner setups, cross-industry models, and long-term growth.',
                additional: 'Choose from 2,500+ business activities across 3 groups with instant access to visa processing and banking. 100% digital, fully foreign-owned, and designed for serious entrepreneurs ready to build broad, future-ready businesses in Dubai.', 
                actionText: 'Select Regular License',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/686b8b602ab2cde8b87325e8_regular.webp'
            }
        };
        
        const license = licenseData[licenseType];
        if (!license) return;
        
        // Remove any existing category image
        const existingImage = modalHeader.querySelector('.addon-category-image-container');
        if (existingImage) {
            existingImage.remove();
        }
        
        // Add license image to the modal header content
        const modalHeaderContent = modalHeader.querySelector('.modal-header-content');
        if (modalHeaderContent) {
            const imageHtml = `
                <div class="addon-category-image-container">
                    <img src="${license.image}" alt="${license.title}" class="addon-category-image" />
                </div>`;
            modalHeaderContent.insertAdjacentHTML('afterbegin', imageHtml);
        }
        
        modalTitle.textContent = license.title;
        modalDescription.innerHTML = license.description;
        modalAdditional.innerHTML = license.additional;
        modalActionBtn.innerHTML = `
            ${license.actionText}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        
        // Remove any existing click handlers
        const newActionBtn = modalActionBtn.cloneNode(true);
        modalActionBtn.parentNode.replaceChild(newActionBtn, modalActionBtn);
        
        // Get fresh reference to the button
        const freshActionBtn = document.getElementById('license-modal-action-btn');
        
        // Update action button click handler with direct DOM manipulation
        freshActionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Select the license
            selectLicenseType(licenseType);
            
            // Force close the modal
            document.getElementById('license-modal').style.display = 'none';
            document.body.style.overflow = 'auto';
            document.body.classList.remove('sheet-view-active');
            
            // Hide overlay
            const overlay = document.getElementById('bottom-sheet-overlay');
            if (overlay) overlay.classList.remove('active');
            
            // Restore scroll position
            if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                setTimeout(() => {
                    window.scrollTo(0, window.scrollPositionBeforeModal);
                }, 10);
            }
            
            return false;
        });
        
        // Store current scroll position before opening modal
        window.scrollPositionBeforeModal = window.pageYOffset || document.documentElement.scrollTop;
        
        // Setup modal event listeners
        setupLicenseModalEventListeners();
        
        // Show the modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add sheet-view-active class for mobile styling
        if (window.innerWidth <= 1200) {
            document.body.classList.add('sheet-view-active');
            const overlay = document.getElementById('bottom-sheet-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        }
    }

    function closeLicenseModal() {
        const modal = document.getElementById('license-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Remove sheet-view-active class
        document.body.classList.remove('sheet-view-active');
        const overlay = document.getElementById('bottom-sheet-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Restore scroll position after a brief delay to ensure body is properly unlocked
        if (typeof window.scrollPositionBeforeModal !== 'undefined') {
            setTimeout(() => {
                window.scrollTo(0, window.scrollPositionBeforeModal);
            }, 10);
        }
        
    }

    function setupLicenseModalEventListeners() {
        const closeBtn = document.getElementById('license-close-modal-btn');
        const modal = document.getElementById('license-modal');
        const backBtn = document.getElementById('license-modal-back-btn');
        
        // Remove existing listeners
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        const newBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(newBackBtn, backBtn);
        
        // Add fresh listeners with direct DOM manipulation and event prevention
        document.getElementById('license-close-modal-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Directly close the modal
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.body.classList.remove('sheet-view-active');
            
            const overlay = document.getElementById('bottom-sheet-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
            
            // Restore scroll position
            if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                setTimeout(() => {
                    window.scrollTo(0, window.scrollPositionBeforeModal);
                }, 10);
            }
            
            return false;
        });
        
        document.getElementById('license-modal-back-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Directly close the modal
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.body.classList.remove('sheet-view-active');
            
            const overlay = document.getElementById('bottom-sheet-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
            
            // Restore scroll position
            if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                setTimeout(() => {
                    window.scrollTo(0, window.scrollPositionBeforeModal);
                }, 10);
            }
            
            return false;
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                e.preventDefault();
                e.stopPropagation();
                
                // Directly close the modal
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
                document.body.classList.remove('sheet-view-active');
                
                const overlay = document.getElementById('bottom-sheet-overlay');
                if (overlay) {
                    overlay.classList.remove('active');
                }
                
                // Restore scroll position
                if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                    setTimeout(() => {
                        window.scrollTo(0, window.scrollPositionBeforeModal);
                    }, 10);
                }
                
                return false;
            }
        });
    }

    // Summary Toggle Functions
    function initializeSummaryToggle() {
        const grandTotal = document.getElementById('grand-total-clickable');
        
        grandTotal.addEventListener('click', function() {
            toggleSummaryView();
        });
    }

    function toggleSummaryView() {
        const simplifiedSummary = document.getElementById('simplified-summary');
        const detailedSummary = document.getElementById('detailed-summary');
        const summaryHeader = document.querySelector('.summary-header');
        
        // Manual toggle overrides auto-toggle
        if (detailedSummary.style.display === 'none' || detailedSummary.style.display === '') {
            // Show detailed view
            simplifiedSummary.style.display = 'none';
            detailedSummary.style.display = 'block';
            // Add expanded styles to header
            if (summaryHeader) {
                summaryHeader.classList.add('expanded');
            }
            } else {
            // Hide both summaries - only show grand total
            simplifiedSummary.style.display = 'none';
            detailedSummary.style.display = 'none';
            // Remove expanded styles from header
            if (summaryHeader) {
                summaryHeader.classList.remove('expanded');
            }
        }
    }

    function updateBasicPackagePrice(totalCost) {
        const basicPackagePrice = document.getElementById('basic-package-price');
        const packageWarning = document.getElementById('package-warning');
        
        // Only update if elements exist
        if (basicPackagePrice) {
            if (totalCost > 0) {
                basicPackagePrice.textContent = `AED ${totalCost.toLocaleString()}`;
                if (packageWarning) packageWarning.style.display = 'none';
            } else {
                basicPackagePrice.textContent = 'AED 12,500';
                if (packageWarning) packageWarning.style.display = 'flex';
            }
        }
    }

    function updateSelectedGroupsCount() {
        const selectedGroups = document.querySelectorAll('.activity-card.selected').length;
        const groupsCountElement = document.getElementById('groups-selected-count');
        if (groupsCountElement) {
            groupsCountElement.textContent = selectedGroups;
        }

        const feeWarning = document.querySelector('.fee-warning');
        if (feeWarning) {
            if (selectedGroups > 3) {
                feeWarning.style.display = 'block';
            } else {
                feeWarning.style.display = 'none';
            }
        }
    }
    // Validate entire form before submission - now uses centralized FormValidator
    function validateForm() {
        // Use the new centralized validation system first
        if (window.formValidator && typeof window.formValidator.validateContactForm === 'function') {
            return window.formValidator.validateContactForm();
        }
        
        // Use global formValidator if available
        if (typeof formValidator !== 'undefined' && typeof formValidator.validateContactForm === 'function') {
            return formValidator.validateContactForm();
        }
        
        // Fallback for backwards compatibility
        return window.validateContactForm ? window.validateContactForm() : true;
    }

    function validateContactForm() {
        let valid = true;
        
        // Clear previous error messages
        document.querySelectorAll('.calc-error-message').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.calc-error').forEach(el => {
            el.classList.remove('calc-error');
        });
        
        // Validate required fields
        document.querySelectorAll('.calc-required').forEach(input => {
            const errorElement = input.nextElementSibling;
            
            if (!input.value.trim()) {
                input.classList.add('calc-error');
                if (errorElement) {
                    errorElement.textContent = "This field is required";
                    errorElement.style.display = 'block !important';
                    errorElement.style.visibility = 'visible !important';
                    errorElement.style.opacity = '1 !important';
                }
                valid = false;
            }

            if (input.type === "tel" && input.value) {
                let isPhoneValid = false;
                let errorMessage = '';
                
                try {
                    if (formValidator && formValidator.phoneInput && 
                        typeof formValidator.phoneInput.isValidNumber === 'function') {
                        isPhoneValid = formValidator.phoneInput.isValidNumber();
                        
                        // Additional check: must have actual phone number content
                        const phoneNumber = formValidator.phoneInput.getNumber();
                        if (!phoneNumber || phoneNumber.length < 8) {
                            isPhoneValid = false;
                        }
                        
                        if (!isPhoneValid) {
                            const countryData = formValidator.phoneInput.getSelectedCountryData();
                            const digitsOnly = input.value.replace(/\D/g, '');
                            
                            // Country-specific expected lengths
                            const expectedLengths = {
                                'ae': 9,  // UAE: 9 digits
                                'sa': 9,  // Saudi Arabia: 9 digits  
                                'kw': 8,  // Kuwait: 8 digits
                                'bh': 8,  // Bahrain: 8 digits
                                'om': 8,  // Oman: 8 digits
                                'qa': 8,  // Qatar: 8 digits
                                'us': 10, // USA: 10 digits
                                'gb': 11, // UK: 11 digits
                            };
                            
                            const expectedLength = expectedLengths[countryData.iso2] || 10;
                            
                            if (digitsOnly.length < expectedLength) {
                                errorMessage = `Phone number is too short for ${countryData.name}. Expected ${expectedLength} digits, got ${digitsOnly.length}.`;
                            } else if (digitsOnly.length > expectedLength) {
                                errorMessage = `Phone number is too long for ${countryData.name}. Expected ${expectedLength} digits, got ${digitsOnly.length}.`;
                            } else {
                                try {
                                    if (typeof formValidator.phoneInput.isPossibleNumber === 'function' && 
                                        !formValidator.phoneInput.isPossibleNumber()) {
                                        errorMessage = `Invalid phone number format for ${countryData.name}`;
                                    } else {
                                        errorMessage = `Please enter a valid phone number for ${countryData.name}`;
                                    }
                                } catch (err) {
                                    errorMessage = `Invalid phone number format for ${countryData.name}`;
                                }
                            }
                        }
                    } else {
                        // Fallback validation if phoneInput not available
                        const countryData = formValidator && formValidator.phoneInput ? 
                            formValidator.phoneInput.getSelectedCountryData() : { name: 'selected country', iso2: 'ae' };
                        const phoneValue = input.value.replace(/\D/g, '');
                        const expectedLengths = {
                            'ae': 9, 'sa': 9, 'kw': 8, 'bh': 8, 'om': 8, 'qa': 8, 'us': 10, 'ca': 10, 'gb': 11, 'au': 9, 'nz': 9, 'ie': 9, 'za': 9,
                            'de': 11, 'fr': 10, 'it': 10, 'es': 9, 'pt': 9, 'nl': 9, 'be': 9, 'at': 11, 'ch': 9, 'se': 9, 'no': 8, 'dk': 8, 'fi': 9,
                            'pl': 9, 'cz': 9, 'hu': 9, 'ro': 9, 'bg': 9, 'hr': 9, 'si': 8, 'sk': 9, 'lt': 8, 'lv': 8, 'ee': 8, 'gr': 10, 'cy': 8, 'mt': 8, 'lu': 9,
                            'jp': 11, 'kr': 11, 'cn': 11, 'hk': 8, 'tw': 9, 'sg': 8, 'my': 10, 'th': 9, 'ph': 10, 'id': 12, 'vn': 9, 'in': 10, 'pk': 10, 'bd': 10,
                            'lk': 9, 'np': 10, 'mm': 9, 'kh': 9, 'la': 9, 'bn': 7, 'mv': 7, 'tr': 10, 'il': 9, 'ps': 9, 'jo': 9, 'lb': 8, 'sy': 9, 'iq': 10,
                            'ir': 10, 'af': 9, 'eg': 10, 'ly': 9, 'tn': 8, 'dz': 9, 'ma': 9, 'sd': 9, 'ye': 9, 'ng': 10, 'gh': 9, 'ke': 9, 'tz': 9, 'ug': 9,
                            'rw': 9, 'et': 9, 'zm': 9, 'zw': 9, 'bw': 8, 'mz': 9, 'ao': 9, 'cm': 9, 'ci': 10, 'sn': 9, 'ml': 8, 'bf': 8, 'mx': 10, 'br': 11,
                            'ar': 10, 'cl': 9, 'co': 10, 'pe': 9, 've': 10, 'ec': 9, 'uy': 8, 'py': 9, 'bo': 8, 'cr': 8, 'pa': 8, 'gt': 8, 'hn': 8, 'sv': 8,
                            'ni': 8, 'bz': 7, 'jm': 10, 'tt': 10, 'bb': 10, 'bs': 10, 'do': 10, 'pr': 10, 'cu': 8, 'ht': 8, 'ru': 10, 'ua': 9, 'by': 9,
                            'md': 8, 'ge': 9, 'am': 8, 'az': 9, 'kz': 10, 'kg': 9, 'tj': 9, 'tm': 8, 'uz': 9, 'mn': 8, 'is': 7, 'fo': 6, 'gl': 6
                        };
                        const expectedLength = expectedLengths[countryData.iso2] || 10;
                        
                        if (phoneValue.length === expectedLength) {
                            isPhoneValid = true;
                        } else if (phoneValue.length < expectedLength) {
                            isPhoneValid = false;
                            errorMessage = `Phone number is too short for ${countryData.name}. Expected ${expectedLength} digits, got ${phoneValue.length}.`;
                        } else if (phoneValue.length > expectedLength) {
                            isPhoneValid = false;
                            errorMessage = `Phone number is too long for ${countryData.name}. Expected ${expectedLength} digits, got ${phoneValue.length}.`;
                        } else {
                            isPhoneValid = false;
                            errorMessage = "Invalid phone number format";
                        }
                    }
                } catch (err) {
                    // Fallback validation
                    try {
                        const countryData = formValidator && formValidator.phoneInput ? 
                            formValidator.phoneInput.getSelectedCountryData() : { name: 'selected country', iso2: 'ae' };
                        const phoneValue = input.value.replace(/\D/g, '');
                        const expectedLengths = {
                            'ae': 9, 'sa': 9, 'kw': 8, 'bh': 8, 'om': 8, 'qa': 8, 'us': 10, 'ca': 10, 'gb': 11, 'au': 9, 'nz': 9, 'ie': 9, 'za': 9,
                            'de': 11, 'fr': 10, 'it': 10, 'es': 9, 'pt': 9, 'nl': 9, 'be': 9, 'at': 11, 'ch': 9, 'se': 9, 'no': 8, 'dk': 8, 'fi': 9,
                            'pl': 9, 'cz': 9, 'hu': 9, 'ro': 9, 'bg': 9, 'hr': 9, 'si': 8, 'sk': 9, 'lt': 8, 'lv': 8, 'ee': 8, 'gr': 10, 'cy': 8, 'mt': 8, 'lu': 9,
                            'jp': 11, 'kr': 11, 'cn': 11, 'hk': 8, 'tw': 9, 'sg': 8, 'my': 10, 'th': 9, 'ph': 10, 'id': 12, 'vn': 9, 'in': 10, 'pk': 10, 'bd': 10,
                            'lk': 9, 'np': 10, 'mm': 9, 'kh': 9, 'la': 9, 'bn': 7, 'mv': 7, 'tr': 10, 'il': 9, 'ps': 9, 'jo': 9, 'lb': 8, 'sy': 9, 'iq': 10,
                            'ir': 10, 'af': 9, 'eg': 10, 'ly': 9, 'tn': 8, 'dz': 9, 'ma': 9, 'sd': 9, 'ye': 9, 'ng': 10, 'gh': 9, 'ke': 9, 'tz': 9, 'ug': 9,
                            'rw': 9, 'et': 9, 'zm': 9, 'zw': 9, 'bw': 8, 'mz': 9, 'ao': 9, 'cm': 9, 'ci': 10, 'sn': 9, 'ml': 8, 'bf': 8, 'mx': 10, 'br': 11,
                            'ar': 10, 'cl': 9, 'co': 10, 'pe': 9, 've': 10, 'ec': 9, 'uy': 8, 'py': 9, 'bo': 8, 'cr': 8, 'pa': 8, 'gt': 8, 'hn': 8, 'sv': 8,
                            'ni': 8, 'bz': 7, 'jm': 10, 'tt': 10, 'bb': 10, 'bs': 10, 'do': 10, 'pr': 10, 'cu': 8, 'ht': 8, 'ru': 10, 'ua': 9, 'by': 9,
                            'md': 8, 'ge': 9, 'am': 8, 'az': 9, 'kz': 10, 'kg': 9, 'tj': 9, 'tm': 8, 'uz': 9, 'mn': 8, 'is': 7, 'fo': 6, 'gl': 6
                        };
                        const expectedLength = expectedLengths[countryData.iso2] || 10;
                        
                        if (phoneValue.length === expectedLength) {
                            isPhoneValid = true;
                        } else if (phoneValue.length < expectedLength) {
                            isPhoneValid = false;
                            errorMessage = `Phone number is too short. Expected ${expectedLength} digits, got ${phoneValue.length}.`;
                        } else if (phoneValue.length > expectedLength) {
                            isPhoneValid = false;
                            errorMessage = `Phone number is too long. Expected ${expectedLength} digits, got ${phoneValue.length}.`;
                        } else {
                            isPhoneValid = false;
                            errorMessage = "Invalid phone number format";
                        }
                    } catch (innerErr) {
                        // Final fallback
                        const phoneValue = input.value.replace(/\D/g, '');
                        isPhoneValid = phoneValue.length >= 8 && phoneValue.length <= 15;
                        if (!isPhoneValid) {
                            errorMessage = "Please enter a valid phone number";
                        }
                    }
                }
                
                if (!isPhoneValid) {
                    input.classList.add('calc-error');
                    if (errorElement) {
                        errorElement.textContent = errorMessage;
                        errorElement.style.display = 'block !important';
                        errorElement.style.visibility = 'visible !important';
                        errorElement.style.opacity = '1 !important';
                    }
                    valid = false;
                }
            }

            if (input.id === "full-name" && input.value && !/^[A-Za-z\s\-\']{2,}$/.test(input.value)) {
                input.classList.add('calc-error');
                if (errorElement) {
                    let errorMessage = '';
                    if (input.value.trim().length < 2) {
                        errorMessage = "Name must be at least 2 characters long";
                    } else {
                        errorMessage = "Name should contain only letters, spaces, hyphens, and apostrophes";
                    }
                    
                    errorElement.textContent = errorMessage;
                    errorElement.style.display = 'block !important';
                    errorElement.style.visibility = 'visible !important';
                    errorElement.style.opacity = '1 !important';
                }
                valid = false;
            }
        });

        // Validate license type selection (now using hidden input)
        const licenseTypeInput = document.getElementById("license-type");
        if (!licenseTypeInput.value) {
            const licenseCardsContainer = document.querySelector('.license-cards-container');
            if (licenseCardsContainer && !licenseCardsContainer.querySelector('.calc-error-message')) {
                const licenseErrorElement = document.createElement('div');
                licenseErrorElement.className = 'calc-error-message';
                licenseErrorElement.textContent = "Please select a license type";
                licenseErrorElement.style.textAlign = "center";
                licenseErrorElement.style.marginTop = "15px";
                licenseErrorElement.style.color = "#EB5F40";
                licenseCardsContainer.appendChild(licenseErrorElement);
            }
            valid = false;
        }
        
        // Validate business activities
        if (window.selectedActivities.length === 0) {
            const activitiesContainer = document.getElementById('business-activities-section');
            if (activitiesContainer && !activitiesContainer.querySelector('.activity-error')) {
                const activityErrorElement = document.createElement('div');
                activityErrorElement.className = 'calc-error-message activity-error';
                activityErrorElement.textContent = "Please select at least one business activity";
                activityErrorElement.style.textAlign = "center";
                activityErrorElement.style.marginTop = "15px";
                activityErrorElement.style.padding = "10px";
                activityErrorElement.style.borderRadius = "8px";
                activityErrorElement.style.backgroundColor = "rgba(235, 95, 64, 0.1)";
                activityErrorElement.style.color = "#EB5F40";
                activityErrorElement.style.fontWeight = "500";
                activityErrorElement.style.fontSize = "14px";
                activityErrorElement.style.fontFamily = "Plus Jakarta Sans";
                activityErrorElement.style.width = "100%";
                
                activitiesContainer.appendChild(activityErrorElement);
            }
            valid = false;
        }

        return valid;
    }

    function updateShareholderNationalities() {
        // Function now empty - we're removing the nationality fields
        // and only keeping the shareholder count
    }
        
    function getFormSnapshot() {
        const selectedAddonsList = [];
        document.querySelectorAll('.service-checkbox:checked').forEach(checkbox => {
            selectedAddonsList.push(checkbox.value);
        });

        // For the new visa card system, check the hidden inputs directly
        const employeeVisaCount = parseInt(document.getElementById("employee-visa-count")?.value) || 0;
        const dependencyVisaCount = parseInt(document.getElementById("dependency-visas")?.value) || 0;
        const investorVisaCount = parseInt(document.getElementById("investor-visa-count")?.value) || 0;

        return {
            licenseType: document.getElementById("license-type")?.value || "fawri",
            licenseDuration: parseInt(document.getElementById("license-duration")?.value) || 1,
            shareholdersCount: parseInt(document.getElementById("shareholders-range")?.value) || 1,
            investorVisas: investorVisaCount,
            employeeVisas: employeeVisaCount,
            dependencyVisas: dependencyVisaCount,
            // officeType removed as step 5 was removed
            selectedAddons: selectedAddonsList,
            applicantsInsideUAE: parseInt(document.getElementById("applicants-inside-uae")?.value) || 0,
            applicantsOutsideUAE: parseInt(document.getElementById("applicants-outside-uae")?.value) || 0,
        };
    }

    function calculateAddonsCost(snapshot) {
        let cost = 0;
        const { selectedAddons, investorVisas, employeeVisas, dependencyVisas } = snapshot;
        const addonCosts = {
            // mCore
            "bank-account": 1500,
            "business-card": 240,
            "company-stamp": 200,
            "ecommerce-starter": 1000,
            
            // mResidency
            "medical-emirates-id": 2250,
            "medical-insurance": 1080,
            
            // mAssist
            "melite": 6000,
            "meeting-rooms": 150,
            "po-box": 1700,
            "mail-management": 750,
            "document-translation": 250,
            "virtual-assistant": 12000,
            
            // mAccounting
            "corporate-tax": 1200,
            "vat-registration": 1500,
            "liquidation-report": 1000,
            "financial-audit-report": 250,
            "valuation-report": 10000,
            "bookkeeping": 1000
        };

        selectedAddons.forEach(addon => {
            let addonCost = addonCosts[addon] || 0;
            
            // Medical & Emirates ID applies only to investor and employee visas (no fee for dependents)
            if (addon === 'medical-emirates-id') {
                const eligibleVisas = investorVisas + employeeVisas;
                addonCost = addonCost * eligibleVisas;
            }
            
            cost += addonCost;
        });
        return cost;
    }

    // Office cost calculation removed as step 5 was removed
    function calculateOfficeCost() {
        return 0;
    }

    function calculateChangeStatusCost(snapshot) {
        const insideCount = parseInt(document.getElementById('applicants-inside-uae')?.value) || 0;
        return insideCount * 1500; // 1500 AED per applicant inside UAE
    }

    function calculateVisaCost(snapshot) {
        let visaAdditionalCosts = 0;
        const { investorVisas, employeeVisas, dependencyVisas, licenseDuration } = snapshot;

        // Only the visa allocation fee (AED 1,850) scales with duration; base fee is one-time
        const allocationFeePerYear = 1850;
        const allocationFeePerYearEffective = licenseDuration > 1 ? Math.round(allocationFeePerYear * 0.85) : allocationFeePerYear;
        const investorBaseFee = 5850 - allocationFeePerYear; // 4,000
        const employeeBaseFee = 5350 - allocationFeePerYear; // 3,500

        if (investorVisas > 0) {
            visaAdditionalCosts += (investorBaseFee * investorVisas) + (allocationFeePerYearEffective * licenseDuration * investorVisas);
        }

        if (employeeVisas > 0) {
            visaAdditionalCosts += (employeeBaseFee * employeeVisas) + (allocationFeePerYearEffective * licenseDuration * employeeVisas);
        }
        
        // Dependency visas do not have allocation fee and should not scale with duration
        if (dependencyVisas > 0) {
            visaAdditionalCosts += 6000 * dependencyVisas;
        }
        
        // Add immigration card fee (2,000 AED per year) if any visas are selected (including dependency visas)
        if (investorVisas > 0 || employeeVisas > 0 || dependencyVisas > 0) {
            visaAdditionalCosts += 2000 * licenseDuration; // Immigration card fee multiplied by license duration
        }
        
        return visaAdditionalCosts;
    }

    function calculateLicenseCost(snapshot) {
        const { licenseType, packageType, licenseDuration, investorVisas, employeeVisas, dependencyVisas, shareholdersCount } = snapshot;
        
        let baseLicenseCost = 0;
        let sharedDeskFee = 375; // Shared desk fee is always 375 AED
        
        if (licenseType === "fawri") {
            baseLicenseCost = 14625; // AED 14,625 for Fawri License (base cost without shared desk fee)
        } else {
            baseLicenseCost = 12125; // AED 12,125 for Regular License (base cost without shared desk fee)
        }

        let discountPercentage = licenseDuration > 1 ? 15 : 0; // 15% discount for multi-year licenses

        // Calculate base license cost for the duration
        let baseLicenseCostForDuration = baseLicenseCost * licenseDuration;
        
        // Apply discount only to the base license cost, not to shared desk fee
        let discountAmount = baseLicenseCostForDuration * (discountPercentage / 100);
        let discountedBaseCost = baseLicenseCostForDuration - discountAmount;
        
        // Add shared desk fee (not discounted)
        let sharedDeskFeeForDuration = sharedDeskFee * licenseDuration;
        let businessLicenseCost = discountedBaseCost + sharedDeskFeeForDuration;

        // Calculate additional shareholder costs
        // First 6 shareholders are free, each additional costs AED 2,000
        let additionalShareholdersCost = 0;
        if (shareholdersCount > 6) {
            additionalShareholdersCost = (shareholdersCount - 6) * 2000;
        }

        // Add additional shareholders cost to the final license cost
        let licenseAfterDiscount = businessLicenseCost + additionalShareholdersCost;
        
        window.baseLicenseCostValue = baseLicenseCost;
        window.additionalShareholdersCost = additionalShareholdersCost;
        
       
        let immigrationCardTotal = (investorVisas > 0 || employeeVisas > 0 || dependencyVisas > 0) ? (2000 * licenseDuration) : 0;
        
       
        window.immigrationCardFee = immigrationCardTotal;
        
      
        return licenseAfterDiscount;
    }

    function updateSummaryUI(costs, snapshot) {
        const { licenseCost, visaCost, bankAccountCost, officeCost, addonsCost, totalCost } = costs;
        const { licenseType, packageType, licenseDuration, officeType, investorVisas, employeeVisas, dependencyVisas, selectedAddons } = snapshot;

        // Update package type and license duration
        let packageText = licenseType === 'fawri' ? "Fawri" : "Regular";
        document.getElementById("summary-package-type").innerText = packageText;
        document.getElementById("summary-license-duration").innerText = `${licenseDuration} Year${licenseDuration > 1 ? "s" : ""}`;
        
        // Update shareholders count
        const shareholdersCount = parseInt(document.getElementById("shareholders-range")?.value) || 1;
        document.getElementById("summary-shareholders").innerText = shareholdersCount;
        
        // Add/update additional shareholder cost row if needed
        const companySetupContent = document.querySelector('.summary-section:nth-child(1) .summary-content');
        let additionalShareholderRow = document.getElementById('additional-shareholders-row');
        
        if (shareholdersCount > 6 && window.additionalShareholdersCost > 0) {
            if (!additionalShareholderRow) {
                // Create the row if it doesn't exist
                additionalShareholderRow = document.createElement('div');
                additionalShareholderRow.className = 'summary-row';
                additionalShareholderRow.id = 'additional-shareholders-row';
                
                // Insert after the shareholders row
                const shareholdersRow = companySetupContent.querySelector('.summary-row:nth-child(3)');
                shareholdersRow.insertAdjacentElement('afterend', additionalShareholderRow);
            }
            
            const additionalCount = shareholdersCount - 6;
            additionalShareholderRow.innerHTML = `
                <span class="summary-label">Additional Shareholders (${additionalCount})</span>
                <span class="summary-value">AED ${window.additionalShareholdersCost.toLocaleString()}</span>
            `;
        } else if (additionalShareholderRow) {
            // Remove the row if it exists but is no longer needed
            additionalShareholderRow.remove();
        }
        
        // Update license base cost
        const licenseCostElement = document.getElementById("license-base-cost");
        if (licenseCostElement) {
            licenseCostElement.innerText = `AED ${window.baseLicenseCostValue.toLocaleString()}`;
        }
        
        // Update company setup header price
        const companySetupPrice = document.getElementById("company-setup-price");
        if (companySetupPrice) {
            companySetupPrice.innerText = `AED ${licenseCost.toLocaleString()}`;
        }
        
        // Show/hide Company Setup section based on cost
        const companySetupSection = document.querySelector('.summary-section:nth-child(1)');
        if (companySetupSection) {
            companySetupSection.style.display = licenseCost > 0 ? 'block' : 'none';
        }
        
        // Update business activities summary
        const businessActivitySection = document.querySelector('.summary-section:nth-child(2)');
        const activityTagsContainer = document.getElementById("activity-tags-container");
        
        if (activityTagsContainer && businessActivitySection) {
            activityTagsContainer.innerHTML = '';
            
            
            // Only show business activities section if activities are selected
            if (window.selectedActivities && window.selectedActivities.length > 0) {
                businessActivitySection.style.display = 'block';
                
                // Group activities by category
                const activityGroups = {};
                
                // First, create a list of all unique groups
                window.selectedActivities.forEach(activity => {
                    const groupName = activity.groupName || mapCategoryToGroup(activity.Category, activity.Group);
                    if (!activityGroups[groupName]) {
                        activityGroups[groupName] = [];
                    }
                    activityGroups[groupName].push(activity);
                });
                
                // Create table-style rows instead of tags
                // Sort groups by activity count (descending) to show most selected first
                const sortedGroupNames = Object.keys(activityGroups).sort((a, b) => {
                    return activityGroups[b].length - activityGroups[a].length;
                });
                
                sortedGroupNames.forEach(groupName => {
                    const activities = activityGroups[groupName];
                    
                    // Create a summary row instead of a tag
                    const row = document.createElement('div');
                    row.className = 'summary-row';
                    
                    const label = document.createElement('span');
                    label.className = 'summary-label';
                    label.innerText = `${mapGroupToDisplayName(groupName)} (${activities.length})`;
                    
                    const value = document.createElement('span');
                    value.className = 'summary-value';
                    value.innerText = '';
                    
                    row.appendChild(label);
                    row.appendChild(value);
                    activityTagsContainer.appendChild(row);
                });
                
                // Update business activities cost
                const businessActivitiesCost = document.getElementById("business-activities-cost");
                if (businessActivitiesCost) {
                    // Calculate cost based on individual activities in additional groups
                    const groupNames = Object.keys(activityGroups);
                    let activitiesCostValue = 0;
                    
                    if (groupNames.length > 3) {
                        // Keep track of which groups were selected first (maintain selection order)
                        const groupSelectionOrder = [];
                        window.selectedActivities.forEach(activity => {
                            const groupName = activity.groupName || (activity.Category ? activity.Category.toLowerCase() : '');
                            if (!groupSelectionOrder.includes(groupName)) {
                                groupSelectionOrder.push(groupName);
                            }
                        });
                        
                        // First 3 groups in selection order are free, charge for activities in remaining groups
                        for (let i = 3; i < groupSelectionOrder.length; i++) {
                            const groupName = groupSelectionOrder[i];
                            if (activityGroups[groupName]) {
                                activitiesCostValue += activityGroups[groupName].length * 1000;
                            }
                        }
                    }
                    
                    businessActivitiesCost.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                    
                    // Update the price in the business activities header
                    const businessActivitiesHeader = document.getElementById('business-activities-header-price');
                    if (businessActivitiesHeader) {
                        businessActivitiesHeader.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                    }
                    
                    // Show/hide fee warning based on number of activity groups
                    const feeWarning = document.querySelector('.fee-warning');
                    if (feeWarning) {
                        if (groupNames.length > 3) {
                            feeWarning.style.display = 'block';
                        } else {
                            feeWarning.style.display = 'none';
                        }
                    }
                }
            } else {
                // Hide business activities section if no activities selected
                businessActivitySection.style.display = 'none';
            }
        }
        
        // Helper function to map group names to display names
        function mapGroupToDisplayName(groupName) {
            const groupDisplayNames = {
                'administrative': 'Administrative',
                'agriculture': 'Agriculture',
                'art': 'Art',
                'education': 'Education',
                'ict': 'ICT',
                'F&B,Rentals': 'F&B,Rentals',
                'financial': 'Financial',
                'healthcare': 'Health Care',
                'maintenance': 'Maintenance',
                'services': 'Services',
                'professional': 'Professional',
                'realestate': 'Real Estate',
                'sewerage': 'Sewerage',
                'trading': 'Trading',
                'transportation': 'Transportation',
                'waste': 'Waste Collection',
                'manufacturing': 'Manufacturing'
            };
            return groupDisplayNames[groupName] || groupName;
        }
        
        // Update visa information and show/hide section
        const visaSection = document.querySelector('.summary-section:nth-child(3)');
        const allocationFeePerYear = 1850;
        const allocationFeePerYearEffective = licenseDuration > 1 ? Math.round(allocationFeePerYear * 0.85) : allocationFeePerYear;
        const investorBaseFee = 5850 - allocationFeePerYear; // 4,000
        const employeeBaseFee = 5350 - allocationFeePerYear; // 3,500
        const investorVisaCost = investorVisas > 0 ? (investorBaseFee * investorVisas) + (allocationFeePerYearEffective * licenseDuration * investorVisas) : 0;
        const employeeVisaCost = employeeVisas > 0 ? (employeeBaseFee * employeeVisas) + (allocationFeePerYearEffective * licenseDuration * employeeVisas) : 0;
        const dependencyVisaCost = dependencyVisas > 0 ? 6000 * dependencyVisas : 0;
        const totalVisaCost = investorVisaCost + employeeVisaCost + dependencyVisaCost + window.immigrationCardFee;
        
        if (visaSection) {
            // Show visa section only if there are visas selected
            if (totalVisaCost > 0) {
                visaSection.style.display = 'block';
                
                // Update visa displays and show/hide individual rows
                const investorRow = document.querySelector('.summary-row:has(#investor-visa-cost)');
                const employeeRow = document.querySelector('.summary-row:has(#employee-visa-cost)');
                const dependencyRow = document.querySelector('.summary-row:has(#dependency-visa-cost)');
                
                // Show/hide investor visa row
                if (investorRow) {
                    investorRow.style.display = investorVisas > 0 ? 'flex' : 'none';
                    if (investorVisas > 0) {
                        document.getElementById("summary-investor-visa-display").innerText = `(${investorVisas})`;
                        document.getElementById("investor-visa-cost").innerText = `AED ${investorVisaCost.toLocaleString()}`;
                    }
                }
                
                // Show/hide employee visa row
                if (employeeRow) {
                    employeeRow.style.display = employeeVisas > 0 ? 'flex' : 'none';
                    if (employeeVisas > 0) {
                        document.getElementById("summary-employee-visa-display").innerText = `(${employeeVisas})`;
                        document.getElementById("employee-visa-cost").innerText = `AED ${employeeVisaCost.toLocaleString()}`;
                    }
                }
                
                // Show/hide dependency visa row
                if (dependencyRow) {
                    dependencyRow.style.display = dependencyVisas > 0 ? 'flex' : 'none';
                    if (dependencyVisas > 0) {
                        document.getElementById("summary-dependency-visa-display").innerText = `(${dependencyVisas})`;
                        document.getElementById("dependency-visa-cost").innerText = `AED ${dependencyVisaCost.toLocaleString()}`;
                    }
                }
                
                // Update the visa price in the summary header
                const visaHeader = document.getElementById('visas-header-price');
                if (visaHeader) {
                    visaHeader.innerText = `AED ${totalVisaCost.toLocaleString()}`;
                }
            } else {
                // Hide visa section if no visas selected
                visaSection.style.display = 'none';
            }
        }
        
        // Update immigration card fee and show/hide row
        const immigrationCardElement = document.getElementById("immigration-card-cost");
        const immigrationCardRow = document.getElementById("immigration-card-row");
        if (immigrationCardElement && immigrationCardRow) {
            if (window.immigrationCardFee > 0) {
                immigrationCardElement.innerText = `AED ${window.immigrationCardFee.toLocaleString()}`;
                immigrationCardRow.style.display = 'flex';
            } else {
                immigrationCardElement.innerText = 'AED 0';
                immigrationCardRow.style.display = 'none';
            }
        }
        
        // Update change status section and show/hide
        const changeStatusSection = document.querySelector('.summary-section:nth-child(4)');
        const insideCount = parseInt(document.getElementById('applicants-inside-uae')?.value) || 0;
        const outsideCount = parseInt(document.getElementById('applicants-outside-uae')?.value) || 0;
        const changeStatusCost = insideCount * 1500;
        
        if (changeStatusSection) {
            if (insideCount > 0 || outsideCount > 0) {
                changeStatusSection.style.display = 'block';
                
                // Update summary counts
                document.getElementById('summary-inside-count').innerText = `(${insideCount})`;
                document.getElementById('summary-outside-count').innerText = `(${outsideCount})`;
                document.getElementById('inside-status-cost').innerText = `AED ${changeStatusCost.toLocaleString()}`;
                
                // Update header price
                const changeStatusHeaderPrice = document.getElementById('change-status-header-price');
                if (changeStatusHeaderPrice) {
                    changeStatusHeaderPrice.innerText = `AED ${changeStatusCost.toLocaleString()}`;
                }
            } else {
                changeStatusSection.style.display = 'none';
            }
        }

        // Update addons and show/hide section
        const addonsSection = document.getElementById('addons-summary-section');
        const addonsContainer = document.getElementById("addons-summary-container");
        
        if (addonsContainer && addonsSection) {
        addonsContainer.innerHTML = '';

        const addonDetails = {
            // Group 1: mCore
            "bank-account": { name: "Bank Account", cost: 1500, group: "mCore" },
            "business-card": { name: "Business Card", cost: 240, group: "mCore" },
            "company-stamp": { name: "Company Stamp", cost: 200, group: "mCore" },
            "ecommerce-starter": { name: "E-commerce Starter", cost: 1000, group: "mCore" },
            
            // Group 2: mResidency
            "medical-emirates-id": { name: "Medical & Emirates ID", cost: 2250, group: "mResidency" },
            "medical-insurance": { name: "Medical Insurance", cost: 1080, group: "mResidency" },

            // Group 3: mAssist
            "melite": { name: "mElite", cost: 6000, group: "mAssist" },
            "meeting-rooms": { name: "Meeting Rooms", cost: 150, group: "mAssist" },
            "po-box": { name: "P.O. Box", cost: 1700, group: "mAssist" },
            "mail-management": { name: "Mail Management", cost: 750, group: "mAssist" },
            "document-translation": { name: "Document Translation", cost: 250, group: "mAssist" },
            "virtual-assistant": { name: "Virtual Assistant", cost: 12000, group: "mAssist" },

            // Group 4: mAccounting
            "corporate-tax": { name: "Corporate Tax", cost: 1200, group: "mAccounting" },
            "vat-registration": { name: "VAT Registration", cost: 1500, group: "mAccounting" },
            "liquidation-report": { name: "Liquidation Report", cost: 1000, group: "mAccounting" },
            "financial-audit-report": { name: "Financial Audit Report", cost: 250, group: "mAccounting" },
            "valuation-report": { name: "Valuation Report", cost: 10000, group: "mAccounting" },
            "bookkeeping": { name: "Bookkeeping", cost: 1000, group: "mAccounting" }
        };

            // Group addons by category
            const addonGroups = {};
            let hasSelectedAddons = false;

            selectedAddons.forEach(addonId => {
                if (addonDetails[addonId]) {
                    hasSelectedAddons = true;
                    const addon = addonDetails[addonId];
                    if (!addonGroups[addon.group]) {
                        addonGroups[addon.group] = [];
                    }
                    addonGroups[addon.group].push(addon);
                }
            });

            // Show/hide addons section based on selections AND viewport/interaction
            if (hasSelectedAddons && sectionInteractions.addonsSection) {
                // Expand the section when addons are available and interaction occurred
                addonsSection.style.display = 'block';
                addonsSection.classList.add('expanded');
                
                // Create sections for each group
                Object.keys(addonGroups).forEach(groupName => {
                const groupSection = document.createElement('div');
                groupSection.className = 'summary-section';

                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'summary-section-header';
                    groupHeader.innerHTML = `<h4>${groupName}</h4>`;
                groupSection.appendChild(groupHeader);

                    const groupContent = document.createElement('div');
                    groupContent.className = 'summary-content';
                    
                    addonGroups[groupName].forEach(addon => {
                        const row = document.createElement('div');
                        row.className = 'summary-row';
                        
                        const label = document.createElement('span');
                        label.className = 'summary-label';
                        label.innerText = addon.name;
                        
                        const value = document.createElement('span');
                        value.className = 'summary-value';
                        
                        // Calculate actual cost - Medical & Emirates ID applies only to investor + employee visas
                        let displayCost = addon.cost;
                        if (addon.name === 'Medical & Emirates ID') {
                            const eligibleVisas = investorVisas + employeeVisas;
                            displayCost = addon.cost * eligibleVisas;
                        }
                        
                        value.innerText = `AED ${displayCost.toLocaleString()}`;
                        
                        row.appendChild(label);
                        row.appendChild(value);
                        groupContent.appendChild(row);
                    });
                    
                    groupSection.appendChild(groupContent);
                addonsContainer.appendChild(groupSection);
            });
            } else {
                // Collapse addons section if no addons selected or no interaction
                addonsSection.classList.remove('expanded');
                // Keep section visible but collapsed (just the header)
                addonsSection.style.display = 'block';
            }
        }
        
        // Update grand total
        updateGrandTotal(totalCost);
        
        // Auto-toggle summary view based on selections
        autoToggleSummaryView();
    }
    
    function autoToggleSummaryView() {
        const simplifiedSummary = document.getElementById('simplified-summary');
        const detailedSummary = document.getElementById('detailed-summary');
        
        // Check if ANY section has been interacted with
        const hasAnyInteraction = Object.values(sectionInteractions).some(interacted => interacted);
        
        const hasAnySelections = hasAnyInteraction;
        
        // Auto-switch to appropriate view
        const summaryHeader = document.querySelector('.summary-header');
        
        if (hasAnySelections) {
            // Show detailed view when there are selections
            if (simplifiedSummary && detailedSummary) {
                simplifiedSummary.style.display = 'none';
                detailedSummary.style.display = 'block';
            }
            // Add expanded styles to header
            if (summaryHeader) {
                summaryHeader.classList.add('expanded');
            }
        } else {
            // Hide both summaries when nothing is selected - only show grand total
            if (simplifiedSummary && detailedSummary) {
                simplifiedSummary.style.display = 'none';
                detailedSummary.style.display = 'none';
            }
            // Remove expanded styles from header
            if (summaryHeader) {
                summaryHeader.classList.remove('expanded');
            }
        }
    }


    function calculateCosts() {
        const snapshot = getFormSnapshot();
        
        // Calculate costs for sections that have been interacted with
        
        // Only calculate costs for sections that have been interacted with
        // Form being unlocked is no longer a condition for showing prices
        const licenseComponent = sectionInteractions.licenseSection ? calculateLicenseCost(snapshot) : 0;
        const visaComponent = sectionInteractions.visaSection ? calculateVisaCost(snapshot) : 0;
        const officeComponent = calculateOfficeCost(snapshot); // Office component is always 0 now
        const addonsComponent = sectionInteractions.addonsSection ? calculateAddonsCost(snapshot) : 0;
        const changeStatusComponent = sectionInteractions.visaSection ? calculateChangeStatusCost(snapshot) : 0;
        
        // Calculate business activities cost
        let businessActivitiesCost = 0;
        if (sectionInteractions.businessActivitiesSection && 
            window.selectedActivities && window.selectedActivities.length > 0) {
            // Group activities by category
            const activityGroups = {};
            window.selectedActivities.forEach(activity => {
                const groupName = activity.groupName || (activity.Category ? activity.Category.toLowerCase() : '');
                if (!activityGroups[groupName]) {
                    activityGroups[groupName] = [];
                }
                activityGroups[groupName].push(activity);
            });
            
            // First 3 groups are free, then 1000 AED per individual activity in additional groups
            const groupNames = Object.keys(activityGroups);
            if (groupNames.length > 3) {
                // Keep track of which groups were selected first (maintain selection order)
                const groupSelectionOrder = [];
                window.selectedActivities.forEach(activity => {
                    const groupName = activity.groupName || (activity.Category ? activity.Category.toLowerCase() : '');
                    if (!groupSelectionOrder.includes(groupName)) {
                        groupSelectionOrder.push(groupName);
                    }
                });
                
                // First 3 groups in selection order are free, charge for activities in remaining groups
                for (let i = 3; i < groupSelectionOrder.length; i++) {
                    const groupName = groupSelectionOrder[i];
                    if (activityGroups[groupName]) {
                        businessActivitiesCost += activityGroups[groupName].length * 1000;
                    }
                }
            }
        }
        
        // Bank account cost is now included in add-ons, so we don't add it separately
        const totalCost = licenseComponent + visaComponent + officeComponent + addonsComponent + businessActivitiesCost + changeStatusComponent;
        
        const costs = {
            licenseCost: licenseComponent,
            visaCost: visaComponent,
            bankAccountCost: 0, // Set to 0 as it's included in add-ons
            officeCost: officeComponent,
            addonsCost: addonsComponent,
            businessActivitiesCost: businessActivitiesCost,
            changeStatusCost: changeStatusComponent,
            totalCost: totalCost
        };
        
        // Set global variables for access in other functions
        LicenseCost = Math.round(licenseComponent);
        VisaCost = Math.round(visaComponent);
        window.AddonsComponent = Math.round(addonsComponent);
        window.BusinessActivitiesCost = Math.round(businessActivitiesCost);
        window.ChangeStatusCost = Math.round(changeStatusComponent);

        // Update change status section visibility
        updateChangeStatusVisibility();
        updateMResidencyVisibility();
        updateInvestorDependentDisclaimer();

        updateSummaryUI(costs, snapshot);
        
        // Update basic package price
        updateBasicPackagePrice(totalCost);
        
        // Always update the grand total (including mobile)
        updateGrandTotal(totalCost);
        
        // Save form data to localStorage for potential recovery
        try {
            localStorage.setItem('costCalculatorData', JSON.stringify(snapshot));
        } catch (e) {
        }

        updateGrandTotal(totalCost);
    }

    function calculateTotalCost() {
        // Use the global variables set in calculateCosts function
        // If they're not set yet, calculate them
        if (typeof LicenseCost === 'undefined' || typeof VisaCost === 'undefined' || 
            typeof window.AddonsComponent === 'undefined' || typeof window.BusinessActivitiesCost === 'undefined') {
            
            // Calculate all components
            const snapshot = getFormSnapshot();
            const licenseComponent = calculateLicenseCost(snapshot);
            const visaComponent = calculateVisaCost(snapshot);
            const officeComponent = calculateOfficeCost(snapshot);
            const addonsComponent = calculateAddonsCost(snapshot);
            const changeStatusComponent = calculateChangeStatusCost(snapshot);
            
            // Calculate business activities cost
            let businessActivitiesCost = 0;
            if (window.selectedActivities && window.selectedActivities.length > 0) {
                // Group activities by category
                const activityGroups = {};
                window.selectedActivities.forEach(activity => {
                    const groupName = activity.groupName || (activity.Category ? activity.Category.toLowerCase() : '');
                    if (!activityGroups[groupName]) {
                        activityGroups[groupName] = [];
                    }
                    activityGroups[groupName].push(activity);
                });
                
                // First 3 groups are free, then 1000 AED per individual activity in additional groups
                const groupNames = Object.keys(activityGroups);
                if (groupNames.length > 3) {
                    // Keep track of which groups were selected first (maintain selection order)
                    const groupSelectionOrder = [];
                    window.selectedActivities.forEach(activity => {
                        const groupName = activity.groupName || (activity.Category ? activity.Category.toLowerCase() : '');
                        if (!groupSelectionOrder.includes(groupName)) {
                            groupSelectionOrder.push(groupName);
                        }
                    });
                    
                    // First 3 groups in selection order are free, charge for activities in remaining groups
                    for (let i = 3; i < groupSelectionOrder.length; i++) {
                        const groupName = groupSelectionOrder[i];
                        if (activityGroups[groupName]) {
                            businessActivitiesCost += activityGroups[groupName].length * 1000;
                        }
                    }
                }
            }
            
            // Return the total cost
            return Math.round(licenseComponent + visaComponent + officeComponent + addonsComponent + businessActivitiesCost + changeStatusComponent);
        } else {
            
            // Return the total cost using global variables
            return LicenseCost + VisaCost + (window.AddonsComponent || 0) + (window.BusinessActivitiesCost || 0) + (window.ChangeStatusCost || 0);
        }
    }



    function submitToWebhook(formData) {
        const webhookURL = 'https://flow.zoho.com/758936401/flow/webhook/incoming?zapikey=1001.94bc1104bf9127e946df8ce9f506cee8.b71769ce0ac6796266efd20fab162f4e&isdebug=false';
        
        return new Promise((resolve, reject) => {
            try {
                // Try iframe form submission first
                submitViaIframe(webhookURL, formData)
                    .then(resolve)
                    .catch((iframeError) => {
                        // Fallback to URL params method
                        submitViaURLParams(webhookURL, formData)
                            .then(resolve)
                            .catch(reject);
                    });
                
            } catch (error) {
                console.error('Webhook submission failed:', error);
                reject(error);
            }
        });
    }

    function submitViaIframe(webhookURL, formData) {
        return new Promise((resolve, reject) => {
            try {
                // Create a hidden iframe for silent submission
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.name = 'webhook-submit-frame-' + Date.now();
                document.body.appendChild(iframe);
                
                // Create a hidden form to submit data and avoid CORS issues
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = webhookURL;
                form.style.display = 'none';
                form.target = iframe.name; // Submit to hidden iframe
                
                // Add each field as a hidden input
                Object.keys(formData).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = formData[key] || '';
                    form.appendChild(input);
                });
                
                // Add form to document
                document.body.appendChild(form);
                
                // Set a timeout to resolve after submission (since we can't reliably detect success)
                let submitted = false;
                const timeout = setTimeout(() => {
                    if (!submitted) {
                        submitted = true;
                        cleanup();
                        resolve('Form submitted via iframe');
                    }
                }, 3000);
                
                // Handle iframe load event
                iframe.onload = function() {
                    if (!submitted) {
                        submitted = true;
                        cleanup();
                        resolve('Form submitted via iframe');
                    }
                };
                
                // Cleanup function
                const cleanup = () => {
                    setTimeout(() => {
                        if (form.parentNode) document.body.removeChild(form);
                        if (iframe.parentNode) document.body.removeChild(iframe);
                    }, 1000);
                };
                
                // Submit the form
                form.submit();
                
            } catch (error) {
                console.error('Iframe submission failed:', error);
                reject(error);
            }
        });
    }

    function submitViaURLParams(webhookURL, formData) {
        return new Promise((resolve, reject) => {
            try {
                // Convert formData to URL parameters
                const params = new URLSearchParams();
                Object.keys(formData).forEach(key => {
                    params.append(key, formData[key] || '');
                });
                
                // Create full URL with parameters
                const fullURL = webhookURL + '&' + params.toString();
                
                // Use image request to send data (avoids CORS preflight)
                const img = new Image();
                
                img.onload = function() {
                    resolve('Form submitted via URL params');
                };
                
                img.onerror = function() {
                    // Even if image fails to load, the request was probably sent
                    resolve('Form submitted via URL params (error response)');
                };
                
                // Set a timeout as fallback
                setTimeout(() => {
                    resolve('Form submitted via URL params (timeout)');
                }, 2000);
                
                // Trigger the request
                img.src = fullURL;
                
            } catch (error) {
                reject(error);
            }
        });
    }












    // Set custom placeholder for UAE (default country)
    phoneInputField.placeholder = "50 123 4567";

    // Strict phone input validation with physical restriction
    let userHasInteracted = false;
    let phoneFieldHasBeenFocused = false;
    
    // Track when phone field gets focus for the first time
    phoneInputField.addEventListener("focus", function() {
        phoneFieldHasBeenFocused = true;
    });
    
    // Restrict input to numbers only and enforce country-specific length limits
    phoneInputField.addEventListener("keydown", function(e) {
        userHasInteracted = true;
        
        // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
        if ([8, 9, 27, 13, 35, 36, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        
        // Get current country data
        const countryData = phoneInput.getSelectedCountryData();
        const currentValue = e.target.value.replace(/\D/g, ''); // Remove non-digits for length check
        
        // Country-specific max lengths (national significant number length)
        const maxLengths = {
            'ae': 9,  // UAE: 9 digits
            'sa': 9,  // Saudi Arabia: 9 digits  
            'kw': 8,  // Kuwait: 8 digits
            'bh': 8,  // Bahrain: 8 digits
            'om': 8,  // Oman: 8 digits
            'qa': 8,  // Qatar: 8 digits
            'us': 10, // USA: 10 digits
            'gb': 11, // UK: 11 digits
        };
        
        const maxLength = maxLengths[countryData.iso2] || 15; // Default max 15 digits
        
        // If it's a number and would exceed max length, prevent it
        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
            if (currentValue.length >= maxLength) {
                e.preventDefault();
                return;
            }
        }
        
        // Ensure that it is a number and stop other keypresses
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    phoneInputField.addEventListener("input", function(e) {
        userHasInteracted = true;
        
        // Clear any existing error styling during typing (but don't validate yet)
        phoneInputField.classList.remove('calc-error');
        const errorElement = document.getElementById('calc-phone-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Remove any non-digit characters except formatting
        const value = e.target.value;
        const digitsOnly = value.replace(/\D/g, '');
        
        // Get country-specific max length
        const countryData = phoneInput.getSelectedCountryData();
        const maxLengths = {
            'ae': 9, 'sa': 9, 'kw': 8, 'bh': 8, 'om': 8, 'qa': 8,
            'us': 10, 'gb': 11
        };
        const maxLength = maxLengths[countryData.iso2] || 15;
        
        // If too many digits, truncate
        if (digitsOnly.length > maxLength) {
            const truncatedDigits = digitsOnly.slice(0, maxLength);
            // Set the value and let intlTelInput format it
            phoneInput.setNumber('+' + countryData.dialCode + truncatedDigits);
        }
        
        // Don't validate during typing - only on blur or form submission
    });

    // Also clear errors on paste but don't validate immediately
    phoneInputField.addEventListener("paste", function(e) {
        userHasInteracted = true;
        phoneInputField.classList.remove('error');
        const errorElement = document.getElementById('phone-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });

    // Handle country change to clear validation and update placeholder
    phoneInputField.addEventListener("countrychange", function() {
        // Clear any existing validation when country changes
        phoneInputField.classList.remove('calc-error');
        const errorElement = document.getElementById('calc-phone-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        // Update placeholder based on selected country
        const countryData = phoneInput.getSelectedCountryData();
        const countryPlaceholders = {
            // GCC Countries
            'ae': '50 123 4567',       // UAE
            'sa': '50 123 4567',       // Saudi Arabia
            'kw': '9999 9999',         // Kuwait
            'bh': '9999 9999',         // Bahrain
            'om': '9999 9999',         // Oman
            'qa': '9999 9999',         // Qatar
            
            // Major English-speaking countries
            'us': '(201) 555-0123',    // USA
            'ca': '(416) 555-0123',    // Canada
            'gb': '07400 123456',      // UK
            'au': '0400 123 456',      // Australia
            'nz': '021 123 456',       // New Zealand
            'ie': '085 123 4567',      // Ireland
            'za': '082 123 4567',      // South Africa
            
            // European Union
            'de': '0151 12345678',     // Germany
            'fr': '06 12 34 56 78',    // France
            'it': '320 123 4567',      // Italy
            'es': '612 34 56 78',      // Spain
            'pt': '912 345 678',       // Portugal
            'nl': '06 12345678',       // Netherlands
            'be': '0470 12 34 56',     // Belgium
            'at': '0664 1234567',      // Austria
            'ch': '078 123 45 67',     // Switzerland
            'se': '070 123 45 67',     // Sweden
            'no': '406 12 34 56',       // Norway
            'dk': '20 12 34 56',       // Denmark
            'fi': '040 123 4567',      // Finland
            'pl': '512 345 678',       // Poland
            'cz': '601 123 456',       // Czech Republic
            'hu': '06 20 123 4567',    // Hungary
            'ro': '0712 345 678',      // Romania
            'bg': '087 123 4567',      // Bulgaria
            'hr': '091 234 5678',      // Croatia
            'si': '031 234 567',       // Slovenia
            'sk': '0901 123 456',      // Slovakia
            'lt': '8612 34567',        // Lithuania
            'lv': '2012 3456',         // Latvia
            'ee': '5123 4567',         // Estonia
            'gr': '694 123 4567',      // Greece
            'cy': '9612 3456',         // Cyprus
            'mt': '9912 3456',         // Malta
            'lu': '621 123 456',       // Luxembourg
            
            // Asia-Pacific
            'jp': '090 1234 5678',     // Japan
            'kr': '010 1234 5678',     // South Korea
            'cn': '138 0013 8000',     // China
            'hk': '9123 4567',         // Hong Kong
            'tw': '0912 345 678',      // Taiwan
            'sg': '8123 4567',         // Singapore
            'my': '012 345 6789',      // Malaysia
            'th': '081 234 5678',      // Thailand
            'ph': '0917 123 4567',     // Philippines
            'id': '0812 3456 7890',    // Indonesia
            'vn': '091 234 56 78',     // Vietnam
            'in': '91234 56789',       // India
            'pk': '0301 2345678',      // Pakistan
            'bd': '01712 345678',      // Bangladesh
            'lk': '071 234 5678',      // Sri Lanka
            'np': '984 123 4567',      // Nepal
            'mm': '09 123 456 789',    // Myanmar
            'kh': '012 345 678',       // Cambodia
            'la': '020 123 4567',      // Laos
            'bn': '712 3456',          // Brunei
            'mv': '791 2345',          // Maldives
            
            // Middle East & North Africa
            'tr': '0532 123 45 67',    // Turkey
            'il': '050 123 4567',      // Israel
            'ps': '059 123 4567',      // Palestine
            'jo': '079 123 4567',      // Jordan
            'lb': '71 123 456',        // Lebanon
            'sy': '0944 123 456',      // Syria
            'iq': '0790 123 4567',     // Iraq
            'ir': '0912 345 6789',     // Iran
            'af': '070 123 4567',      // Afghanistan
            'eg': '0100 123 4567',     // Egypt
            'ly': '091 234 5678',      // Libya
            'tn': '20 123 456',        // Tunisia
            'dz': '0551 23 45 67',     // Algeria
            'ma': '0612 345678',       // Morocco
            'sd': '091 123 4567',      // Sudan
            'ye': '070 123 456',       // Yemen
            
            // Africa
            'ng': '0803 123 4567',     // Nigeria
            'gh': '024 123 4567',      // Ghana
            'ke': '0712 345678',       // Kenya
            'tz': '0754 123456',       // Tanzania
            'ug': '0772 123456',       // Uganda
            'rw': '078 123 4567',      // Rwanda
            'et': '091 123 4567',      // Ethiopia
            'zm': '097 123 4567',      // Zambia
            'zw': '077 123 4567',      // Zimbabwe
            'bw': '71 123 456',        // Botswana
            'mz': '82 123 4567',       // Mozambique
            'ao': '923 123 456',       // Angola
            'cm': '6123 4567',         // Cameroon
            'ci': '0123 456789',       // Côte d'Ivoire
            'sn': '70 123 45 67',      // Senegal
            'ml': '65 12 34 56',       // Mali
            'bf': '70 12 34 56',       // Burkina Faso
            
            // Latin America
            'mx': '55 1234 5678',      // Mexico
            'br': '11 91234 5678',     // Brazil
            'ar': '11 1234 5678',      // Argentina
            'cl': '9 1234 5678',       // Chile
            'co': '321 123 4567',      // Colombia
            'pe': '912 345 678',       // Peru
            've': '0412 1234567',      // Venezuela
            'ec': '099 123 4567',      // Ecuador
            'uy': '094 123 456',       // Uruguay
            'py': '0981 123456',       // Paraguay
            'bo': '6123 4567',         // Bolivia
            'cr': '8312 3456',         // Costa Rica
            'pa': '6123 4567',         // Panama
            'gt': '5123 4567',         // Guatemala
            'hn': '9123 4567',         // Honduras
            'sv': '7123 4567',         // El Salvador
            'ni': '8123 4567',         // Nicaragua
            'bz': '612 3456',          // Belize
            'jm': '876 123 4567',      // Jamaica
            'tt': '868 123 4567',      // Trinidad and Tobago
            'bb': '246 123 4567',      // Barbados
            'bs': '242 123 4567',      // Bahamas
            'do': '809 123 4567',      // Dominican Republic
            'pr': '787 123 4567',      // Puerto Rico
            'cu': '5123 4567',         // Cuba
            'ht': '3123 4567',         // Haiti
            
            // Eastern Europe & Russia
            'ru': '8 912 345 6789',    // Russia
            'ua': '050 123 45 67',     // Ukraine
            'by': '029 123 45 67',     // Belarus
            'md': '0621 12345',        // Moldova
            'ge': '555 123 456',       // Georgia
            'am': '077 123 456',       // Armenia
            'az': '050 123 45 67',     // Azerbaijan
            'kz': '701 123 4567',      // Kazakhstan
            'kg': '0555 123 456',      // Kyrgyzstan
            'tj': '93 123 45 67',      // Tajikistan
            'tm': '65 123 456',        // Turkmenistan
            'uz': '90 123 45 67',      // Uzbekistan
            'mn': '8812 3456',         // Mongolia
            
            // Nordic & Baltic (additional)
            'is': '611 1234',          // Iceland
            'fo': '211234',            // Faroe Islands
            'gl': '221234',            // Greenland
            
            // Pacific Islands
            'fj': '701 2345',          // Fiji
            'pg': '7012 3456',         // Papua New Guinea
            'vu': '591 2345',          // Vanuatu
            'sb': '7412345',           // Solomon Islands
            'nc': '123456',            // New Caledonia
            'pf': '87 12 34 56',       // French Polynesia
            'ws': '72 12345',          // Samoa
            'to': '771 2345',          // Tonga
            'ki': '7312 3456',         // Kiribati
            'tv': '901 2345',          // Tuvalu
            'nr': '555 1234',          // Nauru
            'pw': '620 1234',          // Palau
            'fm': '350 1234',          // Micronesia
            'mh': '235 1234',          // Marshall Islands
        };
        phoneInputField.placeholder = countryPlaceholders[countryData.iso2] || "Phone number";
        
        // Don't re-validate immediately - wait for blur or form submission
    });

    // Always validate on blur if there's content (more aggressive validation)
    phoneInputField.addEventListener("blur", function() {
        if (phoneInputField.value.trim()) {
            phoneFieldHasBeenFocused = true; // Mark as focused when blur happens
            validatePhoneField();
        }
    });

    // Strict phone validation function
    function validatePhoneField() {
        const phoneValue = phoneInputField.value.trim();
        const errorElement = document.getElementById('calc-phone-error');
        
        // Clear previous errors
        phoneInputField.classList.remove('calc-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (!phoneValue) return; // Don't validate empty field
        
        // Get selected country data
        const countryData = phoneInput.getSelectedCountryData();
        
        // Country-specific expected lengths (defined early for fallback validation)
        const expectedLengths = {
            // GCC Countries
            'ae': 9,  // UAE: 9 digits
            'sa': 9,  // Saudi Arabia: 9 digits  
            'kw': 8,  // Kuwait: 8 digits
            'bh': 8,  // Bahrain: 8 digits
            'om': 8,  // Oman: 8 digits
            'qa': 8,  // Qatar: 8 digits
            
            // Major English-speaking countries
            'us': 10, // USA: 10 digits
            'ca': 10, // Canada: 10 digits
            'gb': 11, // UK: 11 digits
            'au': 9,  // Australia: 9 digits
            'nz': 9,  // New Zealand: 9 digits
            'ie': 9,  // Ireland: 9 digits
            'za': 9,  // South Africa: 9 digits
            
            // European Union
            'de': 11, // Germany: 11 digits
            'fr': 10, // France: 10 digits
            'it': 10, // Italy: 10 digits
            'es': 9,  // Spain: 9 digits
            'pt': 9,  // Portugal: 9 digits
            'nl': 9,  // Netherlands: 9 digits
            'be': 9,  // Belgium: 9 digits
            'at': 11, // Austria: 11 digits
            'ch': 9,  // Switzerland: 9 digits
            'se': 9,  // Sweden: 9 digits
            'no': 8,  // Norway: 8 digits
            'dk': 8,  // Denmark: 8 digits
            'fi': 9,  // Finland: 9 digits
            'pl': 9,  // Poland: 9 digits
            'cz': 9,  // Czech Republic: 9 digits
            'hu': 9,  // Hungary: 9 digits
            'ro': 9,  // Romania: 9 digits
            'bg': 9,  // Bulgaria: 9 digits
            'hr': 9,  // Croatia: 9 digits
            'si': 8,  // Slovenia: 8 digits
            'sk': 9,  // Slovakia: 9 digits
            'lt': 8,  // Lithuania: 8 digits
            'lv': 8,  // Latvia: 8 digits
            'ee': 8,  // Estonia: 8 digits
            'gr': 10, // Greece: 10 digits
            'cy': 8,  // Cyprus: 8 digits
            'mt': 8,  // Malta: 8 digits
            'lu': 9,  // Luxembourg: 9 digits
            
            // Asia-Pacific
            'jp': 11, // Japan: 11 digits
            'kr': 11, // South Korea: 11 digits
            'cn': 11, // China: 11 digits
            'hk': 8,  // Hong Kong: 8 digits
            'tw': 9,  // Taiwan: 9 digits
            'sg': 8,  // Singapore: 8 digits
            'my': 10, // Malaysia: 10 digits
            'th': 9,  // Thailand: 9 digits
            'ph': 10, // Philippines: 10 digits
            'id': 12, // Indonesia: 12 digits
            'vn': 9,  // Vietnam: 9 digits
            'in': 10, // India: 10 digits
            'pk': 10, // Pakistan: 10 digits
            'bd': 10, // Bangladesh: 10 digits
            'lk': 9,  // Sri Lanka: 9 digits
            'np': 10, // Nepal: 10 digits
            'mm': 9,  // Myanmar: 9 digits
            'kh': 9,  // Cambodia: 9 digits
            'la': 9,  // Laos: 9 digits
            'bn': 7,  // Brunei: 7 digits
            'mv': 7,  // Maldives: 7 digits
            
            // Middle East & North Africa
            'tr': 10, // Turkey: 10 digits
            'il': 9,  // Israel: 9 digits
            'ps': 9,  // Palestine: 9 digits
            'jo': 9,  // Jordan: 9 digits
            'lb': 8,  // Lebanon: 8 digits
            'sy': 9,  // Syria: 9 digits
            'iq': 10, // Iraq: 10 digits
            'ir': 10, // Iran: 10 digits
            'af': 9,  // Afghanistan: 9 digits
            'eg': 10, // Egypt: 10 digits
            'ly': 9,  // Libya: 9 digits
            'tn': 8,  // Tunisia: 8 digits
            'dz': 9,  // Algeria: 9 digits
            'ma': 9,  // Morocco: 9 digits
            'sd': 9,  // Sudan: 9 digits
            'ye': 9,  // Yemen: 9 digits
            
            // Africa
            'ng': 10, // Nigeria: 10 digits
            'gh': 9,  // Ghana: 9 digits
            'ke': 9,  // Kenya: 9 digits
            'tz': 9,  // Tanzania: 9 digits
            'ug': 9,  // Uganda: 9 digits
            'rw': 9,  // Rwanda: 9 digits
            'et': 9,  // Ethiopia: 9 digits
            'ma': 9,  // Morocco: 9 digits
            'dz': 9,  // Algeria: 9 digits
            'tn': 8,  // Tunisia: 8 digits
            'eg': 10, // Egypt: 10 digits
            'zm': 9,  // Zambia: 9 digits
            'zw': 9,  // Zimbabwe: 9 digits
            'bw': 8,  // Botswana: 8 digits
            'mz': 9,  // Mozambique: 9 digits
            'ao': 9,  // Angola: 9 digits
            'cm': 9,  // Cameroon: 9 digits
            'ci': 10, // Côte d'Ivoire: 10 digits
            'sn': 9,  // Senegal: 9 digits
            'ml': 8,  // Mali: 8 digits
            'bf': 8,  // Burkina Faso: 8 digits
            
            // Latin America
            'mx': 10, // Mexico: 10 digits
            'br': 11, // Brazil: 11 digits
            'ar': 10, // Argentina: 10 digits
            'cl': 9,  // Chile: 9 digits
            'co': 10, // Colombia: 10 digits
            'pe': 9,  // Peru: 9 digits
            've': 10, // Venezuela: 10 digits
            'ec': 9,  // Ecuador: 9 digits
            'uy': 8,  // Uruguay: 8 digits
            'py': 9,  // Paraguay: 9 digits
            'bo': 8,  // Bolivia: 8 digits
            'cr': 8,  // Costa Rica: 8 digits
            'pa': 8,  // Panama: 8 digits
            'gt': 8,  // Guatemala: 8 digits
            'hn': 8,  // Honduras: 8 digits
            'sv': 8,  // El Salvador: 8 digits
            'ni': 8,  // Nicaragua: 8 digits
            'bz': 7,  // Belize: 7 digits
            'jm': 10, // Jamaica: 10 digits
            'tt': 10, // Trinidad and Tobago: 10 digits
            'bb': 10, // Barbados: 10 digits
            'bs': 10, // Bahamas: 10 digits
            'do': 10, // Dominican Republic: 10 digits
            'pr': 10, // Puerto Rico: 10 digits
            'cu': 8,  // Cuba: 8 digits
            'ht': 8,  // Haiti: 8 digits
            
            // Eastern Europe & Russia
            'ru': 10, // Russia: 10 digits
            'ua': 9,  // Ukraine: 9 digits
            'by': 9,  // Belarus: 9 digits
            'md': 8,  // Moldova: 8 digits
            'ge': 9,  // Georgia: 9 digits
            'am': 8,  // Armenia: 8 digits
            'az': 9,  // Azerbaijan: 9 digits
            'kz': 10, // Kazakhstan: 10 digits
            'kg': 9,  // Kyrgyzstan: 9 digits
            'tj': 9,  // Tajikistan: 9 digits
            'tm': 8,  // Turkmenistan: 8 digits
            'uz': 9,  // Uzbekistan: 9 digits
            'mn': 8,  // Mongolia: 8 digits
            
            // Nordic & Baltic (additional)
            'is': 7,  // Iceland: 7 digits
            'fo': 6,  // Faroe Islands: 6 digits
            'gl': 6,  // Greenland: 6 digits
            
            // Pacific Islands
            'fj': 7,  // Fiji: 7 digits
            'pg': 8,  // Papua New Guinea: 8 digits
            'vu': 7,  // Vanuatu: 7 digits
            'sb': 7,  // Solomon Islands: 7 digits
            'nc': 6,  // New Caledonia: 6 digits
            'pf': 8,  // French Polynesia: 8 digits
            'ws': 7,  // Samoa: 7 digits
            'to': 7,  // Tonga: 7 digits
            'ki': 8,  // Kiribati: 8 digits
            'tv': 7,  // Tuvalu: 7 digits
            'nr': 7,  // Nauru: 7 digits
            'pw': 7,  // Palau: 7 digits
            'fm': 7,  // Micronesia: 7 digits
            'mh': 7,  // Marshall Islands: 7 digits
        };
        
        // Check if the number is valid using Google's libphonenumber
        let isValid = false;
        let isPossible = false;
        let validationType = null;
        
        try {
            // Check if utils methods are available
            if (formValidator && formValidator.phoneInput && 
                typeof formValidator.phoneInput.isValidNumber === 'function' && 
                typeof formValidator.phoneInput.isPossibleNumber === 'function') {
                isValid = formValidator.phoneInput.isValidNumber();
                isPossible = formValidator.phoneInput.isPossibleNumber();
                if (typeof formValidator.phoneInput.getValidationError === 'function') {
                    validationType = formValidator.phoneInput.getValidationError();
                }
            } else {
                // Utils script not loaded yet, use country-specific validation
                const digitsOnly = phoneValue.replace(/\D/g, '');
                const expectedLength = expectedLengths[countryData.iso2] || 10;
                
                // More specific fallback validation
                if (digitsOnly.length === expectedLength) {
                    isValid = true;
                    isPossible = true;
                } else if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
                    isValid = false;
                    isPossible = true; // Length is possible, but not correct for country
                } else {
                    isValid = false;
                    isPossible = false; // Length is completely invalid
                }
            }
        } catch (err) {
            // If any error occurs, use basic validation
            const digitsOnly = phoneValue.replace(/\D/g, '');
            const expectedLength = expectedLengths[countryData.iso2] || 10;
            
            if (digitsOnly.length === expectedLength) {
                isValid = true;
                isPossible = true;
            } else if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
                isValid = false;
                isPossible = true;
            } else {
                isValid = false;
                isPossible = false;
            }
        }
        
        // Get number of digits entered
        const digitsOnly = phoneValue.replace(/\D/g, '');
        const expectedLength = expectedLengths[countryData.iso2] || 10;

        
        if (!isValid) {
            phoneInputField.classList.add('calc-error');
            if (errorElement) {
                let errorMessage = '';
                
                if (digitsOnly.length < expectedLength) {
                    errorMessage = `Phone number is too short for ${countryData.name}. Expected ${expectedLength} digits, got ${digitsOnly.length}.`;
                } else if (digitsOnly.length > expectedLength) {
                    errorMessage = `Phone number is too long for ${countryData.name}. Expected ${expectedLength} digits, got ${digitsOnly.length}.`;
                } else if (!isPossible) {
                    errorMessage = `Invalid phone number format for ${countryData.name}`;
                } else {
                    errorMessage = `Please enter a valid phone number for ${countryData.name}`;
                }
                
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block !important';
                errorElement.style.visibility = 'visible !important';
                errorElement.style.opacity = '1 !important';
                errorElement.style.color = '#EB5F40';
                errorElement.style.fontSize = '14px';
                errorElement.style.marginTop = '5px';
                
                // Force error to stay visible by setting it again after a delay
                setTimeout(() => {
                    if (errorElement) {
                        errorElement.style.display = 'block !important';
                        errorElement.style.visibility = 'visible !important';
                        errorElement.style.opacity = '1 !important';
                    }
                }, 50);
                
            }
        }
    }

    // Real-time name validation with input restriction
    const nameField = document.getElementById('full-name');
    let nameUserHasInteracted = false;
    let nameFieldHasBeenFocused = false;
    
    // Track when name field gets focus for the first time
    nameField.addEventListener("focus", function() {
        nameFieldHasBeenFocused = true;
    });
    
    nameField.addEventListener("keydown", function(e) {
        nameUserHasInteracted = true;
        
        // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
        if ([8, 9, 27, 13, 35, 36, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1 ||
            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        
        // Allow letters (A-Z, a-z), space, hyphen, apostrophe
        const key = String.fromCharCode(e.keyCode);
        if (!/[A-Za-z\s\-\']/.test(key)) {
            e.preventDefault();
        }
    });

    nameField.addEventListener("input", function(e) {
        nameUserHasInteracted = true;
        
        // Clear any existing error styling during typing (but don't validate yet)
        nameField.classList.remove('calc-error');
        const errorElement = document.getElementById('calc-full-name-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Allow only letters, spaces, hyphens, and apostrophes (backup cleanup)
        const allowedChars = /[A-Za-z\s\-\']/g;
        const value = e.target.value;
        const cleanValue = value.match(allowedChars)?.join('') || '';
        
        if (value !== cleanValue) {
            e.target.value = cleanValue;
        }
        
        // Don't validate during typing - only on blur or form submission
    });

    // Also clear errors on paste but don't validate immediately for name
    nameField.addEventListener("paste", function(e) {
        nameUserHasInteracted = true;
        nameField.classList.remove('error');
        const errorElement = document.getElementById('full-name-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });

    nameField.addEventListener("blur", function() {
        if (nameField.value.trim()) {
            nameFieldHasBeenFocused = true; // Mark as focused when blur happens
            validateNameField();
        }
    });

    function validateNameField() {
        const nameValue = nameField.value.trim();
        const errorElement = document.getElementById('calc-full-name-error');
        
        // Clear previous errors
        nameField.classList.remove('calc-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (!nameValue) return; // Don't validate empty field
        
        // Validate name: only letters, spaces, hyphens, apostrophes, minimum 2 characters
        const namePattern = /^[A-Za-z\s\-\']{2,}$/;

        
        if (!namePattern.test(nameValue)) {
            nameField.classList.add('calc-error');
            if (errorElement) {
                let errorMessage = '';
                if (nameValue.length < 2) {
                    errorMessage = "Name must be at least 2 characters long";
                } else {
                    errorMessage = "Name should contain only letters, spaces, hyphens, and apostrophes";
                }
                
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block !important';
                errorElement.style.visibility = 'visible !important';
                errorElement.style.opacity = '1 !important';
                errorElement.style.color = '#EB5F40';
                errorElement.style.fontSize = '14px';
                errorElement.style.marginTop = '5px';
                
                // Force error to stay visible by setting it again after a delay
                setTimeout(() => {
                    if (errorElement) {
                        errorElement.style.display = 'block !important';
                        errorElement.style.visibility = 'visible !important';
                        errorElement.style.opacity = '1 !important';
                    }
                }, 50);
                
            }
        }
    }

    // Real-time email validation with input restriction
    const emailField = document.getElementById('email');
    let emailUserHasInteracted = false;
    let emailFieldHasBeenFocused = false;
    
    // Track when email field gets focus for the first time
    emailField.addEventListener("focus", function() {
        emailFieldHasBeenFocused = true;
    });

    emailField.addEventListener("input", function(e) {
        emailUserHasInteracted = true;
        
        // Clear any existing error styling during typing (but don't validate yet)
        emailField.classList.remove('calc-error');
        const errorElement = document.getElementById('calc-email-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        // Don't validate during typing - only on blur or form submission
    });

    emailField.addEventListener("blur", function() {
        if (emailField.value.trim()) {
            emailFieldHasBeenFocused = true; // Mark as focused when blur happens
            validateEmailField();
        }
    });

    // Email validation function
    function validateEmailField() {
        const emailValue = emailField.value.trim();
        const errorElement = document.getElementById('calc-email-error');
        
        // Clear previous errors
        emailField.classList.remove('calc-error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        if (!emailValue) return; // Don't validate empty field
        
        // Email validation regex
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        
        if (!emailPattern.test(emailValue)) {
            emailField.classList.add('calc-error');
            if (errorElement) {
                const errorMessage = "Please enter a valid email address";
                
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block !important';
                errorElement.style.visibility = 'visible !important';
                errorElement.style.opacity = '1 !important';
                errorElement.style.color = '#EB5F40';
                errorElement.style.fontSize = '14px';
                errorElement.style.marginTop = '5px';
                
                // Force error to stay visible by setting it again after a delay
                setTimeout(() => {
                    if (errorElement) {
                        errorElement.style.display = 'block !important';
                        errorElement.style.visibility = 'visible !important';
                        errorElement.style.opacity = '1 !important';
                    }
                }, 50);
                
            }
        }
    }

        // Old validation code removed - using centralized FormValidator

    // Get a Call buttons - handles form submission
    function initializeGetCallButtons() {
        const getCallButtons = document.querySelectorAll('.get-call-btn');
        
        getCallButtons.forEach(button => {
            button.addEventListener('click', function(e) {
        e.preventDefault();
        const submitBtn = this;

        if (submitBtn.classList.contains('button-loading')) return;

                // Check if contact form is valid before submitting
                if (!validateContactForm()) {
                    // Scroll to contact form and show errors
                    const contactSection = document.getElementById('personal-details-section');
                    if (contactSection) {
                        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    
                    const fields = [
                        { id: 'full-name', name: 'Full Name' },
                        { id: 'email', name: 'Email' },
                        { id: 'phone', name: 'Phone' }
                    ];
                    
                    fields.forEach(field => {
                        const element = document.getElementById(field.id);
                        const errorElement = document.getElementById(field.id + '-error');
                        
                        if (element && !element.value?.trim()) {
                            element.classList.add('error');
                            if (errorElement) {
                                errorElement.textContent = `${field.name} is required`;
                                errorElement.style.display = 'block';
                            }
                        } else {
                            element?.classList.remove('error');
                            if (errorElement) {
                                errorElement.style.display = 'none';
                            }
                        }
                    });
                    
                    return; // Don't proceed with form submission
                }

 

        submitBtn.classList.add('button-loading');
        submitBtn.disabled = true;

        calculateCosts();

        const fullName = document.getElementById("full-name").value;
        const phone = formValidator.phoneInput.getNumber();
        const email = document.getElementById("email").value;
                const licenseType = document.getElementById("license-type")?.value || "fawri";
        
        const shareholdersCount = parseInt(document.getElementById("shareholders-range").value) || 0;
        // Prepare complete form data for webhook
        const selectedAddons = [];
        document.querySelectorAll('.service-checkbox:checked').forEach(checkbox => selectedAddons.push(checkbox.value));

        // Format business activities properly from the selectedActivities array
        const businessActivitiesText = window.selectedActivities && window.selectedActivities.length > 0 
            ? window.selectedActivities.map(activity => activity["Activity Name"] || activity.Name || activity.Description || '').filter(name => name).join(', ')
            : '';

        const completeFormData = {
            // Basic contact information
            fullName: fullName,
            phone: phone,
            email: email,
            
            // License information
            license_type: licenseType,
            license_duration: document.getElementById("license-duration")?.value || '',
            
            // Business activities
            business_activities: businessActivitiesText,
            selected_activities_count: window.selectedActivities ? window.selectedActivities.length : 0,
            selected_activities_details: window.selectedActivities ? JSON.stringify(window.selectedActivities) : '',
            
            // Shareholders
            shareholders_range: document.getElementById("shareholders-range").value,
            
            // Visa information
            investor_visas: document.getElementById("investor-visa-count")?.value || '0',
            employee_visas: document.getElementById("employee-visa-count")?.value || '0',
            dependency_visas: document.getElementById("dependency-visas")?.value || '0',
            total_visas: (parseInt(document.getElementById("investor-visa-count")?.value || 0) + 
                         parseInt(document.getElementById("employee-visa-count")?.value || 0) + 
                         parseInt(document.getElementById("dependency-visas")?.value || 0)).toString(),
            
            // Add-ons and services
            selected_addons: selectedAddons.join(','),
            selected_addons_count: selectedAddons.length,
            selected_addons_details: JSON.stringify(selectedAddons),
            
            // Change status information
            applicants_inside_uae: document.getElementById("applicants-inside-uae")?.value || '0',
            applicants_outside_uae: document.getElementById("applicants-outside-uae")?.value || '0',
            
            // Cost breakdown for proforma invoice
            total_cost: calculateTotalCost(),
            license_cost: LicenseCost || 0,
            visa_cost: VisaCost || 0,
            addons_cost: window.AddonsComponent || 0,
            business_activities_cost: window.BusinessActivitiesCost || 0,
            change_status_cost: window.ChangeStatusCost || 0,
            office_cost: 0, // Always 0 as per current implementation
            
            // License pricing details
            license_base_cost_per_year: licenseType === "fawri" ? 15000 : 12500,
            license_duration_years: parseInt(document.getElementById("license-duration")?.value || 1),
            license_discount_percentage: parseInt(document.getElementById("license-duration")?.value || 1) > 1 ? 15 : 0,
            additional_shareholders_count: Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6),
            additional_shareholders_cost: Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6) * 2000,
            
            // Detailed cost breakdown for invoice
            cost_breakdown: JSON.stringify({
                license: {
                    type: licenseType,
                    duration: document.getElementById("license-duration")?.value || '',
                    base_cost_per_year: licenseType === "fawri" ? 15000 : 12500,
                    cost_per_unit: licenseType === "fawri" ? 15000 : 12500,
                    duration_years: parseInt(document.getElementById("license-duration")?.value || 1),
                    base_cost_total: (licenseType === "fawri" ? 15000 : 12500) * parseInt(document.getElementById("license-duration")?.value || 1),
                    shareholders_count: parseInt(document.getElementById("shareholders-range")?.value || 1),
                    additional_shareholders: Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6),
                    additional_shareholders_cost: Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6) * 2000,
                    cost_per_additional_shareholder: 2000,
                    subtotal_before_discount: ((licenseType === "fawri" ? 15000 : 12500) * parseInt(document.getElementById("license-duration")?.value || 1)) + (Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6) * 2000),
                    discount_percentage: parseInt(document.getElementById("license-duration")?.value || 1) > 1 ? 15 : 0,
                    discount_amount: parseInt(document.getElementById("license-duration")?.value || 1) > 1 ? (((licenseType === "fawri" ? 15000 : 12500) * parseInt(document.getElementById("license-duration")?.value || 1)) + (Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6) * 2000)) * 0.15 : 0,
                    final_cost: LicenseCost || 0
                },
                visas: {
                    investor: {
                        count: parseInt(document.getElementById("investor-visa-count")?.value || 0),
                        cost_per_unit: 5850,
                        total_cost: parseInt(document.getElementById("investor-visa-count")?.value || 0) * 5850
                    },
                    employee: {
                        count: parseInt(document.getElementById("employee-visa-count")?.value || 0),
                        cost_per_unit: 5350,
                        total_cost: parseInt(document.getElementById("employee-visa-count")?.value || 0) * 5350
                    },
                    dependency: {
                        count: parseInt(document.getElementById("dependency-visas")?.value || 0),
                        cost_per_unit: 6000,
                        total_cost: parseInt(document.getElementById("dependency-visas")?.value || 0) * 6000
                    },
                    immigration_card_fee: 2000,
                    total_visa_cost: VisaCost || 0
                },
                addons: {
                    selected_services: selectedAddons,
                    cost: window.AddonsComponent || 0,
                    details: selectedAddons.map(addon => {
                        const addonCosts = {
                            "bank-account": 1500,
                            "business-card": 240,
                            "company-stamp": 200,
                            "ecommerce-starter": 1000,
                            "medical-emirates-id": 2250,
                            "medical-insurance": 1080,
                            "melite": 6000,
                            "meeting-rooms": 150,
                            "po-box": 1700,
                            "mail-management": 750,
                            "document-translation": 250,
                            "virtual-assistant": 12000,
                            "corporate-tax": 1200,
                            "vat-registration": 1500,
                            "liquidation-report": 1000,
                            "financial-audit-report": 250,
                            "valuation-report": 10000,
                            "bookkeeping": 1000
                        };
                        
                        let cost = addonCosts[addon] || 0;
                        
                        // Medical & Emirates ID applies only to investor and employee visas (no fee for dependents)
                        if (addon === 'medical-emirates-id') {
                            const investorVisas = parseInt(document.getElementById("investor-visa-count")?.value || 0);
                            const employeeVisas = parseInt(document.getElementById("employee-visa-count")?.value || 0);
                            const eligibleVisas = investorVisas + employeeVisas;
                            cost = cost * eligibleVisas;
                        }
                        
                        return {
                            service: addon,
                            cost: cost
                        };
                    })
                },
                business_activities: {
                    selected_activities: window.selectedActivities || [],
                    activity_count: window.selectedActivities ? window.selectedActivities.length : 0,
                    cost: window.BusinessActivitiesCost || 0
                },
                change_status: {
                    inside_uae: parseInt(document.getElementById("applicants-inside-uae")?.value || 0),
                    outside_uae: parseInt(document.getElementById("applicants-outside-uae")?.value || 0),
                    cost_per_inside_applicant: 1500,
                    total_cost: window.ChangeStatusCost || 0
                }
            }),
            
            // Form interaction data
            sections_interacted: JSON.stringify(sectionInteractions),
            
            // Current URL and user information
            current_url: window.location.href,
            user_ip: userLocationInfo.ip,
            user_country: userLocationInfo.country,
            user_country_name: userLocationInfo.country_name,
            user_city: userLocationInfo.city,
            user_region: userLocationInfo.region,
            user_timezone: userLocationInfo.timezone,
            
            // Timestamp
            submission_timestamp: new Date().toISOString(),
            
            // Additional metadata for invoice generation
            invoice_currency: 'AED',
            invoice_currency_symbol: 'د.إ',
            calculation_version: '1.0'
        };

        // Submit to webhook
        submitToWebhook(completeFormData)
            .then(() => {
                // Show success message on successful submission
                setTimeout(function() {
                    // Hide the Get Call buttons and show success messages in their place
                    const firstName = fullName.split(' ')[0] || '';
                    
                    // Show popup success message first
                    showSuccessPopup(firstName);
                    
                    submitBtn.classList.remove('button-loading');
                    submitBtn.disabled = false;
            }, 1000);
            })
            .catch((error) => {
                // Handle submission error
                console.error('Form submission failed:', error);
            submitBtn.classList.remove('button-loading');
            submitBtn.disabled = false;
                alert("There was an issue submitting the form. Please try again.");
            });
    });
        });
    }

    // Section Hiding/Revealing System
    function initializeSectionLocking() {
        try {
            // Hide all sections except contact form on page load
            hideSections();
            
            // Add real-time validation listeners to contact form fields
            const contactFields = ['full-name', 'phone', 'email'];
            contactFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('input', updateSectionLockState);
                    field.addEventListener('change', updateSectionLockState);
                }
            });
            
            // Initial validation check
            updateSectionLockState();
        } catch (err) {
            console.error("Error initializing section locking:", err);
        }
    }

    function validateContactForm() {
        try {
            const fullName = document.getElementById('full-name')?.value?.trim();
            const email = document.getElementById('email')?.value?.trim();
            const phoneField = document.getElementById('phone');
            
            // Strict validation - ALL fields must be valid
            const isNameValid = fullName && fullName.length >= 2 && /^[A-Za-z\s\-\']+$/.test(fullName);
            const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            
            // Phone validation using the FormValidator's phoneInput with strict validation
            let isPhoneValid = false;
            if (phoneField && formValidator && formValidator.phoneInput) {
                try {
                    if (typeof formValidator.phoneInput.isValidNumber === 'function') {
                        // Use strict Google libphonenumber validation
                        isPhoneValid = formValidator.phoneInput.isValidNumber();
                        
                        // Additional check: must have actual phone number content
                        const phoneNumber = formValidator.phoneInput.getNumber();
                        if (!phoneNumber || phoneNumber.length < 8) {
                            isPhoneValid = false;
                        }
                    } else {
                        // Fallback to strict basic validation
                        const phoneValue = phoneField.value?.trim();
                        isPhoneValid = phoneValue && phoneValue.length >= 8 && phoneValue.length <= 15 && /^[\d\s\+\-\(\)]+$/.test(phoneValue);
                    }
                } catch (err) {
                    // Fallback to strict basic validation
                    const phoneValue = phoneField.value?.trim();
                    isPhoneValid = phoneValue && phoneValue.length >= 8 && phoneValue.length <= 15 && /^[\d\s\+\-\(\)]+$/.test(phoneValue);
                }
            } else {
                // If formValidator not available, use strict basic validation
                const phoneValue = phoneField?.value?.trim();
                isPhoneValid = phoneValue && phoneValue.length >= 8 && phoneValue.length <= 15 && /^[\d\s\+\-\(\)]+$/.test(phoneValue);
            }
            
            return isNameValid && isEmailValid && isPhoneValid;
        } catch (err) {
            console.error("Error validating contact form:", err);
            return false;
        }
    }

    function hideSections() {
        try {
            const sectionsToHide = [
                'company-setup-section',
                'business-activities-section', 
                'visa-options-section',
                'change-status-section',
                'addons-section',
                'mobile-sticky-footer'

            ];
            
            sectionsToHide.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.remove('visible', 'revealing');
                    section.classList.add('hidden');
                    
                    // Remove any existing overlays
                    const existingOverlay = section.querySelector('.section-lock-overlay');
                    if (existingOverlay) {
                        existingOverlay.remove();
                    }
                }
            });
        } catch (err) {
            console.error("Error hiding sections:", err);
        }
    }

    function revealSections() {
        try {
            const sectionsToReveal = [
                'company-setup-section',
                'business-activities-section',
                'visa-options-section', 
                'change-status-section',
                'addons-section',
                'mobile-sticky-footer'
            ];
            
            // Show elegant reveal message
            showRevealMessage();
            
            // Reveal sections with staggered animation
            sectionsToReveal.forEach((sectionId, index) => {
                const section = document.getElementById(sectionId);
                if (section && section.classList.contains('hidden')) {
                    setTimeout(() => {
                        section.classList.remove('hidden');
                        section.classList.add('revealing');
                        
                        // After animation completes, mark as visible
                        setTimeout(() => {
                            section.classList.remove('revealing');
                            section.classList.add('visible');
                        }, 800); // Animation duration
                        
                    }, index * 100); // Stagger each section by 100ms
                }
            });
            
            setTimeout(() => {
                calculateCosts();
            }, sectionsToReveal.length * 100 + 400);
            
        } catch (err) {
            console.error("Error revealing sections:", err);
        }
    }
    
    function showRevealMessage() {
        try {
            // Create reveal message overlay
            const messageDiv = document.createElement('div');
            messageDiv.className = 'sections-revealing-message';
            messageDiv.innerHTML = `
                <h3>✨ Setting up your calculator...</h3>
                <p>Your form is validated! Loading calculator sections.</p>
            `;
            
            document.body.appendChild(messageDiv);
            
            // Show message
            setTimeout(() => {
                messageDiv.classList.add('show');
            }, 50);
            
            // Hide and remove message after sections start revealing
            setTimeout(() => {
                messageDiv.classList.remove('show');
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 300);
            }, 1200);
            
        } catch (err) {
            console.error("Error showing reveal message:", err);
        }
    }



    function updateSectionLockState() {
        try {
            const isValid = validateContactForm();
            const contactSection = document.querySelector('.contact-form-section');
            const submitBtn = document.getElementById('submitBtn');
            const progressIndicator = document.getElementById('contact-progress');
            const progressIcon = document.getElementById('progress-icon');
            
            // Update button text based on whether form fields have values
            if (submitBtn && isValid) {
                const nameField = document.getElementById('full-name');
                const emailField = document.getElementById('email');
                const phoneField = document.getElementById('phone');
                const submitBtnSpan = submitBtn.querySelector('span');
                
                if (submitBtnSpan) {
                    const hasValues = nameField?.value?.trim() && emailField?.value?.trim() && phoneField?.value?.trim();
                    if (hasValues && !isContactFormCompleted) {
                        submitBtnSpan.textContent = 'Calculate';
                    } else if (!isContactFormCompleted) {
                        submitBtnSpan.textContent = 'Calculate';
                    }
                }
            }
            
            if (isValid && !isContactFormCompleted) {
                // Form is now valid - reveal sections with elegant animation
                isContactFormCompleted = true;
                
                // Add validation glow to contact form
                if (contactSection) {
                    contactSection.classList.add('validated');
                }
                
                revealSections();
                
                // REVEAL PRICING CONTAINER - when form is validated
                // But don't calculate actual prices until user interacts with sections
                if (!pricingRevealed) {
                    pricingRevealed = true;
                    const summaryContainer = document.querySelector('.sticky-summary-container');
                    const mobileFooter = document.getElementById('mobile-sticky-footer');
                    
                    if (summaryContainer) {
                        summaryContainer.classList.remove('summary-pricing-hidden');
                        summaryContainer.classList.add('summary-pricing-revealed');
                    }
                    
                    if (mobileFooter) {
                        mobileFooter.classList.remove('summary-pricing-hidden');
                        mobileFooter.classList.add('summary-pricing-revealed');
                    }
                    
                    // Reset all section interactions to ensure prices start at 0
                    sectionInteractions = {
                        licenseSection: false,
                        durationSection: false,
                        shareholdersSection: false,
                        businessActivitiesSection: false,
                        visaSection: false,
                        addonsSection: false
                    };
                    calculateCosts();
                    
                }

                
                // Update contact section styling
                if (contactSection) {
                    contactSection.classList.add('completed');
                }
                
                // Update submit button
                if (submitBtn) {
                    submitBtn.classList.add('validated');
                    const submitBtnSpan = submitBtn.querySelector('span');
                    if (submitBtnSpan) {
                        submitBtnSpan.textContent = 'Continue to Calculator';
                    }
                }
                
                // Update progress indicator
                if (progressIndicator) {
                    progressIndicator.classList.add('completed');
                    const progressText = progressIndicator.querySelector('p');
                    if (progressText) {
                        progressText.innerHTML = `
                            <span class="progress-icon" id="progress-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20,6 9,17 4,12"/>
                                </svg>
                            </span>
                            You're all set. Let's explore your business setup options.
                        `;
                    }
                }
                
            } else if (!isValid && isContactFormCompleted) {
                // Form was valid but now invalid - hide sections again
                isContactFormCompleted = false;
                
                // Remove validation glow
                if (contactSection) {
                    contactSection.classList.remove('validated');
                }
                
                hideSections();
                
                // Update contact section styling
                if (contactSection) {
                    contactSection.classList.remove('completed');
                }
                
                // Update submit button
                if (submitBtn) {
                    submitBtn.classList.remove('validated');
                    const submitBtnSpan = submitBtn.querySelector('span');
                    if (submitBtnSpan) {
                        submitBtnSpan.textContent = 'Next';
                    }
                }
                
                // Update progress indicator
                if (progressIndicator) {
                    progressIndicator.classList.remove('completed');
                    const progressText = progressIndicator.querySelector('p');
                    if (progressText) {
                        progressText.innerHTML = `
                            <span class="progress-icon" id="progress-icon"></span>
                            This is a required step to calculate your business setup cost.
                        `;
                    }
                }
            }
        } catch (err) {
            console.error("Error updating section lock state:", err);
        }
    }

    // Countries array removed as we no longer need nationality selection

    document.addEventListener('DOMContentLoaded', function() {
        
        // Reset all section interactions to false on page load
        sectionInteractions = {
            licenseSection: false,
            durationSection: false,
            shareholdersSection: false,
            businessActivitiesSection: false,
            visaSection: false,
            addonsSection: false
        };
        
        // Initialize addons section as collapsed
        const addonsSection = document.getElementById('addons-summary-section');
        if (addonsSection) {
            addonsSection.classList.remove('expanded');
        }
        
        // Prevent Webflow form submission on any form elements
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        });
        
        // Also prevent form submission on Enter key in input fields
        const inputs = document.querySelectorAll('#full-name, #email, #phone');
        inputs.forEach(input => {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    // Trigger our custom validation instead
                    document.getElementById('submitBtn').click();
                    return false;
                }
            });
        });

        if (localStorage.getItem('formHasPartialData') === 'true') {
            try {
                localStorage.removeItem('formHasPartialData');
                localStorage.removeItem('formPartialData');
            } catch (err) {
                console.error("Error clearing localStorage:", err);
            }
        }
        
        updateProgressBar(currentStep);
        updateStepDisplay();
        
        if (currentStep === 1) {
            document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
            document.getElementById('step-1').classList.add('active');
        }
        
        const stepDisplay = document.getElementById("heading-top-right-numbs-steps-1");
        if (stepDisplay) {
            stepDisplay.innerHTML = `<span class="step-word">Step</span> <span id="current-step">1</span>/${displayTotalSteps}`;
        }
        
        updateButtonsDisplay(currentStep);

        // Scroll event listener for addon viewport detection is set up at script load
        
        // Ensure Fawri license is selected by default for calculations
        // But don't mark the section as interacted yet
        const licenseType = 'fawri';
        document.querySelectorAll('.license-card').forEach(card => {
            const isSelected = card.getAttribute('data-license') === licenseType;
            card.classList.toggle('selected', isSelected);
        });
        
        document.querySelectorAll('.select-btn[data-license]').forEach(btn => {
            const isSelected = btn.getAttribute('data-license') === licenseType;
            updateButtonState(btn, isSelected);
        });
        
        // Update hidden input without marking section as interacted
        document.getElementById('license-type').value = licenseType;
        
        // Calculate costs with all sections marked as not interacted
        calculateCosts();
        
        // Trigger initial calculation to populate summary
        calculateCosts();
        
        // DOMContentLoaded initialization complete
        
        checkTaxCompliance();
    });

    // Visa card toggle functionality - handles Yes/No toggle for investor visa
    function toggleVisaCard(visaType) {
        const toggle = document.getElementById(`${visaType === 'dependent' ? 'dependency' : visaType}-visa-toggle`);
        const card = toggle.closest('.visa-card');
        
        if (toggle.checked) {
            // YES state - visa is selected
            card.classList.add('selected');
            
            if (visaType === 'investor') {
                // For investor visa, set to 1 when "Yes" is selected
                document.getElementById('investor-visa-count').value = '1';
            }
        } else {
            // NO state - visa is not selected
            card.classList.remove('selected');
            
            if (visaType === 'investor') {
                // For investor visa, set to 0 when "No" is selected
                document.getElementById('investor-visa-count').value = '0';
            }
        }
        
        // Mark visa section and all previous sections as interacted
        markPreviousSectionsAsInteracted('visaSection');
        
        calculateCosts();
        updateChangeStatusVisibility();
        updateMResidencyVisibility();
        updateInvestorDependentDisclaimer();
    }
    

    
         // Legacy function for backward compatibility
     function toggleVisaOptions(visaType) {
         // This function is kept for any remaining references
         toggleVisaCard(visaType);
     }

     // Make functions globally available for onclick handlers
     window.toggleVisaCard = toggleVisaCard;
    
    function checkTaxCompliance() {
        const corporateTaxChecked = document.getElementById('corporate-tax').checked;
        const vatRegistrationChecked = document.getElementById('vat-registration').checked;
        const warningElement = document.getElementById('tax-compliance-warning');
        const modalWarningElement = document.getElementById('modal-tax-compliance-warning');
        
        const shouldShowWarning = !corporateTaxChecked || !vatRegistrationChecked;
        
        // Update main page warning
        if (warningElement) {
            warningElement.style.display = shouldShowWarning ? 'block' : 'none';
        }
        
        // Update modal warning
        if (modalWarningElement) {
            modalWarningElement.style.display = shouldShowWarning ? 'block' : 'none';
        }
        
        calculateCosts();
    }

    // Toggle inline edit mode for summary items
    function toggleEditMode(editType) {
    // Instead of showing edit forms, navigate to the respective step
    switch(editType) {
        case 'package-type':
            // Navigate to step 2 (Company Setup)
            goToStep(2);
            break;
        case 'business-activities':
            // Navigate to step 3 (Business Activities)
            goToStep(3);
            break;
        case 'visa-info':
            // Navigate to step 4 (Visa Options)
            goToStep(4);
            break;
        // case 'office-type' removed as step 5 was removed
        case 'addons':
            // Navigate to step 5 (Add-ons, previously step 6)
            goToStep(5);
            break;
    }
    
    // Store that we're in edit mode and the original step we came from
    sessionStorage.setItem('editMode', 'true');
    sessionStorage.setItem('returnToStep', '7');
}
    
    // Edit form functions removed as we now navigate to steps directly
    
    // Function to navigate to a specific step
    function goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > totalSteps + 1) {
            return;
        }
        
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show the selected step
        let targetStepId = `step-${stepNumber}`;
        // Special handling for summary step (still using step-7 ID for backward compatibility)
        if (stepNumber === 6) {
            targetStepId = 'step-7';
        }
        
        const targetStep = document.getElementById(targetStepId);
        if (targetStep) {
            targetStep.classList.add('active');
            currentStep = stepNumber;
            
            // Update progress bar
            updateProgressBar(stepNumber);
            
            // If coming from summary page, set edit mode
            if (stepNumber < 6 && !sessionStorage.getItem('editMode') && currentStep !== 1) {
                sessionStorage.setItem('editMode', 'true');
                sessionStorage.setItem('returnToStep', '6'); // Changed from 7 to 6
            }
            
            // If going to the summary step, recalculate costs
            if (stepNumber === 6) { // Changed from 7 to 6
                calculateCosts();
            }
            
            // Update navigation buttons and heading after setting edit mode
            changeHeading(stepNumber);
            updateStepDisplay();
            updateButtonsDisplay(stepNumber);
            
            // Scroll to top of form
            const formContainer = document.querySelector('#MFZ-NewCostCalForm');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth' });
            }
            

        }
    }




    
    document.addEventListener('DOMContentLoaded', function() {
        const placeholder = document.querySelector('#activities-list-placeholder');
        if (placeholder) {
            const existingList = document.querySelector('.activities-list-container');
            if (existingList) placeholder.appendChild(existingList);
        }
        
        const searchInput = document.querySelector('.activity-search-input');
        
        updateSelectionSummary();
        
        const searchResultsDropdown = document.createElement('div');
        searchResultsDropdown.className = 'search-results-dropdown';
        searchResultsDropdown.style.display = 'none';
        
        const searchContainer = document.querySelector('.activity-search-container');
        if (searchContainer) {
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(searchResultsDropdown);
        }
        
        function updateDropdownDimensions() {
            if (searchInput && searchResultsDropdown) {
            searchResultsDropdown.style.width = searchInput.getBoundingClientRect().width + 'px';
            searchResultsDropdown.style.left = searchInput.offsetLeft + 'px';
            }
        }
        
        if (searchInput) {
        updateDropdownDimensions();
        window.addEventListener('resize', updateDropdownDimensions);
        }
        
        let debounceTimer;
        if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            clearTimeout(debounceTimer);
            
            if (searchTerm === '') {
                searchResultsDropdown.style.display = 'none';
                    // Show all cards when search is cleared
                    document.querySelectorAll('.activity-card').forEach(card => card.style.display = 'flex');
                return;
            }
            
            updateDropdownDimensions();
            debounceTimer = setTimeout(() => searchActivities(searchTerm), 300);
            });
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            const searchContainer = document.querySelector('.activity-search-container');
            if (searchContainer && !searchContainer.contains(e.target)) {
                searchResultsDropdown.style.display = 'none';
            }
        });
        });
        
        async function searchActivities(searchTerm) {
        const searchResultsDropdown = document.querySelector('.search-results-dropdown');
        if (!searchResultsDropdown) return;
        
            try {
                searchResultsDropdown.innerHTML = '<div class="loading-results">Searching...</div>';
                searchResultsDropdown.style.display = 'block';
            
            const query = searchTerm === "*" ? 
                supabase.from('Activity List').select('Code, "Activity Name", Category, Group').limit(40) : 
                supabase.from('Activity List').select('Code, "Activity Name", Category, Group')
                    .or(`"Activity Name".ilike.%${searchTerm}%,Code.ilike.%${searchTerm}%`)
                    .limit(100);
            
                const { data, error } = await query;
                if (error) throw error;
            
                displaySearchResults(data);
            } catch (err) {
                console.error('Error searching activities:', err);
                searchResultsDropdown.innerHTML = '<div class="error-results">Error fetching results</div>';
            }
        }
        
        function displaySearchResults(results) {
        const searchResultsDropdown = document.querySelector('.search-results-dropdown');
        if (!searchResultsDropdown) return;
        
            searchResultsDropdown.innerHTML = '';
            
            if (results.length === 0) {
                searchResultsDropdown.innerHTML = '<div class="no-results">No activities found</div>';
                searchResultsDropdown.style.display = 'block';
                return;
            }
            
            results.forEach(activity => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-items';
                
                // Check if activity is already selected
                const isSelected = window.selectedActivities && window.selectedActivities.some(selected => selected.code === activity.Code);
                
                resultItem.innerHTML = `
                    <div class="modal-activity-checkbox ${isSelected ? 'checked' : ''}">
                        <div class="check-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M11.6668 3.5L5.25016 9.91667L2.3335 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                    <div class="modal-activity-info">
                        <span class="modal-activity-code">${activity.Code}</span>
                        <span class="modal-activity-name">${activity["Activity Name"]}</span>
                    </div>
                `;
                resultItem.addEventListener('click', () => selectActivityFromSearch(activity));
                searchResultsDropdown.appendChild(resultItem);
            });
            
            searchResultsDropdown.style.display = 'block';
        }
        
    function selectActivityFromSearch(activity) {
            const groupName = mapCategoryToGroup(activity.Category, activity.Group);
        const groupCard = document.querySelector(`.activity-card[data-group="${groupName}"]`);
        
        if (groupCard) {
            // Make sure group is selected
            if (!groupCard.classList.contains('selected')) {
                toggleActivityGroup(groupCard, true);
            }
            
            // Add activity to selected list
                addActivityToSelected(activity, groupName);
            
            // Update the group card count
            updateActivityCountOnCard(groupName);
            
            // Update selection summary
            updateSelectedGroupsCount();
            
            // Clear search
            const searchInput = document.querySelector('.activity-search-input');
            if (searchInput) {
                    searchInput.value = '';
            }
            const searchResultsDropdown = document.querySelector('.search-results-dropdown');
            if (searchResultsDropdown) {
                    searchResultsDropdown.style.display = 'none';
                }
            
            // Recalculate costs
            calculateCosts();
            }
        }
        
        function mapCategoryToGroup(category, groupNumber) {
        const categoryMapping = {
            'Administrative': 'administrative',
            'Agriculture': 'agriculture', 
            'Art': 'art',
            'Education': 'education',
            'ICT': 'ict',
            'F&B,Rentals': 'F&B,Rentals',
            'Financial': 'financial',
            'HealthCare': 'healthcare',
            'Maintenance': 'maintenance',
            'Services': 'services',
            'Professional': 'professional',
            'Realestate': 'realestate',
            'Sewerage': 'sewerage',
            'Trading': 'trading',
            'Transportation': 'transportation',
            'Waste Collection': 'waste',
            'Manufacturing': 'manufacturing'
        };
        
            let cleanCategory = typeof category === 'string' ? category.trim() : '';
        if (cleanCategory && categoryMapping[cleanCategory]) {
            return categoryMapping[cleanCategory];
        }
        
        // Fallback: check for partial matches
            for (const [key, value] of Object.entries(categoryMapping)) {
            if (cleanCategory && (cleanCategory.includes(key) || cleanCategory.toLowerCase().includes(key.toLowerCase()))) {
                return value;
            }
        }
        
        return 'services'; // Default fallback
        }
        
        function updateSelectionSummary() {
            const groupsSelectedCount = document.getElementById('groups-selected-count');
            const activitiesSelectedCount = document.getElementById('activities-selected-count');
            if (!groupsSelectedCount || !activitiesSelectedCount) return;
            
            const totalActivities = window.selectedActivities.length;
            const activeGroups = new Set(window.selectedActivities.map(a => a.groupName));
            const numActiveGroups = activeGroups.size;
            
            groupsSelectedCount.textContent = numActiveGroups;
            activitiesSelectedCount.textContent = totalActivities;
            
            const feeWarning = document.querySelector('.fee-warning');
            if (feeWarning) {
            feeWarning.style.display = numActiveGroups > 3 ? 'block' : 'none';
        }
    }

    // Function to initialize accordion functionality
    function initAccordion() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        // Make sure all accordions are collapsed by default
        accordionHeaders.forEach(header => {
            header.classList.remove('active');
            const toggleButton = header.querySelector('.accordion-toggle');
            if (toggleButton) {
                toggleButton.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Hide all accordion contents
        document.querySelectorAll('.accordion-content').forEach(content => {
            content.style.display = 'none';
        });
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', function(e) {
                // Don't trigger if clicking on the edit button
                if (e.target.closest('.card-edit-button')) {
                    return;
                }
                
                // Toggle active class
                this.classList.toggle('active');
                
                // Get the content element
                const content = this.nextElementSibling;
                if (content && (content.classList.contains('accordion-content') || content.id === 'business-activities-summary')) {
                    // Toggle display
                    if (this.classList.contains('active')) {
                        content.style.display = content.id === 'business-activities-summary' ? 'flex' : 'block';
                    } else {
                        content.style.display = 'none';
                    }
                }
                
                // Update aria-expanded attribute for accessibility
                const toggleButton = this.querySelector('.accordion-toggle');
                if (toggleButton) {
                    const isExpanded = this.classList.contains('active');
                    toggleButton.setAttribute('aria-expanded', isExpanded);
                }
            });
        });
        
        // Add click handler specifically for the toggle buttons
        const toggleButtons = document.querySelectorAll('.accordion-toggle');
        toggleButtons.forEach(button => {
            button.setAttribute('aria-expanded', 'false');
            button.addEventListener('click', function(e) {
                // Prevent event bubbling to the header
                e.stopPropagation();
                
                const header = this.closest('.accordion-header');
                if (header) {
                    header.classList.toggle('active');
                    
                    // Get the content element
                    const content = header.nextElementSibling;
                    if (content && (content.classList.contains('accordion-content') || content.id === 'business-activities-summary')) {
                        // Toggle display
                        if (header.classList.contains('active')) {
                            content.style.display = content.id === 'business-activities-summary' ? 'flex' : 'block';
                        } else {
                            content.style.display = 'none';
                        }
                    }
                    
                    // Update aria-expanded attribute
                    const isExpanded = header.classList.contains('active');
                    this.setAttribute('aria-expanded', isExpanded);
                }
            });
        });
    }

    // Update accordion state on window resize
    window.addEventListener('resize', function() {
        
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            const content = header.nextElementSibling;
            if (content && (content.classList.contains('accordion-content') || content.id === 'business-activities-summary')) {
                if (header.classList.contains('active')) {
                    // If accordion is active, show the content
                    content.style.display = content.id === 'business-activities-summary' ? 'flex' : 'block';
                } else {
                    // If accordion is not active, hide the content
                    content.style.display = 'none';
                }
            }
        });
    });

    // Select visa card function (for employee and dependent visas) - unified approach
    function selectVisaCard(visaType) {
        if (visaType === 'shareholders') {
            // Special handling for shareholders since it's not a visa card
            const visaFooter = document.querySelector('.license-option-group:has(#shareholders-selected-controls) .visa-footer');
            const selectBtn = visaFooter?.querySelector('.select-btn');
            const selectedControls = document.getElementById('shareholders-selected-controls');
            const quantityValue = document.getElementById('shareholders-quantity');
            const selectedBtn = selectedControls?.querySelector('.select-btn');
            
            if (selectBtn && selectedControls) {
                selectBtn.style.display = 'none';
                selectedControls.style.display = 'flex';
                
                // Update the selected button to use unified styling
                if (selectedBtn) {
                    updateButtonState(selectedBtn, true);
                }
                
                // Set initial quantity to 1
                if (quantityValue) {
                    quantityValue.textContent = '1';
                }
                
                document.getElementById('shareholders-range').value = 1;
                
                // Mark shareholders section as interacted
                markPreviousSectionsAsInteracted('shareholdersSection');
                
                // Trigger calculation
                calculateCosts();
            }
            return;
        }
        
        const card = document.querySelector(`[data-visa="${visaType}"]`);
        const selectBtn = card?.querySelector('.select-btn');
        const selectedControls = document.getElementById(`${visaType}-selected-controls`);
        const quantityValue = document.getElementById(`${visaType}-quantity`);
        const selectedBtn = selectedControls?.querySelector('.select-btn');
        
        if (card && selectBtn && selectedControls) {
            // Select the card using unified styling
            card.classList.add('selected');
            selectBtn.style.display = 'none';
            selectedControls.style.display = 'flex';
            
            // Update the selected button to use unified styling
            if (selectedBtn) {
                updateButtonState(selectedBtn, true);
            }
            
            // Set initial quantity to 1
            if (quantityValue) {
                quantityValue.textContent = '1';
            }
            
            // Update hidden inputs with initial quantity
            if (visaType === 'employee') {
                document.getElementById('employee-visa-count').value = 1;
                // Ensure plus button is enabled and info card is hidden when starting at 1
                const plusBtn = selectedControls.querySelector('.quantity-btn.plus');
                if (plusBtn) {
                    plusBtn.disabled = false;
                }
                hideEmployeeVisaLimitInfo();
            } else if (visaType === 'dependent') {
                document.getElementById('dependency-visas').value = 1;
            }
            
            // Mark visa section and all previous sections as interacted
            markPreviousSectionsAsInteracted('visaSection');
            
            // Trigger calculation
            calculateCosts();
            updateChangeStatusVisibility();
        updateMResidencyVisibility();
        }
    }

    // Adjust visa quantity with +/- buttons (unified approach)
    function adjustVisaQuantity(visaType, change) {
        const quantityElement = document.getElementById(`${visaType}-quantity`);
        const currentQuantity = parseInt(quantityElement.textContent) || 1;
        
        // Set maximum limits for different visa types
        let maxQuantity = Infinity;
        if (visaType === 'employee') {
            maxQuantity = 6; // Limit employee visas to 6
        }
        
        const newQuantity = Math.max(1, Math.min(maxQuantity, currentQuantity + change));
        
        quantityElement.textContent = newQuantity;
        
        // Update hidden inputs
        if (visaType === 'employee') {
            document.getElementById('employee-visa-count').value = newQuantity;
        } else if (visaType === 'dependent') {
            document.getElementById('dependency-visas').value = newQuantity;
        }
        
        // Update minus button state
        const minusBtn = quantityElement.parentElement.querySelector('.quantity-btn.minus');
        if (newQuantity <= 1) {
            minusBtn.disabled = true;
        } else {
            minusBtn.disabled = false;
        }
        
        // Update plus button state for employee visas when limit is reached
        const plusBtn = quantityElement.parentElement.querySelector('.quantity-btn.plus');
        if (visaType === 'employee') {
            if (newQuantity >= 6) {
                plusBtn.disabled = true;
                showEmployeeVisaLimitInfo();
            } else {
                plusBtn.disabled = false;
                hideEmployeeVisaLimitInfo();
            }
        }
        
        // Mark visa section and all previous sections as interacted
        markPreviousSectionsAsInteracted('visaSection');
        
        calculateCosts();
        updateChangeStatusVisibility();
        updateMResidencyVisibility();
        updateInvestorDependentDisclaimer();
    }

    // Shareholder quantity selector functions
    function toggleShareholderSelector() {
        // This function can be used if we want to add toggle functionality later
        // For now, shareholders are always selected (similar to default services)
    }

    function initializeShareholderSelector() {
        // Initialize the minus button state - shareholders start unselected
        const minusBtn = document.querySelector('#shareholders-selected-controls .quantity-btn.minus');
        const quantityElement = document.getElementById('shareholders-quantity');
        const selectedBtn = document.querySelector('#shareholders-selected-controls .select-btn');
        
        if (minusBtn && quantityElement) {
            const currentQuantity = parseInt(quantityElement.textContent) || 1;
            minusBtn.disabled = currentQuantity <= 1;
        }
        
        // Ensure shareholders start in unselected state
        if (selectedBtn) {
            updateButtonState(selectedBtn, false);
        }
    }

    function initializeEditButtons() {
        // Map edit button aria-labels to their corresponding section IDs
        const editButtonMap = {
            'Edit company setup': 'company-setup-section',
            'Edit business activities': 'business-activities-section', 
            'Edit visa selections': 'visa-options-section',
            'Edit additional services': 'addons-section'
        };

        // Add click listeners to all edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const ariaLabel = this.getAttribute('aria-label');
                const targetSectionId = editButtonMap[ariaLabel];
                
                if (targetSectionId) {
                    scrollToSection(targetSectionId);
                } else {
                    console.warn('No section mapping found for edit button:', ariaLabel);
                }
            });
        });
    }

    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        
        if (!section) {
            console.warn('Section not found:', sectionId);
            return;
        }

        // Close mobile sheet if it's open (using proper state management)
        let wasSheetOpen = false;
        if (typeof window.isMobileSheetOpen === 'function' && window.isMobileSheetOpen()) {
            wasSheetOpen = true;
            if (typeof window.closeMobileSheet === 'function') {
                window.closeMobileSheet();
            }
        } else {
            // Fallback: Check DOM state if functions aren't available yet
            const summarySheet = document.querySelector('.sticky-summary-container');
            if (summarySheet && summarySheet.classList.contains('sheet-open')) {
                wasSheetOpen = true;
                // Don't manually close here - let the sheet initialize properly
            }
        }

        // Wait a bit for the sheet to close, then scroll to section
        const delay = wasSheetOpen ? 300 : 0;
        setTimeout(() => {
            const headerOffset = 100; // Adjust based on your header height
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, delay);
    }

    function adjustShareholderQuantity(change) {
        // If shareholders are not selected, select them first
        const selectedControls = document.getElementById('shareholders-selected-controls');
        const selectBtn = document.querySelector('.license-option-group:has(#shareholders-selected-controls) .visa-footer .select-btn');
        
        if (selectedControls && selectedControls.style.display === 'none') {
            selectVisaCard('shareholders');
        }
        
        const quantityElement = document.getElementById('shareholders-quantity');
        const currentQuantity = parseInt(quantityElement.textContent) || 1;
        
        // Minimum 1 shareholder, no maximum limit (but pricing changes after 6)
        const newQuantity = Math.max(1, currentQuantity + change);
        
        quantityElement.textContent = newQuantity;
        
        // Update hidden input
        document.getElementById('shareholders-range').value = newQuantity;
        
        // Update minus button state
        const minusBtn = quantityElement.parentElement.querySelector('.quantity-btn.minus');
        if (newQuantity <= 1) {
            minusBtn.disabled = true;
        } else {
            minusBtn.disabled = false;
        }
        
        // Mark shareholders section as interacted
        markPreviousSectionsAsInteracted('shareholdersSection');
        
        // Trigger calculation
        calculateCosts();
    }

    // Employee visa limit info functions
    function showEmployeeVisaLimitInfo() {
        // Check if info card already exists
        let infoCard = document.getElementById('employee-visa-limit-info');
        
        if (!infoCard) {
            // Create the info card
            infoCard = document.createElement('div');
            infoCard.id = 'employee-visa-limit-info';
            infoCard.className = 'info-section employee-visa-limit-info';
            infoCard.innerHTML = `
                <div class="info-icon">
                    <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.433594 8C0.433594 5.83933 0.433594 4.75899 0.723797 3.88643C1.28872 2.18788 2.62147 0.855126 4.32003 0.290203C5.19258 0 6.27292 0 8.43359 0C10.5943 0 11.6746 0 12.5472 0.290203C14.2457 0.855126 15.5785 2.18788 16.1434 3.88643C16.4336 4.75899 16.4336 5.83933 16.4336 8C16.4336 10.1607 16.4336 11.241 16.1434 12.1136C15.5785 13.8121 14.2457 15.1449 12.5472 15.7098C11.6746 16 10.5943 16 8.43359 16C6.27292 16 5.19258 16 4.32003 15.7098C2.62147 15.1449 1.28872 13.8121 0.723797 12.1136C0.433594 11.241 0.433594 10.1607 0.433594 8Z" fill="#2A3AC6"/>
                        <path d="M8.43349 3.55447C5.98904 3.55447 3.98904 5.55447 3.98904 7.99891C3.98904 10.4434 5.98904 12.4434 8.43349 12.4434C10.8779 12.4434 12.8779 10.4434 12.8779 7.99892C12.8779 5.55447 10.8779 3.55447 8.43349 3.55447Z" stroke="#FAFAFA" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8.43359 9.77734L8.43359 7.55512" stroke="#FAFAFA" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8.43604 6.22266L8.43204 6.22266" stroke="#FAFAFA" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <p class="info-text">To apply for more than 6 visas, contact our team.</p>
            `;
            
            // Insert the info card after the visa description within the employee visa card
            const employeeCard = document.querySelector('[data-visa="employee"]');
            const visaDescription = employeeCard ? employeeCard.querySelector('.visa-description') : null;
            if (visaDescription) {
                visaDescription.parentNode.insertBefore(infoCard, visaDescription.nextSibling);
            }
        }
        
        // Show the info card with animation
        infoCard.style.display = 'flex';
        infoCard.style.opacity = '0';
        infoCard.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            infoCard.style.transition = 'all 0.3s ease';
            infoCard.style.opacity = '1';
            infoCard.style.transform = 'translateY(0)';
        });
    }

    function hideEmployeeVisaLimitInfo() {
        const infoCard = document.getElementById('employee-visa-limit-info');
        if (infoCard) {
            infoCard.style.transition = 'all 0.3s ease';
            infoCard.style.opacity = '0';
            infoCard.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                infoCard.style.display = 'none';
            }, 300);
        }
    }

    // Make functions globally available
    window.selectVisaCard = selectVisaCard;
    window.deselectVisaCard = deselectVisaCard;
    window.adjustVisaQuantity = adjustVisaQuantity;
    window.adjustStatusCount = adjustStatusCount;
    window.scrollToSection = scrollToSection;
    


    // Deselect visa card function - unified approach
    function deselectVisaCard(visaType) {
        if (visaType === 'shareholders') {
            // Special handling for shareholders since it's not a visa card
            const visaFooter = document.querySelector('.license-option-group:has(#shareholders-selected-controls) .visa-footer');
            const selectBtn = visaFooter?.querySelector('.select-btn');
            const selectedControls = document.getElementById('shareholders-selected-controls');
            const quantityValue = document.getElementById('shareholders-quantity');
            const selectedBtn = selectedControls?.querySelector('.select-btn');
            
            if (selectBtn && selectedControls) {
                selectBtn.style.display = 'block';
                selectedControls.style.display = 'none';
                
                // Reset the selected button to use unified styling
                if (selectedBtn) {
                    updateButtonState(selectedBtn, false);
                }
                
                // Reset quantity to 1
                if (quantityValue) {
                    quantityValue.textContent = '1';
                }
                
                document.getElementById('shareholders-range').value = 1;
                
                // Trigger calculation
                calculateCosts();
            }
            return;
        }
        
        const card = document.querySelector(`[data-visa="${visaType}"]`);
        const selectBtn = card?.querySelector('.select-btn');
        const selectedControls = document.getElementById(`${visaType}-selected-controls`);
        const quantityValue = document.getElementById(`${visaType}-quantity`);
        const selectedBtn = selectedControls?.querySelector('.select-btn');
        
        if (card && selectBtn && selectedControls) {
            // Deselect the card using unified styling
            card.classList.remove('selected');
            selectBtn.style.display = 'block';
            selectedControls.style.display = 'none';
            
            // Reset the selected button to use unified styling
            if (selectedBtn) {
                updateButtonState(selectedBtn, false);
            }
            
            // Reset quantity to 1
            if (quantityValue) {
                quantityValue.textContent = '1';
            }
            
            // Update hidden input
            if (visaType === 'employee') {
                document.getElementById('employee-visa-count').value = 0;
                // Hide employee visa limit info when deselected
                hideEmployeeVisaLimitInfo();
            } else if (visaType === 'dependent') {
                document.getElementById('dependency-visas').value = 0;
            }
            
            // Trigger calculation
            calculateCosts();
            updateChangeStatusVisibility();
            updateMResidencyVisibility();
            updateInvestorDependentDisclaimer();
        }
    }

    // Change Status functionality
    function adjustStatusCount(type, change) {
        
        if (type !== 'inside') return; // Only handle inside UAE adjustments
        
        const quantityElement = document.getElementById('inside-quantity');
        
        if (!quantityElement) {
            console.error('inside-quantity element not found!');
            return;
        }
        
        const currentCount = parseInt(quantityElement.textContent) || 0;
        
        // Get total visa count to set maximum
        const totalVisaCount = getTotalVisaCount();
        
        // For inside UAE, can't exceed total visas and can't go below 0
        const newCount = Math.max(0, Math.min(totalVisaCount, currentCount + change));
        
        // Calculate outside count automatically
        const outsideCount = totalVisaCount - newCount;
        const outsideCountElement = document.getElementById('outside-count');
        
        
        // Update the display with multiple approaches to ensure it works
        quantityElement.textContent = newCount.toString();
        quantityElement.innerHTML = newCount.toString();
        
        if (outsideCountElement) {
            outsideCountElement.textContent = outsideCount.toString();
            outsideCountElement.innerHTML = outsideCount.toString();
        }
        
        // Update hidden inputs
        document.getElementById('applicants-inside-uae').value = newCount;
        document.getElementById('applicants-outside-uae').value = outsideCount;
        
        // Force immediate DOM update
        quantityElement.offsetHeight; // Force reflow
        if (outsideCountElement) {
            outsideCountElement.offsetHeight; // Force reflow
        }
        
        
        // Update button states
        updateStatusButtonStates();
        
        // Trigger calculation
        calculateCosts();
    }

    function getTotalVisaCount() {
        const investorVisas = parseInt(document.getElementById('investor-visa-count').value) || 0;
        const employeeVisas = parseInt(document.getElementById('employee-visa-count').value) || 0;
        // Dependency visas don't require change of status, so they're excluded
        return investorVisas + employeeVisas;
    }

    function updateStatusButtonStates() {
        const insideQuantityElement = document.getElementById('inside-quantity');
        if (!insideQuantityElement) return;
        
        const insideCount = parseInt(insideQuantityElement.textContent) || 0;
        const totalVisaCount = getTotalVisaCount();
        
        // Update minus button state
        const minusBtn = document.querySelector('#inside-selected-controls .quantity-btn.minus');
        if (minusBtn) {
            minusBtn.disabled = insideCount <= 0;
            minusBtn.classList.toggle('disabled', insideCount <= 0);
        }
        
        // Update plus button state
        const plusBtn = document.querySelector('#inside-selected-controls .quantity-btn.plus');
        if (plusBtn) {
            plusBtn.disabled = insideCount >= totalVisaCount;
            plusBtn.classList.toggle('disabled', insideCount >= totalVisaCount);
        }
        
    }

    function updateChangeStatusVisibility() {
        const totalVisaCount = getTotalVisaCount();
        const changeStatusSection = document.getElementById('change-status-section');
        
        
        if (totalVisaCount > 0) {
            const wasHidden = changeStatusSection.style.display === 'none';
            changeStatusSection.style.display = 'flex';
            
            // Only reset counts when showing for the first time or when total visa count changes
            if (wasHidden) {
                document.getElementById('inside-quantity').textContent = '0';
                document.getElementById('outside-count').textContent = totalVisaCount;
                document.getElementById('applicants-inside-uae').value = '0';
                document.getElementById('applicants-outside-uae').value = totalVisaCount;
                updateStatusButtonStates();
                
                // Setup event listeners for change status buttons
                setupChangeStatusEventListeners();
            } else {
                // Just update the outside count to match current total if section already visible
                const currentInside = parseInt(document.getElementById('inside-quantity').textContent) || 0;
                const newOutside = totalVisaCount - currentInside;
                document.getElementById('outside-count').textContent = newOutside;
                document.getElementById('applicants-outside-uae').value = newOutside;
            }
        } else {
            changeStatusSection.style.display = 'none';
            // Reset counts when hiding
            document.getElementById('inside-quantity').textContent = '0';
            document.getElementById('outside-count').textContent = '0';
            document.getElementById('applicants-inside-uae').value = '0';
            document.getElementById('applicants-outside-uae').value = '0';
        }
    }

    function updateMResidencyVisibility() {
        const investorVisas = parseInt(document.getElementById('investor-visa-count').value) || 0;
        const employeeVisas = parseInt(document.getElementById('employee-visa-count').value) || 0;
        const dependencyVisas = parseInt(document.getElementById('dependency-visas').value) || 0;
        const totalVisas = investorVisas + employeeVisas + dependencyVisas;
        
        // Find the mResidency addon category card by ID
        const mResidencyCard = document.getElementById('mresidency-addon-card');
        if (mResidencyCard) {
            mResidencyCard.style.display = totalVisas > 0 ? 'block' : 'none';
        }
    }

    function updateInvestorDependentDisclaimer() {
        const investorVisas = parseInt(document.getElementById('investor-visa-count').value) || 0;
        const dependencyVisas = parseInt(document.getElementById('dependency-visas').value) || 0;
        
        const disclaimer = document.getElementById('investor-dependent-disclaimer');
        if (disclaimer) {
            disclaimer.style.display = (investorVisas > 0 && dependencyVisas > 0) ? 'flex' : 'none';
        }
    }

    function initializeChangeStatusEventListeners() {
        // Use event delegation to handle clicks on change status buttons
        document.addEventListener('click', function(e) {
            // Check if clicked element is a change status quantity button
            if (e.target.matches('#inside-selected-controls .quantity-btn.minus')) {
                e.preventDefault();
                e.stopPropagation();
                adjustStatusCount('inside', -1);
            } else if (e.target.matches('#inside-selected-controls .quantity-btn.plus')) {
                e.preventDefault();
                e.stopPropagation();
                adjustStatusCount('inside', 1);
            }
        });
    }

    function setupChangeStatusEventListeners() {
        // This function is now just for updating button states
        updateStatusButtonStates();
    }

    // Make function globally available
    window.deselectVisaCard = deselectVisaCard;

    // Unified function to create select/selected button with consistent styling
    function createSelectedButton() {
        return '<span class="check-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9.2806 0.666016C4.68893 0.666016 0.947266 4.40768 0.947266 8.99935C0.947266 13.591 4.68893 17.3327 9.2806 17.3327C13.8723 17.3327 17.6139 13.591 17.6139 8.99935C17.6139 4.40768 13.8723 0.666016 9.2806 0.666016ZM13.2639 7.08268L8.53893 11.8077C8.42227 11.9243 8.26393 11.991 8.09727 11.991C7.9306 11.991 7.77227 11.9243 7.6556 11.8077L5.29727 9.44935C5.0556 9.20768 5.0556 8.80768 5.29727 8.56602C5.53893 8.32435 5.93893 8.32435 6.1806 8.56602L8.09727 10.4827L12.3806 6.19935C12.6223 5.95768 13.0223 5.95768 13.2639 6.19935C13.5056 6.44102 13.5056 6.83268 13.2639 7.08268Z" fill="white"/></svg></span>Selected';
    }

    // Unified function to handle button state changes for consistency
    function updateButtonState(button, isSelected) {
        if (isSelected) {
            button.classList.add('selected');
            button.innerHTML = createSelectedButton();
        } else {
            button.classList.remove('selected');
            button.textContent = 'Select';
        }
    }

    function updateGrandTotal(totalCost) {
        const totalCostDisplay = document.getElementById('total-cost-display');
        const mobileGrandTotalPrice = document.getElementById('mobile-grand-total-price');
        const formattedTotal = `AED ${totalCost.toLocaleString()}`;

        if (totalCostDisplay) {
            totalCostDisplay.textContent = formattedTotal;
        }
        if (mobileGrandTotalPrice) {
            mobileGrandTotalPrice.textContent = formattedTotal;
        }
    }

    // Function specifically to update mobile price display




    // Mobile Auto-Scroll Functionality
    function initializeMobileAutoScroll() {
        // Only run on mobile devices
        if (window.innerWidth > 768) return;
        
        // Function to scroll to next card by ID
        const scrollToNextCard = (currentElement, cardSelector) => {
            const allCards = Array.from(document.querySelectorAll(cardSelector));
            const currentIndex = allCards.indexOf(currentElement);
            
            if (currentIndex >= 0 && currentIndex < allCards.length - 1) {
                const nextCard = allCards[currentIndex + 1];
                if (nextCard) {
                    setTimeout(() => {
                        const headerOffset = 180;
                        const elementPosition = nextCard.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            }
        };
        
        // Special scroll for form completion - go to next section
        const scrollToNextSection = () => {
            const companySetupSection = document.getElementById('company-setup-section');
            if (companySetupSection && !companySetupSection.classList.contains('locked')) {
                setTimeout(() => {
                    const headerOffset = 20;
                    const elementPosition = companySetupSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 500);
            }
        };
        
        // Personal Details Section - scroll to next section after form validation
        const personalDetailsSection = document.getElementById('personal-details-section');
        if (personalDetailsSection) {
            const inputs = personalDetailsSection.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    if (validateContactForm() && isContactFormCompleted) {
                        scrollToNextSection();
                    }
                });
            });
        }
        
        // Company Setup Section - License Cards
        const licenseCards = document.querySelectorAll('.license-card');
        licenseCards.forEach(card => {
            card.addEventListener('click', () => {
                scrollToNextCard(card, '.license-card');
            });
        });
        
        // License Select Buttons
        const selectButtons = document.querySelectorAll('.select-btn');
        selectButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Scroll to duration options after selecting a license
                const durationOptions = document.getElementById('duration-options');
                if (durationOptions) {
                    setTimeout(() => {
                        const headerOffset = 80;
                        const elementPosition = durationOptions.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            });
        });
        
        // Track user interactions with duration and shareholders
        let durationInteracted = false;
        let shareholdersInteracted = false;
        
        // Function to check if both sections have been interacted with
        const checkBothSectionsInteracted = () => {
            if (durationInteracted && shareholdersInteracted) {
                const businessActivitiesSection = document.getElementById('business-activities-section');
                if (businessActivitiesSection && !businessActivitiesSection.classList.contains('locked')) {
                    setTimeout(() => {
                        const headerOffset = 80;
                        const elementPosition = businessActivitiesSection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            }
        };
        
        // Duration Buttons - mark as interacted and check if ready to scroll
        const durationButtons = document.querySelectorAll('#duration-options .pill-option');
        durationButtons.forEach(button => {
            button.addEventListener('click', () => {
                durationInteracted = true;
                // Don't immediately scroll, just scroll to shareholders section
                const shareholdersSection = document.getElementById('shareholders-selected-controls');
                if (shareholdersSection && !shareholdersInteracted) {
                    setTimeout(() => {
                        const headerOffset = 80;
                        const elementPosition = shareholdersSection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 300);
                } else {
                    // If shareholders already interacted, check if ready for business activities
                    checkBothSectionsInteracted();
                }
            });
        });
        
        // Shareholders Buttons - mark as interacted and check if ready to scroll
        // Use event delegation since these controls might be dynamically shown/hidden
        document.addEventListener('click', (e) => {
            if (e.target.matches('#shareholders-selected-controls .quantity-btn')) {
                shareholdersInteracted = true;
                // Check if both sections have been interacted with
                checkBothSectionsInteracted();
            }
        });
        
        // Also track shareholder selection button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.select-btn[data-visa="shareholders"]')) {
                shareholdersInteracted = true;
                checkBothSectionsInteracted();
            }
        });
        
        // Business Activities Section - scroll to visa section after activity selection
        // Note: Activity cards are dynamically generated, so we need to use event delegation
        const businessActivitiesSection = document.getElementById('business-activities-section');
        if (businessActivitiesSection) {
            businessActivitiesSection.addEventListener('click', (e) => {
                // Check if clicked element is an activity card
                const activityCard = e.target.closest('.activity-card');
                if (activityCard) {
                    // Check if any activities are selected after a short delay (to allow selection to complete)
                    setTimeout(() => {
                        if (window.selectedActivities && window.selectedActivities.length > 0) {
                            const visaOptionsSection = document.getElementById('visa-options-section');
                            if (visaOptionsSection && !visaOptionsSection.classList.contains('locked')) {
                                setTimeout(() => {
                                    const headerOffset = 80;
                                    const elementPosition = visaOptionsSection.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: 'smooth'
                                    });
                                }, 300);
                            }
                        }
                    }, 100);
                }
            });
        }
        
        // Activity modal close - scroll to visa section after modal interaction
        const activityModal = document.getElementById('activity-search-modal');
        if (activityModal) {
            const modalCloseHandler = () => {
                // Check if any activities are selected after modal closes
                setTimeout(() => {
                    if (window.selectedActivities && window.selectedActivities.length > 0) {
                        const visaOptionsSection = document.getElementById('visa-options-section');
                        if (visaOptionsSection && !visaOptionsSection.classList.contains('locked')) {
                            setTimeout(() => {
                                const headerOffset = 80;
                                const elementPosition = visaOptionsSection.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth'
                                });
                            }, 300);
                        }
                    }
                }, 200);
            };
            
            // Add event listeners for modal close
            const closeButton = activityModal.querySelector('.close-btn, .close');
            const doneButton = activityModal.querySelector('#activity-done-btn');
            if (closeButton) closeButton.addEventListener('click', modalCloseHandler);
            if (doneButton) doneButton.addEventListener('click', modalCloseHandler);
        }
        
        // Visa Options Section - scroll to next visa card or change status section
        const visaCards = document.querySelectorAll('.visa-card:not(.change-status-card)');
        visaCards.forEach(card => {
            card.addEventListener('click', () => {
                const allVisaCards = Array.from(document.querySelectorAll('.visa-card:not(.change-status-card)'));
                const currentIndex = allVisaCards.indexOf(card);
                
                // If this is the last visa card, scroll to change status section
                if (currentIndex === allVisaCards.length - 1) {
                    const changeStatusSection = document.getElementById('change-status-section');
                    if (changeStatusSection && !changeStatusSection.classList.contains('locked')) {
                        setTimeout(() => {
                            const headerOffset = 80;
                            const elementPosition = changeStatusSection.getBoundingClientRect().top;
                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }, 300);
                    }
                } else {
                    // Not the last card, scroll to next visa card
                    scrollToNextCard(card, '.visa-card:not(.change-status-card)');
                }
            });
        });
        
        // Visa Toggle Switches
        const visaToggles = document.querySelectorAll('.visa-toggle-switch input');
        visaToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const visaCard = toggle.closest('.visa-card');
                if (visaCard) {
                    const allVisaCards = Array.from(document.querySelectorAll('.visa-card:not(.change-status-card)'));
                    const currentIndex = allVisaCards.indexOf(visaCard);
                    
                    // If this is the last visa card, scroll to change status section
                    if (currentIndex === allVisaCards.length - 1) {
                        const changeStatusSection = document.getElementById('change-status-section');
                        if (changeStatusSection && !changeStatusSection.classList.contains('locked')) {
                            setTimeout(() => {
                                const headerOffset = 80;
                                const elementPosition = changeStatusSection.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth'
                            });
                            }, 300);
                        }
                    } else {
                        // Not the last card, scroll to next visa card
                        scrollToNextCard(visaCard, '.visa-card:not(.change-status-card)');
                    }
                }
            });
        });
        
        // Change Status Section - quantity buttons
        const quantityButtons = document.querySelectorAll('.quantity-btn');
        quantityButtons.forEach(button => {
            button.addEventListener('click', () => {
                const addonsSection = document.getElementById('addons-section');
                if (addonsSection && !addonsSection.classList.contains('locked')) {
                    setTimeout(() => {
                        const headerOffset = 80;
                        const elementPosition = addonsSection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 300);
                }
            });
        });
        
        // Add-ons Section - scroll to next addon category
        const addonCategories = document.querySelectorAll('.addon-category-card');
        addonCategories.forEach(category => {
            category.addEventListener('click', () => {
                scrollToNextCard(category, '.addon-category-card');
            });
        });
        
        // Service selection within addons
        const serviceCheckboxes = document.querySelectorAll('.addons-container input[type="checkbox"]');
        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const categoryCard = checkbox.closest('.addon-category-card');
                if (categoryCard) {
                    scrollToNextCard(categoryCard, '.addon-category-card');
                }
            });
        });
    }

    function initializeBackToTopButton() {
                try {
            const backToTopBtn = document.getElementById('back-to-top-btn');
            const progressRing = document.querySelector('.progress-ring-progress');
            const contactSection = document.getElementById('personal-details-section');
            
            if (!backToTopBtn || !progressRing || !contactSection) {
                return;
            }
            
            // Calculate the circumference of the progress ring
            const radius = 28; // From CSS - updated for border positioning
            const circumference = 2 * Math.PI * radius;
            
            // Set up initial state
            progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
            progressRing.style.strokeDashoffset = circumference;
        
        // Function to update progress based on scroll
        const updateProgress = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const calculatorSection = document.getElementById('MFZ-NewCostCalForm');
            
            if (!calculatorSection) return;
            
            // Get calculator section boundaries
            const sectionRect = calculatorSection.getBoundingClientRect();
            const sectionTop = sectionRect.top + scrollTop;
            const sectionBottom = sectionTop + sectionRect.height;
            
            // Check if user is within the calculator section
            const isInSection = scrollTop >= sectionTop - 100 && scrollTop < sectionBottom - 100;
            const isMobile = window.innerWidth <= 768;
            
            if (isInSection && isMobile) {
                // Calculate progress within the calculator section
                const sectionProgress = Math.min(Math.max((scrollTop - sectionTop) / (sectionRect.height * 0.8), 0), 1);
                
                // Update the progress ring
                const offset = circumference - (sectionProgress * circumference);
                progressRing.style.strokeDashoffset = offset;
                
                // Show button
                backToTopBtn.classList.add('visible');
            } else {
                // Hide button when outside section or on desktop
                backToTopBtn.classList.remove('visible');
            }
        };
        
        // Function to scroll to top of calculator section
        const scrollToSectionTop = (e) => {
            e.preventDefault();
            
            const calculatorSection = document.getElementById('MFZ-NewCostCalForm');
            if (!calculatorSection) return;
            
            const headerOffset = 80;
            const elementPosition = calculatorSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        };
        
        // Event listeners
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress, { passive: true });
        backToTopBtn.addEventListener('click', scrollToSectionTop);
        
        // Initial progress update
        updateProgress();
        
        // Force initial check after a short delay
        setTimeout(updateProgress, 100);
        
        } catch (error) {
            console.error('Error initializing back to top button:', error);
        }
    }

    // Helper function to trigger form validation after programmatic field filling
    function triggerFormValidationAfterProgrammaticFill() {
        try {
            // Get form fields
            const nameField = document.getElementById('full-name');
            const emailField = document.getElementById('email');
            const phoneField = document.getElementById('phone');
            
            // Trigger input events to simulate user interaction
            const fields = [nameField, emailField, phoneField].filter(field => field);
            
            fields.forEach(field => {
                if (field && field.value.trim()) {
                    // Create and dispatch input event
                    const inputEvent = new Event('input', { 
                        bubbles: true, 
                        cancelable: true 
                    });
                    field.dispatchEvent(inputEvent);
                    
                    // Create and dispatch change event
                    const changeEvent = new Event('change', { 
                        bubbles: true, 
                        cancelable: true 
                    });
                    field.dispatchEvent(changeEvent);
                    
                    // Trigger blur event for validation
                    const blurEvent = new Event('blur', { 
                        bubbles: true, 
                        cancelable: true 
                    });
                    field.dispatchEvent(blurEvent);
                }
            });
            
            // Trigger phone validation specifically if FormValidator exists
            if (window.formValidator && phoneField && phoneField.value.trim()) {
                // Trigger phone-specific validation
                if (typeof window.formValidator.validateField === 'function') {
                    window.formValidator.validateField('phone');
                }
            }
            
            // Force update section lock state
            if (typeof updateSectionLockState === 'function') {
                // Small delay to ensure all validations complete
                setTimeout(() => {
                    updateSectionLockState();
                    
                    // If form is valid and sections should be revealed, also mark as having basic interaction
                    const isValid = window.formValidator && window.formValidator.validateContactForm();
                    if (isValid && !isContactFormCompleted) {
                        // Mark some basic sections as interacted so pricing shows when calculate is clicked
                        setTimeout(() => {
                            if (sectionInteractions.licenseSection !== true) {
                                sectionInteractions.licenseSection = true;
                                calculateCosts();
                            }
                        }, 500);
                    }
                }, 100);
            }
                        
        } catch (error) {
            console.error('Error triggering form validation:', error);
        }
    }

    // Helper function to fill form AND trigger validation
    function fillFormAndTriggerValidation(userData) {
        try {
            // Fill the form fields
            if (userData.fullName) {
                const nameField = document.getElementById('full-name');
                if (nameField) nameField.value = userData.fullName;
            }
            
            if (userData.email) {
                const emailField = document.getElementById('email');
                if (emailField) emailField.value = userData.email;
            }
            
            if (userData.phone) {
                const phoneField = document.getElementById('phone');
                if (phoneField) {
                    phoneField.value = userData.phone;
                    
                    // If using international phone input, set the number properly
                    if (window.formValidator && window.formValidator.phoneInput) {
                        try {
                            window.formValidator.phoneInput.setNumber(userData.phone);
                        } catch (e) {
                            console.warn('Could not set phone number via phoneInput:', e);
                        }
                    }
                }
            }
            
            // Trigger validation after filling
            triggerFormValidationAfterProgrammaticFill();
            
        } catch (error) {
            console.error('Error filling form and triggering validation:', error);
        }
    }

    // Function to handle sticky buttons visibility based on calculator viewport
    function initializeStickyButtonsControl() {
        // Target the specific navbar class
        const stickyButtons = document.querySelector('.navbar1_container-3.mobile-nav');
        const calculatorSection = document.getElementById('MFZ-NewCostCalForm');

        if (!stickyButtons || !calculatorSection) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Calculator is in viewport - hide sticky buttons
                    stickyButtons.classList.add('hidden');
                } else {
                    // Calculator is out of viewport - show sticky buttons
                    stickyButtons.classList.remove('hidden');
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% of the calculator is visible
        });

        observer.observe(calculatorSection);
    }

    // Make core functions globally available
    window.triggerFormValidationAfterProgrammaticFill = triggerFormValidationAfterProgrammaticFill;
    window.fillFormAndTriggerValidation = fillFormAndTriggerValidation;

    // Re-initialize on window resize if switching to/from mobile
    window.addEventListener('resize', function() {
        if (typeof initializeMobileAutoScroll === 'function') {
            initializeMobileAutoScroll();
        }
    });