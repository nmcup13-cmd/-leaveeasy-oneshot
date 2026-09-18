// ─────────────────────────────────────────────────────────────
// เทสต์ 5/5 — ความปลอดภัย: ล็อกอินด้วยบัญชีที่สอง แล้วเปิดใบลาของบัญชีแรก ต้องเปิดไม่ได้ (US-08)
// ผ่านเมื่อเข้าไม่ได้
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";
import { login, logout, submitLeaveRequest, openLeaveRequestByTitle, deleteCurrentLeaveRequest } from "./helpers.js";

test("บัญชีที่สองเปิดใบลาของบัญชีแรก ต้องเปิดไม่ได้", async ({ page }) => {
  const title = "[TEST] Suite cross-user " + Date.now();

  // บัญชีแรก (employee1) ยื่นใบลา แล้วจดที่อยู่ของใบนั้นไว้
  await login(page, process.env.TEST_EMPLOYEE1_EMAIL, process.env.TEST_EMPLOYEE1_PASSWORD);
  await submitLeaveRequest(page, { title, leaveTypeName: "ลาพักร้อน" });
  const detailUrl = await openLeaveRequestByTitle(page, title);
  await logout(page);

  // บัญชีที่สอง (employee2) พยายามเปิดตรง ๆ ด้วย URL เดียวกัน
  await login(page, process.env.TEST_EMPLOYEE2_EMAIL, process.env.TEST_EMPLOYEE2_PASSWORD);
  const requests = [];
  page.on("request", (req) => {
    if (req.url().includes("firestore.googleapis.com")) requests.push(req.url());
  });
  await page.goto(detailUrl);

  // ต้องไม่เห็นข้อมูลใบลาจริง — ขึ้นข้อความโหลดไม่สำเร็จแทน
  await expect(page.locator("#กล่องใบลา")).toContainText("โหลดข้อมูลจาก Firestore ไม่สำเร็จ", { timeout: 10000 });
  await expect(page.locator("#กล่องใบลา")).not.toContainText(title);

  // เก็บกวาด — login กลับเป็นบัญชีแรกแล้วลบใบทดสอบทิ้ง (ยังรอพิจารณาอยู่ ลบได้)
  await logout(page);
  await login(page, process.env.TEST_EMPLOYEE1_EMAIL, process.env.TEST_EMPLOYEE1_PASSWORD);
  await openLeaveRequestByTitle(page, title);
  await deleteCurrentLeaveRequest(page);
});
