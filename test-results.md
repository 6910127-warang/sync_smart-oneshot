# ผลการรันเทสต์ (Test Results)

**รันเมื่อ:** 2026-09-21 00:24 (เวลาไทย, UTC+7)
**คำสั่งที่รัน:** `npx playwright test` ในโฟลเดอร์ [e2e/](e2e/)
**เป้าหมายที่ทดสอบ:** ส่วนใหญ่ชี้ไปเว็บ production จริงบน Firebase Hosting — `https://syncsmart-98d1e.web.app` (`baseURL` ใน [e2e/playwright.config.js](e2e/playwright.config.js)) ยกเว้น 2 เทสต์ role admin/บัญชีถูกปิดใช้งานที่ชี้ไป local dev server แทน (เหตุผลเดิม — ดูหัวข้อ "เทสต์ 2 ตัวที่รันกับ local server" ด้านล่าง)
**ผลรวม:** ✅ ผ่านทั้งหมด 24/24 (100%)

> หมายเหตุ: นี่คือชุดทดสอบอัตโนมัติ (Playwright E2E ใต้ [e2e/tests/](e2e/tests/)) เท่านั้น — ไม่รวมผลการทดสอบแบบ manual/exploratory ผ่าน tester agent ที่ทำแยกไว้ที่ [manual-test-report.md](manual-test-report.md) (คนละไฟล์ คนละวิธีทดสอบ) การทดสอบด้านความปลอดภัย/RBAC อื่นนอกเหนือจาก 2 เทสต์ใน `security-isolation.spec.js` ยังเป็น manual checklist ใน `app/README.md` หัวข้อ "ความปลอดภัย" ไม่ใช่เทสต์อัตโนมัติ

**อัปเดตจากรอบก่อนหน้า (20260920 19:35):** รอบที่แล้วมี 1 เทสต์ไม่ผ่าน — `security-isolation.spec.js:25` (เปิดคำขอเบิกของหน่วยอื่นตรงๆ ผ่าน URL) — เพราะตอนนั้น production (ทั้ง Cloudflare และ Firebase Hosting) ยังตกค้างหลายสิบ commit จากที่ push จริง ทำให้ `requisition-detail.html` และลิงก์ "ดูรายละเอียด" ยังไม่ถูก deploy ขึ้นเลย (สาเหตุ: Cloudflare Git integration เชื่อมผิด repo — ดู [CLAUDE.md](CLAUDE.md) หัวข้อ "เฟสปัจจุบัน" อัปเดต 20260920) หลังแก้ไข deploy ทั้งสองจุดให้ตรงกับ `main` ปัจจุบันแล้ว (Cloudflare reconnect ใหม่ + Firebase Hosting redeploy) เทสต์นี้ผ่านแล้วทั้ง 3 เบราว์เซอร์ — ปิด **BUG-001** ใน [BACKLOG.md](BACKLOG.md) ได้

## บัญชีทดสอบที่ใช้

| บัญชี | ใช้ทดสอบ role | สร้างผ่าน | หมายเหตุ |
|---|---|---|---|
| `staff-hph-a@smartsync.test` | staff_hph (unit A) | `app/seed.html` | รหัสผ่าน `Passw0rd!` (dev fixture เดิม) |
| `staff-hph-b@smartsync.test` | staff_hph (unit B, คนละหน่วยกับ A) | `app/seed.html` | รหัสผ่าน `Passw0rd!` — ใช้ทดสอบ cross-unit isolation |
| `pharmacist-a@smartsync.test` | pharmacist | `app/seed.html` | รหัสผ่าน `Passw0rd!` (dev fixture เดิม) |
| `admin-e2e@smartsync.test` | admin | `admin/user-accounts.html` | รหัสผ่านเก็บใน `e2e/.env` (gitignored, `ADMIN_TEST_PASSWORD`) |
| `staff-hph-disabled-e2e@smartsync.test` | staff_hph (active: false) | `admin/user-accounts.html` | รหัสผ่านเก็บใน `e2e/.env` (gitignored, `DISABLED_STAFF_TEST_PASSWORD`) |

## รายละเอียดต่อเทสต์

### [e2e/tests/login-page.spec.js](e2e/tests/login-page.spec.js) — 1 test case × 3 เบราว์เซอร์ (production)

| เบราว์เซอร์ | เทสต์นี้ทดสอบอะไร | ผล |
|---|---|---|
| chromium / firefox / webkit | เปิดหน้า `/login.html` แล้วเช็คว่าฟอร์ม login แสดงผลครบ 3 อย่าง: ช่องอีเมล, ช่องรหัสผ่าน, ปุ่มเข้าสู่ระบบ | ✅ ผ่านทั้ง 3 |

### [e2e/tests/login-flow.spec.js](e2e/tests/login-flow.spec.js) — 6 test case × 3 เบราว์เซอร์ (4 ตัวรัน production, 2 ตัวรัน local server)

| เทสต์ | รันกับ | ทดสอบอะไร | ผล (chromium / firefox / webkit) |
|---|---|---|---|
| staff_hph login | production | login ด้วย `staff-hph-a@smartsync.test` แล้ว redirect ไป `staff-hph/requisition-list.html` + heading ถูกต้อง | ✅ / ✅ / ✅ |
| pharmacist login | production | login ด้วย `pharmacist-a@smartsync.test` แล้ว redirect ไป `pharmacist/approval-queue-level1.html` + heading ถูกต้อง | ✅ / ✅ / ✅ |
| รหัสผ่านผิด | production | login ด้วยอีเมลจริงแต่รหัสผ่านผิด เช็คว่าไม่ redirect และ error message เป็น "อีเมลหรือรหัสผ่านไม่ถูกต้อง" | ✅ / ✅ / ✅ |
| admin login | local (localhost:4174) | login ด้วย `admin-e2e@smartsync.test` แล้ว redirect ไป `admin/audit-trail.html` + heading "Audit Trail ทางธุรกิจ" | ✅ / ✅ / ✅ |
| บัญชีถูกปิดใช้งาน | local (localhost:4174) | login ด้วย `staff-hph-disabled-e2e@smartsync.test` (active: false) เช็คว่าเข้าสถานะ "showBlocked" ไม่ redirect ไปหน้าไหน | ✅ / ✅ / ✅ |

**เทสต์ 2 ตัวที่รันกับ local server:** เหตุผลเดิม (ไม่เปลี่ยนจากรอบก่อน) — เปิด local dev server (`py .claude/no-cache-server.py 4174 --directory app`) ไว้ก่อนรันชุดเทสต์เสมอ มิฉะนั้น 2 เทสต์นี้จะ fail ด้วย `net::ERR_CONNECTION_REFUSED`

### [e2e/tests/security-isolation.spec.js](e2e/tests/security-isolation.spec.js) — 2 test case × 3 เบราว์เซอร์ (production)

| เทสต์ | ทดสอบอะไร | ผล (chromium / firefox / webkit) |
|---|---|---|
| ไม่ล็อกอินแล้วเปิดหน้ารายการ | เปิด `staff-hph/requisition-list.html` โดยไม่มี session เลย ต้อง redirect ไป `login.html` ก่อนเห็นข้อมูลจริง | ✅ / ✅ / ✅ |
| เปิดใบเบิกของหน่วยอื่นตรงๆ ผ่าน URL | login เป็นหน่วย B แล้วเปิด `requisition-detail.html?id=<id ของหน่วย A>` ตรงๆ ต้องเปิดดูไม่ได้ | ✅ / ✅ / ✅ (แก้แล้ว — ดู "อัปเดตจากรอบก่อนหน้า" ด้านบน) |

## เทสต์ที่ไม่ผ่าน

ไม่มี — ผ่านครบ 24/24 (100%)

## สรุปสิ่งที่ต้องทำต่อ

- ไม่มีรายการค้างจากรอบทดสอบนี้ — BUG-001 ใน [BACKLOG.md](BACKLOG.md) ปิดได้แล้ว (ดูหมายเหตุด้านบน)
