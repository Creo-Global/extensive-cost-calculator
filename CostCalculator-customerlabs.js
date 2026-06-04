/**
 * CostCalculator — CustomerLabs CDP event tracking
 * ------------------------------------------------------------------
 * Standalone, fully defensive OBSERVER module. It pushes calculator events to
 * the CustomerLabs CDP using the documented JavaScript API:
 *   https://www.customerlabs.com/docs/website-event-tracking/developer-documentation/javascript-api-documentation/
 *
 *   _cl.pageview(name, props)     — page/section views
 *   _cl.trackClick(name, props)   — click / configuration actions
 *   _cl.trackSubmit(name, props)  — form submissions
 *   _cl.identify(props)           — user PII (people)
 *
 * Property shape (per the docs): every value is { t: 'string'|'number'|'Object',
 * v: value } wrapped under "customProperties" (and "user_traits" for identify).
 *
 * DESIGN — this NEVER changes form behaviour:
 *   • It only listens to events the calculator already emits and reads public
 *     state (window.collectFormConfiguration + the DOM). It does not wrap, patch
 *     or call any calculator function, and never calls preventDefault().
 *   • Every hook is wrapped in try/catch; a failure here can never block the form.
 *   • If the CustomerLabs SDK (window._cl) is not installed, every call is a
 *     silent no-op (events are queued briefly, then dropped).
 *
 * REQUIRES: the CustomerLabs base/install snippet on the page (defines window._cl
 * and window.CLabsgbVar). Load this file AFTER CostCalculator.js.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
   * Readiness gate + queue
   * CustomerLabs sets ((window.CLabsgbVar||{}).generalProps||{}).uid once its
   * SDK has initialised (this is the guard the official docs poll for). We
   * queue events until then and flush, giving up quietly after a bounded wait.
   * ------------------------------------------------------------------- */
  var queue = [];
  var POLL_MS = 1000;
  var POLL_MAX = 90; // ~90s, then stop polling

  function clReady() {
    return !!(window._cl && (((window.CLabsgbVar || {}).generalProps || {}).uid));
  }

  function rawSend(method, name, props) {
    try {
      if (!window._cl || typeof window._cl[method] !== 'function') return;
      if (name == null) {
        window._cl[method](props);
      } else {
        window._cl[method](name, props);
      }
    } catch (e) { /* never break the page */ }
  }

  function flush() {
    while (queue.length) {
      var j = queue.shift();
      rawSend(j.method, j.name, j.props);
    }
  }

  function emit(method, name, props) {
    try {
      if (clReady()) { rawSend(method, name, props); return; }
      queue.push({ method: method, name: name, props: props });
    } catch (e) { /* swallow */ }
  }

  (function startPoll() {
    var tries = 0;
    var id = setInterval(function () {
      tries++;
      if (clReady()) { clearInterval(id); try { flush(); } catch (e) {} }
      else if (tries >= POLL_MAX) { clearInterval(id); }
    }, POLL_MS);
  })();

  /* ---------------------------------------------------------------------
   * Property helpers — build the { t, v } typed values the API expects
   * ------------------------------------------------------------------- */
  function S(v) { return { t: 'string', v: v == null ? '' : String(v) }; }
  function N(v) {
    var n = Number(v);
    return { t: 'number', v: String(isFinite(n) ? n : 0) };
  }
  function custom(obj) { return { customProperties: obj }; }
  function assign(target, src) {
    if (!src) return target;
    for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k]; }
    return target;
  }

  /* ---------------------------------------------------------------------
   * State readers (all read-only, all guarded)
   * ------------------------------------------------------------------- */
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
      var label = opt && opt.textContent ? opt.textContent : (sel.value || '');
      label = String(label).trim();
      // ignore placeholder-ish labels
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

  // Rich customProperties bag describing the whole current configuration.
  function configProps(extra) {
    var c = cfg() || {};
    var lic = c.license || {}, visa = c.visa || {}, act = c.activities || {}, cs = c.changeStatus || {};
    var addons = c.addons || [];
    var codes = activityCodes(c);
    var totalVisas = (Number(visa.investorVisas) || 0) + (Number(visa.employeeVisas) || 0) + (Number(visa.dependencyVisas) || 0);

    var props = {
      page_url: S(window.location.href),
      page_title: S(document.title),
      license_type: S(lic.licenseType || ''),
      license_duration_years: N(lic.licenseDuration || 0),
      shareholders: N(lic.shareholdersCount || 0),
      investor_visas: N(visa.investorVisas || 0),
      employee_visas: N(visa.employeeVisas || 0),
      dependency_visas: N(visa.dependencyVisas || 0),
      total_visas: N(totalVisas),
      business_activities_count: N(act.selectedActivitiesCount || 0),
      business_activities: S(codes.join(', ')),
      addons: S(addons.join(', ')),
      addons_count: N(addons.length),
      applicants_inside_uae: N(cs.applicantsInsideUAE || 0),
      applicants_outside_uae: N(cs.applicantsOutsideUAE || 0),
      total_cost_aed: N(grandTotal())
    };
    return custom(assign(props, extra));
  }

  /* =====================================================================
   * 1) Pageview — calculator loaded
   * ===================================================================== */
  function trackPageview() {
    emit('pageview', 'Cost Calculator Viewed', custom({
      page_url: S(window.location.href),
      page_title: S(document.title)
    }));
  }

  /* =====================================================================
   * 2) Contact details submitted — identify (PII) + trackSubmit (lead)
   *    Hooks the calculator's existing `contactFormValid` event.
   * ===================================================================== */
  var lastIdentifiedEmail = '';
  function onContactValid(detail) {
    var name = ((detail && detail.name) || (document.getElementById('full-name') || {}).value || '').toString().trim();
    var email = ((detail && detail.email) || (document.getElementById('email') || {}).value || '').toString().trim();
    var phone = ((detail && detail.phone) || (document.getElementById('phone') || {}).value || '').toString().trim();
    var country = countryValue();

    if (!email && !phone) return;
    // de-dupe repeated identical submissions (Calculate can re-fire)
    var key = (email || phone).toLowerCase();
    if (key === lastIdentifiedEmail) return;
    lastIdentifiedEmail = key;

    var parts = name ? name.split(/\s+/) : [];
    var first = parts.shift() || '';
    var last = parts.join(' ');

    // identify — PII / people. Primary identifier is email (ib: true).
    emit('identify', null, {
      customProperties: {
        user_traits: {
          t: 'Object',
          v: {
            first_name: S(first),
            last_name: S(last),
            name: S(name),
            email: S(email),
            phone: S(phone),
            country: S(country)
          }
        },
        identify_by_email: { t: 'string', v: email, ib: true }
      }
    });

    // lead event with the full configuration context
    emit('trackSubmit', 'Contact Details Submitted', configProps({
      first_name: S(first),
      email: S(email),
      phone: S(phone),
      country: S(country),
      form_submitted_from: S(window.location.href)
    }));
  }

  /* =====================================================================
   * 3-9) Configuration changes — diff-based granular trackClick events.
   *    Primary trigger: a passive MutationObserver on the total/summary
   *    (every config change re-renders the total). Click + change listeners
   *    are redundant safety nets. Nothing here touches form behaviour.
   * ===================================================================== */
  var lastSnap = null;
  var armed = false; // suppress load-time / shared-URL-restore churn

  function snapshot() {
    var c = cfg(); if (!c) return null;
    var lic = c.license || {}, visa = c.visa || {}, act = c.activities || {}, cs = c.changeStatus || {};
    return {
      licenseType: lic.licenseType,
      licenseDuration: lic.licenseDuration,
      shareholders: lic.shareholdersCount,
      investor: visa.investorVisas,
      employee: visa.employeeVisas,
      dependency: visa.dependencyVisas,
      activities: activityCodes(c).join(','),
      activitiesCount: Number(act.selectedActivitiesCount) || 0,
      addons: (c.addons || []).slice().sort().join(','),
      insideUae: cs.applicantsInsideUAE,
      outsideUae: cs.applicantsOutsideUAE
    };
  }

  function diffAndEmit() {
    var cur = snapshot();
    if (!cur) return;
    if (!lastSnap || !armed) { lastSnap = cur; return; }

    if (cur.licenseType !== lastSnap.licenseType) {
      emit('trackClick', 'License Type Selected', configProps({ selected_value: S(cur.licenseType) }));
    }
    if (cur.licenseDuration !== lastSnap.licenseDuration) {
      emit('trackClick', 'License Duration Selected', configProps({ selected_value: N(cur.licenseDuration) }));
    }
    if (cur.shareholders !== lastSnap.shareholders) {
      emit('trackClick', 'Shareholders Updated', configProps({ selected_value: N(cur.shareholders) }));
    }
    if (cur.investor !== lastSnap.investor || cur.employee !== lastSnap.employee || cur.dependency !== lastSnap.dependency) {
      emit('trackClick', 'Visa Selection Updated', configProps());
    }
    if (cur.activities !== lastSnap.activities) {
      var added = cur.activitiesCount >= lastSnap.activitiesCount;
      emit('trackClick', added ? 'Business Activity Added' : 'Business Activity Removed', configProps());
    }
    if (cur.addons !== lastSnap.addons) {
      emit('trackClick', 'Add-on Updated', configProps());
    }
    if (cur.insideUae !== lastSnap.insideUae || cur.outsideUae !== lastSnap.outsideUae) {
      emit('trackClick', 'Change Status Updated', configProps());
    }
    lastSnap = cur;
  }

  var diffTimer = null;
  function scheduleDiff() {
    if (diffTimer) clearTimeout(diffTimer);
    diffTimer = setTimeout(function () { try { diffAndEmit(); } catch (e) {} }, 450);
  }

  /* =====================================================================
   * 10) Checkout made — payment initiated (any channel)
   * ===================================================================== */
  var lastCheckoutAt = 0;
  function onCheckout(channel) {
    var now = (window.performance && performance.now) ? performance.now() : new Date().getTime();
    if (now - lastCheckoutAt < 800) return; // de-dupe rapid double fires
    lastCheckoutAt = now;
    emit('trackClick', 'Checkout Made', configProps({
      payment_channel: S(channel || 'card'),
      amount_aed: N(grandTotal())
    }));
  }

  /* =====================================================================
   * 11) Quote requested — final submission success message shown
   * ===================================================================== */
  function watchSuccess() {
    var el = document.getElementById('theFinalSuccessMessage');
    if (!el || el.__clWatched) return;
    el.__clWatched = true;
    try {
      var obs = new MutationObserver(function () {
        if (el.classList.contains('show') && !el.__clFired) {
          el.__clFired = true;
          emit('trackClick', 'Quote Requested', configProps({ country: S(countryValue()) }));
        }
      });
      obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
  }

  /* ---------------------------------------------------------------------
   * Wiring — all passive listeners/observers
   * ------------------------------------------------------------------- */
  function observeTotals() {
    if (typeof MutationObserver === 'undefined') return;
    ['total-cost-display', 'grand-total-clickable', 'mobile-payment-grand-total'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.__clTotalObs) return;
      el.__clTotalObs = true;
      try {
        new MutationObserver(scheduleDiff).observe(el, { childList: true, characterData: true, subtree: true });
      } catch (e) {}
    });
    // activity tags container — catches activity add/remove that doesn't move the total
    var tags = document.getElementById('activity-tags-container');
    if (tags && !tags.__clTagObs) {
      tags.__clTagObs = true;
      try { new MutationObserver(scheduleDiff).observe(tags, { childList: true, subtree: true }); } catch (e) {}
    }
  }

  function wire() {
    // baseline config (defaults) so the first real change is captured
    lastSnap = snapshot();
    setTimeout(function () { armed = true; }, 1500);

    // 2) lead + identify
    document.addEventListener('contactFormValid', function (e) {
      try { onContactValid(e && e.detail); } catch (err) {}
    });

    // 3-9) config interactions (redundant with the total observer) + 10) payment
    document.addEventListener('click', function (e) {
      try {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('.select-btn, .visa-card, .quantity-btn, .activity-card, .service-checkbox, .addon-category-card, .duration-btn, .license-type-card, .package-card, .pill, .activity-tag')) {
          scheduleDiff();
        }
        var pay = t.closest('#pay-for-license-btn, #mobile-payment-submit-btn, [data-payment-channel], .payment-tabby-option, .payment-tamara-option, #summary-payment-tabby-btn, #summary-payment-tamara-btn, #mobile-payment-tabby-btn, #mobile-payment-tamara-btn');
        if (pay) {
          var channel = pay.getAttribute('data-payment-channel') ||
            (/tabby/i.test(pay.id || '') ? 'tabby' : /tamara/i.test(pay.id || '') ? 'tamara' : 'card');
          onCheckout(channel);
        }
      } catch (err) {}
    }, true);

    // config inputs that DO emit native change/input (sliders / selects)
    ['license-type', 'license-duration', 'shareholders-range', 'investor-visa-count',
     'employee-visa-count', 'dependency-visas', 'applicants-inside-uae', 'applicants-outside-uae']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', scheduleDiff);
        el.addEventListener('input', scheduleDiff);
      });

    document.addEventListener('change', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('service-checkbox')) scheduleDiff();
    }, true);

    observeTotals();
    watchSuccess();

    // Elements (success message, totals, tags) may be (re)rendered later — retry a few times.
    var tries = 0;
    var retry = setInterval(function () {
      tries++;
      observeTotals();
      watchSuccess();
      if (tries >= 20) clearInterval(retry);
    }, 500);

    // 1) pageview
    trackPageview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { try { wire(); } catch (e) {} });
  } else {
    try { wire(); } catch (e) {}
  }

  // Small debug surface (optional)
  window.CLCalcTracker = {
    isReady: clReady,
    queued: function () { return queue.length; },
    track: emit,
    config: configProps
  };
})();
