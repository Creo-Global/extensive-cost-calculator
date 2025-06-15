    let currentStep = 1;
    const totalSteps = 6; 
    const displayTotalSteps = 7; 
    let selectedActivities = []; 

    let LicenseCost = 0;
    let VisaCost = 0;
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 60000; 
    let firstStepData = null;
    let hasStartedForm = false;
    let hasSubmittedIncomplete = false;

    document.addEventListener('DOMContentLoaded', function() {
        try {
            hasStartedForm = false;
            updateProgressBar(1);
            
            sessionStorage.removeItem('editMode');
            sessionStorage.removeItem('returnToStep');
            
            document.querySelectorAll('.activity-count').forEach(count => {
                count.style.display = 'none';
            });
            
            selectedActivities = [];
            
            document.querySelectorAll('.activity-group').forEach(group => {
                group.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    
                    if (this.classList.contains('selected') && this.getAttribute('data-count') === "0") {
                        this.setAttribute('data-count', "0");
                        
                        const countElement = this.querySelector('.activity-count');
                        if (!countElement) {
                            const countSpan = document.createElement('span');
                            countSpan.className = 'activity-count';
                            countSpan.textContent = ' (0)';
                            this.appendChild(countSpan);
                        } else {
                            countElement.textContent = ' (0)';
                        }
                        
                        const plusIcon = this.querySelector('.plus-icon');
                        if (plusIcon) {
                            plusIcon.style.display = 'inline-flex';
                            plusIcon.style.visibility = 'visible';
                        }
                    } else if (!this.classList.contains('selected')) {
                        this.setAttribute('data-count', "0");
                        
                        const plusIcon = this.querySelector('.plus-icon');
                        if (plusIcon) {
                            plusIcon.style.display = 'none';
                            plusIcon.style.visibility = 'hidden';
                        }
                    }
                    
                    const selectedGroups = document.querySelectorAll('.activity-group.selected');
                    document.getElementById('groups-selected-count').textContent = selectedGroups.length;
                    
                    let totalActivities = 0;
                    selectedGroups.forEach(group => {
                        totalActivities += parseInt(group.getAttribute('data-count') || "0");
                    });
                    document.getElementById('activities-selected-count').textContent = totalActivities;
                    
                    selectedActivities = [];
                    selectedGroups.forEach(group => {
                        const groupName = group.textContent.trim().split('(')[0].trim();
                        const count = parseInt(group.getAttribute('data-count') || "0");
                        
                        for (let i = 1; i <= count; i++) {
                            selectedActivities.push(groupName + ' Activity ' + i);
                        }
                    });
                });
            });
            
            const searchInput = document.querySelector('.activity-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const searchTerm = this.value.toLowerCase().trim();
                    
                    document.querySelectorAll('.activity-group').forEach(group => {
                        const groupText = group.textContent.toLowerCase();
                        if (searchTerm === '' || groupText.includes(searchTerm)) {
                            group.style.display = 'flex';
                        } else {
                            group.style.display = 'none';
                        }
                    });
                });
            }
        } catch (err) {
            console.error("Error during DOMContentLoaded initialization:", err);
        }
    });

    document.addEventListener('change', function(e) {
        const isFormField = e.target.tagName === 'INPUT' || 
                            e.target.tagName === 'SELECT' || 
                            e.target.tagName === 'TEXTAREA';
        
        if (isFormField && !hasStartedForm) {
            hasStartedForm = true;
        }
    });

    function updateProgressBar(step) {
        const progressBar = document.querySelector('#srix-NewCostCalForm .step-progress');
        
        if (progressBar) {
            let progressWidth;
            switch(step) {
                case 1: progressWidth = '12%'; break;
                case 2: progressWidth = '25%'; break;
                case 3: progressWidth = '42%'; break;
                case 4: progressWidth = '57%'; break;
                case 5: progressWidth = '71%'; break;
                case 6: progressWidth = '85%'; break;
                case 7: progressWidth = '100%'; break;
                default: progressWidth = '12%';
            }
            progressBar.style.width = progressWidth;
        }
    }

    function updateProgressPill(step) {
        const displayStep = (step > totalSteps) ? totalSteps : step;
        document.getElementById("current-step").innerText = displayStep;

        const stepDisplay = document.getElementById("heading-top-right-numbs-steps-1");
        if (stepDisplay) {
            const currentStepElem = document.getElementById("current-step");
            if (currentStepElem && stepDisplay.textContent.includes('/')) {
                stepDisplay.innerHTML = `<span class="step-word">Step</span> <span id="current-step">${displayStep}</span>/${displayTotalSteps}`;
            }
        }
        
        updateProgressBar(step);
    }
    updateProgressPill(currentStep);

    document.getElementById("heading-top-right-numbs-steps-1").classList.add("step-text-colored");
    document.querySelector(".step-word").style.color = "#6226FF";

    function changeHeading(step){
        const headings = {
            1: "Get Started",
            2: "Company Setup",
            3: "Business Activity Selection",
            4: "Visa Types",
            5: "Office Selection",
            6: "Banking and Add-ons",
            7: "Summary"
        };
        document.getElementById("theHeading").innerHTML = headings[step] || "Summary";
        updateStepDisplay();
    }

    function updateStepDisplay() {
        const currentStepDisplay = document.getElementById("current-step");
        if (currentStepDisplay) {
            const displayStep = (currentStep > totalSteps) ? totalSteps : currentStep;
            currentStepDisplay.textContent = displayStep;
        }
        
        if (currentStep > totalSteps || currentStep === 7) {
            document.getElementById("theHeading").innerHTML = "Summary";
            document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
            document.getElementById('step-7').classList.add('active');
        }
    }

    function updateButtonsDisplay(step) {
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");
        const submitBtn = document.getElementById("submitBtn");
        const isInEditMode = sessionStorage.getItem('editMode') === 'true';

        prevBtn.classList.toggle("d-none", step === 1);
        
        if (step >= 7) { 
            nextBtn.classList.add("d-none");
            submitBtn.classList.remove("d-none");
            if (isInEditMode) {
                sessionStorage.removeItem('editMode');
                sessionStorage.removeItem('returnToStep');
            }
            
            calculateCosts();
        } else if (step === 6) {
            nextBtn.classList.remove("d-none");
            submitBtn.classList.add("d-none");
            
            if (isInEditMode) {
                nextBtn.querySelector('span').textContent = "Back to Summary";
            } else {
            nextBtn.querySelector('span').textContent = "View Summary";
            }
        } else {
            nextBtn.classList.remove("d-none");
            submitBtn.classList.add("d-none");
            
            if (isInEditMode) {
                nextBtn.querySelector('span').textContent = "Back to Summary";
            } else {
            nextBtn.querySelector('span').textContent = "Next";
            }
        }
    }

    function nextStep() {
        if(validateStep(currentStep)){
            if (currentStep <= totalSteps) {
                document.getElementById(`step-${currentStep}`).classList.remove("active");
                
                const isInEditMode = sessionStorage.getItem('editMode') === 'true';
                
                                 if (isInEditMode) {
                     // If in edit mode, go directly to summary step
                     currentStep = 7;
                     document.getElementById('step-7').classList.add("active");
                     // Edit mode is reset in updateButtonsDisplay
                 } else {
                    // Normal flow - go to next step
                currentStep++;

                if (currentStep > totalSteps) {
                    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
                    document.getElementById('step-7').classList.add("active");
                } else {
                    document.getElementById(`step-${currentStep}`).classList.add("active");
                    }
                }

                changeHeading(currentStep);
                updateStepDisplay();
                updateButtonsDisplay(currentStep);
                calculateCosts();
                updateProgressBar(currentStep);

                hasStartedForm = true;
                setupInactivityTimer();
            }
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            document.getElementById(`step-${currentStep}`).classList.remove("active");
            currentStep--;
            document.getElementById(`step-${currentStep}`).classList.add("active");
            
            // Update navigation elements
            changeHeading(currentStep);
            updateStepDisplay();
            updateButtonsDisplay(currentStep);
            updateProgressBar(currentStep);
            
            // Reset inactivity timer
            setupInactivityTimer();
        }
    }

    function validateStep(step) {
        let valid = true;
        const stepElement = document.getElementById(`step-${step}`);
        const inputs = stepElement.querySelectorAll("input:not([type='radio']), select");

        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        inputs.forEach(input => {
            const errorElement = document.getElementById(`${input.id}-error`);
            const isVisible = input.offsetParent !== null;

            if (isVisible && input.hasAttribute("required") && !input.value) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "This field is required";
                valid = false;
            }

            if (isVisible && input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "Please enter a valid email address";
                valid = false;
            }

            if (isVisible && input.type === "tel" && !phoneInput.isValidNumber()) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "Please enter a valid phone number";
                valid = false;
            }

            if (isVisible && input.id === "full-name" && !/^[A-Za-z\s]+$/.test(input.value)) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "Name should contain only letters and spaces";
                valid = false;
            }
        });

        if (step === 2) {
            if (!document.getElementById("fawri-license").checked && !document.getElementById("regular-license").checked) {
                const licenseOptionsContainer = document.querySelector('.license-type-options');
                if (!licenseOptionsContainer.querySelector('.error-message')) {
                    const licenseErrorElement = document.createElement('div');
                    licenseErrorElement.className = 'error-message';
                    licenseErrorElement.textContent = "Please select a license type";
                    licenseOptionsContainer.appendChild(licenseErrorElement);
                }
                valid = false;
            }
        }
        
        // Validate business activities in step 3
        if (step === 3) {
            if (window.selectedActivities.length === 0) {
                const activitiesContainer = document.getElementById('step-3');
                if (activitiesContainer && !activitiesContainer.querySelector('.activity-error')) {
                    const activityErrorElement = document.createElement('div');
                    activityErrorElement.className = 'error-message activity-error';
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
                    
                    // Insert before the selection summary
                    const selectionSummary = activitiesContainer.querySelector('.selection-summary');
                    if (selectionSummary) {
                        activitiesContainer.insertBefore(activityErrorElement, selectionSummary);
                    } else {
                        activitiesContainer.appendChild(activityErrorElement);
                    }
                }
                valid = false;
            }
        }
        
        if (step === 1 && valid) {
            firstStepData = {
                fullName: document.getElementById("full-name").value,
                phone: document.getElementById("phone").value,
                email: document.getElementById("email").value
            };
            setupInactivityTimer();
        }

        return valid;
    }

    function updateShareholderNationalities() {
        const count = parseInt(document.getElementById("shareholders-range").value) || 0;
        const container = document.getElementById("shareholder-nationalities-container");
        container.innerHTML = '';
        
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                const selectId = `shareholder-nationality-${i+1}`;
                
                const select = document.createElement('select');
                select.id = selectId;
                select.className = 'nationality-select';
                select.required = true;
                
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                defaultOption.textContent = `Nationality of Shareholder ${i+1}`;
                select.appendChild(defaultOption);
                
                countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    select.appendChild(option);
                });
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.id = `${selectId}-error`;
                
                container.appendChild(select);
                container.appendChild(errorDiv);
            }
            
            $('.nationality-select').select2({
                placeholder: "Select Nationality",
                width: '100%'
            });
        }
    }
        
    function getFormSnapshot() {
        const investorVisaToggle = document.getElementById('investor-visa-toggle');
        const employeeVisaToggle = document.getElementById('employee-visa-toggle');
        const dependencyVisaToggle = document.getElementById('dependency-visa-toggle');

        const selectedAddonsList = [];
        document.querySelectorAll('.service-checkbox:checked').forEach(checkbox => {
            selectedAddonsList.push(checkbox.value);
        });

        return {
            licenseType: document.getElementById("fawri-license").checked ? "fawri" : "regular",
            packageType: "standard",
            licenseDuration: parseInt(document.getElementById("license-duration")?.value) || 1,
            investorVisas: (investorVisaToggle && investorVisaToggle.checked) ? parseInt(document.getElementById("investor-visa-count").value) || 0 : 0,
            employeeVisas: (employeeVisaToggle && employeeVisaToggle.checked) ? parseInt(document.getElementById("employee-visa-count").value) || 0 : 0,
            dependencyVisas: (dependencyVisaToggle && dependencyVisaToggle.checked) ? parseInt(document.getElementById("dependency-visas").value) || 0 : 0,
            businessBankAccount: document.getElementById("bank-account")?.checked,
            officeType: document.getElementById("office-type")?.value || '',
            selectedAddons: selectedAddonsList,
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
            "dependent-visa": 6000,
            "eid-card-delivery": 250,
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
            cost += addonCosts[addon] || 0;
        });

        if (selectedAddons.includes("medical-insurance")) {
            cost += 800 * (investorVisas + employeeVisas + dependencyVisas);
        }

        return cost;
    }

    function calculateOfficeCost(snapshot) {
        return 0;
    }

    function calculateVisaCost(snapshot) {
        let visaAdditionalCosts = 0;
        const { investorVisas, employeeVisas, dependencyVisas } = snapshot;
        const hasAnyVisa = investorVisas > 0 || employeeVisas > 0 || dependencyVisas > 0;

        if (investorVisas > 0) {
            visaAdditionalCosts += (2200 * investorVisas) + (700 * investorVisas);
            visaAdditionalCosts += 2280;
        }

        if (employeeVisas > 0) visaAdditionalCosts += (3700 * employeeVisas);
        if (dependencyVisas > 0) visaAdditionalCosts += (3700 * dependencyVisas);
        if (hasAnyVisa) visaAdditionalCosts += 330;
        
        return visaAdditionalCosts;
    }

    function calculateLicenseCost(snapshot) {
        const { licenseType, packageType, licenseDuration, investorVisas, employeeVisas } = snapshot;
        
        let baseLicenseCost = 0;
        if (licenseType === "fawri") {
            baseLicenseCost = 15000; // AED 15,000 for Fawri License
        } else {
            baseLicenseCost = 12500; // AED 12,500 for Regular License
        }

        let discountPercentage = licenseDuration > 1 ? 15 : 0; // 15% discount for multi-year licenses

        let businessLicenseCost = baseLicenseCost * licenseDuration;
        let leaseAgreementTotal = 375 * licenseDuration;

        let totalBeforeDiscount = businessLicenseCost + leaseAgreementTotal;
        let discountAmount = totalBeforeDiscount * (discountPercentage / 100);
        let licenseAfterDiscount = totalBeforeDiscount - discountAmount + 10;
        
        let immigrationCardTotal = (investorVisas > 0 || employeeVisas > 0) ? 2000 : 0;
        
        return licenseAfterDiscount + immigrationCardTotal;
    }

    function updateSummaryUI(costs, snapshot) {
        const { licenseCost, visaCost, bankAccountCost, officeCost, addonsCost, totalCost } = costs;
        const { licenseType, packageType, licenseDuration, officeType, investorVisas, employeeVisas, dependencyVisas, selectedAddons } = snapshot;

        // Update package type and license duration
        let packageText = licenseType === 'fawri' ? "Fawri" : "Regular";
        document.getElementById("summary-package-type").innerText = packageText;
        document.getElementById("summary-license-duration").innerText = `${licenseDuration} year${licenseDuration > 1 ? "s" : ""}`;
        
        // Update shareholders count
        const shareholdersCount = parseInt(document.getElementById("shareholders-range")?.value) || 1;
        document.getElementById("summary-shareholders").innerText = shareholdersCount;
        
        // Update business activities summary
        const activityTagsContainer = document.getElementById("activity-tags-container");
        if (activityTagsContainer) {
            activityTagsContainer.innerHTML = '';
            
            // Check if we're using the new window.selectedActivities array
            if (window.selectedActivities && window.selectedActivities.length > 0) {
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
                
                // Create tags for each category (not individual activities)
                Object.keys(activityGroups).forEach(groupName => {
                    const activities = activityGroups[groupName];
                    
                    // Create a tag for the group with count
                    const tag = document.createElement('span');
                    tag.className = 'activity-tag';
                    tag.innerText = `${mapGroupToDisplayName(groupName)} (${activities.length})`;
                    activityTagsContainer.appendChild(tag);
                });
                
                // Update business activities cost
                const businessActivitiesCost = document.getElementById("business-activities-cost");
                if (businessActivitiesCost) {
                    // Calculate cost based on number of groups (first 3 are free, then 1000 AED per additional group)
                    const uniqueGroups = Object.keys(activityGroups).length;
                    const extraGroups = Math.max(0, uniqueGroups - 3);
                    const activitiesCostValue = extraGroups * 1000;
                    businessActivitiesCost.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                    businessActivitiesCost.style.textAlign = "right";
                    businessActivitiesCost.style.width = "100%";
                    businessActivitiesCost.style.marginTop = "12px";
                }
            } else {
                // Fallback to old method for backward compatibility
                const activityGroups = {};
                selectedActivities.forEach(activity => {
                    const groupMatch = activity.match(/(.*?) Activity/);
                    if (groupMatch && groupMatch[1]) {
                        const group = groupMatch[1].trim();
                        if (!activityGroups[group]) {
                            activityGroups[group] = 0;
                        }
                        activityGroups[group]++;
                    }
                });
                
                // Create tags for each group
                Object.keys(activityGroups).forEach(group => {
                    const tag = document.createElement('span');
                    tag.className = 'activity-tag';
                    tag.innerText = `${group} (${activityGroups[group]})`;
                    activityTagsContainer.appendChild(tag);
                });
                
                // Update business activities cost
                const businessActivitiesCost = document.getElementById("business-activities-cost");
                if (businessActivitiesCost) {
                    const activitiesCostValue = Object.keys(activityGroups).length > 0 ? 1000 : 0;
                    businessActivitiesCost.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                }
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
                'fnb': 'F&B, Rentals',
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
        
        // Update visa information
        document.getElementById("summary-investor-visa-display").innerText = investorVisas > 0 ? `(${investorVisas})` : "(0)";
        document.getElementById("summary-employee-visa-display").innerText = employeeVisas > 0 ? `(${employeeVisas})` : "(0)";
        document.getElementById("summary-dependency-visa-display").innerText = dependencyVisas > 0 ? `(${dependencyVisas})` : "(0)";
        
        // Calculate individual visa costs (including allocation fees)
        const investorVisaCost = investorVisas > 0 ? (2200 + 1850) * investorVisas : 0; // Added 1850 allocation fee per visa
        const employeeVisaCost = employeeVisas > 0 ? (3700 + 1600) * employeeVisas : 0; // Added 1600 allocation fee per visa
        const dependencyVisaCost = dependencyVisas > 0 ? 6000 * dependencyVisas : 0; // AED 6,000 per dependent visa
        
        document.getElementById("investor-visa-cost").innerText = investorVisaCost > 0 ? `AED ${investorVisaCost.toLocaleString()}` : 'AED 0';
        document.getElementById("employee-visa-cost").innerText = employeeVisaCost > 0 ? `AED ${employeeVisaCost.toLocaleString()}` : 'AED 0';
        document.getElementById("dependency-visa-cost").innerText = dependencyVisaCost > 0 ? `AED ${dependencyVisaCost.toLocaleString()}` : 'AED 0';
        
        // Update office type (no cost impact)
        const officeTypeDisplay = document.getElementById("summary-office-type-display");
        const officeSpaceCostDisplay = document.getElementById("office-space-cost-display");
        
        if (officeType) {
            const officeTypeName = officeType === 'shared-office' ? 'Shared Office / Shared Desk' : 'Dedicated Office';
            officeTypeDisplay.innerText = officeTypeName;
            officeSpaceCostDisplay.innerText = "Included"; // No cost impact
        } else {
            officeTypeDisplay.innerText = "None selected";
            officeSpaceCostDisplay.innerText = "Included"; // No cost impact
        }

        // Update banking and add-ons
        const addonsContainer = document.getElementById("addons-summary-container");
        addonsContainer.innerHTML = '';

        const addonDetails = {
            // Group 1: mCore
            "bank-account": { name: "Bank Account", cost: 1500, group: "mCore" },
            "business-card": { name: "Business Card", cost: 240, group: "mCore" },
            "company-stamp": { name: "Company Stamp", cost: 200, group: "mCore" },
            "ecommerce-starter": { name: "E-commerce Starter", cost: 1000, group: "mCore" },
            
            // Group 2: mResidency
            "medical-emirates-id": { name: "Medical & Emirates ID", cost: 2250, group: "mResidency" },
            "dependent-visa": { name: "Dependent Visa", cost: 6000, group: "mResidency" },
            "eid-card-delivery": { name: "EID Card Delivery", cost: 250, group: "mResidency" },
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

        const groupedAddons = {};
        selectedAddons.forEach(addonKey => {
            const addon = addonDetails[addonKey];
            if (addon) {
                if (!groupedAddons[addon.group]) {
                    groupedAddons[addon.group] = [];
                }
                groupedAddons[addon.group].push(addon);
            }
        });

        if (Object.keys(groupedAddons).length === 0) {
            addonsContainer.innerHTML = '<span class="no-addons">No optional services selected</span>';
        } else {
            // Define unified costs for each group
            const groupCosts = {
                "mCore": 2250,
                "mResidency": 1000,
                "mAssist": 1000,
                "mAccounting": 1000
            };
            
            Object.keys(groupedAddons).forEach(groupName => {
                const addons = groupedAddons[groupName];
                
                const groupSection = document.createElement('div');
                groupSection.className = 'summary-section';

                const groupHeader = document.createElement('h4');
                groupHeader.innerText = groupName;
                groupSection.appendChild(groupHeader);

                const itemsContainer = document.createElement('div');
                itemsContainer.className = 'addon-item-container';

                // Add each add-on with its individual price
                addons.forEach(addon => {
                    const addonRow = document.createElement('div');
                    addonRow.className = 'addon-item';
                    addonRow.style.width = '100%';
                    addonRow.style.display = 'flex';
                    addonRow.style.justifyContent = 'space-between';
                    addonRow.style.alignItems = 'center';
                    addonRow.style.marginBottom = '8px';
                    
                    const addonNameSpan = document.createElement('span');
                    addonNameSpan.className = 'addon-name';
                    addonNameSpan.textContent = addon.name;
                    
                    const addonCostSpan = document.createElement('span');
                    addonCostSpan.className = 'addon-cost';
                    addonCostSpan.textContent = `AED ${addon.cost.toLocaleString()}`;
                    addonCostSpan.style.marginLeft = 'auto';
                    addonCostSpan.style.flexShrink = '0';
                    
                    addonRow.appendChild(addonNameSpan);
                    addonRow.appendChild(addonCostSpan);
                    itemsContainer.appendChild(addonRow);
                });
                
                groupSection.appendChild(itemsContainer);
                addonsContainer.appendChild(groupSection);
            });
        }
        
        // Update total cost
        document.getElementById("total-cost-display").innerText = `AED ${Math.round(totalCost).toLocaleString()}`;
    }

    function calculateCosts() {
        const snapshot = getFormSnapshot();
        
        const licenseComponent = calculateLicenseCost(snapshot);
        const visaComponent = calculateVisaCost(snapshot);
        const bankAccountComponent = snapshot.businessBankAccount ? 2000 : 0;
        const officeComponent = calculateOfficeCost(snapshot);
        const addonsComponent = calculateAddonsCost(snapshot);
        
        const totalCost = licenseComponent + visaComponent + bankAccountComponent + officeComponent + addonsComponent;
        
        const costs = {
            licenseCost: licenseComponent,
            visaCost: visaComponent,
            bankAccountCost: bankAccountComponent,
            officeCost: officeComponent,
            addonsCost: addonsComponent,
            totalCost: totalCost
        };
        
        LicenseCost = Math.round(licenseComponent);
        VisaCost = Math.round(visaComponent);

        updateSummaryUI(costs, snapshot);
        
        // Save form data to localStorage for potential recovery
        try {
            localStorage.setItem('costCalculatorData', JSON.stringify(snapshot));
        } catch (e) {
            console.log('Unable to save form data to localStorage', e);
        }
    }

    function calculateTotalCost() {
        return (parseInt(document.getElementById("license-cost").innerText.replace(/,/g, '')) || 0) +
               (parseInt(document.getElementById("visa-cost").innerText.replace(/,/g, '')) || 0) +
               (parseInt(document.getElementById("bank-account-cost").innerText.replace(/,/g, '')) || 0);
    }

    function submitPartialData(step, status = 'incomplete') {
        const shareholdersCount = parseInt(document.getElementById("shareholders-range").value) || 0;
        const shareholderNationalities = Array.from({ length: shareholdersCount }, (_, i) => document.getElementById(`shareholder-nationality-${i+1}`)?.value || '');

        const selectedAddons = [];
        document.querySelectorAll('.service-checkbox:checked').forEach(checkbox => selectedAddons.push(checkbox.value));

        const formData = {
            fullName: document.getElementById("full-name")?.value || '',
            phone: phoneInput.getNumber(),
            email: document.getElementById("email")?.value || '',
            license_type: document.getElementById("fawri-license").checked ? "fawri" : (document.getElementById("regular-license").checked ? "regular" : ""),
            business_activities: selectedActivities.join(', '),
            shareholders_range: document.getElementById("shareholders-range")?.value || '',
            nationalities: "Default Nationality",
            shareholder_nationalities: shareholderNationalities.join(','),
            package_type: document.getElementById("package-type")?.value || '',
            license_duration: document.getElementById("license-duration")?.value || '',
            investor_visas: document.getElementById("investor-visa-toggle").checked ? (document.getElementById("investor-visa-count")?.value || '0') : '0',
            employee_visas: document.getElementById("employee-visa-toggle").checked ? (document.getElementById("employee-visa-count")?.value || '0') : '0',
            dependency_visas: document.getElementById("dependency-visa-toggle").checked ? (document.getElementById("dependency-visas")?.value || '0') : '0',
            office_type: document.getElementById("office-type")?.value || '',
            selected_addons: selectedAddons.join(','),
            bank_account: document.getElementById("bank-account")?.checked ? 'yes' : 'no',
            business_bank_account: document.getElementById("business-bank-account")?.value || '',
            current_step: step,
            total_cost: calculateTotalCost(),
            license_cost: LicenseCost,
            visa_cost: VisaCost,
            bank_cost: document.getElementById("bank-account")?.checked ? 2000 : 0,
            client_id: document.getElementById("client-id")?.value || '',
            form_status: status
        };

        const elementorForm = $('#my-calculator-elementor-form');
        if (elementorForm.length > 0) {
            Object.keys(formData).forEach(key => {
                const field = elementorForm.find(`input[name="form_fields[${key}]"]`);
                if (field.length > 0) field.val(formData[key]);
            });
            elementorForm.find('.elementor-button[type="submit"]').click();
            hasSubmittedIncomplete = true;
        }
    }

    let lastActivityTime = Date.now();
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(eventName => {
        document.addEventListener(eventName, () => { lastActivityTime = Date.now(); });
    });

    function setupInactivityTimer() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        if (hasSubmittedIncomplete) return;
        
        inactivityTimer = setTimeout(() => {
            const timeSinceLastActivity = Date.now() - lastActivityTime;
            if (timeSinceLastActivity >= INACTIVITY_TIMEOUT && hasStartedForm && !hasSubmittedIncomplete && currentStep <= totalSteps) {
                submitPartialData(currentStep, 'incomplete_timeout');
            } else {
                setupInactivityTimer();
            }
        }, 10000);
    }

    window.addEventListener('beforeunload', function(e) {
        if (hasStartedForm && !document.getElementById('submitBtn').disabled && !hasSubmittedIncomplete && currentStep <= totalSteps) {
            submitPartialData(currentStep, 'incomplete_leave');
            const confirmationMessage = 'You have an unfinished form. Are you sure you want to leave?';
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    });

    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden' && hasStartedForm && !hasSubmittedIncomplete && currentStep <= totalSteps) {
            submitPartialData(currentStep, 'incomplete_hidden');
        }
    });

    const phoneInputField = document.querySelector("#phone");
    const phoneInput = window.intlTelInput(phoneInputField, {
        preferredCountries: ["ae", "sa", "kw", "bh", "om", "qa"],
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
        separateDialCode: true,
        formatOnDisplay: true,
        autoPlaceholder: "polite"
    });

    phoneInputField.addEventListener("blur", function() {
        phoneInputField.classList.toggle("error", phoneInputField.value.trim() && !phoneInput.isValidNumber());
    });

    document.getElementById('submitBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const submitBtn = this;

        if (submitBtn.classList.contains('button-loading')) return;

        clearTimeout(inactivityTimer);
        hasSubmittedIncomplete = true; 

        submitBtn.classList.add('button-loading');
        submitBtn.disabled = true;

        calculateCosts();

        const fullName = document.getElementById("full-name").value;
        const phone = phoneInput.getNumber();
        const email = document.getElementById("email").value;
        const licenseType = document.getElementById("fawri-license").checked ? "fawri" : "regular";
        
        const shareholdersCount = parseInt(document.getElementById("shareholders-range").value) || 0;
        const shareholderNationalities = Array.from({length: shareholdersCount}, (_,i) => document.getElementById(`shareholder-nationality-${i+1}`)?.value || '');

        const elementorForm = $('#my-calculator-elementor-form');
        if (elementorForm.length > 0) {
            elementorForm.find('input[name="form_fields[fullName]"]').val(fullName);
            elementorForm.find('input[name="form_fields[phone]"]').val(phone);
            elementorForm.find('input[name="form_fields[email]"]').val(email);
            elementorForm.find('input[name="form_fields[license_type]"]').val(licenseType);
            elementorForm.find('input[name="form_fields[shareholders_range]"]').val(document.getElementById("shareholders-range").value);
            elementorForm.find('input[name="form_fields[nationalities]"]').val("Default Nationality");
            elementorForm.find('input[name="form_fields[shareholder_nationalities]"]').val(shareholderNationalities.join(','));
            elementorForm.find('input[name="form_fields[business_activities]"]').val(selectedActivities.join(', '));
            elementorForm.find('input[name="form_fields[total_cost]"]').val(calculateTotalCost());
            elementorForm.find('input[name="form_fields[license_cost]"]').val(LicenseCost);
            elementorForm.find('input[name="form_fields[visa_cost]"]').val(VisaCost);
            elementorForm.find('input[name="form_fields[bank_cost]"]').val(document.getElementById("bank-account")?.checked ? 2000 : 0);
            elementorForm.find('input[name="form_fields[form_status]"]').val('complete');

            setTimeout(function() {
                const submitButton = elementorForm.find('.elementor-button[type="submit"]');
                if (submitButton.length > 0) {
                    submitButton.click();
                    
                    document.querySelector('#srix-NewCostCalForm .form-container').style.display = 'none';
                    const successMessage = document.getElementById('theFinalSuccessMessage');
                    document.getElementById('success-first-name').textContent = fullName.split(' ')[0] || '';
                    successMessage.classList.remove('d-none');
                    successMessage.classList.add('visible');
                } else {
                    submitBtn.classList.remove('button-loading');
                    submitBtn.disabled = false;
                    alert("There was an issue submitting the form. Please try again.");
                }
            }, 1000);
        } else {
            submitBtn.classList.remove('button-loading');
            submitBtn.disabled = false;
            alert("There was an issue submitting the form. Please try again later.");
        }
    });

    const countries = [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
        "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
        "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
        "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
        "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador",
        "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
        "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
        "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
        "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South",
        "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
        "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
        "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
        "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
        "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
        "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
        "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
        "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
        "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
        "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
        "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ];

    document.addEventListener('DOMContentLoaded', function() {
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

        const fawriLicense = document.getElementById("fawri-license");
        const regularLicense = document.getElementById("regular-license");
        
        if (fawriLicense && regularLicense) {
            fawriLicense.addEventListener('change', () => {
                if (fawriLicense.checked) document.querySelector('.duration-value').textContent = "60 Minutes";
            });
            
            regularLicense.addEventListener('change', () => {
                if (regularLicense.checked) document.querySelector('.duration-value').textContent = "3-5 Business Days";
            });
            
            fawriLicense.checked = true;
            document.querySelector('.duration-value').textContent = "60 Minutes";
        }
        
        checkTaxCompliance();
    });

    function toggleVisaOptions(visaType) {
        const toggle = document.getElementById(`${visaType}-visa-toggle`);
        const optionsDiv = document.getElementById(`${visaType}-visa-options`);
        const visaSelect = document.getElementById(visaType === 'dependency' ? 'dependency-visas' : `${visaType}-visa-count`);
        
        if (toggle.checked) {
            optionsDiv.style.display = 'block';
            visaSelect.setAttribute('required', 'required');
        } else {
            optionsDiv.style.display = 'none';
            visaSelect.removeAttribute('required');
            visaSelect.value = '';
            const errorElement = document.getElementById(visaSelect.id + '-error');
            if (errorElement) errorElement.textContent = '';
        }
        
        if (currentStep >= 5) calculateCosts();
    }
    
    function checkTaxCompliance() {
        const corporateTaxChecked = document.getElementById('corporate-tax').checked;
        const vatRegistrationChecked = document.getElementById('vat-registration').checked;
        const warningElement = document.getElementById('tax-compliance-warning');
        
        warningElement.style.display = (!corporateTaxChecked || !vatRegistrationChecked) ? 'block' : 'none';
        
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
        case 'office-type':
            // Navigate to step 5 (Office Type)
            goToStep(5);
            break;
        case 'addons':
            // Navigate to step 6 (Add-ons)
            goToStep(6);
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
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if (targetStep) {
            targetStep.classList.add('active');
            currentStep = stepNumber;
            
            // Update progress bar
            updateProgressBar(stepNumber);
            
            // If coming from summary page, set edit mode
            if (stepNumber < 7 && !sessionStorage.getItem('editMode') && currentStep !== 1) {
                sessionStorage.setItem('editMode', 'true');
                sessionStorage.setItem('returnToStep', '7');
            }
            
            // If going to the summary step, recalculate costs
            if (stepNumber === 7) {
                calculateCosts();
            }
            
            // Update navigation buttons and heading after setting edit mode
            changeHeading(stepNumber);
            updateStepDisplay();
            updateButtonsDisplay(stepNumber);
            
            // Scroll to top of form
            const formContainer = document.querySelector('.form-container');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Reset inactivity timer
            setupInactivityTimer();
        }
    }



    window.addEventListener('focus', function() {
        setupInactivityTimer();
    });
    // Initialize Supabase client
    const supabaseUrl = 'https://bwommjnbmumvgtlyfddn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3b21tam5ibXVtdmd0bHlmZGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDM0NTAsImV4cCI6MjA2NTAxOTQ1MH0.1OxopB9p-yoGoYpY7AUyHs-T7Fe0cK2dUjFq_FbCL-I';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    window.selectedActivities = window.selectedActivities || [];
    
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
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(searchResultsDropdown);
        
        function updateDropdownDimensions() {
            searchResultsDropdown.style.width = searchInput.getBoundingClientRect().width + 'px';
            searchResultsDropdown.style.left = searchInput.offsetLeft + 'px';
        }
        
        updateDropdownDimensions();
        window.addEventListener('resize', updateDropdownDimensions);
        
        document.querySelectorAll('.activity-group').forEach(group => {
            group.addEventListener('click', function(e) {
                e.stopPropagation();
                const groupName = this.getAttribute('data-group');
                const activitiesList = document.querySelector('.activities-list-container');
                const isActivitiesVisible = activitiesList && activitiesList.style.display !== 'none' && activitiesList.getAttribute('data-current-group') === groupName;
                
                if (isActivitiesVisible) {
                    activitiesList.style.display = 'none';
                } else {
                    toggleActivityGroup(this, groupName);
                    document.querySelectorAll('.activity-group').forEach(g => {
                        g.style.opacity = (g !== this) ? '0.7' : '1';
                        if (g === this && g.querySelector('.plus-icon')) g.querySelector('.plus-icon').style.display = 'inline-flex';
                    });
                }
            });
        });
        
        function toggleActivityGroup(groupElement, groupName) {
            if (!groupElement.classList.contains('selected')) {
                groupElement.classList.add('selected');
                groupElement.style.opacity = '1';
                if(groupElement.querySelector('.plus-icon')) groupElement.querySelector('.plus-icon').style.display = 'inline-flex';
                document.querySelectorAll('.activity-group:not(.selected)').forEach(otherGroup => otherGroup.style.opacity = '0.7');
                updateSelectionSummary();
            }
            fetchActivitiesByGroup(groupName);
        }
        
        async function fetchActivitiesByGroup(groupName) {
            try {
                window.currentGroupName = groupName;
                showActivitiesLoading(groupName);
                const categoryName = mapGroupToCategory(groupName);
                const { data, error } = await supabase.from('Activity List').select('Code, "Activity Name", Category, Group').eq('Category', categoryName).order('Code').limit(100);
                if (error) throw error;
                displayActivitiesWithCheckboxes(data, groupName);
            } catch (err) {
                console.error('Error fetching activities:', err);
                showActivitiesError('Error fetching activities', groupName);
            }
        }
        
        function mapGroupToCategory(groupName) {
            const groupToCategoryMap = { 'administrative': 'Administrative', 'agriculture': 'Agriculture', 'art': 'Art', 'education': 'Education', 'ict': 'ICT', 'fnb': 'F&B', 'financial': 'Financial', 'healthcare': 'HealthCare', 'maintenance': 'Maintenance', 'services': 'Services', 'professional': 'Professional', 'realestate': 'Realestate', 'sewerage': 'Sewerage', 'trading': 'Trading', 'transportation': 'Transportation', 'waste': 'Waste Collection', 'manufacturing': 'Manufacturing' };
            return groupToCategoryMap[groupName] || groupName;
        }
        
        function showActivitiesLoading(groupName) {
            let activitiesList = document.querySelector('.activities-list-container');
            if (!activitiesList) {
                activitiesList = document.createElement('div');
                activitiesList.className = 'activities-list-container';
                document.querySelector('#activities-list-placeholder').appendChild(activitiesList);
            }
            activitiesList.innerHTML = '<div class="activities-loading">Loading activities...</div>';
            activitiesList.style.display = 'block';
            activitiesList.setAttribute('data-current-group', groupName);
        }
        
        function showActivitiesError(message, groupName) {
            let activitiesList = document.querySelector('.activities-list-container');
            if (!activitiesList) {
                activitiesList = document.createElement('div');
                activitiesList.className = 'activities-list-container';
                document.querySelector('#activities-list-placeholder').appendChild(activitiesList);
            }
            activitiesList.innerHTML = `<div class="activities-error">${message}</div>`;
            activitiesList.style.display = 'block';
            if (window.currentGroupName) activitiesList.setAttribute('data-current-group', window.currentGroupName);
        }

        function displayActivitiesWithCheckboxes(activities, groupName) {
            let activitiesList = document.querySelector('.activities-list-container');
            if (!activitiesList) {
                activitiesList = document.createElement('div');
                activitiesList.className = 'activities-list-container';
                document.querySelector('#activities-list-placeholder').appendChild(activitiesList);
            }
            
            if (!activities || activities.length === 0) {
                activitiesList.innerHTML = '<div class="no-activities">No activities found for this category</div>';
                activitiesList.style.display = 'block';
                return;
            }
            
            const selectedActivityCodes = window.selectedActivities.filter(a => a.groupName === groupName).map(a => a.Code);
            
            let html = `<div class="activities-filter"><input type="text" class="activities-filter-input" placeholder="Filter activities in ${mapGroupToCategory(groupName)}..." /></div><div class="activities-list">`;
            activities.forEach(activity => {
                const isSelected = selectedActivityCodes.includes(activity.Code);
                html += `<div class="activity-checkbox-item"><label class="activity-checkbox-label"><div class="activity-checkbox-info"><span class="activity-code">${activity.Code}</span><span class="activity-name">${activity["Activity Name"]}</span></div><input type="checkbox" class="activity-checkbox" data-code="${activity.Code}" data-name="${activity["Activity Name"]}" data-category="${activity.Category}" data-group="${activity.Group}" ${isSelected ? 'checked' : ''}></label></div>`;
            });
            html += '</div>';
            activitiesList.innerHTML = html;
            activitiesList.style.display = 'block';
            activitiesList.setAttribute('data-current-group', groupName);
            
            activitiesList.querySelectorAll('.activity-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const activityData = { Code: this.dataset.code, "Activity Name": this.dataset.name, Category: this.dataset.category, Group: this.dataset.group };
                    this.checked ? selectActivity(activityData) : removeActivity(activityData.Code);
                });
            });
            
            document.addEventListener('click', function(e) {
                if (!activitiesList.contains(e.target) && !e.target.closest('.activity-group') && activitiesList.style.display !== 'none') {
                    activitiesList.style.display = 'none';
                }
            });
            
            activitiesList.addEventListener('click', e => e.stopPropagation());
            
            const filterInput = activitiesList.querySelector('.activities-filter-input');
            if (filterInput) {
                setTimeout(() => filterInput.focus(), 100);
                filterInput.addEventListener('input', function() {
                    const filterValue = this.value.toLowerCase().trim();
                    activitiesList.querySelectorAll('.activity-checkbox-item').forEach(item => {
                        item.style.display = item.textContent.toLowerCase().includes(filterValue) ? '' : 'none';
                    });
                });
            }
        }
        
        let debounceTimer;
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            clearTimeout(debounceTimer);
            document.querySelectorAll('.activity-group').forEach(group => group.style.display = 'flex');
            
            if (searchTerm === '') {
                searchResultsDropdown.style.display = 'none';
                return;
            }
            
            updateDropdownDimensions();
            debounceTimer = setTimeout(() => searchActivities(searchTerm), 300);
        });
        
        async function searchActivities(searchTerm) {
            try {
                searchResultsDropdown.innerHTML = '<div class="loading-results">Searching...</div>';
                searchResultsDropdown.style.display = 'block';
                updateDropdownDimensions();
                
                const query = searchTerm === "*" ? supabase.from('Activity List').select('Code, "Activity Name", Category, Group').limit(40) : supabase.from('Activity List').select('Code, "Activity Name", Category, Group').or(`"Activity Name".ilike.%${searchTerm}%,Code.ilike.%${searchTerm}%`).limit(100);
                const { data, error } = await query;
                if (error) throw error;
                displaySearchResults(data);
            } catch (err) {
                console.error('Error searching activities:', err);
                searchResultsDropdown.innerHTML = '<div class="error-results">Error fetching results</div>';
            }
        }
        
        function displaySearchResults(results) {
            searchResultsDropdown.innerHTML = '';
            document.querySelectorAll('.activity-group').forEach(group => group.style.display = 'flex');
            
            if (results.length === 0) {
                searchResultsDropdown.innerHTML = '<div class="no-results">No activities found</div>';
                searchResultsDropdown.style.display = 'block';
                updateDropdownDimensions();
                return;
            }
            
            results.forEach(activity => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `<span class="activity-code">${activity.Code}</span><span class="activity-name">${activity["Activity Name"]}</span>`;
                resultItem.addEventListener('click', () => selectActivity(activity));
                searchResultsDropdown.appendChild(resultItem);
            });
            
            searchResultsDropdown.style.display = 'block';
            updateDropdownDimensions();
        }
        
        function selectActivity(activity) {
            const groupName = mapCategoryToGroup(activity.Category, activity.Group);
            const groupElement = document.querySelector(`.activity-group[data-group="${groupName}"]`);
            
            if (groupElement) {
                groupElement.style.display = 'flex';
                document.querySelectorAll('.activity-group').forEach(g => { if (g !== groupElement && !g.classList.contains('selected')) g.style.opacity = '0.7'; });
                
                if (!groupElement.classList.contains('selected')) {
                    groupElement.classList.add('selected');
                    groupElement.style.opacity = '1';
                }
                
                if (window.selectedActivities.some(item => item.Code === activity.Code)) return;
                
                let currentCount = parseInt(groupElement.dataset.count || '0') + 1;
                groupElement.dataset.count = currentCount;
                
                const countElement = groupElement.querySelector('.activity-count');
                if (countElement) {
                    countElement.textContent = `(${currentCount})`;
                    countElement.style.display = 'inline';
                }
                
                addActivityToSelected(activity, groupName);
                updateSelectionSummary();
                
                const checkbox = document.querySelector(`.activity-checkbox[data-code="${activity.Code}"]`);
                if (checkbox) checkbox.checked = true;
                
                if (!document.activeElement || !document.activeElement.classList.contains('activity-checkbox')) {
                    searchInput.value = '';
                    searchResultsDropdown.style.display = 'none';
                }
                document.querySelectorAll('.activity-group').forEach(group => group.style.display = 'flex');
            }
        }
        
        function mapCategoryToGroup(category, groupNumber) {
            const categoryMapping = { 'Administrative': 'administrative', 'Agriculture': 'agriculture', 'Art': 'art', 'Education': 'education', 'ICT': 'ict', 'F&B,Rentals': 'fnb', 'Financial': 'financial', 'HealthCare': 'healthcare', 'Maintenance': 'maintenance', 'Services': 'services', 'Professional': 'professional', 'Realestate': 'realestate', 'Sewerage': 'sewerage', 'Trading': 'trading', 'Transportation': 'transportation', 'Waste Collection': 'waste', 'Manufacturing': 'manufacturing' };
            let cleanCategory = typeof category === 'string' ? category.trim() : '';
            if (cleanCategory && categoryMapping[cleanCategory]) return categoryMapping[cleanCategory];
            for (const [key, value] of Object.entries(categoryMapping)) {
                if (cleanCategory && (cleanCategory.includes(key) || cleanCategory.toLowerCase().includes(key.toLowerCase()))) return value;
            }
            return 'services';
        }
        
        function addActivityToSelected(activity, groupName) {
            if (!window.selectedActivities.some(item => item.Code === activity.Code)) {
                window.selectedActivities.push({ ...activity, groupName });
                
                // Clear any error messages when activity is added
                const errorMessage = document.querySelector('.activity-error');
                if (errorMessage) {
                    errorMessage.remove();
                }
            }
        }
        
        function updateSelectionSummary() {
            const groupsSelectedCount = document.getElementById('groups-selected-count');
            const activitiesSelectedCount = document.getElementById('activities-selected-count');
            if (!groupsSelectedCount || !activitiesSelectedCount) return;
            
            const totalActivities = window.selectedActivities.length;
            const activeGroups = new Set(window.selectedActivities.map(a => a.groupName));
            
            groupsSelectedCount.textContent = activeGroups.size;
            activitiesSelectedCount.textContent = totalActivities;
        }
        
        function removeActivity(code) {
            const activityIndex = window.selectedActivities.findIndex(a => a.Code === code);
            if (activityIndex === -1) return;
            
            const { groupName } = window.selectedActivities[activityIndex];
            window.selectedActivities.splice(activityIndex, 1);
            
            const checkbox = document.querySelector(`.activity-checkbox[data-code="${code}"]`);
            if (checkbox) checkbox.checked = false;
            
            const groupElement = document.querySelector(`.activity-group[data-group="${groupName}"]`);
            if (groupElement) {
                let currentCount = Math.max(0, (parseInt(groupElement.dataset.count) || 0) - 1);
                groupElement.dataset.count = currentCount;
                const countElement = groupElement.querySelector('.activity-count');
                if (countElement) countElement.style.display = currentCount > 0 ? 'inline' : 'none';
            }
            
            if (window.selectedActivities.length === 0) {
                document.querySelectorAll('.activity-group').forEach(group => group.style.opacity = '1');
            }
            updateSelectionSummary();
        }
    });
