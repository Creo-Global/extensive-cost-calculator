/**
 * CostCalculator — lead dataLayer push (GTM / CustomerLabs)
 * ------------------------------------------------------------------
 * Pushes ONE GTM dataLayer event — "cost_calculator_lead" — with all contact +
 * configuration data the moment the user completes the first contact-details
 * step (Continue / Calculate pressed -> next step revealed). The CustomerLabs
 * team maps this single event in GTM (CL - Lead / CL - Create User tags).
 *
 * Why a dedicated push: the calculator intercepts the native form submit (it
 * posts to a webhook, not a Webflow form), so the site-wide Webflow -> dataLayer
 * listener never fires for this form. This fills that gap with one clean event.
 *
 * Guarantees:
 *   • Fires exactly ONCE per unique contact (Calculate can re-fire) — no double
 *     leads.
 *   • Purely additive / defensive: it only listens to the calculator's existing
 *     `contactFormValid` event and reads public state. It never patches, blocks,
 *     or alters any form behaviour, and every path is wrapped in try/catch.
 *
 * To move the trigger to the final webhook submission instead of step 1, see the
 * note on the `contactFormValid` listener at the bottom.
 */
(function () {
  'use strict';

  var LEAD_EVENT = 'cost_calculator_lead';
  var leadPushedKey = '';

  /* ---- state readers (all read-only, all guarded) ------------------- */
  function cfg() {
    try {
      if (typeof window.collectFormConfiguration === 'function') {
        return window.collectFormConfiguration() || null;
      }
    } catch (e) {}
    return null;
  }

  function countryValue() {
    try {
      var root = document.getElementById('MFZ-NewCostCalForm') || document;
      var sel = root.querySelector('[id="Country-of-Residence"], select[name="Country-of-Residence"]')
             || document.querySelector('[id="Country-of-Residence"], select[name="Country-of-Residence"]');
      if (!sel) return '';
      var opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      var label = String(opt && opt.textContent ? opt.textContent : (sel.value || '')).trim();
      if (/select|choose|country of residence/i.test(label) && !sel.value) return '';
      return label;
    } catch (e) { return ''; }
  }

  function grandTotal() {
    try {
      var el = document.getElementById('total-cost-display')
            || document.getElementById('grand-total-clickable')
            || document.querySelector('.grand-total');
      if (!el) return 0;
      var n = parseFloat(String(el.textContent || '').replace(/[^\d.]/g, ''));
      return isFinite(n) ? n : 0;
    } catch (e) { return 0; }
  }

  function activityCodes(c) {
    try {
      var list = (c && c.activities && c.activities.selectedActivities) || [];
      return list.map(function (a) { return a && (a.Code || a.code || a.name); }).filter(Boolean);
    } catch (e) { return []; }
  }

  /* ---- the single GTM dataLayer push -------------------------------- */
  // Plain values (NOT a typed { t, v } shape) — this is what GTM variables read.
  function pushLeadToDataLayer(contact) {
    try {
      window.dataLayer = window.dataLayer || [];
      var c = cfg() || {};
      var lic = c.license || {}, visa = c.visa || {}, act = c.activities || {}, cs = c.changeStatus || {};
      var addons = c.addons || [];
      var codes = activityCodes(c);
      var totalVisas = (Number(visa.investorVisas) || 0) + (Number(visa.employeeVisas) || 0) + (Number(visa.dependencyVisas) || 0);
      var consentEl = document.getElementById('consent-checkbox');

      window.dataLayer.push({
        event: LEAD_EVENT,
        lead_step: 'contact_details',
        form: {
          formId: 'MFZ-NewCostCalForm',
          formName: 'Cost Calculator',
          formPage: 'cost-calculator'
        },
        fields: {
          full_name: contact.name,
          first_name: contact.first,
          last_name: contact.last,
          email: contact.email,
          phone: contact.phone,
          country: contact.country,
          consent: !!(consentEl && consentEl.checked),
          license_type: lic.licenseType || '',
          license_duration_years: Number(lic.licenseDuration) || 0,
          shareholders: Number(lic.shareholdersCount) || 0,
          investor_visas: Number(visa.investorVisas) || 0,
          employee_visas: Number(visa.employeeVisas) || 0,
          dependency_visas: Number(visa.dependencyVisas) || 0,
          total_visas: totalVisas,
          business_activities: codes.join(', '),
          business_activities_count: Number(act.selectedActivitiesCount) || 0,
          addons: addons.join(', '),
          addons_count: addons.length,
          applicants_inside_uae: Number(cs.applicantsInsideUAE) || 0,
          applicants_outside_uae: Number(cs.applicantsOutsideUAE) || 0,
          total_cost_aed: grandTotal()
        },
        page: { url: location.href, path: location.pathname, title: document.title }
      });
    } catch (e) { /* never break the page */ }
  }

  /* ---- trigger: contact step completed (Continue -> next step) ------- */
  function onContactValid(detail) {
    var name = ((detail && detail.name) || (document.getElementById('full-name') || {}).value || '').toString().trim();
    var email = ((detail && detail.email) || (document.getElementById('email') || {}).value || '').toString().trim();
    var phone = ((detail && detail.phone) || (document.getElementById('phone') || {}).value || '').toString().trim();
    var country = countryValue();

    if (!email && !phone) return;
    // de-dupe: one lead per unique contact (Calculate can re-fire on re-clicks)
    var key = (email || phone).toLowerCase();
    if (key === leadPushedKey) return;
    leadPushedKey = key;

    var parts = name ? name.split(/\s+/) : [];
    var first = parts.shift() || '';
    var last = parts.join(' ');

    pushLeadToDataLayer({ name: name, first: first, last: last, email: email, phone: phone, country: country });
  }

  function wire() {
    // The calculator dispatches `contactFormValid` on `document` when the contact
    // gate is passed (Continue/Calculate clicked, valid) and the next step opens.
    //
    // To fire on the FINAL webhook submission instead of step 1, replace the
    // listener below with one for the 'form_submit_success' dataLayer event, e.g.:
    //   (window.dataLayer = window.dataLayer || []);  // observe existing pushes
    // and call pushLeadToDataLayer there. (Step 1 is the earliest lead capture.)
    document.addEventListener('contactFormValid', function (e) {
      try { onContactValid(e && e.detail); } catch (err) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { try { wire(); } catch (e) {} });
  } else {
    try { wire(); } catch (e) {}
  }

  // Optional manual hook / debug surface.
  window.CLCalcLead = { push: pushLeadToDataLayer, event: LEAD_EVENT };
})();
