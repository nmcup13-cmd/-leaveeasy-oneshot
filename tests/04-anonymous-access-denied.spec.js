// ─────────────────────────────────────────────────────────────
// เทสต์ 4/5 — ความปลอดภัย: ไม่ล็อกอินแล้วเปิดหน้ารายการ ต้องอ่านข้อมูลไม่ได้ (US-08)
// ผ่านเมื่อเข้าไม่ได้ (Playwright ให้ browser context ใหม่ไม่มี session ทุกเทสต์อยู่แล้ว)
// ─────────────────────────────────────────────────────────────
import { test, expect } from "@playwright/test";

test("ไม่ล็อกอินเปิดหน้ารายการ ต้องอ่านข้อมูลไม่ได้", async ({ page }) => {
  const requests = [];
  page.on("request", (req) => {
    if (req.url().includes("firestore.googleapis.com")) requests.push(req.url());
  });

  await page.goto("/leave-requests");

  // ต้องถูกเด้งไปหน้า login เสมอ ไม่ใช่เห็นหน้ารายการ
  await page.waitForURL(/\/login/);
  await expect(page).toHaveURL(/\/login/);

  // ต้องไม่มีการอ่านข้อมูล leaveRequests สำเร็จก่อนจะโดนเด้ง (กันไว้ที่ router ก่อนแตะ Firestore เลย)
  const leaveRequestCalls = requests.filter((u) => u.includes("leaveRequests"));
  expect(leaveRequestCalls.length).toBe(0);
});
