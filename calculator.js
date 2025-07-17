    let selectedActivities = []; 
    let LicenseCost = 0;
    let VisaCost = 0;
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 60000; 
    let firstStepData = null;
    let hasStartedForm = false;
    let hasSubmittedIncomplete = false;
    let isContactFormCompleted = false;
    
    // Pricing visibility management - SIMPLE APPROACH
    let pricingRevealed = false;
    


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
            initializeMobileSummary();
            
            // Initialize change status event listeners
            initializeChangeStatusEventListeners();
            
            // Initialize section locking
            initializeSectionLocking();
            
            // Initialize Get a Call buttons
            initializeGetCallButtons();
            
            // Initialize pricing visibility
            initializePricingVisibility();
            
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
                selectLicenseType(licenseType);
                });
            });
            
        licenseSelectBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click
                const licenseType = this.getAttribute('data-license');
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
                
                calculateCosts();
                    });
                });
        
        // Shareholders options
        const shareholdersOptions = document.querySelectorAll('#shareholders-options .pill-option');
        shareholdersOptions.forEach(option => {
            option.addEventListener('click', function() {
                shareholdersOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                const value = this.getAttribute('data-value');
                document.getElementById('shareholders-range').value = value;
                
                calculateCosts();
            });
        });
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
                const existingErrors = document.querySelectorAll('.tax-compliance-warning, .error-message');
                existingErrors.forEach(error => {
                    if (error.style.display !== 'none') {
                        error.style.display = 'none';
                    }
                });
                
                // Special handling for tax compliance pills
                if (this.classList.contains('tax-compliance-pill')) {
                    checkTaxCompliance();
                }
                
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
                console.log('Activity selected, recalculated costs, selectedActivities:', window.selectedActivities);
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
                console.log('Activity selected from modal, recalculated costs, selectedActivities:', window.selectedActivities);
            });
        });
    }
    
    function addActivityToSelected(activity, groupName) {
        if (!window.selectedActivities.some(item => item.Code === activity.Code)) {
            window.selectedActivities.push({ ...activity, groupName, Group: activity.Group });
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
                
                console.log(`Group: ${groupName}, Count: ${count}`); // Debug log
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
        
        modalTitle.textContent = categoryName;
        modalSubtitle.textContent = categoryDescription;
        
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
        
        servicesList.innerHTML = html;
        
        // Add click handlers for toggle switches
        servicesList.querySelectorAll('.addon-service-toggle').forEach(toggle => {
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
                const existingErrors = document.querySelectorAll('.tax-compliance-warning, .error-message');
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
                {
                    id: 'dependent-visa',
                    name: 'Dependent Visa',
                    price: 6000,
                    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                    description: 'Easily sponsor family members with full assistance on documents, applications, and legal compliance.'
                }
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
                description: 'An Investor Visa in Dubai is a type of long-term residence visa designed for foreign nationals who wish to invest in or establish a business in Dubai. It allows you to live, work, and sponsor your family in Dubai, with renewals available as long as your investment remains valid.<br><br>Unlike a standard employment visa, this is a self-sponsored visa, directly tied to your ownership or role in the company. It’s ideal for founders, co-founders, and partners who want full control over their immigration status.',
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
                console.log('Investor visa selected');
                
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
                
                console.log('Modal should be closed now');
                return false;
            });
        } else if (visaType === 'employee') {
            freshActionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Employee visa selected');
                
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
                
                console.log('Modal should be closed now');
                return false;
            });
        } else if (visaType === 'dependent') {
            freshActionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Dependent visa selected');
                
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
                
                console.log('Modal should be closed now');
                return false;
            });
        } else if (visaType === 'change-status') {
            freshActionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Change status info acknowledged');
                
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
                
                console.log('Modal should be closed now');
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
            console.log('License selected:', licenseType);
            
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
            
                    console.log('Modal should be closed now');
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
        console.log('closeLicenseModal called');
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
        
        console.log('Modal should be closed now');
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
            console.log('Close button clicked');
            
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
            
            console.log('Modal should be closed now');
            return false;
        });
        
        document.getElementById('license-modal-back-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button clicked');
            
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
            
            console.log('Modal should be closed now');
            return false;
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Modal background clicked');
                
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
                
                console.log('Modal should be closed now');
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
        
        if (detailedSummary.style.display === 'none') {
            // Show detailed view
            simplifiedSummary.style.display = 'none';
            detailedSummary.style.display = 'block';
            } else {
            // Show simplified view
            simplifiedSummary.style.display = 'block';
            detailedSummary.style.display = 'none';
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

    // Validate entire form before submission
    function validateForm() {
        let valid = true;

        // Clear previous error messages
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        // Validate required fields
        const requiredInputs = document.querySelectorAll("input[required], select[required]");
        requiredInputs.forEach(input => {
            const errorElement = document.getElementById(`${input.id}-error`);

            if (!input.value) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "This field is required";
                valid = false;
            }

            if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "Please enter a valid email address";
                valid = false;
            }

            if (input.type === "tel" && input.value && !phoneInput.isValidNumber()) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "Please enter a valid phone number";
                valid = false;
            }

            if (input.id === "full-name" && input.value && !/^[A-Za-z\s]+$/.test(input.value)) {
                input.classList.add('error');
                if (errorElement) errorElement.textContent = "Name should contain only letters and spaces";
                valid = false;
            }
        });

        // Validate license type selection (now using hidden input)
        const licenseTypeInput = document.getElementById("license-type");
        if (!licenseTypeInput.value) {
            const licenseCardsContainer = document.querySelector('.license-cards-container');
            if (licenseCardsContainer && !licenseCardsContainer.querySelector('.error-message')) {
                    const licenseErrorElement = document.createElement('div');
                    licenseErrorElement.className = 'error-message';
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
            packageType: "standard",
            licenseDuration: parseInt(document.getElementById("license-duration")?.value) || 1,
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

    function calculateChangeStatusCost(snapshot) {
        const insideCount = parseInt(document.getElementById('applicants-inside-uae')?.value) || 0;
        return insideCount * 1500; // 1500 AED per applicant inside UAE
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
        document.getElementById("summary-license-duration").innerText = `${licenseDuration} Year${licenseDuration > 1 ? "s" : ""}`;
        
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
            
            console.log('updateSummaryUI: Processing business activities, selectedActivities length:', window.selectedActivities ? window.selectedActivities.length : 0);
            
            // Only show business activities section if activities are selected
            if (window.selectedActivities && window.selectedActivities.length > 0) {
                console.log('updateSummaryUI: Showing business activities section');
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
                console.log('updateSummaryUI: Hiding business activities section - no activities selected');
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
        const investorVisaCost = investorVisas > 0 ? 5850 * investorVisas : 0;
        const employeeVisaCost = employeeVisas > 0 ? 5350 * employeeVisas : 0;
        const dependencyVisaCost = dependencyVisas > 0 ? 7850 * dependencyVisas : 0;
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
        
        // Update immigration card fee
        const immigrationCardElement = document.getElementById("immigration-card-cost");
        if (immigrationCardElement) {
            immigrationCardElement.innerText = window.immigrationCardFee > 0 ? `AED ${window.immigrationCardFee.toLocaleString()}` : 'AED 0';
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
        const addonsSection = document.querySelector('.summary-section:nth-child(5)');
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
            "dependent-visa": { name: "Dependent Visa", cost: 6000, group: "mResidency" },
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

            // Show/hide addons section based on selections
            if (hasSelectedAddons) {
                addonsSection.style.display = 'block';
                
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
                        value.innerText = `AED ${addon.cost.toLocaleString()}`;
                        
                        row.appendChild(label);
                        row.appendChild(value);
                        groupContent.appendChild(row);
                    });
                    
                    groupSection.appendChild(groupContent);
                addonsContainer.appendChild(groupSection);
            });
            } else {
                // Hide addons section if no addons selected
                addonsSection.style.display = 'none';
            }
        }
        
        // Update grand total
        updateGrandTotal(totalCost);
    }

    function calculateCosts() {
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

        updateSummaryUI(costs, snapshot);
        
        // Update basic package price
        updateBasicPackagePrice(totalCost);
        
        // Always update the grand total (including mobile)
        updateGrandTotal(totalCost);
        
        // Save form data to localStorage for potential recovery
        try {
            localStorage.setItem('costCalculatorData', JSON.stringify(snapshot));
        } catch (e) {
            console.log('Unable to save form data to localStorage', e);
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
            
            console.log("Calculated Total Cost Components:");
            console.log("License: " + licenseComponent);
            console.log("Visa: " + visaComponent);
            console.log("Office: " + officeComponent);
            console.log("Add-ons: " + addonsComponent);
            console.log("Business Activities: " + businessActivitiesCost);
            console.log("Change Status: " + changeStatusComponent);
            
            // Return the total cost
            return Math.round(licenseComponent + visaComponent + officeComponent + addonsComponent + businessActivitiesCost + changeStatusComponent);
        } else {
            console.log("Using Global Variables for Total Cost:");
            console.log("License: " + LicenseCost);
            console.log("Visa: " + VisaCost);
            console.log("Add-ons: " + window.AddonsComponent);
            console.log("Business Activities: " + window.BusinessActivitiesCost);
            console.log("Change Status: " + (window.ChangeStatusCost || 0));
            
            // Return the total cost using global variables
            return LicenseCost + VisaCost + (window.AddonsComponent || 0) + (window.BusinessActivitiesCost || 0) + (window.ChangeStatusCost || 0);
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
            license_type: document.getElementById("license-type")?.value || "fawri",
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
            applicants_inside_uae: document.getElementById("applicants-inside-uae")?.value || '0',
            applicants_outside_uae: document.getElementById("applicants-outside-uae")?.value || '0',
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

    // Contact form Next/Continue button - only scrolls to next section
    document.getElementById('submitBtn').addEventListener('click', function(e) {
        e.preventDefault();
        const submitBtn = this;

        // Check if contact form is valid before proceeding
        if (!validateContactForm()) {
            // Show validation errors or highlight empty fields
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
            
            // Scroll to first error field
            const firstError = document.querySelector('.form-group input.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            
            return; // Don't proceed with scrolling
        }

        // If contact form is valid, scroll to the next section (company setup)
        const nextSection = document.getElementById('company-setup-section');
        if (nextSection) {
            const headerOffset = 80; // Account for any fixed headers
            const elementPosition = nextSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });

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

        clearTimeout(inactivityTimer);
        hasSubmittedIncomplete = true; 

        submitBtn.classList.add('button-loading');
        submitBtn.disabled = true;

        calculateCosts();

        const fullName = document.getElementById("full-name").value;
        const phone = phoneInput.getNumber();
        const email = document.getElementById("email").value;
                const licenseType = document.getElementById("license-type")?.value || "fawri";
        
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
                    
                            document.querySelector('#srix-NewCostCalForm').style.display = 'none';
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
        });
    }

    // Section Locking System
    function initializeSectionLocking() {
        try {
            // Lock all sections except contact form on page load
            lockSections();
            
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
            const isNameValid = fullName && fullName.length >= 2 && /^[A-Za-z\s]+$/.test(fullName);
            const isEmailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            
            // Phone validation using existing phoneInput if available
            let isPhoneValid = false;
            if (phoneField && typeof phoneInput !== 'undefined') {
                try {
                    if (phoneInput.isValidNumber && phoneInput.getNumber) {
                        isPhoneValid = phoneInput.isValidNumber();
                    } else {
                        // Fallback to basic validation
                        const phoneValue = phoneField.value?.trim();
                        isPhoneValid = phoneValue && phoneValue.length >= 8;
                    }
                } catch (err) {
                    // Fallback to basic validation
                    const phoneValue = phoneField.value?.trim();
                    isPhoneValid = phoneValue && phoneValue.length >= 8;
                }
            } else {
                // If phoneInput not available, use basic validation
                const phoneValue = phoneField?.value?.trim();
                isPhoneValid = phoneValue && phoneValue.length >= 8;
            }
            
            return isNameValid && isEmailValid && isPhoneValid;
        } catch (err) {
            console.error("Error validating contact form:", err);
            return false;
        }
    }

    function lockSections() {
        try {
            const sectionsToLock = [
                'company-setup-section',
                'business-activities-section', 
                'visa-options-section',
                'change-status-section',
                'addons-section'
            ];
            
            sectionsToLock.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section && !section.classList.contains('locked')) {
                    section.classList.add('locked');
                    
                    // Add lock overlay if it doesn't exist
                    if (!section.querySelector('.section-lock-overlay')) {
                        const overlay = createLockOverlay(sectionId);
                        section.appendChild(overlay);
                        
                        // Add click handler to overlay to scroll to contact form
                        overlay.addEventListener('click', () => {
                            const contactSection = document.getElementById('personal-details-section');
                            if (contactSection) {
                                const headerOffset = 20;
                                const elementPosition = contactSection.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                                window.scrollTo({
                                    top: offsetPosition,
                                    behavior: 'smooth'
                                });
                                
                                // Focus on first empty field
                                const firstEmptyField = contactSection.querySelector('input:not([value]), input[value=""]');
                                if (firstEmptyField) {
                                    setTimeout(() => firstEmptyField.focus(), 500);
                                }
                            }
                        });
                        
                        // Add hover effect
                        overlay.style.cursor = 'pointer';
                        overlay.title = 'Click to go to contact form';
                    }
                }
            });
        } catch (err) {
            console.error("Error locking sections:", err);
        }
    }

    function unlockSections() {
        try {
            const sectionsToUnlock = [
                'company-setup-section',
                'business-activities-section',
                'visa-options-section', 
                'change-status-section',
                'addons-section'
            ];
            
            sectionsToUnlock.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section && section.classList.contains('locked')) {
                    section.classList.add('unlocking');
                    section.classList.remove('locked');
                    
                    // Remove lock overlay
                    const overlay = section.querySelector('.section-lock-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                    
                    // Remove unlocking class after animation
                    setTimeout(() => {
                        section.classList.remove('unlocking');
                    }, 500);
                }
            });
        } catch (err) {
            console.error("Error unlocking sections:", err);
        }
    }

    function createLockOverlay(sectionId) {
        const overlay = document.createElement('div');
        overlay.className = 'section-lock-overlay';
        
        let title = 'Complete Contact Information';
        let message = 'Fill out your contact details above to unlock this section';
        
        // Customize message based on section
        switch(sectionId) {
            case 'company-setup-section':
                title = 'Choose Your Business License';
                message = 'Complete your contact information to select your business license type';
                break;
            case 'business-activities-section':
                title = 'Select Business Activities';
                message = 'Complete your contact information to choose your business activities';
                break;
            case 'visa-options-section':
                title = 'Configure Visa Options';
                message = 'Complete your contact information to set up visa requirements';
                break;
            case 'change-status-section':
                title = 'Change Status Options';
                message = 'Complete your contact information to access change status services';
                break;
            case 'addons-section':
                title = 'Additional Services';
                message = 'Complete your contact information to explore additional services';
                break;
        }
        
        overlay.innerHTML = `
            <div class="lock-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                </svg>
            </div>
            <h3>${title}</h3>
            <p>${message}</p>
        `;
        
        return overlay;
    }

    function updateSectionLockState() {
        try {
            const isValid = validateContactForm();
            const contactSection = document.querySelector('.contact-form-section');
            const submitBtn = document.getElementById('submitBtn');
            const progressIndicator = document.getElementById('contact-progress');
            const progressIcon = document.getElementById('progress-icon');
            
            if (isValid && !isContactFormCompleted) {
                // Form is now valid - unlock sections
                isContactFormCompleted = true;
                unlockSections();
                
                // REVEAL PRICING - when form is validated
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
                    
                    console.log('✅ Pricing revealed after contact form validation');
                }

                
                // Update contact section styling
                if (contactSection) {
                    contactSection.classList.add('completed');
                }
                
                // Update submit button
                if (submitBtn) {
                    submitBtn.classList.add('validated');
                    submitBtn.querySelector('span').textContent = 'Continue to Calculator';
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
                            You’re all set. Let’s explore your business setup options.
                        `;
                    }
                }
                
            } else if (!isValid && isContactFormCompleted) {
                // Form was valid but now invalid - lock sections again
                isContactFormCompleted = false;
                lockSections();
                
                // Update contact section styling
                if (contactSection) {
                    contactSection.classList.remove('completed');
                }
                
                // Update submit button
                if (submitBtn) {
                    submitBtn.classList.remove('validated');
                    submitBtn.querySelector('span').textContent = 'Next';
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

        
        // Ensure Fawri license is selected by default for calculations
        selectLicenseType('fawri');
        
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
        
        calculateCosts();
        updateChangeStatusVisibility();
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
            const formContainer = document.querySelector('#srix-NewCostCalForm');
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
        const card = document.querySelector(`[data-visa="${visaType}"]`);
        const selectBtn = card.querySelector('.select-btn');
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
            
            // Update hidden input with initial quantity
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
            
            // Trigger calculation
            calculateCosts();
            updateChangeStatusVisibility();
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
        
        calculateCosts();
        updateChangeStatusVisibility();
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
    


    // Deselect visa card function - unified approach
    function deselectVisaCard(visaType) {
        const card = document.querySelector(`[data-visa="${visaType}"]`);
        const selectBtn = card.querySelector('.select-btn');
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
        }
    }

    // Change Status functionality
    function adjustStatusCount(type, change) {
        console.log('adjustStatusCount called:', type, change);
        
        if (type !== 'inside') return; // Only handle inside UAE adjustments
        
        const quantityElement = document.getElementById('inside-quantity');
        
        if (!quantityElement) {
            console.error('inside-quantity element not found!');
            return;
        }
        
        const currentCount = parseInt(quantityElement.textContent) || 0;
        console.log('Current count:', currentCount);
        
        // Get total visa count to set maximum
        const totalVisaCount = getTotalVisaCount();
        console.log('Total visa count:', totalVisaCount);
        
        // For inside UAE, can't exceed total visas and can't go below 0
        const newCount = Math.max(0, Math.min(totalVisaCount, currentCount + change));
        console.log('New count:', newCount);
        
        // Calculate outside count automatically
        const outsideCount = totalVisaCount - newCount;
        const outsideCountElement = document.getElementById('outside-count');
        
        console.log('Before DOM update:');
        console.log('- quantityElement.textContent:', quantityElement.textContent);
        console.log('- outsideCountElement.textContent:', outsideCountElement ? outsideCountElement.textContent : 'not found');
        
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
        
        console.log('After DOM update:');
        console.log('- quantityElement.textContent:', quantityElement.textContent);
        console.log('- quantityElement.innerHTML:', quantityElement.innerHTML);
        console.log('- outsideCountElement.textContent:', outsideCountElement ? outsideCountElement.textContent : 'not found');
        console.log('- Updated - Inside:', newCount, 'Outside:', outsideCount);
        
        // Update button states
        updateStatusButtonStates();
        
        // Trigger calculation
        calculateCosts();
    }

    function getTotalVisaCount() {
        const investorVisas = parseInt(document.getElementById('investor-visa-count').value) || 0;
        const employeeVisas = parseInt(document.getElementById('employee-visa-count').value) || 0;
        const dependencyVisas = parseInt(document.getElementById('dependency-visas').value) || 0;
        return investorVisas + employeeVisas + dependencyVisas;
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
        
        console.log('Button states updated - Inside count:', insideCount, 'Total visa count:', totalVisaCount);
        console.log('Plus button disabled:', plusBtn ? plusBtn.disabled : 'not found');
        console.log('Minus button disabled:', minusBtn ? minusBtn.disabled : 'not found');
    }

    function updateChangeStatusVisibility() {
        const totalVisaCount = getTotalVisaCount();
        const changeStatusSection = document.getElementById('change-status-section');
        
        console.log('updateChangeStatusVisibility called - totalVisaCount:', totalVisaCount);
        
        if (totalVisaCount > 0) {
            const wasHidden = changeStatusSection.style.display === 'none';
            console.log('Section was hidden:', wasHidden);
            changeStatusSection.style.display = 'flex';
            
            // Only reset counts when showing for the first time or when total visa count changes
            if (wasHidden) {
                console.log('Resetting counts because section was hidden');
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
                console.log('Section already visible - updating outside count. Current inside:', currentInside, 'New outside:', newOutside);
                document.getElementById('outside-count').textContent = newOutside;
                document.getElementById('applicants-outside-uae').value = newOutside;
            }
        } else {
            console.log('Hiding section and resetting counts');
            changeStatusSection.style.display = 'none';
            // Reset counts when hiding
            document.getElementById('inside-quantity').textContent = '0';
            document.getElementById('outside-count').textContent = '0';
            document.getElementById('applicants-inside-uae').value = '0';
            document.getElementById('applicants-outside-uae').value = '0';
        }
    }

    function initializeChangeStatusEventListeners() {
        // Use event delegation to handle clicks on change status buttons
        document.addEventListener('click', function(e) {
            // Check if clicked element is a change status quantity button
            if (e.target.matches('#inside-selected-controls .quantity-btn.minus')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Change status minus button clicked');
                adjustStatusCount('inside', -1);
            } else if (e.target.matches('#inside-selected-controls .quantity-btn.plus')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Change status plus button clicked');
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
    function updateMobilePrice() {
        const mobileGrandTotalPrice = document.getElementById('mobile-grand-total-price');
        if (mobileGrandTotalPrice) {
            const totalCost = calculateTotalCost();
            const formattedTotal = `AED ${totalCost.toLocaleString()}`;
            mobileGrandTotalPrice.textContent = formattedTotal;
        }
    }

    function initializeMobileSummary() {
        const mobileStickyFooter = document.getElementById('mobile-sticky-footer');
        const summarySheet = document.querySelector('.sticky-summary-container');
        const overlay = document.getElementById('bottom-sheet-overlay');
        const closeTrigger = document.querySelector('.sheet-close-handle');
        const body = document.body;
        const mobileGetCallBtn = document.getElementById('mobile-get-call-btn');

        if (!mobileStickyFooter || !summarySheet || !overlay || !closeTrigger) {
            console.warn('Mobile summary elements not found. Feature disabled.');
            return;
        }

        let sheetIsOpen = false;

        const openSheet = () => {
            if (sheetIsOpen) return;
            
            // Store current scroll position before opening sheet
            window.scrollPositionBeforeModal = window.pageYOffset || document.documentElement.scrollTop;
            
            // Force the total to update before opening
            updateMobilePrice();
            
            // Show the detailed summary instead of simplified
            const simplifiedSummary = document.getElementById('simplified-summary');
            const detailedSummary = document.getElementById('detailed-summary');
            if (simplifiedSummary && detailedSummary) {
                simplifiedSummary.style.display = 'none';
                detailedSummary.style.display = 'block';
            }
            
            // Add classes to show the sheet
            summarySheet.classList.add('sheet-open');
            closeTrigger.classList.add('sheet-open');
            overlay.classList.add('active');
            body.classList.add('sheet-view-active');
            
            // Prevent body scroll
            body.style.overflow = 'hidden';
            
            // Hide the footer when sheet is open
            mobileStickyFooter.style.display = 'none';
            
            sheetIsOpen = true;
        };

        const closeSheet = () => {
            if (!sheetIsOpen) return;
            
            // Remove classes to hide the sheet
            summarySheet.classList.remove('sheet-open');
            closeTrigger.classList.remove('sheet-open');
            overlay.classList.remove('active');
            body.classList.remove('sheet-view-active');
            
            // Restore body scroll
            body.style.overflow = 'auto';
            
            // Show the footer when sheet is closed
            mobileStickyFooter.style.display = 'block';
            
            // Restore scroll position after a brief delay
            if (typeof window.scrollPositionBeforeModal !== 'undefined') {
                setTimeout(() => {
                    window.scrollTo(0, window.scrollPositionBeforeModal);
                }, 10);
            }
            
            sheetIsOpen = false;
        };

        mobileStickyFooter.addEventListener('click', openSheet);
        mobileGetCallBtn.addEventListener('click', openSheet);
        closeTrigger.addEventListener('click', closeSheet);
        overlay.addEventListener('click', closeSheet);

        // Swipe gestures
        let touchStartY = 0;
        let touchMoveY = 0;

        const handleTouchStart = (e) => {
            if (!sheetIsOpen) {
                touchStartY = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e) => {
            if (!sheetIsOpen) {
                touchMoveY = e.touches[0].clientY;
            }
        };

        const handleTouchEnd = () => {
            // Swipe up to open
            if (!sheetIsOpen && touchStartY - touchMoveY > 75) { // 75px swipe threshold
                openSheet();
            }
            // Reset values
            touchStartY = 0;
            touchMoveY = 0;
        };

        mobileStickyFooter.addEventListener('touchstart', handleTouchStart);
        mobileStickyFooter.addEventListener('touchmove', handleTouchMove);
        mobileStickyFooter.addEventListener('touchend', handleTouchEnd);

        // Swipe down on the sheet handle/header to close
        const handleSheetTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleSheetTouchMove = (e) => {
            touchMoveY = e.touches[0].clientY;
        };

        const handleSheetTouchEnd = (e) => {
            // Only trigger close if swiping down from the top of the sheet
            if (sheetIsOpen && touchMoveY - touchStartY > 75 && summarySheet.scrollTop === 0) {
                closeSheet();
            }
            touchStartY = 0;
            touchMoveY = 0;
        };

        summarySheet.addEventListener('touchstart', handleSheetTouchStart);
        summarySheet.addEventListener('touchmove', handleSheetTouchMove);
        summarySheet.addEventListener('touchend', handleSheetTouchEnd);
        
        // Ensure the mobile grand total price is updated on page load
        updateMobilePrice();
        
        // Set up a MutationObserver to watch for changes in the total-cost-display
        // and update the mobile price accordingly
        const totalCostDisplay = document.getElementById('total-cost-display');
        if (totalCostDisplay) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        updateMobilePrice();
                    }
                });
            });
            
            observer.observe(totalCostDisplay, { 
                characterData: true, 
                childList: true, 
                subtree: true 
            });
        }
    

    }

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
                        const headerOffset = 80;
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
                console.log('Mobile auto-scroll: License card clicked', card.dataset.license);
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
                console.log('Mobile auto-scroll: Duration interacted, checking if ready to scroll');
                // Don't immediately scroll, just scroll to shareholders section
                const shareholdersSection = document.getElementById('shareholders-options');
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
        const shareholdersButtons = document.querySelectorAll('#shareholders-options .pill-option');
        shareholdersButtons.forEach(button => {
            button.addEventListener('click', () => {
                shareholdersInteracted = true;
                console.log('Mobile auto-scroll: Shareholders interacted, checking if ready to scroll');
                // Check if both sections have been interacted with
                checkBothSectionsInteracted();
            });
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
                console.log('Mobile auto-scroll: Activity modal closed');
                // Check if any activities are selected after modal closes
                setTimeout(() => {
                    console.log('Mobile auto-scroll: Checking selected activities:', window.selectedActivities ? window.selectedActivities.length : 0);
                    if (window.selectedActivities && window.selectedActivities.length > 0) {
                        const visaOptionsSection = document.getElementById('visa-options-section');
                        if (visaOptionsSection && !visaOptionsSection.classList.contains('locked')) {
                            console.log('Mobile auto-scroll: Scrolling to visa options section after modal close');
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
        console.log('Mobile auto-scroll: Found visa cards:', visaCards.length);
        visaCards.forEach(card => {
            card.addEventListener('click', () => {
                console.log('Mobile auto-scroll: Visa card clicked', card.dataset.visa);
                const allVisaCards = Array.from(document.querySelectorAll('.visa-card:not(.change-status-card)'));
                const currentIndex = allVisaCards.indexOf(card);
                console.log('Mobile auto-scroll: Current index:', currentIndex, 'Total cards:', allVisaCards.length);
                
                // If this is the last visa card, scroll to change status section
                if (currentIndex === allVisaCards.length - 1) {
                    console.log('Mobile auto-scroll: Last visa card, scrolling to change status');
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
                    console.log('Mobile auto-scroll: Not last card, scrolling to next visa card');
                    scrollToNextCard(card, '.visa-card:not(.change-status-card)');
                }
            });
        });
        
        // Visa Toggle Switches
        const visaToggles = document.querySelectorAll('.visa-toggle-switch input');
        visaToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
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

    // Initialize mobile auto-scroll when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeMobileAutoScroll();
        
        // Re-initialize on window resize if switching to/from mobile
        window.addEventListener('resize', function() {
            initializeMobileAutoScroll();
        });
    });

