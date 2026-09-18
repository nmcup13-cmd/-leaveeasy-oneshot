// ─────────────────────────────────────────────────────────────
// เทสต์ 3/5 — กรอกฟอร์มยื่นใบลาโดยเว้นช่องหัวข้อไว้ แล้วกดบันทึก
// ต้องไม่บันทึกและต้องขึ้นข้อความบอก
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";
import { login, futureDate, openLeaveRequestByTitle, deleteCurrentLeaveRequest } from "./helpers.js";

test("เว้นช่องหัวข้อว่างแล้วกดบันทึก ต้องไม่บันทึกและขึ้นเตือน", async ({ page }) => {
  await login(page, process.env.TEST_EMPLOYEE1_EMAIL, process.env.TEST_EMPLOYEE1_PASSWORD);
  await page.goto("/new-leave-request");

  // กรอกทุกช่องยกเว้นหัวข้อ
  await page.locator("#reason").fill("ทดสอบเว้นหัวข้อว่าง");
  await page.locator("#leaveTypeId").selectOption({ label: "ลากิจ" });
  await page.locator("#startDate").fill(futureDate(20));
  await page.locator("#endDate").fill(futureDate(21));
  await page.locator("#ปุ่มบันทึก").click();

  // ต้องไม่ถูกพาไปหน้ารายการ (ยังไม่บันทึก)
  await expect(page).toHaveURL(/\/new-leave-request/);
  await expect(page.locator("#ข้อความเตือน")).toBeVisible();
  await expect(page.locator("#ข้อความเตือน")).toContainText("กรอกไม่ครบ");

  // กรอกหัวข้อกลับเข้าไปแล้วบันทึกอีกครั้ง — ยืนยันว่าไม่ใช่บั๊กบล็อกทั้งฟอร์ม
  const title = "[TEST] Suite validation " + Date.now();
  await page.locator("#title").fill(title);
  await page.locator("#ปุ่มบันทึก").click();
  await expect(page).toHaveURL(/\/leave-requests/);
  await expect(page.locator("tr.clickable", { hasText: title })).toBeVisible();

  // เก็บกวาด
  await openLeaveRequestByTitle(page, title);
  await deleteCurrentLeaveRequest(page);
});
