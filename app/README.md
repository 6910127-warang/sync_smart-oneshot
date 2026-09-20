# SmartSync — Firebase App (เริ่มพัฒนาจริง 20260901)

โฟลเดอร์นี้คือโค้ดจริงที่เชื่อมกับ **Firebase (Cloud Firestore)** — แยกจาก `../prototype/` (static mockup ที่ยังดูแลโดย `/build-prototype` ตามเดิม) และแยกจาก `../01-requirements/` (เอกสารเชิงแนวคิด ไม่ผูกเทคโนโลยี)

ฟีเจอร์ที่ทำจริงแล้ว:
- **หน้ารายการคำขอเบิกของหน่วยฉัน** (`staff-hph/requisition-list.html`) — อ้างอิง FT-002, BL-004, BL-005
- **หน้าสร้างคำขอเบิกยาประจำเดือน** (`staff-hph/requisition-new.html`, เพิ่ม 20260901) — อ้างอิง FT-001, BL-001, BL-002
- **หน้ารออนุมัติระดับ 1** (`pharmacist/approval-queue-level1.html`, เพิ่ม 20260907) — อ้างอิง FT-002, BL-004
- **หน้าพิจารณาคำขอ/อนุมัติ-ปฏิเสธระดับ 1** (`pharmacist/approval-review-level1.html`, เพิ่ม 20260907) — อ้างอิง FT-002, BL-004, BL-036 (เฉพาะขอบเขตระดับ 1 — ระดับ 2/ส่งออก/audit-trail ยังไม่ทำ)
- **Firebase Authentication (email/password) จริง** ทั้งสอง role ข้างต้น (เพิ่ม 20260907, BL-024)
- **หน้า Login กลางจุดเดียว** (`login.html`, เพิ่ม 20260908) — login แล้ว redirect ไปหน้าแรกของ role อัตโนมัติ แทนฟอร์ม login ที่เคยฝังซ้ำอยู่ใน 4 หน้าจอข้างต้น
- **ผู้ช่วย AI สำหรับเภสัชกรผู้อนุมัติระดับ 1** (`pharmacist/approval-review-level1.html`/`approval-queue-level1.html`, `lib/ai-assistant.js`, `_worker.js`, เพิ่ม 20260915) — อ้างอิง FT-036/BL-047 พร้อมบันทึกการใช้งานลง Firestore (`aiAssistantUsageLogs`, BL-048)
- **หน้ารายละเอียดคำขอ** (`staff-hph/requisition-detail.html`, เพิ่ม 20260920) — เชื่อม `lineItems`/`approvalRecords`/`goodsReceiptRecords` จริง แทนลิงก์ที่เคยปิดใช้งาน
- **หน้ายืนยันรับยา** (`staff-hph/goods-receipt-confirm.html`, เพิ่ม 20260920) — เขียน `goodsReceiptRecords` จริงครั้งแรก (เดิมอ่านได้อย่างเดียว)
- **Audit Trail ทางธุรกิจ** (`admin/audit-trail.html`, `lib/audit-log.js`, เพิ่ม 20260920, BL-008) — เขียน `businessAuditLog` จากจุดที่มีโค้ดจริงอยู่แล้วเท่านั้น (สร้างคำขอ/อนุมัติ-ปฏิเสธระดับ 1/ยืนยันรับยา)
- **จัดการบัญชีผู้ใช้** (`admin/user-accounts.html`, `lib/admin-accounts.js`, เพิ่ม 20260920) — แทน `seed.html` (dev only) สำหรับสร้าง/แก้ไข/ปิดใช้งานบัญชีจริง
- **ตั้งค่าระบบ** (`admin/system-settings.html`, เพิ่ม 20260920, FT-034) — ย้ายเกณฑ์ trigger % ผู้ช่วย AI จาก hardcode ในโค้ดมาเป็นค่าที่ปรับได้จริง (`systemConfiguration`)
- บทบาท **admin มีหน้าจอจริงครั้งแรก** ในรอบนี้ (3 หน้าข้างต้น) — `login.html` เพิ่ม `ROLE_HOME.admin` แล้ว

ทั้งหมดอ้างอิง [`../01-requirements/backlog.md`](../01-requirements/backlog.md)

## วิธีเริ่มใช้งาน

1. เปิด [`firebase-config.js`](firebase-config.js) แล้วแทนที่ค่า placeholder ด้วย config จริงจาก Firebase Console → Project settings → General → Your apps → SDK setup and configuration
2. เปิด Firestore Database ในโปรเจกต์ (โหมด Native mode) ถ้ายังไม่ได้เปิด
3. รัน local server (ดูหัวข้อ "การรันดู" ด้านล่าง) แล้วเปิด `seed.html` เพื่อสร้างข้อมูลตัวอย่างไว้ทดสอบ (ลบทิ้งได้ภายหลัง — ไม่ใช่ส่วนหนึ่งของแอปจริง)
4. ตรวจสอบว่า Firebase Console → Authentication → Sign-in method เปิดใช้งาน provider **Email/Password** แล้ว (โปรเจกต์ `syncsmart-98d1e` ปัจจุบันเปิดอยู่แล้ว — ยืนยันจากการทดสอบจริง 20260907 แต่ถ้าย้ายไปโปรเจกต์ Firebase อื่นต้องเปิดเองก่อน ไม่มีเครื่องมือทำแทนได้)
5. เปิด `login.html` แล้วเข้าสู่ระบบด้วยอีเมล/รหัสผ่านของบัญชีทดสอบที่สร้างจาก `seed.html` (เช่น `staff-hph-a@smartsync.test` หรือ `pharmacist-a@smartsync.test`) — ระบบจะ redirect ไปหน้าแรกของ role นั้นให้เองตาม `role` ใน `users/{uid}` ไม่ต้องรู้ล่วงหน้าว่าต้องเปิดหน้าไหน — ดูหัวข้อ "Firebase Authentication" ด้านล่าง

## การรันดู (local server)

config อยู่ใน `.claude/launch.json` (ชื่อ `app`, port 4174) — รันผ่าน [`.claude/no-cache-server.py`](../.claude/no-cache-server.py) (เพิ่ม 20260908) แทน `py -m http.server` ตรงๆ เพราะ `http.server` เดิมไม่ส่ง cache header ทำให้ browser แคชไฟล์ `.js`/`.html` เก่าไว้เงียบๆ (เจอปัญหาจริงตอนทดสอบ BL-024 — แก้โค้ดแล้ว refresh/hard refresh บางครั้งก็ยังเห็นพฤติกรรมเก่าค้างอยู่) wrapper นี้เพิ่มแค่ header `Cache-Control: no-store` ไม่ใช่ build tool

## Firestore Schema — collection/subcollection ที่ใช้จริงตอนนี้

Field name ฝั่ง Firestore ใช้ `camelCase` ภาษาอังกฤษ (มาตรฐาน Firestore) แปลตรงจากฟิลด์เชิงแนวคิดใน [`../01-requirements/06-data-model.md`](../01-requirements/06-data-model.md) — วงเล็บคือชื่อฟิลด์เชิงแนวคิดต้นทางเพื่อ trace กลับได้

### `units/{unitId}` — หน่วยงาน (Unit, data-model §3.1)

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `name` (ชื่อหน่วยงาน) | string | ใช่ | |
| `type` (ประเภทหน่วยงาน) | string enum: `"hph"` \| `"main"` | ใช่ | รพ.สต. / รพ.แม่ข่าย |
| `active` (สถานะการใช้งาน) | boolean | ใช่ | ใช้กรอง dropdown |
| `code` (รหัสหน่วยงานย่อ, เพิ่ม 20260901) | string | ใช่ | เช่น `"HPH01"`, `"MAIN01"` — รูปแบบ `{prefix ตามประเภท}{เลข 2 หลัก}` (`HPH` สำหรับ รพ.สต., `MAIN` สำหรับ รพ.แม่ข่าย) รองรับได้ถึง 99 หน่วยต่อประเภท — ใช้ประกอบ "รหัสคำขอ" ที่อ่านง่าย (ดูฟิลด์ `requisitionCode` ด้านล่าง) ไม่ใช่ field เชิงแนวคิดใน `06-data-model.md` §3.1 เดิม เป็น field implementation-only ที่เพิ่มตอนทำ requisitionCode |

Document ID: ตัวระบุหน่วยงานเอง (เช่น `hph-sample-a`) — ไม่ใช้ auto-id เพื่อให้ reference อ่านง่าย

### `users/{uid}` — บัญชีผู้ใช้ (User Account, data-model §3.2)

> **ใช้จริงแล้วทั้งสอง role** (อัปเดต 20260907, BL-024) — doc id คือ Firebase Auth UID จริง อ่านโดย `lib/auth.js` (`fetchUserProfile`) ทุกครั้งที่สถานะ login เปลี่ยน เพื่อดึง `role`/`unitId`/`active` มาตัดสินใจแสดงหน้าจอ — ดูหัวข้อ "Firebase Authentication" ด้านล่าง

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `displayName` | string | ใช่ | |
| `role` | string enum: `"staff_hph"` \| `"pharmacist"` \| `"executive"` \| `"admin"` | ใช่ | |
| `unitId` | string (ref → `units`) \| null | บังคับเฉพาะ `staff_hph` | |
| `email` | string | ใช่ | ใช้โดยบริการแจ้งเตือน |
| `active` | boolean | ใช่ | |
| `mustChangePassword` | boolean | ใช่ | default `true` ตอนสร้างบัญชี |
| `twoFactorEnabled` | boolean | ใช่ | default `true` เฉพาะ role เภสัชกร |

Document ID: Firebase Auth UID

### `drugItems/{drugItemId}` — รายการยา (Drug/Item Master, data-model §3.3)

**หน้า `requisition-new.html` query collection นี้** (`where active==true`, เรียงชื่อฝั่ง client — ไม่ใช้ `orderBy` ใน query เพื่อเลี่ยงต้องสร้าง composite index เพิ่ม)

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `name` | string | ใช่ | placeholder เช่น "ยา A" — ห้ามใช้ชื่อยา NCD จริง |
| `active` | boolean | ใช่ | |
| `workingCode` | string (7 หลัก) | ใช่ | unique — คีย์จับคู่ไฟล์ INVC |
| `hospitalCode` | string (4-6 ตัวอักษร) \| null | ไม่บังคับ | อนุญาตว่างได้ |
| `physicianAccountCategory` | boolean | ใช่ (default false) | หมวดบัญชีแพทย์ |
| `sourceWarehouse` | string enum: `"production"` \| `"underground"` | ใช่ | ตึกผลิต / คลังใต้ดิน |

### `requisitions/{requisitionId}` — คำขอเบิกยา (Requisition, data-model §3.4)

**Collection หลักที่หน้า `requisition-list.html` query ตรงๆ**

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `unitId` (หน่วยงานที่เบิก) | string (ref → `units`) | ใช่ | ใช้ filter `where("unitId","==",...)` |
| `createdBy` (ผู้สร้างคำขอ) | string (ref → `users`, uid) | ใช่ | uid จริงจาก Firebase Auth แล้ว (อัปเดต 20260907, BL-024) — เขียนโดย `requisition-new.html` |
| `type` (ประเภทคำขอ) | string enum: `"normal"` \| `"emergency"` | ใช่ | ปกติ (รายเดือน) / ฉุกเฉิน (นอกรอบ) |
| `period` (รอบเดือนที่เบิก) | string `"YYYY-MM"` (พ.ศ.) \| null | บังคับเฉพาะ `type="normal"` | คำขอฉุกเฉินใช้ `createdAt` แทน |
| `status` (สถานะคำขอ) | string enum: `"pending_level1"` \| `"pending_level2"` \| `"approved"` \| `"ready_to_export"` \| `"dispensed"` \| `"rejected"` | ใช่ | ดูหมายเหตุ "รับแล้ว" ด้านล่าง |
| `createdAt` (วันที่-เวลาที่สร้างคำขอ) | Firestore Timestamp | ใช่ | ใช้ `orderBy` หลักของหน้ารายการ |
| `confirmedByStaffAt` (วันที่-เวลาที่ยืนยันคำขอ) | Timestamp \| null | ไม่บังคับ | แสดงเป็นคอลัมน์ "วันที่ยื่นคำขอ" ในหน้ารายการ |
| `dispensedAt` (วันที่-เวลาที่เปลี่ยนเป็น "จ่ายแล้ว") | Timestamp \| null | ไม่บังคับ | ตั้งทันทีที่เภสัชกรระดับ 2 กดคอนเฟิร์ม |
| `recordVersion` (เวอร์ชันของบันทึก) | integer | ใช่ | เริ่ม 1, ใช้ Optimistic Concurrency Check (BL-036) — หน้ารายการยังไม่ต้องใช้ แต่หน้าอนุมัติต้องใช้ |
| `requisitionCode` (รหัสคำขอที่อ่านง่าย, เพิ่ม 20260901) | string | ใช่ | เช่น `"REQ-256908-HPH01-001"` — รูปแบบ `REQ-{ปีพ.ศ.4หลัก}{เดือน2หลัก}-{รหัสหน่วย}-{เลขรันประจำเดือนของหน่วยนั้น 3 หลัก}` สร้างครั้งเดียวตอนสร้างคำขอผ่าน [`lib/requisition-code.js`](lib/requisition-code.js) (ใช้ Firestore transaction กันเลขรันซ้ำ) — เป็น field แสดงผลเพิ่มเติม **ไม่ใช่** document ID จริง (ดูหมายเหตุด้านล่าง) และไม่ใช่ field เชิงแนวคิดใน `06-data-model.md` §3.4 เดิม |

> **หมายเหตุสถานะ "รับแล้ว":** enum `status` ของ Requisition (ตาม data-model §5) หยุดที่ `"dispensed"` — ไม่มีค่า "received" แยก เพราะการยืนยันรับยาเก็บเป็น transaction แยกใน `goodsReceiptRecords` (ไม่ overwrite สถานะคำขอ) หน้ารายการจึงเช็คว่ามี `goodsReceiptRecords` อ้างคำขอนี้หรือยัง เพื่อตัดสินใจแสดง "จ่ายแล้ว" หรือ "รับแล้ว" แทนการเพิ่ม enum ใหม่ที่ยังไม่มีใน spec

Document ID: auto-id ของ Firestore (`addDoc`) — คงเป็นตัวระบุหลักทางเทคนิค (ใช้ทำ reference จาก subcollection/collection อื่น) ส่วนรหัสที่แสดงในตาราง/เอกสารจริงคือ `requisitionCode` ด้านบน (ยืนยันรูปแบบกับผู้ใช้ 20260901)

### `counters/{unitId}_{ปีพ.ศ.4หลัก}{เดือน2หลัก}` — ตัวนับรหัสคำขอต่อหน่วยต่อเดือน (เพิ่ม 20260901, implementation-only)

> ไม่ใช่ entity เชิงแนวคิดใน `06-data-model.md` — เป็นกลไก implementation ล้วนๆ สำหรับ generate เลขรันของ `requisitionCode` แบบ atomic (กันเลขซ้ำเมื่อสร้างคำขอพร้อมกันหลายคำขอในหน่วย+เดือนเดียวกัน) ดูโค้ดที่ [`lib/requisition-code.js`](lib/requisition-code.js)

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `count` | integer | ใช่ | เลขรันล่าสุดที่ออกไปแล้วของหน่วย+เดือนนั้น |
| `unitId` | string (ref → `units`) | ใช่ | ใช้ query ตอน seed/ล้างข้อมูลทดสอบ |
| `yearMonthBE` | string | ใช่ | เก็บซ้ำไว้เพื่อ debug อ่านง่าย (ไม่ได้ใช้ query) |

#### Subcollection: `requisitions/{requisitionId}/lineItems/{lineItemId}` — รายการยาที่เบิก (data-model §3.5)

**`requisition-new.html` เขียนข้อมูลจริงตอนสร้างคำขอ** (ยังไม่มีหน้าอ่าน/แสดงรายละเอียดคำขอจริง — ดู "ขั้นต่อไป")

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `drugItemId` (รายการยา) | string (ref → `drugItems`) | ใช่ | |
| `suggestedQuantity` (ยอดแนะนำเบิก) | integer | ใช่ | คำนวณตอนยืนยันคำขอ = `max(safetyStockThresholds.thresholdValue - selfReportedBalance, 0)` — ถ้าหน่วย/รายการยานั้นยังไม่มี threshold ของเดือนนี้ ใช้ `0` (แสดงผล "— (ยังไม่ตั้งเกณฑ์)" ในฟอร์ม) |
| `requestedQuantity` (ยอดขอเบิก) | integer | ใช่ | **เพิ่ม 20260915 (FR-1.1c, FT-036/BL-047):** เท่ากับ `suggestedQuantity` เสมอ เว้นแต่เจ้าหน้าที่กรอกยอดที่ต้องการขอเบิกจริงผ่านปุ่ม "ขอปรึกษา" (FR-1.1b) — ปุ่มนี้ยัง `disabled` อยู่เสมอในรอบนี้ (รอ BL-014 เชื่อม LINE OA จริง) ช่องกรอกต่อแถวจึงถูกเตรียม logic ไว้ล่วงหน้าเท่านั้น (`requisition-new.html`) ทำให้ `requestedQuantity == suggestedQuantity` ทุกแถวในทางปฏิบัติจนกว่า BL-014 จะเสร็จ — ใช้เป็นฐานเปรียบเทียบของ FR-8.4 (ผู้ช่วย AI, ยังไม่ได้รับคำสั่งเข้าสู่เฟสพัฒนา) |
| `selfReportedBalance` (ยอดคงเหลือปัจจุบันที่แจ้งเอง) | integer | ใช่ | เก็บไว้ไม่ถูกเขียนทับแม้กระทบยอดภายหลัง |
| `pharmacistConfirmedBalance` (ยอดคงเหลือที่เภสัชกรยืนยัน/แก้ไข) | integer \| null | ไม่บังคับ | มีค่า = ยอดที่ถูกต้อง/มีผลผูกพันแทนยอดเดิม (FR-1.9b) — เขียนจริงแล้วโดย `pharmacist/approval-review-level1.html` (เพิ่ม 20260907) แต่เป็นช่องกรอก **manual/สมัครใจ** เท่านั้น ไม่มี auto-detect ยอดไม่ตรงกัน (BL-032 เต็มรูปแบบต้องรอ `inventoryBalances`/Epic 2) |
| `approvedQuantity` (ยอดที่อนุมัติจริง) | integer \| null | ไม่บังคับ | ว่างจนผ่านอนุมัติระดับ 1 — `requisition-new.html` เขียนเป็น `null` เสมอตอนสร้าง, เขียนค่าจริงโดย `pharmacist/approval-review-level1.html` (เพิ่ม 20260907) |

#### Subcollection: `requisitions/{requisitionId}/approvalRecords/{approvalRecordId}` — บันทึกการอนุมัติ (data-model §3.6)

> ใช้จริงแล้ว (เพิ่ม 20260907) โดย `pharmacist/approval-review-level1.html` — เขียนเฉพาะ `decision: "approved"` (level 1) และ `"rejected"` เท่านั้นในรอบนี้ ยังไม่มี `"adjusted"` และยังไม่มี record ของ level 2 (รอทำหน้าอนุมัติระดับ 2)

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `level` (ระดับการอนุมัติ) | integer: `1` \| `2` | ใช่ | |
| `approverId` (ผู้อนุมัติ) | string (ref → `users`, uid) | ใช่ | ต้องไม่ใช่ uid เดียวกับระดับอื่นของคำขอเดียวกัน — บังคับที่ชั้น business logic ตอนเขียนจริง ไม่ใช่ Firestore rule เพียงอย่างเดียว |
| `decision` (ผลการพิจารณา) | string enum: `"approved"` \| `"rejected"` \| `"adjusted"` | ใช่ | |
| `reason` (เหตุผล) | string \| null | บังคับเฉพาะ `rejected`/`adjusted` | |
| `decidedAt` (วันที่-เวลาที่พิจารณา) | Timestamp | ใช่ | |

### `safetyStockThresholds/{thresholdId}` — เกณฑ์ Safety Stock (data-model §3.8, เพิ่ม 20260901)

**หน้า `requisition-new.html` query collection นี้** (`where unitId==...` — กรอง `referenceMonth` ตรงกับเดือนปัจจุบันฝั่ง client แทนการเพิ่ม equality filter ที่สองใน query) เพื่อคำนวณ "ยอดแนะนำเบิก" — **ยังไม่มีหน้าจอเขียนข้อมูลนี้จริง** (Epic 2 พยากรณ์สต็อก/BL-010/BL-011 ยังไม่ implement) ตอนนี้มีเฉพาะข้อมูลตัวอย่างจาก `seed.html`

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `unitId` (หน่วยงาน) | string (ref → `units`) | ใช่ | |
| `drugItemId` (รายการยา) | string (ref → `drugItems`) | ใช่ | |
| `referenceMonth` (เดือนอ้างอิง) | string `"YYYY-MM"` (พ.ศ.) | ใช่ | เก็บเป็น string รูปแบบเดียวกับ `requisitions.period` (data-model ระบุเป็น "Date เดือน-ปี" เชิงแนวคิด) |
| `thresholdValue` (ค่าเกณฑ์ Safety Stock) | integer | ใช่ | |
| `calculationSource` (ที่มาของค่า) | string enum: `"คำนวณเริ่มต้น (Year-over-year)"` \| `"ปรับปรุงต่อเนื่องอัตโนมัติ"` | ใช่ | ข้อมูลตัวอย่างจาก `seed.html` ใช้ค่าแรกเสมอ |
| `latestActualUsage` (ยอดใช้จริงล่าสุด) | integer \| null | ไม่บังคับ | ยังไม่มีการเขียนจริง (ต้องรอ BL-012) |
| `lastCalculatedAt` (วันที่คำนวณล่าสุด) | Timestamp | ใช่ | ยังไม่ได้เขียนใน seed script รอบนี้ — ต้องเพิ่มเมื่อ Epic 2 ทำจริง |

Document ID: `{unitId}_{drugItemId}_{referenceMonth}` (deterministic — เขียนทับได้ปลอดภัยเมื่อ re-seed)

### `goodsReceiptRecords/{receiptId}` — รายการรับยา (Goods Receipt Record, data-model §3.10)

**หน้ารายการ query collection นี้เพื่อตัดสินใจแสดง "รับแล้ว"** — เขียนจริงแล้ว (เพิ่ม 20260920) โดย `staff-hph/goods-receipt-confirm.html`
(เดิมอ่านได้อย่างเดียว) Document ID เป็น deterministic `{requisitionId}_{drugItemId}` (ไม่ใช่ auto-id) เพื่อให้ Firestore ตีความการยืนยันซ้ำ
เป็น `update` แล้วโดน `firestore.rules` ปฏิเสธอัตโนมัติ (กันยืนยันรับยาซ้ำโดยไม่ต้องเช็ค exists() เพิ่มฝั่ง client)

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `requisitionId` (คำขอเบิกยาที่อ้างอิง) | string (ref → `requisitions`) | ใช่ | ต้องเป็นคำขอสถานะ `"dispensed"` เท่านั้น |
| `drugItemId` (รายการยา) | string (ref → `drugItems`) | ใช่ | |
| `receivingUnitId` (หน่วยงานผู้รับ) | string (ref → `units`) | ใช่ | |
| `receivedQuantity` (จำนวนที่รับจริง) | integer | ใช่ | |
| `confirmedBy` (ผู้ยืนยันรับ) | string (ref → `users`, uid) | ใช่ | |
| `confirmedAt` (วันที่-เวลาที่ยืนยันรับ) | Timestamp | ใช่ | |

### `businessAuditLog/{entryId}` — Audit Trail ทางธุรกิจ (data-model §3.14, เพิ่ม 20260920, BL-008)

> **ขอบเขตปัจจุบัน:** บันทึกเฉพาะ `eventType` ที่มีหน้าจอจริงเขียนอยู่แล้ว 4 ค่า (`create_requisition`, `approve_level1`, `reject_level1`, `confirm_receipt`)
> — event อื่นที่ data-model.md §3.14 ระบุไว้เชิงแนวคิด ("จ่าย"/ระดับ 2, "ขอปรึกษา"/BL-003, "แก้ไขฉุกเฉิน"/BL-025) ยังไม่มีหน้าจอจริง จึงยังไม่บันทึก —
> เพิ่ม `eventType` ใหม่ที่นี่พร้อม `firestore.rules` ทุกครั้งที่มีหน้าจอนั้นจริง อ่านได้เฉพาะ admin (เหมือน precedent ของ `aiAssistantUsageLogs`)
> เขียนแบบ immutable (แก้/ลบไม่ได้เลยแม้แต่ admin) — เขียนโดย `lib/audit-log.js` (fire-and-forget หลัง action หลักสำเร็จเสมอ ทุกจุด
> รวมถึง `pharmacist/approval-review-level1.html` ที่เขียนแยกหลัง `runTransaction` ของการอนุมัติ/ปฏิเสธสำเร็จแล้ว — ตั้งใจไม่รวมเป็น
> atomic เดียวกับ `approvalRecords` เพื่อไม่ให้การ deploy `firestore.rules` ของ collection ใหม่นี้ไปผูกติดกับความสำเร็จของฟีเจอร์
> อนุมัติ/ปฏิเสธที่ทำงานอยู่แล้ว)

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `actorId` (ผู้กระทำ) | string (ref → `users`, uid) | ใช่ | ต้องตรงกับ `request.auth.uid` ของผู้เขียนเสมอ |
| `eventType` (ประเภทเหตุการณ์) | string enum: `"create_requisition"` \| `"approve_level1"` \| `"reject_level1"` \| `"confirm_receipt"` | ใช่ | ใช้ค่าภาษาอังกฤษตาม convention เดียวกับ enum อื่นในโปรเจกต์ (ต่างจากตัวอย่างภาษาไทยใน data-model.md §3.14) |
| `relatedEntityType` (ชนิดเอนทิตีที่เกี่ยวข้อง) | string | ใช่ | ค่าคงที่ `"requisition"` เสมอในรอบนี้ (ทุก event ที่มีอยู่ตอนนี้เกี่ยวกับคำขอเบิกทั้งหมด) |
| `relatedEntityId` (เอนทิตี/รายการที่เกี่ยวข้อง) | string (ref → `requisitions`) | ใช่ | |
| `eventDetail` (รายละเอียดเหตุการณ์) | string | ใช่ | ข้อความสรุปอ่านง่าย เช่น "สร้างคำขอเบิก REQ-... (3 รายการยา)" |
| `occurredAt` (วันที่-เวลาที่เกิดเหตุการณ์) | Timestamp | ใช่ | ใช้ `new Date()` ฝั่ง client (convention เดียวกับ `approvalRecords.decidedAt`) ไม่ใช้ `serverTimestamp()` |

### `systemConfiguration/{configKey}` — ค่าตั้งค่าระบบ (data-model §3.18, เพิ่ม 20260920, FT-034)

> Document ID = Config Key เอง (kebab-case ภาษาอังกฤษ เช่น `ai-trigger-threshold-percent`) ไม่ใช่ auto-id — แก้ไข/สร้างจริงโดย
> `admin/system-settings.html` (generic key-value editor ไม่ผูกกับ key ใดตายตัว) **รอบนี้มีแค่ key เดียวที่โค้ดจริงใช้งานอยู่:**
> `ai-trigger-threshold-percent` (ย้ายมาจาก `AI_TRIGGER_THRESHOLD_PERCENT` hardcode เดิมใน `pharmacist/approval-queue-level1.html`/
> `approval-review-level1.html`, FR-8.4) — ทั้งสองหน้าอ่านค่านี้จาก Firestore ตอนโหลดหน้า มี fallback เป็น `25` ถ้ายังไม่มี doc นี้อยู่
> (เช่น deploy ครั้งแรกก่อน admin ตั้งค่า/ก่อนรัน `seed.html`) ไม่ throw ถ้าอ่านไม่สำเร็จ

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `currentValue` (ค่าปัจจุบัน) | string | ใช่ | เก็บเป็นข้อความเสมอตาม data-model.md (แม้ความหมายจริงเป็นตัวเลข) — parse เป็น number ฝั่ง client ที่ใช้งาน |
| `description` (คำอธิบาย) | string | ใช่ | แสดงประกอบหน้าตั้งค่าของ admin |
| `lastUpdatedBy` (ผู้แก้ไขล่าสุด) | string (ref → `users`, uid) \| null | ไม่บังคับ | `null` ถ้ายังไม่เคยแก้จากค่าเริ่มต้น (เช่น doc ที่ `seed.html` สร้างไว้) |
| `lastUpdatedAt` (วันที่-เวลาที่แก้ไขล่าสุด) | Timestamp \| null | ไม่บังคับ | `null` คู่กับ `lastUpdatedBy` ด้านบน |

### `aiAssistantUsageLogs/{logId}` — บันทึกการใช้งานผู้ช่วย AI (เพิ่ม 20260915, implementation-only, BL-048/FR-8.7-FR-8.11)

> ไม่ใช่ entity เชิงแนวคิดใน `06-data-model.md` (เทียบเคียง `counters` ด้านบน) — เป็น audit log แคบๆ เฉพาะการเรียกใช้ผู้ช่วย AI ของ FT-036/BL-047 เท่านั้น **ไม่ใช่** Business Audit Trail เต็มรูปแบบ (BL-008/`businessAuditLog` ที่ยังไม่ถูกสร้าง) เขียนจริงโดย `lib/ai-assistant.js` (`logAiAssistantUsage`) ทันทีหลังได้รับผลลัพธ์สำเร็จจาก `/api/ai-assist` — เขียนจากฝั่ง **client** ตาม FR-8.11 ไม่ใช่ฝั่ง Worker (trade-off ความน่าเชื่อถือ: ถ้า browser หลุด/ปิดแท็บก่อนเขียนเสร็จ รายการนั้นจะไม่ถูกบันทึกและไม่มี retry อัตโนมัติ) เปิดดูได้ผ่าน Firebase Console โดย admin เท่านั้น (ยังไม่มีหน้าจอ UI ในแอปให้ดู) — เอกสารแก้ไข/ลบไม่ได้เลย (immutable) และไม่มีนโยบายลบ/TTL (เก็บถาวร)
>
> **หมายเหตุ enum:** ฟิลด์ `capability`/`callerRole` ใช้ค่าภาษาอังกฤษ (`"deviation-summary"`/`"draft-reason"`, `"pharmacist"`) แทนป้ายภาษาไทยที่ปรากฏในตารางผนวกของ [spec 008](../01-requirements/01-spec/20260914-008-pharmacist-approval-ai-assistant.md) — ตั้งใจให้สอดคล้องกับ enum ภาษาอังกฤษที่ใช้จริงอยู่แล้วทั้งไฟล์นี้ (`kind` เดิมใน `ai-assistant.js`) และ `firestore.rules` (`role`/`status`/`decision`/`type`) ป้ายภาษาไทยในตาราง spec เป็นคำอธิบายความหมาย ไม่ใช่ค่าที่บังคับใช้ตัวอักษรตรงตัว

| Field | ชนิด | จำเป็น | หมายเหตุ |
|---|---|---|---|
| `callerId` (ผู้เรียก) | string (ref → `users`, uid) | ใช่ | ต้องตรงกับ `request.auth.uid` ของผู้เขียนเสมอ (บังคับที่ `firestore.rules`) |
| `callerRole` (บทบาทผู้เรียก ณ ขณะเรียก) | string enum: `"pharmacist"` | ใช่ | ปัจจุบันมีค่าเดียวเท่านั้นตามขอบเขต FR-8.1 |
| `requisitionId` (คำขอเบิกยาที่เกี่ยวข้อง) | string (ref → `requisitions`) | ใช่ | คำขอที่กำลังพิจารณาขณะเรียกใช้ผู้ช่วย AI |
| `capability` (ความสามารถที่เรียก) | string enum: `"deviation-summary"` \| `"draft-reason"` | ใช่ | ตรงกับ `kind` ที่ส่งให้ `/api/ai-assist` |
| `inputPayload` (ข้อมูลนำเข้าที่ส่งให้ AI) | string (JSON-encoded) | ใช่ | `JSON.stringify()` ของ payload ที่ส่งให้ผู้ช่วย AI (`requisitionCode`/`unitName`/`lineItems`) |
| `outputText` (ผลลัพธ์ที่ได้จาก AI) | string | ใช่ | เนื้อหาที่แสดงให้เภสัชกรดู/ pre-fill ลงฟอร์มจริง |
| `calledAt` (วันที่-เวลาที่เรียกใช้) | Timestamp | ใช่ | เวลาที่ client เขียน log (หลังได้ผลลัพธ์สำเร็จ) — ใช้ `new Date()` ตาม convention เดิมของโปรเจกต์ (เทียบ `decidedAt` ใน `approvalRecords`) ไม่ใช้ `serverTimestamp()` |

## Collection อื่นที่ยังไม่ต้องสร้าง (สำรอง — ใช้ตอนทำหน้าจอถัดไป)

อ้างอิงจาก `06-data-model.md` §3.7, §3.9, §3.12, §3.13, §3.15, §3.16, §3.17, §3.19 (`manualForecastAdjustments`, `historicalUsageRecords`, `inventoryBalances`, `notificationEvents`, `exportFiles`, `systemAccessLog`, `printableRequisitionDocuments`, และ Emergency Data Edit Record §3.15) — ยังไม่สร้างในรอบนี้เพราะยังไม่มีหน้าจอที่ต้องใช้ ให้ออกแบบ field ตอนถึงหน้าจอที่ต้องใช้จริง (คงรูปแบบ camelCase + trace กลับ field เชิงแนวคิดเดียวกับหัวข้อบนนี้) — `businessAuditLog` (§3.14) และ `systemConfiguration` (§3.18) สร้างจริงแล้ว (เพิ่ม 20260920) ดูหัวข้อด้านบน

## Firebase Authentication (BL-024, เพิ่ม 20260907; login กลาง + แก้บั๊ก cross-tab เพิ่ม 20260908)

เข้าสู่ระบบด้วย **email/password จริง** ผ่าน Firebase Authentication แทนกลไกล็อก session ชั่วคราวผ่าน `localStorage` เดิมทั้งสองแบบแล้ว (`lib/session.js` ของ staff-hph และ `lib/pharmacist-session.js`/`lib/pharmacists.js` ของเภสัชกร — **ลบทั้งสามไฟล์ทิ้งแล้ว**)

- **`login.html`** (เพิ่ม 20260908) — จุดเข้า login เดียวสำหรับทั้งสอง role แทนฟอร์ม login ที่เคยฝังซ้ำอยู่ใน 4 หน้าจอ กรอกอีเมล/รหัสผ่านแล้ว redirect ไปหน้าแรกของ role นั้นอัตโนมัติ (`ROLE_HOME` map ในไฟล์นี้) ตาม `role` ที่อ่านจาก `users/{uid}` — ถ้า login สำเร็จแต่ role ยังไม่มีหน้าจอรองรับ หรือ staff_hph ที่ไม่มี `unitId` จะค้างอยู่หน้านี้พร้อมข้อความ + ปุ่ม "ออกจากระบบ" แทนการ redirect ไปที่ที่ไม่มีอยู่จริง
- **`lib/auth.js`** — ไฟล์เดียวที่ทั้งสอง role ใช้ร่วมกัน:
  - `getAuthForApp(app)`, `signIn(auth, email, password)`, `signOutUser(auth)` — ห่อ Firebase Auth SDK ตรงๆ
  - `fetchUserProfile(db, uid)` — อ่าน `users/{uid}`, คืน `null` ถ้าไม่พบ doc หรือ `active !== true`
  - `watchAuth(auth, db, expectedRole, callbacks)` — ห่อ `onAuthStateChanged` ให้เรียก `onSignedIn(profile)`/`onSignedOut(message?)`/`onWrongRole(profile)` อัตโนมัติทุกครั้งที่สถานะ login เปลี่ยน (รวมถึงตอนโหลดหน้าครั้งแรกและตอน login/logout จากแท็บอื่น — Firebase sync สถานะข้ามแท็บให้เองอยู่แล้ว ไม่ต้องฟัง `storage` event เพิ่มเหมือนกลไกเดิม)
  - `authErrorMessage(err)` — แปล error code ของ Firebase Auth เป็นข้อความไทย
- **สำคัญ — ไม่ sign out อัตโนมัติเมื่อ role ไม่ตรง (แก้บั๊ก 20260908):** ตอนแรก `watchAuth` เรียก `signOutUser()` ทันทีที่เจอ role ไม่ตรง แต่ Firebase Auth ใช้ persistence เดียวกันข้ามทุกแท็บของ origin เดียวกัน — ถ้าเปิดหน้า staff-hph ค้างไว้อีกแท็บระหว่างที่ login หน้าเภสัชกรถูกต้องอยู่แล้วในอีกแท็บ การ sign out อัตโนมัติในแท็บที่ role ไม่ตรงจะไปเตะแท็บที่ login ถูกต้องอยู่แล้วให้หลุดไปด้วย (วนกลับมาหน้า login ไม่จบ) ตอนนี้แก้แล้วโดยไม่ sign out อัตโนมัติ — แค่เรียก `onWrongRole`/`onSignedOut` ให้หน้าจอ redirect ไป `login.html` เฉยๆ ผู้ใช้ต้องกด "ออกจากระบบ" เองถ้าต้องการเปลี่ยนบัญชี (ปุ่มนี้โชว์เสมอเมื่อมี `auth.currentUser`)
- แต่ละหน้าจอ (`requisition-list.html`, `requisition-new.html`, `requisition-detail.html`, `goods-receipt-confirm.html`, `approval-queue-level1.html`, `approval-review-level1.html`, `admin/audit-trail.html`, `admin/user-accounts.html`, `admin/system-settings.html`) เรียก `watchAuth(auth, db, "staff_hph" | "pharmacist" | "admin", {...})` เพื่อ **guard** เท่านั้น (ไม่มีฟอร์ม login ฝังอยู่แล้ว) — ถ้าไม่ login/role ไม่ตรง/ไม่มี `unitId` จะ `location.replace("../login.html")` กลับไปที่จุดเดียว — `watchAuth` เป็น generic อยู่แล้ว (รับ `expectedRole` เป็น string ใดก็ได้) จึงไม่ต้องแก้ `lib/auth.js` เพิ่มตอนเพิ่ม role `admin` (เพิ่ม 20260920)
- `requisition-list.html`/`requisition-new.html`: "หน่วยของฉัน" มาจาก `profile.unitId` เสมอ (ไม่มีการเลือกหน่วยเองอีกต่อไป — เจ้าหน้าที่ รพ.สต. สังกัด 1 หน่วยเท่านั้น ตาม [ACL.md](../ACL.md))
- `approval-queue-level1.html`/`approval-review-level1.html`: ตัวตนเภสัชกรมาจาก `profile.uid`/`profile.displayName` ตรงๆ — ใช้แยกแยะรายบุคคลจริงสำหรับกฎ "ห้ามอนุมัติซ้ำทั้ง 2 ระดับ" (BL-004)
- `lib/units.js` (`fetchActiveUnits`) ยังใช้อยู่ — แต่เฉพาะแสดงชื่อหน่วยในตาราง (เช่น คอลัมน์ "หน่วย รพ.สต." ของ `approval-queue-level1.html`) ไม่ใช้ทำ dropdown login แล้ว
- **สร้างบัญชีทดสอบผ่าน `seed.html`** (dev only) — ดูหัวข้อ "วิธีเริ่มใช้งาน" ด้านบน ยังไม่มีหน้าจอ admin สร้างบัญชีจริง (`mustChangePassword`/`twoFactorEnabled` เป็นแค่ field ที่เก็บไว้ ยังไม่มี logic บังคับใช้งานจริงในรอบนี้)

## Firestore Composite Index ที่ต้องสร้าง (ครั้งเดียว)

Query ของหน้า `requisition-list.html` รวม equality filter กับ `orderBy` บนคนละฟิลด์ ซึ่ง Firestore ไม่สร้าง index ให้อัตโนมัติ ต้องกดสร้างเองครั้งเดียวต่อโปรเจกต์ (ลิงก์ด้านล่างสร้างจาก error จริงของโปรเจกต์ `syncsmart-98d1e` — ถ้าย้ายไปโปรเจกต์อื่นต้องสร้างใหม่ หรือกดลิงก์ที่ error message แจ้งตอนรันจริง):

1. **`units`**: `active` (equality) + `name` (order) — [สร้าง index นี้](https://console.firebase.google.com/v1/r/project/syncsmart-98d1e/firestore/indexes?create_composite=Ck1wcm9qZWN0cy9zeW5jc21hcnQtOThkMWUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3VuaXRzL2luZGV4ZXMvXxABGgoKBmFjdGl2ZRABGggKBG5hbWUQARoMCghfX25hbWVfXxAB)
2. **`requisitions`**: `unitId` (equality) + `createdAt` (order, descending) — [สร้าง index นี้](https://console.firebase.google.com/v1/r/project/syncsmart-98d1e/firestore/indexes?create_composite=ClRwcm9qZWN0cy9zeW5jc21hcnQtOThkMWUvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3JlcXVpc2l0aW9ucy9pbmRleGVzL18QARoKCgZ1bml0SWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC)

หลังกดแต่ละลิงก์ Firebase Console จะเปิดหน้า "Add index" ให้ตรงตามที่ query ต้องการอยู่แล้ว แค่กด "Create" แล้วรอสถานะเปลี่ยนเป็น "Enabled" (ปกติไม่กี่นาที) ก่อนกลับมารีเฟรชหน้า `requisition-list.html`

**หมายเหตุ (เพิ่ม 20260907):** หน้า `pharmacist/approval-queue-level1.html` query `requisitions` ด้วย `where status=="pending_level1"` **โดยตั้งใจไม่ใส่ `orderBy`** แล้วเรียง `createdAt` ฝั่ง client แทน (เหมือน pattern ของ `drugItems`/`units`) เพื่อเลี่ยงต้องสร้าง composite index ที่ 3 — อย่าเผลอเพิ่ม `orderBy` เข้าไปตรงๆ เพราะจะทำให้ query พังจนกว่าจะสร้าง index ใหม่

## ความปลอดภัย (Security Rules publish จริงแล้ว 20260909, อัปเดตล่าสุด 20260915 เพิ่มกฎ `aiAssistantUsageLogs` — deploy ผ่าน Firebase CLI)

**[`../firestore.rules`](../firestore.rules) กรองตาม `role`/`unitId` จริงแล้ว** (เพิ่ม 20260908, แทนกฎเดิม "แค่ต้อง login") — สรุปกฎหลัก:

- `users/{uid}`: อ่านได้เฉพาะ doc ตัวเองหรือ admin, เขียนได้เฉพาะ admin
- `units`/`drugItems`: อ่านได้ทุก role ที่ login แล้ว (ข้อมูลอ้างอิงไม่ sensitive), เขียนได้เฉพาะ admin (`units`) หรือ admin/เภสัชกร (`drugItems`)
- `safetyStockThresholds`: staff-hph อ่านได้เฉพาะเกณฑ์ของหน่วยตัวเอง, เภสัชกร/ผู้บริหาร/admin อ่านได้ทั้งเครือข่าย, เขียนได้เฉพาะ admin/เภสัชกร
- `counters`: กรองตาม `unitId` เช่นกัน (staff-hph แก้ได้เฉพาะตัวนับของหน่วยตัวเอง)
- `requisitions`: staff-hph อ่าน/สร้างได้เฉพาะของหน่วยตัวเอง (สร้างต้องเริ่มที่ `status: "pending_level1"`, `recordVersion: 1` เท่านั้น กัน client ปลอมสถานะข้ามขั้นตอน) — เภสัชกร/ผู้บริหาร/admin อ่านได้ทั้งเครือข่าย — เภสัชกรแก้ได้เฉพาะ `status`/`recordVersion` ตอน pending_level1 เท่านั้น (ขอบเขตปัจจุบัน: เฉพาะ transition ของระดับ 1 — ต้องขยายกฎตอนทำหน้าอนุมัติระดับ 2 จริง) — **ห้ามลบจาก client เด็ดขาด**
  - `lineItems`/`approvalRecords` (subcollection): สิทธิ์อ่าน/เขียนอิงจาก `unitId`/`status` ของคำขอแม่ (อ่านผ่าน `get()`) — เภสัชกรแก้ `lineItems` ได้เฉพาะ `approvedQuantity`/`pharmacistConfirmedBalance`, สร้าง `approvalRecords` ได้เฉพาะ `level: 1` เท่านั้น (ขอบเขตปัจจุบัน) — ทั้งคู่ **ห้ามแก้/ลบหลังสร้างแล้ว**
- `goodsReceiptRecords`: staff-hph อ่านได้เฉพาะของหน่วยตัวเอง (ตาม `receivingUnitId`) **และเขียน (`create`) ได้เฉพาะของหน่วยตัวเองด้วย (เพิ่ม 20260920)** เฉพาะคำขอสถานะ `dispensed` ของหน่วยตัวเองเท่านั้น — เภสัชกร/ผู้บริหาร/admin อ่านได้ทั้งเครือข่าย — **ห้ามแก้/ลบหลังสร้างแล้ว** (ใช้ deterministic doc id กันยืนยันซ้ำ ดูหัวข้อ schema ด้านบน)
- **(เพิ่ม 20260915, BL-048)** `aiAssistantUsageLogs`: อ่านได้เฉพาะ admin, เขียน (`create`) ได้เฉพาะเภสัชกรที่เขียนบันทึกของตัวเอง (`callerId == request.auth.uid`) — **ห้ามแก้/ลบเอกสารที่มีอยู่แล้วเลยแม้แต่ admin** (immutable) — publish แล้ว 20260915 ผ่าน `firebase.cmd deploy --only firestore:rules`
- **(เพิ่ม 20260920, BL-008)** `businessAuditLog`: อ่านได้เฉพาะ admin, เขียน (`create`) ได้เฉพาะเจ้าของเหตุการณ์เอง (`actorId == request.auth.uid`) กรองตาม `eventType` ↔ role ให้ตรงกัน (staff-hph เขียนได้แค่ `create_requisition`/`confirm_receipt`, เภสัชกรเขียนได้แค่ `approve_level1`/`reject_level1`) — **ห้ามแก้/ลบเลยแม้แต่ admin** (immutable)
- **(เพิ่ม 20260920, FT-034)** `systemConfiguration`: อ่านได้ทุก role ที่ login แล้ว (ไม่ sensitive, หลายหน้าจอต้องอ่านค่าเดียวกัน), เขียน (`create`/`update`) ได้เฉพาะ admin — ไม่เปิดสิทธิ์ `delete` เลย (ไม่มีหน้าจอลบ กันเผลอลบ key ที่โค้ดอื่นพึ่งพาอยู่)
- collection อื่นที่ยังไม่ได้สร้าง (ดูหัวข้อด้านบน) — ปฏิเสธทุกการเข้าถึงไว้ก่อนอย่างชัดเจน

**Publish แล้ว (20260920)** กฎ 3 ข้อล่าสุด (`goodsReceiptRecords` create, `businessAuditLog`, `systemConfiguration`) ผ่าน `firebase.cmd deploy --only firestore:rules` — คอมไพล์ผ่านและ release สำเร็จ (`syncsmart-98d1e`) หน้าจอ `staff-hph/goods-receipt-confirm.html`, `admin/audit-trail.html`, `admin/user-accounts.html`, `admin/system-settings.html` ใช้งานได้จริงแล้วทั้งบน local server และ production

**หมายเหตุการเปลี่ยนโค้ดที่มากับกฎชุดนี้ (สำคัญ):**
- `requisition-new.html` เปลี่ยนจากเขียน `requisitions` doc + `lineItems` subcollection ใน `writeBatch` เดียวกัน มาเป็น `await setDoc(reqRef, ...)` ให้ commit เสร็จก่อน แล้วค่อย `writeBatch` แยกสำหรับ `lineItems` — เพราะ security rule ของ `lineItems` ต้อง `get()` อ่าน `unitId`/`status` ของคำขอแม่กลับมาเช็ค แต่ Firestore ไม่การันตีว่า `get()` ใน security rule จะเห็นงานเขียนอื่นที่อยู่ใน batch/transaction เดียวกัน (เอกสาร Firestore ระบุชัดว่า "get() might not reflect changes made by other operations within the same request") จึงต้องแยกเป็นคนละ request เพื่อให้ rule ประเมินถูกต้อง — **ผลข้างเคียงที่ยอมรับ:** ถ้า batch ของ `lineItems` fail หลัง `requisitions` doc commit ไปแล้ว จะเหลือคำขอเบิกที่ไม่มีรายการยา (orphan) ค้างไว้ — เป็น edge case ที่หายากมาก (ไม่มี backend/Cloud Function ให้ rollback อัตโนมัติในสถาปัตยกรรม static ล้วนของโปรเจกต์นี้)
- `requisition-list.html` เพิ่ม `where("receivingUnitId", "==", unitId)` เข้าไปใน query ของ `hasReceipt()` (เดิมกรองแค่ `requisitionId`) — เพราะ security rule ของ `goodsReceiptRecords` กรองตาม `receivingUnitId` และ Firestore ปฏิเสธทั้ง query ทันทีถ้า query ไม่มี equality filter ที่ตรงกับเงื่อนไขใน rule (ไม่ใช่แค่กรองผลลัพธ์บางส่วนออก)

**ผลกระทบต่อ `seed.html` (dev tool) — สำคัญ:** กฎชุดนี้จะทำให้ `seed.html` เขียนข้อมูลไม่ได้อีกต่อไปในหลายจุด เพราะ:
- เขียน `users/{uid}` ต้องเป็น admin เท่านั้น (seed.html ไม่ได้ login เป็น admin)
- เขียน/ลบ `requisitions`, `counters` ต้องผ่านการเช็ค role/unitId ที่ seed script (ซึ่งรันแบบไม่ login บน primary Firestore instance) ไม่ผ่านเช่นกัน
- ลบ `requisitions`/`counters` ไม่ได้เลยจาก client (ตั้งใจปิดไว้ถาวร แม้เป็น admin)

ทางเลือกสำหรับ dev/test ต่อจากนี้ (เลือกใช้ได้ตามสะดวก ไม่มีอันไหน "ถูกต้อง" ตายตัว):
1. สลับไปใช้กฎเดิม (`allow read, write: if request.auth != null;`) ชั่วคราวตอนรัน `seed.html` แล้วเปลี่ยนกลับมาใช้กฎชุดนี้ก่อนทดสอบ RBAC จริง
2. สร้าง Firebase project แยกสำหรับ dev/test ที่ยังใช้กฎแบบเปิด ส่วน project จริงใช้กฎชุดนี้
3. ใส่ข้อมูลตัวอย่างผ่าน Firebase Console → Firestore Database (แก้ข้อมูลตรงผ่าน Console ไม่ถูกจำกัดโดย Security Rules เพราะไม่ได้ผ่าน client SDK)

**Publish แล้ว (20260909, อัปเดตล่าสุด 20260915) ผ่าน Firebase CLI** — `firebase.cmd deploy --only firestore:rules` (ใช้ `firebase.cmd` แทน `firebase` เปล่าๆ บน Windows PowerShell เพราะ execution policy เริ่มต้นบล็อก shim `.ps1` ของ npm — ดู `firebase.json`/`.firebaserc` ที่ root ของ config ที่ใช้ deploy) พร้อมกับ Firebase Hosting ของ `app/` ที่ `https://syncsmart-98d1e.web.app` (`firebase.cmd deploy --only hosting`) — สอง target นี้ deploy แยกคำสั่งกันได้ หรือรวมเป็น `firebase.cmd deploy --only hosting,firestore:rules` คำสั่งเดียวก็ได้

**ก่อน publish ได้ทำไปแล้ว:**
- ยืนยันด้วยการทดสอบจริง — login เป็น staff-hph หน่วย A แล้วลองอ่าน/เขียนคำขอของหน่วย B ถูกปฏิเสธจริง (`permission-denied`), ลอง approve คำขอเดิม 2 ครั้งด้วย recordVersion เก่าถูกปฏิเสธจริง, ไม่ login เข้าหน้าจอตรงๆ ถูก redirect กลับ `login.html` — ผ่านทั้งหมด
- สร้างบัญชี `role: "admin"` ไว้แล้ว 1 บัญชีผ่าน Firebase Console (Authentication → Add user + Firestore Database → doc `users/{uid}`) ก่อน publish ตามที่ระบุไว้

## Hosting — ย้ายไป Cloudflare (เพิ่ม 20260912 เป็น Hostinger, เปลี่ยนมาเป็น Cloudflare 20260914 ตามที่ผู้ใช้ตัดสินใจ — **ย้ายเสร็จสมบูรณ์และยืนยันแล้ว 20260914** รวม login จริงด้วยบัญชีทดสอบ)

**Live URL ปัจจุบัน (ยืนยันใช้งานได้จริงครบทุกจุด):** `https://sync-smart.thiphbuymepharmacy.workers.dev` — `/seed.html` ตอบ `404` จริง (ไม่หลุดขึ้น deploy), `/login` โหลดสไตล์/สคริปต์ครบไม่มี error, เพิ่ม authorized domain ใน Firebase Auth แล้ว, และ **login ด้วยบัญชีทดสอบจริงผ่านได้ปกติ** (ผู้ใช้ทดสอบเอง 20260914)

สถาปัตยกรรมเป็น static file ล้วน (`app/` ไม่มี build step) จึงย้ายไปโฮสต์ static ที่ไหนก็ได้โดยไม่กระทบ backend — Firebase Hosting (`https://syncsmart-98d1e.web.app`) ทำหน้าที่แค่เก็บไฟล์ ส่วน **Firestore + Firebase Authentication ยังอยู่ที่ Firebase เหมือนเดิมไม่ว่าจะย้าย hosting ไปที่ไหน**

ตัดสินใจใช้ **Cloudflare แบบเชื่อม GitHub repo โดยตรง** (แทน Direct Upload ที่วางแผนไว้ทีแรก 20260914 ช่วงเช้า — เปลี่ยนมาใช้ Git แทนช่วงบ่ายวันเดียวกัน เพื่อให้ deploy อัตโนมัติทุกครั้งที่ push ขึ้น `main` โดยไม่ต้องอัปโหลด zip มือทุกรอบ) ขั้นตอน:

1. สมัคร/ล็อกอิน [dash.cloudflare.com](https://dash.cloudflare.com) (ฟรี)
2. **Workers & Pages → Create application → Connect GitHub** → เลือก repo `6910127-warang/sync_smart`, branch `main` — **หมายเหตุ (พบจริง 20260914):** flow "Create an app" ปัจจุบันของ Cloudflare รวม Workers/Pages เป็นหน้าเดียวกันแล้ว การเชื่อม GitHub แบบนี้จะสร้างเป็น **Workers project ที่มี static assets** (deploy ด้วย `npx wrangler deploy` เบื้องหลัง) ไม่ใช่ classic Pages project อีกต่อไป — URL ที่ได้จึงเป็น `<ชื่อโปรเจกต์>.<account-subdomain>.workers.dev` ไม่ใช่ `*.pages.dev`
3. ตั้งค่า Build settings ให้ตรงนี้เท่านั้น (สำคัญ เพราะ repo นี้เป็น monorepo มี `01-requirements/`/`prototype/`/`DESIGN.md` ปนอยู่กับ `app/`):
   - **Root directory:** `/app` — Cloudflare ใช้ค่านี้เป็นทั้ง working directory ของ Build/Deploy command และ path ของ static assets ที่จะ serve (ค่าเดียวกันทำทั้งสองหน้าที่)
   - **Build command:** `rm -f seed.html` **(ไม่ใส่ `app/` นำหน้า เพราะ Root directory ตั้งเป็น `/app` แล้ว working directory ของคำสั่งจึงอยู่ใน `app/` อยู่แล้ว — ตอนแรกเข้าใจผิดว่า Root directory เป็น `/` เพราะดูจากหน้ารายละเอียดของ build เก่าที่แสดงค่านั้น แล้วแก้เป็น `rm -f app/seed.html` ไป ทำให้หาไฟล์ไม่เจอ (มี `-f` เลยไม่ error แต่ `seed.html` ก็ยังหลุดขึ้น deploy จริงอยู่ดี) จนไปเช็คหน้า Settings ของโปรเจกต์ตรงๆ ถึงเห็นว่า Root directory จริงคือ `/app` แก้กลับมาเป็น `rm -f seed.html` เฉยๆ ถึงทำงานถูก — **ยืนยันแล้ว 20260914** จาก build log จริง (`#02a520bd`, commit `45841eb`) ว่า build command รันสำเร็จและ `/seed.html` ตอบ 404 บนเว็บจริงหลัง deploy รอบนี้)**
   - **Deploy command:** `npx wrangler deploy` (ค่า default ของ Cloudflare เอง ไม่ต้องแก้)
   - **Framework preset:** None
4. Deploy ครั้งแรก — ได้ URL `<ชื่อโปรเจกต์>.<account-subdomain>.workers.dev` พร้อม HTTPS อัตโนมัติทันที
5. ~~(ถ้าใช้โดเมนตัวเอง) ผูก custom domain ในโปรเจกต์ → **Custom domains**~~ — **ผู้ใช้ตัดสินใจแล้ว (20260914): ไม่ผูก custom domain** ใช้ `sync-smart.thiphbuymepharmacy.workers.dev` เป็น URL หลักต่อไป
6. เพิ่มทั้ง `<ชื่อโปรเจกต์>.<account-subdomain>.workers.dev` และโดเมนตัวเอง (ถ้ามี) เข้า Firebase Console → Authentication → Settings → Authorized domains — ถ้าลืมขั้นนี้ login จะพังทันทีด้วย error `auth/unauthorized-domain`

**หมายเหตุสำคัญ — ปุ่ม "Retry build" ไม่ดึง Build command ที่เพิ่งแก้ไปใช้ (พบจริง 20260914):** หลังแก้ Build command ให้ถูกแล้ว (ข้อ 3 ด้านบน) กด **Retry build** จาก build entry เก่าในหน้า build history **ไม่ทำให้ค่าใหม่มีผล** เพราะ retry รันซ้ำด้วย config ที่บันทึกไว้ ณ ตอนสร้าง build entry นั้น (ยืนยันจากการเปิด `/seed.html` ซ้ำหลัง retry แล้วยังเข้าได้เหมือนเดิม) — ต้อง trigger **deploy รอบใหม่จริงๆ** ถึงจะดึง Build command ล่าสุดไปใช้ (เช่น push commit ใหม่ขึ้น `main`, หรือใช้ปุ่ม deploy จากหน้า Deployments แทนปุ่ม Retry ของ build เก่า)
7. `firestore.rules` ไม่ต้องแก้อะไร — กรองจาก auth token (`role`/`unitId`) ไม่ได้กรองจาก origin ของ hosting
8. ตรวจ case-sensitivity ของทุก path ที่อ้างอิง (`src`/`href`/`import`) เทียบกับชื่อไฟล์จริง — ตรวจแล้ว 20260912 ไม่พบปัญหา (ทุก path ตรงตัวพิมพ์กับชื่อไฟล์จริงอยู่แล้ว ใช้ได้กับทุก static host ที่ case-sensitive)
9. อัปเดตครั้งถัดไป: แค่ `git push` ขึ้น `main` ตามปกติ — Cloudflare deploy ให้อัตโนมัติทุกครั้ง (ยืนยันแล้ว 20260914 ว่า auto-deploy จาก push ทำงานจริง ไม่ต้องอัปโหลดมือหรือใช้ CLI แยก)
10. ~~ตัดสินใจเรื่อง `https://syncsmart-98d1e.web.app` เดิม~~ — **ผู้ใช้ตัดสินใจแล้ว (20260914): ปล่อยขนานกันไว้** ทั้งสอง URL ใช้งานได้พร้อมกัน (`https://syncsmart-98d1e.web.app` ของ Firebase Hosting เดิม + `https://sync-smart.thiphbuymepharmacy.workers.dev` ของ Cloudflare ใหม่) — ทั้งคู่ชี้ไป Firestore/Auth เดียวกัน ไม่ต้องอัปเดตลิงก์ใดๆ เพิ่ม

**สถานะปัจจุบัน (20260914):** ครบทุกข้อแล้ว — deploy จริง, build command, authorized domain, login จริง ยืนยันหมด, ไม่ผูก custom domain (ข้อ 5), และปล่อย URL เดิมของ Firebase Hosting ไว้ขนานกัน (ข้อ 10) — **ถือว่าย้ายไป Cloudflare เสร็จสมบูรณ์ ไม่มีงานค้าง**

## ผู้ช่วย AI สำหรับเภสัชกรผู้อนุมัติระดับ 1 (FT-036/BL-047, เพิ่ม 20260915)

โค้ดจริงอยู่ที่ `pharmacist/approval-review-level1.html` (ปุ่ม "เรียกดูผู้ช่วย AI" + ปุ่ม "ให้ AI ช่วยร่างข้อความเหตุผล" ในฟอร์มปฏิเสธ) และ `pharmacist/approval-queue-level1.html` (badge "เบี่ยงเบนมาก" ในคิว) — spec เต็มดูที่ [01-requirements/01-spec/20260914-008-pharmacist-approval-ai-assistant.md](../01-requirements/01-spec/20260914-008-pharmacist-approval-ai-assistant.md)

**สถาปัตยกรรม — backend component แรกของโปรเจกต์:** เดิมโปรเจกต์นี้เป็น static file + Firestore ล้วน (ไม่มี backend) แต่ฟีเจอร์นี้ต้องเรียก OpenRouter ด้วยคีย์ที่เป็น secret จริง (ต่างจาก Firebase apiKey) — ถ้าเรียกตรงจาก browser บนเว็บที่ deploy จริงแล้ว (Cloudflare) คีย์จะฝังอยู่ในหน้าเว็บที่ใครก็เปิด dev tools ดูได้ จึงเพิ่ม **Cloudflare Worker proxy**:
- `_worker.js` (ที่ `app/` root) — handle `POST /api/ai-assist` เท่านั้น คำขออื่นทั้งหมด fallback ไป `env.ASSETS.fetch()` เพื่อ serve static ตามเดิมทุกประการ
- `wrangler.toml` (ที่ `app/` เพราะ Cloudflare project ตั้ง Root directory = `/app`) — ประกาศ `main = "_worker.js"` + `[assets]` binding
- ตรวจ `Authorization: Bearer <Firebase ID token>` ทุก request ผ่าน Firebase Identity Toolkit REST `accounts:lookup` (ยืนยันแค่ login จริง ไม่เช็ค role ลึกกว่านั้น — เพียงพอกันคนนอกยิง endpoint ตรงๆ ในขนาดการใช้งานปัจจุบัน)
- `lib/ai-assistant.js` (client) — `requestDeviationSummary()`/`requestDraftReason()` เรียก `/api/ai-assist` พร้อม Firebase ID token เสมอ ไม่เรียก OpenRouter ตรงจาก browser (ต่างจาก `ai-test.html` ที่ตั้งใจให้รัน local เท่านั้น) — เขียนบันทึกการใช้งานลง Firestore (`aiAssistantUsageLogs`) ให้อัตโนมัติทุกครั้งที่เรียกสำเร็จ ดูหัวข้อ "บันทึกการใช้งานผู้ช่วย AI" ด้านล่าง

**ทดสอบ local ด้วย `wrangler dev` (จำลอง Worker ก่อน deploy จริง):** รันจาก `app/` ด้วย:
```
npx.cmd wrangler dev --persist-to ..\.wrangler-state
```
(ใช้ `.cmd` แทน `npx` เปล่าๆ บน Windows PowerShell เพราะ execution policy บล็อก shim `.ps1` เหมือน `firebase.cmd`) ต้องสร้าง `app/.dev.vars` เอง (ไม่ commit ขึ้น git — อยู่ใน `.gitignore` แล้ว) ใส่ `OPENROUTER_API_KEY=<คีย์จริง>` ก่อน

**บั๊กที่เจอจริง 20260915 — ต้องใช้ `--persist-to` เสมอ ห้ามรันเฉยๆ:** `wrangler dev` เปล่าๆ (ไม่มี `--persist-to`) reload ตัวเองวนไม่จบ ("Reloading local server..." ซ้ำไม่หยุด ไม่มีวันขึ้น "Ready on http://...") เพราะ `[assets] directory = "."` ครอบคลุมทั้ง `app/` รวมถึง `app/.wrangler/state/` ที่ wrangler สร้างเองตอนรัน (SQLite WAL ของ KV/D1/cache ที่เปลี่ยนแทบทุกครั้งที่เข้าถึง) — watcher เห็นไฟล์ state ของตัวเองเปลี่ยน เลย reload ตัวเอง ซึ่งไปสร้าง/แก้ state ไฟล์อีกรอบ วนไม่จบ **`app/.assetsignore` (ที่มี `.wrangler` อยู่แล้ว) แก้ปัญหานี้ไม่ได้** เพราะไฟล์นั้นควบคุมแค่ตอน deploy จริง (อะไรถูกอัปโหลดเป็น asset) ไม่ใช่ watcher ของ dev mode — ทางแก้จริงคือย้าย persist directory ออกไปนอก `app/` ด้วย `--persist-to` ตามคำสั่งด้านบน (ทดสอบแล้ว 20260915: มี `--persist-to` แล้วขึ้น "Ready on http://127.0.0.1:8787" ครั้งเดียวนิ่ง ไม่วนซ้ำ, `curl POST /api/ai-assist` ตอบ 401 ถูกต้องเมื่อไม่มี token, static asset อื่นยังเสิร์ฟปกติ)

**ขั้นตอน manual ที่ต้องทำเองก่อนฟีเจอร์นี้ใช้งานได้จริงบน production:**
1. ตรวจว่า `app/wrangler.toml` ฟิลด์ `name` ตรงกับชื่อโปรเจกต์จริงบน Cloudflare dashboard (คาดว่าคือ `sync-smart`) — ถ้าไม่ตรง deploy อาจสร้างโปรเจกต์ใหม่แยกต่างหากแทนที่จะ deploy ทับของเดิม
2. ตั้ง secret `OPENROUTER_API_KEY` บน Cloudflare Worker project ผ่าน dashboard (Settings → Variables → Encrypt) หรือ `wrangler secret put OPENROUTER_API_KEY`
3. Deploy แล้วทดสอบ `/api/ai-assist` ตอบกลับจริง (ไม่ใช่ 404/500) พร้อมตรวจ network tab ว่าไม่มีการยิง OpenRouter ตรงจาก browser และไม่มีคีย์หลุดในหน้าเว็บที่โหลด
4. ~~`firestore.rules` มีกฎของ `aiAssistantUsageLogs` เพิ่มแล้ว — ต้อง publish ใหม่~~ — **publish แล้ว 20260915** ผ่าน `firebase.cmd deploy --only firestore:rules` (ดูหัวข้อ "บันทึกการใช้งานผู้ช่วย AI" ด้านล่าง)

**ขอบเขตที่ตัดออกในรอบแรกนี้ (เทียบกับ spec 008 เต็มรูปแบบ):**
- **ไม่มีข้อมูลประวัติย้อนหลัง 3 ปี** — collection `historicalUsageRecords` ที่ FR-8.3 ตั้งใจให้ใช้ยังไม่ถูกสร้างจริง ความสามารถ (ก) จึงสรุปจากตัวเลขของคำขอปัจจุบันเท่านั้น (ยอดขอเบิก/ยอดแนะนำ/ยอดคงเหลือ/เกณฑ์ Safety Stock ปัจจุบันจาก `safetyStockThresholds`)
- ~~เกณฑ์ trigger % (FR-8.4) hardcode = 25% เป็นค่าคงที่ `AI_TRIGGER_THRESHOLD_PERCENT` ในโค้ด~~ — **ย้ายไปเป็น Config Key ที่ปรับได้จริงแล้ว 20260920 (FT-034)** ดูหัวข้อ `systemConfiguration` ใน "Firestore Schema" ด้านบน — `_worker.js` ไม่เคยใช้ค่านี้จริง (แค่กล่าวถึงเชิงเอกสาร) จึงไม่ต้องแก้ไฟล์นั้น มีแค่ 2 หน้าเภสัชกรที่อ่านค่าจริง
- **ความสามารถ (ข) จำกัดเฉพาะฟอร์มปฏิเสธเท่านั้น** — หน้า `approval-review-level1.html` ปัจจุบันไม่มีช่องกรอกเหตุผลสำหรับกรณี "ปรับยอด" (แก้ตัวเลขในช่อง "จำนวนที่อนุมัติ" แล้วกดอนุมัติ ไม่มี UI ขอเหตุผลเลย) จึงยังไม่มีจุดให้ผูกปุ่ม AI ร่างข้อความ — เป็น gap ของ UI เดิมเอง ไม่ใช่ของฟีเจอร์นี้
- **หมายเหตุข้อมูลจริงตอนนี้:** ฟิลด์ `requestedQuantity` ("ยอดขอเบิก") เท่ากับ `suggestedQuantity` เสมอ เพราะปุ่ม "ขอปรึกษา" (BL-003, ทางเดียวที่ทำให้สองค่านี้ต่างกันได้) ยังไม่ได้พัฒนาจริง — แปลว่า badge "เบี่ยงเบนมาก" จะแทบไม่ขึ้นเลยกับข้อมูลจริงในรอบนี้ (ถูกต้องตามสเปค ไม่ใช่บั๊ก — ปุ่มเรียกดู AI ยังกดใช้งานได้ปกติเสมอตาม FR-8.5) ทดสอบให้เห็นผลชัดเจนต้องตั้งค่า `requestedQuantity` ต่างจาก `suggestedQuantity` เองผ่าน Firebase Console
- ~~ไม่มีการเก็บ/persist ผลลัพธ์ AI ใดๆ ลง Firestore~~ — **เข้าสู่เฟสพัฒนาแล้ว 20260915 (BL-048)** ดูหัวข้อ "บันทึกการใช้งานผู้ช่วย AI" ด้านล่าง

## บันทึกการใช้งานผู้ช่วย AI (BL-048/FR-8.7-FR-8.11, เพิ่ม 20260915)

ทุกครั้งที่เรียกใช้ผู้ช่วย AI สำเร็จ (ทั้งความสามารถ (ก) และ (ข)) `lib/ai-assistant.js` จะเขียนเอกสารใหม่ 1 รายการลง `aiAssistantUsageLogs` จากฝั่ง client ทันทีหลังได้รับผลลัพธ์กลับมา — โครงสร้างฟิลด์เต็มดูที่หัวข้อ "`aiAssistantUsageLogs/{logId}`" ใน "Firestore Schema" ด้านบน

- **ดูบันทึกได้ที่ไหน:** Firebase Console → โปรเจกต์ `syncsmart-98d1e` → Firestore Database → collection `aiAssistantUsageLogs` — เฉพาะบัญชีที่มี `role: "admin"` เท่านั้นที่ผ่าน `firestore.rules` ได้ (ตรงกับสิทธิ์ระดับ Firebase project ที่ผู้ดู Console ต้องมีอยู่แล้วเป็นทุนเดิม ไม่ใช่ RBAC ชั้นเพิ่มเติม)
- **ไม่มีหน้าจอ UI ในแอปให้ดู log นี้** ในรอบนี้ (ตามที่เจ้าของระบบยืนยัน — ดูได้เฉพาะผ่าน Firebase Console เท่านั้น)
- **Immutable + เก็บถาวร:** `firestore.rules` เปิดเฉพาะ `create` (เจ้าของบันทึกเขียนของตัวเองเท่านั้น) ปิด `update`/`delete` ให้ทุก role รวมถึง admin — ไม่มี TTL/archive policy
- **เขียนจากฝั่ง client เท่านั้น** (ไม่ใช่ Worker) — ถ้าเขียนไม่สำเร็จ (เช่น เครือข่ายหลุด/ปิดแท็บก่อนเขียนเสร็จ) รายการนั้นจะหายไปเงียบๆ ไม่มี retry/queue อัตโนมัติ — เป็น trade-off ที่ยอมรับแล้วตาม FR-8.11 ไม่ใช่บั๊ก
- **ทดสอบด้วยตัวเอง:** login เป็นเภสัชกร → เปิดคำขอที่ `pending_level1` → กด "เรียกดูผู้ช่วย AI" หรือ "ให้ AI ช่วยร่างข้อความเหตุผล" → เปิด Firebase Console ด้วยบัญชี admin ควรเห็นเอกสารใหม่ปรากฏใน `aiAssistantUsageLogs` ทันที — ถ้า login เป็น role อื่น (staff_hph) หรือไม่ login เลย แล้วลองอ่าน collection นี้ผ่าน client SDK ต้องถูกปฏิเสธ (`permission-denied`)
- **ยืนยันแล้วจริง (20260915)** ผ่าน `wrangler dev` (`--persist-to` ต้องชี้ออกนอก `app/` เสมอ ไม่งั้นจะเจอบั๊ก reload วนไม่จบที่บันทึกไว้ด้านบน) + login เป็น `pharmacist-a@smartsync.test` จริง — เรียกทั้งความสามารถ (ก) และ (ข) สำเร็จ (`POST /api/ai-assist` → 200 OK ทั้งคู่, ไม่มี console error จากการเขียน log) และผู้ใช้ยืนยันด้วยตาเองผ่าน Firebase Console แล้วว่าเห็นเอกสารทั้ง 2 รายการจริงใน `aiAssistantUsageLogs`

## จัดการบัญชีผู้ใช้ (item #8, เพิ่ม 20260920)

`admin/user-accounts.html` แทน `seed.html` (dev only) สำหรับสร้าง/แก้ไข/ปิดใช้งานบัญชีจริงแล้ว — ขอบเขตยืนยันกับผู้ใช้แล้ว 20260920:

- **สร้างบัญชี Firebase Auth ผ่าน Identity Toolkit REST ตรงๆ** (`lib/admin-accounts.js`, `accounts:signUp` ด้วย public `apiKey` เดิมใน `firebase-config.js`) แทน client SDK's `createUserWithEmailAndPassword` — เหตุผล: ถ้าเรียกตรงบน auth instance เดียวกับที่ admin login อยู่ จะ sign in เป็นบัญชีใหม่ทันทีและเตะ admin ออกจาก session ตัวเอง วิธีนี้เป็นแค่ `fetch()` ธรรมดา ไม่ผ่าน `firebase.auth()` ของแท็บนี้เลย จึงไม่กระทบ session admin
- รหัสผ่านเริ่มต้นสุ่มอัตโนมัติ (`generateTempPassword()`) แสดงให้ admin เห็นครั้งเดียวตอนสร้างบัญชีสำเร็จ — ต้องแจ้งผู้ใช้งานเอง (ไม่มีอีเมลอัตโนมัติตอนสร้างบัญชี)
- **"ปิดใช้งาน" = ตั้ง `users/{uid}.active = false` เท่านั้น** — บัญชี Firebase Auth จริงยังคงอยู่ ไม่ได้ถูก disable จริงระดับ Firebase (ต้องมี Admin SDK ถึงทำได้ ซึ่งไม่ได้เลือกใช้ในสถาปัตยกรรมรอบนี้) แอปบังคับที่ชั้น `fetchUserProfile()` (`lib/auth.js`) อยู่แล้วเหมือนเดิม เพียงพอกันไม่ให้บัญชีที่ปิดใช้งานเข้าแอปได้จริง
- **"ส่งอีเมลรีเซ็ตรหัสผ่าน"** ใช้ Identity Toolkit `accounts:sendOobCode` (`requestType: "PASSWORD_RESET"`) — เป็นทางเดียวที่ admin ช่วย "รีเซ็ตรหัสผ่าน" ของบัญชีอื่นได้โดยไม่มี Admin SDK (ตั้งรหัสผ่านใหม่ให้บัญชีอื่นโดยตรงทำไม่ได้ด้วยวิธีนี้)
- **ไม่บังคับใช้งานจริงของ `mustChangePassword`/`twoFactorEnabled`** (ผู้ใช้ยืนยันขอบเขตนี้แล้ว 20260920) — สร้างบัญชีใหม่ยังตั้ง `mustChangePassword: true` เสมอ (เหมือน `seed.html` เดิม) แต่ไม่มี logic บังคับเปลี่ยนรหัสผ่านตอน login ครั้งแรก และ 2FA/OTP จริงยังไม่มีเลย (ต้องพึ่ง provider ภายนอกที่ยังไม่เลือกใช้) — นับเป็นงานแยกต่างหากถ้าต้องการในอนาคต ไม่ใช่ส่วนหนึ่งของรอบนี้

## ขั้นต่อไป (ยังไม่ทำในรอบนี้ — รอคำสั่งเจาะจง)

1. ทำหน้าอนุมัติระดับ 2 (BL-004 — ระดับ 1 เสร็จแล้ว 20260907 ที่ `pharmacist/approval-review-level1.html`) ต้องเพิ่มการเช็ค `approvalRecords where level==1` เทียบ `approverId` กับ uid ของเภสัชกรระดับ 2 ที่ login อยู่ (กฎห้ามคนเดียวกันอนุมัติซ้ำ) **และขยาย `firestore.rules` ให้รองรับ transition/approvalRecords ระดับ 2 ด้วย (ตอนนี้กฎเปิดไว้แค่ระดับ 1 — ต้อง `firebase.cmd deploy --only firestore:rules` ใหม่หลังแก้)** และทำหน้าส่งออก Excel + แจ้งเตือนอีเมล/LINE OA (BL-020) ต่อจากนั้น
2. ทำ Epic 2 (พยากรณ์สต็อก, BL-010/011/012) เพื่อให้ `safetyStockThresholds` มีค่าจริงแทนข้อมูลตัวอย่างจาก `seed.html` — เมื่อทำแล้วจึงค่อยเพิ่ม auto-discrepancy warning เต็มรูปแบบ (BL-032) และช่องกรอกจำนวนคาดการณ์เคสใหม่ (BL-015, FT-013) ในหน้าอนุมัติระดับ 1 ที่ตอนนี้ตัดออกไปก่อน
3. ทำหน้าสร้างคำขอเบิกฉุกเฉิน (BL-009, นอกรอบเดือน) — แยกจาก `requisition-new.html` ที่ทำเฉพาะคำขอปกติ
4. ทำปุ่ม "ขอปรึกษา" จริง (BL-003) — ต้องรอ BL-014 (ช่องทางแจ้งเตือน LINE OA)
5. ถ้าต้องการให้ความสามารถ (ก) ของผู้ช่วย AI อ้างอิงประวัติย้อนหลังจริง ต้องทำ Epic 2/data migration ให้ `historicalUsageRecords` มีข้อมูลจริงก่อน (ตอนนี้ยังไม่ถูกสร้าง — ดูหัวข้อ "ผู้ช่วย AI" ด้านบน)
6. ถ้าต้องการบังคับใช้งานจริงของ `mustChangePassword`/2FA (twoFactorEnabled) — ยังไม่ได้รับคำสั่งเข้าสู่เฟสพัฒนา (ผู้ใช้ตัดกลับออกจากขอบเขตข้อ #8 ไปแล้ว 20260920) ต้องเลือก OTP/SMS provider ก่อนเริ่มได้
7. ถ้าต้องการให้ `businessAuditLog` ครอบคลุม event อื่นตาม data-model.md §3.14 เต็มรูปแบบ (จ่ายผ่านระดับ 2, ขอปรึกษา, แก้ไขฉุกเฉิน) — ต้องรอหน้าจอของ event นั้นๆ เกิดขึ้นจริงก่อน (ดูหัวข้อ `businessAuditLog` ใน "Firestore Schema" ด้านบน)
8. ทำหน้า Admin จัดการ `emergency data edit record` จริง (BL-025) — ยังไม่มีโค้ด (ต่างจาก item #8 ที่ทำแล้ว ซึ่งเป็นแค่จัดการบัญชีผู้ใช้ ไม่ใช่แก้ไขข้อมูลธุรกิจกรณีฉุกเฉิน)
