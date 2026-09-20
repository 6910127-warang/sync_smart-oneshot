# ผลการรันเทสต์ (Test Results)

**รันเมื่อ:** 2026-09-20 19:35 (เวลาไทย, UTC+7)
**คำสั่งที่รัน:** `npx playwright test` ในโฟลเดอร์ [e2e/](e2e/)
**เป้าหมายที่ทดสอบ:** ส่วนใหญ่ชี้ไปเว็บ production จริงบน Firebase Hosting — `https://syncsmart-98d1e.web.app` (`baseURL` ใน [e2e/playwright.config.js](e2e/playwright.config.js)) ยกเว้น 2 เทสต์ role admin/บัญชีถูกปิดใช้งานที่ชี้ไป local dev server แทน (เหตุผลเดิม — ดูหัวข้อ "เทสต์ที่ไม่ผ่าน" ด้านล่าง)
**ผลรวม:** ⚠️ ผ่าน 21/24 (87.5%) — **ไม่ผ่าน 3/24** (รันซ้ำ 1 ครั้งเพื่อยืนยันว่าไม่ใช่ flaky แล้วยังไม่ผ่านเหมือนเดิมทั้ง 2 ครั้ง)

> หมายเหตุ: นี่คือชุดทดสอบอัตโนมัติ (Playwright E2E ใต้ [e2e/tests/](e2e/tests/)) เท่านั้น — ไม่รวมผลการทดสอบแบบ manual/exploratory ผ่าน tester agent ที่ทำแยกไว้ที่ [manual-test-report.md](manual-test-report.md) (คนละไฟล์ คนละวิธีทดสอบ) การทดสอบด้านความปลอดภัย/RBAC อื่นนอกเหนือจาก 2 เทสต์ใน `security-isolation.spec.js` ยังเป็น manual checklist ใน `app/README.md` หัวข้อ "ความปลอดภัย" ไม่ใช่เทสต์อัตโนมัติ
>
> **ไฟล์เทสต์ใหม่รอบนี้:** [e2e/tests/security-isolation.spec.js](e2e/tests/security-isolation.spec.js) (2 test case) — เพิ่มโดย tester agent ตามที่ผู้ใช้ขอ "เพิ่มเทสต์ความปลอดภัย 2 ตัว" (ยังไม่ได้ commit ขึ้น git ณ ตอนรันรอบนี้)

## บัญชีทดสอบที่ใช้

| บัญชี | ใช้ทดสอบ role | สร้างผ่าน | หมายเหตุ |
|---|---|---|---|
| `staff-hph-a@smartsync.test` | staff_hph (unit A) | `app/seed.html` | รหัสผ่าน `Passw0rd!` (dev fixture เดิม) |
| `staff-hph-b@smartsync.test` | staff_hph (unit B, คนละหน่วยกับ A) | `app/seed.html` | รหัสผ่าน `Passw0rd!` — สร้างเพิ่มรอบนี้เพื่อทดสอบ cross-unit isolation |
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

**หมายเหตุรอบนี้:** ทั้ง 2 เทสต์ที่ชี้ไป local server รันครั้งแรก **fail ด้วย `net::ERR_CONNECTION_REFUSED`** เพราะไม่ได้เปิด local dev server (`py .claude/no-cache-server.py 4174 --directory app`) ไว้ก่อนรันชุดเทสต์ — เป็นเรื่องการเตรียม environment ก่อนรัน ไม่ใช่บั๊กของแอป เปิด server แล้วรันซ้ำเฉพาะ 2 เทสต์นี้ผ่านทั้งหมด (ตัวเลขในตารางข้างบน + สรุปด้านบนคือผลหลังเปิด server แล้วรันทั้งชุดใหม่รวดเดียวอีกครั้งเพื่อให้ตัวเลขสอดคล้องกันทั้งไฟล์)

### [e2e/tests/security-isolation.spec.js](e2e/tests/security-isolation.spec.js) — 2 test case × 3 เบราว์เซอร์ (production) — **ไฟล์ใหม่**

| เทสต์ | ทดสอบอะไร | ผล (chromium / firefox / webkit) |
|---|---|---|
| ไม่ล็อกอินแล้วเปิดหน้ารายการ | เปิด `staff-hph/requisition-list.html` โดยไม่มี session เลย ต้อง redirect ไป `login.html` ก่อนเห็นข้อมูลจริง | ✅ / ✅ / ✅ |
| เปิดใบเบิกของหน่วยอื่นตรงๆ ผ่าน URL | login เป็นหน่วย B แล้วเปิด `requisition-detail.html?id=<id ของหน่วย A>` ตรงๆ ต้องเปิดดูไม่ได้ | ❌ / ❌ / ❌ (ดูหัวข้อ "เทสต์ที่ไม่ผ่าน") |

## เทสต์ที่ไม่ผ่าน

**1 เทสต์ไม่ผ่าน (× 3 เบราว์เซอร์ = 3/24 instance)** — `security-isolation.spec.js:25` "ล็อกอินด้วยบัญชีหน่วย B แล้วเปิดคำขอเบิกของหน่วย A ตรงๆ ผ่าน URL ต้องเปิดดูไม่ได้"

**ติดตรงไหน:** เทสต์ต้อง login เป็นหน่วย A ก่อนเพื่อไปหยิบลิงก์ "ดูรายละเอียด" จริงจากหน้ารายการ แต่หา element `a.btn-text:has-text("ดูรายละเอียด")` ไม่เจอเลยจน timeout (60 วินาที) บน production — **สาเหตุคือหน้า `staff-hph/requisition-list.html` เวอร์ชันที่ deploy อยู่บน production ปัจจุบันยังไม่มีลิงก์ "ดูรายละเอียด" และไฟล์ `staff-hph/requisition-detail.html` เองก็ยังไม่ถูก deploy ขึ้น production เลย (ยืนยันแล้วด้วย `curl` ตรงๆ — ทั้ง `https://syncsmart-98d1e.web.app/staff-hph/requisition-detail.html` และ `https://sync-smart.thiphbuymepharmacy.workers.dev/staff-hph/requisition-detail.html` ตอบ `404` ทั้งคู่)** แม้ commit ที่เพิ่มหน้านี้ (`e06108e`) จะอยู่บน `origin/main` แล้วจริง (ตรวจกับ `git fetch` แล้ว ไม่ใช่แค่ local ค้าง) ก็ตาม — สรุปคือ **นี่ไม่ใช่บั๊กด้านความปลอดภัยของแอป** (พฤติกรรมการกันสิทธิ์ข้ามหน่วยเองได้ยืนยันแล้วว่าทำงานถูกต้องจริงผ่านการทดสอบ manual กับ local server ที่มีโค้ดล่าสุดอยู่แล้ว — ดู [manual-test-report.md](manual-test-report.md) หัวข้อ "11. ทดสอบความปลอดภัยเจาะจง") แต่เป็น **ช่องว่างเรื่อง deployment** ที่ทำให้เทสต์อัตโนมัติชุดนี้ยืนยันเรื่องนี้บน production ไม่ได้ในตอนนี้

**บันทึกลง BACKLOG.md แล้ว** เป็นข้อ BUG-001 — ดู [BACKLOG.md](BACKLOG.md)

## สรุปสิ่งที่ต้องทำต่อ

- ต้อง deploy ทั้ง Cloudflare (`sync-smart.thiphbuymepharmacy.workers.dev`) และ/หรือ Firebase Hosting (`syncsmart-98d1e.web.app`) ให้ตรงกับ `main` ปัจจุบันก่อน ถึงจะรัน `security-isolation.spec.js` เทสต์ที่ 2 ผ่านบน production ได้จริง (ดู BACKLOG.md)
- ควร `git add`/commit ไฟล์ `e2e/tests/security-isolation.spec.js` ที่ยังเป็น untracked อยู่ ถ้าต้องการเก็บเป็นส่วนหนึ่งของชุดเทสต์อัตโนมัติถาวร (ยังไม่ได้ commit ให้ตามที่ผู้ใช้ยังไม่ได้สั่ง — commit/push ทำเฉพาะเมื่อผู้ใช้ขอเท่านั้นตาม CLAUDE.md)
