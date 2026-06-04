/**
 * CostCalculator — lead dataLayer push (GTM / CustomerLabs)
 * ------------------------------------------------------------------
 * Pushes ONE GTM dataLayer event — "form_submit_success" — with all contact +
 * configuration data the moment the user completes the first contact-details
 * step (Continue / Calculate pressed -> next step revealed). The CustomerLabs
 * team maps this event in GTM (CL - Lead / CL - Create User tags).
 *
 * Event name + payload deliberately MATCH the existing form_submit_success that
 * CostCalculator.js already pushes on the final webhook submit, so the same GTM
 * variables/mapping work for both. The two are distinguished by form_data.form_status:
 *   • this step-1 lead .......... form_status: "lead"
 *   • existing final submit ..... form_status: "complete"
 * => to capture the lead on step 1 only, condition the CL trigger on
 *    form_data.form_status == "lead" (otherwise it fires on both points).
 *
 * Why a dedicated push: the calculator intercepts the native form submit (it
 * posts to a webhook, not a Webflow form), so the site-wide Webflow -> dataLayer
 * listener never fires for this form. This fills that gap with one clean event.
 *
 * Guarantees:
 *   • Fires exactly ONCE per unique contact (Calculate can re-fire) — no double
 *     leads from this script.
 *   • Purely additive / defensive: it only listens to the calculator's existing
 *     `contactFormValid` event and reads public state. It never patches, blocks,
 *     or alters any form behaviour, and every path is wrapped in try/catch.
 */
(function () {
  'use strict';

  var LEAD_EVENT = 'form_submit_success';
  var LEAD_STATUS = 'lead';
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

  function countrySelect() {
    try {
      var root = document.getElementById('MFZ-NewCostCalForm') || document;
      return root.querySelector('[id="Country-of-Residence"], select[name="Country-of-Residence"]')
          || document.querySelector('[id="Country-of-Residence"], select[name="Country-of-Residence"]');
    } catch (e) { return null; }
  }

  function countryName() {
    try {
      var sel = countrySelect();
      if (!sel) return '';
      var opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
      var label = String(opt && opt.textContent ? opt.textContent : (sel.value || '')).trim();
      if (/select|choose|country of residence/i.test(label) && !sel.value) return '';
      return label;
    } catch (e) { return ''; }
  }

  function countryCode() {
    try {
      var sel = countrySelect();
      return sel && sel.value ? String(sel.value).toLowerCase() : '';
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

  function num(v) { var n = Number(v); return isFinite(n) ? n : ''; }
  function urlParam(name) {
    try { return new URLSearchParams(location.search).get(name) || ''; } catch (e) { return ''; }
  }

  /* ---- the single GTM dataLayer push -------------------------------- */
  // Mirrors the existing form_submit_success form_data shape (plain values for
  // GTM variable mapping). Unavailable-at-step-1 fields are left empty.
  function pushLeadToDataLayer(contact) {
    try {
      window.dataLayer = window.dataLayer || [];
      var c = cfg() || {};
      var lic = c.license || {}, visa = c.visa || {}, act = c.activities || {}, cs = c.changeStatus || {};
      var addons = c.addons || [];
      var codes = activityCodes(c);
      var configId = (typeof window.getCurrentConfigId === 'function' && window.getCurrentConfigId()) || '';

      window.dataLayer.push({
        event: LEAD_EVENT,
        form_data: {
          form_status: LEAD_STATUS,            // "lead" (final submit uses "complete")
          full_name: contact.name,
          first_name: contact.first,           // extra — handy for CustomerLabs identify
          last_name: contact.last,             // extra
          order_id: '',
          tracking_id: '',
          phone: contact.phone,
          email: contact.email,
          license_type: lic.licenseType || '',
          license_duration: String(lic.licenseDuration || ''),
          business_activities: codes.join(', '),
          shareholders_range: num(lic.shareholdersCount) || 0,
          investor_visas: num(visa.investorVisas) || 0,
          employee_visas: num(visa.employeeVisas) || 0,
          dependency_visas: num(visa.dependencyVisas) || 0,
          selected_addons: addons.join(', '),
          applicants_inside_uae: num(cs.applicantsInsideUAE) || 0,
          applicants_outside_uae: num(cs.applicantsOutsideUAE) || 0,
          total_cost: grandTotal(),
          license_cost: num(window.baseLicenseCostValue),
          visa_cost: '',
          user_country: countryCode(),
          user_country_name: contact.country,
          user_city: '',
          current_url: location.href,
          cost_breakdown: '',
          configuration_id: configId,
          client_name: urlParam('Client'),
          salesperson_name: urlParam('SalesPerson'),
          lead_step: 'contact_details'
        },
        timestamp: new Date().toISOString(),
        page_title: document.title,
        page_url: location.href
      });
    } catch (e) { /* never break the page */ }
  }

  /* ---- trigger: contact step completed (Continue -> next step) ------- */
  function onContactValid(detail) {
    var name = ((detail && detail.name) || (document.getElementById('full-name') || {}).value || '').toString().trim();
    var email = ((detail && detail.email) || (document.getElementById('email') || {}).value || '').toString().trim();
    var phone = ((detail && detail.phone) || (document.getElementById('phone') || {}).value || '').toString().trim();
    var country = countryName();

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
  window.CLCalcLead = { push: pushLeadToDataLayer, event: LEAD_EVENT, status: LEAD_STATUS };
})();
