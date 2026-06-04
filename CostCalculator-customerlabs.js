/**
 * CostCalculator — lead dataLayer push (GTM / CustomerLabs)
 * ------------------------------------------------------------------
 * Pushes ONE "cost_calculator_lead" GTM dataLayer event at the moment the
 * calculator submits the lead to the Zoho Flow webhook — i.e. when the existing
 * "form_submit_success" dataLayer event fires (CostCalculator.js pushes that
 * right after submitToWebhook()). It is NOT fired on step 1.
 *
 * The CustomerLabs team maps this single event in GTM (CL - Lead /
 * CL - Create User tags) on Custom Event = cost_calculator_lead.
 *
 * Defensive: it only wraps window.dataLayer.push to OBSERVE the existing
 * form_submit_success event, then reads public state to build the lead. It never
 * patches, blocks, or alters any form behaviour; the wrapper always calls the
 * original push and returns its result, and every path is wrapped in try/catch.
 * De-duped per submission (order_id) so the same lead is never counted twice.
 */
(function () {
  'use strict';

  var LEAD_EVENT = 'cost_calculator_lead';
  var TRIGGER_EVENT = 'form_submit_success'; // webhook-submit signal from CostCalculator.js
  var seen = {};

  /* ---- state readers (read-only, guarded) --------------------------- */
  function cfg() {
    try {
      if (typeof window.collectFormConfiguration === 'function') {
        return window.collectFormConfiguration() || null;
      }
    } catch (e) {}
    return null;
  }

  function countryName() {
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
  function pushLead(contact) {
    try {
      window.dataLayer = window.dataLayer || [];
      var c = cfg() || {};
      var lic = c.license || {}, visa = c.visa || {}, act = c.activities || {}, cs = c.changeStatus || {};
      var addons = c.addons || [];
      var codes = activityCodes(c);
      var totalVisas = (Number(visa.investorVisas) || 0) + (Number(visa.employeeVisas) || 0) + (Number(visa.dependencyVisas) || 0);
      var name = String(contact.name || '').trim();
      var parts = name ? name.split(/\s+/) : [];
      var first = parts.shift() || '';
      var last = parts.join(' ');
      var consentEl = document.getElementById('consent-checkbox');

      window.dataLayer.push({
        event: LEAD_EVENT,
        lead_step: 'contact_details',
        form: { formId: 'MFZ-NewCostCalForm', formName: 'Cost Calculator', formPage: 'cost-calculator' },
        fields: {
          full_name: name,
          first_name: first,
          last_name: last,
          email: contact.email || '',
          phone: contact.phone || '',
          country: contact.country || '',
          consent: consentEl ? !!consentEl.checked : true,
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

  /* ---- trigger: the webhook-submit (form_submit_success) ------------- */
  function onSubmitSuccess(obj) {
    try {
      var fd = (obj && obj.form_data) || {};
      var key = fd.order_id || fd.email || 'lead';
      if (seen[key]) return;          // de-dupe per submission
      seen[key] = true;

      // Prefer the submitted form_data for contact (exact), fall back to the DOM.
      var name = String(fd.full_name || (document.getElementById('full-name') || {}).value || '').trim();
      var email = fd.email || (document.getElementById('email') || {}).value || '';
      var phone = fd.phone || (document.getElementById('phone') || {}).value || '';
      var country = fd.user_country_name || fd.user_country || countryName();

      pushLead({ name: name, email: email, phone: phone, country: country });
    } catch (e) {}
  }

  function wire() {
    try {
      window.dataLayer = window.dataLayer || [];
      var dl = window.dataLayer;

      // Safety: handle a form_submit_success already pushed before we wrapped.
      try {
        for (var i = 0; i < dl.length; i++) {
          if (dl[i] && dl[i].event === TRIGGER_EVENT) onSubmitSuccess(dl[i]);
        }
      } catch (e) {}

      // Observe future pushes (standard, non-destructive dataLayer hook).
      var origPush = dl.push;
      dl.push = function () {
        var ret = origPush.apply(dl, arguments);
        try {
          var obj = arguments[0];
          if (obj && obj.event === TRIGGER_EVENT) {
            var captured = obj;
            // defer so GTM processes form_submit_success first, and to avoid re-entrancy
            setTimeout(function () { onSubmitSuccess(captured); }, 0);
          }
        } catch (e) {}
        return ret;
      };
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { try { wire(); } catch (e) {} });
  } else {
    try { wire(); } catch (e) {}
  }

  // Optional manual hook / debug surface.
  window.CLCalcLead = { event: LEAD_EVENT, push: pushLead };
})();
