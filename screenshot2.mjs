import { chromium } from 'playwright';

const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' };
const browser = await chromium.launch({ headless: true });

async function shotAuth(loginUrl, dashUrl, email, password, file) {
  const ctx  = await browser.newContext({ viewport: MOBILE, ...MOBILE });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3333' + loginUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:3333' + dashUrl, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: file, fullPage: true });
  await ctx.close();
  console.log('✓', file);
}

await shotAuth('/admin/login', '/admin', 'sadmin@sadrax.in', 'Sadrax@2026', '/tmp/admin_dash.png');
await shotAuth('/admin/login', '/admin/orders', 'sadmin@sadrax.in', 'Sadrax@2026', '/tmp/admin_orders.png');
await shotAuth('/admin/login', '/admin/products', 'sadmin@sadrax.in', 'Sadrax@2026', '/tmp/admin_products.png');
await shotAuth('/cord/login', '/cord', 'scord@sadrax.in', 'Sadrax@2026', '/tmp/cord_dash.png');

await browser.close();
