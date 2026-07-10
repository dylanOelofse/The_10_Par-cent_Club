/* ============================================================
   The Ten Par-Cent Club — interactions
   Progressive enhancement: everything degrades gracefully and
   respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---- Current year ---- */
  $$("#year").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---- Sticky header state ----
     Hysteresis dead-band (add at >16px, remove at <4px) so the class can't
     flip-flop right at the threshold and cause a flicker near the top. */
  const header = $("#siteHeader");
  if (header) {
    let scrolled = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (!scrolled && y > 16) { scrolled = true; header.classList.add("scrolled"); }
      else if (scrolled && y < 4) { scrolled = false; header.classList.remove("scrolled"); }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile nav ---- */
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(!links.classList.contains("open"));
    });
    $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
    // Tap anywhere outside the menu to close it
    document.addEventListener("click", (e) => {
      if (links.classList.contains("open") && !links.contains(e.target)) setOpen(false);
    });
    window.addEventListener("resize", () => window.innerWidth > 820 && setOpen(false));
  }

  /* ---- Hero load sequence ---- */
  const hero = $("#hero") || $(".page-hero");
  if (hero) requestAnimationFrame(() => hero.classList.add("loaded"));

  /* ---- Reveal on scroll ---- */
  const reveals = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            obs.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---- Ambient parallax on the ghosted % ---- */
  if (!reduce) {
    const layers = $$("[data-parallax]");
    if (layers.length) {
      let ticking = false;
      const move = () => {
        const sy = window.scrollY;
        layers.forEach((el) => {
          const speed = 0.08;
          el.style.transform = `translateY(${sy * speed}px)`;
        });
        ticking = false;
      };
      window.addEventListener("scroll", () => {
        if (!ticking) { requestAnimationFrame(move); ticking = true; }
      }, { passive: true });
    }
  }

  /* ============================================================
     Contact form
     ------------------------------------------------------------
     Email delivery with NO backend (works on GitHub Pages / Vercel).

     1. Go to https://web3forms.com and enter the address that should
        receive enquiries. They email you a free Access Key.
     2. Paste it below. That's it — submissions get emailed to you.

     Leave the key as "" to run in demo mode (shows the confirmation
     without actually sending — handy for local previews).
     ============================================================ */
  const FORM_ACCESS_KEY = ""; // e.g. "abcd1234-56ef-78ab-90cd-1234567890ab"
  const FORM_ENDPOINT = "https://api.web3forms.com/submit";

  const form = $("#contactForm");
  if (form) {
    // Prefill "I am a…" from ?type=parent / ?type=school
    const params = new URLSearchParams(location.search);
    const type = (params.get("type") || "").toLowerCase();
    const role = $("#role");
    if (role && (type === "parent" || type === "school")) {
      role.value = type === "parent" ? "Parent" : "School";
    }

    const fields = {
      name: { el: $("#name"), test: (v) => v.trim().length >= 2 },
      email: { el: $("#email"), test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
      phone: { el: $("#phone"), test: (v) => v.trim() === "" || /^[+()\-\s\d]{7,}$/.test(v.trim()) },
      address: { el: $("#address"), test: (v) => v.trim().length >= 4 },
      role: { el: $("#role"), test: (v) => v.trim() !== "" },
      school: { el: $("#school"), test: (v) => v.trim().length >= 2 },
      fees: { el: $("#fees"), test: (v) => $("#role").value !== "Parent" || v.trim() !== "" },
      message: { el: $("#message"), test: (v) => v.trim().length >= 5 },
    };

    const setInvalid = (key, invalid) => {
      const f = fields[key];
      if (!f || !f.el) return;
      f.el.closest(".field").classList.toggle("invalid", invalid);
      f.el.setAttribute("aria-invalid", String(invalid));
    };

    // School-fees dropdown only applies to parents.
    const cselectSyncs = []; // custom dropdowns re-read their select's value via these
    const feesField = $("#feesField");
    const toggleFees = () => {
      if (!feesField) return;
      const isParent = fields.role.el.value === "Parent";
      feesField.hidden = !isParent;
      if (!isParent) { fields.fees.el.value = ""; setInvalid("fees", false); }
      cselectSyncs.forEach((fn) => fn());
    };
    fields.role.el.addEventListener("change", toggleFees);
    toggleFees(); // reflect a ?type= prefill on load

    /* ---- Custom themed dropdowns ----
       Replaces the native <select> UI (whose option list can't be styled)
       with a themed listbox. The native select stays in the form, hidden,
       as the source of truth for value, validation and submission. */
    const openCselects = [];
    const enhanceSelect = (sel) => {
      if (!sel || sel.dataset.enhanced) return;
      sel.dataset.enhanced = "true";

      const wrap = document.createElement("div");
      wrap.className = "cselect";
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(sel);

      const fieldLabel = sel.closest(".field").querySelector("label");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cselect__btn";
      btn.setAttribute("aria-haspopup", "listbox");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", fieldLabel ? fieldLabel.textContent.replace("*", "").trim() : "Choose an option");
      btn.innerHTML = '<span class="cselect__val"></span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      const valEl = $(".cselect__val", btn);

      const list = document.createElement("ul");
      list.className = "cselect__list";
      list.setAttribute("role", "listbox");

      const opts = [];
      Array.from(sel.options).forEach((o) => {
        if (o.disabled) return; // the "Please choose…" placeholder stays out of the list
        const li = document.createElement("li");
        li.className = "cselect__opt";
        li.setAttribute("role", "option");
        li.tabIndex = -1;
        li.dataset.value = o.value;
        li.textContent = o.textContent;
        list.appendChild(li);
        opts.push(li);
      });
      wrap.appendChild(btn);
      wrap.appendChild(list);
      sel.focusTarget = btn; // validation focuses this instead of the hidden select

      const placeholderOpt = sel.querySelector("option[disabled]");
      const placeholder = placeholderOpt ? placeholderOpt.textContent : "Please choose";

      const sync = () => {
        const current = opts.find((o) => o.dataset.value === sel.value && sel.value !== "");
        valEl.textContent = current ? current.textContent : placeholder;
        btn.classList.toggle("is-placeholder", !current);
        opts.forEach((o) => o.setAttribute("aria-selected", String(o === current)));
      };
      sync();
      cselectSyncs.push(sync);

      const setOpenSel = (open) => {
        wrap.classList.toggle("open", open);
        btn.setAttribute("aria-expanded", String(open));
        if (open) {
          openCselects.forEach((w) => w !== wrap && w.__close());
          const target = opts.find((o) => o.getAttribute("aria-selected") === "true") || opts[0];
          if (target) target.focus();
        }
      };
      wrap.__close = () => setOpenSel(false);
      openCselects.push(wrap);

      const choose = (li) => {
        sel.value = li.dataset.value;
        sel.dispatchEvent(new Event("input", { bubbles: true }));
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        sync();
        setInvalid(sel.id, false);
        setOpenSel(false);
        btn.focus();
      };

      btn.addEventListener("click", () => setOpenSel(!wrap.classList.contains("open")));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpenSel(true); }
      });
      opts.forEach((li, i) => {
        li.addEventListener("click", () => choose(li));
        li.addEventListener("keydown", (e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); (opts[i + 1] || opts[0]).focus(); }
          else if (e.key === "ArrowUp") { e.preventDefault(); (opts[i - 1] || opts[opts.length - 1]).focus(); }
          else if (e.key === "Home") { e.preventDefault(); opts[0].focus(); }
          else if (e.key === "End") { e.preventDefault(); opts[opts.length - 1].focus(); }
          else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(li); }
          else if (e.key === "Escape") { setOpenSel(false); btn.focus(); }
          else if (e.key === "Tab") { setOpenSel(false); }
        });
      });
      document.addEventListener("click", (e) => {
        if (wrap.classList.contains("open") && !wrap.contains(e.target)) setOpenSel(false);
      });
    };
    enhanceSelect($("#role"));
    enhanceSelect($("#fees"));

    // Validate on blur once touched
    Object.keys(fields).forEach((key) => {
      const f = fields[key];
      if (!f.el) return;
      f.el.addEventListener("blur", () => setInvalid(key, !f.test(f.el.value)));
      f.el.addEventListener("input", () => {
        if (f.el.closest(".field").classList.contains("invalid")) setInvalid(key, !f.test(f.el.value));
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Honeypot: if filled, silently drop (bot).
      const hp = $("#company");
      if (hp && hp.value.trim() !== "") { showSuccess(); return; }

      let firstBad = null;
      Object.keys(fields).forEach((key) => {
        const ok = fields[key].test(fields[key].el.value);
        setInvalid(key, !ok);
        if (!ok && !firstBad) firstBad = fields[key].el;
      });

      if (firstBad) { (firstBad.focusTarget || firstBad).focus(); return; }

      sendMessage();
    });

    const errBox = $("#formError");
    const submitBtn = $(".form-submit", form);
    const hideError = () => errBox && errBox.setAttribute("hidden", "");
    const showError = () => {
      if (!errBox) return;
      errBox.removeAttribute("hidden");
      errBox.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    };

    async function sendMessage() {
      hideError();

      // Demo mode — no key set yet. Show the confirmation without sending.
      if (!FORM_ACCESS_KEY) { showSuccess(); return; }

      const original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      const payload = {
        access_key: FORM_ACCESS_KEY,
        subject: `New enquiry: ${fields.role.el.value}, ${fields.name.el.value}`,
        from_name: "The Ten Par-Cent Club website",
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        phone: fields.phone.el.value.trim() || "Not provided",
        address: fields.address.el.value.trim(),
        "I am a": fields.role.el.value,
        "School name": fields.school.el.value.trim(),
        "Approximate school fees": fields.fees.el.value || "Not applicable",
        message: fields.message.el.value.trim(),
        botcheck: "", // Web3Forms honeypot
      };

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) { showSuccess(); }
        else { showError(); }
      } catch (_) {
        showError();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
      }
    }

    function showSuccess() {
      const success = $("#formSuccess");
      const chosen = fields.role.el.value;
      const msg = $("#successMsg");
      if (msg) {
        if (chosen === "School") msg.textContent = "Thanks for reaching out about a talk. We'll be in touch within one working day to find a date that suits your school.";
        else if (chosen === "Parent") msg.textContent = "Thanks for reaching out. We'll be in touch within one working day to talk through a plan for your family.";
        else msg.textContent = "Your message is on its way. We usually reply within one working day.";
      }
      form.classList.add("is-hidden");
      success.classList.add("show");
      success.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }

    const again = $("#sendAnother");
    if (again) again.addEventListener("click", () => {
      form.reset();
      Object.keys(fields).forEach((k) => setInvalid(k, false));
      toggleFees(); // also re-syncs the custom dropdown labels
      hideError();
      $("#formSuccess").classList.remove("show");
      form.classList.remove("is-hidden");
      form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      $("#name").focus();
    });
  }
})();
