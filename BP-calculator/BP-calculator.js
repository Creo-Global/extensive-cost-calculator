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
    // Function to handle BSA code input
    function setupBsaCodeInput() {
        const bsaCodeInput = document.getElementById('bsa-code');
        
        if (bsaCodeInput) {
            bsaCodeInput.addEventListener('input', function(e) {
                // Prevent the event from bubbling up to document level listeners
                e.stopPropagation();
            });
        }
    }

    function initializeCalculator() {
        try {
            // Initialize user location detection
            if (typeof detectUserLocation === 'function') {
                detectUserLocation();
            }
            
            // Setup BSA code input
            setupBsaCodeInput();
            
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

            // Initialize sharing functionality
            initializeUnifiedSharing();
            
            
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
        
        if (!popup || !popupFirstName) return;

        const closeBtn = popup.querySelector('.success-popup-close');
        if (!closeBtn) return;
        
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
            this.useMFZPhone = false;
            this.validationRules = this.initializeValidationRules();
            this.errorMessages = this.initializeErrorMessages();
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
                },
                consent: {
                    required: true
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
                    invalid: 'Please enter a valid phone number'
                },
                consent: {
                    required: 'Please accept the terms and privacy policy to continue'
                }
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
            if (!phoneField) return;

            // Use MFZPhone if available (already loaded on Webflow site)
            if (window.MFZPhone) {
                // Ensure the phone field has the required attribute for MFZPhone
                if (!phoneField.hasAttribute('data-mfz-phone')) {
                    phoneField.setAttribute('data-mfz-phone', '');
                    // Re-initialize MFZPhone to pick up the new attribute
                    window.MFZPhone.init();
                }
                this.useMFZPhone = true;
                
                // Clear our error when MFZPhone shows valid state
                phoneField.addEventListener('input', () => {
                    this.clearFieldError('phone');
                });
                return;
            }

            // Fallback to basic validation if MFZPhone not available
            this.setupBasicPhoneValidation(phoneField);
        }

        setupBasicPhoneValidation(phoneField) {
            // Basic fallback when MFZPhone is not available
            phoneField.addEventListener('input', () => {
                this.clearFieldError('phone');
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
            
            // Consent checkbox event listener
            const consentCheckbox = document.getElementById('consent-checkbox');
            if (consentCheckbox) {
                consentCheckbox.addEventListener('change', () => {
                    this.clearFieldError('consent-checkbox');
                    // Remove error class from checkbox
                    consentCheckbox.classList.remove('error');
                    // Trigger section lock state update
                    if (typeof updateSectionLockState === 'function') {
                        updateSectionLockState();
                    }
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
            
            // Handle consent checkbox separately (it's a checkbox, not text input)
            if (fieldType === 'consent') {
                return this.validateConsent(field);
            }
            
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
            if (fieldId === 'consent-checkbox') return 'consent';
            return 'text';
        }
        
        validateConsent(field) {
            this.clearFieldError(field.id);
            
            if (!field.checked) {
                this.showFieldError(field.id, 'consent', 'required');
                // Add error class to checkbox for visual feedback
                field.classList.add('error');
                return false;
            }
            
            // Remove error class from checkbox if valid
            field.classList.remove('error');
            return true;
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

            // Use MFZPhone validation if available
            if (this.useMFZPhone && window.MFZPhone) {
                const isValid = window.MFZPhone.isValid(field);
                const instance = window.MFZPhone.getInstance(field);
                
                if (!isValid) {
                    // MFZPhone already shows visual feedback via mfz-phone.css
                    // Check validation state to determine if we should block submission
                    if (instance) {
                        if (instance.validationState === 'validating') {
                            // Still validating - don't block yet but return false
                            return false;
                        }
                        if (instance.validationState === 'invalid') {
                            // Invalid state - MFZPhone already shows error
                            return false;
                        }
                    }
                    // Fall through to show our error if MFZPhone hasn't shown one
                    this.showFieldError(field.id, 'phone', 'invalid');
                    return false;
                }
                return true;
            }

            // Fallback validation (basic digit check when MFZPhone not available)
            const digitsOnly = value.replace(/\D/g, '');
            
            if (digitsOnly.length < this.validationRules.phone.minDigits) {
                this.showFieldError(field.id, 'phone', 'invalid');
                return false;
            }

            if (digitsOnly.length > this.validationRules.phone.maxDigits) {
                this.showFieldError(field.id, 'phone', 'invalid');
                return false;
            }

            return true;
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
                field.classList.remove('error');
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
            
            // Also clear consent checkbox error class
            const consentCheckbox = document.getElementById('consent-checkbox');
            if (consentCheckbox) {
                consentCheckbox.classList.remove('error');
            }
        }

        validateContactForm() {
            this.clearAllErrors();
            
            const fields = ['full-name', 'email', 'phone', 'consent-checkbox'];
            let isValid = true;

            fields.forEach(fieldId => {
                if (!this.validateField(fieldId)) {
                    isValid = false;
                }
            });

            return isValid;
        }
        
        // Silent validation - checks validity without showing errors (for real-time state checks)
        validateContactFormSilent() {
            const fullName = document.getElementById('full-name')?.value?.trim();
            const email = document.getElementById('email')?.value?.trim();
            const phoneField = document.getElementById('phone');
            const consentCheckbox = document.getElementById('consent-checkbox');
            
            // Name validation
            const isNameValid = fullName && fullName.length >= 2 && this.validationRules.name.pattern.test(fullName);
            
            // Email validation
            const isEmailValid = email && this.validationRules.email.pattern.test(email);
            
            // Consent validation
            const isConsentValid = consentCheckbox?.checked === true;
            
            // Phone validation using MFZPhone if available
            let isPhoneValid = false;
            if (phoneField && this.useMFZPhone && window.MFZPhone) {
                try {
                    isPhoneValid = window.MFZPhone.isValid(phoneField);
                } catch (err) {
                    const phoneValue = phoneField.value?.trim();
                    const digitsOnly = phoneValue?.replace(/\D/g, '') || '';
                    isPhoneValid = digitsOnly.length >= this.validationRules.phone.minDigits && 
                                   digitsOnly.length <= this.validationRules.phone.maxDigits;
                }
            } else {
                const phoneValue = phoneField?.value?.trim();
                const digitsOnly = phoneValue?.replace(/\D/g, '') || '';
                isPhoneValid = digitsOnly.length >= this.validationRules.phone.minDigits && 
                               digitsOnly.length <= this.validationRules.phone.maxDigits;
            }
            
            return isNameValid && isEmailValid && isPhoneValid && isConsentValid;
        }

        handleFormSubmit(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const submitBtn = e.target;
            const originalText = submitBtn.innerHTML;
            
            // If form is already completed and valid, just scroll to next section
            if (isContactFormCompleted && this.validateContactFormSilent()) {
                this.handleSuccessfulSubmission();
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Validating...';

            // First, trigger validation for any prefilled fields
            triggerFormValidationAfterProgrammaticFill();

            // Check if MFZPhone is still validating and wait for it
            const phoneField = document.getElementById('phone');
            const checkAndValidate = (retryCount = 0) => {
                // Check if phone is still in validating state
                if (this.useMFZPhone && window.MFZPhone && phoneField) {
                    const instance = window.MFZPhone.getInstance(phoneField);
                    if (instance?.validationState === 'validating' && retryCount < 10) {
                        // Still validating, wait and retry (max 5 seconds total)
                        setTimeout(() => checkAndValidate(retryCount + 1), 500);
                        return;
                    }
                }
                
                const isValid = this.validateContactForm();
                
                if (isValid) {
                    submitBtn.innerHTML = '✓ Valid';
                    submitBtn.classList.add('validated');
                    submitBtn.disabled = false;
                    
                    // Ensure sections are revealed if they haven't been already
                    if (!isContactFormCompleted) {
                        isContactFormCompleted = true;
                        
                        // Reveal sections
                        revealSections();
                        
                        // Update UI state
                        const contactSection = document.querySelector('.contact-form-section');
                        if (contactSection) {
                            contactSection.classList.add('validated', 'completed');
                        }
                        
                        // Update progress indicator
                        const progressIndicator = document.getElementById('contact-progress');
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
                        
                        // Reveal pricing
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
                        }
                        
                        // Mark license section as interacted for pricing display
                        setTimeout(() => {
                            sectionInteractions.licenseSection = true;
                            calculateCosts();
                        }, 1000);
                    }
                    
                    this.handleSuccessfulSubmission();
                } else {
                    // Get specific invalid fields for better error messaging
                    const invalidFields = this.getInvalidFieldNames();
                    let errorMessage = 'Please complete all required fields';
                    
                    if (invalidFields.length > 0) {
                        if (invalidFields.length === 1) {
                            errorMessage = `Please complete ${invalidFields[0]}`;
                        } else if (invalidFields.length === 2) {
                            errorMessage = `Please complete ${invalidFields[0]} and ${invalidFields[1]}`;
                        } else {
                            errorMessage = `Please complete ${invalidFields.slice(0, -1).join(', ')} and ${invalidFields[invalidFields.length - 1]}`;
                        }
                    }
                    
                    submitBtn.innerHTML = errorMessage;
                    setTimeout(() => {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }, 3000);
                }
            };
            
            // Start validation after a brief delay
            setTimeout(() => checkAndValidate(), 200);
        }
        
        // Helper method to get human-readable names of invalid fields
        getInvalidFieldNames() {
            const invalidFields = [];
            
            // Check name
            const fullName = document.getElementById('full-name')?.value?.trim();
            if (!fullName || fullName.length < 2 || !this.validationRules.name.pattern.test(fullName)) {
                invalidFields.push('your name');
            }
            
            // Check email
            const email = document.getElementById('email')?.value?.trim();
            if (!email || !this.validationRules.email.pattern.test(email)) {
                invalidFields.push('email');
            }
            
            // Check phone
            const phoneField = document.getElementById('phone');
            let isPhoneValid = false;
            if (phoneField && this.useMFZPhone && window.MFZPhone) {
                try {
                    isPhoneValid = window.MFZPhone.isValid(phoneField);
                } catch (err) {
                    const phoneValue = phoneField.value?.trim();
                    const digitsOnly = phoneValue?.replace(/\D/g, '') || '';
                    isPhoneValid = digitsOnly.length >= this.validationRules.phone.minDigits;
                }
            } else {
                const phoneValue = phoneField?.value?.trim();
                const digitsOnly = phoneValue?.replace(/\D/g, '') || '';
                isPhoneValid = digitsOnly.length >= this.validationRules.phone.minDigits;
            }
            if (!isPhoneValid) {
                invalidFields.push('phone number');
            }
            
            // Check consent
            const consentCheckbox = document.getElementById('consent-checkbox');
            if (!consentCheckbox?.checked) {
                invalidFields.push('consent');
            }
            
            return invalidFields;
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

            // Get formatted phone number from MFZPhone (E.164 format)
            const phoneField = document.getElementById('phone');
            let phoneValue = phoneField?.value || '';
            
            if (this.useMFZPhone && window.MFZPhone && phoneField) {
                const formattedPhone = window.MFZPhone.getFormattedNumber(phoneField);
                if (formattedPhone) {
                    phoneValue = formattedPhone;
                }
            }

            // Also trigger the custom event for other parts of the application
            const nextStepEvent = new CustomEvent('contactFormValid', {
                detail: {
                    name: document.getElementById('full-name').value,
                    email: document.getElementById('email').value,
                    phone: phoneValue
                }
            });
            document.dispatchEvent(nextStepEvent);
        }

        getFormData() {
            const phoneField = document.getElementById('phone');
            let phoneValue = phoneField?.value?.trim() || '';
            
            // Get E.164 formatted phone from MFZPhone if available
            if (this.useMFZPhone && window.MFZPhone && phoneField) {
                const formattedPhone = window.MFZPhone.getFormattedNumber(phoneField);
                if (formattedPhone) {
                    phoneValue = formattedPhone;
                }
            }
            
            return {
                name: document.getElementById('full-name')?.value?.trim() || '',
                email: document.getElementById('email')?.value?.trim() || '',
                phone: phoneValue
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
            
            // Check if we're loading from a shared link
            const params = new URLSearchParams(window.location.search);
            const hasShareConfig = params.get("Config") || params.get("share") || params.get("DynamicConfig");
            
            // Only apply default VAT registration if NOT loading from a shared link
            if (!hasShareConfig) {
                const defaultServices = [];
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
            }
            
            selectedActivities = [];
            
            setupLiveCalculations();
            
            initializeActivityGroups();
            
            initializeAddonModals();
            
            initializeLicenseModals();
            
            initializeVisaModals();
            
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
            // Exclude BSA code input from triggering recalculation
            if (e.target.matches('input, select') && e.target.id !== 'bsa-code') {
                hasStartedForm = true;
                if (typeof isLoadingSharedConfiguration === 'undefined' || !isLoadingSharedConfiguration) {
                    calculateCosts();
                }
            }
        });

        document.addEventListener('change', function(e) {
            // Exclude BSA code input from triggering recalculation
            if (e.target.matches('input, select') && e.target.id !== 'bsa-code') {
                hasStartedForm = true;
                if (typeof isLoadingSharedConfiguration === 'undefined' || !isLoadingSharedConfiguration) {
                    calculateCosts();
                }
            }
        });

        document.addEventListener('click', function(e) {
            if (e.target.matches('input[type="checkbox"], input[type="radio"]')) {
                setTimeout(() => {
                    if (typeof isLoadingSharedConfiguration === 'undefined' || !isLoadingSharedConfiguration) {
                        calculateCosts();
                    }
                }, 10); // Small delay to ensure state is updated
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
    const supabaseUrl = 'https://sb.meydanfz.ae';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU3MjQyMDM2LCJleHAiOjIwNzI4MTgwMzZ9.5YF79Wen41bSpKNOKiT9Wcd_psXf8IV4vgK7RUjOZoI';
    // IMPORTANT: do not name this variable `supabase` because the CDN library already defines a global `supabase`.
    // Using the same identifier can cause "Identifier 'supabase' has already been declared" and stop the script.
    const supabaseClient = window.supabase?.createClient
        ? window.supabase.createClient(supabaseUrl, supabaseKey)
        : null;

    window.supabaseClient = window.supabaseClient || supabaseClient;

    window.selectedActivities = window.selectedActivities || [];

    // Initialize activity groups functionality
    function initializeActivityGroups() {
        const groups = [
            { name: "F&B, Rentals", group: "F&B,Rentals", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51fca8288179aae11da_F%26B%2C%20Rentals.svg" },
            { name: "Financial", group: "financial", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51fb96a229b2824af0f_Financial.svg" },
            { name: "Education", group: "education", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51fd014459df24d3325_Education.svg" },
            { name: "Transportation", group: "transportation", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef5b12d754eab63acb716_truck.svg" },
            { name: "Maintenance", group: "maintenance", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51f8dbb977dc5e09a95_Maintenance.svg" },
            { name: "Realestate", group: "realestate", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51ffa37ff75e611e59e_Real%20Estate.svg" },
            { name: "Administrative", group: "administrative", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff40a68d15d9c4d5b93cd8_administrative.svg" },
            { name: "Agriculture", group: "agriculture", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51f2f3a67bde876b5a6_Agriculture.svg" },
            { name: "Art", group: "art", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51fea496252844584d8_Art.svg" },
            { name: "ICT", group: "ict", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51f22116abc03173482_ICT.svg" },
            { name: "Health Care", group: "healthcare", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51f61500699cd371991_hospital.svg" },
            { name: "Services", group: "services", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51fad0908d806731555_Services.svg" },
            { name: "Professional", group: "professional", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51fad0908d806731558_Professional.svg" },
            { name: "Sewerage", group: "sewerage", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51f9e5c02dca8bf99cd_sewerage.svg" },
            { name: "Trading", group: "trading", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51fedefe9b3e523bffe_status-up.svg" },
            { name: "Waste Collection", group: "waste", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51f3695bcf980854032_Waste%20Collection.svg" },
            { name: "Manufacturing", group: "manufacturing", icon: "https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68fef51ff278b7580bf2a277_Manufacturing.svg" },
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
                    <img class="activity-icon svg" src="${groupInfo.icon}" alt="${groupInfo.name} Icon" class="activity-icon">
                    <h3>${groupInfo.name}</h3>
                    <a href="#" class="select-activity-link">Select your activity <span class="link-arrow"><svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.11881 0.658612L8.11881 6.22708C8.11881 6.40143 8.04955 6.56864 7.92627 6.69192C7.80296 6.81523 7.63575 6.8845 7.46143 6.88447C7.28707 6.88447 7.11983 6.81523 6.99655 6.69195C6.87327 6.56867 6.80404 6.40143 6.80404 6.22708L6.80478 2.24408L1.1203 7.92855C0.997234 8.05162 0.830323 8.12078 0.656277 8.12078C0.482232 8.12078 0.315289 8.05162 0.192226 7.92855C0.069163 7.80549 3.35917e-05 7.63858 3.35495e-05 7.46453C3.35074e-05 7.29049 0.0691568 7.12355 0.192226 7.00048L5.8767 1.316L1.89331 1.31486C1.71898 1.31483 1.55175 1.2456 1.42846 1.12232C1.30518 0.999031 1.23595 0.831795 1.23592 0.657474C1.23592 0.483123 1.30518 0.315911 1.42846 0.192631C1.55177 0.0693206 1.71898 5.80848e-05 1.89331 8.58807e-05L7.46176 8.00644e-05C7.54823 -1.3333e-05 7.63383 0.0169705 7.71368 0.0500416C7.79352 0.0831117 7.86607 0.131651 7.92713 0.192842C7.98817 0.254003 8.03652 0.32667 8.06944 0.406609C8.10229 0.486547 8.11909 0.572209 8.11881 0.658612Z" fill="#020202"/>
</svg>
</span></a></div>
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
            const { data, error } = await supabaseClient
                .from('Activity List')
                .select('Code, "Activity Name", Category, Group, "When", DNFBP')
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
            // Use the correct column names from the database
            const preApproval = activity.When && activity.When.toUpperCase() === 'PRE';
            const dffbp = activity.DNFBP && activity.DNFBP.toLowerCase() === 'yes';
            
            let labelsHtml = '';
            if (preApproval || dffbp) {
                labelsHtml = '<div class="modal-activity-labels">';
                if (preApproval) {
                    labelsHtml += '<span class="activity-label pre-approval">Pre Approval</span>';
                }
                if (dffbp) {
                    labelsHtml += '<span class="activity-label dffbp">DFFBP</span>';
                }
                labelsHtml += '</div>';
            }
            
            html += `
                <div class="modal-activity-item" data-code="${activity.Code}" data-name="${activity["Activity Name"]}" data-category="${activity.Category}" data-group="${activity.Group}">
                <div class="modal-activity-info">
                    <div>
                        <div class="modal-activity-code">${activity.Code}</div>
                        <div class="modal-activity-name">
                            ${activity["Activity Name"]}
                            ${labelsHtml}
                        </div>
                    </div>
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
            const { data, error } = await supabaseClient
                .from('Activity List')
                .select('Code, "Activity Name", Category, Group, "When", DNFBP')
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
            // Use the correct column names from the database
            const preApproval = activity.When && activity.When.toUpperCase() === 'PRE';
            const dffbp = activity.DNFBP && activity.DNFBP.toLowerCase() === 'yes';
            
            let labelsHtml = '';
            if (preApproval || dffbp) {
                labelsHtml = '<div class="modal-activity-labels">';
                if (preApproval) {
                    labelsHtml += '<span class="activity-label pre-approval">Pre Approval</span>';
                }
                if (dffbp) {
                    labelsHtml += '<span class="activity-label dffbp">DFFBP</span>';
                }
                labelsHtml += '</div>';
            }
            
            html += `
                <div class="modal-activity-item" data-code="${activity.Code}" data-name="${activity["Activity Name"]}" data-category="${activity.Category}" data-group="${activity.Group}">
                <div class="modal-activity-info">
                    <div>
                        <div class="modal-activity-code">${activity.Code}</div>
                        <div class="modal-activity-name">
                            ${activity["Activity Name"]}
                            ${labelsHtml}
                        </div>
                    </div>
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
                    Group: parseInt(this.dataset.group) || this.dataset.group
                };
                
                if (isCurrentlySelected) {
                    checkbox.classList.remove('checked');
                    removeActivity(activityData.Code);
                 } else {
                    checkbox.classList.add('checked');
                    // Store both the actual Group ID and the category for UI purposes
                    activityData.categoryGroup = groupName; // For UI card updates
                    activityData.groupName = activityData.Group; // For pricing calculation
                    addActivityToSelected(activityData, activityData.Group);
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
        'mCore': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff650317c623f64f2689af_mcore.webp',
        'mResidency': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff6b6e0fa3c7b9466bc47e_mresidency.webp',
        'mAssist': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff6b6ef7331a8fbd654c6c_shareholder-visa.webp',
        'mAccounting': 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff650317c623f64f2689af_mcore.webp'
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
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff6503f76faf01240cfb63_investor%20visa.webp'
            },
            'employee': {
                title: 'Employee Visa',
                description: 'An Employee Visa, also known as an Employment Visa or Work Visa, is a government-issued permit that allows foreign nationals to live and work legally in Dubai.<br><br>The employer is responsible for managing the full application process, including document preparation, government approvals, medical testing, Emirates ID registration, and timely renewals.',
                additional: 'At Meydan Free Zone, we simplify the entire process for you. Our dedicated support team ensures your Employee Visas are processed quickly, compliantly, and without delays, so your team can get to work without any administrative hassle.',
                actionText: 'Select Employee Visa',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff650321076a29d95f78fb_employee%20visa.webp'
            },
            'dependent': {
                title: 'Dependent Visa',
                description: 'A Dependent Visa in Dubai allows UAE residents to sponsor their immediate family members, including spouses, children, and parents, to legally live in the UAE. It’s a residency visa linked to the sponsor’s visa status and remains valid as long as the sponsor’s visa is active and compliant.<br> <br>This visa is ideal for those who want their loved ones to join them in the UAE, ensuring legal residency, access to essential services, and peace of mind for families relocating together.',
                additional: 'At Meydan Free Zone, we simplify the Dependent Visa process to ensure fast, accurate submissions and full compliance, so you can bring your family over without delays or stress.',
                actionText: 'Select Dependent Visa',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff6503675206a13531707c_depended%20visa.webp'
            },
            'change-status': {
                title: 'Change of Status',
                description: 'If you\'re already in the UAE, whether on a tourist visa, family visa, or a previous employment visa, you\'ll need to apply for a Change of Status to switch to a residence visa under your new business.<br><br><strong>This applies to:</strong><br><br><span class="numbered-item">1.</span> <strong>You</strong> as a founder or shareholder moving to an Investor or Shareholder visa<br><br><span class="numbered-item">2.</span> <strong>Employees</strong> you\'re hiring who are switching jobs and changing sponsorship<br><br><span class="numbered-item">3.</span> <strong>Family members</strong> you\'re sponsoring (after obtaining your own visa) who are already in the UAE',
                additional: 'Meydan Free Zone manages the full Change of Status process for you, so you don\'t need to exit the country or restart your visa journey. It\'s a fast, compliant way to update your visa status, whether you\'re launching or growing your team from inside the UAE.<br><br>Just let us know who\'s already here, and we\'ll handle the rest.',
                actionText: 'Got It',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff3ea292559851c4de9095_change-status.webp'
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
                title: 'What Is Fawri License?',
                description: 'Fawri is your express route to a 60-minute, compliance-led LLC license. This 100% digital, fast-track license is designed exclusively for ambitious solo entrepreneurs and freelancers who want speed, control, and minimal setup friction.',
                additional: 'With over 1,800 activities, Fawri gets you licensed, visa-ready, and enables bank account applications on the same day. It’s the fastest, most reliable way to launch your business in Dubai.',
                actionText: 'Select Fawri License',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff65033b9a144013518dba_fawri-licences.webp'
            },
            'regular': {
                title: 'Regular Business License',
                description: 'The regular business license is built for founders who need flexibility, scalability, and full ownership. It’s a customisable license that supports multi-partner setups, cross-industry models, and long-term growth.',
                additional: 'Choose from 2,500+ business activities across 3 groups with instant access to visa processing and banking. 100% digital, fully foreign-owned, and designed for serious entrepreneurs ready to build broad, future-ready businesses in Dubai.', 
                actionText: 'Select Regular License',
                image: 'https://cdn.prod.website-files.com/6746fa16829349829922b7c4/68ff650362c775d28eb2dcc8_reg-licences.webp'
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
                    // Use MFZPhone validation if available
                    if (window.MFZPhone && formValidator && formValidator.useMFZPhone) {
                        isPhoneValid = window.MFZPhone.isValid(input);
                        
                        if (!isPhoneValid) {
                            const instance = window.MFZPhone.getInstance(input);
                            if (instance && instance.validationState === 'invalid') {
                                errorMessage = 'Please enter a valid phone number';
                            } else if (instance && instance.validationState === 'validating') {
                                // Still validating, don't show error yet
                                errorMessage = '';
                            } else {
                                errorMessage = 'Please enter a valid phone number';
                            }
                        }
                    } else {
                        // Fallback validation if MFZPhone not available
                        const phoneValue = input.value.replace(/\D/g, '');
                        const minDigits = 6;
                        const maxDigits = 15;
                        
                        if (phoneValue.length >= minDigits && phoneValue.length <= maxDigits) {
                            isPhoneValid = true;
                        } else if (phoneValue.length < minDigits) {
                            isPhoneValid = false;
                            errorMessage = 'Phone number is too short';
                        } else {
                            isPhoneValid = false;
                            errorMessage = 'Phone number is too long';
                        }
                    }
                } catch (err) {
                    // Final fallback validation
                    const phoneValue = input.value.replace(/\D/g, '');
                    isPhoneValid = phoneValue.length >= 6 && phoneValue.length <= 15;
                    if (!isPhoneValid) {
                        errorMessage = "Please enter a valid phone number";
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
        const allocationFeePerYearEffective = licenseDuration > 1 ? (allocationFeePerYear * 0.85) : allocationFeePerYear;
        const investorBaseFee = 5850 - allocationFeePerYear; // 4,000
        const employeeBaseFee = 5350 - allocationFeePerYear; // 3,500

        if (investorVisas > 0) {
            visaAdditionalCosts += (investorBaseFee * investorVisas) + (allocationFeePerYearEffective * licenseDuration * investorVisas);
        }

        if (employeeVisas > 0) {
            visaAdditionalCosts += (employeeBaseFee * employeeVisas) + (allocationFeePerYearEffective * licenseDuration * employeeVisas);
        }
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
        
        // Calculate additional shareholder costs (no discount applied)
        // First 6 shareholders are free, each additional costs AED 2,000
        // Multiply by license duration to account for multi-year licenses
        let additionalShareholdersCost = 0;
        if (shareholdersCount > 6) {
            additionalShareholdersCost = (shareholdersCount - 6) * 2000 * licenseDuration;
        }
        
        // Apply discount ONLY to the base license cost, not to shared desk fee or shareholders cost
        let discountAmount = baseLicenseCostForDuration * (discountPercentage / 100);
        let discountedBaseCost = baseLicenseCostForDuration - discountAmount;
        
        // Add shared desk fee (not discounted)
        let sharedDeskFeeForDuration = sharedDeskFee * licenseDuration;
        let businessLicenseCost = discountedBaseCost + sharedDeskFeeForDuration;

        // Innovation Fee and Knowledge Fee removed as requested
        
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
        // Innovation and Knowledge Fee rows have been removed as requested
        // The fees are still calculated but not displayed in the UI
        
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
                
                // Group activities by their actual Group ID
                const activityGroups = {};
                
                // First, create a list of all unique groups
                window.selectedActivities.forEach(activity => {
                    const groupId = (typeof activity.groupName === 'number' || !isNaN(activity.groupName)) 
                        ? String(activity.groupName) 
                        : String(activity.Group || activity.groupName || 'unknown');
                        
                    if (!activityGroups[groupId]) {
                        activityGroups[groupId] = [];
                    }
                    activityGroups[groupId].push(activity);
                });
                
                // Create table-style rows instead of tags
                // Sort groups by activity count (descending) to show most selected first
                const sortedGroupIds = Object.keys(activityGroups).sort((a, b) => {
                    return activityGroups[b].length - activityGroups[a].length;
                });
                
                sortedGroupIds.forEach(groupId => {
                    const activities = activityGroups[groupId];
                    
                    // Create a summary row for each group
                    const row = document.createElement('div');
                    row.className = 'summary-row';
                    
                    const label = document.createElement('span');
                    label.className = 'summary-label';
                    
                    // Show activity names with Group ID in parentheses
                    const activityNames = activities.map(a => a['Activity Name'] || a.name).join(', ');
                    label.innerText = `${activityNames} (Group ${groupId})`;
                    
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
                    const groupIds = Object.keys(activityGroups);
                    let activitiesCostValue = 0;
                    
                    if (groupIds.length > 3) {
                        // Keep track of which groups were selected first (maintain selection order)
                        const groupSelectionOrder = [];
                        window.selectedActivities.forEach(activity => {
                            const groupId = (typeof activity.groupName === 'number' || !isNaN(activity.groupName)) 
                                ? String(activity.groupName) 
                                : String(activity.Group || activity.groupName || 'unknown');
                                
                            if (!groupSelectionOrder.includes(groupId)) {
                                groupSelectionOrder.push(groupId);
                            }
                        });
                        
                        // First 3 groups in selection order are free, charge for activities in remaining groups
                        for (let i = 3; i < groupSelectionOrder.length; i++) {
                            const groupId = groupSelectionOrder[i];
                            if (activityGroups[groupId]) {
                                activitiesCostValue += activityGroups[groupId].length * 1000;
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
                        if (groupIds.length > 3) {
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
        const allocationFeePerYearEffective = licenseDuration > 1 ? (allocationFeePerYear * 0.85) : allocationFeePerYear;
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
                // Hide addons section completely if no addons selected or no interaction
                addonsSection.classList.remove('expanded');
                addonsSection.style.display = 'none';
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
            // Group activities by their actual Group number (not category)
            const activityGroups = {};
            window.selectedActivities.forEach(activity => {
                // Use groupName if it's a number (actual Group ID), otherwise use Group field
                const groupId = (typeof activity.groupName === 'number' || !isNaN(activity.groupName)) 
                    ? String(activity.groupName) 
                    : String(activity.Group || activity.groupName || 'unknown');
                    
                if (!activityGroups[groupId]) {
                    activityGroups[groupId] = [];
                }
                activityGroups[groupId].push(activity);
            });
            
            // First 3 groups are free, then 1000 AED per individual activity in additional groups
            const groupIds = Object.keys(activityGroups);
            console.log('Business Activities Debug:', {
                totalActivities: window.selectedActivities.length,
                uniqueGroups: groupIds.length,
                groupIds: groupIds,
                activityGroups: activityGroups
            });
            
            if (groupIds.length > 3) {
                // Keep track of which groups were selected first (maintain selection order)
                const groupSelectionOrder = [];
                window.selectedActivities.forEach(activity => {
                    const groupId = (typeof activity.groupName === 'number' || !isNaN(activity.groupName)) 
                        ? String(activity.groupName) 
                        : String(activity.Group || activity.groupName || 'unknown');
                        
                    if (!groupSelectionOrder.includes(groupId)) {
                        groupSelectionOrder.push(groupId);
                    }
                });
                
                console.log('Charging for groups:', {
                    selectionOrder: groupSelectionOrder,
                    freeGroups: groupSelectionOrder.slice(0, 3),
                    chargedGroups: groupSelectionOrder.slice(3)
                });
                
                // First 3 groups in selection order are free, charge for activities in remaining groups
                for (let i = 3; i < groupSelectionOrder.length; i++) {
                    const groupId = groupSelectionOrder[i];
                    if (activityGroups[groupId]) {
                        const activitiesCount = activityGroups[groupId].length;
                        const cost = activitiesCount * 1000;
                        console.log(`Group "${groupId}": ${activitiesCount} activities × 1000 = ${cost} AED`);
                        businessActivitiesCost += cost;
                    }
                }
                
                console.log('Total business activities cost:', businessActivitiesCost);
            } else {
                console.log('All groups are free (≤3 groups)');
            }
        } else {
            console.log('Business activities cost not calculated:', {
                sectionInteracted: sectionInteractions.businessActivitiesSection,
                hasActivities: window.selectedActivities?.length > 0
            });
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
                // Group activities by their actual Group number (not category)
                const activityGroups = {};
                window.selectedActivities.forEach(activity => {
                    // Use groupName if it's a number (actual Group ID), otherwise use Group field
                    const groupId = (typeof activity.groupName === 'number' || !isNaN(activity.groupName)) 
                        ? String(activity.groupName) 
                        : String(activity.Group || activity.groupName || 'unknown');
                        
                    if (!activityGroups[groupId]) {
                        activityGroups[groupId] = [];
                    }
                    activityGroups[groupId].push(activity);
                });
                
                // First 3 groups are free, then 1000 AED per individual activity in additional groups
                const groupIds = Object.keys(activityGroups);
                console.log('[calculateTotalCost] Business Activities Debug:', {
                    totalActivities: window.selectedActivities.length,
                    uniqueGroups: groupIds.length,
                    groupIds: groupIds
                });
                
                if (groupIds.length > 3) {
                    // Keep track of which groups were selected first (maintain selection order)
                    const groupSelectionOrder = [];
                    window.selectedActivities.forEach(activity => {
                        const groupId = (typeof activity.groupName === 'number' || !isNaN(activity.groupName)) 
                            ? String(activity.groupName) 
                            : String(activity.Group || activity.groupName || 'unknown');
                            
                        if (!groupSelectionOrder.includes(groupId)) {
                            groupSelectionOrder.push(groupId);
                        }
                    });
                    
                    // First 3 groups in selection order are free, charge for activities in remaining groups
                    for (let i = 3; i < groupSelectionOrder.length; i++) {
                        const groupId = groupSelectionOrder[i];
                        if (activityGroups[groupId]) {
                            businessActivitiesCost += activityGroups[groupId].length * 1000;
                        }
                    }
                    
                    console.log('[calculateTotalCost] Total business activities cost:', businessActivitiesCost);
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
        const webhookURL = 'https://flow.zoho.com/758936401/flow/webhook/incoming?zapikey=1001.9b6be080c9fa69677e2afb5090aeb9ef.16d36d524fa9d89adb3df08c5a8dc7d1&isdebug=false';
        
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


    // NOTE: All phone input validation is now handled by MFZPhone (mfz-phone.js)
    // MFZPhone provides:
    // - Automatic placeholder based on selected country
    // - Input filtering (numbers only) and country-specific max length
    // - Paste filtering
    // - Real-time API validation on blur  
    // - Visual feedback (valid/invalid/validating states via mfz-phone.css)
    
    // Track user interaction for form validation
    let userHasInteracted = false;
    let phoneFieldHasBeenFocused = false;
    
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener("focus", function() {
            phoneFieldHasBeenFocused = true;
        });
        
        phoneField.addEventListener("input", function() {
            userHasInteracted = true;
        });
    }

    // Phone validation function - now uses MFZPhone
    function validatePhoneField() {
        const phoneFieldLocal = document.getElementById('phone');
        if (!phoneFieldLocal) return;
        
        const phoneValue = phoneFieldLocal.value.trim();
        if (!phoneValue) return; // Don't validate empty field
        
        // MFZPhone handles validation - just check its status
        let isValid = false;
        
        try {
            if (window.MFZPhone && formValidator && formValidator.useMFZPhone) {
                isValid = window.MFZPhone.isValid(phoneFieldLocal);
            } else {
                // Basic fallback validation
                const digitsOnly = phoneValue.replace(/\D/g, '');
                isValid = digitsOnly.length >= 6 && digitsOnly.length <= 15;
            }
        } catch (err) {
            // Basic fallback
            const digitsOnly = phoneValue.replace(/\D/g, '');
            isValid = digitsOnly.length >= 6 && digitsOnly.length <= 15;
        }
        
        // Note: MFZPhone handles visual feedback via mfz-phone.css
        // No need for manual error display as MFZPhone shows validation states
        return isValid;
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

    // DataLayer push function for Google Analytics/GTM tracking
    function pushToDataLayer(eventName, formData) {
        try {
            // Ensure dataLayer exists
            window.dataLayer = window.dataLayer || [];
            
            // Create the event object
            const eventData = {
                event: eventName,
                form_data: {
                    form_status: formData.form_status || 'complete',
                    full_name: formData.fullName || '',
                    phone: formData.phone || '',
                    email: formData.email || '',
                    license_type: formData.license_type || '',
                    license_duration: formData.license_duration || '',
                    business_activities: formData.business_activities || '',
                    shareholders_range: formData.shareholders_range || '0',
                    investor_visas: formData.investor_visas || '0',
                    employee_visas: formData.employee_visas || '0',
                    dependency_visas: formData.dependency_visas || '0',
                    selected_addons: formData.selected_addons || '',
                    applicants_inside_uae: formData.applicants_inside_uae || '0',
                    applicants_outside_uae: formData.applicants_outside_uae || '0',
                    total_cost: formData.total_cost || 0,
                    license_cost: formData.license_cost || 0,
                    visa_cost: formData.visa_cost || 0,
                    user_country: formData.user_country || '',
                    user_country_name: formData.user_country_name || '',
                    user_city: formData.user_city || '',
                    current_url: formData.current_url || window.location.href,
                    // Additional fields specific to BP-calculator
                    cost_breakdown: formData.cost_breakdown || '',
                    configuration_id: formData.configuration_id || '',
                    client_name: formData.client_name || '',
                    salesperson_name: formData.salesperson_name || ''
                },
                // Add timestamp
                timestamp: new Date().toISOString(),
                // Add page info
                page_title: document.title,
                page_url: window.location.href
            };
            
            // Push to dataLayer
            window.dataLayer.push(eventData);
            
        } catch (error) {
            console.error('Error pushing to dataLayer:', error);
        }
    }

    // Get a Call buttons - handles form submission
    function initializeGetCallButtons() {
        const getCallButtons = document.querySelectorAll('.get-call-btn');
        
        getCallButtons.forEach(button => {
            button.addEventListener('click', async function(e) {
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

        // Check if we're already on a shared link, if so use existing config ID
        const params = new URLSearchParams(window.location.search);
        const existingConfigId = params.get('share') || params.get('DynamicConfig') || sessionStorage.getItem('currentConfigId');
        const uniqueConfigId = existingConfigId || generateConfigId();
        let shareableLink = '';
        let lastViewedTimestamp = '';
        
        try {
            // Collect current form configuration
            const currentConfigData = collectFormConfiguration();
            
            // Store the configuration in Supabase (this will update existing config if ID already exists)
            const stored = await storeConfiguration(uniqueConfigId, currentConfigData);
            
            if (stored) {
                // Generate the shareable URL
                const currentURL = new URL(window.location.href);
                const params = new URLSearchParams();
                
                // Preserve existing client and salesperson parameters if they exist
                const existingParams = new URLSearchParams(currentURL.search);
                if (existingParams.get('Client')) {
                    params.set('Client', existingParams.get('Client'));
                }
                if (existingParams.get('SalesPerson')) {
                    params.set('SalesPerson', existingParams.get('SalesPerson'));
                }
                
                // Add the shared config parameter
                params.set('share', uniqueConfigId);
                
                shareableLink = `${currentURL.origin}${currentURL.pathname}?${params.toString()}`;
                
                // Get last viewed timestamp for this configuration
                try {
                    // First try to get last_viewed from the main config table
                    const { data: configData, error: configError } = await supabaseClient
                        .from('shared_configs')
                        .select('last_viewed')
                        .eq('id', uniqueConfigId)
                        .single();
                    
                    if (!configError && configData && configData.last_viewed) {
                        lastViewedTimestamp = configData.last_viewed;
                    } else {
                        // Fallback to analytics table
                        const analytics = await getViewAnalytics(uniqueConfigId);
                        if (analytics && analytics.length > 0) {
                            const sortedViews = analytics.sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at));
                            lastViewedTimestamp = sortedViews[0].viewed_at;
                        } else {
                            lastViewedTimestamp = new Date().toISOString();
                        }
                    }
                } catch (timestampError) {
                    console.error('Error getting last viewed timestamp:', timestampError);
                    lastViewedTimestamp = new Date().toISOString();
                }
            }
        } catch (error) {
            console.error('Error generating shareable link:', error);
            // Continue with submission even if shareable link generation fails
        }

        const fullName = document.getElementById("full-name").value;
        const phoneField = document.getElementById("phone");
        let phone = phoneField?.value || '';
        // Get E.164 formatted phone from MFZPhone if available
        if (window.MFZPhone && formValidator && formValidator.useMFZPhone && phoneField) {
            const formattedPhone = window.MFZPhone.getFormattedNumber(phoneField);
            if (formattedPhone) {
                phone = formattedPhone;
            }
        }
        const email = document.getElementById("email").value;
        const bsaCode = document.getElementById("bsa-code")?.value || "";
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
            bsa_code: bsaCode,
            
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
            additional_shareholders_cost: Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6) * 2000 * parseInt(document.getElementById("license-duration")?.value || 1),
            
            // Detailed cost breakdown for invoice
            cost_breakdown: JSON.stringify({
                license: {
                    type: licenseType,
                    duration: document.getElementById("license-duration")?.value || '',
                    base_cost_per_year: licenseType === "fawri" ? 14625 : 12125, // Base cost without shared desk fee
                    shared_desk_fee: 375, // Shared desk fee separated
                    cost_per_unit: licenseType === "fawri" ? 14625 : 12125, // Base cost without shared desk fee
                    duration_years: parseInt(document.getElementById("license-duration")?.value || 1),
                    base_cost_total: (licenseType === "fawri" ? 14625 : 12125) * parseInt(document.getElementById("license-duration")?.value || 1), // Base cost without shared desk fee
                    shareholders_count: parseInt(document.getElementById("shareholders-range")?.value || 1),
                    additional_shareholders: Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6),
                    additional_shareholders_cost: Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6) * 2000 * parseInt(document.getElementById("license-duration")?.value || 1),
                    cost_per_additional_shareholder: 2000,
                    subtotal_before_discount: ((licenseType === "fawri" ? 14625 : 12125) * parseInt(document.getElementById("license-duration")?.value || 1)) + // Base cost
                        (375 * parseInt(document.getElementById("license-duration")?.value || 1)) + // Shared desk fee
                        (Math.max(0, parseInt(document.getElementById("shareholders-range")?.value || 1) - 6) * 2000 * parseInt(document.getElementById("license-duration")?.value || 1)), // Additional shareholders cost
                    discount_percentage: parseInt(document.getElementById("license-duration")?.value || 1) > 1 ? 15 : 0,
                    discount_amount: parseInt(document.getElementById("license-duration")?.value || 1) > 1 ? ((licenseType === "fawri" ? 14625 : 12125) * parseInt(document.getElementById("license-duration")?.value || 1)) * 0.15 : 0, // Discount ONLY applies to base license cost (excluding shared desk fee)
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
            
            // Shareable link and tracking information
            shareable_link: shareableLink,
            configuration_id: uniqueConfigId,
            last_viewed_timestamp: lastViewedTimestamp,
            
            // Client and sales data
            client_name: window.currentClientData?.name || '',
            client_email: window.currentClientData?.email || '',
            client_phone: window.currentClientData?.phone || '',
            client_id: window.currentClientData?.clientId || '',
            salesperson_name: window.currentSalesData?.name || '',
            salesperson_email: window.currentSalesData?.email || '',
            salesperson_phone: window.currentSalesData?.phone || '',
            
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
                // Push form data to dataLayer for tracking
                pushToDataLayer('form_submit_success', completeFormData);
                
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
                
                // Push error event to dataLayer
                pushToDataLayer('form_submit_error', { 
                    ...completeFormData, 
                    error_message: error.message || 'Unknown error',
                    form_status: 'error'
                });
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
            
            // Add listener for consent checkbox
            const consentCheckbox = document.getElementById('consent-checkbox');
            if (consentCheckbox) {
                consentCheckbox.addEventListener('change', updateSectionLockState);
            }
            
            // Initial validation check
            updateSectionLockState();
        } catch (err) {
            console.error("Error initializing section locking:", err);
        }
    }

    function validateContactForm() {
        try {
            // Use FormValidator if available for consistent validation
            if (window.formValidator && typeof window.formValidator.validateContactForm === 'function') {
                // Don't show errors during passive validation checks
                const result = window.formValidator.validateContactFormSilent();
                return result;
            }
            
            const fullName = document.getElementById('full-name')?.value?.trim();
            const email = document.getElementById('email')?.value?.trim();
            const phoneField = document.getElementById('phone');
            const consentCheckbox = document.getElementById('consent-checkbox');
            
            // Strict validation - ALL fields must be valid
            const isNameValid = fullName && fullName.length >= 2 && /^[A-Za-z\s\-\']+$/.test(fullName);
            const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            
            // Consent validation
            const isConsentValid = consentCheckbox?.checked === true;
            
            // Phone validation using MFZPhone if available
            let isPhoneValid = false;
            if (phoneField && window.MFZPhone && formValidator && formValidator.useMFZPhone) {
                try {
                    isPhoneValid = window.MFZPhone.isValid(phoneField);
                } catch (err) {
                    // Fallback to basic validation
                    const phoneValue = phoneField.value?.trim();
                    isPhoneValid = phoneValue && phoneValue.length >= 6 && phoneValue.length <= 15 && /^[\d\s\+\-\(\)]+$/.test(phoneValue);
                }
            } else {
                // Fallback basic validation
                const phoneValue = phoneField?.value?.trim();
                isPhoneValid = phoneValue && phoneValue.length >= 6 && phoneValue.length <= 15 && /^[\d\s\+\-\(\)]+$/.test(phoneValue);
            }
            
            return isNameValid && isEmailValid && isPhoneValid && isConsentValid;
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
                // Form was valid but now invalid - only hide if user actually changed a field to invalid
                // Check if any field is actively being edited (has focus)
                const activeElement = document.activeElement;
                const isEditingContactField = activeElement && 
                    (activeElement.id === 'full-name' || 
                     activeElement.id === 'email' || 
                     activeElement.id === 'phone' ||
                     activeElement.id === 'consent-checkbox');
                
                // Only hide sections if user is actively editing and made a field invalid
                // Don't hide on button clicks or other events
                if (!isEditingContactField) {
                    // Not editing - don't hide sections, keep them revealed
                    return;
                }
                
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

    // =================== SHARING FUNCTIONALITY ===================

    /**
     * Decode Base64 safely
     */
    function decodeBase64(str) {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            console.error("Base64 decode error", e);
            return '';
        }
    }

    /**
     * Parse URL parameters for client and sales data
     */
    function parseURLParameters() {
        const params = new URLSearchParams(window.location.search);
        let clientData = null;
        let salesData = null;

        // Parse Client parameter
        const clientEncoded = params.get("Client");
        if (clientEncoded) {
            const [name, email, phone, clientId] = decodeBase64(clientEncoded).split(",");
            
            if (name || email || phone || clientId) {
                clientData = {
                    name: name?.trim() || '',
                    email: email?.trim() || '',
                    phone: phone?.trim() || '',
                    clientId: clientId?.trim() || ''
                };
            }
        }

        // Parse SalesPerson parameter
        const salespersonEncoded = params.get("SalesPerson");
        if (salespersonEncoded) {
            const [name, email, phone] = decodeBase64(salespersonEncoded).split(",");
            
            if (name || email || phone) {
                salesData = {
                    name: name?.trim() || '',
                    email: email?.trim() || '',
                    phone: phone?.trim() || ''
                };
            }
        }

        return { clientData, salesData };
    }

    /**
     * Populate page elements with client and sales data
     */
    function populatePageData(clientData, salesData) {
        // Default values
        const defaultPhone = "971565387670";
        const defaultEmail = "setup@meydanfz.ae";

        let spPhone = defaultPhone;
        let spEmail = defaultEmail;

        // Populate client data
        if (clientData) {
            if (clientData.name) {
                document.querySelectorAll(".client-name").forEach(el => el.textContent = clientData.name);
                // Set name input fields
                const nameInputs = ["name", "client-name", "full-name"];
                nameInputs.forEach(id => {
                    const input = document.getElementById(id);
                    if (input) input.value = clientData.name;
                });
            }

            if (clientData.email) {
                document.querySelectorAll(".client-email").forEach(el => el.textContent = clientData.email);
                // Set email input fields
                const emailInputs = ["email", "client-email"];
                emailInputs.forEach(id => {
                    const input = document.getElementById(id);
                    if (input) input.value = clientData.email;
                });
            }

            if (clientData.phone) {
                document.querySelectorAll(".client-phone").forEach(el => el.textContent = clientData.phone);
                // Set phone using intl-tel-input if available
                setPhoneInputValue(["phone", "client-phone"], clientData.phone);
            }

            if (clientData.clientId) {
                document.querySelectorAll(".client-id").forEach(el => el.textContent = clientData.clientId);
                // Set client ID fields
                const clientIdSelectors = [
                    '#client-id', '[name="client-id"]',
                    '#wf-client-id', '[name="wf-client-id"]'
                ];
                clientIdSelectors.forEach(sel => {
                    const input = document.querySelector(sel);
                    if (input) input.value = clientData.clientId;
                });
            }

            // Show valued client blocks
            document.querySelectorAll(".valued-client").forEach(el => el.style.display = "block");
        }

        // Populate sales data
        if (salesData) {
            if (salesData.name) {
                document.querySelectorAll(".salesperson-name").forEach(el => el.textContent = salesData.name);
            }
            if (salesData.email) {
                document.querySelectorAll(".salesperson-email").forEach(el => el.textContent = salesData.email);
                spEmail = salesData.email;
            }
            if (salesData.phone) {
                document.querySelectorAll(".salesperson-phone").forEach(el => el.textContent = salesData.phone);
                spPhone = salesData.phone.replace(/\D/g, '') || defaultPhone;
            }
        }

        // Update button links
        document.querySelectorAll(".call-salesperson").forEach(el => el.href = `tel:${spPhone}`);
        document.querySelectorAll(".whatsapp-salesperson").forEach(el => el.href = `https://wa.me/${spPhone}`);
        document.querySelectorAll(".email-salesperson").forEach(el => el.href = `mailto:${spEmail}`);
    }

    /**
     * Set phone input using intl-tel-input with retries
     */
    function setPhoneInputValue(selectors, rawNumber) {
        let cleaned = rawNumber.trim().replace(/[\s\-().]/g, '');
        if (!cleaned.startsWith('+') && /^\d+$/.test(cleaned)) {
            cleaned = '+' + cleaned;
        }

        selectors.forEach(selector => {
            let input = document.getElementById(selector);
            if (!input) {
                input = document.querySelector(`input[name="${selector}"]`);
            }
            if (!input) return;

            let attempts = 0;
            const maxAttempts = 10;

            const trySetNumber = () => {
                // Try MFZPhone first
                if (window.MFZPhone) {
                    const instance = window.MFZPhone.getInstance(input);
                    if (instance && instance.iti && typeof instance.iti.setNumber === 'function') {
                        try {
                            instance.iti.setNumber(cleaned);
                            return;
                        } catch (e) {
                            console.warn('Could not set phone number via MFZPhone:', e);
                        }
                    }
                }

                // Fallback to intl-tel-input globals
                const iti = window.intlTelInputGlobals?.getInstance?.(input);
                if (iti && typeof iti.setNumber === 'function') {
                    try {
                        iti.setNumber(cleaned);
                        return;
                    } catch (e) {
                        console.warn('Could not set phone number via intl-tel-input:', e);
                    }
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(trySetNumber, 200);
                    return;
                }
                
                // Fallback to setting value directly
                input.value = cleaned;
            };

            trySetNumber();
        });
    }

    /**
     * Send webhook notification when shared link is opened
     */
    async function notifySharedLinkOpened(shareId, clientId) {
        if (!shareId) return;

        try {
            const webhookUrl = `https://flow.zoho.com/758936401/flow/webhook/incoming?zapikey=1001.39d22b6d92f320b9b8712ecb624775c0.de63fb6697866768a1ec4c03da42cacc&isdebug=false&share=${shareId}&oppid=${clientId || ''}`;
            
            // Use fetch with no-cors mode to avoid CORS issues
            await fetch(webhookUrl, {
                method: 'GET',
                mode: 'no-cors'
            });
            
        } catch (error) {
            console.error('Error sending webhook notification:', error);
        }
    }

    /**
     * Show all sections immediately for shared links (no progressive disclosure)
     */
    function enableFullPricingForSharedLink() {
        // Show all main sections
        const sectionsToShow = [
            'company-setup-section',
            'business-activities-section', 
            'visa-options-section',
            'change-status-section',
            'addons-section',
            'mobile-sticky-footer'
        ];
        
        sectionsToShow.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.remove('hidden');
                section.classList.add('visible');
                section.style.display = 'block';
            }
        });
        
        // Mark all sections as interacted for shared links
        sectionInteractions = {
            licenseSection: true,
            durationSection: true,
            shareholdersSection: true,
            businessActivitiesSection: true,
            visaSection: true,
            addonsSection: true
        };
        
        // Expand addons section immediately for shared links only if there are selected addons
        const addonsSection = document.getElementById('addons-summary-section');
        if (addonsSection) {
            // Check if there are any selected addons before expanding
            const hasSelectedAddons = document.querySelectorAll('.service-checkbox:checked').length > 0;
            if (hasSelectedAddons) {
                addonsSection.classList.add('expanded');
                addonsSection.style.display = 'block';
            } else {
                addonsSection.style.display = 'none';
            }
        }
        
        // Reveal pricing immediately for shared links
        pricingRevealed = true;
        const summaryContainers = document.querySelectorAll('.summary-container, .sticky-summary-container');
        summaryContainers.forEach(container => {
            container.classList.remove('summary-pricing-hidden');
            container.classList.add('summary-pricing-revealed');
        });
        
        // Also show mobile footer pricing
        const mobileFooter = document.getElementById('mobile-sticky-footer');
        if (mobileFooter) {
            mobileFooter.classList.remove('summary-pricing-hidden');
            mobileFooter.classList.add('summary-pricing-revealed');
        }
        
        // Mark contact form as completed to bypass form validation
        isContactFormCompleted = true;
        const contactSection = document.getElementById('personal-details-section');
        if (contactSection) {
            contactSection.classList.add('validated');
        }
    }

    /**
     * Collect all current form values for sharing
     */
    function collectFormConfiguration() {
        // Contact Information
        let phoneValue = document.getElementById("phone")?.value?.trim() || '';
        
        // Format phone number - get the E.164 formatted number if using MFZPhone
        const phoneField = document.getElementById("phone");
        if (window.MFZPhone && phoneField && phoneValue) {
            try {
                const formattedPhone = window.MFZPhone.getFormattedNumber(phoneField);
                if (formattedPhone) {
                    phoneValue = formattedPhone;
                }
            } catch (err) {
            }
        }
        
        const contactData = {
            fullName: document.getElementById("full-name")?.value?.trim() || '',
            email: document.getElementById("email")?.value?.trim() || '',
            phone: phoneValue
        };

        // License Configuration
        const licenseData = {
            licenseType: document.getElementById("license-type")?.value || "fawri",
            licenseDuration: parseInt(document.getElementById("license-duration")?.value) || 1,
            shareholdersCount: parseInt(document.getElementById("shareholders-range")?.value) || 1
        };

        // Visa Configuration
        const visaData = {
            investorVisas: parseInt(document.getElementById("investor-visa-count")?.value) || 0,
            employeeVisas: parseInt(document.getElementById("employee-visa-count")?.value) || 0,
            dependencyVisas: parseInt(document.getElementById("dependency-visas")?.value) || 0
        };

        // Business Activities
        const activitiesData = {
            selectedActivities: window.selectedActivities || [],
            selectedActivitiesCount: window.selectedActivities ? window.selectedActivities.length : 0
        };

        // Add-ons
        const selectedAddons = [];
        document.querySelectorAll('.service-checkbox:checked').forEach(checkbox => {
            selectedAddons.push(checkbox.value);
        });

        // Change Status
        const changeStatusData = {
            applicantsInsideUAE: parseInt(document.getElementById("applicants-inside-uae")?.value) || 0,
            applicantsOutsideUAE: parseInt(document.getElementById("applicants-outside-uae")?.value) || 0
        };

        return {
            contact: contactData,
            license: licenseData,
            visa: visaData,
            activities: activitiesData,
            addons: selectedAddons,
            changeStatus: changeStatusData,
            timestamp: Date.now()
        };
    }

    /**
     * Encode configuration data to Base64 for URL sharing
     * Using the same method as your existing Client/SalesPerson encoding
     */
    function encodeConfigurationToBase64(configData) {
        try {
            const jsonString = JSON.stringify(configData);
            // Use escape() + encodeURIComponent() like your existing system
            return btoa(unescape(encodeURIComponent(jsonString)));
        } catch (e) {
            console.error("Configuration encode error", e);
            return '';
        }
    }

    /**
     * Decode configuration data from Base64
     * Using the same method as your existing decodeBase64 function
     */
    function decodeConfigurationFromBase64(encodedString) {
        try {
            // Use the same decoding method as your existing decodeBase64 function
            const jsonString = decodeURIComponent(escape(atob(encodedString)));
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Configuration decode error", e);
            return null;
        }
    }

    /**
     * Generate shareable URL with current configuration
     */
    function generateShareableURL() {
        const configData = collectFormConfiguration();
        const encodedConfig = encodeConfigurationToBase64(configData);
        
        if (!encodedConfig) {
            console.error("Failed to encode configuration");
            return null;
        }

        const currentURL = new URL(window.location.href);
        // Keep existing Client and SalesPerson parameters if they exist
        const params = new URLSearchParams(currentURL.search);
        
        // Add or update the configuration parameter
        params.set("Config", encodedConfig);
        
        const finalURL = `${currentURL.origin}${currentURL.pathname}?${params.toString()}`;
        return finalURL;
    }

    /**
     * Apply shared configuration to form fields
     */
    function applySharedConfiguration(configData) {
        if (!configData) {
            return;
        }
        
        // Temporarily disable scrolling during form population
        const originalMobileUserHasInteracted = mobileUserHasInteracted;
        mobileUserHasInteracted = false;
        
        // Disable real-time updates during configuration loading
        isLoadingSharedConfiguration = true;

        try {
            // Apply contact information (only if fields are empty to not override client data)
            if (configData.contact) {
                const nameField = document.getElementById("full-name");
                const emailField = document.getElementById("email");
                const phoneField = document.getElementById("phone");

                if (nameField && !nameField.value && configData.contact.fullName) {
                    nameField.value = configData.contact.fullName;
                }
                if (emailField && !emailField.value && configData.contact.email) {
                    emailField.value = configData.contact.email;
                }
                if (phoneField && !phoneField.value && configData.contact.phone) {
                    
                    // For UAE numbers, extract just the local part to avoid leading 0 issue
                    let phoneToSet = configData.contact.phone;
                    if (phoneToSet.startsWith('+971')) {
                        // Extract the local number part (everything after +971)
                        const localNumber = phoneToSet.substring(4);
                        
                        // Set just the local number directly to the input field
                        phoneField.value = localNumber;
                        
                        // Trigger any necessary events
                        phoneField.dispatchEvent(new Event('input', { bubbles: true }));
                        phoneField.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        // For non-UAE numbers, try MFZPhone first
                        if (window.MFZPhone) {
                            const instance = window.MFZPhone.getInstance(phoneField);
                            if (instance && instance.iti && typeof instance.iti.setNumber === 'function') {
                                try {
                                    instance.iti.setNumber(phoneToSet);
                                } catch (err) {
                                    phoneField.value = phoneToSet;
                                }
                            } else {
                                phoneField.value = phoneToSet;
                            }
                        } else {
                            phoneField.value = phoneToSet;
                        }
                    }
                }
            } else {
            }

            // Apply license configuration
                    if (configData.license) {
                
                // Set license type
                if (configData.license.licenseType) {
                    if (typeof selectLicenseType === 'function') {
                        selectLicenseType(configData.license.licenseType);
                    } else {
                        const licenseTypeField = document.getElementById("license-type");
                        if (licenseTypeField) {
                            licenseTypeField.value = configData.license.licenseType;
                        }
                    }
                }

                // Set license duration
                if (configData.license.licenseDuration) {
                    const durationField = document.getElementById("license-duration");
                    if (durationField) {
                        durationField.value = configData.license.licenseDuration;
                    }
                    
                    // Trigger the duration button selection
                    const durationBtn = document.querySelector(`[data-value="${configData.license.licenseDuration}"]`);
                    if (durationBtn) {
                        durationBtn.click();
                    }
                }

                // Set shareholders count
                if (configData.license.shareholdersCount) {
                    const shareholdersRange = document.getElementById("shareholders-range");
                    
                    if (shareholdersRange) {
                        shareholdersRange.value = configData.license.shareholdersCount;
                        
                        // For any shareholders count, ensure the UI reflects the value
                        // Even with count = 1, we need to update the display properly
                        
                        // Check if shareholders are already selected or need to be selected
                        const selectedControls = document.getElementById('shareholders-selected-controls');
                        const shouldSelect = configData.license.shareholdersCount >= 1;
                        
                        if (shouldSelect && selectedControls) {
                            // Ensure shareholders section is selected
                            if (typeof selectVisaCard === 'function') {
                                selectVisaCard('shareholders');
                            }
                            
                            // Update the quantity display
                            setTimeout(() => {
                                const quantityElement = document.getElementById('shareholders-quantity');
                                if (quantityElement) {
                                    quantityElement.textContent = configData.license.shareholdersCount;
                                }
                                
                                // Also ensure the range slider matches
                                shareholdersRange.value = configData.license.shareholdersCount;
                            }, 200);
                        }
                        
                        // Trigger change event
                        shareholdersRange.dispatchEvent(new Event('change'));
                    }
                }
            } else {
            }

            // Apply visa configuration
            if (configData.visa) {
                
                // Set investor visas
                if (configData.visa.investorVisas > 0) {
                    document.getElementById("investor-visa-count").value = configData.visa.investorVisas;
                    
                    // Use toggleVisaCard for investor visa
                    if (typeof toggleVisaCard === 'function') {
                        const toggle = document.getElementById('investor-visa-toggle');
                        if (toggle) toggle.checked = true;
                        toggleVisaCard('investor');
                    }
                    
                    // Update quantity
                    setTimeout(() => {
                        const quantityElement = document.getElementById("investor-quantity");
                        if (quantityElement) {
                            quantityElement.textContent = configData.visa.investorVisas;
                        }
                    }, 200);
                }

                // Set employee visas (allow 0 values)
                if (configData.visa.employeeVisas >= 0) {
                    document.getElementById("employee-visa-count").value = configData.visa.employeeVisas;
                    
                    // Only select visa card if count > 0, but don't reset the value
                    if (configData.visa.employeeVisas > 0) {
                        // Manually show the selected state without calling selectVisaCard which resets to 1
                        const card = document.querySelector(`[data-visa="employee"]`);
                        const selectBtn = card?.querySelector('.select-btn');
                        const selectedControls = document.getElementById('employee-selected-controls');
                        const selectedBtn = selectedControls?.querySelector('.select-btn');
                        
                        if (card && selectBtn && selectedControls) {
                            card.classList.add('selected');
                            selectBtn.style.display = 'none';
                            selectedControls.style.display = 'flex';
                            
                            if (selectedBtn && typeof updateButtonState === 'function') {
                                updateButtonState(selectedBtn, true);
                            }
                        }
                    }
                    
                    // Update quantity
                    setTimeout(() => {
                        const quantityElement = document.getElementById("employee-quantity");
                        if (quantityElement) {
                            quantityElement.textContent = configData.visa.employeeVisas;
                        }
                    }, 200);
                }

                // Set dependency visas
                if (configData.visa.dependencyVisas > 0) {
                    
                    // First select the visa card
                    if (typeof selectVisaCard === 'function') {
                        selectVisaCard('dependent');
                    }
                    
                    // Update quantity and hidden input properly
                    setTimeout(() => {
                        const quantityElement = document.getElementById("dependent-quantity");
                        const hiddenInput = document.getElementById("dependency-visas");
                        
                        if (quantityElement) {
                            quantityElement.textContent = configData.visa.dependencyVisas;
                        }
                        
                        if (hiddenInput) {
                            hiddenInput.value = configData.visa.dependencyVisas;
                            
                            // Trigger change event on hidden input to update calculations
                            hiddenInput.dispatchEvent(new Event('change'));
                        }
                    }, 200);
                }
            } else {
            }

            // Apply business activities
                if (configData.activities && configData.activities.selectedActivities && configData.activities.selectedActivities.length > 0) {
                window.selectedActivities = configData.activities.selectedActivities;
                
                // Update activities display - manually update each group card
                configData.activities.selectedActivities.forEach(activity => {
                    const groupName = activity.groupName || mapCategoryToGroup(activity.Category, activity.Group);
                    
                    // Find the corresponding group card
                    const groupCard = document.querySelector(`.activity-card[data-group="${groupName}"]`);
                    if (groupCard) {
                        
                        // Count activities in this group
                        const activitiesInGroup = window.selectedActivities.filter(act => {
                            const activityGroupName = act.groupName || mapCategoryToGroup(act.Category, act.Group);
                            return activityGroupName === groupName;
                        }).length;
                        
                        
                        if (activitiesInGroup > 0) {
                            // Mark group as selected
                            groupCard.classList.add('selected');
                            
                            // Update count display
                            const countElement = groupCard.querySelector('.selected-activities-count');
                            const linkElement = groupCard.querySelector('.select-activity-link');
                            
                            if (countElement) {
                                countElement.style.display = 'block';
                                countElement.textContent = `Selected Activities: ${activitiesInGroup}`;
                            }
                            
                            if (linkElement) {
                                linkElement.innerHTML = 'Select more activities <span class="link-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M8.97135 1.3842L8.97135 6.95266C8.97135 7.12702 8.90209 7.29423 8.77881 7.41751C8.6555 7.54082 8.48829 7.61008 8.31396 7.61005C8.13961 7.61005 7.97237 7.54082 7.84909 7.41754C7.72581 7.29426 7.65658 7.12702 7.65658 6.95266L7.65732 2.96966L1.97284 8.65414C1.84977 8.77721 1.68286 8.84636 1.50882 8.84636C1.33477 8.84636 1.16783 8.7772 1.04477 8.65414C0.921702 8.53108 0.852573 8.36417 0.852573 8.19012C0.852573 8.01607 0.921696 7.84913 1.04477 7.72606L6.72924 2.04159L2.74584 2.04045C2.57152 2.04042 2.40428 1.97119 2.281 1.8479C2.15772 1.72462 2.08848 1.55738 2.08846 1.38306C2.08846 1.20871 2.15772 1.0415 2.281 0.918217C2.40431 0.794907 2.57152 0.725644 2.74584 0.725672L8.3143 0.725666C8.40077 0.725573 8.48637 0.742556 8.56622 0.775628C8.64606 0.808698 8.71861 0.857237 8.77967 0.918428C8.84071 0.979636 8.88925 1.05219 8.92232 1.13203C8.95539 1.21188 8.97237 1.29748 8.97235 1.38395L8.97135 1.3842Z" fill="#000" fill-opacity="0.6"/></svg></span>';
                            }
                        }
                    } else {
                    }
                });
                
                // Update the selected groups count
                if (typeof updateSelectedGroupsCount === 'function') {
                    updateSelectedGroupsCount();
                }
                
            } else {
            }

            // First, clear all existing add-ons to ensure only shared configuration is applied
            document.querySelectorAll('.service-checkbox').forEach(checkbox => {
                checkbox.checked = false;
                const pill = document.querySelector(`.service-pill[data-service="${checkbox.value}"]`);
                if (pill) {
                    pill.classList.remove('selected');
                    const checkIcon = pill.querySelector('.check-icon');
                    if (checkIcon) {
                        checkIcon.remove();
                    }
                }
            });

            // Apply add-ons from shared configuration
            if (configData.addons && Array.isArray(configData.addons) && configData.addons.length > 0) {
                configData.addons.forEach(addonValue => {
                    const checkbox = document.querySelector(`.service-checkbox[value="${addonValue}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        
                        // Use selectService function to properly update the UI
                        if (typeof selectService === 'function') {
                            selectService(addonValue);
                        } else {
                            // Fallback: trigger change event
                            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                });
            }

            // Apply change status data
            if (configData.changeStatus && (configData.changeStatus.applicantsInsideUAE >= 0 || configData.changeStatus.applicantsOutsideUAE >= 0)) {
                
                // Update inside UAE applicants (allow 0 values)
                if (configData.changeStatus.applicantsInsideUAE >= 0) {
                    const insideField = document.getElementById("applicants-inside-uae");
                    const insideQuantityDisplay = document.getElementById("inside-quantity");
                    
                    if (insideField) {
                        insideField.value = configData.changeStatus.applicantsInsideUAE;
                        
                        // Update quantity display
                        if (insideQuantityDisplay) {
                            insideQuantityDisplay.textContent = configData.changeStatus.applicantsInsideUAE;
                        }
                        
                        // Trigger change event to update calculations
                        insideField.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                
                // Update outside UAE applicants (allow 0 values)
                if (configData.changeStatus.applicantsOutsideUAE >= 0) {
                    const outsideField = document.getElementById("applicants-outside-uae");
                    const outsideCountDisplay = document.getElementById("outside-count");
                    
                    if (outsideField) {
                        outsideField.value = configData.changeStatus.applicantsOutsideUAE;
                        
                        // Update count display
                        if (outsideCountDisplay) {
                            outsideCountDisplay.textContent = configData.changeStatus.applicantsOutsideUAE;
                        }
                        
                        // Trigger change event to update calculations
                        outsideField.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }

            // Re-enable scrolling and updates after form is populated, then calculate
            setTimeout(() => {
                // Allow user to scroll manually now that form is populated
                mobileUserHasInteracted = true;
                
                // Re-enable real-time updates after form is fully loaded
                isLoadingSharedConfiguration = false;
                
                // Now calculate costs with the correct form values
                setTimeout(() => {
                    if (typeof calculateCosts === 'function') {
                        calculateCosts();
                        // Force a second calculation to ensure everything is up to date
                        setTimeout(() => {
                            calculateCosts();
                        }, 200);
                    }
                }, 100);
                
                // Keep user at the top of the page initially on mobile
                if (window.innerWidth <= 768 && isSharedLinkSession) {
                    window.scrollTo({
                        top: 0,
                        behavior: 'auto'
                    });
                }
            }, 800); // Increased delay to ensure all form updates are complete

        } catch (error) {
            console.error("Error applying shared configuration:", error);
            // Re-enable scrolling and updates even if there was an error
            mobileUserHasInteracted = true;
            isLoadingSharedConfiguration = false;
            
            // Ensure calculations work even after error
            setTimeout(() => {
                if (typeof calculateCosts === 'function') {
                    calculateCosts();
                }
            }, 500);
        }
    }

    /**
     * Copy shareable URL to clipboard
     */
    async function copyShareableURL() {
        const shareableURL = generateShareableURL();
        
        if (!shareableURL) {
            alert("Unable to generate shareable URL. Please ensure you have filled out the form.");
            return;
        }

        try {
            await navigator.clipboard.writeText(shareableURL);
            
            // Show success feedback
            showShareSuccessMessage();
            
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = shareableURL;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showShareSuccessMessage();
            } catch (fallbackErr) {
                console.error('Could not copy URL: ', fallbackErr); 
                alert("Unable to copy URL automatically. Please copy this URL manually:\n\n" + shareableURL);
            }
            
            document.body.removeChild(textArea);
        }
    }

    /**
     * Show success message after copying URL
     */
    function showShareSuccessMessage() {
        // Create and show a temporary success message
        const successDiv = document.createElement('div');
        successDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: inherit;
                font-size: 14px;
                font-weight: 500;
            ">
                ✓ Shareable URL copied to clipboard!
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    /**
     * Share via WhatsApp
     */
    function shareViaWhatsApp() {
        const shareableURL = generateShareableURL();
        if (!shareableURL) {
            alert("Unable to generate shareable URL. Please ensure you have filled out the form.");
            return;
        }
        const message = "Check out this business setup configuration: " + shareableURL;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }

    /**
     * Share via Email
     */
    function shareViaEmail() {
        const shareableURL = generateShareableURL();
        if (!shareableURL) {
            alert("Unable to generate shareable URL. Please ensure you have filled out the form.");
            return;
        }
        const subject = "Business Setup Configuration";
        const body = `Hi,\n\nI've configured a business setup calculator with specific requirements. You can view it here:\n\n${shareableURL}\n\nBest regards`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }

    /**
     * Initialize sharing functionality on page load
     */
    function initializeSharing() {
        // Check for shared configuration in URL (both static and dynamic)
        const params = new URLSearchParams(window.location.search);
        const configParam = params.get("Config");
        const shareParam = params.get("share");
        const legacyDynamicParam = params.get("DynamicConfig"); // For backward compatibility
        
        if (configParam) {
            const configData = decodeConfigurationFromBase64(configParam);
            if (configData) {
                // Apply the shared configuration after a short delay to ensure DOM is ready
                setTimeout(() => {
                    applySharedConfiguration(configData);
                }, 1000);
            }
        } else if (shareParam || legacyDynamicParam) {
        }
        
    }

    // Make functions globally accessible
    window.collectFormConfiguration = collectFormConfiguration;
    window.generateShareableURL = generateShareableURL;
    window.copyShareableURL = copyShareableURL;
    window.shareViaWhatsApp = shareViaWhatsApp;
    window.shareViaEmail = shareViaEmail;

    window.applySharedConfiguration = applySharedConfiguration;
    window.initializeSharing = initializeSharing;

    // =================== DYNAMIC CONFIGURATION SHARING WITH SUPABASE ===================
    
    // Global variables for dynamic sharing (using var to avoid TDZ issues)
    var currentConfigId = null;
    var currentShareableURL = null;
    var urlUpdateTimeout = null;
    
    // Generate unique configuration ID
    function generateConfigId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `calc_${timestamp}_${randomStr}`;
    }
    
    // Debounce function to prevent excessive updates
    function calcDebounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Store configuration in Supabase
    async function storeConfiguration(configId, configData, clientData = null, salesData = null) {
        try {
            
            // Check if record exists first
            const { data: existing } = await supabaseClient
                .from('shared_configs')
                .select('id, created_at')
                .eq('id', configId)
                .single();
            
            const now = new Date().toISOString();
            const upsertData = {
                id: configId,
                config_data: configData,
                updated_at: now
            };
            
            // Only set created_at if it's a new record
            if (!existing) {
                upsertData.created_at = now;
            }

            // Add client data if provided (only for new records or if explicitly updating)
            if (clientData && (!existing || clientData.forceUpdate)) {
                upsertData.client_name = clientData.name;
                upsertData.client_email = clientData.email;
                upsertData.client_phone = clientData.phone;
                upsertData.client_id = clientData.clientId;
            }

            // Add sales data if provided (only for new records or if explicitly updating)
            if (salesData && (!existing || salesData.forceUpdate)) {
                upsertData.salesperson_name = salesData.name;
                upsertData.salesperson_email = salesData.email;
                upsertData.salesperson_phone = salesData.phone;
            }
            
            const { data, error } = await supabaseClient
                .from('shared_configs')
                .upsert(upsertData);
            
            if (error) {
                console.error('Error storing configuration:', error);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error storing configuration:', error);
            return false;
        }
    }
    
    // Load configuration from Supabase
    async function loadConfiguration(configId) {
        try {
            
            const { data, error } = await supabaseClient
                .from('shared_configs')
                .select('config_data, client_name, client_email, client_phone, client_id, salesperson_name, salesperson_email, salesperson_phone')
                .eq('id', configId)
                .single();
            
            if (error) {
                console.error('Error loading configuration:', error);
                return null;
            }
            
            return {
                config_data: data?.config_data || null,
                client_data: data?.client_name ? {
                    name: data.client_name,
                    email: data.client_email,
                    phone: data.client_phone,
                    clientId: data.client_id
                } : null,
                sales_data: data?.salesperson_name ? {
                    name: data.salesperson_name,
                    email: data.salesperson_email,
                    phone: data.salesperson_phone
                } : null
            };
        } catch (error) {
            console.error('Error loading configuration:', error);
            return null;
        }
    }
    
    // Generate dynamic shareable URL
    async function generateDynamicShareableURL() {
        try {
            const configData = collectFormConfiguration();
            
            // Get or create config ID
            if (!currentConfigId) {
                currentConfigId = generateConfigId();
                sessionStorage.setItem('currentConfigId', currentConfigId);
            }
            
            // Store configuration
            const stored = await storeConfiguration(currentConfigId, configData);
            if (!stored) {
                console.error('Failed to store configuration');
                return null;
            }
            
            // Generate URL with config ID
            const currentUrl = new URL(window.location);
            const params = new URLSearchParams(currentUrl.search);
            
            // Preserve existing Client and SalesPerson parameters
            const existingClient = params.get("Client");
            const existingSalesPerson = params.get("SalesPerson");
            
            // Clear params and add back essential ones
            params.delete("Config"); // Remove old static config
            if (existingClient) params.set("Client", existingClient);
            if (existingSalesPerson) params.set("SalesPerson", existingSalesPerson);
            
            // Add dynamic config ID with new parameter name
            params.set("share", currentConfigId);
            
            const shareableURL = `${currentUrl.protocol}//${currentUrl.host}${currentUrl.pathname}?${params.toString()}`;
            
            return shareableURL;
        } catch (error) {
            console.error('Error generating dynamic shareable URL:', error);
            return null;
        }
    }
    
    // Update configuration in real-time
    const updateDynamicConfiguration = calcDebounce(async () => {
        if (currentConfigId) {
            try {
                const configData = collectFormConfiguration();
                await storeConfiguration(currentConfigId, configData);
            } catch (error) {
                console.error('Error updating dynamic configuration:', error);
            }
        }
    }, 1500); // 1.5 second calcDebounce
    
    // Initialize dynamic sharing on page load
    async function initializeDynamicSharing() {
        
        // Check URL for dynamic config
        const urlParams = new URLSearchParams(window.location.search);
        const dynamicConfigId = urlParams.get("DynamicConfig");
        
        if (dynamicConfigId) {
            
            // Load and apply configuration
            const configData = await loadConfiguration(dynamicConfigId);
            if (configData) {
                setTimeout(() => {
                    applySharedConfiguration(configData);
                }, 2000); // Wait for page to be ready
                
                // Set this as current config ID for updates
                currentConfigId = dynamicConfigId;
                sessionStorage.setItem('currentConfigId', dynamicConfigId);
            } else {
                // Fallback to static config if available
                const staticConfig = urlParams.get("Config");
                if (staticConfig) {
                    const staticConfigData = decodeConfigurationFromBase64(staticConfig);
                    if (staticConfigData) {
                        setTimeout(() => {
                            applySharedConfiguration(staticConfigData);
                        }, 2000);
                    }
                }
            }
        } else {
            // Check for existing config ID in sessionStorage
            const existingConfigId = sessionStorage.getItem('currentConfigId');
            if (existingConfigId) {
                currentConfigId = existingConfigId;
            }
        }
        
        // Set up real-time updates
        setupRealTimeUpdates();
    }
    
    // Set up real-time configuration updates
    function setupRealTimeUpdates() {
        
        // Add event listeners to all form inputs
        const formInputs = document.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', updateDynamicConfiguration);
            input.addEventListener('input', updateDynamicConfiguration);
        });
        
        // Add listeners for custom events (clicks on buttons, cards, etc.)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.quantity-btn, .select-btn, .visa-card, .activity-card, .service-checkbox, .addon-category-card')) {
                updateDynamicConfiguration();
            }
        });
        
        // Hook into calculateCosts function
        const originalCalculateCosts = window.calculateCosts;
        if (originalCalculateCosts && typeof originalCalculateCosts === 'function') {
            window.calculateCosts = function(...args) {
                const result = originalCalculateCosts.apply(this, args);
                updateDynamicConfiguration();
                return result;
            };
        }
        
    }
    
    // Enhanced copy function for dynamic URLs
    async function copyDynamicShareableURL() {
        const shareableURL = await generateDynamicShareableURL();
        
        if (!shareableURL) {
            alert("Unable to generate shareable URL. Please ensure you have filled out the form.");
            return;
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareableURL);
                showShareSuccessMessage();
            } else {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = shareableURL;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    showShareSuccessMessage();
                } catch (err) {
                    console.error('Fallback copy failed:', err);
                    alert("Copy failed. Please copy the URL manually: " + shareableURL);
                }
                
                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            alert("Copy failed. Please copy the URL manually: " + shareableURL);
        }
    }

    // New share button handler with animations
    async function handleShareClick() {
        const shareBtn = document.getElementById('share-btn');
        const shareText = shareBtn.querySelector('.share-text');
        const shareLoading = shareBtn.querySelector('.share-loading');
        const shareCopied = shareBtn.querySelector('.share-copied');
        const shareIcon = shareBtn.querySelector('.share-icon');
        
        // Show loading state
        shareBtn.classList.add('loading');
        shareBtn.disabled = true;
        shareText.style.display = 'none';
        shareLoading.style.display = 'inline';
        shareCopied.style.display = 'none';
        
        try {
            const shareableURL = await generateDynamicShareableURL();
            
            if (!shareableURL) {
                // Reset to normal state
                shareBtn.classList.remove('loading');
                shareBtn.disabled = false;
                shareText.style.display = 'inline';
                shareLoading.style.display = 'none';
                
                alert("Unable to generate shareable URL. Please ensure you have filled out the form.");
                return;
            }

            // Copy to clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareableURL);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = shareableURL;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            // Show copied state
            shareBtn.classList.remove('loading');
            shareBtn.classList.add('copied');
            shareText.style.display = 'none';
            shareLoading.style.display = 'none';
            shareCopied.style.display = 'inline';
            
            // Reset to normal after 3 seconds
            setTimeout(() => {
                shareBtn.classList.remove('copied');
                shareBtn.disabled = false;
                shareText.style.display = 'inline';
                shareLoading.style.display = 'none';
                shareCopied.style.display = 'none';
            }, 3000);
            
        } catch (err) {
            console.error('Error in handleShareClick:', err);
            
            // Reset to normal state on error
            shareBtn.classList.remove('loading');
            shareBtn.disabled = false;
            shareText.style.display = 'inline';
            shareLoading.style.display = 'none';
            shareCopied.style.display = 'none';
            
            alert("Copy failed. Please try again.");
        }
    }
    
    // Enhanced WhatsApp sharing for dynamic URLs
    async function shareViaDynamicWhatsApp() {
        const shareableURL = await generateDynamicShareableURL();
        
        if (!shareableURL) {
            alert("Unable to generate shareable URL. Please ensure you have filled out the form.");
            return;
        }
        
        const message = encodeURIComponent(`Check out this business setup calculator configuration: ${shareableURL}`);
        const whatsappUrl = `https://wa.me/?text=${message}`;
        window.open(whatsappUrl, '_blank');
    }
    
    // Enhanced email sharing for dynamic URLs
    async function shareViaDynamicEmail() {
        const shareableURL = await generateDynamicShareableURL();
        
        if (!shareableURL) {
            alert("Unable to generate shareable URL. Please ensure you have filled out the form.");
            return;
        }
        
        const subject = encodeURIComponent("Business Setup Calculator Configuration");
        const body = encodeURIComponent(`Hi,\n\nI've prepared a business setup calculation for you. You can view it here:\n\n${shareableURL}\n\nThis link will always show you the most up-to-date configuration.\n\nBest regards`);
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        window.location.href = mailtoUrl;
    }
    
    // Create new configuration (start fresh)
    async function createNewConfiguration() {
        try {
            // Generate new configuration ID
            const newConfigId = generateConfigId();
            currentConfigId = newConfigId;
            sessionStorage.setItem('currentConfigId', newConfigId);
            
            // Get current form configuration
            const configData = collectFormConfiguration();
            
            // Store with client and sales data if available
            const clientData = window.currentClientData || null;
            const salesData = window.currentSalesData || null;
            
            await storeConfiguration(newConfigId, configData, clientData, salesData);
            
            return newConfigId;
        } catch (error) {
            console.error('Error creating new configuration:', error);
            return null;
        }
    }
    

    
    // =================== UNIFIED SHARING INITIALIZATION ===================
    
    // Unified initialization function that handles both static and dynamic sharing
    function initializeUnifiedSharing() {
        try {
            // Parse URL parameters for client and sales data
            const { clientData, salesData } = parseURLParameters();
            
            // Initialize config ID from sessionStorage if available
            const existingConfigId = sessionStorage.getItem('currentConfigId');
            if (existingConfigId && !currentConfigId) {
                currentConfigId = existingConfigId;
            }
            
            // Check URL for both static and dynamic configs
            const params = new URLSearchParams(window.location.search);
            const staticConfig = params.get("Config");
            const shareConfig = params.get("share");
            const legacyDynamicConfig = params.get("DynamicConfig"); // Backward compatibility
            const dynamicConfig = shareConfig || legacyDynamicConfig;
            
            // Store client and sales data globally for later use
            if (clientData || salesData) {
                window.currentClientData = clientData;
                window.currentSalesData = salesData;
                
                // Populate page immediately if we have the data
                populatePageData(clientData, salesData);
                
                // Clean URL but preserve share parameter if it exists
                let newURL = window.location.pathname;
                if (dynamicConfig) {
                    newURL += `?share=${dynamicConfig}`;
                }
                window.history.replaceState({}, document.title, newURL);
            }
            
            // Set up event listeners for share buttons
            setupShareButtons();
            
            // Handle configuration loading
            if (dynamicConfig) {
                handleDynamicConfiguration(dynamicConfig);
            } else if (staticConfig) {
                handleStaticConfiguration(staticConfig);
            } else if (clientData || salesData) {
                // If we have client/sales data but no existing config, create a new configuration
                setTimeout(async () => {
                    if (!currentConfigId) {
                        await createNewConfiguration();
                    }
                }, 2000); // Wait for form to initialize
            }
            
            // Set up real-time updates (using manual system due to conflicts)
            setupManualRealTimeSystem();
            
        } catch (error) {
            console.error('Error in unified sharing initialization:', error);
        }
    }
    
    // Handle dynamic configuration
    async function handleDynamicConfiguration(dynamicConfigId) {
        try {
            currentConfigId = dynamicConfigId;
            sessionStorage.setItem('currentConfigId', dynamicConfigId);
            
            // Enable full pricing for shared links immediately
            enableFullPricingForSharedLink();
            
            // Track this link view
            await trackLinkView(dynamicConfigId);
            
            const result = await loadConfiguration(dynamicConfigId);
            if (result) {
                const { config_data, client_data, sales_data } = result;
                
                // Populate client and sales data on the page
                if (client_data || sales_data) {
                    populatePageData(client_data, sales_data);
                }
                
                // Send webhook notification
                if (client_data?.clientId) {
                    await notifySharedLinkOpened(dynamicConfigId, client_data.clientId);
                }
                
                // Apply form configuration
                if (config_data) {
                    setTimeout(() => {
                        applySharedConfiguration(config_data);
                    }, 1000);
                }
            } else {
                console.warn('No configuration data found for ID:', dynamicConfigId);
            }
        } catch (error) {
            console.error('Error handling dynamic configuration:', error);
        }
    }
    
    // Track link views
    async function trackLinkView(configId) {
        try {
            // Insert a new view record
            const { error } = await supabaseClient
                .from('config_views')
                .insert({
                    config_id: configId,
                    viewed_at: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    referrer: document.referrer || null
                });
            
            if (error) {
                console.error('Error tracking view:', error);
            } else {
                // Also update the last_viewed timestamp in the main shared_configs table
                await updateLastViewedTimestamp(configId);
            }
        } catch (error) {
            console.error('Error in trackLinkView:', error);
        }
    }
    
    // Update last viewed timestamp in shared_configs table
    async function updateLastViewedTimestamp(configId) {
        try {
            const { error } = await supabaseClient
                .from('shared_configs')
                .update({
                    last_viewed: new Date().toISOString()
                })
                .eq('id', configId);
            
            if (error) {
                console.error('Error updating last viewed timestamp:', error);
            }
        } catch (error) {
            console.error('Error in updateLastViewedTimestamp:', error);
        }
    }
    
    // Get view count for a config
    async function getViewCount(configId) {
        try {
            const { data, error } = await supabaseClient
                .from('config_views')
                .select('id')
                .eq('config_id', configId);
            
            if (error) {
                console.error('Error getting view count:', error);
                return 0;
            }
            
            return data ? data.length : 0;
        } catch (error) {
            console.error('Error in getViewCount:', error);
            return 0;
        }
    }
    
    // Get detailed view analytics
    async function getViewAnalytics(configId) {
        try {
            const { data, error } = await supabaseClient
                .from('config_views')
                .select('*')
                .eq('config_id', configId)
                .order('viewed_at', { ascending: false });
            
            if (error) {
                console.error('Error getting view analytics:', error);
                return null;
            }
            
            return {
                total_views: data.length,
                views: data,
                first_view: data[data.length - 1]?.viewed_at,
                last_view: data[0]?.viewed_at,
                unique_referrers: [...new Set(data.map(v => v.referrer).filter(r => r))]
            };
        } catch (error) {
            console.error('Error in getViewAnalytics:', error);
            return null;
        }
    }
    
    // Handle static configuration
    function handleStaticConfiguration(staticConfig) {
        try {
            const configData = decodeConfigurationFromBase64(staticConfig);
            if (configData) {
                setTimeout(() => {
                    applySharedConfiguration(configData);
                }, 1000);
            } else {
            }
        } catch (error) {
            console.error('Error handling static configuration:', error);
        }
    }
    
    // Set up share button event listeners
    function setupShareButtons() {
        // The new share button uses inline onclick handler
        // No additional event listener setup needed
        // handleShareClick is called directly from HTML onclick attribute
    }
    
    // Make dynamic sharing functions globally available
    window.generateDynamicShareableURL = generateDynamicShareableURL;
    window.copyDynamicShareableURL = copyDynamicShareableURL;
    window.shareViaDynamicWhatsApp = shareViaDynamicWhatsApp;
    window.shareViaDynamicEmail = shareViaDynamicEmail;
    window.initializeDynamicSharing = initializeDynamicSharing;
    window.createNewConfiguration = createNewConfiguration;
    window.handleShareClick = handleShareClick;

    window.updateDynamicConfiguration = updateDynamicConfiguration;
    window.initializeUnifiedSharing = initializeUnifiedSharing;
    
    // Expose global variables for debugging (with error handling)
    window.getCurrentConfigId = function() {
        try {
            return currentConfigId || sessionStorage.getItem('currentConfigId') || null;
        } catch (error) {
            console.error('Error getting config ID:', error);
            return null;
        }
    };
    
    window.setCurrentConfigId = function(id) {
        try {
            currentConfigId = id;
            if (id) {
                sessionStorage.setItem('currentConfigId', id);
            } else {
                sessionStorage.removeItem('currentConfigId');
            }

        } catch (error) {
            console.error('Error setting config ID:', error);
        }
    };
    


    // =================== MANUAL REAL-TIME UPDATE SYSTEM ===================
    
    // Since the automatic system has conflicts, implement a manual real-time system
    var updateTimeout = null;
    var isLoadingSharedConfiguration = false;
    
    async function manualUpdateConfig() {
        // Don't update if we're currently loading a shared configuration
        if (isLoadingSharedConfiguration) {
            return;
        }
        
        const configId = sessionStorage.getItem('currentConfigId');
        if (configId) {
            try {
                // Add a delay and validation before updating to prevent premature updates
                setTimeout(async () => {
                    // Double-check the flag after the delay
                    if (isLoadingSharedConfiguration) {
                        return;
                    }
                    
                    try {
                        const configData = collectFormConfiguration();
                        
                        // Validate the configuration before storing to prevent corrupted data
                        if (isValidConfiguration(configData)) {
                            await storeConfiguration(configId, configData);
                        }
                    } catch (error) {
                        console.error('Auto-update error:', error);
                    }
                }, 500); // Add delay to ensure form is stable
            } catch (error) {
                console.error('Auto-update error:', error);
            }
        }
    }
    
    // Validate configuration to prevent storing corrupted data
    function isValidConfiguration(config) {
        // Check for negative values that shouldn't be negative
        if (config.changeStatus) {
            if (config.changeStatus.applicantsOutsideUAE < 0) {
                console.warn('Invalid configuration: negative applicantsOutsideUAE', config.changeStatus.applicantsOutsideUAE);
                return false;
            }
            if (config.changeStatus.applicantsInsideUAE < 0) {
                console.warn('Invalid configuration: negative applicantsInsideUAE', config.changeStatus.applicantsInsideUAE);
                return false;
            }
        }
        
        // Check for invalid visa counts
        if (config.visa) {
            if (config.visa.employeeVisas < 0 || config.visa.investorVisas < 0 || config.visa.dependencyVisas < 0) {
                console.warn('Invalid configuration: negative visa counts', config.visa);
                return false;
            }
        }
        
        return true;
    }
    
    function scheduleUpdate() {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            manualUpdateConfig();
        }, 1500); // 1.5 second delay
    }
    
    function setupManualRealTimeSystem() {
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            // Add event listeners to all form inputs
            const inputs = document.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('change', scheduleUpdate);
                input.addEventListener('input', scheduleUpdate);
            });
            
            // Add click listeners for interactive elements
            document.addEventListener('click', (e) => {
                if (e.target.matches('.quantity-btn, .select-btn, .visa-card, .activity-card, .service-checkbox, .addon-category-card, .duration-pill, .license-pill')) {
                    scheduleUpdate();
                }
            });
            
            // Hook into calculateCosts if it exists
            if (typeof window.calculateCosts === 'function') {
                const originalCalculateCosts = window.calculateCosts;
                window.calculateCosts = function(...args) {
                    const result = originalCalculateCosts.apply(this, args);
                    scheduleUpdate();
                    return result;
                };
            }
        }, 2000);
    }
    
    // Export manual functions globally
    window.manualUpdateConfig = manualUpdateConfig;
    window.scheduleUpdate = scheduleUpdate;
    window.setupManualRealTimeSystem = setupManualRealTimeSystem;
    window.isValidConfiguration = isValidConfiguration;
    
    // Export loading state for other functions to check
    window.isLoadingSharedConfiguration = function() {
        return typeof isLoadingSharedConfiguration !== 'undefined' ? isLoadingSharedConfiguration : false;
    };
    
    // Export view tracking functions
    window.trackLinkView = trackLinkView;
    window.updateLastViewedTimestamp = updateLastViewedTimestamp;
    window.getViewCount = getViewCount;
    window.getViewAnalytics = getViewAnalytics;
    
    // Add fallback functions that work
    window.getCurrentConfigId = function() {
        try {
            return currentConfigId || sessionStorage.getItem('currentConfigId') || null;
        } catch (error) {
            return sessionStorage.getItem('currentConfigId');
        }
    };
    
    window.setCurrentConfigId = function(id) {
        try {
            if (typeof currentConfigId !== 'undefined') {
                currentConfigId = id;
            }
            sessionStorage.setItem('currentConfigId', id);

        } catch (error) {
            console.error('Error setting config ID:', error);
        }
    };
    
    // Ensure config ID is set from URL if available
    try {
        const dynamicConfig = new URLSearchParams(window.location.search).get('share');
        if (dynamicConfig) {
            window.setCurrentConfigId(dynamicConfig);
        }
    } catch (error) {
        console.error('Error setting config from URL:', error);
    }
    
    // Initialize from URL parameters if available
    
    // Unified initialization is now handled in initializeCalculator()
    // No need for immediate initialization here

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
        
        let calcDebounceTimer;
        if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            clearTimeout(calcDebounceTimer);
            
            if (searchTerm === '') {
                searchResultsDropdown.style.display = 'none';
                    // Show all cards when search is cleared
                    document.querySelectorAll('.activity-card').forEach(card => card.style.display = 'flex');
                return;
            }
            
            updateDropdownDimensions();
            calcDebounceTimer = setTimeout(() => searchActivities(searchTerm), 300);
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
                supabaseClient.from('Activity List').select('Code, "Activity Name", Category, Group').limit(40) : 
                supabaseClient.from('Activity List').select('Code, "Activity Name", Category, Group')
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
        
        // Display the exact value without rounding
        const formattedTotal = `AED ${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        if (totalCostDisplay) {
            totalCostDisplay.textContent = formattedTotal;
        }
        if (mobileGrandTotalPrice) {
            mobileGrandTotalPrice.textContent = formattedTotal;
        }
    }

    // Function specifically to update mobile price display




    // Mobile Auto-Scroll Functionality
    // Shared-link gating flags
    var isSharedLinkSession = false;
    var mobileUserHasInteracted = false;
    var originalWindowScrollTo = null;
    var originalElementScrollIntoView = null;
    
    function canAutoScroll() {
        return !isSharedLinkSession || mobileUserHasInteracted;
    }
    
    function initializeMobileAutoScroll() {
        // Only run on mobile devices
        if (window.innerWidth > 768) return;
        
        // Detect shared-link session and gate auto-scroll until first interaction
        try {
            // Prevent browser restoring previous scroll on navigation
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
            
            const params = new URLSearchParams(window.location.search);
            isSharedLinkSession = !!(params.get('share') || params.get('DynamicConfig') || params.get('Config'));
            mobileUserHasInteracted = false; // Always require interaction first
            
            if (isSharedLinkSession) {
                // Capture original programmatic scroll functions and gate them
                if (!originalWindowScrollTo) originalWindowScrollTo = window.scrollTo.bind(window);
                if (!originalElementScrollIntoView) originalElementScrollIntoView = Element.prototype.scrollIntoView;
                
                window.scrollTo = function(...args) {
                    if (!mobileUserHasInteracted) return;
                    return originalWindowScrollTo(...args);
                };
                
                Element.prototype.scrollIntoView = function(...args) {
                    if (!mobileUserHasInteracted) return;
                    return originalElementScrollIntoView.apply(this, args);
                };
                
                // Keep user at the top of the page initially
                setTimeout(() => {
                    if (originalWindowScrollTo) {
                        originalWindowScrollTo(0, 0);
                    } else {
                        window.scrollTo(0, 0);
                    }
                }, 100);
                // Unlock auto-scroll on first user interaction
                const unlock = () => {
                    mobileUserHasInteracted = true;
                    document.removeEventListener('click', unlock, true);
                    document.removeEventListener('touchstart', unlock, true);
                };
                
                document.addEventListener('click', unlock, { once: true, capture: true });
                document.addEventListener('touchstart', unlock, { once: true, capture: true });
            }
        } catch (err) { 
            console.error('Error in shared link scroll handling:', err);
        }
        
        // Function to scroll to next card by ID
        const scrollToNextCard = (currentElement, cardSelector) => {
            if (!canAutoScroll()) return;
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
            if (!canAutoScroll()) return;
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
                if (!canAutoScroll()) return;
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
            if (!canAutoScroll()) return;
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
                if (!canAutoScroll()) return;
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
                        if (!canAutoScroll()) return;
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
                    if (!canAutoScroll()) return;
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
                if (!canAutoScroll()) return;
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
                if (!canAutoScroll()) return;
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
                if (!canAutoScroll()) return;
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
                if (!canAutoScroll()) return;
                scrollToNextCard(category, '.addon-category-card');
            });
        });
        
        // Service selection within addons
        const serviceCheckboxes = document.querySelectorAll('.addons-container input[type="checkbox"]');
        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (!canAutoScroll()) return;
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
                    
                    // If using MFZPhone, set the number properly
                    if (window.MFZPhone) {
                        const instance = window.MFZPhone.getInstance(phoneField);
                        if (instance && instance.iti && typeof instance.iti.setNumber === 'function') {
                            try {
                                instance.iti.setNumber(userData.phone);
                            } catch (e) {
                                console.warn('Could not set phone number via MFZPhone:', e);
                            }
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
        const stickyButtonsClass = document.querySelector('.sticky-buttons');
        const calculatorSection = document.getElementById('MFZ-NewCostCalForm');

        if ((!stickyButtons && !stickyButtonsClass) || !calculatorSection) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Calculator is in viewport - hide sticky buttons
                    if (stickyButtons) stickyButtons.classList.add('hidden');
                    if (stickyButtonsClass) stickyButtonsClass.classList.add('hidden');
                } else {
                    // Calculator is out of viewport - show sticky buttons
                    if (stickyButtons) stickyButtons.classList.remove('hidden');
                    if (stickyButtonsClass) stickyButtonsClass.classList.remove('hidden');
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