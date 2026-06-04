import { chromium } from 'playwright';

const BASE = 'http://localhost:3333';
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

const browser = await chromium.launch({ headless: true });
const ctx     = await browser.newContext({ viewport: MOBILE, ...MOBILE });
const page    = await ctx.newPage();

const issues = [];
const shots  = [];

async function check(label, url, checks = []) {
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => page.goto(BASE + url, { waitUntil: 'load' }).catch(() => {}));
  await page.waitForTimeout(1200);

  const shot = `/tmp/shot_${label.replace(/\W/g,'_')}.png`;
  await page.screenshot({ path: shot, fullPage: false });
  shots.push({ label, url, shot });

  // Check for horizontal overflow
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
  if (overflow) issues.push({ page: label, issue: `OVERFLOW: body.scrollWidth (${document.body?.scrollWidth}) > ${window.innerWidth}` });

  // Check console errors
  page.on('console', m => { if (m.type() === 'error') issues.push({ page: label, issue: `CONSOLE ERR: ${m.text().slice(0,120)}` }); });

  // Run custom checks
  for (const c of checks) {
    const result = await page.evaluate(c.fn).catch(e => null);
    if (!result) issues.push({ page: label, issue: `MISSING: ${c.name}` });
  }

  console.log(`✓ ${label} (${url})`);
}

// Capture console errors globally
page.on('console', m => { if (m.type() === 'error') { const txt = m.text(); if (!txt.includes('DevTools') && !txt.includes('favicon')) issues.push({ page: 'global', issue: `CONSOLE: ${txt.slice(0,120)}` }); } });

// ── Pages to audit ───────────────────────────────────────────────
await check('Home', '/', [
  { name: 'Hero section',       fn: () => !!document.querySelector('[class*="from-green-6"]') },
  { name: 'Bottom nav',         fn: () => !!document.querySelector('nav') },
  { name: 'Search bar',         fn: () => !!document.querySelector('input[type="search"]') },
]);

await check('Categories', '/categories', [
  { name: 'Header title',       fn: () => document.body.innerText.includes('All Categories') },
]);

await check('Search', '/search', [
  { name: 'Search input',       fn: () => !!document.querySelector('input') },
]);

await check('Cart (empty)', '/cart', [
  { name: 'Empty state shown',  fn: () => document.body.innerText.includes('empty') || document.body.innerText.includes('Start Shopping') },
]);

await check('Login', '/login', [
  { name: 'Email input',        fn: () => !!document.querySelector('input[type="email"]') },
  { name: 'Send OTP button',    fn: () => document.body.innerText.includes('OTP') },
]);

await check('Register', '/register', [
  { name: 'Terms link',         fn: () => document.body.innerText.includes('Terms') },
]);

await check('Offers', '/offers', [
  { name: 'Offers header',      fn: () => document.body.innerText.includes('Offer') || document.body.innerText.includes('Coupon') },
]);

await check('Wishlist', '/wishlist', [
  { name: 'Wishlist header',    fn: () => document.body.innerText.includes('Wishlist') },
]);

await check('Orders (redirect)', '/orders', []);
await check('Account (no auth)', '/account', []);
await check('Onboarding', '/onboarding', [
  { name: 'Skip button',        fn: () => document.body.innerText.includes('Skip') },
]);

await check('Terms', '/terms', [
  { name: 'T&C heading',        fn: () => document.body.innerText.includes('Terms') },
  { name: 'Grievance section',  fn: () => document.body.innerText.includes('Grievance') },
]);

await check('Privacy', '/privacy', [
  { name: 'Privacy heading',    fn: () => document.body.innerText.includes('Privacy') },
]);

await check('Refunds', '/refunds', [
  { name: 'Refund table',       fn: () => document.body.innerText.includes('Cancel') },
]);

// ── Check horizontal overflow on all pages ───────────────────────
for (const s of shots) {
  await page.goto(BASE + s.url, { waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(600);
  const sw = await page.evaluate(() => ({ body: document.body.scrollWidth, win: window.innerWidth }));
  if (sw.body > sw.win + 2) issues.push({ page: s.label, issue: `HORIZONTAL OVERFLOW: scrollWidth ${sw.body} > viewportWidth ${sw.win}` });
}

await browser.close();

// ── Report ───────────────────────────────────────────────────────
console.log('\n=== ISSUES FOUND ===');
if (issues.length === 0) {
  console.log('✅ No issues found!');
} else {
  [...new Set(issues.map(i => `[${i.page}] ${i.issue}`))].forEach(i => console.log('⚠️ ', i));
}

console.log('\n=== SCREENSHOTS ===');
shots.forEach(s => console.log(`  ${s.label}: ${s.shot}`));
