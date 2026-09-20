// SmartSync — บันทึก Audit Trail ทางธุรกิจ (BL-008, data-model.md §3.14)
// ขอบเขตปัจจุบัน: บันทึกเฉพาะ event ที่มีหน้าจอจริงทำงานอยู่แล้วเท่านั้น (สร้างคำขอ/อนุมัติ-ปฏิเสธระดับ 1/ยืนยันรับยา)
// event อื่นที่ระบุใน data-model.md (จ่ายผ่านระดับ 2, ขอปรึกษา, แก้ไขฉุกเฉิน) ยังไม่มีโค้ดจริงจึงยังไม่บันทึก — ดู README.md
//
// ตั้งใจไม่ throw ถ้าเขียน log ไม่สำเร็จ (เหมือน logAiAssistantUsage ใน ai-assistant.js) — ไม่ให้กระทบ flow หลักที่ผู้ใช้กำลังทำอยู่
// ใช้ที่นี่เฉพาะจุดที่เขียนแบบ fire-and-forget หลังการกระทำหลักสำเร็จแล้ว (requisition-new.html, goods-receipt-confirm.html)
// ส่วนจุดที่เขียนอยู่ใน runTransaction อยู่แล้ว (approval-review-level1.html) เขียน businessAuditLog ตรงในนั้นเลยเพื่อให้ atomic
// กับ approvalRecords/status transition — ไม่ผ่านฟังก์ชันนี้ (addDoc ใช้ในนี้ไม่รองรับ transaction)

import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * @param {{actorId: string, eventType: "create_requisition"|"approve_level1"|"reject_level1"|"confirm_receipt", relatedEntityId: string, eventDetail: string}} entry
 */
export async function logAuditEvent(db, entry) {
  try {
    await addDoc(collection(db, "businessAuditLog"), {
      actorId: entry.actorId,
      eventType: entry.eventType,
      relatedEntityType: "requisition",
      relatedEntityId: entry.relatedEntityId,
      eventDetail: entry.eventDetail,
      occurredAt: new Date()
    });
  } catch (err) {
    console.error(`บันทึก audit log (${entry.eventType}) ไม่สำเร็จ (ไม่กระทบการทำงานหลัก):`, err);
  }
}
