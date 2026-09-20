// @ts-check
const fs = require('fs');
const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

// โหลด e2e/.env (gitignored) ถ้ามี — เก็บรหัสผ่านบัญชีทดสอบที่ไม่ควร hardcode ในไฟล์ที่ commit ขึ้น git
// ดู e2e/.env.example และคอมเมนต์ใน tests/login-flow.spec.js
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 1,
  reporter: 'html',

  use: {
    baseURL: 'https://syncsmart-98d1e.web.app',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
