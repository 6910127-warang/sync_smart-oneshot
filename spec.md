# SmartSync — Spec สรุปโค้ดจริงใน `app/` (ณ 20260920)

> เอกสารนี้เป็น **snapshot สรุป** สถานะโค้ดจริงที่ implement แล้วในโฟลเดอร์ `app/` ที่ทำหน้าที่แทนคำว่า "Module" — สรุปจาก [`app/README.md`](app/README.md) (source of truth ตัวจริงของ schema/สถานะ) และ [`ACL.md`](ACL.md) ประกอบกับการอ่านโค้ดจริง (`*.html`, `lib/*.js`, `firestore.rules`) ไม่ใช่เอกสาร requirement เชิงแนวคิด — ถ้าเนื้อหาที่นี่ขัดกับ `app/README.md` ให้ถือว่า `app/README.md` ถูกต้องกว่าเสมอ เพราะไฟล์นี้ไม่มี skill/agent ดูแลอัตโนมัติเหมือนเอกสารใน `01-requirements/`
>
> **ขอบเขต:** เฉพาะสิ่งที่ **มีโค้ดจริงทำงานได้แล้ว** ใน `app/` เท่านั้น (Firebase Firestore + Authentication + Cloudflare Worker proxy ตัวเดียว) ไม่รวม `prototype/` (static mockup แยกต่างหาก) และไม่รวมเอกสารเชิงแนวคิดใน `01-requirements/` ที่ยังไม่ถูกนำมาพัฒนาจริง

## 1. หน้าจอทั้งหมด (Screens)

### หน้าจอที่ใช้งานจริง

| หน้าจอ | Path | บทบาทที่เข้าได้ | หน้าที่ | อ้างอิง |
|---|---|---|---|---|
| เข้าสู่ระบบ | `app/login.html` | ทุก role (guest) | จุดเข้า login กลางจุดเดียว กรอกอีเมล/รหัสผ่านผ่าน Firebase Authentication แล้ว redirect ไปหน้าแรกของ role นั้นอัตโนมัติ (`ROLE_HOME` map) — ถ้า role ยังไม่มีหน้าจอรองรับ หรือ `staff_hph` ที่ไม่มี `unitId` จะค้างที่หน้านี้พร้อมปุ่ม "ออกจากระบบ" | BL-024 |
| รายการคำขอเบิกของหน่วยฉัน | `app/staff-hph/requisition-list.html` | `staff_hph` | แสดงคำขอเบิกทั้งหมดของหน่วยตนเอง (`where unitId==...`), แสดงสถานะ (รวมสถานะ "รับแล้ว" ที่คำนวณจาก `goodsReceiptRecords` ไม่ใช่ enum จริง) | FT-002, BL-002/004/005 |
| สร้างคำขอเบิกยาประจำเดือน | `app/staff-hph/requisition-new.html` | `staff_hph` | สร้างคำขอเบิกแบบ **ปกติ (รายเดือน) เท่านั้น** — แสดงยอดแนะนำเบิกที่คำนวณจาก `safetyStockThresholds`, เขียน `requisitions` + subcollection `lineItems` | FT-001, BL-001/002 |
| คิวรออนุมัติระดับ 1 | `app/pharmacist/approval-queue-level1.html` | `pharmacist` | แสดงรายการคำขอสถานะ `pending_level1` ทั้งเครือข่าย พร้อม badge "เบี่ยงเบนมาก" (ผู้ช่วย AI) | FT-002, BL-004 |
| พิจารณา/อนุมัติ/ปฏิเสธ ระดับ 1 | `app/pharmacist/approval-review-level1.html` | `pharmacist` | ดูรายละเอียดคำขอ, แก้ยอดอนุมัติ/ยอดคงเหลือที่ยืนยัน, อนุมัติ/ปฏิเสธ (เฉพาะระดับ 1), มีผู้ช่วย AI (สรุปเหตุผลเบี่ยงเบน + ช่วยร่างข้อความปฏิเสธ) | FT-002, BL-004/036, FT-036/BL-047 |
| รายละเอียดคำขอเบิก | `app/staff-hph/requisition-detail.html` | `staff_hph` | เชื่อม `lineItems`/`approvalRecords`/`goodsReceiptRecords` จริง (เพิ่ม 20260920 — แทนลิงก์จากหน้ารายการที่เคยปิดใช้งานไว้) | FT-002, BL-002/004/005 |
| ยืนยันรับยา | `app/staff-hph/goods-receipt-confirm.html` | `staff_hph` | เขียน `goodsReceiptRecords` จริงครั้งแรก (เพิ่ม 20260920 — เดิมอ่านได้อย่างเดียว) เฉพาะคำขอสถานะ `dispensed` เท่านั้น | BL-006 |
| Audit Trail ทางธุรกิจ | `app/admin/audit-trail.html` | `admin` | ดูประวัติเหตุการณ์ทางธุรกิจ (สร้างคำขอ/อนุมัติ-ปฏิเสธระดับ 1/ยืนยันรับยา) จาก `businessAuditLog` (immutable, เพิ่ม 20260920) — ครอบคลุมเฉพาะ 4 `eventType` ที่มีหน้าจอจริงเขียนอยู่แล้ว ยังไม่ครบทุก event ตาม data-model.md §3.14 | BL-008 |
| จัดการบัญชีผู้ใช้ | `app/admin/user-accounts.html` | `admin` | สร้าง/แก้ไข/ปิดใช้งานบัญชีจริง (เพิ่ม 20260920 — แทน `seed.html` ที่เป็น dev tool) — "ปิดใช้งาน" ตั้งแค่ `users/{uid}.active=false` ไม่ได้ disable บัญชี Firebase Auth จริงระดับ Firebase | ไม่มี BL-ID เฉพาะ (ส่วนหนึ่งของโครงสร้าง RBAC/บัญชีผู้ใช้ตาม BL-024) |
| ตั้งค่าระบบ | `app/admin/system-settings.html` | `admin` | แก้ค่า `systemConfiguration` (ตอนนี้มีแค่คีย์เดียว: เกณฑ์ trigger % ของผู้ช่วย AI, เพิ่ม 20260920 — ย้ายมาจาก hardcode เดิม) | FT-034 |

### หน้าจอ/เครื่องมือที่ไม่ใช่ส่วนหนึ่งของแอปจริง (dev only)

| ไฟล์ | หน้าที่ | หมายเหตุ |
|---|---|---|
| `app/index.html` | redirect ไป `login.html` ทันที (กัน directory listing เปล่าๆ) | ไม่ใช่หน้าจอที่มีเนื้อหา |
| `app/seed.html` | ใส่ข้อมูลตัวอย่าง/สร้างบัญชีทดสอบไว้ทดสอบ | ไม่ deploy ขึ้น production จริง (ถูก build command ลบทิ้งก่อน deploy บน Cloudflare, exclude ออกจาก Firebase Hosting) |
| `app/ai-test.html` | ทดสอบเรียก OpenRouter ตรงๆ | ตั้งใจให้รันเฉพาะ local เท่านั้น ไม่เรียกผ่าน Worker proxy |

### สิ่งที่ยังไม่มีหน้าจอจริง (ดูหัวข้อ 4)

อนุมัติระดับ 2, ส่งออก Excel, สร้างคำขอฉุกเฉิน, ปุ่ม "ขอปรึกษา" จริง, หน้า Admin จัดการ emergency data edit record, Dashboard ผู้บริหาร ฯลฯ — ยังไม่มีโค้ด

## 2. โครงสร้างข้อมูล (Firestore Schema)

Field ใช้ `camelCase`, แปลตรงจากฟิลด์เชิงแนวคิดใน `01-requirements/06-data-model.md` (รายละเอียดฟิลด์ครบดูที่ `app/README.md` หัวข้อ "Firestore Schema")

| Collection | สถานะ | คำอธิบายสั้น |
|---|---|---|
| `units/{unitId}` | ใช้งานจริง | หน่วยงาน (รพ.สต./รพ.แม่ข่าย) — doc id = ตัวระบุหน่วยเอง |
| `users/{uid}` | ใช้งานจริง | บัญชีผู้ใช้ (doc id = Firebase Auth UID) — เก็บ `role`, `unitId`, `active` ฯลฯ |
| `drugItems/{drugItemId}` | ใช้งานจริง | รายการยา (placeholder เท่านั้น ห้ามใช้ชื่อยา NCD จริง) |
| `requisitions/{requisitionId}` | ใช้งานจริง | คำขอเบิกยา — collection หลัก มี `status`, `type`, `period`, `requisitionCode` ฯลฯ |
| `requisitions/{id}/lineItems/{lineItemId}` | ใช้งานจริง (subcollection) | รายการยาที่เบิกต่อคำขอ — `suggestedQuantity`/`requestedQuantity`/`selfReportedBalance`/`pharmacistConfirmedBalance`/`approvedQuantity` |
| `requisitions/{id}/approvalRecords/{id}` | ใช้งานจริง (subcollection) | บันทึกการอนุมัติ — รอบนี้มีเฉพาะ `level: 1`, `decision`: `approved`/`rejected` |
| `counters/{unitId}_{ปีเดือน}` | ใช้งานจริง (implementation-only) | ตัวนับรันเลขของ `requisitionCode` แบบ atomic — ไม่ใช่ entity เชิงแนวคิด |
| `safetyStockThresholds/{thresholdId}` | ใช้งานจริง (อ่านอย่างเดียว) | เกณฑ์ Safety Stock ต่อหน่วย+ยา+เดือน — ยังไม่มีหน้าจอเขียนข้อมูลจริง มีแต่ข้อมูลตัวอย่างจาก `seed.html` |
| `goodsReceiptRecords/{receiptId}` | ใช้งานจริง (เขียนได้แล้ว, เพิ่ม 20260920) | รายการรับยา — เขียนจริงโดย `staff-hph/goods-receipt-confirm.html` (เดิมอ่านได้อย่างเดียว), doc id เป็น deterministic `{requisitionId}_{drugItemId}` เพื่อกันยืนยันรับยาซ้ำ |
| `businessAuditLog/{entryId}` | ใช้งานจริง (เพิ่ม 20260920, BL-008) | Audit Trail ทางธุรกิจ — เขียนโดย `lib/audit-log.js` เฉพาะ 4 `eventType` ที่มีหน้าจอจริงอยู่แล้ว (`create_requisition`/`approve_level1`/`reject_level1`/`confirm_receipt`), immutable, อ่านได้เฉพาะ admin ผ่าน `admin/audit-trail.html` |
| `systemConfiguration/{configKey}` | ใช้งานจริง (เพิ่ม 20260920, FT-034) | ค่าตั้งค่าระบบแบบ key-value, doc id = config key เอง — รอบนี้มีแค่คีย์เดียวที่ใช้จริง: `ai-trigger-threshold-percent` แก้ไขผ่าน `admin/system-settings.html` |
| `aiAssistantUsageLogs/{logId}` | ใช้งานจริง | บันทึกการเรียกใช้ผู้ช่วย AI (immutable, เก็บถาวร, อ่านได้เฉพาะ admin) |

**ยังไม่ได้สร้าง (สำรองไว้ตาม `06-data-model.md`):** `manualForecastAdjustments`, `historicalUsageRecords`, `inventoryBalances`, `notificationEvents`, `exportFiles`, `systemAccessLog`, `printableRequisitionDocuments`, และ Emergency Data Edit Record (§3.15, BL-025 — ยังไม่มีหน้าจอ Admin จัดการจริง) — `firestore.rules` ปฏิเสธการเข้าถึงทุก collection เหล่านี้ไว้ล่วงหน้า

**หมายเหตุสถานะคำขอ:** enum `status` ของ `requisitions` มีแค่ `pending_level1` → `pending_level2` → `approved` → `ready_to_export` → `dispensed` (แยก `rejected` ได้จากทุกขั้นก่อน `dispensed`) — ไม่มีค่า "รับแล้ว" แยก คำนวณจากการมี doc ใน `goodsReceiptRecords` แทน

## 3. บทบาทผู้ใช้ (User Roles)

ตาม `users.role` enum ใน Firestore จริง (ไม่ใช่แยก "เภสัชกรระดับ 1"/"ระดับ 2" เป็นคนละ role — ระดับเป็นคุณสมบัติของ `approvalRecords.level` ที่บันทึกต่อการกระทำ ไม่ใช่ต่อบัญชีผู้ใช้):

| Role (`users.role`) | มีหน้าจอจริงหรือยัง | สรุปสิทธิ์ (เต็มดูที่ [`ACL.md`](ACL.md)) |
|---|---|---|
| `staff_hph` (เจ้าหน้าที่ รพ.สต.) | ✅ มี | สร้าง/ดูคำขอเบิกของหน่วยตนเองเท่านั้น (`unitId` มาจาก `users/{uid}` เสมอ ไม่มีการเลือกหน่วยเอง) |
| `pharmacist` (เภสัชกรผู้อนุมัติ) | ✅ มี **เฉพาะขอบเขตอนุมัติระดับ 1** | อ่าน/เขียนคำขอเบิกได้ทั้งเครือข่าย, พิจารณาอนุมัติ/ปฏิเสธระดับ 1, ใช้ผู้ช่วย AI — **ยังไม่มีหน้าจอสำหรับอนุมัติระดับ 2** แม้ schema/`firestore.rules` จะกันไว้แล้วว่าคนเดียวกันอนุมัติซ้ำ 2 ระดับไม่ได้ |
| `executive` (ผู้บริหาร รพ./สสอ.) | ❌ ยังไม่มี | มี enum เตรียมไว้ใน `users.role` เท่านั้น — Dashboard ภาพรวม (spec 004) ยังไม่ถูกพัฒนา |
| `admin` (ผู้ดูแลระบบ) | ✅ มี (เพิ่ม 20260920) | สร้าง/แก้ไข/ปิดใช้งานบัญชีผู้ใช้ (`admin/user-accounts.html`), ดู Audit Trail ทางธุรกิจ (`admin/audit-trail.html`), แก้ค่าตั้งค่าระบบ (`admin/system-settings.html`) — **ยังไม่มี:** บังคับ `mustChangePassword`/2FA จริง, disable บัญชี Firebase Auth ระดับจริง (ทำได้แค่ปิดที่ `users/{uid}.active`), หน้าจัดการ emergency data edit record (BL-025), ดู log ผู้ช่วย AI ยังต้องผ่าน Firebase Console โดยตรง (ไม่มีหน้าจอ UI ในแอป) |

Session/สิทธิ์ทั้งหมดยืนยันด้วย Firebase Authentication (email/password) + `firestore.rules` ที่กรองตาม `role`/`unitId` จริง (publish แล้ว) — ไม่มีกลไก session ผ่าน `localStorage` อีกต่อไป

## 4. สิ่งที่ไม่ทำใน Module นี้ (Out of Scope ของรอบปัจจุบัน)

เรียงตามลำดับที่ระบุไว้ใน `app/README.md` หัวข้อ "ขั้นต่อไป" (ยังไม่ได้รับคำสั่งเข้าสู่เฟสพัฒนา รอคำสั่งเจาะจงทีละรายการ):

1. **อนุมัติระดับ 2 + ส่งออก Excel + แจ้งเตือนอีเมล/LINE OA** (BL-004 ส่วนระดับ 2, BL-020)
2. **Epic 2 พยากรณ์สต็อก** (BL-010/011/012) — ทำให้ `safetyStockThresholds` มีค่าจริงแทนข้อมูลตัวอย่าง, ตามด้วย auto-discrepancy warning เต็มรูปแบบ (BL-032) และช่องกรอกจำนวนคาดการณ์เคสใหม่ (BL-015/FT-013)
3. **คำขอเบิกฉุกเฉินนอกรอบ** (BL-009) — แยกจาก `requisition-new.html` ที่รองรับเฉพาะคำขอปกติ
4. **ปุ่ม "ขอปรึกษา" จริง** (BL-003) — รอ BL-014 (ช่องทางแจ้งเตือน LINE OA) ก่อน
5. **ประวัติย้อนหลัง 3 ปีสำหรับผู้ช่วย AI** — ต้องรอ Epic 2/data migration ให้ `historicalUsageRecords` มีข้อมูลจริงก่อน
6. **บังคับใช้งานจริงของ `mustChangePassword`/2FA (`twoFactorEnabled`)** — ผู้ใช้ตัดออกจากขอบเขตตอนทำหน้าจัดการบัญชีผู้ใช้ไปแล้ว (20260920) ต้องเลือก OTP/SMS provider ก่อนเริ่มได้
7. **`businessAuditLog` ครอบคลุม event อื่นเต็มรูปแบบ** ตาม data-model.md §3.14 (จ่ายผ่านระดับ 2, ขอปรึกษา, แก้ไขฉุกเฉิน) — ต้องรอหน้าจอของ event นั้นๆ เกิดขึ้นจริงก่อน
8. **หน้า Admin จัดการ Emergency Data Edit Record จริง** (BL-025) — คนละส่วนกับหน้าจัดการบัญชีผู้ใช้ที่ทำแล้ว (20260920)

**นอกเหนือจากรายการข้างต้น (ไม่มีโค้ดในโปรเจกต์นี้เลยตอนนี้):**
- **Dashboard ผู้บริหาร** ทั้งหมด (spec 004) — role `executive` มี enum เตรียมไว้แต่ไม่มีหน้าจอ
- **เชื่อมต่อระบบเดิม** JHCIS/myPCU (รพ.สต.) และ INVC (รพ.แม่ข่าย) (spec 005)
- **ผู้ช่วย AI ความสามารถ (ข) สำหรับกรณี "ปรับยอด"** — ตอนนี้ผูกเฉพาะฟอร์มปฏิเสธเท่านั้น เพราะฟอร์ม "ปรับยอด" เดิมไม่มีช่องกรอกเหตุผลอยู่แล้ว
