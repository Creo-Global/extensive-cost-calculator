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

    function createSetupFeeSummary() {
      return {
        licenseFee: PAYMENT_CONFIG.licenseAmount,
        innovationFee: PAYMENT_CONFIG.innovationFee,
        knowledgeFee: PAYMENT_CONFIG.knowledgeFee,
        total: PAYMENT_CONFIG.setupFeeAmount,
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
        name: normalizeString(nextInput.name),
        email: normalizeString(nextInput.email),
        phone: normalizeString(nextInput.phone),
        country: normalizeString(nextInput.country),
        order_id: normalizeString(nextInput.orderId),
        payment_amount: Number(nextInput.paymentAmount || 0),
        payment_type: normalizeString(nextInput.paymentType || PAYMENT_CONFIG.paymentType),
        tracking_id: normalizeString(nextInput.trackingId),
        timestamp: normalizeString(nextInput.timestamp || new Date().toISOString()),
      };
    }

    function buildPaymentLifecyclePayload(input) {
      var nextInput = input || {};
      var contact = nextInput.contact || {};
      var calculator = nextInput.calculator || {};
      var payment = nextInput.payment || {};
      var metadata = nextInput.metadata || {};
      var form = nextInput.form || {};
      var name = normalizeString(contact.name);
      var splitName = splitFullName(name);
      var actionType = normalizeString(nextInput.actionType);

      var payload = {
        name: name,
        First_Name: splitName.firstName,
        Last_Name: splitName.lastName,
        email: normalizeString(contact.email),
        phone: normalizeString(contact.phone),
        country: normalizeString(contact.country),
        consent: normalizeString(contact.consent),
        officeSpace: normalizeString(calculator.officeSpace || PAYMENT_CONFIG.defaultOfficeSpace),
        shareholders: normalizeString(calculator.shareholders),
        selectedActivities: normalizeString(calculator.selectedActivities),
        investorVisa: calculator.investorVisa !== undefined ? calculator.investorVisa : '',
        employeeVisa: calculator.employeeVisa !== undefined ? calculator.employeeVisa : '',
        businessBankAccount: normalizeString(calculator.businessBankAccount),
        vipMedicalEid: normalizeString(calculator.vipMedicalEid),
        totalCost: calculator.totalCost !== undefined ? calculator.totalCost : '',
        licenseCost: calculator.licenseCost !== undefined ? calculator.licenseCost : '',
        businessActivitiesCost:
          calculator.businessActivitiesCost !== undefined ? calculator.businessActivitiesCost : '',
        actionType: formatActionType(actionType),
        lead_status: normalizeString(nextInput.leadStatus || 'complete'),
        incomplete_reason: normalizeString(nextInput.reason),
        form_id: normalizeString(form.formId),
        form_name: normalizeString(form.formName),
        order_id: normalizeString(payment.orderId),
        license_duration: normalizeString(calculator.licenseDuration),
        visa_cost: calculator.visaCost !== undefined ? calculator.visaCost : '',
        knowledge_fee: calculator.knowledgeFee !== undefined ? calculator.knowledgeFee : '',
        investor_visa_needed: normalizeString(calculator.investorVisaNeeded),
        employee_visa_needed: normalizeString(calculator.employeeVisaNeeded),
        change_status_inside_uae:
          calculator.changeStatusInsideUAE !== undefined ? calculator.changeStatusInsideUAE : '',
        change_status_outside_uae:
          calculator.changeStatusOutsideUAE !== undefined ? calculator.changeStatusOutsideUAE : '',
        change_status_cost:
          calculator.changeStatusCost !== undefined ? calculator.changeStatusCost : '',
        addons: normalizeString(calculator.addons),
        addons_cost: calculator.addonsCost !== undefined ? calculator.addonsCost : '',
        powered_by: normalizeString(nextInput.poweredBy || 'Webflow'),
        payment_initiated: normalizeString(payment.paymentInitiated),
        form_status: normalizeString(payment.formStatus),
        payment_type: normalizeString(payment.paymentType),
        payment_amount: payment.paymentAmount !== undefined ? payment.paymentAmount : '',
        scheduledDate: normalizeString(nextInput.scheduledDate),
        scheduledTime: normalizeString(nextInput.scheduledTime),
        scheduledDateTimeISO: normalizeString(nextInput.scheduledDateTimeISO),
        timezone: normalizeString(nextInput.timezone),
        utm_source: normalizeString(metadata.utm_source),
        utm_medium: normalizeString(metadata.utm_medium),
        utm_campaign: normalizeString(metadata.utm_campaign),
        utm_term: normalizeString(metadata.utm_term),
        utm_content: normalizeString(metadata.utm_content),
        page_url: normalizeString(metadata.page_url),
        page_referrer: normalizeString(metadata.page_referrer),
        browser_info: normalizeString(metadata.browser_info),
        screen_resolution: normalizeString(metadata.screen_resolution),
        submission_time: normalizeString(metadata.submission_time),
      };

      if (actionType !== 'payment_initiated') {
        payload.tracking_id = normalizeString(payment.trackingId);
        payload.payment_status = normalizeString(payment.paymentStatus);
        payload.payment_mode = normalizeString(payment.paymentMode);
        payload.trans_date = normalizeString(payment.transDate);
        payload.bank_ref_no = normalizeString(payment.bankRefNo);
        payload.failure_message = normalizeString(payment.failureMessage);
        payload.status_message = normalizeString(payment.statusMessage);
        payload.card_name = normalizeString(payment.cardName);
        payload.currency = normalizeString(payment.currency || PAYMENT_CONFIG.currency);
        payload.response_code = normalizeString(payment.responseCode);
        payload.billing_name = normalizeString(payment.billingName);
        payload.billing_email = normalizeString(payment.billingEmail);
        payload.billing_tel = normalizeString(payment.billingTel);
      }

      return payload;
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
      var orderId = normalizeString(searchParams.get('order_id')) || 'N/A';
      var amount = normalizeString(searchParams.get('amount')) || '0';
      var trackingId = normalizeString(searchParams.get('tracking_id')) || 'N/A';
      var paymentMode = normalizeString(searchParams.get('payment_mode')) || 'N/A';
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
      buildPaymentLifecyclePayload: buildPaymentLifecyclePayload,
      parsePaymentCallbackParams: parsePaymentCallbackParams,
    };
  },
);
