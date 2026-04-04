import { describe, expect, it } from 'vitest';
import paymentHelpers from '../../BP-calculator-payment.js';

const {
  PAYMENT_CONFIG,
  buildPaymentLifecyclePayload,
  buildSecurePaymentRequest,
  evaluatePaymentStepGuard,
  parsePaymentCallbackParams,
  validateContactState,
} = paymentHelpers;

describe('Payment Helper Logic', () => {
  it('matches TSX-style contact validation requirements', () => {
    const validation = validateContactState({
      fullName: 'A',
      email: 'bad-email',
      phone: '97150',
      phoneValidationStatus: 'idle',
      phoneValidationMessage: '',
      country: '',
      consentChecked: false,
      countryRequired: true,
      countryVisible: true,
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toMatchObject({
      'full-name': 'Name must be at least 2 characters long',
      email: 'Please enter a valid email address',
      phone: 'Please wait while we validate your phone number',
      country: 'Current country of residence is required',
      consent: 'You must agree to the terms and privacy policy',
    });
  });

  it('maps the secure payment initiate request to the production endpoint contract', () => {
    const request = buildSecurePaymentRequest({
      orderId: '202604040001',
      amount: PAYMENT_CONFIG.setupFeeAmount,
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '+971501234567',
      selectedLicense: 'Setup Fee Only (License + Co-working + Knowledge Fee)',
      businessActivitiesText: 'Consulting, Marketing',
      totalVisasText: 'Investor: 0, Employee: 0 (Total: 0)',
      visaAmount: 0,
      currentUrl: 'https://marketing.meydanfz.ae/business-setup-calculator?foo=bar',
    });

    expect(request).toEqual({
      order_id: '202604040001',
      amount: PAYMENT_CONFIG.setupFeeAmount,
      currency: 'AED',
      language: 'EN',
      billing_name: 'Test User',
      billing_email: 'test@example.com',
      billing_tel: '+971501234567',
      billing_address: 'Dubai',
      billing_city: 'Dubai',
      billing_state: 'Dubai',
      billing_zip: '00000',
      billing_country: 'United Arab Emirates',
      redirect_url:
        `${PAYMENT_CONFIG.callbackUrl}?return_url=` +
        encodeURIComponent('https://marketing.meydanfz.ae/business-setup-calculator'),
      cancel_url:
        `${PAYMENT_CONFIG.callbackUrl}?return_url=` +
        encodeURIComponent('https://marketing.meydanfz.ae/business-setup-calculator'),
      merchant_param2: '0',
      merchant_param3: 'Setup Fee Only (License + Co-working + Knowledge Fee)',
      merchant_param4: 'Consulting, Marketing',
      merchant_param5: 'Investor: 0, Employee: 0 (Total: 0)',
    });
  });

  it('builds lifecycle submission payloads with order and tracking fields', () => {
    const payload = buildPaymentLifecyclePayload({
      actionType: 'payment_success',
      contact: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+971501234567',
        country: 'AE',
        consent: 'Yes',
      },
      calculator: {
        officeSpace: 'Co-working / Flexi Desk',
        shareholders: 2,
        selectedActivities: 'Consulting',
        totalCost: PAYMENT_CONFIG.setupFeeAmount,
        licenseCost: PAYMENT_CONFIG.licenseAmount,
        businessActivitiesCost: 0,
        licenseDuration: '1',
        visaCost: 0,
        knowledgeFee: PAYMENT_CONFIG.knowledgeFee + PAYMENT_CONFIG.innovationFee,
        investorVisaNeeded: 'No',
        employeeVisaNeeded: 'No',
      },
      payment: {
        orderId: '202604040001',
        trackingId: 'TRACK-001',
        paymentStatus: 'Success',
        paymentAmount: PAYMENT_CONFIG.setupFeeAmount,
        paymentMode: 'Credit Card',
        transDate: '2026-04-04 12:00:00',
        bankRefNo: 'BANK-REF',
        failureMessage: '',
        statusMessage: 'Authorized',
        cardName: 'VISA',
        currency: 'AED',
        responseCode: '0',
        billingName: 'Test User',
        billingEmail: 'test@example.com',
        billingTel: '+971501234567',
        paymentType: PAYMENT_CONFIG.paymentType,
        formStatus: 'payment_success',
      },
      form: {
        formId: 'multiStepForm',
        formName: 'BP Calculator',
      },
      metadata: {
        page_url: 'https://marketing.meydanfz.ae/business-setup-calculator',
        page_referrer: 'https://marketing.meydanfz.ae/',
        browser_info: 'MacIntel - en-US',
        screen_resolution: '1440x900',
        submission_time: 'Saturday, April 04, 2026, 12:00:00 PM GST',
      },
      poweredBy: 'Webflow',
    });

    expect(payload).toMatchObject({
      First_Name: 'Test',
      Last_Name: 'User',
      actionType: 'Payment Successful',
      form_id: 'multiStepForm',
      form_name: 'BP Calculator',
      order_id: '202604040001',
      tracking_id: 'TRACK-001',
      payment_status: 'Success',
      payment_mode: 'Credit Card',
      payment_type: 'setup_fee',
      payment_amount: PAYMENT_CONFIG.setupFeeAmount,
      response_code: '0',
      billing_name: 'Test User',
      billing_email: 'test@example.com',
      billing_tel: '+971501234567',
      powered_by: 'Webflow',
    });
  });

  it('parses callback result parameters for success and cancellation flows', () => {
    const success = parsePaymentCallbackParams(
      '?payment_status=Success&order_id=ORD-1&amount=12520&tracking_id=TRK-1&payment_mode=Card&trans_date=2026-04-04T10%3A00%3A00Z&response_code=0',
      { nowString: 'fallback' },
    );
    const cancelled = parsePaymentCallbackParams('?payment_status=Aborted&order_id=ORD-2', {
      nowString: 'fallback',
    });

    expect(success).toMatchObject({
      hasPaymentStatus: true,
      status: 'Success',
      actionType: 'payment_success',
      formStatus: 'payment_success',
      orderId: 'ORD-1',
      amount: '12520',
      trackingId: 'TRK-1',
      paymentMode: 'Card',
      responseCode: '0',
    });

    expect(cancelled).toMatchObject({
      hasPaymentStatus: true,
      status: 'Aborted',
      actionType: 'payment_cancelled',
      formStatus: 'payment_cancelled',
      orderId: 'ORD-2',
      transDate: 'fallback',
    });
  });

  it('blocks payment step access for unsafe states', () => {
    const guard = evaluatePaymentStepGuard({
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '+971501234567',
      phoneValidationStatus: 'valid',
      phoneValidationMessage: '',
      country: 'AE',
      consentChecked: true,
      totalVisas: 7,
      amount: PAYMENT_CONFIG.setupFeeAmount,
      paymentHealth: false,
      paymentHealthMessage: 'Payment is temporarily unavailable. Please try again later.',
    });

    expect(guard.allowed).toBe(false);
    expect(guard.errors.payment).toBe('Payment is temporarily unavailable. Please try again later.');
  });
});
