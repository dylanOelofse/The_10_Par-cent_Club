# The Ten Par-Cent Club — Website

A clean, modern, mobile-first site built to the Specification & Owner Guide. Static HTML/CSS/JS — no build step, no dependencies. Open `index.html` in a browser to run it.

## Pages
- `index.html` — Home (hero + animated savings curve, dual parent/school pathways, outcomes, free-talks section, trust stats, testimonial, CTA)
- `about.html` — About (story, mission, the "10% philosophy", dual offering, team, features the logo)
- `contact.html` — Contact (validated enquiry form, on-screen confirmation, contact details)

## Design
- **Palette** (from the logo + Hereford Group): deep heritage navy `#16324f`, rand gold `#e9a94e`, warm cream `#f6f1e6`, Hereford blue `#2e6e8e` (used as the "schools" accent; gold = "parents").
- **Type:** Cormorant Garamond (display, matches the logo wordmark) + Manrope (body/UI), via Google Fonts.
- **Signature:** the `%` glyph (from "Par-cent") as a recurring motif, and a self-drawing compounding-savings curve in the hero.
- **Motion:** hero load sequence, scroll reveals, count-up stats, sticky condensing nav, hover micro-interactions — all disabled under `prefers-reduced-motion`.
- **Logo:** the navbar/footer use an HTML wordmark that matches the logo (crisp at any size); the supplied `Logo.jpg` poster is featured on the About page. Ask the client for the transparent **PNG + SVG** (handover item #1) to replace the wordmark with the true mark if preferred.

## Spec coverage
- ✅ 3 pages, two-audience messaging, FREE made prominent, school topics, Grade 8+, testimonial/stats
- ✅ Contact form fields (Name*, Email*, Phone, I am a…*, Message*) + client-side validation, honeypot spam trap, friendly on-screen confirmation, role-aware messages, prefill via `?type=parent` / `?type=school`
- ✅ Responsive (mobile/tablet/desktop), semantic HTML, meta titles/descriptions, alt text, visible focus, reduced-motion, `lang="en-ZA"`
- ✅ "Affiliate of Hereford Group" + FAIS-style legal note in the footer

## Contact form — email delivery, no backend needed
The form emails enquiries to you directly from the static site (no server), using
[Web3Forms](https://web3forms.com) — free, unlimited, with built-in spam filtering.

**Turn it on (2 minutes):**
1. Go to https://web3forms.com, enter the email address that should receive enquiries,
   and they'll email you a free **Access Key**.
2. Open `assets/js/main.js`, find `FORM_ACCESS_KEY = ""` near the top of the contact-form
   section, and paste your key between the quotes.
3. Deploy. Submissions now arrive in your inbox with the sender's name, email, phone,
   type (Parent/School/Other) and message.

Until a key is added it runs in **demo mode** (shows the confirmation without sending),
so local previews still work. On failure the form shows a friendly error with a mailto
fallback. Prefer a different service? The `fetch()` in `sendMessage()` swaps cleanly to
Formspree, Basin, or EmailJS.

## Deploying (static — GitHub Pages or Vercel)
This is plain static files, so either host works with zero config.

**Vercel:** `vercel` in the `website/` folder (or import the repo on vercel.com and set the
root directory to `website`). Auto HTTPS + global CDN.

**GitHub Pages:** push the repo, then Settings → Pages → deploy from branch, folder `/website`
(or move these files to the repo root / `docs/`). Auto HTTPS on the `github.io` domain.

Point the client's domain (`10parcentclub.co.za`, registered via Afrihost) at either host per their DNS docs.

## Still to do before go-live
1. **Add the Web3Forms key** (above) so the form sends.
2. **Google Analytics** — drop the client's tag into each page's `<head>`.
3. **Real content** — replace placeholder org contact details (email/cell) and stats; add
   client SA photography where desired. Team is in place (Joshua Swart & Nathan Kacev,
   photos in `assets/img/team/`); each card has an "Email / Cell — to be added" placeholder
   in `about.html` to fill in once you send those details.
4. Optional: **reCAPTCHA** (Web3Forms supports it) and a **CMS** if the client wants to edit
   copy without touching HTML. SSL is automatic on both hosts above.
