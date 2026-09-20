// SmartSync — สร้าง/จัดการบัญชี Firebase Auth จากหน้า Admin (admin/user-accounts.html)
// เพิ่ม 20260920 (item #8) — เรียก Identity Toolkit REST API ตรงๆ ด้วย public apiKey เดิมใน firebase-config.js
// (ไม่ใช่ Admin SDK/service account key) ตามที่ผู้ใช้เลือกไว้ — ข้อดี: ไม่กระทบ session ของ admin ที่ login อยู่แท็บนี้เลย
// (ต่างจาก client SDK's createUserWithEmailAndPassword ที่จะ sign in เป็นบัญชีใหม่ทันทีถ้าเรียกตรงๆ บน auth instance เดียวกัน)
// เพราะเป็นแค่ fetch() ธรรมดา ไม่ผ่าน firebase.auth() ของแท็บนี้เลย
//
// ขอบเขต: สร้างบัญชี + ส่งอีเมลรีเซ็ตรหัสผ่านเท่านั้น — ไม่มีการ "ตั้งรหัสผ่านใหม่ให้บัญชีอื่นโดยตรง" (ทำไม่ได้ด้วยวิธีนี้ ต้องใช้ Admin SDK)
// ไม่บังคับใช้ mustChangePassword/twoFactorEnabled จริง (field เก็บไว้เฉยๆ เหมือนเดิม — ผู้ใช้ยืนยันขอบเขตนี้แล้ว 20260920)

const IDENTITY_TOOLKIT_BASE = "https://identitytoolkit.googleapis.com/v1";

const ERROR_MESSAGES = {
  "EMAIL_EXISTS": "อีเมลนี้มีบัญชีอยู่แล้วในระบบ",
  "INVALID_EMAIL": "รูปแบบอีเมลไม่ถูกต้อง",
  "WEAK_PASSWORD": "รหัสผ่านสั้นเกินไป (ต้องอย่างน้อย 6 ตัวอักษร)",
  "EMAIL_NOT_FOUND": "ไม่พบบัญชีที่ใช้อีเมลนี้",
  "MISSING_EMAIL": "กรุณากรอกอีเมล"
};

function identityToolkitErrorMessage(data) {
  const code = data && data.error && data.error.message ? data.error.message.split(":")[0].trim() : null;
  return (code && ERROR_MESSAGES[code]) || (data && data.error && data.error.message) || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
}

async function callIdentityToolkit(apiKey, endpoint, body) {
  const res = await fetch(`${IDENTITY_TOOLKIT_BASE}/${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(identityToolkitErrorMessage(data));
  return data;
}

/** สร้างบัญชี Firebase Auth ใหม่ — คืน uid (localId) ที่ใช้เป็น doc id ของ users/{uid} ต่อ */
export async function createAuthAccount(apiKey, email, password) {
  const data = await callIdentityToolkit(apiKey, "accounts:signUp", { email, password, returnSecureToken: true });
  return data.localId;
}

/** ส่งอีเมลรีเซ็ตรหัสผ่านไปยังบัญชีที่มีอยู่แล้ว — ทางเดียวที่ admin ช่วย "รีเซ็ตรหัสผ่าน" บัญชีอื่นได้โดยไม่มี Admin SDK */
export function sendPasswordResetEmail(apiKey, email) {
  return callIdentityToolkit(apiKey, "accounts:sendOobCode", { requestType: "PASSWORD_RESET", email });
}

/** สุ่มรหัสผ่านชั่วคราวสำหรับบัญชีใหม่ (ตัวอักษร A-Z/a-z/0-9 12 ตัว) — แสดงให้ admin เห็นครั้งเดียวตอนสร้างบัญชี */
export function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 12; i++) out += chars[bytes[i] % chars.length];
  return out;
}
