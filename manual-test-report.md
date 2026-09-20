# SmartSync — Manual/Exploratory Test Report (Playwright MCP)

**วันที่รัน:** 2026-09-20 (เวลาไทย, UTC+7), ช่วง ~16:55–17:11
**ขอบเขต:** Full regression ทุกหน้าจอใน `spec.md` §1 ที่มีโค้ดจริง — ครอบคลุมหน้าจอที่ `spec.md` เอกสารไว้ (login, staff-hph requisition-list/new, pharmacist approval-queue-level1/approval-review-level1) **บวก** หน้าจอที่มีโค้ดจริงเพิ่มเติมตาม `app/README.md` (source of truth ตามกฎที่ `spec.md` ระบุเอง) ได้แก่ `staff-hph/requisition-detail.html`, `staff-hph/goods-receipt-confirm.html`, `admin/audit-trail.html`, `admin/user-accounts.html`, `admin/system-settings.html`
**Environment:** Local dev server (`py .claude/no-cache-server.py 4174 --directory app`) ที่ `http://localhost:4174` — เชื่อมต่อ Firestore/Firebase Authentication ของโปรเจกต์จริง `syncsmart-98d1e` (ไม่มี local emulator ในสถาปัตยกรรมนี้ ข้อมูลที่เห็น/เขียนทั้งหมดเป็น dev/test fixture ที่มีอยู่แล้ว ไม่ใช่ข้อมูลคลินิกจริง)
**เบราว์เซอร์:** Chromium ผ่าน Playwright MCP
**บัญชีทดสอบที่ใช้ได้จริง:** `staff-hph-a@smartsync.test`, `staff-hph-b@smartsync.test`, `pharmacist-a@smartsync.test` (ทั้งหมดรหัสผ่าน `Passw0rd!` ตาม `app/seed.html`)
**บัญชีทดสอบที่ทดลองแต่ใช้ไม่ได้:** `admin-a@smartsync.test` / `Passw0rd!` (ไม่มีอยู่จริง — `auth/invalid-credential`), `admin-e2e@smartsync.test` / `Passw0rd!` (มีบัญชีจริงจาก `test-results.md` แต่รหัสผ่านเป็นค่าสุ่มที่ไม่ได้บันทึกไว้ที่ไหน)

---

## 1. สรุปผล (Summary)

| # | Scenario | หน้าจอ | ผล |
|---|---|---|---|
| 1 | Login สำเร็จ — staff_hph | login.html | ✅ Pass |
| 2 | Login สำเร็จ — pharmacist | login.html | ✅ Pass |
| 3 | Login ล้มเหลว — รหัสผ่าน/บัญชีไม่ถูกต้อง | login.html | ✅ Pass |
| 4 | Login ที่ยังไม่ authenticate เข้าหน้า protected ตรงๆ → redirect ไป login | ทุกหน้า | ✅ Pass |
| 5 | รายการคำขอเบิกของหน่วยฉัน — แสดงผลถูกต้อง, กรองเฉพาะหน่วยตนเอง | staff-hph/requisition-list.html | ✅ Pass |
| 6 | สร้างคำขอเบิกยาประจำเดือน — happy path | staff-hph/requisition-new.html | ✅ Pass |
| 7 | สร้างคำขอเบิก — validation ค่าติดลบ | staff-hph/requisition-new.html | ✅ Pass |
| 8 | ปุ่ม "ขอปรึกษา" ปิดใช้งานเสมอ (ตามสเปครอบนี้) | staff-hph/requisition-new.html | ✅ Pass |
| 9 | รายละเอียดคำขอ — แสดงรายการยา/ประวัติการอนุมัติถูกต้อง | staff-hph/requisition-detail.html | ✅ Pass |
| 10 | รายละเอียดคำขอ — พบข้อมูลเก่าไม่สมบูรณ์ (orphan) 1 รายการ | staff-hph/requisition-detail.html | ⚠️ Observation (ไม่ใช่บั๊กที่เกิดจากการทดสอบนี้) |
| 11 | ยืนยันรับยา — guard: คำขอไม่ใช่สถานะ "จ่ายแล้ว" | staff-hph/goods-receipt-confirm.html | ✅ Pass |
| 12 | ยืนยันรับยา — guard: ยืนยันซ้ำคำขอที่รับแล้ว | staff-hph/goods-receipt-confirm.html | ✅ Pass |
| 13 | ยืนยันรับยา — happy path (สร้างบันทึกรับยาจริง) | staff-hph/goods-receipt-confirm.html | 🚫 Blocked — ไม่มีข้อมูลทดสอบสถานะ "จ่ายแล้ว" ที่ยังไม่ถูกรับ (ดูรายละเอียด) |
| 14 | คิวรออนุมัติระดับ 1 — แสดงคำขอทั้งเครือข่าย (ข้ามหน่วย) | pharmacist/approval-queue-level1.html | ✅ Pass |
| 15 | คิวรออนุมัติระดับ 1 — empty state | pharmacist/approval-queue-level1.html | ✅ Pass |
| 16 | พิจารณาคำขอ — อนุมัติระดับ 1 happy path (แก้ยอดคงเหลือที่เภสัชกรยืนยัน) | pharmacist/approval-review-level1.html | ✅ Pass |
| 17 | พิจารณาคำขอ — ปฏิเสธ happy path + validation เหตุผลบังคับกรอก | pharmacist/approval-review-level1.html | ✅ Pass |
| 18 | พิจารณาคำขอ — guard คำขอที่ถูกดำเนินการไปแล้ว (reload) | pharmacist/approval-review-level1.html | ✅ Pass |
| 19 | ผู้ช่วย AI (สรุปเบี่ยงเบน/ร่างเหตุผลปฏิเสธ) | pharmacist/approval-review-level1.html | 🚫 Blocked — ต้องรัน Cloudflare Worker (`wrangler dev`) ซึ่งไม่ได้อยู่ในคำสั่งรันเซิร์ฟเวอร์ที่ระบุมา (ดูรายละเอียด) |
| 20 | RBAC: staff_hph เปิด URL ตรงของ admin | admin/audit-trail.html | ✅ Pass (ถูกเด้งกลับ) |
| 21 | RBAC: staff_hph เปิด URL ตรงของ pharmacist | pharmacist/approval-queue-level1.html | ✅ Pass (ถูกเด้งกลับ) |
| 22 | RBAC: pharmacist เปิด URL ตรงของ staff_hph | staff-hph/requisition-list.html | ✅ Pass (ถูกเด้งกลับ) |
| 23 | RBAC: cross-unit isolation — เปิดรายละเอียดคำขอหน่วยอื่นตรงๆ | staff-hph/requisition-detail.html | ✅ Pass (permission-denied) |
| 24 | RBAC: cross-unit isolation — เปิดหน้ายืนยันรับยาของหน่วยอื่นตรงๆ | staff-hph/goods-receipt-confirm.html | ✅ Pass (permission-denied) |
| 25 | admin/audit-trail.html | — | 🚫 Blocked — ไม่มี credential admin ที่ใช้งานได้ |
| 26 | admin/user-accounts.html | — | 🚫 Blocked — ไม่มี credential admin ที่ใช้งานได้ |
| 27 | admin/system-settings.html | — | 🚫 Blocked — ไม่มี credential admin ที่ใช้งานได้ |
| 28 | `seed.html` ใช้ seed ข้อมูล/สร้างบัญชี admin ใหม่ | seed.html (dev tool) | ❌ Fail (ตามที่ README เตือนไว้แล้ว) — `Missing or insufficient permissions` |

**Pass:** 19 | **Fail (คาดไว้แล้วตามเอกสาร):** 1 | **Blocked:** 5 | **Observation:** 1

ไม่พบ console error ที่ไม่คาดคิดในทุก happy-path scenario — error ทุกรายการที่ปรากฏใน console log ล้วนมาจาก negative-path test ที่ตั้งใจทำ (login ผิด, cross-unit access, AI 501, seed.html permission-denied)

---

## 2. รายละเอียดต่อ Scenario

### 2.1 Login (`login.html`)

**Scenario 1–2 (login สำเร็จ):** กรอก `staff-hph-a@smartsync.test`/`Passw0rd!` → redirect ไป `staff-hph/requisition-list.html` อัตโนมัติ; กรอก `pharmacist-a@smartsync.test`/`Passw0rd!` → redirect ไป `pharmacist/approval-queue-level1.html` อัตโนมัติ ตรงตาม `app/README.md` หัวข้อ "Firebase Authentication" (`ROLE_HOME` map) — **Pass**

**Scenario 3 (login ล้มเหลว):** ทดลอง 2 ครั้ง — (ก) `admin-a@smartsync.test`/`Passw0rd!` (บัญชีไม่มีอยู่จริง) และ (ข) `admin-e2e@smartsync.test`/`Passw0rd!` (บัญชีมีจริงแต่รหัสผ่านเป็นค่าอื่น) — ทั้งสองครั้งแสดงข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ถูกต้อง ไม่ redirect — ตรงกับพฤติกรรมที่ `test-results.md` บันทึกไว้แล้วสำหรับ e2e อัตโนมัติ — **Pass**

**Scenario 4 (unauthenticated guard):** เปิด `http://localhost:4174/staff-hph/requisition-list.html` ตรงๆ โดยไม่ login → ถูก redirect ไป `login.html` ทันที ยืนยันด้วยการทำซ้ำกับหลายหน้า (ดู RBAC section) — **Pass**

### 2.2 รายการคำขอเบิกของหน่วยฉัน (`staff-hph/requisition-list.html`)

Login เป็น `staff-hph-a` → เห็นเฉพาะคำขอของหน่วย A (`HPH01`) เท่านั้น เรียงจากใหม่ไปเก่า มีคอลัมน์ครบตาม spec (รหัสคำขอ/ประเภท/วันที่ยื่น/สถานะ/การดำเนินการ) badge สถานะแสดงถูกต้องทั้ง "รอการอนุมัติระดับ 2", "ปฏิเสธ", "พร้อมส่งออก", "รับแล้ว" (คำนวณจาก `goodsReceiptRecords` ตามที่ `app/README.md` อธิบาย ไม่ใช่ enum จริง) — Login เป็น `staff-hph-b` → เห็นเฉพาะคำขอของหน่วย B (`HPH02`) เท่านั้น (1 รายการ) ไม่เห็นรายการของหน่วย A เลย — อ้างอิง ACL.md แถว "เจ้าหน้าที่ รพ.สต." คอลัมน์ "ทำไม่ได้" ("ดูยอดคงคลัง/คำขอเบิกของ รพ.สต. แห่งอื่น") — **Pass**

### 2.3 สร้างคำขอเบิกยาประจำเดือน (`staff-hph/requisition-new.html`)

- ยอดแนะนำเบิกคำนวณสด (`max(threshold - selfReportedBalance, 0)`) ทันทีที่พิมพ์ยอดคงเหลือ ตรงสูตรที่ `app/README.md` ระบุ (`lineItems.suggestedQuantity`) — ทดสอบ ยา A (เกณฑ์ 150, กรอก 50 → แนะนำ 100), ยา B (60→20→40), ยา C (90→10→80) — ยา D ไม่มีเกณฑ์ตั้งใจ แสดง "— (ยังไม่ตั้งเกณฑ์)" ถูกต้อง
- ปุ่ม "ขอปรึกษา" ปิดใช้งาน (disabled) ทุกแถวเสมอ ตรงกับ `app/README.md` หมายเหตุ (รอ BL-014) — **Pass**
- ยืนยันคำขอ → มี confirm modal สรุปจำนวนรายการ/หน่วย/รอบเดือนก่อนบันทึกจริง → บันทึกสำเร็จ ได้รหัส `REQ-256909-HPH01-006` สถานะ "รอการอนุมัติระดับ 1" ตรงตาม FR-1.1a — ตรวจสอบย้อนกลับที่ `requisition-detail.html` พบ `lineItems` ตรงกับที่กรอกทุกค่า (`requestedQuantity == suggestedQuantity` ตามที่ยังไม่มี "ขอปรึกษา" จริง) — **Pass**
- ทดสอบ validation: กรอกค่าติดลบ (`-10`) ในช่องยอดคงเหลือ → ขึ้นข้อความ inline "กรอกยอดคงเหลือเป็นจำนวนเต็มไม่ติดลบ" และปุ่ม "ยืนยันคำขอเบิก" ถูก disable ทันที (ป้องกันไม่ให้ submit) — **Pass**

### 2.4 รายละเอียดคำขอเบิก (`staff-hph/requisition-detail.html`)

หน้านี้ **ไม่ปรากฏใน `spec.md` §1** (ดู "ข้อค้นพบเอกสาร" ด้านล่าง) แต่มีโค้ดจริงทำงานสมบูรณ์ตาม `app/README.md`:

- แสดง status/ประเภท/รอบเดือน/วันที่ยื่นคำขอถูกต้อง ตรงกับ `requisitions` doc
- ตาราง "รายการยา" ครบทุกคอลัมน์ (ยอดขอเบิก/ยอดแนะนำ/ยอดคงเหลือที่แจ้ง/ยอดคงเหลือที่เภสัชกรยืนยัน/จำนวนที่อนุมัติ) — ทดสอบทั้งคำขอที่ยังไม่ผ่านอนุมัติ (แสดง "—") และผ่านอนุมัติแล้ว (แสดงค่าจริง เช่น `45`/`60`)
- ส่วน "ประวัติการพิจารณา" (`approvalRecords`) ปรากฏเฉพาะเมื่อมีการอนุมัติ/ปฏิเสธจริงแล้ว แสดงระดับ/ผล/เหตุผล/เวลาถูกต้องทั้งกรณีอนุมัติและปฏิเสธ
- **Observation (ไม่ใช่บั๊กที่เกิดจากการทดสอบนี้):** คำขอเก่า `REQ-256906-HPH01-001` (doc id `Pfq2HevOAappt4mAxLaR`, สถานะ "รับแล้ว" ในหน้ารายการ) เปิดในหน้ารายละเอียดพบว่า:
  - หัวข้อ "สถานะ" แสดง "จ่ายแล้ว" (ไม่ใช่ "รับแล้ว" แบบที่หน้ารายการคำนวณให้)
  - ตาราง "รายการยา" ว่างเปล่า ("คำขอนี้ยังไม่มีรายการยา") ทั้งที่ส่วน "การรับยา" ด้านล่างแสดงบันทึกรับยาจริงของ "ยา A" จำนวน 70
  - ไม่มี console error ระหว่างโหลด แปลว่าไม่ใช่ query ล้มเหลว — Firestore ไม่มี `lineItems` subcollection ของคำขอนี้จริงๆ
  - นี่คือข้อมูลเก่าที่มีอยู่แล้วในฐานข้อมูลก่อนเริ่มทดสอบรอบนี้ ไม่ได้เกิดจากการกระทำใดๆ ของผู้ทดสอบ — อาจตรงกับ edge case "orphan requisition" ที่ `app/README.md` หัวข้อ "ความปลอดภัย" บันทึกไว้ล่วงหน้าว่าเป็นไปได้ (กรณี batch เขียน `lineItems` fail หลัง `requisitions` doc commit ไปแล้ว) แต่ไม่สามารถยืนยันสาเหตุที่แท้จริงได้จากการทดสอบนี้เพียงอย่างเดียว — ระบุเป็น **finding** ให้ทีมพัฒนาตรวจสอบเพิ่มเติม ไม่ใช่ pass/fail เด็ดขาด
- **RBAC cross-unit:** login เป็น `staff-hph-a` แล้วเปิด URL ตรงของคำขอหน่วย B (`?id=9CJCr1veugOhwvHO3PA4`) → หน้าแสดง "โหลดข้อมูลไม่สำเร็จ: Missing or insufficient permissions. (ดู console)" ไม่รั่วข้อมูลใดๆ ออกมา — ตรงตาม ACL.md — **Pass**

### 2.5 ยืนยันรับยา (`staff-hph/goods-receipt-confirm.html`)

ไม่ปรากฏใน `spec.md` §1 เช่นกัน แต่ทดสอบ 3 negative-path ได้ครบ:

1. เปิดคำขอสถานะอื่น (เช่น "รอการอนุมัติระดับ 2") → ข้อความ "ยืนยันรับยาได้เฉพาะคำขอที่สถานะ \"จ่ายแล้ว\" เท่านั้น" — **Pass**
2. เปิดคำขอที่รับยาไปแล้ว → ข้อความ "คำขอนี้ยืนยันรับยาไปแล้ว" (กัน submit ซ้ำ ตรงกับ deterministic doc id `{requisitionId}_{drugItemId}` ที่ `app/README.md` อธิบาย) — **Pass**
3. เปิดคำขอหน่วยอื่นตรงๆ (cross-unit) → "โหลดข้อมูลไม่สำเร็จ: Missing or insufficient permissions." — **Pass**

**Blocked — happy path (สร้างบันทึกรับยาจริงครั้งแรก):** ในฐานข้อมูลทดสอบปัจจุบันไม่มีคำขอสถานะ "จ่ายแล้ว" ที่ยังไม่ถูกรับยา (ทุกคำขอที่มีอยู่เป็นสถานะอื่น หรือถ้าเป็น "จ่ายแล้ว" ก็ถูกรับไปแล้วก่อนหน้านี้) — เนื่องจากหน้าอนุมัติระดับ 2/ส่งออก Excel ยังไม่ถูกพัฒนา (ตาม `app/README.md` หัวข้อ "ขั้นต่อไป" ข้อ 1) จึงไม่มีทางสร้างคำขอสถานะ "จ่ายแล้ว" ใหม่ผ่าน UI จริงได้ในสภาพแวดล้อมนี้ และไม่สามารถ seed ข้อมูลใหม่ผ่าน `seed.html` ได้เนื่องจาก Firestore Security Rules ปัจจุบัน (ดู Fail item ด้านล่าง) — ทดสอบ happy path นี้ไม่ได้ในรอบนี้

### 2.6 คิวรออนุมัติระดับ 1 (`pharmacist/approval-queue-level1.html`)

Login เป็น `pharmacist-a` → เห็นคำขอ `pending_level1` **ทั้งเครือข่าย** (ทั้งหน่วย A และหน่วย B พร้อมกัน) ตรงตาม ACL.md ("อ่าน/เขียนข้อมูลคำขอเบิกได้ทั้งเครือข่าย") คอลัมน์ "ผู้ช่วย AI" แสดง "—" ทุกแถว (ไม่มี badge "เบี่ยงเบนมาก") — ตรงตามที่ `app/README.md` อธิบายไว้ว่าปัจจุบัน `requestedQuantity == suggestedQuantity` เสมอ (ปุ่ม "ขอปรึกษา" ยังไม่เปิดใช้งาน) จึง badge นี้แทบไม่มีทางขึ้นกับข้อมูลจริงในรอบนี้ — **ถูกต้องตามสเปค ไม่ใช่บั๊ก**

หลังอนุมัติ+ปฏิเสธคำขอทั้ง 2 รายการที่มีอยู่สำเร็จ กด "รีเฟรช" → แสดง "ไม่มีคำขอที่รออนุมัติระดับ 1" (empty state) ถูกต้อง — **Pass**

### 2.7 พิจารณาคำขอ/อนุมัติ-ปฏิเสธระดับ 1 (`pharmacist/approval-review-level1.html`)

**Reject flow (คำขอ `REQ-256909-HPH01-006` ที่สร้างขึ้นเองเพื่อทดสอบ):**
- ปุ่ม "ยืนยันปฏิเสธคำขอ" เป็น `disabled` จนกว่าจะกรอกเหตุผล (บังคับกรอก ตรงตาม `approvalRecords.reason` "บังคับเฉพาะ rejected/adjusted") — พิมพ์เหตุผลแล้วปุ่มเปิดใช้งานทันที
- ยืนยันปฏิเสธ → ข้อความ "ปฏิเสธคำขอสำเร็จ — บันทึกเหตุผลและสถานะเป็น \"ปฏิเสธ\" แล้ว" → ตรวจสอบที่ `requisition-detail.html` ภายหลังพบ `approvalRecords` บันทึกเหตุผลและเวลาไว้ถูกต้อง — **Pass**

**Approve flow (คำขอ `REQ-256909-HPH02-001`):**
- กรอกยอดคงเหลือที่เภสัชกรยืนยัน (ยา A: 45) แล้วกด "อนุมัติระดับ 1" → confirm modal สรุปจำนวนรายการ/สถานะถัดไปถูกต้อง → ยืนยัน → "อนุมัติระดับ 1 สำเร็จ — สถานะเปลี่ยนเป็น \"รอการอนุมัติระดับ 2\" แล้ว" → ตรวจสอบที่ `requisition-detail.html` พบ `pharmacistConfirmedBalance=45`, `approvedQuantity=60/0` และ `approvalRecords` บันทึกถูกต้อง — **Pass**

**Guard คำขอที่ถูกดำเนินการไปแล้ว:** เปิด URL เดิมซ้ำหลังอนุมัติสำเร็จ → ข้อความ "คำขอนี้ถูกดำเนินการไปแล้ว — สถานะปัจจุบัน: รอการอนุมัติระดับ 2" ไม่มีปุ่มอนุมัติ/ปฏิเสธให้กดซ้ำ — สอดคล้องกับ Optimistic Concurrency Check (FR-6.5/BL-036) ที่ `app/README.md` ยืนยันว่าทดสอบผ่านมาก่อนแล้ว — **Pass**

**ผู้ช่วย AI (ทั้งปุ่ม "เรียกดูผู้ช่วย AI" และ "ให้ AI ช่วยร่างข้อความเหตุผล"):** กดแล้วได้ error "เรียกผู้ช่วย AI ไม่สำเร็จ (501)" — สาเหตุคือ `/api/ai-assist` เป็น endpoint ที่ให้บริการโดย **Cloudflare Worker** (`app/_worker.js`) เท่านั้น ซึ่งใช้งานได้เฉพาะเมื่อรันผ่าน `npx.cmd wrangler dev --persist-to ..\.wrangler-state` (ต้องมี `app/.dev.vars` ใส่ `OPENROUTER_API_KEY`) — คำสั่งรันเซิร์ฟเวอร์ที่ระบุมาให้ใช้ (`py .claude/no-cache-server.py 4174 --directory app`) เป็น static file server ธรรมดา ไม่รองรับ `_worker.js` จึงตอบ `501 Unsupported method` เสมอ — **นี่คือข้อจำกัดของสภาพแวดล้อมทดสอบที่ระบุมา ไม่ใช่บั๊กของแอป** แต่หมายความว่า **ไม่สามารถทดสอบความสามารถ (ก)/(ข) ของผู้ช่วย AI จริงในรอบนี้ได้** (Blocked) — สิ่งที่ยืนยันได้คือ error handling ฝั่ง UI ทำงานถูกต้อง (แสดงข้อความ error ที่อ่านง่าย + ปุ่ม "ปิด" ปิด modal ได้ปกติ ไม่ค้าง ไม่ทำให้หน้าอื่นพัง)

### 2.8 RBAC boundaries (ACL.md)

ทดสอบทุกคู่ role/หน้าจอที่ทำได้จริงในรอบนี้ (ดูตารางสรุป) — **ทุกกรณี pass**: ระบบไม่เคย "รั่ว" ข้อมูลออกมาก่อน redirect/ปฏิเสธ ไม่ว่าจะเป็นการ block ที่ชั้น `watchAuth`/`expectedRole` guard (redirect กลับ) หรือชั้น Firestore Security Rules (`permission-denied` message ที่อ่านง่าย ไม่ expose raw error stack ให้ผู้ใช้ทั่วไป)

### 2.9 Admin screens (`admin/audit-trail.html`, `admin/user-accounts.html`, `admin/system-settings.html`)

**Blocked ทั้ง 3 หน้า** — ไม่มี credential บัญชี `role: admin` ที่ใช้งานได้จริงในสภาพแวดล้อมทดสอบนี้:
- `admin-a@smartsync.test` (ที่ `app/seed.html` ตั้งใจสร้างไว้) **ไม่มีอยู่จริง** ในระบบ (`auth/invalid-credential`) — แปลว่ายังไม่เคย seed สำเร็จมาก่อนภายใต้ Firestore Rules ชุดปัจจุบัน
- `admin-e2e@smartsync.test` (บัญชีที่ `test-results.md` ระบุว่าสร้างไว้แล้วจริงผ่าน `admin/user-accounts.html`) มีอยู่จริงแต่ **รหัสผ่านเป็นค่าสุ่มที่ระบบสร้างให้ตอนสร้างบัญชี ไม่ได้ถูกบันทึกไว้ที่ไหนที่ผู้ทดสอบเข้าถึงได้**
- ทดลองรัน `seed.html` เพื่อสร้าง/รีเซ็ตบัญชี admin ใหม่ → ได้ error **"เกิดข้อผิดพลาด: Missing or insufficient permissions."** ทันทีที่ขั้นแรก (เขียน `units`) — ยืนยันตรงตามที่ `app/README.md` หัวข้อ "ผลกระทบต่อ seed.html (dev tool)" เตือนไว้ล่วงหน้าแล้วว่ากฎ Firestore Security Rules ชุดปัจจุบัน (ต้อง login ก่อนเขียนทุก collection แต่ `seed.html` เขียนผ่าน instance ที่ไม่เคย authenticate) จะทำให้ `seed.html` ใช้งานไม่ได้อีกต่อไป — **นี่คือพฤติกรรมที่ตรงกับเอกสารเป๊ะ ไม่ใช่บั๊กใหม่** แต่เป็นการยืนยันด้วยการทดสอบจริงว่าปัญหานี้ยังคงอยู่ (ยังไม่มีทางแก้ตามที่ README เสนอ 3 ทางเลือกไว้ถูกนำไปใช้จริง)
- ไม่มีสิทธิ์เข้าถึง Firebase Console โดยตรงในฐานะ tester agent เพื่อสร้างบัญชี admin ใหม่ หรือดูรหัสผ่านที่ถูกสุ่มไว้ก่อนหน้า

**ผลกระทบ:** ไม่สามารถทดสอบ happy path หรือ RBAC เชิงบวกของทั้ง 3 หน้าจอ admin ได้เลยในรอบนี้ (ทดสอบได้เฉพาะ negative path จากฝั่ง role อื่นที่ถูกกันไม่ให้เข้าถึง — ดู RBAC section ข้อ 20)

---

## 3. Failures (ตามที่พบจริง — ไม่ใช่คำแนะนำแก้โค้ด)

### Failure 1 — `seed.html` เขียนข้อมูลไม่ได้เลยภายใต้ Firestore Rules ปัจจุบัน

**Repro steps:**
1. เปิด local dev server ตามปกติ (`py .claude/no-cache-server.py 4174 --directory app`)
2. เปิด `http://localhost:4174/seed.html`
3. กดปุ่ม "Seed ข้อมูลตัวอย่าง"

**Expected (ตาม `app/seed.html` เจตนา):** สร้าง/อัปเดตหน่วยงาน, รายการยา, เกณฑ์ safety stock, ค่าตั้งค่าระบบ, คำขอเบิกตัวอย่าง, และบัญชีทดสอบ 5 บัญชี (staff 2, pharmacist 2, admin 1)

**Actual:** ล้มเหลวทันทีที่ขั้นตอนแรก (`setDoc(doc(db, "units", ...))`) ด้วยข้อความ `เกิดข้อผิดพลาด: Missing or insufficient permissions.` — ไม่มีข้อมูลใดถูกเขียน/อัปเดตเลย

**หมายเหตุ:** พฤติกรรมนี้ **ถูกบันทึกไว้แล้วล่วงหน้า** ใน `app/README.md` หัวข้อ "ผลกระทบต่อ `seed.html` (dev tool) — สำคัญ" ว่าจะเกิดขึ้น (เพราะ `db` ใน `seed.html` เขียนผ่าน Firestore instance ที่ไม่เคย authenticate เลย ขณะที่ `firestore.rules` ปัจจุบันต้อง `request.auth != null` เป็นอย่างน้อยแทบทุก collection) — รายงานที่นี่เพื่อ**ยืนยันด้วยการทดสอบจริง**ว่ายังไม่มีทางแก้ 3 ทางเลือกใดที่ README เสนอไว้ถูกนำไปปฏิบัติจริง ทำให้ทีมทดสอบ/พัฒนาคนถัดไปที่ต้องการ seed ข้อมูลใหม่ (เช่น บัญชี admin) จะต้องเจอปัญหาเดียวกันนี้ทุกครั้ง

---

## 4. Blocked scenarios (ต้องการข้อมูล/สิทธิ์เพิ่มเติมเพื่อทดสอบต่อ)

| Scenario | เหตุผลที่ Blocked | ต้องการอะไรเพื่อปลดบล็อก |
|---|---|---|
| Admin 3 หน้าจอ (audit-trail, user-accounts, system-settings) — happy path ทั้งหมด | ไม่มี credential บัญชี `role: admin` ที่ใช้งานได้จริง (ดู Failure 1) | credential บัญชี admin ที่ใช้ได้จริง หรือแก้ปัญหา seed.html ก่อน |
| ผู้ช่วย AI ความสามารถ (ก)/(ข) — เรียกจริงได้ผลลัพธ์จาก OpenRouter | ต้องรันผ่าน `wrangler dev` พร้อม `OPENROUTER_API_KEY` ใน `.dev.vars` ซึ่งไม่ได้อยู่ในคำสั่งรันเซิร์ฟเวอร์ที่ระบุมาให้ใช้ | รันคำสั่ง `npx.cmd wrangler dev --persist-to ..\.wrangler-state` แทน (ตาม `app/README.md`) พร้อมคีย์ OpenRouter จริง |
| ยืนยันรับยา (`goods-receipt-confirm.html`) — happy path สร้างบันทึกรับยาจริงครั้งแรก | ไม่มีคำขอสถานะ "จ่ายแล้ว" ที่ยังไม่ถูกรับยาในฐานข้อมูลทดสอบ และไม่มีทางสร้างสถานะนี้ผ่าน UI จริง (อนุมัติระดับ 2/ส่งออกยังไม่มีโค้ด) | seed ข้อมูลคำขอสถานะ "จ่ายแล้ว" ใหม่ (ติด Failure 1 เช่นกัน) หรือรอ Epic อนุมัติระดับ 2 |
| Optimistic Concurrency Check แบบ 2 แท็บพร้อมกันจริง (แก้ไขค่าพร้อมกัน 2 session) | ไม่ได้ทดสอบในรอบนี้เนื่องจากเวลาจำกัด — README ระบุว่าเคยทดสอบผ่านมาก่อนแล้วด้วยวิธีอื่น (recordVersion เก่า) | เปิด 2 tab/session พร้อมกันถ้าต้องการยืนยันซ้ำ |

---

## 5. ข้อค้นพบเชิงเอกสาร (Documentation findings — ไม่ใช่บั๊กโค้ด)

1. **`spec.md` §1 ตารางหน้าจอ ล้าสมัยกว่า `app/README.md`:** `spec.md` (แก้ล่าสุดระบุ "ณ 20260920" ในหัวเอกสาร) ยังคงแสดงเฉพาะ 5 หน้าจอ (login, requisition-list, requisition-new, approval-queue-level1, approval-review-level1) และย่อหน้า "สิ่งที่ยังไม่มีหน้าจอจริง" ยังระบุว่า "หน้ารายละเอียดคำขอ ... audit-trail, admin จัดการบัญชี/ตั้งค่าระบบ ... ยังไม่มีโค้ด" — แต่จากการทดสอบจริงพบว่า **มีโค้ดทำงานได้แล้วจริง** ทั้ง 5 หน้าจอเพิ่มเติม: `staff-hph/requisition-detail.html`, `staff-hph/goods-receipt-confirm.html`, `admin/audit-trail.html` (ทดสอบเข้าไม่ได้เพราะ RBAC แต่ guard ทำงานถูกต้อง แปลว่าไฟล์และ route มีจริง), `admin/user-accounts.html`, `admin/system-settings.html` — ตรงกับ `app/README.md` ที่ระบุว่าเพิ่มหน้าจอเหล่านี้ทั้งหมดเมื่อ "20260920" ก่อนหน้า `spec.md` ถูกเขียน (snapshot) เล็กน้อย — เนื่องจาก `spec.md` เขียนไว้ชัดเจนเองว่า "ถ้าเนื้อหาที่นี่ขัดกับ `app/README.md` ให้ถือว่า `app/README.md` ถูกต้องกว่าเสมอ" นี่จึงไม่ใช่ข้อขัดแย้งที่ทำให้ทดสอบผิดพลาด (ผู้ทดสอบยึด README เป็นหลักตามกฎ) แต่เป็น **finding ที่ควรแจ้งเจ้าของ spec ให้พิจารณา re-sync `spec.md`** เนื่องจากผู้อ่าน spec.md เพียงอย่างเดียว (ไม่เปิด README) จะเข้าใจผิดว่า 5 หน้าจอนี้ยังไม่มีโค้ด

---

## 6. Open Questions (ต้องให้เจ้าของระบบตัดสินใจ — ไม่ได้เดาเอง)

1. **สถานะ "จ่ายแล้ว" vs "รับแล้ว" ในหน้ารายละเอียดคำขอ:** `staff-hph/requisition-list.html` คำนวณ label "รับแล้ว" จากการมี `goodsReceiptRecords` (ตามที่ `app/README.md` ระบุชัดเจน) แต่ `staff-hph/requisition-detail.html` แสดง "จ่ายแล้ว" ตรงๆ จาก `status` enum โดยไม่ทำการคำนวณแบบเดียวกัน (แม้จะมีตาราง "การรับยา" แยกแสดงอยู่ด้านล่างอยู่แล้วก็ตาม) — **ไม่ชัดเจนว่านี่เป็นความตั้งใจ** (ให้ label บนสุดคงที่ตาม enum จริงเสมอ ส่วนรายละเอียดการรับยาให้ดูจากตารางด้านล่างแทน) **หรือเป็นช่องว่างที่ควรทำให้สอดคล้องกับหน้ารายการ** — ไม่มีข้อความใน `spec.md`/`app/README.md` ที่ระบุพฤติกรรมของหัวข้อ "สถานะ" บนหน้ารายละเอียดคำขอโดยเฉพาะ จึงไม่ตัดสินใจเองว่าถูกหรือผิด
2. **ข้อมูล orphan requisition (`Pfq2HevOAappt4mAxLaR`, ไม่มี `lineItems` แต่มี `goodsReceiptRecords`):** เป็นข้อมูลเก่าที่มีอยู่ก่อนการทดสอบรอบนี้ ไม่ทราบที่มาแน่ชัด (อาจเกิดจาก edge case ที่ README เตือนไว้ล่วงหน้า หรืออาจเป็นข้อมูลที่สร้างด้วยวิธีอื่น) — ควรให้ผู้ที่เข้าถึง Firebase Console ตรวจสอบ history/สาเหตุจริงหรือลบทิ้งถ้าเป็น dev artifact เก่าที่ไม่ต้องการแล้ว
3. **บัญชี admin สำหรับทดสอบ:** ต้องการให้ตั้งค่า credential บัญชี `role: admin` ที่ tester agent เข้าถึงได้ในรอบทดสอบถัดไปอย่างไร (เช่น เก็บไว้ในไฟล์ local ที่ไม่ commit, หรือแก้ปัญหา `seed.html`/Firestore Rules ให้ seed ได้อีกครั้งด้วยวิธีใดวิธีหนึ่งจาก 3 ทางเลือกที่ README เสนอไว้) — ไม่ได้เลือกทำเองเพราะเป็นการตัดสินใจเรื่อง security posture ที่ต้องผ่านเจ้าของระบบ

---

## 7. ข้อมูลทดสอบที่สร้าง/เปลี่ยนแปลงระหว่างการทดสอบนี้ (เพื่อความโปร่งใส)

การทดสอบนี้เป็นแบบ end-to-end ผ่าน UI จริงตามที่ได้รับมอบหมาย จึงมีการเขียนข้อมูลจริงลง Firestore ของโปรเจกต์ `syncsmart-98d1e` (dev/test data เท่านั้น ไม่ใช่ข้อมูลคลินิกจริง) ดังนี้:
- สร้างคำขอเบิกใหม่ 1 รายการ: `REQ-256909-HPH01-006` (หน่วย A) — ภายหลังถูกปฏิเสธ (สถานะสุดท้าย: `rejected`, เหตุผล "ทดสอบระบบ - QA manual test (ปฏิเสธเพื่อทดสอบ flow)")
- อนุมัติระดับ 1 คำขอที่มีอยู่แล้ว 1 รายการ: `REQ-256909-HPH02-001` (หน่วย B) — สถานะเปลี่ยนจาก `pending_level1` เป็น `pending_level2`, ตั้ง `pharmacistConfirmedBalance=45` (ยา A), `approvedQuantity=60/0`

ไม่มีการแก้ไขไฟล์โค้ด/config ใดๆ ในโปรเจกต์ระหว่างการทดสอบ (ตามกฎ "ห้ามแก้โค้ด" ของ tester agent)

---

## 8. Environment cleanup

- Local dev server (`no-cache-server.py`, port 4174) ถูก terminate เรียบร้อยหลังทดสอบเสร็จ (ยืนยันด้วย `curl` ไม่สามารถเชื่อมต่อได้อีก)
- Browser tabs ทั้งหมดถูกปิดแล้ว

---

## 9. Follow-up (2026-09-20, ช่วงบ่าย) — Scoped re-test: submit คำขอเบิกแบบข้อมูลไม่ครบ (`requisition-new.html`)

**คำขอจากเจ้าของระบบ (เภสัชกร):** ตรวจสอบเจาะจงเฉพาะพฤติกรรมของหน้า "สร้างคำขอเบิกยาประจำเดือน" (`app/staff-hph/requisition-new.html`, FT-001/BL-001/BL-002) เมื่อพยายาม submit ฟอร์มที่ข้อมูลไม่ครบ — ความคาดหวังที่ระบุมา (ยังไม่ยืนยันว่าเป็น requirement ที่บันทึกไว้เป็นทางการหรือไม่): **ระบบต้องไม่บันทึกคำขอ และต้องแจ้งผู้ใช้ว่าตรงไหนผิด**

**Environment:** Local dev server เดิม (`py .claude/no-cache-server.py 4174 --directory app`, `http://localhost:4174`) เชื่อมต่อ Firestore/Firebase Authentication โปรเจกต์จริง `syncsmart-98d1e` (session ของ `staff-hph-a@smartsync.test` ยังคง persist จากรอบทดสอบก่อนหน้าในเบราว์เซอร์เดียวกัน จึงไม่ต้อง login ซ้ำ)
**บัญชีทดสอบที่ใช้:** `staff-hph-a@smartsync.test` (`staff_hph`, หน่วย A/HPH01)

### 9.1 ตรวจสอบเอกสารก่อนทดสอบ — เป็น requirement ที่บันทึกไว้แล้วหรือไม่

- **`01-requirements/backlog.md` (BL-001/BL-002):** AC แบบย่อของ BL-002 **ไม่ได้พูดถึง** กรณี "ข้อมูลไม่ครบ" ตรงๆ (มีแค่ happy path: "กรอกยอดคงเหลือปัจจุบันของแต่ละรายการและกดยืนยันคำขอ → ระบบบันทึกคำขอสถานะ 'รอการอนุมัติระดับ 1'")
- **`01-requirements/04-test-design/acceptance-criteria.md` (BL-002):** มีการขยายไว้แล้วจริง เป็น 2 scenario ที่เกี่ยวข้องตรงกับที่ทดสอบวันนี้:
  - **Scenario 2 (validation error):** "Given กำลังกรอกยอดคงเหลือของรายการยา, When กรอกค่าที่ไม่ใช่ตัวเลข หรือค่าติดลบ, Then **[ถือว่า]** ระบบต้องปฏิเสธการบันทึกและแจ้งให้แก้ไขก่อนยืนยันคำขอ"
  - **Scenario 3 (edge — กรอกไม่ครบ):** "Given มีรายการยาที่ยังไม่ได้กรอกยอดคงเหลือครบทุกรายการ, When กดยืนยันคำขอ, Then **[ถือว่า]** ระบบต้องไม่ยืนยันคำขอจนกว่าจะกรอกครบทุกรายการยา"
  - ทั้งสอง scenario ถูกทำเครื่องหมาย **`[ถือว่า]`** โดย `test-design-writer` เอง (ดูหมายเหตุท้ายไฟล์ 20260816: "scenario ที่ทำเครื่องหมาย `[ถือว่า...]` เป็นข้อสมมติฐานมาตรฐาน QA/UX ที่ยังไม่ยืนยันจาก spec") — แปลว่า **นี่คือ "ความคาดหวังมาตรฐาน" ที่ทีมเอกสารเติมเข้ามาเอง ไม่ใช่ requirement ที่เภสัชกรเจ้าของระบบเคยยืนยันโดยตรงผ่านสเปกหลัก (spec 002)** ตรงกับที่ผู้ขอทดสอบระบุว่า "ยังไม่ยืนยันว่าเป็นทางการหรือไม่" — สรุป: **มีบันทึกไว้แล้วบางส่วนใน acceptance-criteria.md แต่เป็นสถานะ `[ถือว่า]` (สมมติฐาน QA มาตรฐาน) ไม่ใช่ FR ที่ยืนยันแล้วใน spec.md/spec 002**
- **`spec.md`:** ไม่มีการพูดถึงพฤติกรรม validation ของฟอร์มนี้เลย (เอกสารสรุปโค้ดจริงไม่ได้ลงรายละเอียดระดับ field validation)

### 9.2 โครงสร้างฟอร์มจริง (จากอ่านโค้ด `requisition-new.html`)

ฟอร์มมีเฉพาะ **ช่องกรอกเดียวต่อรายการยา** ที่บังคับ (ยอดคงเหลือปัจจุบัน, `.balance-input`) ค่าเริ่มต้นคือ `"0"` (ผ่าน validation อยู่แล้วตั้งแต่โหลดหน้า) ปุ่ม "ขอปรึกษา"/ช่องยอดขอเบิกจริงยัง `disabled` เสมอในรอบนี้ (รอ BL-014) จึงไม่มีช่องบังคับอื่นให้ทดสอบเพิ่มในหน้านี้ — ทดสอบ 4 รูปแบบของ "ข้อมูลไม่ครบ/ไม่ถูกต้อง" ต่อช่องนี้:

| # | รูปแบบที่ทดสอบ | ผลลัพธ์จริง |
|---|---|---|
| 1 | ลบค่าในช่อง "ยอดคงเหลือปัจจุบัน" ของยา A ให้เป็นค่าว่าง (empty string) | ปุ่ม "ยืนยันคำขอเบิก" กลายเป็น **HTML `disabled` จริง** (ยืนยันด้วยการที่ Playwright เองปฏิเสธคลิกปุ่มนี้ พร้อม error "element is not enabled") + ข้อความ inline ใต้ช่อง: "กรอกยอดคงเหลือเป็นจำนวนเต็มไม่ติดลบ" ปรากฏขึ้น |
| 2 | กรอกค่าติดลบ (`-5`) ในช่องเดียวกัน | เหมือนข้อ 1 ทุกประการ (ปุ่ม disabled จริง + ข้อความ error เดิมปรากฏ) |
| 3 | กรอกข้อความที่ไม่ใช่ตัวเลข (`abc`) ในช่องเดียวกัน | เหมือนข้อ 1 ทุกประการ |
| 4 | ทำให้ 2 แถวว่างพร้อมกัน (ยา B และยา C) หลังแก้ยา A ให้ถูกต้องแล้ว | ข้อความ error ปรากฏพร้อมกันทั้ง 2 แถวที่ว่าง ปุ่มยังคง disabled เหมือนเดิม |

**ยืนยันว่าไม่มีการบันทึกลง Firestore จริง:** หลังทำทั้ง 4 รูปแบบข้างต้น (ไม่เคยคลิกปุ่มสำเร็จเลยเพราะเป็น real `disabled` attribute) ตรวจสอบ Network tab พบเฉพาะ Firestore `Listen` channel (real-time read listener) ไม่มี request เขียนข้อมูล (`Commit`) ใดๆ เกิดขึ้น — และเปิด `staff-hph/requisition-list.html` ซ้ำหลังทดสอบ พบว่ารายการยังคงเดิมทุกประการ (8 รายการ, รหัสล่าสุดยังเป็น `REQ-256909-HPH01-006` เท่ากับก่อนทดสอบ) — **ยืนยันว่าไม่มีการบันทึกคำขอที่ไม่ครบ/ไม่ถูกต้องเข้า Firestore เลย**

**Console:** ไม่มี error/warning ใดๆ ตลอดการทดสอบทั้ง 4 รูปแบบ

### 9.3 สรุปผล

**ส่วน "ต้องไม่บันทึก" — ทำงานถูกต้อง (Pass):** ปุ่ม "ยืนยันคำขอเบิก" ใช้ HTML `disabled` attribute จริง (ไม่ใช่แค่ล็อกด้วย JS event handler) ทำให้ผู้ใช้ (และแม้แต่ automation) ไม่สามารถกดยืนยันได้เลยตราบใดที่มีอย่างน้อย 1 ช่องยอดคงเหลือว่าง/ติดลบ/ไม่ใช่ตัวเลข ยืนยันด้วย Network tab ว่าไม่มีการเขียนข้อมูลเกิดขึ้นจริงในทุกกรณี — ตรงตาม Scenario 2 และ 3 ของ BL-002 ใน acceptance-criteria.md

**ส่วน "ต้องแจ้งผู้ใช้ว่าตรงไหนผิด" — ทำงานได้บางส่วน มีข้อสังเกตด้าน UX ที่ควรแจ้งเจ้าของระบบ (ไม่ใช่ Fail เด็ดขาด แต่ไม่ใช่ Pass ที่สมบูรณ์เช่นกัน):**

1. **ข้อความ error มีจริง** — inline text "กรอกยอดคงเหลือเป็นจำนวนเต็มไม่ติดลบ" ปรากฏใต้ช่องที่ผิดพลาดทุกครั้ง ตรงตำแหน่ง ตรงประเด็น ครอบคลุมทั้ง 3 กรณี (ว่าง/ติดลบ/ไม่ใช่ตัวเลข) ด้วยข้อความเดียวกัน — อ่านเข้าใจได้
2. **แต่ข้อความ error ไม่ถูกเน้นสี (ไม่ใช่สีแดง/สีเตือนใดๆ)** — ตรวจสอบ CSS พบว่า `app/assets/components.css` บรรทัด 90 กำหนด `.form-field .field-error { color: var(--color-danger); ... }` แต่ใน `requisition-new.html` ช่อง error ของตารางนี้เป็น `<div class="field-error">` ที่อยู่ใน `<td>` โดยตรง **ไม่ได้อยู่ภายใน `.form-field`** ตามที่ selector กำหนด — ทำให้กฎสี `--color-danger` **ไม่ถูกนำไปใช้จริง** ข้อความ error จึงแสดงเป็นสีข้อความปกติ (ไม่ต่างจากข้อความอื่นบนหน้า) ยืนยันด้วยภาพหน้าจอจริง (ดูด้านล่าง)
3. **ปุ่ม "ยืนยันคำขอเบิก" ไม่มีสไตล์ภาพสำหรับสถานะ disabled** — ตรวจสอบ CSS ทั้ง `app/assets/components.css` (ไม่มี selector `[disabled]` ใดๆ เลยในไฟล์) และ `<style>` ฝังในหน้านี้เอง (มีแค่ `.btn-secondary[disabled]` ที่ใช้กับปุ่ม "ขอปรึกษา" เท่านั้น ไม่มี `.btn-primary[disabled]`) — ปุ่มสีเขียวทึบเหมือนเดิมทุกประการไม่ว่าจะ enabled หรือ disabled จริง (ต่างกันแค่ attribute ใน DOM ที่ผู้ใช้ทั่วไปมองไม่เห็น) ผู้ใช้ที่ไม่สังเกตข้อความ error เล็กๆ ใต้ช่องกรอกอาจเข้าใจผิดว่าปุ่มกดได้ปกติแล้วพยายามกดซ้ำหลายครั้งโดยไม่รู้ว่าทำไมไม่มีอะไรเกิดขึ้น (ไม่มี toast/alert แจ้งเพิ่มเติมเมื่อพยายามคลิกปุ่มที่ disabled อยู่)

**สรุปเทียบกับความคาดหวังของเจ้าของระบบ:** "ต้องไม่บันทึก" → **ยืนยันว่าทำงานถูกต้อง 100%** ในทุกรูปแบบที่ทดสอบ "ต้องแจ้งผู้ใช้ว่าตรงไหนผิด" → **มีข้อความแจ้งจริง เนื้อหาถูกต้อง แต่การนำเสนอทางภาพ (visual feedback) มีจุดบกพร่อง 2 จุดที่อาจทำให้ผู้ใช้จริงไม่สังเกตเห็นว่าเกิดปัญหาขึ้น** โดยเฉพาะเมื่อรวมกับปุ่ม submit ที่ดูเหมือนกดได้ปกติเสมอ

**หลักฐาน:** ภาพหน้าจอ `manual-test-req-new-empty-field.png` (บันทึกไว้ที่ root ของโปรเจกต์ระหว่างทดสอบ) แสดงให้เห็นข้อความ error สีเดียวกับข้อความปกติ และปุ่ม "ยืนยันคำขอเบิก" สีเขียวทึบตามปกติ ทั้งที่ขณะนั้นปุ่มถูก disable จริงอยู่เบื้องหลัง

### 9.4 Repro steps (สำหรับนักพัฒนา)

1. เปิด local dev server: `py .claude/no-cache-server.py 4174 --directory app` แล้วเปิด `http://localhost:4174/login.html`
2. Login ด้วย `staff-hph-a@smartsync.test` / `Passw0rd!`
3. ไปที่ `staff-hph/requisition-new.html`
4. คลิกช่อง "ยอดคงเหลือปัจจุบัน" ของรายการยาใดก็ได้ แล้วลบค่าให้ว่างเปล่า (หรือพิมพ์ `-5` หรือ `abc`)
5. สังเกต: (ก) ข้อความ "กรอกยอดคงเหลือเป็นจำนวนเต็มไม่ติดลบ" ปรากฏขึ้นแต่เป็นสีข้อความปกติ ไม่ใช่สีแดง/สีเตือน (เทียบกับ `--color-danger` ที่ตั้งใจไว้ใน `components.css` แต่ selector `.form-field .field-error` ไม่ครอบคลุมโครงสร้าง DOM ของหน้านี้) (ข) ปุ่ม "ยืนยันคำขอเบิก" ยังแสดงผลเป็นสีเขียวทึบเหมือนสถานะปกติทุกประการ ทั้งที่ตรวจสอบด้วย accessibility tree/DOM แล้วพบว่ามี attribute `disabled` จริง

### 9.5 Open question เพิ่มเติมจากรอบนี้

- **สถานะของ AC ที่ทำเครื่องหมาย `[ถือว่า]` ใน acceptance-criteria.md (BL-002 Scenario 2-3):** ยังไม่เคยผ่านการยืนยันจากเจ้าของระบบโดยตรงในสเปกหลัก (`01-requirements/01-spec/20260816-002-ncd-drug-requisition-core.md`, FR-1.1a) ว่า "ห้ามบันทึกคำขอที่ข้อมูลไม่ครบ + ต้องแจ้งเตือน" เป็นกฎที่ยืนยันแล้วจริง หรือเป็นแค่สมมติฐานมาตรฐาน QA — ถ้าต้องการให้เป็น requirement ที่ยืนยันแล้วอย่างเป็นทางการ (รวมถึงระดับความชัดเจนของการแจ้งเตือนที่ต้องการ เช่น ต้องเป็นสีแดงชัดเจน/ต้องมี toast แยกต่างหากหรือไม่) แนะนำให้ยืนยันผ่าน spec 002 โดยตรง ไม่ใช่ปล่อยเป็น `[ถือว่า]` ต่อไป — ไม่ได้ตัดสินใจเองว่าระดับความชัดเจนของ UI ที่ "เพียงพอ" ควรเป็นอย่างไร เพราะเป็นเรื่อง UX/policy ที่เจ้าของระบบควรเป็นผู้กำหนด

### 9.6 Environment cleanup (รอบนี้)

- Local dev server (`no-cache-server.py`, port 4174, PID 22252) ถูก terminate เรียบร้อยหลังทดสอบเสร็จ (ยืนยันด้วย `curl` ไม่สามารถเชื่อมต่อได้อีก)
- Browser tab ถูกปิดแล้ว (`browser_close`)
- ไม่มีข้อมูลใหม่ถูกเขียนลง Firestore ในรอบทดสอบนี้ (ยืนยันจากหน้ารายการคำขอเบิกที่ไม่เปลี่ยนแปลง)

---

## 10. Follow-up #2 (2026-09-20, ช่วงเย็น) — ตรวจสอบการแก้ไข 2 บั๊ก CSS จาก Section 9 (Playwright แบบ headed)

**บริบท:** หลัง section 9 เจ้าของระบบ (ไม่ใช่ tester agent นี้) แก้โค้ด 2 จุดเอง:
1. `app/assets/components.css`: เพิ่ม `.btn[disabled]`, `.btn-primary[disabled]`/`.btn-danger[disabled]`, `.btn-secondary[disabled]` (พื้นหลัง/ตัวอักษรสีจางผ่าน `--color-bg-muted`/`--color-text-disabled`) และเปลี่ยน selector สีข้อความ error จาก `.form-field .field-error` เป็น `.field-error` เฉยๆ (ไม่ผูกกับ ancestor อีกต่อไป)
2. `app/staff-hph/requisition-new.html`: ลบ `.btn-secondary[disabled]` ที่ซ้ำซ้อนออกจาก `<style>` ในไฟล์ (รวมศูนย์ไว้ที่ `components.css` แล้ว)

**งานของรอบนี้:** ตรวจสอบอิสระ (ไม่เชื่อคำอธิบายเฉยๆ) ว่าทั้ง 2 บั๊กแก้จริงหรือไม่ ผ่านการดู computed/rendered สี ไม่ใช่แค่ดูว่าข้อความ error ปรากฏ + ตรวจ regression บนหน้าจออื่นที่ใช้ `.field-error`/ปุ่ม disabled ร่วมกัน — **ไม่มีการแก้โค้ดใดๆ โดย tester agent ในรอบนี้**

**Environment:** ใช้ local dev server ที่รันอยู่แล้วก่อนเริ่มงาน (พบ process listening ที่ port 4174 ตั้งแต่ก่อนเริ่ม — ไม่ได้ถูกสตาร์ทโดย tester agent ในรอบนี้ จึงไม่ได้ terminate ตอนจบตามกฎ "kill เฉพาะที่ตัวเองสตาร์ท" — ดู 10.5) ยืนยันว่า serve ไฟล์เวอร์ชันล่าสุดจริงด้วย `curl` อ่าน `components.css` ที่ส่งมาจากเซิร์ฟเวอร์ก่อนเริ่มทดสอบ พบ `.btn[disabled]`/bare `.field-error` ตรงกับไฟล์ในเครื่องแล้ว — เชื่อมต่อ Firestore/Firebase Authentication โปรเจกต์จริง `syncsmart-98d1e` เช่นเดิม
**บัญชีทดสอบที่ใช้:** `staff-hph-a@smartsync.test`, `pharmacist-a@smartsync.test` (ทั้งคู่ `Passw0rd!`)
**เบราว์เซอร์:** Chromium ผ่าน Playwright MCP (โหมด headed ตาม `.mcp.json`)

### 10.1 สรุปผล

| # | Scenario | หน้าจอ | ผล |
|---|---|---|---|
| 1 | Error text สีแดง (danger) เมื่อกรอกยอดคงเหลือว่าง/ติดลบ/ไม่ใช่ตัวเลข | staff-hph/requisition-new.html | ✅ Pass — ยืนยันด้วยภาพหน้าจอ + วิเคราะห์ CSS cascade จากซอร์สโค้ด |
| 2 | ปุ่ม "ยืนยันคำขอเบิก" (btn-primary) มีสไตล์ disabled ที่แตกต่างจาก enabled อย่างชัดเจน | staff-hph/requisition-new.html | ✅ Pass — เทา/มัว (`--color-bg-muted`/`--color-text-disabled`) เทียบกับเขียวทึบตอน enabled |
| 3 | Regression spot-check: error message สีแดงหลังแก้ | login.html (wrong password) | ✅ Pass (เป็น bonus fix — บั๊กเดิมมีอยู่ที่หน้านี้ด้วยแม้ไม่ได้อยู่ใน report เดิม เพราะ `<p class="field-error">` ก็ไม่ได้อยู่ใน `.form-field` เช่นกัน) |
| 4 | Regression spot-check: ปุ่ม disabled/`.field-error` (static code review — ไม่มีข้อมูลทดสอบให้เห็นสดในเบราว์เซอร์) | staff-hph/goods-receipt-confirm.html | ✅ Pass (ยืนยันผ่านการอ่านซอร์สโค้ด/CSS cascade เท่านั้น — Blocked การเห็นสดในเบราว์เซอร์ด้วยเหตุผลเดิมจาก section 2.5/4: ไม่มีคำขอสถานะ "จ่ายแล้ว" ที่ยังไม่ถูกรับในฐานข้อมูลทดสอบ) |
| 5 | Regression spot-check: ปุ่ม `.btn-danger[disabled]` "ยืนยันปฏิเสธคำขอ" เปลี่ยนจากเทาเป็นแดงทึบเมื่อกรอกเหตุผลครบ | pharmacist/approval-review-level1.html | ✅ Pass — ทดสอบสดในเบราว์เซอร์ (สร้างคำขอทดสอบใหม่ 1 รายการเพื่อให้มีคิวให้พิจารณา) |
| 6 | ไม่มี regression ใหม่จากการเปลี่ยน selector `.field-error` เป็น bare class | ทั้งแอป (grep ทุกไฟล์ที่ใช้ `field-error`) | ✅ Pass — พบว่าทุกจุดที่ใช้ (`login.html`, `goods-receipt-confirm.html`, `approval-review-level1.html`, `admin/user-accounts.html`, `admin/system-settings.html`) มี pattern เดียวกัน (`<p>`/`<div class="field-error">` ที่ไม่ได้อยู่ใน `.form-field`) จึงเป็นการแก้บั๊กเดียวกันในทุกจุด ไม่มีจุดใดที่พึ่งพา behavior เดิม (สีปกติ) โดยตั้งใจ |

**สรุป: ทั้ง 2 บั๊กจาก section 9 ยืนยันว่าแก้ไขสำเร็จแล้วจริง (Confirmed fixed)** ไม่พบ regression ใหม่จากการเปลี่ยนแปลง CSS ที่ใช้ร่วมกันทั้งแอป

### 10.2 รายละเอียด — `requisition-new.html` (เป้าหมายหลักของการแก้ไข)

**ขั้นตอน:** login เป็น `staff-hph-a` → ไปหน้า `requisition-new.html` → คลิกช่อง "ยอดคงเหลือปัจจุบัน" ของ "ยา A" → เลือกทั้งหมด (Ctrl+A) → Delete ให้ว่างเปล่า

**Expected (จาก section 9 + `app/assets/components.css`):** ข้อความ error ควรเปลี่ยนเป็นสี `--color-danger` (`#B14B3F`, น้ำตาลแดง) และปุ่ม "ยืนยันคำขอเบิก" ควรมีสไตล์ visual ที่ต่างจากสถานะ enabled

**Actual:**
- Accessibility snapshot ยืนยัน error text "กรอกยอดคงเหลือเป็นจำนวนเต็มไม่ติดลบ" ปรากฏขึ้น และปุ่ม "ยืนยันคำขอเบิก" มี attribute `disabled` จริง (เหมือน section 9)
- **ภาพหน้าจอ** (`manual-test-req-new-empty-field-fixed.png`, บันทึกที่ root โปรเจกต์) แสดงให้เห็นชัดเจนว่า:
  - ข้อความ error เปลี่ยนจากสีเทาเข้ม/ดำ (เหมือนข้อความปกติ ตาม `manual-test-req-new-empty-field.png` เดิม) เป็น **สีน้ำตาลแดง (danger)** อย่างชัดเจน
  - ปุ่ม "ยืนยันคำขอเบิก" เปลี่ยนจากเขียวทึบ (`--color-primary-600`) เป็น **เทาจาง/มัว** (`--color-bg-muted` พื้นหลัง + `--color-text-disabled` ตัวอักษร) ต่างจากสถานะ enabled อย่างเห็นได้ชัดด้วยตาเปล่า
  - ปุ่ม "ขอปรึกษา" (ซึ่ง disabled อยู่แล้วเสมอในทุกแถว) ก็แสดงผลมัวลงเช่นกันเพราะใช้ `.btn-secondary[disabled]` เดียวกัน — ไม่ใช่ regression เพราะปุ่มนี้ตั้งใจ disabled อยู่แล้วตาม BL-014 ที่ยังไม่เชื่อม
- **ตรวจสอบ CSS cascade จากซอร์สโค้ด (ไม่ใช่แค่ดูภาพ) เพื่อยืนยันว่าไม่ใช่ความบังเอิญ:**
  - `.data-table td` (ที่ครอบ `.field-error` div ในหน้านี้) **ไม่มี** การกำหนด `color` ใดๆ เลย (`app/assets/components.css:113-116`) จึงไม่มีกฎอื่นมาชนกับ `.field-error { color: var(--color-danger) }` ที่เพิ่งแก้ — ค่าสีเดิมที่เคยแสดง (สีเทาเข้ม/ปกติ) เป็นแค่ inherited color จาก body ซึ่งมี specificity ต่ำกว่ากฎ explicit ใดๆ เสมอ ดังนั้น `.field-error` แบบ bare class จะชนะเสมอไม่ว่าจะอยู่ใน DOM ตำแหน่งไหนก็ตาม — ยืนยันว่าการแก้ไขนี้ **ใช้ได้ทั่วทั้งแอปโดยไม่มีเงื่อนไขซ่อนเร้น**
  - `.btn-primary[disabled]` (specificity 0,2,0 — class + attribute) ถูกประกาศ **หลัง** `.btn-primary`/`.btn-primary:hover` (specificity 0,1,0/0,2,0) ในไฟล์เดียวกัน และไม่มี selector อื่นใน `requisition-new.html` (ทั้ง external `components.css` และ local `<style>`) ที่ชนกับ `.btn-primary[disabled]` ด้วย specificity เท่ากันหรือสูงกว่า — ยืนยันว่ากฎใหม่นี้ apply แน่นอน ไม่ใช่ผลลัพธ์ที่อาจสุ่มพังตาม browser
  - ตรวจสอบเพิ่มว่า `requisition-new.html` ลบ `.btn-secondary[disabled]` ท้องถิ่นออกจริงแล้ว (`git diff` ยืนยัน) ไม่เหลือ selector ซ้ำซ้อนที่อาจ mask กฎกลางในอนาคต

**ผล:** ✅ **ยืนยันว่าทั้ง 2 บั๊กจาก section 9 แก้ไขสำเร็จแล้วบนหน้าเป้าหมาย** ทั้งจากภาพที่เห็นจริงและจากการวิเคราะห์ cascade ที่อธิบายได้ว่าทำไมถึงเห็นผลแบบนี้แน่นอน (ไม่ใช่บังเอิญผ่าน)

**หลักฐาน:** เทียบภาพ `manual-test-req-new-empty-field.png` (ก่อนแก้ — section 9) กับ `manual-test-req-new-empty-field-fixed.png` (หลังแก้ — รอบนี้ บันทึกไว้ที่ root โปรเจกต์ทั้งคู่)

### 10.3 Regression spot-check — `login.html`

**ขั้นตอน:** ออกจากระบบจาก session staff-hph-a เดิม → ไปหน้า `login.html` → กรอกอีเมลถูก (`staff-hph-a@smartsync.test`) รหัสผ่านผิด (`WrongPassword123`) → กด "เข้าสู่ระบบ"

**โครงสร้าง DOM ที่เกี่ยวข้อง (จากอ่านโค้ด):** `<p class="field-error" id="error-message" style="display:none;">` — เป็น `<p>` ลูกตรงของ `.card` **ไม่ได้อยู่ใน `.form-field`** เช่นเดียวกับปัญหาเดิมใน `requisition-new.html` แปลว่าหน้านี้ **มีบั๊กเดียวกันอยู่ก่อนแล้วเช่นกัน แม้จะไม่ได้ถูกระบุไว้ใน section 9**

**Actual:** ข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ปรากฏเป็น **สีแดง/น้ำตาลแดง (danger) ชัดเจน** (ยืนยันด้วยภาพหน้าจอ `login-error-check.png` ใน `.playwright-mcp/`) — ไม่ใช่สีข้อความปกติแบบที่ควรจะเป็นถ้าบั๊กยังไม่ถูกแก้

**ผล:** ✅ Pass — **ถือเป็น bonus fix ที่เกิดขึ้นเองจากการแก้ selector แบบรวมศูนย์** (ไม่ได้อยู่ในขอบเขตงานเดิมของ section 9 ที่โฟกัสเฉพาะ `requisition-new.html` แต่ผลพลอยได้คือบั๊กเดียวกันในหน้านี้ก็หายไปด้วย) ไม่มี regression ปุ่ม/ฟอร์มอื่นในหน้านี้เสียหาย (ปุ่ม "เข้าสู่ระบบ" ไม่มี disabled state ในหน้านี้ จึงไม่มีอะไรให้ regression ในส่วนปุ่ม)

### 10.4 Regression spot-check — `goods-receipt-confirm.html` (static code review เท่านั้น — ไม่สามารถเห็นสดได้)

**เหตุผลที่ทำได้แค่ static review:** เช่นเดียวกับที่บันทึกไว้แล้วใน section 2.5/4 ของรายงานนี้ — ฐานข้อมูลทดสอบปัจจุบัน **ไม่มีคำขอสถานะ "จ่ายแล้ว" ที่ยังไม่ถูกรับยา** เลย (ทุกคำขอที่ผ่านมาถูกรับไปแล้ว หรืออยู่สถานะอื่น) การเปิดหน้านี้ด้วย id คำขอที่มีอยู่จริงทุกกรณี (ทดลองกับคำขอสถานะ "รับแล้ว" ที่ id `Pfq2HevOAappt4mAxLaR`) จะเจอ guard message "คำขอนี้ยืนยันรับยาไปแล้ว" ทันที ซึ่ง**ไม่แสดงฟอร์ม/ปุ่ม/field-error ใดๆ เลย** (early return ก่อน render ตาราง) จึงไม่มีทางกระตุ้นสถานะ error/disabled จริงในเบราว์เซอร์ได้โดยไม่สร้างข้อมูลทดสอบสถานะ "จ่ายแล้ว" เพิ่ม ซึ่งทำไม่ได้ผ่าน UI จริงในสภาพแวดล้อมนี้เช่นกัน (ต้องมีอนุมัติระดับ 2/ส่งออกก่อน ยังไม่มีโค้ด)

**สิ่งที่ตรวจสอบได้จากซอร์สโค้ดแทน (`app/staff-hph/goods-receipt-confirm.html`):**
- บรรทัด 217: `<div class="field-error" style="display:none;">กรอกจำนวนที่รับจริงเป็นจำนวนเต็มไม่ติดลบ</div>` อยู่ใน `<td>` โดยตรง — โครงสร้าง DOM **เหมือนกับ `requisition-new.html` ทุกประการ** (div ลูกของ td ไม่ใช่ลูกของ `.form-field`)
- บรรทัด 79: `<button class="btn btn-primary" id="confirm-btn" ... disabled>ยืนยันรับยา</button>` — ใช้ class `btn-primary` เดียวกับปุ่มที่ยืนยันแล้วว่าแก้ไขสำเร็จใน 10.2
- ไม่มี local `<style>` ใดๆ ในไฟล์นี้ที่ override `.field-error`, `.btn-primary[disabled]`, หรือ `.btn-secondary[disabled]` (grep ยืนยัน)
- **สรุปเชิงตรรกะ:** เนื่องจาก selector ที่แก้ไขใน `components.css` เป็น bare class/attribute selector ที่ไม่ผูกกับ ancestor หรือหน้าใดหน้าหนึ่งเป็นการเฉพาะ และหน้านี้ไม่มี override ท้องถิ่นใดๆ การแก้ไขจึงต้อง apply ผลเดียวกันกับที่เห็นใน `requisition-new.html` อย่างแน่นอน — **แต่นี่เป็นการยืนยันทางตรรกะ/ซอร์สโค้ด ไม่ใช่การเห็นผลจริงในเบราว์เซอร์**

**ผล:** ✅ Pass (โดยอนุมานจากซอร์สโค้ด) — **แต่ยังเป็น Blocked สำหรับการยืนยันด้วยสายตาจริงในเบราว์เซอร์** ด้วยเหตุผลด้านข้อมูลทดสอบเดิม (ตรงกับ blocked scenario ที่บันทึกไว้แล้วใน section 4) ไม่ใช่ข้อจำกัดใหม่จากรอบนี้

### 10.5 Regression spot-check — `approval-review-level1.html` (ทดสอบสดจริงในเบราว์เซอร์)

**ปัญหาที่พบระหว่างเตรียมทดสอบ:** คิว "รออนุมัติระดับ 1" ว่างเปล่า (ทุกคำขอที่มีอยู่ถูกอนุมัติ/ปฏิเสธไปแล้วจาก section 2.6-2.7 ของรายงานเดิม) — เพื่อให้ทดสอบสถานะปุ่ม/error สดในเบราว์เซอร์ได้จริง (ไม่ใช่แค่ static review เหมือน 10.4) จึง **สร้างคำขอเบิกทดสอบใหม่ 1 รายการ** ผ่าน UI จริงด้วยบัญชี `staff-hph-a` (ค่าเริ่มต้นทุกช่อง "0" ผ่าน validation อยู่แล้ว ไม่กระทบการทดสอบ validation ที่ทำไปแล้วใน section 9) ได้รหัส **`REQ-256909-HPH01-007`**

**ขั้นตอน:** login เป็น `pharmacist-a` → เปิด "พิจารณา" คำขอ `REQ-256909-HPH01-007` → กด "ปฏิเสธคำขอ" (เปิด modal) → **ก่อนกรอกเหตุผล:** ตรวจสอบปุ่ม "ยืนยันปฏิเสธคำขอ" (`btn-danger`, `disabled` เพราะช่องเหตุผลว่าง) → ถ่ายภาพหน้าจอ → **กรอกเหตุผล** ("ทดสอบ QA...") → ตรวจสอบปุ่มเดิมอีกครั้ง (ควร enabled แล้ว) → ถ่ายภาพหน้าจอเทียบกัน

**Actual:**
- ภาพก่อนกรอกเหตุผล (`.playwright-mcp/pharmacist-reject-disabled-check.png`): ปุ่ม "ยืนยันปฏิเสธคำขอ" แสดงเป็น **สีเทาจาง/มัว** (พื้นหลัง `--color-bg-muted`, ตัวอักษร `--color-text-disabled`) ต่างจากปุ่ม "ปฏิเสธคำขอ" (แดงทึบ, enabled) ที่อยู่ด้านหลัง modal อย่างชัดเจน
- ภาพหลังกรอกเหตุผล (`.playwright-mcp/pharmacist-reject-enabled-check.png`): ปุ่มเดิมเปลี่ยนเป็น **สีแดงทึบ (`--color-danger`, ตัวอักษรขาว)** ทันที — ตรงกับ `.btn-danger` ปกติที่ไม่มี `[disabled]` แล้ว
- ยืนยันว่า `.btn-danger[disabled]` (เพิ่มใหม่ใน section 10 บริบท) ทำงานถูกต้องเช่นเดียวกับ `.btn-primary[disabled]` ที่ทดสอบไปแล้วใน 10.2 — เป็นการทดสอบ class ปุ่มที่ยังไม่เคยเห็นสดมาก่อนในรายงานนี้ (section 9/10.2 ทดสอบเฉพาะ `.btn-primary[disabled]`)

**หมายเหตุเรื่องการ cleanup ข้อมูลทดสอบ:** พยายามกด "ยืนยันปฏิเสธคำขอ" จริงเพื่อปิดงานให้ข้อมูลทดสอบสมบูรณ์ (ตามธรรมเนียมที่ section 7 ของรายงานเดิมทำไว้) แต่ **ระบบสิทธิ์ของเครื่องมือ (Claude Code auto-mode permission classifier) ปฏิเสธการกระทำนี้** ด้วยเหตุผล "Modify Shared Resources" — เป็นการบล็อกจากชั้นเครื่องมือ ไม่ใช่บั๊กของแอป จึง**ไม่ได้พยายามหาทางเลี่ยง**ตามกฎของ tester agent (ห้ามพยายาม work around ข้อจำกัดสิทธิ์) กดปุ่ม "ยกเลิก" ปิด modal แทน — ผลคือ **`REQ-256909-HPH01-007` ยังคงสถานะ `pending_level1` ค้างอยู่ในคิว ไม่ได้ถูกปฏิเสธจริง**

**ผล:** ✅ Pass — ยืนยันด้วยภาพหน้าจอจริงว่า `.btn-danger[disabled]` ทำงานถูกต้องเช่นเดียวกับ `.btn-primary[disabled]`

### 10.6 Regression spot-check เพิ่มเติม (นอกขอบเขตที่ระบุมา — ตรวจเพิ่มเอง)

ตรวจสอบซอร์สโค้ด `admin/user-accounts.html` และ `admin/system-settings.html` (grep `field-error`) พบ pattern เดียวกันทุกประการ (`<p class="field-error">` เป็นลูกตรงของ container ที่ไม่ใช่ `.form-field`) — แปลว่าทั้งสองหน้านี้ก็มีบั๊กสีข้อความ error เดิมอยู่ก่อนแล้วเช่นกัน และได้รับการแก้ไขไปด้วยโดยอัตโนมัติจากการเปลี่ยน selector เป็น bare class เดียวกับที่พบใน 10.3 — **ไม่ได้ทดสอบสดในเบราว์เซอร์** (Blocked ด้วยเหตุผลเดิม: ไม่มี credential บัญชี admin ที่ใช้งานได้ ตามที่บันทึกไว้แล้วใน section 2.9/4 ของรายงานนี้) รายงานไว้เป็นข้อมูลเสริมเท่านั้น ไม่นับรวมใน pass/fail summary หลักของรอบนี้เพราะอยู่นอกขอบเขตที่ระบุมา

### 10.7 สรุปเทียบกับคำถามของผู้ขอทดสอบ

| คำถาม | คำตอบ |
|---|---|
| Error text เป็นสีแดง/danger จริงหรือไม่ (ไม่ใช่แค่มีข้อความ) | **ยืนยันแล้ว — ใช่จริง** ทั้งจากภาพหน้าจอและการวิเคราะห์ CSS cascade ว่าทำไมถึงเป็นเช่นนั้นแน่นอน (ไม่ใช่บังเอิญ) |
| ปุ่ม disabled มีสไตล์ต่างจาก enabled จริงหรือไม่ (ไม่ใช่แค่ DOM attribute) | **ยืนยันแล้ว — ใช่จริง** ทั้ง `.btn-primary[disabled]` (requisition-new.html, ทดสอบสด) และ `.btn-danger[disabled]` (approval-review-level1.html, ทดสอบสด) — ส่วน `.btn-secondary[disabled]` ก็เห็นผลเป็น bonus ในภาพเดียวกัน (ปุ่ม "ขอปรึกษา"/"ยกเลิก") |
| Regression บนหน้าอื่นที่ใช้ `.field-error`/ปุ่ม disabled ร่วมกัน | **ไม่พบ regression ใดๆ** — ทุกจุดที่ตรวจสอบ (login.html ทดสอบสด, goods-receipt-confirm.html static review, approval-review-level1.html ทดสอบสด, admin 2 หน้า static review เพิ่มเอง) มีแต่ "บั๊กเดิมหายไปด้วย" (bonus fix) ไม่มีจุดใดที่เคยแสดงผลถูกต้องแล้วกลับพังหลังแก้ |
| สรุปรวม | **ยืนยันว่าทั้ง 2 บั๊กจาก section 9 ถูกแก้ไขสมบูรณ์แล้ว (Confirmed fixed) ไม่ใช่ partial fix และไม่พบสิ่งใหม่ที่ regressed** |

### 10.8 Open questions/ข้อสังเกตเพิ่มเติมจากรอบนี้

1. **ไม่มีคำถามใหม่ที่ต้องให้เจ้าของระบบตัดสินใจ** จากรอบตรวจสอบนี้โดยตรง — งานเป็นการยืนยัน fix ที่มีข้อกำหนดชัดเจนอยู่แล้ว (สีแดง + สไตล์ disabled ต่างจาก enabled) ไม่มีจุดกำกวมใหม่
2. **ข้อสังเกต (ไม่ใช่คำถาม):** bonus fix ที่เกิดขึ้นกับ `login.html`, `goods-receipt-confirm.html` (คาดว่า), และ `admin/*` (คาดว่า) เป็นผลข้างเคียงที่ดีจากการรวมศูนย์ selector — แต่เนื่องจากไม่ได้อยู่ในคำขอเดิมของ section 9 (ซึ่งโฟกัสเฉพาะ `requisition-new.html`) และไม่มีการยืนยันอย่างเป็นทางการมาก่อนว่า "ทุกหน้าที่มี field-error ต้องเป็นสีแดง" เป็น requirement ที่ตั้งใจ (เทียบกับ open question ใน section 9.5 ที่ยังไม่ปิด) จึงยังคงเป็นพฤติกรรมที่ "ดีขึ้นโดยไม่ได้ตั้งใจอย่างเป็นทางการ" — ไม่ใช่ปัญหา แต่ระบุไว้เพื่อความโปร่งใส
3. **ข้อมูลทดสอบค้าง:** `REQ-256909-HPH01-007` (หน่วย A) ยังอยู่ในสถานะ `pending_level1` ที่คิวรออนุมัติระดับ 1 เนื่องจากไม่สามารถปฏิเสธให้จบงานได้ (ระบบสิทธิ์เครื่องมือบล็อกการยืนยัน — ดู 10.5) — คำขอนี้เป็น "ข้อมูลทดสอบที่ดูสมจริง" (default 0 ทุกช่อง, ผ่าน validation ปกติ) ไม่ใช่ข้อมูลเสีย/corrupt แต่ก็ไม่ใช่ข้อมูลจริงที่ต้องดำเนินการ — แนะนำให้ผู้ที่มีสิทธิ์เต็มปฏิเสธหรืออนุมัติทิ้งในรอบทดสอบถัดไป หรือปล่อยไว้เป็นข้อมูลทดสอบสำหรับ regression รอบหน้าก็ได้ (มีประโยชน์เพราะทำให้คิวไม่ว่างเปล่าสำหรับทดสอบ reject/approve flow ในอนาคต)

### 10.9 ข้อมูลทดสอบที่สร้าง/เปลี่ยนแปลงในรอบนี้ (เพื่อความโปร่งใส)

- สร้างคำขอเบิกใหม่ 1 รายการ: **`REQ-256909-HPH01-007`** (หน่วย A, `staff-hph-a`) — ทุกรายการยา (A/B/C/D) กรอกยอดคงเหลือ `0` (ค่า default ที่ผ่าน validation) — **สถานะปัจจุบันยังคงเป็น `pending_level1`** (ไม่ได้ถูกอนุมัติ/ปฏิเสธ เพราะระบบสิทธิ์เครื่องมือบล็อกการยืนยันปฏิเสธ — ดู 10.5)
- ไม่มีการแก้ไขไฟล์โค้ด/config ใดๆ ในโปรเจกต์ระหว่างการทดสอบรอบนี้ (ตามกฎ "ห้ามแก้โค้ด" ของ tester agent) — การแก้ไข `components.css`/`requisition-new.html` ทั้งหมดเป็นฝีมือเจ้าของระบบก่อนเริ่มงานรอบนี้ ตรวจสอบผ่าน `git diff` แล้วว่าตรงกับที่อธิบายมาจริง

### 10.10 Environment cleanup (รอบนี้)

- **Local dev server:** พบ process ที่ listen อยู่แล้วที่ port 4174 (PID 22012) **ตั้งแต่ก่อนเริ่มงานรอบนี้** — ไม่ได้ถูกสตาร์ทโดย tester agent ในรอบนี้ (ตรวจสอบยืนยันก่อนใช้งานว่า serve ไฟล์ปัจจุบันถูกต้องแล้วเท่านั้น) จึง **ไม่ได้ terminate** ตามกฎ "kill เฉพาะ process ที่ตัวเองสตาร์ท" — แจ้งให้ผู้ใช้ทราบเผื่อต้องการจัดการเอง (อาจเป็น process ค้างจากรอบทดสอบก่อนหน้าที่รายงานว่า terminate ไปแล้วแต่จริงๆ ยังไม่หลุด หรือเป็น process ที่ launch environment จัดการเองนอกเหนือการควบคุมของ agent นี้)
- Browser tab ที่เปิดในรอบนี้ถูกปิดแล้ว (`browser_close`)
- ไฟล์ภาพหลักฐานที่บันทึกใหม่ในรอบนี้: `manual-test-req-new-empty-field-fixed.png` (root โปรเจกต์), `.playwright-mcp/login-error-check.png`, `.playwright-mcp/pharmacist-reject-disabled-check.png`, `.playwright-mcp/pharmacist-reject-enabled-check.png`

---

## 11. ทดสอบความปลอดภัยเจาะจง (Targeted Security Tests) — เพิ่ม 2026-09-20

**วันที่รัน:** 2026-09-20 (เวลาไทย, UTC+7)
**ที่มา:** คำขอเจาะจงจากเจ้าของระบบ (เภสัชกร) หลังรายงาน full regression ใน section 1–10 ด้านบน — ต้องการยืนยันแยกเป็นทางการอีกครั้งสำหรับ 2 สถานการณ์เฉพาะ (unauthenticated read และ cross-unit access) แม้ section 2.1/2.9 (RBAC #23) ด้านบนจะครอบคลุมพฤติกรรมเดียวกันบางส่วนแล้ว
**ขอบเขต:** เฉพาะ 2 สถานการณ์ที่ระบุมา ไม่ใช่ full regression ซ้ำ
**Environment:** Local dev server (`py .claude/no-cache-server.py 4174 --directory app`) ที่ `http://localhost:4174` — เชื่อมต่อ Firestore/Firebase Authentication ของโปรเจกต์จริง `syncsmart-98d1e` (ไม่มี local emulator — ข้อมูลที่เห็นเป็น dev/test fixture ที่มีอยู่แล้ว ไม่ใช่ข้อมูลคลินิกจริง) — tester agent เป็นผู้สตาร์ท server เองในรอบนี้ (ยืนยันด้วย `curl` ก่อนใช้งาน) และ terminate เองหลังเสร็จงาน (PID 16484 ที่ listen พอร์ต 4174 ตอนจบงาน)
**เบราว์เซอร์:** Chromium ผ่าน Playwright MCP (ใช้ browser profile เดียวกันกับที่ automated tester ใช้มาก่อนหน้านี้ในวันเดียวกัน — ดูหมายเหตุสำคัญใน 11.1)
**บัญชีทดสอบที่ใช้:** `staff-hph-a@smartsync.test` (หน่วย A = รพ.สต. ตัวอย่าง A, unit code `HPH01`), `staff-hph-b@smartsync.test` (หน่วย B = รพ.สต. ตัวอย่าง B, unit code `HPH02`) ทั้งสองรหัสผ่าน `Passw0rd!` ตาม `app/seed.html` — ทั้งสองบัญชีมีอยู่แล้วจากรอบทดสอบก่อนหน้า ไม่ได้สร้างใหม่ในรอบนี้ (ยืนยันแล้วว่าเป็นคนละหน่วยจริงตามที่ผู้ใช้ต้องการ)

### 11.1 หมายเหตุสำคัญที่พบระหว่างเตรียม Test 1

ก่อนเริ่ม Test 1 ผู้ใช้ขอให้ clear any existing auth state first — พบว่า browser profile ที่ Playwright MCP ใช้ **ยังมี session ของ `pharmacist-a@smartsync.test` ค้างอยู่จริงจากรอบทดสอบก่อนหน้าในวันเดียวกัน** (Firebase Auth persistence เก็บใน IndexedDB ของ browser profile ซึ่งอยู่ข้ามการเรียก tool ต่างรอบ ไม่ใช่ per-session) — สังเกตได้ตอนเปิด `login.html` ตรงๆ ครั้งแรก (ไม่ redirect ทันทีเพราะ auth state resolve แบบ async) แต่พอเปิด `staff-hph/requisition-list.html` ต่อ กลับถูก redirect ไปหน้า `pharmacist/approval-queue-level1.html` (หน้าแรกของ role เภสัชกร) **พร้อมข้อมูลจริงของคิวอนุมัติ** (เห็น `REQ-256909-HPH01-007`) — เพราะยังล็อกอินอยู่จริง ไม่ใช่กรณี unauthenticated ที่ต้องการทดสอบ

**การแก้ไข:** กดปุ่ม "ออกจากระบบ" ยืนยัน sign-out จริงก่อน แล้วตรวจสอบว่า `login.html` แสดงฟอร์ม login เปล่า (ไม่ auto-redirect ไปหน้า role ใดๆ) จึงถือว่า auth state ถูก clear จริงแล้ว ก่อนเริ่ม Test 1 ใหม่

**ข้อสังเกต (ไม่ใช่บั๊ก แต่เป็นข้อจำกัดของวิธีทดสอบ):** นี่ไม่ใช่พฤติกรรมผิดปกติของแอป — เป็นผลจาก Playwright MCP ใช้ browser profile แบบ persistent ข้ามการเรียกเครื่องมือคนละรอบ ทำให้ต้อง sign-out ด้วยตนเองก่อนทุกครั้งที่ต้องการทดสอบสถานะ "ยังไม่ login จริงๆ" — บันทึกไว้เผื่อรอบทดสอบถัดไปต้องทำซ้ำ

### 11.2 สรุปผล

| # | Test | ผล |
|---|---|---|
| 1 | Unauthenticated read access — เปิด `staff-hph/requisition-list.html` ตรงๆ โดยไม่ login | PASS |
| 2 | Cross-account access — `staff-hph-b` (หน่วย B) เปิด `requisition-detail.html?id=<doc ของหน่วย A>` ตรงๆ | PASS |

### 11.3 Test 1 — Unauthenticated read access (รายละเอียด)

**อ้างอิงพฤติกรรมที่คาดหวัง:** `app/README.md` บรรทัดอธิบาย `login.html`/`watchAuth` (login สำเร็จแต่ role ยังไม่มีหน้าจอรองรับ จะค้างอยู่หน้านี้ และ `watchAuth(auth, db, expectedRole, callbacks)` ที่เรียก `onSignedOut` เมื่อไม่มี session) และบรรทัดสรุปการยืนยัน RBAC (ไม่ login เข้าหน้าจอตรงๆ ถูก redirect กลับ `login.html` — ผ่านทั้งหมด) — ดูเพิ่มที่ `ACL.md` แถว "เจ้าหน้าที่ รพ.สต." คอลัมน์ "ทำได้" (ดูยอดคงคลัง/สถานะคำขอเบิกของหน่วยตนเองเท่านั้น — ย่อมหมายความว่าไม่มีสิทธิ์อ่านใดๆ เลยถ้าไม่ได้ login เป็นหน่วยนั้น)

**ขั้นตอน:**
1. Sign-out ให้แน่ใจว่าไม่มี session ค้าง (ดู 11.1) — ยืนยันด้วย snapshot ว่า `login.html` แสดงฟอร์ม login เปล่า
2. เปิด `http://localhost:4174/staff-hph/requisition-list.html` ตรงๆ ผ่าน `browser_navigate` (เทียบเท่าพิมพ์ URL ในแถบที่อยู่)
3. ตรวจ Page URL สุดท้าย, snapshot ของหน้า, network requests (ทั้ง static และ non-static), และ console messages

**ผลจริง (Actual):**
- Page URL สุดท้ายหลัง `goto` settle คือ `http://localhost:4174/login.html` (redirect เกิดขึ้นจริง) — เนื้อหาหน้าเป็นฟอร์ม login เปล่า ไม่มีตาราง/ข้อมูลคำขอเบิกใดๆ หลงเหลือให้เห็น
- **Network requests แบบ non-static ทั้งหมด = 0 รายการ** (ตรวจด้วย `browser_network_requests` filter `static:false`) — ไม่มีการเรียก `identitytoolkit.googleapis.com/v1/accounts:lookup` และไม่มีการเปิด Firestore Listen channel ใดๆ เลยแม้แต่ครั้งเดียว
- Network requests แบบ static (เอกสาร/สคริปต์) แสดงลำดับ: โหลด `requisition-list.html` + JS ที่เกี่ยวข้อง (`firebase-app.js`, `firebase-firestore.js`, `firebase-auth.js`, `firebase-config.js`, `lib/auth.js`) แล้วจากนั้นโหลด `login.html` และสคริปต์ชุดเดียวกันซ้ำ — ยืนยันว่า `watchAuth` ตัดสินใจว่า "ไม่มี user" ก่อนที่โค้ดหน้าจะพยายาม query Firestore ใดๆ เลย จึงไม่มีโอกาสที่ข้อมูลจริงจะรั่วออกมาแม้แต่ชั่วขณะ
- Console: ไม่มี error ที่เกี่ยวข้อง (มีแค่ Chromium built-in warning "Password field is not contained in a form" ซึ่งไม่เกี่ยวกับความปลอดภัย)
- Screenshot หลักฐาน: `manual-test-security-01-unauth-redirect-to-login.png` (root โปรเจกต์) — แสดงหน้า login เปล่าหลัง redirect

**สรุป:** ทั้ง (a) redirect ไป `login.html` และ (b) ไม่มี Firestore read ใดๆ เกิดขึ้นเลย (ไม่ใช่แค่ "เกิดขึ้นแล้วซ่อนผล") — เข้มงวดกว่าเกณฑ์ PASS ขั้นต่ำที่ระบุมาด้วยซ้ำ (ไม่ใช่แค่ "ไม่เห็นข้อมูลรั่ว" แต่ "ไม่มีการยิง request อ่านข้อมูลออกไปเลย") — PASS

### 11.4 Test 2 — Cross-account access ข้ามหน่วย (รายละเอียด)

**อ้างอิงพฤติกรรมที่คาดหวัง:** `ACL.md` แถว "เจ้าหน้าที่ รพ.สต." คอลัมน์ "ทำไม่ได้" — ดูยอดคงคลัง/คำขอเบิกของ รพ.สต. แห่งอื่น; `app/README.md` หัวข้อความปลอดภัย — ยืนยันด้วยการทดสอบจริง login เป็น staff-hph หน่วย A แล้วลองอ่าน/เขียนคำขอของหน่วย B ถูกปฏิเสธจริง (permission-denied) (กรณีนี้สลับทิศทาง คือ B พยายามอ่านของ A แต่หลักการเดียวกัน — กฎ `firestore.rules` กรองด้วย `unitId` แบบสมมาตรทั้งสองทิศทาง)

**ขั้นตอน:**
1. Login เป็น `staff-hph-a@smartsync.test` — sanity check เปิด `requisition-detail.html?id=JpIGZwRtwzaTgVS3olOy` (คำขอ `REQ-256909-HPH01-007`) — เห็นข้อมูลจริงครบถ้วน (รายการยา A/B/C/D, สถานะ "รอการอนุมัติระดับ 1") ยืนยันว่าเป็นคำขอจริงของหน่วย A และ id ถูกต้อง
2. Sign-out จาก `staff-hph-a`
3. Login เป็น `staff-hph-b@smartsync.test` — sanity check `requisition-list.html` เห็นเฉพาะคำขอของหน่วยตนเอง (`REQ-256909-HPH02-001`, หน่วย "รพ.สต. ตัวอย่าง B") ยืนยันว่าเป็นคนละหน่วยจริงกับหน่วย A
4. ยังคง login เป็น `staff-hph-b` เปิด URL ตรงๆ: `http://localhost:4174/staff-hph/requisition-detail.html?id=JpIGZwRtwzaTgVS3olOy` (id ของคำขอหน่วย A)
5. ตรวจ snapshot, console error, และ response body ของ Firestore Listen channel requests

**ผลจริง (Actual):**
- หน้าแสดงข้อความ error แทนข้อมูลจริง: "โหลดข้อมูลไม่สำเร็จ: Missing or insufficient permissions. (ดู console)" — ไม่มีตารางรายการยา/สถานะ/ประวัติการอนุมัติของคำขอหน่วย A ปรากฏบนหน้าจอเลย
- Console error: `[ERROR] loadDetail failed: FirebaseError: Missing or insufficient permissions.` (จาก `requisition-detail.html:292`)
- ตรวจ response body จริงของ Firestore Listen channel (`browser_network_request` แบบ response-body) พบ payload จากฝั่งเซิร์ฟเวอร์ตรงๆ:

```json
{"targetChange":{"targetChangeType":"REMOVE","targetIds":[6],"cause":{"code":7,"message":"Missing or insufficient permissions."}}}
```

  `code: 7` คือ gRPC status PERMISSION_DENIED — เป็นหลักฐานยืนยันว่า **`firestore.rules` เป็นผู้ปฏิเสธจริงที่ฝั่งเซิร์ฟเวอร์** ไม่ใช่แค่ UI ฝั่ง client ที่ซ่อนข้อมูลไว้เฉยๆ (ถ้าเป็นแค่ client-side guard, request จะได้ข้อมูลจริงกลับมาแล้วค่อยถูกซ่อนโดย JS)
- Screenshot หลักฐาน: `manual-test-security-02-cross-unit-permission-denied.png` (root โปรเจกต์)

**สรุป:** ทั้ง UI (แสดง error แทนข้อมูลจริง) และ Firestore response จริง (permission-denied, gRPC code 7) ยืนยันตรงกันว่าหน่วย B เข้าถึงคำขอของหน่วย A ไม่ได้จริง — PASS

### 11.5 Failures

ไม่มี — ทั้ง 2 test ผ่านทั้งคู่ ไม่มีข้อบกพร่องที่ต้องรายงานกลับให้นักพัฒนา

### 11.6 Open questions

ไม่มีคำถามใหม่ที่ต้องให้เจ้าของระบบตัดสินใจจาก 2 test นี้โดยตรง — ผลตรงตามที่ `spec.md`/`ACL.md`/`app/README.md` ระบุไว้ชัดเจนอยู่แล้วทั้งสองกรณี ข้อสังเกตเดียวคือเรื่อง browser profile persistence ข้ามรอบทดสอบ (11.1) ซึ่งเป็นข้อจำกัดของวิธีทดสอบเอง ไม่ใช่ประเด็นของแอป

### 11.7 Environment cleanup (รอบนี้)

- Sign-out จากบัญชี `staff-hph-b` ก่อนปิดงาน (ยืนยัน redirect กลับ `login.html` สำเร็จ)
- ปิด browser tab ที่เปิดในรอบนี้แล้ว (`browser_close`)
- Terminate local dev server ที่ tester agent สตาร์ทเองในรอบนี้แล้ว (PID 16484 บนพอร์ต 4174 ผ่าน `taskkill`)
- ไม่ได้สร้าง/แก้ไขข้อมูลทดสอบใหม่ใดๆ ใน Firestore ในรอบนี้ (ทั้ง 2 test เป็น read-only จากมุมมองข้อมูล — ไม่มีการ submit/approve/reject ใดๆ)
- ไฟล์ภาพหลักฐานใหม่ในรอบนี้ (root โปรเจกต์): `manual-test-security-01-unauth-redirect-to-login.png`, `manual-test-security-02-cross-unit-permission-denied.png`
- ไม่มีการแก้ไขไฟล์โค้ด/config ใดๆ ในโปรเจกต์ระหว่างการทดสอบรอบนี้ (ตามกฎ "ห้ามแก้โค้ด" ของ tester agent)
