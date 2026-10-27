import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runE2E() {
  console.log('🚀 Starting CampusEats End-to-End Automated Test & Screenshot Capture...');

  // Reset database state to the 4 seed items and reset AUTO_INCREMENT to 5
  await query('DELETE FROM dishes WHERE id > 4');
  await query('ALTER TABLE dishes AUTO_INCREMENT = 5');
  console.log('🧹 Cleaned up any previous test records beyond seed items (id > 4).');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome binary not found at ${chromePath}`);
  }

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 980 },
  });

  try {
    const page = await browser.newPage();

    // 1. Navigate to CampusEats web application
    console.log('🌐 Navigating to http://localhost:4000/ ...');
    await page.goto('http://localhost:4000/', { waitUntil: 'networkidle0' });

    // 2. Wait for dishes to load via GraphQL
    await page.waitForSelector('.dish-card', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 500));
    const initialDishes = await page.$$eval('.dish-name', els => els.map(el => el.textContent.trim()));
    console.log(`✅ Initial dishes loaded (${initialDishes.length} items):`, initialDishes);

    // 3. Capture before-mutation screenshot
    const beforeScreenshotPath = path.join(screenshotsDir, 'before-mutation.png');
    await page.screenshot({ path: beforeScreenshotPath, fullPage: false });
    console.log(`📸 Saved before-mutation screenshot to ${beforeScreenshotPath}`);

    // 4. Fill form to add new dish
    console.log('📝 Filling "Add New Dish" form with new dish: Chole Bhature, ₹110.00...');
    await page.type('#dishName', 'Chole Bhature');
    await page.type('#dishPrice', '110');

    // 5. Submit mutation
    console.log('⚡ Submitting addDish mutation...');
    await page.click('#submitBtn');

    // 6. Wait for success alert and updated cards
    await page.waitForSelector('.alert.success', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 500));
    const alertText = await page.$eval('#alertMessage', el => el.textContent.trim());
    console.log('🎉 Mutation response alert:', alertText);

    // Wait for the new dish card to be visible in DOM
    await page.waitForFunction(
      () => document.querySelectorAll('.dish-card').length >= 5,
      { timeout: 10000 }
    );

    const updatedDishes = await page.$$eval('.dish-name', els => els.map(el => el.textContent.trim()));
    console.log(`✅ Updated dishes loaded (${updatedDishes.length} items):`, updatedDishes);

    // 7. Capture after-mutation screenshot
    const afterScreenshotPath = path.join(screenshotsDir, 'after-mutation.png');
    await page.screenshot({ path: afterScreenshotPath, fullPage: false });
    console.log(`📸 Saved after-mutation screenshot to ${afterScreenshotPath}`);

    console.log('\n🏆 E2E Testing and Genuine Screenshot Capture Completed Successfully!');
  } finally {
    await browser.close();
  }
}

runE2E().catch(err => {
  console.error('❌ E2E Test failed:', err);
  process.exit(1);
});
