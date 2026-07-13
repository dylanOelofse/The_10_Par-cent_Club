# Contact form: toast confirmation + readable email format

**Date:** 2026-07-13
**Status:** Approved pending user review
**Files touched:** `website/contact.html`, `website/assets/js/main.js`, `website/assets/css/styles.css`

## Goal

Two changes to the contact form experience:

1. When a message sends successfully, show a modern toast popup for ~2.8 seconds instead of the current full success card, and reset the form in place.
2. Make the notification email that arrives via Web3Forms clean and readable, containing everything the visitor typed into the relevant inputs.

## 1. Toast confirmation

### Behavior

- On successful send, a toast appears fixed at bottom-center of the viewport, slides up + fades in, holds, then fades out. Total visible time ~2.8s.
- While the toast shows, the form resets in place (reusing the existing reset logic: clears all fields, clears validation states, re-syncs the custom `role`/`fees` dropdowns, re-hides the fees field). The visitor can immediately send another message — no "Send another message" button needed.
- The toast subline stays role-aware, preserving current copy:
  - School: "Thanks for reaching out about a talk. We'll be in touch within one working day to find a date that suits your school."
  - Parent: "Thanks for reaching out. We'll be in touch within one working day to talk through a plan for your family."
  - Fallback: "Your message is on its way. We usually reply within one working day."
- The honeypot (bot) path and demo mode (empty `FORM_ACCESS_KEY`) also show the toast, preserving the current behavior of never revealing bot detection.
- The error path is unchanged: the existing inline `#formError` box shows when sending fails.

### Removed

- The `#formSuccess` card markup in `contact.html` (lines ~161–169).
- `showSuccess()` and the `#sendAnother` handler in `main.js`, replaced by `showToast()` + an extracted `resetForm()` helper.
- Related `.form-success` CSS becomes unused and is removed; new `.toast` styles added.

### Look & accessibility

- Matches site design language: navy card, gold tick in a circular badge, Manrope type, soft shadow, rounded corners (reuses existing CSS custom properties for colors/radius/shadow).
- Markup injected by JS on the contact page only (a single `div` appended to `body`).
- `role="status"` + `aria-live="polite"` so screen readers announce it.
- Respects reduced motion via the existing `reduce` flag in `main.js`: fade only, no slide.
- Repeated sends restart the toast timer cleanly (no stacking/overlap).

## 2. Email format (Web3Forms payload)

Keep Web3Forms' default template (free tier), which renders each payload field as a label/value table. Rename payload keys to human labels and send them in reading order:

| Field label | Source | Included when |
|---|---|---|
| Full name | `#name` | always |
| Email address | `#email` | always (also becomes Reply-To automatically) |
| Phone number | `#phone` | only if provided |
| Address | `#address` | always |
| Enquiry type | `#role` | always |
| School name | `#school` | always |
| Approximate school fees | `#fees` | only for Parent enquiries |
| Message | `#message` | always |

- Only relevant fields appear — no "Not provided" / "Not applicable" filler rows.
- Subject stays: `New enquiry: <Role>, <Name>`.
- `from_name` stays: "The Ten Par-Cent Club website".
- Recipient is controlled in the Web3Forms dashboard (currently `dylanoelofse2003@gmail.com` for testing, later `hello@tenparcent.co.za`). No code change involved.
- `access_key` and `botcheck` fields unchanged.

## Input validation (audited 2026-07-13)

Existing rules verified as correct: name ≥ 2 chars, email pattern check, address ≥ 4 chars, role required, school name ≥ 2 chars, fees required only for Parent (cleared and skipped for School), message ≥ 5 chars; blur/input/submit triggers and first-invalid-field focus all behave correctly, and the honeypot silently drops bots.

One fix included in this work: the optional phone rule (`/^[+()\-\s\d]{7,}$/`) accepts symbol-only strings like `+++++++`. New rule: when phone is non-empty it must match the existing character set **and contain at least 7 digits**.

## Error handling

- Send failure (network error or non-success response): inline error box, unchanged.
- Validation failures: unchanged (per-field errors, focus first invalid field).
- Toast timer: clear any running hide-timer before showing again so rapid consecutive sends behave.

## Testing

Manual, via local server (`npx serve website`) and then the deployed URL:

1. Submit as Parent with phone → email contains all 8 fields, toast shows ~2.8s, form resets.
2. Submit as School without phone → email has no phone row and no fees row.
3. Submit twice in a row → second toast displays cleanly.
4. Failure path: temporarily corrupt the access key → inline error box shows, no toast, form values retained.
7. Phone validation: `+++++++` rejected; `072 547 3640` and `+27 72 547 3640` accepted; empty accepted.
5. Reduced motion (OS setting) → toast fades without sliding.
6. Screen reader sanity check: toast text is announced.
