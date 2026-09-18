// ─────────────────────────────────────────────────────────────
// เทสต์ 2/5 — เส้นทางหลัก: กดอนุมัติแล้วสถานะเปลี่ยน รวม AI สรุปใบลา (US-04, US-09 ส่วนสรุป)
//
// หมายเหตุ: ใบลาที่เทสต์นี้อนุมัติจะกลายเป็นสถานะถาวร (อนุมัติ) ตามกฎของระบบ
// (ลบใบที่พิจารณาแล้วไม่ได้ — เป็นพฤติกรรมที่ถูกต้องตามสเปก ไม่ใช่บั๊ก) รันเทสต์นี้
// ซ้ำหลายครั้งจะสะสมใบลาทดสอบที่อนุมัติแล้วไว้ในบัญชี employee2 เรื่อย ๆ — ยอมรับได้
// สำหรับโปรเจกต์ขนาดเล็กระดับนี้ ไม่ต้องแก้ไข
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";
import { login, logout, submitLeaveRequest, openLeaveRequestByTitle } from "./helpers.js";

test("กดอนุมัติแล้วสถานะเปลี่ยน (รวม AI สรุปใบลา)", async ({ page }) => {
  const title = "[TEST] Suite approve " + Date.now();

  // ผู้ขอลา (employee2) ยื่นใบลาไว้ก่อน
  await login(page, process.env.TEST_EMPLOYEE2_EMAIL, process.env.TEST_EMPLOYEE2_PASSWORD);
  await submitLeaveRequest(page, { title, leaveTypeName: "ลาป่วย" });
  await logout(page);

  // ผู้อนุมัติ (manager, คนละคนกับเจ้าของใบ) เปิดใบนี้
  await login(page, process.env.TEST_MANAGER_EMAIL, process.env.TEST_MANAGER_PASSWORD);
  await openLeaveRequestByTitle(page, title);
  await expect(page.locator(".badge").first()).toHaveText("รอพิจารณา");

  // กด AI สรุปใบลาก่อน
  await page.locator("#ปุ่มสรุปAI").click();
  await expect(page.locator(".badge-ai")).toHaveText("ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน", { timeout: 20000 });

  // กดอนุมัติ
  await page.locator("#ปุ่มอนุมัติ").click();
  await expect(page.locator(".badge").first()).toHaveText("อนุมัติ"); // เปลี่ยนทันทีบนจอ ไม่ต้อง reload

  // reload ยืนยันว่า persist จริงในฐานข้อมูล ไม่ใช่แค่ state ชั่วคราว
  await page.reload();
  await expect(page.locator(".badge").first()).toHaveText("อนุมัติ");

  // ปุ่มอนุมัติ/ไม่อนุมัติ/AI สรุป ต้องหายไปแล้วเพราะพิจารณาแล้ว
  await expect(page.locator("#ปุ่มอนุมัติ")).toHaveCount(0);
  await expect(page.locator("#ปุ่มไม่อนุมัติ")).toHaveCount(0);
  await expect(page.locator("#ปุ่มสรุปAI")).toHaveCount(0);
});
