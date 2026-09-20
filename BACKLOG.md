# Bug/Issue Backlog (จากผลการรันเทสต์)

> ไฟล์นี้เก็บเฉพาะบั๊ก/ปัญหาที่เจอจากการรันเทสต์ (อัตโนมัติ + manual QA ผ่าน tester agent) — **ไม่ใช่** Product Backlog ของ requirement ที่อยู่ที่ [01-requirements/backlog.md](01-requirements/backlog.md) (ไฟล์นั้นดูแลโดย skill/agent อัตโนมัติ เก็บ user story/feature requirement ตาม BL-ID) ไฟล์นี้ไม่มี skill/agent ดูแลอัตโนมัติ อัปเดตมือทุกครั้งที่เจอ/แก้ปัญหาจากการทดสอบ

## เปิดอยู่ (Open)

### BUG-001 — Production hosting (ทั้ง Cloudflare และ Firebase Hosting) ไม่มีหน้าจอ 5 หน้าล่าสุด แม้ commit อยู่บน `main`/`origin/main` แล้ว

- **พบเมื่อ:** 2026-09-20 19:35 ระหว่างรัน `npx playwright test` (e2e/tests/security-isolation.spec.js เทสต์ที่ 2)
- **อาการ:** `curl` ตรงไปยัง production ทั้ง 2 จุดตอบ `404` สำหรับ path ต่อไปนี้ (ทดสอบแล้วทุกไฟล์):
  - `staff-hph/requisition-detail.html`
  - `staff-hph/goods-receipt-confirm.html`
  - `admin/audit-trail.html`
  - `admin/user-accounts.html`
  - `admin/system-settings.html`
  - เช็คแล้วทั้ง `https://sync-smart.thiphbuymepharmacy.workers.dev` (Cloudflare) และ `https://syncsmart-98d1e.web.app` (Firebase Hosting)
- **ยืนยันแล้วว่าไม่ใช่ปัญหาที่ต้นทาง (git):** commit `e06108e` ("Add admin screens...") ที่เพิ่ม 5 ไฟล์นี้อยู่บน `origin/main` แล้วจริง (ตรวจด้วย `git fetch origin main` แล้วเทียบ — ไม่ใช่แค่ local ที่ค้างไม่ได้ push) แปลว่า Cloudflare auto-deploy-on-push (ตามที่ตั้งค่าไว้ตาม `app/README.md` หัวข้อ "Hosting — ย้ายไป Cloudflare") ไม่ได้ทำงาน หรือ deploy แล้ว fail แบบเงียบๆ ส่วน Firebase Hosting ทราบอยู่แล้วว่าต้อง deploy มือ (`firebase.cmd deploy --only hosting`) ซึ่งยังไม่ได้ทำหลังเพิ่ม 5 หน้านี้
- **ผลกระทบ:** ผู้ใช้งานจริงเปิด 5 หน้าจอนี้บน production ไม่ได้เลย (ทั้งที่โค้ดพร้อมและผ่านการทดสอบบน local server แล้ว) และเทสต์อัตโนมัติ `e2e/tests/security-isolation.spec.js` ที่ทดสอบ cross-unit isolation ของหน้ารายละเอียดคำขอเบิกไม่สามารถยืนยันผลบน production ได้ (ดู [test-results.md](test-results.md) หัวข้อ "เทสต์ที่ไม่ผ่าน")
- **ไม่ใช่บั๊กด้านความปลอดภัย:** พฤติกรรม RBAC/cross-unit isolation ของหน้านี้เองยืนยันแล้วว่าถูกต้องผ่าน manual test กับ local server (ดู [manual-test-report.md](manual-test-report.md) หัวข้อ "11.")
- **ขั้นต่อไปที่แนะนำ (ยังไม่ได้ทำ รอผู้ใช้ยืนยัน/สั่ง):**
  1. ตรวจ Cloudflare dashboard ว่า deploy ล่าสุดจาก push ของ commit `e06108e` สำเร็จหรือ fail (ดู build log) — ถ้า fail ต้องดูสาเหตุ
  2. รัน `firebase.cmd deploy --only hosting` เพื่ออัปเดต Firebase Hosting ให้ตรงกับ `main` ปัจจุบัน (ถ้ายังต้องการรักษา Firebase Hosting คู่ขนานไว้ตามที่ตัดสินใจไว้เดิม)
  3. รัน `npx playwright test tests/security-isolation.spec.js` ซ้ำหลัง deploy เพื่อยืนยันว่าผ่านบน production จริง
- **สถานะ:** เปิดอยู่ (Open)
