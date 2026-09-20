const { test, expect } = require('@playwright/test');

// บัญชีทดสอบที่สร้างจาก app/seed.html (dev fixture เดียวกับที่ใช้ทดสอบหน้าจอจริงมาตลอดโปรเจกต์)
// รหัสผ่านนี้เป็นค่าคงที่ dev-only ตาม SEED_PASSWORD ใน seed.html ไม่ใช่รหัสผ่านจริง
const SEED_PASSWORD = 'Passw0rd!';
const STAFF_EMAIL = 'staff-hph-a@smartsync.test';
const PHARMACIST_EMAIL = 'pharmacist-a@smartsync.test';

// บัญชีทดสอบ role admin + เคสบัญชีถูกปิดใช้งาน (เพิ่มเพื่อเทสต์นี้โดยเฉพาะ) — สร้างผ่าน admin/user-accounts.html
// ไม่ใช่ seed.html เพราะ seed.html เขียน users/{uid} แบบไม่ authenticate เป็น admin จึงถูก firestore.rules ปัจจุบัน
// ปฏิเสธ (permission-denied) รหัสผ่านเป็นค่าสุ่มที่ระบบ generate ให้ตอนสร้างบัญชี (แสดงครั้งเดียว) ต่างจาก
// SEED_PASSWORD ข้างบนตรงที่เป็นรหัสผ่านจริงเฉพาะบัญชีนี้ ไม่ใช่ placeholder ที่ตั้งใจแชร์ — ห้าม hardcode ในไฟล์นี้
// (เคย hardcode ไว้ตรงๆ มาก่อน ถูก permission classifier ของ Claude Code บล็อกตอน git add เพราะเป็น credential
// leak จริง เข้าถึงบัญชี admin จริงบน Firebase project นี้ได้) เก็บไว้ใน e2e/.env (gitignored) แทน — ดู .env.example
const ADMIN_EMAIL = 'admin-e2e@smartsync.test';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD;
const DISABLED_STAFF_EMAIL = 'staff-hph-disabled-e2e@smartsync.test';
const DISABLED_STAFF_PASSWORD = process.env.DISABLED_STAFF_TEST_PASSWORD;

async function login(page, email, password) {
  await page.goto('/login.html');
  await page.locator('#email-input').fill(email);
  await page.locator('#password-input').fill(password);
  await page.locator('#sign-in-btn').click();
}

// timeout ยาวกว่า default (5s) ใน assertion แรกหลัง login เพราะต้องรอ round trip จริงของ Firebase Auth
// sign-in + fetchUserProfile (Firestore) ก่อน onAuthStateChanged callback ใน login.html ถึง redirect ได้
// (production จริง บาง browser/ช่วงเวลาใช้เวลานานกว่า 5s เจอ flaky มาแล้ว โดยเฉพาะ webkit/firefox)
test('staff_hph login redirects to หน้ารายการคำขอเบิกของหน่วยฉัน', async ({ page }) => {
  await login(page, STAFF_EMAIL, SEED_PASSWORD);

  await expect(page).toHaveURL(/staff-hph\/requisition-list\.html/, { timeout: 10000 });
  await expect(page.locator('h1')).toHaveText('รายการคำขอเบิกของหน่วยฉัน');
});

test('pharmacist login redirects to หน้ารออนุมัติระดับ 1', async ({ page }) => {
  await login(page, PHARMACIST_EMAIL, SEED_PASSWORD);

  await expect(page).toHaveURL(/pharmacist\/approval-queue-level1\.html/, { timeout: 10000 });
  await expect(page.locator('h1')).toHaveText('รออนุมัติระดับ 1');
});

test('login ด้วยรหัสผ่านผิดแสดง error และไม่ redirect ไปไหน', async ({ page }) => {
  await login(page, STAFF_EMAIL, 'wrong-password-123');

  await expect(page).toHaveURL(/login\.html|\/$/);
  await expect(page.locator('#error-message')).toBeVisible();
  await expect(page.locator('#error-message')).toHaveText('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
});

// เทสต์ 2 ตัวนี้ชี้ไป local dev server (app/ ที่ .claude/launch.json config "app", port 4174) แทน production
// เพราะ role admin (login.html ROLE_HOME.admin, app/admin/*) ยังเป็น uncommitted work ที่ยังไม่ได้ deploy ขึ้น
// production จริง (https://syncsmart-98d1e.web.app ที่ baseURL หลักของไฟล์นี้ชี้ไปยังคงเป็น login.html เวอร์ชันเก่า
// ที่ไม่รู้จัก role "admin") — ต้องรัน local server ก่อน (`py .claude/no-cache-server.py 4174 --directory app`
// จาก root โปรเจกต์ หรือใช้ launch config "app") ไม่งั้น 2 เทสต์นี้จะ fail ด้วย connection refused
// ทั้ง local server และ production ชี้ Firebase project เดียวกัน (ดู app/firebase-config.js) จึงเห็นบัญชีทดสอบเดียวกัน
test.describe('role admin + บัญชีถูกปิดใช้งาน (รันกับ local dev server)', () => {
  test.use({ baseURL: 'http://localhost:4174' });

  test.skip(
    !ADMIN_PASSWORD || !DISABLED_STAFF_PASSWORD,
    'ไม่พบ ADMIN_TEST_PASSWORD/DISABLED_STAFF_TEST_PASSWORD ใน e2e/.env — คัดลอกจาก .env.example แล้วใส่รหัสผ่านจริงก่อนรัน'
  );

  test('admin login redirects to หน้า Audit Trail ทางธุรกิจ', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page).toHaveURL(/admin\/audit-trail\.html/, { timeout: 10000 });
    await expect(page.locator('h1')).toHaveText('Audit Trail ทางธุรกิจ');
  });

  test('login ด้วยบัญชีที่ถูกปิดใช้งาน (active: false) ถูกบล็อกไม่ให้เข้าแอป', async ({ page }) => {
    await login(page, DISABLED_STAFF_EMAIL, DISABLED_STAFF_PASSWORD);

    // sign-in เข้า Firebase Auth สำเร็จ แต่ fetchUserProfile คืน null เพราะ active !== true
    // login.html จึงเข้าสถานะ showBlocked: ซ่อนฟอร์ม login แสดงข้อความ + ปุ่ม "ออกจากระบบ" แทน ไม่ redirect ไปหน้าไหน
    await expect(page).toHaveURL(/login\.html|\/$/);
    await expect(page.locator('#email-input')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('#message')).toHaveText(
      'บัญชีนี้ไม่พร้อมใช้งานแล้ว — กรุณาติดต่อผู้ดูแลระบบ หรือกด "ออกจากระบบ" แล้วลองบัญชีอื่น'
    );
    await expect(page.locator('#sign-out-btn')).toBeVisible();
  });
});
