# Workflow: Take a Screenshot

## Objective
Capture a screenshot of a web page (or local HTML file) as a PNG.

## Tool
`tools/screenshot.js` — Node script using Puppeteer (headless Chrome).

## Required Inputs
- **url**: The page to capture. Accepts `http(s)://` URLs or a local file path.

## Optional Inputs
- **out**: Output file path. Defaults to `temporary screenshots/<host>-<timestamp>.png`.
- **full**: Capture the full scrollable page instead of just the viewport.
- **width / height**: Viewport size (default 1440x900).
- **scale**: Device scale factor; use `2` for retina-quality output.
- **selector**: A CSS selector to capture only one element.
- **wait**: Extra milliseconds to wait after load (for animations/lazy content).
- **timeout**: Navigation timeout in ms (default 30000).

## How to Run
```bash
# Basic viewport shot
node tools/screenshot.js --url https://example.com

# Full-page, retina quality
node tools/screenshot.js --url https://example.com --full --scale 2

# One element only, custom output
node tools/screenshot.js --url https://example.com --selector "#hero" --out "temporary screenshots/hero.png"

# Local HTML file
node tools/screenshot.js --url ./brand_assets/preview.html --full
```

## Expected Output
- A PNG saved to the `out` path (printed as an absolute path on success).

## Edge Cases / Notes
- First run after install downloads a bundled Chromium — later runs are fast.
- If a page lazy-loads content on scroll, combine `--full` with `--wait 1500`.
- If `--selector` is set, `--full` is ignored (element bounds define the capture).
- Screenshots default to the `temporary screenshots/` folder (disposable, per CLAUDE.md).
