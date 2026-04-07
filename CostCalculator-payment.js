(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.BPCalculatorPayment = api;
})(
  typeof globalThis !== 'undefined' ? globalThis : this,
  function () {
    var NAME_VALIDATION_REGEX = /^[a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF\u0370-\u03FF\u0400-\u04FF\u1E00-\u1EFF\u1F00-\u1FFF\u2100-\u214F\u0100-\u017F\u1EA0-\u1EF9\u00C0-\u024F'-]+$/;
    var FORBIDDEN_NAME_CHARS_REGEX = /[0-9!@#$%^&*()_+=\[\]{};:"\\|,.<>?/~`]/;
    var EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    var PAYMENT_CONFIG = {
      healthUrl: 'https://marketing.meydanfz.ae/api/payment/health',
      initiateUrl: 'https://marketing.meydanfz.ae/api/payment/initiate',
      callbackUrl: 'https://marketing.meydanfz.ae/api/payment/callback',
      currency: 'AED',
      language: 'EN',
      setupFeeAmount: 12520,
      licenseAmount: 12500,
      fawriLicenseAmount: 15000,
      knowledgeFee: 10,
      innovationFee: 10,
      paymentType: 'setup_fee',
      defaultOfficeSpace: 'Co-working / Flexi Desk',
      billingAddress: {
        address: 'Dubai',
        city: 'Dubai',
        state: 'Dubai',
        zip: '00000',
        country: 'United Arab Emirates',
      },
      timeouts: {
        healthMs: 5000,
        initiateMs: 15000,
      },
    };

    function normalizeString(value) {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    }

    function hasOwnValue(target, key) {
      return (
        target &&
        Object.prototype.hasOwnProperty.call(target, key) &&
        target[key] !== undefined &&
        target[key] !== null
      );
    }

    function pickFirstDefinedValue(source, aliases, fallbackValue) {
      var aliasList = Array.isArray(aliases) ? aliases : [aliases];
      for (var i = 0; i < aliasList.length; i += 1) {
        var key = aliasList[i];
        if (hasOwnValue(source, key)) {
          return source[key];
        }
      }
      return fallbackValue;
    }

    function splitFullName(fullName) {
      var normalized = normalizeString(fullName);
      if (!normalized) {
        return { firstName: '', lastName: '' };
      }

      var nameParts = normalized.split(/\s+/);
      if (nameParts.length === 1) {
        return { firstName: normalized, lastName: normalized };
      }

      return {
        firstName: nameParts.slice(0, -1).join(' '),
        lastName: nameParts[nameParts.length - 1],
      };
    }

    function stripPhoneDigits(value) {
      return normalizeString(value).replace(/\D/g, '');
    }

    function normalizeLicenseType(value) {
      return normalizeString(value).toLowerCase() === 'fawri' ? 'fawri' : 'regular';
    }

    function validateNameValue(value) {
      var normalized = normalizeString(value);

      if (!normalized) {
        return 'Full name is required';
      }

      if (normalized.length < 2) {
        return 'Name must be at least 2 characters long';
      }

      if (normalized.length > 50) {
        return 'Name cannot exceed 50 characters';
      }

      if (FORBIDDEN_NAME_CHARS_REGEX.test(normalized)) {
        return 'Numbers and special characters are not allowed in names';
      }

      if (!NAME_VALIDATION_REGEX.test(normalized)) {
        return 'Name can only contain letters, spaces, hyphens, and apostrophes';
      }

      return '';
    }

    function validateEmailValue(value) {
      var normalized = normalizeString(value);

      if (!normalized) {
        return 'Email address is required';
      }

      if (normalized.length > 254) {
        return 'Email address is too long';
      }

      if (!EMAIL_REGEX.test(normalized)) {
        return 'Please enter a valid email address';
      }

      return '';
    }

    function validatePhoneValue(phoneValue, phoneValidationStatus, phoneValidationMessage) {
      if (!phoneValue || normalizeString(phoneValue) === '') {
        return 'Phone number is required';
      }

      var digits = stripPhoneDigits(phoneValue);
      if (digits.length < 8) {
        return 'Please enter a valid phone number';
      }

      if (phoneValidationStatus === 'valid') {
        return '';
      }

      if (phoneValidationStatus === 'invalid') {
        return normalizeString(phoneValidationMessage) || 'Please enter a valid phone number';
      }

      if (phoneValidationStatus === 'validating') {
        return '';
      }

      return '';
    }

    function validateContactState(state) {
      var nextState = state || {};
      var errors = {};

      var nameError = validateNameValue(nextState.fullName);
      if (nameError) {
        errors['full-name'] = nameError;
      }

      var emailError = validateEmailValue(nextState.email);
      if (emailError) {
        errors.email = emailError;
      }

      var phoneStatus = normalizeString(nextState.phoneValidationStatus) || 'idle';
      var phoneMessage = normalizeString(nextState.phoneValidationMessage);
      var localPhoneDigits = stripPhoneDigits(nextState.phone);

      if (normalizeString(nextState.phone) && localPhoneDigits.length >= 5) {
        if (phoneStatus !== 'valid') {
          errors.phone =
            phoneStatus === 'invalid'
              ? phoneMessage || 'Please enter a valid phone number'
              : 'Please wait while we validate your phone number';
        }
      } else {
        var phoneError = validatePhoneValue(nextState.phone, phoneStatus, phoneMessage);
        if (phoneError) {
          errors.phone = phoneError;
        }
      }

      var countryRequired = nextState.countryRequired !== false;
      var countryVisible = nextState.countryVisible !== false;
      if (countryVisible && countryRequired && !normalizeString(nextState.country)) {
        errors.country = 'Current country of residence is required';
      }

      if (!nextState.consentChecked) {
        errors.consent = 'You must agree to the terms and privacy policy';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
      };
    }

    function validatePaymentState(state) {
      var nextState = state || {};
      var validation = validateContactState(nextState);
      var errors = Object.assign({}, validation.errors);

      var totalVisas = Number(nextState.totalVisas || 0);
      if (Number.isFinite(totalVisas) && totalVisas > 6) {
        errors.payment = 'Pay options are unavailable when total visas exceed 6.';
      }

      var amount = Number(nextState.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        errors.paymentAmount = 'Payment amount is unavailable. Please refresh and try again.';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors,
      };
    }

    function evaluatePaymentStepGuard(state) {
      var nextState = state || {};
      var validation = validatePaymentState(nextState);
      var errors = Object.assign({}, validation.errors);

      if (nextState.isSubmitting) {
        errors.payment = 'A payment request is already in progress. Please wait.';
      }

      if (nextState.paymentHealth === false) {
        errors.payment =
          normalizeString(nextState.paymentHealthMessage) ||
          'Payment is temporarily unavailable. Please try again later.';
      }

      var errorKeys = Object.keys(errors);
      return {
        allowed: errorKeys.length === 0,
        errors: errors,
        message: errorKeys.length > 0 ? errors[errorKeys[0]] : '',
      };
    }

    function formatActionType(actionType) {
      var actionTypeMap = {
        'call-now': 'Request a Call Now',
        'schedule-later': 'Schedule a Call Later',
        'schedule-confirmed': 'Schedule a Call Later',
        'in-person': 'Schedule An In-Person Meeting',
        payment_initiated: 'Payment Initiated',
        payment_success: 'Payment Successful',
        payment_failed: 'Payment Failed',
        payment_cancelled: 'Payment Cancelled',
        Success: 'Payment Successful',
        Failure: 'Payment Failed',
        Failed: 'Payment Failed',
        Cancelled: 'Payment Cancelled',
        Canceled: 'Payment Cancelled',
        Aborted: 'Payment Cancelled',
      };

      return actionTypeMap[actionType] || actionType;
    }

    function normalizePaymentStatus(rawStatus) {
      var normalized = normalizeString(rawStatus);
      if (!normalized) return '';

      var lookup = {
        success: 'Success',
        failure: 'Failure',
        failed: 'Failure',
        cancelled: 'Cancelled',
        canceled: 'Cancelled',
        aborted: 'Aborted',
      };

      return lookup[normalized.toLowerCase()] || normalized;
    }

    function mapPaymentStatusToAction(paymentStatus) {
      var normalized = normalizePaymentStatus(paymentStatus);

      if (normalized === 'Success') {
        return 'payment_success';
      }

      if (normalized === 'Cancelled' || normalized === 'Aborted') {
        return 'payment_cancelled';
      }

      return 'payment_failed';
    }

    function createSetupFeeSummary(input) {
      var nextInput = input || {};
      var licenseType = normalizeLicenseType(nextInput.licenseType);
      var licenseFee =
        licenseType === 'fawri'
          ? Number(PAYMENT_CONFIG.fawriLicenseAmount || 15000)
          : Number(PAYMENT_CONFIG.licenseAmount || 12500);
      var innovationFee = Number(PAYMENT_CONFIG.innovationFee || 0);
      var knowledgeFee = Number(PAYMENT_CONFIG.knowledgeFee || 0);

      return {
        licenseType: licenseType,
        licenseFee: licenseFee,
        innovationFee: innovationFee,
        knowledgeFee: knowledgeFee,
        total: licenseFee + innovationFee + knowledgeFee,
      };
    }

    function generateOrderId(now, randomValue) {
      var currentDate = now instanceof Date ? now : new Date();
      var randomNumber =
        typeof randomValue === 'number'
          ? randomValue
          : Math.floor(Math.random() * 1000000);

      var timestamp =
        currentDate.getFullYear().toString() +
        String(currentDate.getMonth() + 1).padStart(2, '0') +
        String(currentDate.getDate()).padStart(2, '0') +
        String(currentDate.getHours()).padStart(2, '0') +
        String(currentDate.getMinutes()).padStart(2, '0') +
        String(currentDate.getSeconds()).padStart(2, '0');

      return timestamp + String(randomNumber).padStart(6, '0');
    }

    function buildSecurePaymentRequest(input) {
      var nextInput = input || {};
      var currentUrl = normalizeString(nextInput.currentUrl).split('?')[0];
      var callbackUrl =
        PAYMENT_CONFIG.callbackUrl +
        '?return_url=' +
        encodeURIComponent(currentUrl);

      return {
        order_id: normalizeString(nextInput.orderId),
        amount: Number(nextInput.amount || 0),
        currency: PAYMENT_CONFIG.currency,
        language: PAYMENT_CONFIG.language,
        billing_name: normalizeString(nextInput.fullName),
        billing_email: normalizeString(nextInput.email),
        billing_tel: normalizeString(nextInput.phone),
        billing_address: PAYMENT_CONFIG.billingAddress.address,
        billing_city: PAYMENT_CONFIG.billingAddress.city,
        billing_state: PAYMENT_CONFIG.billingAddress.state,
        billing_zip: PAYMENT_CONFIG.billingAddress.zip,
        billing_country: PAYMENT_CONFIG.billingAddress.country,
        redirect_url: callbackUrl,
        cancel_url: callbackUrl,
        merchant_param2: String(nextInput.visaAmount || 0),
        merchant_param3: normalizeString(nextInput.selectedLicense),
        merchant_param4: normalizeString(nextInput.businessActivitiesText).substring(0, 500),
        merchant_param5: normalizeString(nextInput.totalVisasText),
      };
    }

    function buildPaymentSessionData(input) {
      var nextInput = input || {};
      return {
        fullName: normalizeString(nextInput.fullName || nextInput.name),
        email: normalizeString(nextInput.email),
        phone: normalizeString(nextInput.phone),
        country: normalizeString(nextInput.country),
        orderId: normalizeString(nextInput.orderId),
        paymentAmount: Number(nextInput.paymentAmount || 0),
        paymentType: normalizeString(nextInput.paymentType || PAYMENT_CONFIG.paymentType),
        trackingId: normalizeString(nextInput.trackingId),
        timestamp: normalizeString(nextInput.timestamp || new Date().toISOString()),
      };
    }

    function createUnifiedSubmissionPayload(input) {
      var source = input || {};
      var unifiedPayload = {
        actionType: normalizeString(pickFirstDefinedValue(source, ['actionType', 'action_type'], '')),
        leadStatus: normalizeString(
          pickFirstDefinedValue(source, ['leadStatus', 'lead_status'], 'complete'),
        ),
        incompleteReason: normalizeString(
          pickFirstDefinedValue(source, ['incompleteReason', 'incomplete_reason', 'reason'], ''),
        ),
        formStatus: normalizeString(
          pickFirstDefinedValue(source, ['formStatus', 'form_status'], ''),
        ),
        formId: normalizeString(pickFirstDefinedValue(source, ['formId', 'form_id'], '')),
        formName: normalizeString(pickFirstDefinedValue(source, ['formName', 'form_name'], '')),
        fullName: normalizeString(
          pickFirstDefinedValue(source, ['fullName', 'full_name', 'name'], ''),
        ),
        email: normalizeString(pickFirstDefinedValue(source, 'email', '')),
        phone: normalizeString(pickFirstDefinedValue(source, 'phone', '')),
        countryOfResidence: normalizeString(
          pickFirstDefinedValue(source, ['countryOfResidence', 'country_of_residence', 'country'], ''),
        ),
        consent: normalizeString(pickFirstDefinedValue(source, 'consent', '')),
        bsaCode: normalizeString(pickFirstDefinedValue(source, ['bsaCode', 'bsa_code'], '')),
        officeSpace: normalizeString(
          pickFirstDefinedValue(source, ['officeSpace', 'office_space'], PAYMENT_CONFIG.defaultOfficeSpace),
        ),
        licenseType: normalizeString(
          pickFirstDefinedValue(source, ['licenseType', 'license_type'], ''),
        ),
        licenseDuration: pickFirstDefinedValue(
          source,
          ['licenseDuration', 'license_duration'],
          '',
        ),
        shareholdersCount: pickFirstDefinedValue(
          source,
          ['shareholdersCount', 'shareholders_count', 'shareholdersRange', 'shareholders_range', 'shareholders'],
          '',
        ),
        selectedActivities: normalizeString(
          pickFirstDefinedValue(source, ['selectedActivities', 'selected_activities', 'businessActivities', 'business_activities'], ''),
        ),
        selectedActivitiesCount: pickFirstDefinedValue(
          source,
          ['selectedActivitiesCount', 'selected_activities_count'],
          0,
        ),
        selectedActivitiesDetails: normalizeString(
          pickFirstDefinedValue(source, ['selectedActivitiesDetails', 'selected_activities_details'], ''),
        ),
        investorVisas: pickFirstDefinedValue(
          source,
          ['investorVisas', 'investor_visas', 'investorVisa', 'investor_visa'],
          0,
        ),
        employeeVisas: pickFirstDefinedValue(
          source,
          ['employeeVisas', 'employee_visas', 'employeeVisa', 'employee_visa'],
          0,
        ),
        dependencyVisas: pickFirstDefinedValue(
          source,
          ['dependencyVisas', 'dependency_visas', 'dependencyVisa', 'dependency_visa'],
          0,
        ),
        totalVisas: pickFirstDefinedValue(source, ['totalVisas', 'total_visas'], ''),
        investorVisaNeeded: normalizeString(
          pickFirstDefinedValue(source, ['investorVisaNeeded', 'investor_visa_needed'], ''),
        ),
        employeeVisaNeeded: normalizeString(
          pickFirstDefinedValue(source, ['employeeVisaNeeded', 'employee_visa_needed'], ''),
        ),
        businessBankAccount: normalizeString(
          pickFirstDefinedValue(source, ['businessBankAccount', 'business_bank_account'], ''),
        ),
        vipMedicalEid: normalizeString(
          pickFirstDefinedValue(source, ['vipMedicalEid', 'vip_medical_eid'], ''),
        ),
        selectedAddons: normalizeString(
          pickFirstDefinedValue(source, ['selectedAddons', 'selected_addons', 'addons'], ''),
        ),
        selectedAddonsCount: pickFirstDefinedValue(
          source,
          ['selectedAddonsCount', 'selected_addons_count'],
          0,
        ),
        selectedAddonsDetails: normalizeString(
          pickFirstDefinedValue(source, ['selectedAddonsDetails', 'selected_addons_details'], ''),
        ),
        applicantsInsideUae: pickFirstDefinedValue(
          source,
          ['applicantsInsideUae', 'applicants_inside_uae', 'changeStatusInsideUAE', 'change_status_inside_uae'],
          0,
        ),
        applicantsOutsideUae: pickFirstDefinedValue(
          source,
          ['applicantsOutsideUae', 'applicants_outside_uae', 'changeStatusOutsideUAE', 'change_status_outside_uae'],
          0,
        ),
        totalCost: pickFirstDefinedValue(source, ['totalCost', 'total_cost'], 0),
        licenseCost: pickFirstDefinedValue(source, ['licenseCost', 'license_cost'], 0),
        visaCost: pickFirstDefinedValue(source, ['visaCost', 'visa_cost'], 0),
        addonsCost: pickFirstDefinedValue(source, ['addonsCost', 'addons_cost'], 0),
        businessActivitiesCost: pickFirstDefinedValue(
          source,
          ['businessActivitiesCost', 'business_activities_cost'],
          0,
        ),
        changeStatusCost: pickFirstDefinedValue(
          source,
          ['changeStatusCost', 'change_status_cost'],
          0,
        ),
        knowledgeFee: pickFirstDefinedValue(source, ['knowledgeFee', 'knowledge_fee'], 0),
        officeCost: pickFirstDefinedValue(source, ['officeCost', 'office_cost'], 0),
        costBreakdown: normalizeString(
          pickFirstDefinedValue(source, ['costBreakdown', 'cost_breakdown'], ''),
        ),
        licenseBaseCostPerYear: pickFirstDefinedValue(
          source,
          ['licenseBaseCostPerYear', 'license_base_cost_per_year'],
          0,
        ),
        licenseDurationYears: pickFirstDefinedValue(
          source,
          ['licenseDurationYears', 'license_duration_years'],
          0,
        ),
        licenseDiscountPercentage: pickFirstDefinedValue(
          source,
          ['licenseDiscountPercentage', 'license_discount_percentage'],
          0,
        ),
        additionalShareholdersCount: pickFirstDefinedValue(
          source,
          ['additionalShareholdersCount', 'additional_shareholders_count'],
          0,
        ),
        additionalShareholdersCost: pickFirstDefinedValue(
          source,
          ['additionalShareholdersCost', 'additional_shareholders_cost'],
          0,
        ),
        shareableLink: normalizeString(
          pickFirstDefinedValue(source, ['shareableLink', 'shareable_link'], ''),
        ),
        configurationId: normalizeString(
          pickFirstDefinedValue(source, ['configurationId', 'configuration_id'], ''),
        ),
        lastViewedTimestamp: normalizeString(
          pickFirstDefinedValue(source, ['lastViewedTimestamp', 'last_viewed_timestamp'], ''),
        ),
        clientName: normalizeString(pickFirstDefinedValue(source, ['clientName', 'client_name'], '')),
        clientEmail: normalizeString(pickFirstDefinedValue(source, ['clientEmail', 'client_email'], '')),
        clientPhone: normalizeString(pickFirstDefinedValue(source, ['clientPhone', 'client_phone'], '')),
        clientId: normalizeString(pickFirstDefinedValue(source, ['clientId', 'client_id'], '')),
        salespersonName: normalizeString(
          pickFirstDefinedValue(source, ['salespersonName', 'salesperson_name'], ''),
        ),
        salespersonEmail: normalizeString(
          pickFirstDefinedValue(source, ['salespersonEmail', 'salesperson_email'], ''),
        ),
        salespersonPhone: normalizeString(
          pickFirstDefinedValue(source, ['salespersonPhone', 'salesperson_phone'], ''),
        ),
        orderId: normalizeString(pickFirstDefinedValue(source, ['orderId', 'order_id'], '')),
        trackingId: normalizeString(pickFirstDefinedValue(source, ['trackingId', 'tracking_id'], '')),
        paymentInitiated: normalizeString(
          pickFirstDefinedValue(source, ['paymentInitiated', 'payment_initiated'], ''),
        ),
        paymentType: normalizeString(
          pickFirstDefinedValue(source, ['paymentType', 'payment_type'], ''),
        ),
        paymentAmount: pickFirstDefinedValue(source, ['paymentAmount', 'payment_amount'], ''),
        paymentStatus: normalizeString(
          pickFirstDefinedValue(source, ['paymentStatus', 'payment_status'], ''),
        ),
        paymentMode: normalizeString(
          pickFirstDefinedValue(source, ['paymentMode', 'payment_mode'], ''),
        ),
        transDate: normalizeString(pickFirstDefinedValue(source, ['transDate', 'trans_date'], '')),
        bankRefNo: normalizeString(pickFirstDefinedValue(source, ['bankRefNo', 'bank_ref_no'], '')),
        failureMessage: normalizeString(
          pickFirstDefinedValue(source, ['failureMessage', 'failure_message'], ''),
        ),
        statusMessage: normalizeString(
          pickFirstDefinedValue(source, ['statusMessage', 'status_message'], ''),
        ),
        cardName: normalizeString(pickFirstDefinedValue(source, ['cardName', 'card_name'], '')),
        currency: normalizeString(
          pickFirstDefinedValue(source, 'currency', PAYMENT_CONFIG.currency),
        ),
        responseCode: normalizeString(
          pickFirstDefinedValue(source, ['responseCode', 'response_code'], ''),
        ),
        billingName: normalizeString(
          pickFirstDefinedValue(source, ['billingName', 'billing_name'], ''),
        ),
        billingEmail: normalizeString(
          pickFirstDefinedValue(source, ['billingEmail', 'billing_email'], ''),
        ),
        billingTel: normalizeString(
          pickFirstDefinedValue(source, ['billingTel', 'billing_tel'], ''),
        ),
        scheduledDate: normalizeString(
          pickFirstDefinedValue(source, ['scheduledDate', 'scheduled_date'], ''),
        ),
        scheduledTime: normalizeString(
          pickFirstDefinedValue(source, ['scheduledTime', 'scheduled_time'], ''),
        ),
        scheduledDateTimeIso: normalizeString(
          pickFirstDefinedValue(source, ['scheduledDateTimeIso', 'scheduledDateTimeISO', 'scheduled_date_time_iso'], ''),
        ),
        scheduledTimezone: normalizeString(
          pickFirstDefinedValue(source, ['scheduledTimezone', 'timezone'], ''),
        ),
        utmSource: normalizeString(pickFirstDefinedValue(source, ['utmSource', 'utm_source'], '')),
        utmMedium: normalizeString(pickFirstDefinedValue(source, ['utmMedium', 'utm_medium'], '')),
        utmCampaign: normalizeString(
          pickFirstDefinedValue(source, ['utmCampaign', 'utm_campaign'], ''),
        ),
        utmTerm: normalizeString(pickFirstDefinedValue(source, ['utmTerm', 'utm_term'], '')),
        utmContent: normalizeString(
          pickFirstDefinedValue(source, ['utmContent', 'utm_content'], ''),
        ),
        pageUrl: normalizeString(
          pickFirstDefinedValue(source, ['pageUrl', 'page_url', 'currentUrl', 'current_url'], ''),
        ),
        pageReferrer: normalizeString(
          pickFirstDefinedValue(source, ['pageReferrer', 'page_referrer'], ''),
        ),
        browserInfo: normalizeString(
          pickFirstDefinedValue(source, ['browserInfo', 'browser_info'], ''),
        ),
        screenResolution: normalizeString(
          pickFirstDefinedValue(source, ['screenResolution', 'screen_resolution'], ''),
        ),
        userIp: normalizeString(pickFirstDefinedValue(source, ['userIp', 'user_ip'], '')),
        userCountry: normalizeString(
          pickFirstDefinedValue(source, ['userCountry', 'user_country'], ''),
        ),
        userCountryName: normalizeString(
          pickFirstDefinedValue(source, ['userCountryName', 'user_country_name'], ''),
        ),
        userCity: normalizeString(pickFirstDefinedValue(source, ['userCity', 'user_city'], '')),
        userRegion: normalizeString(pickFirstDefinedValue(source, ['userRegion', 'user_region'], '')),
        userTimezone: normalizeString(
          pickFirstDefinedValue(source, ['userTimezone', 'user_timezone'], ''),
        ),
        sectionsInteracted: normalizeString(
          pickFirstDefinedValue(source, ['sectionsInteracted', 'sections_interacted'], ''),
        ),
        submissionTimestamp: normalizeString(
          pickFirstDefinedValue(
            source,
            ['submissionTimestamp', 'submission_timestamp', 'submissionTime', 'submission_time'],
            new Date().toISOString(),
          ),
        ),
        invoiceCurrency: normalizeString(
          pickFirstDefinedValue(source, ['invoiceCurrency', 'invoice_currency'], PAYMENT_CONFIG.currency),
        ),
        invoiceCurrencySymbol: normalizeString(
          pickFirstDefinedValue(source, ['invoiceCurrencySymbol', 'invoice_currency_symbol'], ''),
        ),
        calculationVersion: normalizeString(
          pickFirstDefinedValue(source, ['calculationVersion', 'calculation_version'], ''),
        ),
      };

      if (!unifiedPayload.orderId) {
        unifiedPayload.orderId = generateOrderId();
      }

      if (!unifiedPayload.trackingId) {
        unifiedPayload.trackingId = '';
      }

      if (!unifiedPayload.countryOfResidence && unifiedPayload.userCountryName) {
        unifiedPayload.countryOfResidence = unifiedPayload.userCountryName;
      }

      return unifiedPayload;
    }

    function buildPaymentLifecyclePayload(input) {
      var nextInput = input || {};
      var contact = nextInput.contact || {};
      var calculator = nextInput.calculator || {};
      var payment = nextInput.payment || {};
      var metadata = nextInput.metadata || {};
      var form = nextInput.form || {};
      var actionType = normalizeString(nextInput.actionType);

      return createUnifiedSubmissionPayload({
        actionType: formatActionType(actionType),
        leadStatus: nextInput.leadStatus || 'complete',
        incompleteReason: nextInput.reason,
        formId: form.formId,
        formName: form.formName,
        fullName: contact.fullName || contact.name,
        email: contact.email,
        phone: contact.phone,
        countryOfResidence: contact.country,
        consent: contact.consent,
        officeSpace: calculator.officeSpace || PAYMENT_CONFIG.defaultOfficeSpace,
        licenseType: calculator.licenseType,
        shareholdersCount: calculator.shareholders,
        selectedActivities: calculator.selectedActivities,
        investorVisas: calculator.investorVisa,
        employeeVisas: calculator.employeeVisa,
        businessBankAccount: calculator.businessBankAccount,
        vipMedicalEid: calculator.vipMedicalEid,
        totalCost: calculator.totalCost,
        licenseCost: calculator.licenseCost,
        businessActivitiesCost: calculator.businessActivitiesCost,
        licenseDuration: calculator.licenseDuration,
        visaCost: calculator.visaCost,
        knowledgeFee: calculator.knowledgeFee,
        investorVisaNeeded: calculator.investorVisaNeeded,
        employeeVisaNeeded: calculator.employeeVisaNeeded,
        applicantsInsideUae: calculator.changeStatusInsideUAE,
        applicantsOutsideUae: calculator.changeStatusOutsideUAE,
        changeStatusCost: calculator.changeStatusCost,
        selectedAddons: calculator.addons,
        addonsCost: calculator.addonsCost,
        orderId: payment.orderId,
        trackingId: payment.trackingId,
        paymentInitiated: payment.paymentInitiated,
        formStatus: payment.formStatus,
        paymentType: payment.paymentType,
        paymentAmount: payment.paymentAmount,
        paymentStatus: actionType !== 'payment_initiated' ? payment.paymentStatus : '',
        paymentMode: actionType !== 'payment_initiated' ? payment.paymentMode : '',
        transDate: actionType !== 'payment_initiated' ? payment.transDate : '',
        bankRefNo: actionType !== 'payment_initiated' ? payment.bankRefNo : '',
        failureMessage: actionType !== 'payment_initiated' ? payment.failureMessage : '',
        statusMessage: actionType !== 'payment_initiated' ? payment.statusMessage : '',
        cardName: actionType !== 'payment_initiated' ? payment.cardName : '',
        currency:
          actionType !== 'payment_initiated'
            ? payment.currency || PAYMENT_CONFIG.currency
            : PAYMENT_CONFIG.currency,
        responseCode: actionType !== 'payment_initiated' ? payment.responseCode : '',
        billingName: actionType !== 'payment_initiated' ? payment.billingName : '',
        billingEmail: actionType !== 'payment_initiated' ? payment.billingEmail : '',
        billingTel: actionType !== 'payment_initiated' ? payment.billingTel : '',
        scheduledDate: nextInput.scheduledDate,
        scheduledTime: nextInput.scheduledTime,
        scheduledDateTimeIso: nextInput.scheduledDateTimeISO,
        scheduledTimezone: nextInput.timezone,
        utmSource: metadata.utm_source,
        utmMedium: metadata.utm_medium,
        utmCampaign: metadata.utm_campaign,
        utmTerm: metadata.utm_term,
        utmContent: metadata.utm_content,
        pageUrl: metadata.page_url,
        pageReferrer: metadata.page_referrer,
        browserInfo: metadata.browser_info,
        screenResolution: metadata.screen_resolution,
        submissionTimestamp: metadata.submission_time,
      });
    }

    function parsePaymentCallbackParams(input, options) {
      var nextOptions = options || {};
      var searchParams;

      if (input instanceof URLSearchParams) {
        searchParams = input;
      } else if (typeof input === 'string') {
        if (input.indexOf('://') >= 0) {
          try {
            searchParams = new URL(input).searchParams;
          } catch (_error) {
            searchParams = new URLSearchParams(input);
          }
        } else {
          searchParams = new URLSearchParams(input);
        }
      } else if (input && typeof input.search === 'string') {
        searchParams = new URLSearchParams(input.search);
      } else {
        searchParams = new URLSearchParams('');
      }

      var rawStatus = searchParams.get('payment_status');
      var status = normalizePaymentStatus(rawStatus);
      if (!status) {
        return {
          hasPaymentStatus: false,
          status: '',
          actionType: '',
          formStatus: '',
          orderId: '',
          amount: '',
          trackingId: '',
          paymentMode: '',
          transDate: '',
          bankRefNo: '',
          failureMessage: '',
          statusMessage: '',
          cardName: '',
          currency: PAYMENT_CONFIG.currency,
          billingName: '',
          billingEmail: '',
          billingTel: '',
          responseCode: '',
          dedupeKey: '',
          raw: {},
        };
      }

      var actionType = mapPaymentStatusToAction(status);
      var formStatus =
        actionType === 'payment_success'
          ? 'payment_success'
          : actionType === 'payment_cancelled'
            ? 'payment_cancelled'
            : 'payment_failed';
      var orderId = normalizeString(searchParams.get('order_id'));
      var amount = normalizeString(searchParams.get('amount')) || '0';
      var trackingId = normalizeString(searchParams.get('tracking_id'));
      var paymentMode = normalizeString(searchParams.get('payment_mode'));
      var transDate =
        normalizeString(searchParams.get('trans_date')) ||
        normalizeString(nextOptions.nowString) ||
        new Date().toLocaleString();
      var responseCode = normalizeString(searchParams.get('response_code'));

      return {
        hasPaymentStatus: true,
        status: status,
        actionType: actionType,
        formStatus: formStatus,
        orderId: orderId,
        amount: amount,
        trackingId: trackingId,
        paymentMode: paymentMode,
        transDate: transDate,
        bankRefNo: normalizeString(searchParams.get('bank_ref_no')),
        failureMessage: normalizeString(searchParams.get('failure_message')),
        statusMessage: normalizeString(searchParams.get('status_message')),
        cardName: normalizeString(searchParams.get('card_name')),
        currency: normalizeString(searchParams.get('currency')) || PAYMENT_CONFIG.currency,
        billingName: normalizeString(searchParams.get('billing_name')),
        billingEmail: normalizeString(searchParams.get('billing_email')),
        billingTel: normalizeString(searchParams.get('billing_tel')),
        responseCode: responseCode,
        dedupeKey: [orderId, status, trackingId, responseCode].join('::'),
        raw: Object.fromEntries(searchParams.entries()),
      };
    }

    return {
      PAYMENT_CONFIG: PAYMENT_CONFIG,
      stripPhoneDigits: stripPhoneDigits,
      splitFullName: splitFullName,
      validateNameValue: validateNameValue,
      validateEmailValue: validateEmailValue,
      validatePhoneValue: validatePhoneValue,
      validateContactState: validateContactState,
      validatePaymentState: validatePaymentState,
      evaluatePaymentStepGuard: evaluatePaymentStepGuard,
      formatActionType: formatActionType,
      normalizePaymentStatus: normalizePaymentStatus,
      mapPaymentStatusToAction: mapPaymentStatusToAction,
      createSetupFeeSummary: createSetupFeeSummary,
      generateOrderId: generateOrderId,
      buildSecurePaymentRequest: buildSecurePaymentRequest,
      buildPaymentSessionData: buildPaymentSessionData,
      createUnifiedSubmissionPayload: createUnifiedSubmissionPayload,
      buildPaymentLifecyclePayload: buildPaymentLifecyclePayload,
      parsePaymentCallbackParams: parsePaymentCallbackParams,
    };
  },
);
