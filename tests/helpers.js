// ─────────────────────────────────────────────────────────────
// tests/helpers.js — ฟังก์ชันช่วยที่ใช้ร่วมกันในชุดทดสอบ LeaveEasy
// ─────────────────────────────────────────────────────────────

export async function login(page, email, password) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#ปุ่มเข้าสู่ระบบ").click();
  await page.waitForURL(/\/leave-requests/);
}

export async function logout(page) {
  await page.locator("#ปุ่มออกจากระบบ").click();
  await page.waitForURL(/\/login/);
}

// วันที่แบบ YYYY-MM-DD สำหรับกรอกในฟอร์ม (offsetDays จากวันนี้)
export function futureDate(offsetDays) {
  var d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function submitLeaveRequest(page, { title, reason, leaveTypeName }) {
  await page.goto("/new-leave-request");
  await page.locator("#title").fill(title);
  await page.locator("#reason").fill(reason || "สร้างโดยชุดทดสอบอัตโนมัติ (Playwright)");
  await page.locator("#leaveTypeId").selectOption({ label: leaveTypeName || "ลาพักร้อน" });
  await page.locator("#startDate").fill(futureDate(10));
  await page.locator("#endDate").fill(futureDate(11));
  await page.locator("#ปุ่มบันทึก").click();
  await page.waitForURL(/\/leave-requests/);
}

export async function openLeaveRequestByTitle(page, title) {
  await page.goto("/leave-requests");
  await page.getByText(title, { exact: true }).click();
  await page.waitForURL(/\/leave-request-detail/);
  return page.url();
}

// ลบใบลาปัจจุบัน (ต้องอยู่หน้า leave-request-detail ของใบที่ยัง "รอพิจารณา" และเป็นเจ้าของเอง)
export async function deleteCurrentLeaveRequest(page) {
  page.once("dialog", (d) => d.accept());
  await page.locator("#ปุ่มลบ").click();
  await page.waitForURL(/\/leave-requests/);
}
