import { chromium } from 'playwright';

const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const browser = await chromium.launch({ headless: true });

async function shot(url, file, cookie) {
  const ctx = await browser.newContext({ viewport: MOBILE, ...MOBILE });
  if (cookie) await ctx.addCookies([cookie]);
  const page = await ctx.newPage();
  await page.goto('http://localhost:3333' + url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: file, fullPage: true });
  await ctx.close();
  console.log('✓', file);
}

// Cord login page
await shot('/cord/login', '/tmp/cord_login.png');
// Admin login page
await shot('/admin/login', '/tmp/admin_login.png');

await browser.close();
