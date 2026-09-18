// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 6: บันทึกใบลาใหม่ลง Firestore จริง (โฟลเดอร์ leaveRequests)
// ประเภทการลาในรายการเลื่อนลงก็อ่านจาก Firestore จริง (โฟลเดอร์ leaveTypes)
// ─────────────────────────────────────────────────────────────

import { db, auth } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { จัดประเภทลาด้วยAI } from "./ai-classify.js";

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องเหตุผล = document.getElementById("reason");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
var ปุ่มจัดประเภทAI = document.getElementById("ปุ่มจัดประเภทAI");
var ป้ายAIประเภท = document.getElementById("ป้ายAIประเภท");
var เตือนจัดประเภทAI = document.getElementById("เตือนจัดประเภทAI");
var ประเภททั้งหมด = [];

โหลดประเภทการลา();
ปุ่มจัดประเภทAI.addEventListener("click", จัดประเภทด้วยAI);

async function โหลดประเภทการลา() {
  try {
    const สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
    ประเภททั้งหมด = สแนปช็อต.docs.map(function (เอกสาร) {
      return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
    });
  } catch (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
    return;
  }

  if (ประเภททั้งหมด.length === 0) {
    เตือน("ยังไม่มีประเภทการลาในระบบ — ต้อง seed ข้อมูล leaveTypes ก่อน (เปิด seed.html)");
    return;
  }

  ประเภททั้งหมด.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });
}

// ── ปุ่ม "ให้ AI ช่วยจัดประเภทการลา" (US-09/สัปดาห์ที่ 8) ──
// อ่านเหตุผลการลา + รายชื่อประเภทที่มีอยู่จริง (ประเภททั้งหมด ที่โหลดมาแล้ว) ส่งให้ AI เลือกให้
// dropdown ต้องไม่ถูก disable และผู้ใช้ต้องแก้เองได้เสมอ · เรียกไม่สำเร็จ/หมดเวลาต้องไม่บล็อกการบันทึกใบลา
async function จัดประเภทด้วยAI() {
  var เหตุผล = ช่องเหตุผล.value.trim();
  เตือนจัดประเภทAI.classList.add("hidden");
  ป้ายAIประเภท.classList.add("hidden");

  if (!เหตุผล) {
    เตือนจัดประเภทAI.textContent = "⚠️ พิมพ์เหตุผลการลาก่อน จึงจะให้ AI ช่วยจัดประเภทได้";
    เตือนจัดประเภทAI.classList.remove("hidden");
    return;
  }
  if (ประเภททั้งหมด.length === 0) {
    เตือนจัดประเภทAI.textContent = "⚠️ ยังไม่มีประเภทการลาในระบบให้ AI เลือก";
    เตือนจัดประเภทAI.classList.remove("hidden");
    return;
  }

  ปุ่มจัดประเภทAI.disabled = true;
  var ข้อความเดิม = ปุ่มจัดประเภทAI.textContent;
  ปุ่มจัดประเภทAI.textContent = "กำลังจัดประเภท…";

  var ผล;
  try {
    ผล = await จัดประเภทลาด้วยAI(เหตุผล, ประเภททั้งหมด.map(function (t) { return t.name; }));
  } finally {
    ปุ่มจัดประเภทAI.disabled = false;
    ปุ่มจัดประเภทAI.textContent = ข้อความเดิม;
  }

  if (!ผล.สำเร็จ) {
    เตือนจัดประเภทAI.textContent = "⚠️ " + ผล.เหตุผล + " — ยังเลือกประเภทการลาเองและกดบันทึกได้ตามปกติ";
    เตือนจัดประเภทAI.classList.remove("hidden");
    return; // ไม่เปลี่ยนค่า dropdown เดิม
  }

  var ประเภทที่เลือก = ประเภททั้งหมด.find(function (t) { return t.name === ผล.ชื่อประเภท; });
  ช่องประเภท.value = ประเภทที่เลือก.id;
  ป้ายAIประเภท.classList.remove("hidden");
}

// ผู้ใช้แก้ไขประเภทการลาเองเมื่อไร ป้าย "ข้อเสนอจาก AI" ของค่าก่อนหน้าถือว่าไม่ตรงกับค่าปัจจุบันแล้ว
ช่องประเภท.addEventListener("change", function () {
  ป้ายAIประเภท.classList.add("hidden");
});

ฟอร์ม.addEventListener("submit", function (e) {
  e.preventDefault();

  var ค่า = {
    title: document.getElementById("title").value.trim(),
    reason: document.getElementById("reason").value.trim(),
    leaveTypeId: ช่องประเภท.value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
  };

  // ตรวจว่ากรอกครบก่อนบันทึก
  if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
    return;
  }
  if (ค่า.endDate < ค่า.startDate) {
    เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
    return;
  }

  var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });

  // สัปดาห์ที่ 7: ผู้ขอลาคือคนที่ล็อกอินอยู่จริง (nav.js การันตีแล้วว่าเข้าหน้านี้ได้ต้องล็อกอินอยู่)
  var ใบใหม่ = {
    title: ค่า.title,
    reason: ค่า.reason,
    status: "รอพิจารณา", // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
    requesterId: auth.currentUser.uid,
    requesterName: auth.currentUser.displayName || auth.currentUser.email,
    approverId: "", approverName: "",
    leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
    startDate: ค่า.startDate,
    endDate: ค่า.endDate,
    createdAt: เวลาตอนนี้(),
  };

  ปุ่มบันทึก.disabled = true;
  addDoc(collection(db, "leaveRequests"), ใบใหม่)
    .then(function () {
      location.href = "leave-requests";
    })
    .catch(function (err) {
      เตือน("บันทึกไม่สำเร็จ: " + err.message);
      ปุ่มบันทึก.disabled = false;
    });
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
