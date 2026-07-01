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

  /* ---- Sticky header state ---- */
  const header = $("#siteHeader");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile nav ---- */
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
    $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
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

  /* ---- Count-up stats ---- */
  const counters = $$("[data-count]");
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = target + suffix; return; }
    const dur = 1400;
    let start = null;
    const step = (t) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCount);
    } else {
      const cio = new IntersectionObserver(
        (entries, obs) => entries.forEach((en) => {
          if (en.isIntersecting) { runCount(en.target); obs.unobserve(en.target); }
        }),
        { threshold: 0.6 }
      );
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ---- Hero savings-growth curve ---- */
  const chart = $("#growthChart");
  if (chart) {
    const W = 460, H = 210, pad = 6;
    // Compounding: R500/month, ~9% p.a., 18 years -> normalised for the illustration.
    const monthly = 500, rate = 0.09 / 12, months = 18 * 12;
    const pts = [];
    let bal = 0, peak = 0;
    for (let m = 0; m <= months; m++) {
      bal = bal * (1 + rate) + monthly;
      if (m % 6 === 0) pts.push(bal);
      peak = bal;
    }
    const n = pts.length - 1;
    const x = (i) => pad + (i / n) * (W - pad * 2);
    const y = (v) => H - pad - (v / peak) * (H - pad * 2);
    let d = `M ${x(0).toFixed(1)} ${y(pts[0]).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (x(i - 1) + x(i)) / 2;
      d += ` C ${cx.toFixed(1)} ${y(pts[i - 1]).toFixed(1)}, ${cx.toFixed(1)} ${y(pts[i]).toFixed(1)}, ${x(i).toFixed(1)} ${y(pts[i]).toFixed(1)}`;
    }
    const line = $("#growthLine");
    const fill = $("#growthFill");
    const dot = $("#growthDot");
    const valEl = $("#vizVal");
    line.setAttribute("d", d);
    fill.setAttribute("d", `${d} L ${x(n).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`);

    const fmt = (v) => "R" + Math.round(v).toLocaleString("en-ZA");
    const finalVal = peak;

    const animate = () => {
      if (reduce) {
        valEl.innerHTML = fmt(finalVal) + "<small> by age 18</small>";
        dot.setAttribute("opacity", "1");
        dot.setAttribute("cx", x(n)); dot.setAttribute("cy", y(pts[n]));
        return;
      }
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
      fill.style.opacity = "0";
      const dur = 1900;
      let start = null;
      dot.setAttribute("opacity", "1");
      const step = (t) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        line.style.strokeDashoffset = len * (1 - eased);
        fill.style.transition = "opacity .6s ease";
        fill.style.opacity = String(eased);
        const pt = line.getPointAtLength(len * eased);
        dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y);
        valEl.innerHTML = fmt(finalVal * eased) + "<small> by age 18</small>";
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) { animate(); }
    else {
      const vio = new IntersectionObserver((entries, obs) => entries.forEach((en) => {
        if (en.isIntersecting) { animate(); obs.unobserve(en.target); }
      }), { threshold: 0.4 });
      vio.observe(chart);
    }
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
      role: { el: $("#role"), test: (v) => v.trim() !== "" },
      message: { el: $("#message"), test: (v) => v.trim().length >= 5 },
    };

    const setInvalid = (key, invalid) => {
      const f = fields[key];
      if (!f || !f.el) return;
      f.el.closest(".field").classList.toggle("invalid", invalid);
      f.el.setAttribute("aria-invalid", String(invalid));
    };

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

      if (firstBad) { firstBad.focus(); return; }

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
        subject: `New enquiry — ${fields.role.el.value} — ${fields.name.el.value}`,
        from_name: "The Ten Par-Cent Club website",
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        phone: fields.phone.el.value.trim() || "Not provided",
        "I am a": fields.role.el.value,
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
      hideError();
      $("#formSuccess").classList.remove("show");
      form.classList.remove("is-hidden");
      form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      $("#name").focus();
    });
  }
})();
