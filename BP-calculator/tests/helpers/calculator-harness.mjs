import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), '..', '..');
const HTML_PATH = path.join(ROOT_DIR, 'BP-calculator.html');
const SCRIPT_PATH = path.join(ROOT_DIR, 'BP-calculator.js');

function defaultSupabaseResult(op, table, state) {
  if (typeof state.resultFor === 'function') {
    const customResult = state.resultFor({ op, table });
    if (customResult) {
      return customResult;
    }
  }

  if (op === 'select') {
    return { data: state.tables?.[table] || [], error: null };
  }

  if (op === 'single' || op === 'maybeSingle') {
    return { data: state.singles?.[table] || null, error: null };
  }

  if (op === 'insert' || op === 'upsert' || op === 'update' || op === 'delete') {
    return { data: null, error: null };
  }

  return { data: state.tables?.[table] || [], error: null };
}

function createSupabaseQuery(table, state = {}) {
  let pendingResult = { data: state.tables?.[table] || [], error: null };

  const query = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve, reject) => Promise.resolve(pendingResult).then(resolve, reject);
        }
        if (prop === 'catch') {
          return (reject) => Promise.resolve(pendingResult).catch(reject);
        }
        if (prop === 'finally') {
          return (handler) => Promise.resolve(pendingResult).finally(handler);
        }

        return (..._args) => {
          pendingResult = defaultSupabaseResult(String(prop), table, state);
          return query;
        };
      },
    },
  );

  return query;
}

export function createSupabaseClientMock(state = {}) {
  return {
    from(table) {
      return createSupabaseQuery(table, state);
    },
  };
}

export function createMFZPhoneMock() {
  return {
    init() {},
    getInstance() {
      return null;
    },
    isValid(field) {
      const digitsOnly = String(field?.value || '').replace(/\D/g, '');
      return digitsOnly.length >= 6 && digitsOnly.length <= 15;
    },
    getFormattedNumber(field) {
      return String(field?.value || '');
    },
  };
}

function stubBrowserAPIs(window, supabaseState) {
  window.alert = () => {};
  window.scrollTo = () => {};
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!window.Element.prototype.scrollIntoView) {
    window.Element.prototype.scrollIntoView = () => {};
  }

  window.fetch = async (input) => {
    const url = String(input || '');
    if (url.includes('ipapi.co')) {
      return {
        ok: true,
        json: async () => ({
          country_code: 'AE',
          country_name: 'United Arab Emirates',
          ip: '127.0.0.1',
          city: 'Dubai',
          region: 'Dubai',
          timezone: 'Asia/Dubai',
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({}),
    };
  };

  window.supabase = {
    createClient: () => createSupabaseClientMock(supabaseState),
  };
  window.MFZPhone = createMFZPhoneMock();
  window.dataLayer = [];
}

export async function bootCalculator({ url = 'https://example.com/', supabaseState = {} } = {}) {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const script = fs.readFileSync(SCRIPT_PATH, 'utf8');

  const dom = new JSDOM(html, {
    url,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });

  const { window } = dom;
  stubBrowserAPIs(window, supabaseState);

  window.eval(script);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  window.dispatchEvent(new window.Event('load'));

  await new Promise((resolve) => setTimeout(resolve, 0));

  return {
    window,
    document: window.document,
    cleanup() {
      dom.window.close();
    },
  };
}

function setFieldValue(window, id, value) {
  const field = window.document.getElementById(id);
  if (!field) return;

  field.value = String(value);
  field.dispatchEvent(new window.Event('input', { bubbles: true }));
  field.dispatchEvent(new window.Event('change', { bubbles: true }));
}

function setCheckbox(window, id, checked) {
  const field = window.document.getElementById(id);
  if (!field) return;

  field.checked = Boolean(checked);
  field.dispatchEvent(new window.Event('change', { bubbles: true }));
}

export function applyScenario(window, scenario) {
  setFieldValue(window, 'license-type', scenario.licenseType);
  setFieldValue(window, 'license-duration', scenario.licenseDuration);
  setFieldValue(window, 'shareholders-range', scenario.shareholdersCount);

  setFieldValue(window, 'investor-visa-count', scenario.investorVisas);
  setFieldValue(window, 'employee-visa-count', scenario.employeeVisas);
  setFieldValue(window, 'dependency-visas', scenario.dependencyVisas);

  setFieldValue(window, 'applicants-inside-uae', scenario.applicantsInsideUAE);
  setFieldValue(window, 'applicants-outside-uae', scenario.applicantsOutsideUAE);

  const selectedAddons = new Set(scenario.selectedAddons || []);
  window.document.querySelectorAll('.service-checkbox').forEach((checkbox) => {
    checkbox.checked = selectedAddons.has(checkbox.value);
    checkbox.dispatchEvent(new window.Event('change', { bubbles: true }));
  });

  const normalize = typeof window.normalizeSelectedActivity === 'function'
    ? window.normalizeSelectedActivity
    : (activity) => activity;

  window.selectedActivities = (scenario.selectedActivities || []).map((activity) => normalize(activity));
}

export function markAllSectionsInteracted(window) {
  if (typeof window.markPreviousSectionsAsInteracted === 'function') {
    window.markPreviousSectionsAsInteracted('addonsSection');
  }
}

function parseAedAmount(value) {
  if (!value) return 0;
  const numeric = String(value).replace(/[^0-9.\-]/g, '');
  const parsed = Number.parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateBreakdown(window) {
  const snapshot = window.getFormSnapshot();
  const licenseCost = window.calculateLicenseCost(snapshot);
  const visaCost = window.calculateVisaCost(snapshot);
  const addonsCost = window.calculateAddonsCost(snapshot);
  const businessActivitiesCost = window.calculateBusinessActivitiesCost(window.selectedActivities);
  const changeStatusCost = window.calculateChangeStatusCost(snapshot);

  markAllSectionsInteracted(window);
  window.calculateCosts();

  return {
    snapshot,
    licenseCost,
    visaCost,
    addonsCost,
    businessActivitiesCost,
    changeStatusCost,
    totalFromComponents: Math.round(
      licenseCost + visaCost + addonsCost + businessActivitiesCost + changeStatusCost,
    ),
    totalFromCalculator: window.calculateTotalCost(),
    renderedGrandTotalText: window.document.getElementById('total-cost-display')?.textContent?.trim() || '',
    renderedGrandTotalValue: parseAedAmount(
      window.document.getElementById('total-cost-display')?.textContent?.trim() || '',
    ),
  };
}

export function seedValidContactForm(window, overrides = {}) {
  const values = {
    fullName: 'Test User',
    email: 'test.user@example.com',
    phone: '971501234567',
    consent: true,
    ...overrides,
  };

  setFieldValue(window, 'full-name', values.fullName);
  setFieldValue(window, 'email', values.email);
  setFieldValue(window, 'phone', values.phone);
  setCheckbox(window, 'consent-checkbox', values.consent);
}
