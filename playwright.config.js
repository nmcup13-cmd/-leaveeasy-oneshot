// ─────────────────────────────────────────────────────────────
// playwright.config.js — ตั้งค่าชุดทดสอบ LeaveEasy (สัปดาห์ที่ 9)
// รันด้วย: npm test  (หรือ npx playwright test)
// ต้องมีไฟล์ .env.test ก่อน (คัดลอกจาก .env.test.example แล้วใส่ค่าจริง)
// ─────────────────────────────────────────────────────────────

import { defineConfig } from "@playwright/test";
import fs from "node:fs";

if (fs.existsSync(".env.test")) {
  process.loadEnvFile(".env.test");
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // เทสต์ใช้บัญชีทดสอบร่วมกัน รันเรียงลำดับปลอดภัยกว่า
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "https://leaveeasy-nan.web.app",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  timeout: 30000,
});
