# ผลการรันเทสต์ (Test Results)

**รันเมื่อ:** 2026-09-20 15:41:53 (เวลาไทย, UTC+7)
**คำสั่งที่รัน:** `npx playwright test` ในโฟลเดอร์ [e2e/](e2e/)
**เป้าหมายที่ทดสอบ:** ส่วนใหญ่ชี้ไปเว็บ production จริงบน Firebase Hosting — `https://syncsmart-98d1e.web.app` (`baseURL` ใน [e2e/playwright.config.js](e2e/playwright.config.js)) ยกเว้น 2 เทสต์ role admin/บัญชีถูกปิดใช้งานที่ชี้ไป local dev server แทน (ดูเหตุผลด้านล่าง)
**ผลรวม:** ✅ ผ่านทั้งหมด 18/18 (ใช้เวลารวม 30.6 วินาที, รันแบบไม่มี retry)

> หมายเหตุ: นี่คือชุดทดสอบอัตโนมัติชุดเดียวที่มีอยู่ในโปรเจกต์ตอนนี้ (Playwright E2E ใต้ [e2e/tests/](e2e/tests/)) โปรเจกต์นี้ไม่มี build tool/unit test framework อื่นแยกต่างหาก — การทดสอบด้านความปลอดภัย/RBAC เป็น manual checklist ใน `app/README.md` หัวข้อ "ความปลอดภัย" ไม่ใช่เทสต์อัตโนมัติ จึงไม่รวมอยู่ในรายงานนี้
>
> **⚠️ พบระหว่างทางรอบนี้ — role admin ยังไม่ได้ deploy ขึ้น production จริง:** โค้ด `app/login.html` (ROLE_HOME.admin), `app/admin/*` เป็น uncommitted work ที่ยังไม่ได้ deploy ขึ้น `https://syncsmart-98d1e.web.app` — เทสต์ role admin ที่รันกับ production ครั้งแรกจึง fail ด้วยข้อความ `บทบาท "admin" ยังไม่มีหน้าจอใช้งาน` (พฤติกรรมจริงของโค้ดเวอร์ชันที่ deploy อยู่ ไม่ใช่บั๊กของเทสต์) ผู้ใช้ยืนยันให้ 2 เทสต์นี้ชี้ไป local dev server แทนไปก่อน (ดูรายละเอียดที่คอมเมนต์ในไฟล์เทสต์) — **ยังไม่ได้แก้ที่ต้นเหตุ (ยังไม่ deploy)** ถ้าต้องการให้เทสต์ครอบคลุม production จริงทั้งหมด ต้อง commit + deploy `app/` ก่อน

## บัญชีทดสอบที่ใช้

| บัญชี | ใช้ทดสอบ role | สร้างผ่าน | หมายเหตุ |
|---|---|---|---|
| `staff-hph-a@smartsync.test` | staff_hph | `app/seed.html` (มีอยู่แล้วจากก่อนหน้านี้) | รหัสผ่าน `Passw0rd!` (dev fixture เดิม) |
| `pharmacist-a@smartsync.test` | pharmacist | `app/seed.html` (มีอยู่แล้วจากก่อนหน้านี้) | รหัสผ่าน `Passw0rd!` (dev fixture เดิม) |
| `admin-e2e@smartsync.test` | admin | `admin/user-accounts.html` (สร้างใหม่รอบนี้ผ่าน session ของผู้ใช้ที่ login เป็น admin จริง) | เพราะ `seed.html` เขียน `users/{uid}` แบบไม่ authenticate เป็น admin จึงถูก firestore.rules ปัจจุบันปฏิเสธ (permission-denied) — รหัสผ่านสุ่มที่ระบบสร้างให้ตอนสร้างบัญชี |
| `staff-hph-disabled-e2e@smartsync.test` | staff_hph (active: false) | `admin/user-accounts.html` (สร้างใหม่ + กด "ปิดใช้งาน") | ใช้ทดสอบเคสบัญชีถูกปิดใช้งานโดยเฉพาะ |

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
| **admin login (ใหม่)** | **local (localhost:4174)** | login ด้วย `admin-e2e@smartsync.test` แล้ว redirect ไป `admin/audit-trail.html` + heading "Audit Trail ทางธุรกิจ" | ✅ / ✅ / ✅ |
| **บัญชีถูกปิดใช้งาน (ใหม่)** | **local (localhost:4174)** | login ด้วย `staff-hph-disabled-e2e@smartsync.test` (active: false) เช็คว่า sign-in Firebase Auth สำเร็จแต่ `fetchUserProfile` คืน null → หน้า login เข้าสถานะ "showBlocked": ซ่อนฟอร์ม, แสดงข้อความ "บัญชีนี้ไม่พร้อมใช้งานแล้ว…" และปุ่ม "ออกจากระบบ" แทน ไม่ redirect ไปหน้าไหน | ✅ / ✅ / ✅ |

**ขอบเขตที่ครอบคลุมตอนนี้:** login สำเร็จครบ 3 role หลัก (staff_hph, pharmacist, admin) + เคส credential ผิด + เคสบัญชีถูกปิดใช้งาน — **ยังไม่ครอบคลุม:** role executive, เคสบัญชีไม่มี `unitId` (staff_hph), ปุ่ม "ออกจากระบบ" เอง, และพฤติกรรม cross-tab ที่บันทึกไว้ใน `app/README.md`

## เทสต์ที่ไม่ผ่าน

ไม่มี — รอบนี้ผ่านทั้งหมด 18/18 (รันซ้ำแบบไม่มี retry เพื่อยืนยันว่าไม่ใช่ผ่านเพราะ retry บังเอิญ)

ระหว่างทางเจอความไม่เสถียร (flaky) ของเทสต์ redirect หลัง login บน firefox/webkit จริงในบางรอบ — ไม่ใช่บั๊กของแอป แต่เป็นเพราะ default timeout ของ Playwright (5 วินาที) บางครั้งสั้นไปสำหรับรอ round trip ของ Firebase Auth sign-in + อ่านโปรไฟล์จาก Firestore จริงบน production — แก้แล้วโดยเพิ่ม timeout เป็น 10 วินาทีเฉพาะจุดที่รอ redirect
