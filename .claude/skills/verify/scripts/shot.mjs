// 1280x800 screenshots. Usage:
//   node shot.mjs app   <appUrl> <out.png> [--phone]   signed-in app (dev-login), waits for fonts + network idle
//   node shot.mjs board <boardUrl> <out.png> [--phone] design artboard (x-dc rendered)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const deps = process.env.VERIFY_DEPS ?? path.join(os.homedir(), '.cache/kanplan-verify');
const { chromium } = createRequire(path.join(deps, 'x.js'))('playwright-core');
const [kind, url, out, flag] = process.argv.slice(2);
const size = flag === '--phone' ? { width: 375, height: 812 } : { width: 1280, height: 800 };

// Reuse the browser Playwright already downloaded; install one only if none exists.
const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
const exe = fs.existsSync(cache) ? fs.readdirSync(cache).filter((d) => d.startsWith('chromium-'))
  .map((d) => path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')).find(fs.existsSync) : undefined;

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
if (kind === 'app') {
  const origin = new URL(url).origin;
  await page.goto(`${origin}/api/auth/dev-login`, { waitUntil: 'networkidle' }); // sets the cookie, redirects to the app
  if (!page.url().startsWith(origin)) throw new Error(`dev-login landed on ${page.url()}`);
  await page.goto(url, { waitUntil: 'networkidle' });
} else {
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500); // x-dc custom elements render after the runtime boots
}
await page.evaluate(() => document.fonts.ready);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out });
await browser.close();
console.log(out);
