// Initialize Gravity Forms inside dynamically injected content
// When a form is submitted, this module posts to the Gravity Forms
// REST API v2 endpoint: /wp-json/gf/v2/forms/{id}/submissions
// and renders the confirmation or validation errors.

export function initGravityForms(root) {
  const w = window;
  const d = document;
  const $ = w.jQuery;
  const container = root || d;

  // REST base URL
  const restBase = (w.nkReactTheme && w.nkReactTheme.restUrl) || '/wp-json/';

  const forms = Array.from(
    container.querySelectorAll('.gform_wrapper form[id^="gform_"]')
  );
  if (!forms.length) return;

  // Ensure visibility immediately (SPA injection may bypass GF's show logic)
  const unhide = () => {
    const wrappers = container.querySelectorAll('.gform_wrapper');
    wrappers.forEach((el) => {
      el.style.display = '';
      el.style.visibility = '';
      el.style.opacity = '';
      el.classList.remove('gf_invisible', 'gform_hidden');
      // Also target common inner containers
      const inner = el.querySelectorAll('.gform_body, .gform_fields, form');
      inner.forEach((n) => {
        if (n) {
          if (n.style.display === 'none') n.style.display = '';
          if (n.style.visibility === 'hidden') n.style.visibility = '';
          if (n.style.opacity === '0') n.style.opacity = '';
        }
      });
    });
  };
  unhide();

  const doInit = () => {
    try {
      // Nothing GF-JS specific here anymore; we keep it minimal for REST flow
      // Ensure still visible after init
      unhide();
    } catch (_) {
      // no-op: avoid breaking the app if GF isn’t present
    }
  };

  // Retry a few times in case GF scripts load a bit later
  let attempts = 10;
  const tick = () => {
    if (w.gform || attempts <= 0) {
      doInit();
    } else {
      attempts -= 1;
      setTimeout(tick, 200);
    }
  };
  // Run after paint to ensure nodes are in the DOM
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(tick);
  } else {
    setTimeout(tick, 0);
  }

  // Final safeguard: unhide after a short delay in case init stalled
  setTimeout(unhide, 800);

  // REST submission binding
  const toRestPayload = (formEl, formId) => {
    const fd = new FormData(formEl);
    const data = {};
    for (const [rawKey, value] of fd.entries()) {
      let key = String(rawKey);
      if (key.startsWith('input_')) {
        key = key.replace(/\./g, '_').replace(/\[\]$/, '');
        if (data[key] === undefined) data[key] = value;
        else if (Array.isArray(data[key])) data[key].push(value);
        else data[key] = [data[key], value];
      } else if (key === 'state_' + formId) {
        data['state'] = value;
      } else if (key === 'gform_unique_id') {
        data['gform_unique_id'] = value;
      } else if (key === 'g-recaptcha-response' || key.startsWith('recaptcha')) {
        data[key] = value;
      }
      // Other internal fields (gform_ajax, is_submit_*, etc.) are not required for REST
    }
    data['source_url'] = w.location.href;
    return data;
  };

  const renderValidation = (formEl, messages) => {
    // Clear previous errors and states
    formEl.querySelectorAll('.gfield_validation_message, .gform_validation_errors, .nk-gf-error').forEach(n => n.remove());
    formEl.querySelectorAll('.gfield.gfield_error').forEach(n => n.classList.remove('gfield_error'));
    formEl.querySelectorAll('[aria-invalid="true"]').forEach(n => n.setAttribute('aria-invalid', 'false'));

    if (!messages || typeof messages !== 'object') return;

    // Add a general summary message at the top
    const summary = d.createElement('div');
    summary.className = 'gform_validation_errors nk-gf-error';
    summary.textContent = 'There was a problem with your submission. Errors are marked below.';
    const body = formEl.querySelector('.gform_body') || formEl;
    body.prepend(summary);

    const entries = Object.entries(messages);
    let firstInvalid = null;

    const findInputs = (key) => {
      // Supports keys like input_1, input_4_3, or numeric '1'
      if (/^\d+$/.test(key)) {
        return formEl.querySelectorAll(`[name^="input_${key}"]`);
      }
      const k = key.startsWith('input_') ? key : `input_${key}`;
      const dotName = k.replace(/_/g, '.');
      return formEl.querySelectorAll(`[name="${k}"] , [name^="${dotName}"] , [name^="${k}["]`);
    };

    entries.forEach(([key, rawMsg]) => {
      const msg = Array.isArray(rawMsg) ? rawMsg.join(' ') : String(rawMsg || 'This field is required.');
      const inputs = Array.from(findInputs(key));
      if (!inputs.length) return;

      const input = inputs[0];
      const field = input.closest('.gfield') || input.parentElement || formEl;
      field.classList.add('gfield_error');

      inputs.forEach((el) => {
        try { el.setAttribute('aria-invalid', 'true'); } catch (_) {}
      });

      const div = d.createElement('div');
      div.className = 'gfield_validation_message nk-gf-error';
      div.textContent = msg;
      field.appendChild(div);

      if (!firstInvalid) firstInvalid = input;
    });

    // Focus and scroll to the first invalid field
    if (firstInvalid) {
      try { firstInvalid.focus({ preventScroll: true }); } catch (_) {}
      try { firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
    }
  };

  const doRestSubmit = async (formEl, formId, ev) => {
    if (ev) ev.preventDefault();
    const payload = toRestPayload(formEl, formId);
    const url = restBase.replace(/\/$/, '') + `/gf/v2/forms/${formId}/submissions`;
    try {
      // Disable submit buttons to prevent double submission
      const submitButtons = formEl.querySelectorAll('button[type="submit"], input[type="submit"], .gform_button');
      submitButtons.forEach((b) => { try { b.disabled = true; } catch (_) {} });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        const html = json?.confirmation_message || json?.confirmation || json?.html || '<div class="gform_confirmation_message">Thank you. Your form was submitted successfully.</div>';
        const wrap = formEl.closest('.gform_wrapper') || formEl.parentElement;
        if (wrap) wrap.innerHTML = html;
        return;
      }

      if (res.status === 400 || res.status === 422) {
        renderValidation(formEl, json?.validation_messages || json?.data?.validation_messages);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        const wrap = formEl.closest('.gform_wrapper') || formEl;
        const warn = d.createElement('div');
        warn.className = 'gform_validation_errors nk-gf-error';
        warn.textContent = 'Submission blocked by REST authorization. Enable “Submit via REST API” for this form in Gravity Forms settings.';
        wrap.prepend(warn);
        return;
      }

      const wrap = formEl.closest('.gform_wrapper') || formEl;
      const err = d.createElement('div');
      err.className = 'gform_validation_errors nk-gf-error';
      err.textContent = 'There was a problem submitting the form. Please try again later.';
      wrap.prepend(err);
    } catch (e) {
      console.error('GF REST submission exception', e);
    } finally {
      // Re-enable submit buttons
      const submitButtons = formEl.querySelectorAll('button[type="submit"], input[type="submit"], .gform_button');
      submitButtons.forEach((b) => { try { b.disabled = false; } catch (_) {} });
    }
  };

  const bindREST = () => {
    forms.forEach((formEl) => {
      if (formEl.dataset.nkGfRest === '1') return;
      const m = /gform_(\d+)/.exec(formEl.id);
      const formId = m ? parseInt(m[1], 10) : 0;
      if (!formId) return;
      formEl.dataset.nkGfRest = '1';

      // Intercept submit event (Enter key or programmatic submit)
      formEl.addEventListener('submit', (ev) => doRestSubmit(formEl, formId, ev));

      // Intercept explicit clicks on submit buttons
      const submitButtons = formEl.querySelectorAll('button[type="submit"], input[type="submit"], .gform_button');
      submitButtons.forEach((btn) => {
        btn.addEventListener('click', (ev) => doRestSubmit(formEl, formId, ev));
      });
    });
  };

  // Bind REST submit after init
  setTimeout(bindREST, 50);
}
