const { test, expect } = require('@playwright/test');

// บัญชีทดสอบจาก app/seed.html — หน่วย A (unitId: hph-sample-a) และหน่วย B (unitId: hph-sample-b) แยกกัน
// รหัสผ่านนี้เป็นค่าคงที่ dev-only ตาม SEED_PASSWORD ใน seed.html ไม่ใช่รหัสผ่านจริง (ดูคอมเมนต์เดียวกันใน login-flow.spec.js)
const SEED_PASSWORD = 'Passw0rd!';
const STAFF_EMAIL_A = 'staff-hph-a@smartsync.test';
const STAFF_EMAIL_B = 'staff-hph-b@smartsync.test';

async function login(page, email, password) {
  await page.goto('/login.html');
  await page.locator('#email-input').fill(email);
  await page.locator('#password-input').fill(password);
  await page.locator('#sign-in-btn').click();
}

test('เปิดหน้ารายการคำขอเบิกโดยไม่ล็อกอิน ต้องอ่านข้อมูลไม่ได้', async ({ page }) => {
  await page.goto('/staff-hph/requisition-list.html');

  // watchAuth ใน requisition-list.html เด้งไป login.html ทันทีเมื่อไม่มี session (ดูคอมเมนต์ในไฟล์นั้น)
  // ต่อให้เด้งช้า firestore.rules ก็ปฏิเสธการอ่านอยู่ดีเพราะไม่มี auth เลย (defense-in-depth สองชั้น)
  await expect(page).toHaveURL(/login\.html/, { timeout: 10000 });
  await expect(page.locator('#main-view')).toBeHidden();
});

test('ล็อกอินด้วยบัญชีหน่วย B แล้วเปิดคำขอเบิกของหน่วย A ตรงๆ ผ่าน URL ต้องเปิดดูไม่ได้', async ({ browser }) => {
  // เทสต์นี้ล็อกอินจริง 2 รอบ (คนละ context/บัญชี) กับ production Firebase — เกิน default timeout 30s ได้ง่าย
  // จาก network round trip จริง (เจอ flaky มาแล้ว ดูคอมเมนต์เดียวกันใน login-flow.spec.js เรื่อง timeout หลัง login)
  test.setTimeout(60000);

  // ล็อกอินเป็นหน่วย A ก่อน แค่เพื่อเก็บ id คำขอเบิกจริงของหน่วย A มาสร้าง URL ทดสอบ
  // (ไม่ hardcode id เพราะ seed.html สุ่ม doc id ใหม่ทุกครั้งที่รัน seed ทับ)
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await login(pageA, STAFF_EMAIL_A, SEED_PASSWORD);
  await expect(pageA).toHaveURL(/staff-hph\/requisition-list\.html/, { timeout: 10000 });
  const detailHref = await pageA.locator('a.btn-text:has-text("ดูรายละเอียด")').first().getAttribute('href');
  expect(detailHref).toMatch(/^requisition-detail\.html\?id=/);
  await contextA.close();

  // ล็อกอินเป็นหน่วย B ใน context/session แยกต่างหาก (คนละบัญชีจริงๆ ไม่ใช่ sign out แล้ว login ซ้อน)
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await login(pageB, STAFF_EMAIL_B, SEED_PASSWORD);
  await expect(pageB).toHaveURL(/staff-hph\/requisition-list\.html/, { timeout: 10000 });
  await pageB.goto(`/staff-hph/${detailHref}`);

  // firestore.rules (canAccessRequisition()) ต้องปฏิเสธ get() นี้เพราะ unitId ไม่ตรงกับหน่วย B — ต่อให้ปฏิเสธไม่สำเร็จ
  // requisition-detail.html ก็เช็คซ้ำฝั่ง client (req.unitId !== profile.unitId) อยู่ดี (defense-in-depth สองชั้นเหมือนเทสต์แรก)
  // ไม่ว่าจะเข้าทางไหน ต้องไม่แสดงข้อมูลจริงของคำขอหน่วย A ใน #detail-view
  await expect(pageB.locator('#detail-view')).toBeHidden({ timeout: 10000 });
  await expect(pageB.locator('#notice-view')).toBeVisible();
  await contextB.close();
});
