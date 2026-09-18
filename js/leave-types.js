// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7: เพิ่ม แก้ ลบ ลง Firestore จริง (โฟลเดอร์ leaveTypes)
// เขียนได้เฉพาะฝ่ายบุคคล (hr) — บังคับจริงที่ Security Rules ตาม ACL.md
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { ผู้ใช้ปัจจุบัน } from "./current-user.js";

var รายการ = [];
var ที่วางตาราง = document.getElementById("ตารางประเภท");
var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
var กล่องเตือน = document.getElementById("เตือนประเภท");
var กล่องเพิ่มประเภท = document.getElementById("กล่องเพิ่มประเภท");
var เป็นhr = false; // ตาม ACL.md: เพิ่ม/แก้/ลบ ประเภทการลา เป็นสิทธิ์ของ hr เท่านั้น

เริ่มต้น();
document.getElementById("ปุ่มเพิ่ม").addEventListener("click", เพิ่มประเภท);

async function เริ่มต้น() {
  var ผู้ใช้ = await ผู้ใช้ปัจจุบัน();
  เป็นhr = !!(ผู้ใช้ && ผู้ใช้.role === "hr");
  if (เป็นhr) {
    กล่องเพิ่มประเภท.classList.remove("hidden");
  }
  await โหลดข้อมูล();
}

async function โหลดข้อมูล() {
  try {
    const สแนปช็อต = await getDocs(collection(db, "leaveTypes"));
    รายการ = สแนปช็อต.docs.map(function (เอกสาร) {
      return Object.assign({ id: เอกสาร.id }, เอกสาร.data());
    });
  } catch (err) {
    ที่วางตาราง.innerHTML = '<p class="alert alert-error">โหลดข้อมูลจาก Firestore ไม่สำเร็จ: ' + esc(err.message) + "</p>";
    return;
  }
  วาดตาราง();
}

function วาดตาราง() {
  if (รายการ.length === 0) {
    ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
    return;
  }

  // ปุ่มแก้ไข/ลบ: เฉพาะฝ่ายบุคคล (hr) เท่านั้น ตาม ACL.md — ผู้ใช้อื่นเห็นตารางแบบอ่านอย่างเดียว
  var หัวคอลัมน์จัดการ = เป็นhr ? "<th>จัดการ</th>" : "";
  var html = "<table><thead><tr><th>ชื่อประเภทการลา</th>" + หัวคอลัมน์จัดการ + "</tr></thead><tbody>";
  รายการ.forEach(function (ประเภท) {
    var ช่องจัดการ = เป็นhr
      ? "<td>" +
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
        "</td>"
      : "";
    html += "<tr><td>" + esc(ประเภท.name) + "</td>" + ช่องจัดการ + "</tr>";
  });
  html += "</tbody></table>";
  ที่วางตาราง.innerHTML = html;

  if (!เป็นhr) return;

  ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
    ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
  });
  ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
    ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
  });
}

async function เพิ่มประเภท() {
  var ชื่อ = ช่องชื่อใหม่.value.trim();
  if (!ชื่อ) {
    กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
    กล่องเตือน.classList.remove("hidden");
    return;
  }
  กล่องเตือน.classList.add("hidden");

  try {
    await addDoc(collection(db, "leaveTypes"), { name: ชื่อ });
  } catch (err) {
    กล่องเตือน.textContent = "⚠️ เพิ่มไม่สำเร็จ: " + err.message;
    กล่องเตือน.classList.remove("hidden");
    return;
  }

  ช่องชื่อใหม่.value = "";
  await โหลดข้อมูล();
}

async function แก้ประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
  if (ชื่อใหม่ === null) return;              // กดยกเลิก
  if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }

  try {
    await updateDoc(doc(db, "leaveTypes", id), { name: ชื่อใหม่.trim() });
  } catch (err) {
    alert("แก้ไม่สำเร็จ: " + err.message);
    return;
  }
  await โหลดข้อมูล();
}

async function ลบประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;

  try {
    await deleteDoc(doc(db, "leaveTypes", id));
  } catch (err) {
    alert("ลบไม่สำเร็จ: " + err.message);
    return;
  }
  await โหลดข้อมูล();
}
