const express = require("express");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cron = require("node-cron");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

const dataFile = path.join(__dirname, "data.json");
let kdmList = [];

// تحميل البيانات من الملف
function loadData() {
  try {
    kdmList = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (e) {
    kdmList = [];
  }
}

// حفظ البيانات إلى الملف
function saveData() {
  fs.writeFileSync(dataFile, JSON.stringify(kdmList, null, 2));
}

// أول تحميل للبيانات
loadData();

// استرجاع قائمة KDM
app.get("/get-kdms", (req, res) => {
  loadData();
  res.json(kdmList);
});

// إضافة KDM جديد
app.post("/add-kdm", (req, res) => {
  const kdm = req.body;
  kdmList.push(kdm);
  saveData();
  res.status(200).json({ message: "تمت الإضافة" });
});

// تعديل KDM بناءً على الفهرس
app.put("/edit-kdm/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (index >= 0 && index < kdmList.length) {
    kdmList[index] = req.body;
    saveData();
    res.status(200).json({ message: "تم التعديل" });
  } else {
    res.status(400).json({ message: "فهرس غير صالح" });
  }
});

// حذف KDM بناءً على الفهرس
app.delete("/delete-kdm/:index", (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (index >= 0 && index < kdmList.length) {
    kdmList.splice(index, 1);
    saveData();
    res.status(200).json({ message: "تم الحذف" });
  } else {
    res.status(400).json({ message: "فهرس غير صالح" });
  }
});

// إعداد البريد الإلكتروني (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "almuhsenalgbwry@gmail.com",       // استبدل بريدك
    pass: "mwgk socn mpyz zwmo",          // استخدم App Password
  },
});

// مهمة يومية لفحص KDMs
cron.schedule("0 8 * * *", () => {
  loadData();
  const today = new Date();

  kdmList.forEach((kdm) => {
    const end = new Date(kdm.endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diff === 7) {
      const mailOptions = {
        from: "your_email@gmail.com",
        to: "recipient
