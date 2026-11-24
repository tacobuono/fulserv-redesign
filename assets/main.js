// Fulserv Group: mobile nav, notice decoder tabs, contact form.
(() => {
  // ---- Mobile nav ----
  const nav = document.querySelector('.site-nav');
  const toggle = nav && nav.querySelector('.site-nav__toggle');
  if (toggle) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
      nav.toggleAttribute('data-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.hasAttribute('data-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // ---- Notice decoder (WAI-ARIA tabs pattern) ----
  const decoder = document.querySelector('[data-decoder]');
  if (decoder) {
    const tabs = [...decoder.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      // Restart the stamp so the new deadline lands visibly.
      decoder.classList.remove('is-switching');
      void decoder.offsetWidth;
      decoder.classList.add('is-switching');
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        select(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
      });
    });
  }

  // ---- Contact form ----
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  // Prefill from the decoder's "Get help with this letter" links (?notice=cp2000).
  const NOTICE_PREFILL = {
    cp2000: ['Tax notice', 'CP2000'],
    cp14: ['Balance due or collections', 'CP14'],
    cp504: ['Balance due or collections', 'CP504'],
    lt11: ['Balance due or collections', 'LT11 / Letter 1058'],
    audit: ['Audit', 'Letter 566 / 2205'],
    deficiency: ['Tax notice', 'Letter 3219 (90-day letter)'],
  };
  const pre = NOTICE_PREFILL[new URLSearchParams(location.search).get('notice')];
  if (pre) {
    form.elements.topic.value = pre[0];
    form.elements.notice.value = pre[1];
  }

  const status = form.querySelector('.form__status');
  const say = (msg, kind) => {
    status.textContent = msg;
    status.className = `form__status ${kind ? `is-${kind}` : ''}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (invalid.length) {
      invalid.forEach((el) => el.setAttribute('aria-invalid', 'true'));
      const n = invalid.length;
      say(`${n} required field${n > 1 ? 's are' : ' is'} empty or invalid. They're outlined in red.`, 'error');
      invalid[0].focus();
      return;
    }

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      say("This is a preview, so nothing was sent. At launch, this form delivers straight to the firm's inbox.", 'ok');
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    say('Sending your message…');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say("Message sent. We'll reply to set up a time.", 'ok');
    } catch {
      say(`Your message didn't go through. Please call (212) 867-0707 or email mbreslin@fulservgroup.com.`, 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
