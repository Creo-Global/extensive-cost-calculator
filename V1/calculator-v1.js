    let currentStep = 1;
    const totalSteps = 5; 
    const displayTotalSteps = 6; 
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
            
            const feeWarning = document.querySelector('.fee-warning');
            if (feeWarning) {
                feeWarning.style.display = 'none';
            }
            
            // Ensure Bank Account and Company Stamp are checked by default
            const bankAccount = document.getElementById('bank-account');
            const companyStamp = document.getElementById('company-stamp');
            if (bankAccount) bankAccount.checked = true;
            if (companyStamp) companyStamp.checked = true;
            
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
        
        // Initialize accordion functionality for mobile
        initAccordion();
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
        const progressBar = document.querySelector('#MFZ-NewCostCalForm .step-progress');
        
        if (progressBar) {
            let progressWidth;
            switch(step) {
                case 1: progressWidth = '15%'; break;
                case 2: progressWidth = '30%'; break;
                case 3: progressWidth = '50%'; break;
                case 4: progressWidth = '70%'; break;
                case 5: progressWidth = '85%'; break;
                case 6: progressWidth = '100%'; break; 
                default: progressWidth = '15%';
            }
            progressBar.style.width = progressWidth;
        }
    }

    function updateProgressPill(step) {
        const displayStep = (step > totalSteps) ? displayTotalSteps : step;
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
            5: "Banking and Add-ons",
            6: "Cost Summary"       
        };
        document.getElementById("theHeading").innerHTML = headings[step] || "Cost Summary";
        updateStepDisplay();
    }

    function updateStepDisplay() {
        const currentStepDisplay = document.getElementById("current-step");
        if (currentStepDisplay) {
            const displayStep = (currentStep > totalSteps) ? displayTotalSteps : currentStep;
            currentStepDisplay.textContent = displayStep;
        }
        
        if (currentStep > totalSteps || currentStep === 6) { // Changed from 7 to 6 as we removed step 5
            document.getElementById("theHeading").innerHTML = "Cost Summary";
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
        
        if (step >= 6) { // Changed from 7 to 6 as we removed step 5
            nextBtn.classList.add("d-none");
            submitBtn.classList.remove("d-none");
            if (isInEditMode) {
                sessionStorage.removeItem('editMode');
                sessionStorage.removeItem('returnToStep');
            }
            
            calculateCosts();
        } else if (step === 5) { // Changed from 6 to 5 as we removed step 5
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
                     currentStep = 6; // Changed from 7 to 6 as we removed step 5
                     document.getElementById('step-7').classList.add("active"); // Still using step-7 ID for backward compatibility
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
            // Special handling for summary step (still using step-7 ID for backward compatibility)
            if (currentStep === 6) { // Summary step
                document.getElementById('step-7').classList.remove("active");
            } else {
                document.getElementById(`step-${currentStep}`).classList.remove("active");
            }
            
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
        // Function now empty - we're removing the nationality fields
        // and only keeping the shareholder count
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
            investorVisas: (investorVisaToggle && investorVisaToggle.checked) ? 1 : 0, // Investor visa is always 1 if checked
            employeeVisas: (employeeVisaToggle && employeeVisaToggle.checked) ? parseInt(document.getElementById("employee-visa-count").value) || 1 : 0,
            dependencyVisas: (dependencyVisaToggle && dependencyVisaToggle.checked) ? parseInt(document.getElementById("dependency-visas").value) || 1 : 0,
            // officeType removed as step 5 was removed
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
            // "eid-card-delivery": 250, // Service removed
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

        return cost;
    }

    // Office cost calculation removed as step 5 was removed
    function calculateOfficeCost() {
        return 0;
    }

    function calculateVisaCost(snapshot) {
        let visaAdditionalCosts = 0;
        const { investorVisas, employeeVisas, dependencyVisas } = snapshot;

        // Fixed visa costs as specified
        if (investorVisas > 0) {
            visaAdditionalCosts += 5850 * investorVisas; // 5,850 AED per investor visa
        }

        if (employeeVisas > 0) {
            visaAdditionalCosts += 5350 * employeeVisas; // 5,350 AED per employee visa
        }
        
        if (dependencyVisas > 0) {
            visaAdditionalCosts += 7850 * dependencyVisas; // 7,850 AED per dependency visa
        }
        
        // Add immigration card fee (2,000 AED) if any visas are selected (including dependency visas)
        if (investorVisas > 0 || employeeVisas > 0 || dependencyVisas > 0) {
            visaAdditionalCosts += 2000; // Immigration card fee
        }
        
        return visaAdditionalCosts;
    }

    function calculateLicenseCost(snapshot) {
        const { licenseType, packageType, licenseDuration, investorVisas, employeeVisas, dependencyVisas } = snapshot;
        
        let baseLicenseCost = 0;
        if (licenseType === "fawri") {
            baseLicenseCost = 15000; // AED 15,000 for Fawri License
        } else {
            baseLicenseCost = 12500; // AED 12,500 for Regular License
        }

        let discountPercentage = licenseDuration > 1 ? 15 : 0; // 15% discount for multi-year licenses

        let businessLicenseCost = baseLicenseCost * licenseDuration;

        let totalBeforeDiscount = businessLicenseCost;
        let discountAmount = totalBeforeDiscount * (discountPercentage / 100);
        let licenseAfterDiscount = totalBeforeDiscount - discountAmount;
        
        window.baseLicenseCostValue = baseLicenseCost;
        
       
        let immigrationCardTotal = (investorVisas > 0 || employeeVisas > 0 || dependencyVisas > 0) ? 2000 : 0;
        
       
        window.immigrationCardFee = immigrationCardTotal;
        
      
        return licenseAfterDiscount;
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
                    const uniqueGroups = Object.keys(activityGroups).length;
                    const extraGroups = Math.max(0, uniqueGroups - 3);
                    const activitiesCostValue = extraGroups * 1000;
                    businessActivitiesCost.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                    businessActivitiesCost.style.textAlign = "right";
                    businessActivitiesCost.style.width = "100%";
                    businessActivitiesCost.style.marginTop = "12px";
                    
                    // Update the price in the accordion header
                    const businessActivitiesHeader = document.querySelector('.summary-card:nth-child(2) .summary-price');
                    if (businessActivitiesHeader) {
                        businessActivitiesHeader.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                    }
                    
                    // Show/hide fee warning based on number of activity groups
                    const feeWarning = document.querySelector('.fee-warning');
                    if (feeWarning) {
                        if (uniqueGroups > 3) {
                            feeWarning.style.display = 'block';
                        } else {
                            feeWarning.style.display = 'none';
                        }
                    }
                }
            } else {
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
                    const uniqueGroups = Object.keys(activityGroups).length;
                    const extraGroups = Math.max(0, uniqueGroups - 3);
                    const activitiesCostValue = extraGroups * 1000;
                    businessActivitiesCost.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                    
                    // Update the price in the accordion header
                    const businessActivitiesHeader = document.querySelector('.summary-card:nth-child(2) .summary-price');
                    if (businessActivitiesHeader) {
                        businessActivitiesHeader.innerText = `AED ${activitiesCostValue.toLocaleString()}`;
                    }
                    
                    // Show/hide fee warning based on number of activity groups
                    const feeWarning = document.querySelector('.fee-warning');
                    if (feeWarning) {
                        if (uniqueGroups > 3) {
                            feeWarning.style.display = 'block';
                        } else {
                            feeWarning.style.display = 'none';
                        }
                    }
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
        
        // Calculate individual visa costs with fixed prices
        const investorVisaCost = investorVisas > 0 ? 5850 * investorVisas : 0; // 5,850 AED per investor visa
        const employeeVisaCost = employeeVisas > 0 ? 5350 * employeeVisas : 0; // 5,350 AED per employee visa
        const dependencyVisaCost = dependencyVisas > 0 ? 7850 * dependencyVisas : 0; // 7,850 AED per dependency visa
        
        document.getElementById("investor-visa-cost").innerText = investorVisaCost > 0 ? `AED ${investorVisaCost.toLocaleString()}` : 'AED 0';
        document.getElementById("employee-visa-cost").innerText = employeeVisaCost > 0 ? `AED ${employeeVisaCost.toLocaleString()}` : 'AED 0';
        document.getElementById("dependency-visa-cost").innerText = dependencyVisaCost > 0 ? `AED ${dependencyVisaCost.toLocaleString()}` : 'AED 0';
        
        // Update immigration card fee
        const immigrationCardElement = document.getElementById("immigration-card-cost");
        if (immigrationCardElement) {
            immigrationCardElement.innerText = window.immigrationCardFee > 0 ? `AED ${window.immigrationCardFee.toLocaleString()}` : 'AED 0';
        }
        
        // Update the visa price in the accordion header (including immigration card fee)
        const totalVisaCost = investorVisaCost + employeeVisaCost + dependencyVisaCost + window.immigrationCardFee;
        const visaHeader = document.querySelector('.summary-card:nth-child(3) .summary-price');
        if (visaHeader) {
            visaHeader.innerText = `AED ${totalVisaCost.toLocaleString()}`;
        }
        
     
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
            // "eid-card-delivery" service removed
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
            
            // Update the addons price in the accordion header to 0
            const addonsHeader = document.querySelector('.summary-card:nth-child(5) .summary-price');
            if (addonsHeader) {
                addonsHeader.innerText = 'AED 0';
            }
            
            // Also update the Meydan Plus price with the ID
            const meydanPlusPrice = document.getElementById('meydan-plus-price');
            if (meydanPlusPrice) {
                meydanPlusPrice.innerText = 'AED 0';
            }
        } else {
            // Calculate total addons cost
            let totalAddonsCost = 0;
            
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

                    
                    const addonNameSpan = document.createElement('span');
                    addonNameSpan.className = 'addon-name';
                    addonNameSpan.textContent = addon.name;
                    
                    const addonCostSpan = document.createElement('span');
                    addonCostSpan.className = 'addon-cost';
                    addonCostSpan.textContent = `AED ${addon.cost.toLocaleString()}`;
                    addonCostSpan.style.marginLeft = 'auto';
                    addonCostSpan.style.flexShrink = '0';
                    
                    totalAddonsCost += addon.cost;
                    
                    addonRow.appendChild(addonNameSpan);
                    addonRow.appendChild(addonCostSpan);
                    itemsContainer.appendChild(addonRow);
                });
                
                groupSection.appendChild(itemsContainer);
                addonsContainer.appendChild(groupSection);
            });
            
            // Update the addons price in the accordion header
            const addonsHeader = document.querySelector('.summary-card:nth-child(5) .summary-price');
            if (addonsHeader) {
                addonsHeader.innerText = `AED ${totalAddonsCost.toLocaleString()}`;
            }
            
            // Also update the Meydan Plus price with the ID
            const meydanPlusPrice = document.getElementById('meydan-plus-price');
            if (meydanPlusPrice) {
                meydanPlusPrice.innerText = `AED ${totalAddonsCost.toLocaleString()}`;
            }
        }
        
        // Update total cost
        document.getElementById("total-cost-display").innerText = `AED ${Math.round(totalCost).toLocaleString()}`;
    }

    function calculateCosts() {
        const snapshot = getFormSnapshot();
        
        const licenseComponent = calculateLicenseCost(snapshot);
        const visaComponent = calculateVisaCost(snapshot);
        const officeComponent = calculateOfficeCost(snapshot);
        const addonsComponent = calculateAddonsCost(snapshot);
        
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
            
            // First 3 groups are free, then 1000 AED per additional group
            const uniqueGroups = Object.keys(activityGroups).length;
            const extraGroups = Math.max(0, uniqueGroups - 3);
            businessActivitiesCost = extraGroups * 1000;
        }
        
        // Bank account cost is now included in add-ons, so we don't add it separately
        const totalCost = licenseComponent + visaComponent + officeComponent + addonsComponent + businessActivitiesCost;
        
        const costs = {
            licenseCost: licenseComponent,
            visaCost: visaComponent,
            bankAccountCost: 0, // Set to 0 as it's included in add-ons
            officeCost: officeComponent,
            addonsCost: addonsComponent,
            businessActivitiesCost: businessActivitiesCost,
            totalCost: totalCost
        };
        
        // Set global variables for access in other functions
        LicenseCost = Math.round(licenseComponent);
        VisaCost = Math.round(visaComponent);
        window.AddonsComponent = Math.round(addonsComponent);
        window.BusinessActivitiesCost = Math.round(businessActivitiesCost);

        updateSummaryUI(costs, snapshot);
        
        // Save form data to localStorage for potential recovery
        try {
            localStorage.setItem('costCalculatorData', JSON.stringify(snapshot));
        } catch (e) {
            console.log('Unable to save form data to localStorage', e);
        }
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
                
                // First 3 groups are free, then 1000 AED per additional group
                const uniqueGroups = Object.keys(activityGroups).length;
                const extraGroups = Math.max(0, uniqueGroups - 3);
                businessActivitiesCost = extraGroups * 1000;
            }
            
            console.log("Calculated Total Cost Components:");
            console.log("License: " + licenseComponent);
            console.log("Visa: " + visaComponent);
            console.log("Office: " + officeComponent);
            console.log("Add-ons: " + addonsComponent);
            console.log("Business Activities: " + businessActivitiesCost);
            
            // Return the total cost
            return Math.round(licenseComponent + visaComponent + officeComponent + addonsComponent + businessActivitiesCost);
        } else {
            console.log("Using Global Variables for Total Cost:");
            console.log("License: " + LicenseCost);
            console.log("Visa: " + VisaCost);
            console.log("Add-ons: " + window.AddonsComponent);
            console.log("Business Activities: " + window.BusinessActivitiesCost);
            
            // Return the total cost using global variables
            return LicenseCost + VisaCost + (window.AddonsComponent || 0) + (window.BusinessActivitiesCost || 0);
        }
    }

    function submitPartialData(step, status = 'incomplete') {
        const shareholdersCount = parseInt(document.getElementById("shareholders-range").value) || 0;
        // Use default nationality value instead of collecting from removed fields
        const shareholderNationalities = Array(shareholdersCount).fill('Default');

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
            office_type: "none", // Office type removed as step 5 was removed
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
        // Use default nationality value instead of collecting from removed fields
        const shareholderNationalities = Array(shareholdersCount).fill('Default');

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
            elementorForm.find('input[name="form_fields[bank_cost]"]').val(0); // Bank cost is included in add-ons
            elementorForm.find('input[name="form_fields[form_status]"]').val('complete');

            setTimeout(function() {
                const submitButton = elementorForm.find('.elementor-button[type="submit"]');
                if (submitButton.length > 0) {
                    submitButton.click();
                    
                    document.querySelector('#MFZ-NewCostCalForm .form-container').style.display = 'none';
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

    // Countries array removed as we no longer need nationality selection

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
        const visaInput = document.getElementById(visaType === 'dependency' ? 'dependency-visas' : `${visaType}-visa-count`);
        
        if (toggle.checked) {
            optionsDiv.style.display = 'block';
            visaInput.setAttribute('required', 'required');
            
            // For investor visa, automatically set to 1 and disable changing it
            if (visaType === 'investor') {
                visaInput.value = '1';
                visaInput.setAttribute('readonly', 'readonly');
                visaInput.style.backgroundColor = '#f9f9f9';
            } else {
                // For employee and dependency visas, set default to 1 but allow changes
                visaInput.value = '1';
                visaInput.removeAttribute('readonly');
                visaInput.style.backgroundColor = '#FFF';
            }
        } else {
            optionsDiv.style.display = 'none';
            visaInput.removeAttribute('required');
            visaInput.value = '';
            const errorElement = document.getElementById(visaInput.id + '-error');
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
    const supabaseUrl = 'https://sb.meydanfz.ae';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU3MjQyMDM2LCJleHAiOjIwNzI4MTgwMzZ9.5YF79Wen41bSpKNOKiT9Wcd_psXf8IV4vgK7RUjOZoI';
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
                resultItem.className = 'search-result-items';
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
            const numActiveGroups = activeGroups.size;
            
            // Update the counts
            groupsSelectedCount.textContent = numActiveGroups;
            activitiesSelectedCount.textContent = totalActivities;
            
            // Show/hide fee warning based on number of activity groups
            const feeWarning = document.querySelector('.fee-warning');
            if (feeWarning) {
                if (numActiveGroups > 3) {
                    feeWarning.style.display = 'block';
                } else {
                    feeWarning.style.display = 'none';
                }
            }
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
