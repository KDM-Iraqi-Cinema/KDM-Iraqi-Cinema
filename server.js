const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

// ملفات البيانات
const DATA_FILE = path.join(__dirname, "data.json");

// إعدادات ميدلوير
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // لو حطيت ملفات الواجهة في مجلد public

// تحميل البيانات أو تهيئتها لو الملف غير موجود
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { users: [], kdms: [] };
  }
  try {
    const json = fs.readFileSync(DATA_FILE);
    return JSON.parse(json);
  } catch {
    return { users: [], kdms: [] };
  }
}

// حفظ البيانات في الملف
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// توليد رقم ID عشوائي (يمكن تعديله حسب الحاجة)
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// مسار إنشاء حساب جديد
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "الرجاء إدخال اسم مستخدم وكلمة مرور" });

  const data = loadData();
  const userExists = data.users.find(u => u.username === username);
  if (userExists) return res.status(409).json({ message: "اسم المستخدم موجود بالفعل" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    data.users.push({ username, password: hashedPassword });
    saveData(data);
    res.json({ message: "تم إنشاء الحساب بنجاح" });
  } catch {
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحساب" });
  }
});

// مسار تسجيل الدخول
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "الرجاء إدخال اسم مستخدم وكلمة مرور" });

  const data = loadData();
  const user = data.users.find(u => u.username === username);
  if (!user) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور خاطئة" });

  try {
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور خاطئة" });
    res.json({ message: "تم تسجيل الدخول بنجاح" });
  } catch {
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
  }
});

// الحصول على كل KDM
app.get("/get-kdms", (req, res) => {
  const data = loadData();
  res.json(data.kdms);
});

// إضافة KDM جديد
app.post("/add-kdm", (req, res) => {
  const { movieName, startDate, endDate } = req.body;
  if (!movieName || !startDate || !endDate) return res.status(400).json({ message: "جميع الحقول مطلوبة" });

  const data = loadData();
  const newKdm = {
    id: generateId(),
    movieName,
    startDate,
    endDate,
  };
  data.kdms.push(newKdm);
  saveData(data);
  res.json({ message: "تمت الإضافة بنجاح" });
});

// تعديل KDM
app.put("/edit-kdm/:id", (req, res) => {
  const { id } = req.params;
  const { movieName, startDate, endDate } = req.body;

  const data = loadData();
  const kdmIndex = data.kdms.findIndex(k => k.id === id);
  if (kdmIndex === -1) return res.status(404).json({ message: "KDM غير موجود" });

  data.kdms[kdmIndex] = { id, movieName, startDate, endDate };
  saveData(data);
  res.json({ message: "تم التعديل بنجاح" });
});

// حذف KDM
app.delete("/delete-kdm/:id", (req, res) => {
  const { id } = req.params;

  const data = loadData();
  const newKdms = data.kdms.filter(k => k.id !== id);
  if (newKdms.length === data.kdms.length) return res.status(404).json({ message: "KDM غير موجود" });

  data.kdms = newKdms;
  saveData(data);
  res.json({ message: "تم الحذف بنجاح" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
