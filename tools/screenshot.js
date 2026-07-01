#!/usr/bin/env node
/**
 * screenshot.js — Capture a screenshot of a web page using Puppeteer.
 *
 * Usage:
 *   node tools/screenshot.js --url <url> [options]
 *
 * Options:
 *   --url <url>          Page to capture (required). http(s):// or a local file path.
 *   --out <path>         Output file. Default: "temporary screenshots/<host>-<timestamp>.png"
 *   --full              Capture the full scrollable page (default: viewport only).
 *   --width <px>         Viewport width. Default: 1440
 *   --height <px>        Viewport height. Default: 900
 *   --scale <n>          Device scale factor (2 = retina). Default: 1
 *   --selector <css>     Capture only the element matching this selector.
 *   --wait <ms>          Extra wait after load, for animations/lazy content. Default: 0
 *   --timeout <ms>       Navigation timeout. Default: 30000
 *
 * Examples:
 *   node tools/screenshot.js --url https://example.com --full
 *   node tools/screenshot.js --url https://example.com --selector "#hero" --scale 2
 */

const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true; // boolean flag
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function normalizeUrl(url) {
  if (/^https?:\/\//i.test(url) || /^file:\/\//i.test(url)) return url;
  // Treat as a local file path.
  return "file://" + path.resolve(url).replace(/\\/g, "/");
}

function deriveOutPath(url) {
  let label = "page";
  try {
    label = new URL(normalizeUrl(url)).hostname || "page";
  } catch (_) {}
  label = label.replace(/[^a-z0-9.-]/gi, "_");
  return path.join("temporary screenshots", `${label}-${timestamp()}.png`);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.url || args.url === true) {
    console.error("Error: --url is required.\nSee header of tools/screenshot.js for usage.");
    process.exit(1);
  }

  const url = normalizeUrl(args.url);
  const outPath = args.out && args.out !== true ? args.out : deriveOutPath(args.url);
  const fullPage = Boolean(args.full);
  const width = parseInt(args.width, 10) || 1440;
  const height = parseInt(args.height, 10) || 900;
  const scale = parseFloat(args.scale) || 1;
  const selector = args.selector && args.selector !== true ? args.selector : null;
  const extraWait = parseInt(args.wait, 10) || 0;
  const timeout = parseInt(args.timeout, 10) || 30000;

  // Ensure the output directory exists.
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });

  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: scale });

    console.log(`Navigating to ${url} ...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout });

    if (extraWait > 0) {
      await new Promise((r) => setTimeout(r, extraWait));
    }

    let target = page;
    if (selector) {
      await page.waitForSelector(selector, { timeout });
      target = await page.$(selector);
      if (!target) throw new Error(`Selector not found: ${selector}`);
    }

    await target.screenshot({
      path: outPath,
      fullPage: selector ? undefined : fullPage,
    });

    console.log(`Saved screenshot: ${path.resolve(outPath)}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Screenshot failed:", err.message);
  process.exit(1);
});
