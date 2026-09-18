// ─────────────────────────────────────────────────────────────
// เทสต์ 1/5 — เส้นทางหลัก: ยื่นใบลาแล้วเห็นในรายการ (US-01, US-02)
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";
import { login, submitLeaveRequest, openLeaveRequestByTitle, deleteCurrentLeaveRequest } from "./helpers.js";

test("ยื่นใบลาแล้วเห็นในรายการ", async ({ page }) => {
  const title = "[TEST] Suite submit " + Date.now();

  await login(page, process.env.TEST_EMPLOYEE1_EMAIL, process.env.TEST_EMPLOYEE1_PASSWORD);
  await submitLeaveRequest(page, { title, leaveTypeName: "ลาพักร้อน" });

  // อยู่หน้ารายการแล้วหลังบันทึก
  await expect(page).toHaveURL(/\/leave-requests/);

  const row = page.locator("tr.clickable", { hasText: title });
  await expect(row).toBeVisible();
  await expect(row.locator(".badge")).toHaveText("รอพิจารณา");
  await expect(row).toContainText("ทดสอบ ชุดที่ 1"); // requesterName ต้องตรงกับผู้ล็อกอิน

  // เก็บกวาด — ลบใบทดสอบทิ้งเพราะยังรอพิจารณาอยู่ ลบได้
  await openLeaveRequestByTitle(page, title);
  await deleteCurrentLeaveRequest(page);
});
