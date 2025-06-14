const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.use(session({
  secret: "kdm-secret-key-12345",
  resave: false,
  saveUninitialized: false,
}));

const dataFile = path.join(__dirname, "data.json");
const usersFile = path.join(__dirname, "users.json");

// --- تحميل وحفظ بيانات KDM ---
function loadKDM() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, "utf8");
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}
function saveKDM(kdmList) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(kdmList, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ بيانات KDM:", err);
  }
}

// --- تحميل وحفظ بيانات المستخدمين ---
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, "utf8");
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ بيانات المستخدمين:", err);
  }
}

// --- البريد الإلكتروني (عدل بياناتك هنا) ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",       // ضع بريدك هنا
    pass: "your_app_password",          // كلمة مرور التطبيق (App Password)
  },
});

// --- API تسجيل مستخدم جديد ---
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "البيانات غير كاملة" });

  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  saveUsers(users);

  res.json({ message: "تم إنشاء الحساب بنجاح" });
});

// --- API تسجيل الدخول ---
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ message: "اسم المستخدم أو كلمة المرور خاطئ" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "اسم المستخدم أو كلمة المرور خاطئ" });

  req.session.user = { username };
  res.json({ message: "تم تسجيل الدخول", username });
});

// --- API تسجيل الخروج ---
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "تم تسجيل الخروج" });
});

// --- Middleware لحماية المسارات ---
function authMiddleware(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "غير مسموح" });
  next();
}

// --- API جلب بيانات KDM (محمي) ---
app.get("/get-kdms", authMiddleware, (req, res) => {
  const kdmList = loadKDM();
  res.json(kdmList);
});

// --- API إضافة KDM (محمي) ---
app.post("/add-kdm", authMiddleware, (req, res) => {
  const { movieName, startDate, endDate } = req.body;
  if (!movieName || !startDate || !endDate) return res.status(400).json({ message: "البيانات غير كاملة" });

  const kdmList = loadKDM();
  kdmList.push({ id: Date.now(), movieName, startDate, endDate });
  saveKDM(kdmList);

  res.json({ message: "تمت الإضافة" });
});

// --- API تعديل KDM (محمي) ---
app.put("/edit-kdm/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const { movieName, startDate, endDate } = req.body;
  if (!movieName || !startDate || !endDate) return res.status(400).json({ message: "البيانات غير كاملة" });

  const kdmList = loadKDM();
  const index = kdmList.findIndex(k => k.id === id);
  if (index === -1) return res.status(404).json({ message: "KDM غير موجود" });

  kdmList[index] = { id, movieName, startDate, endDate };
  saveKDM(kdmList);

  res.json({ message: "تم التعديل" });
});

// --- API حذف KDM (محمي) ---
app.delete("/delete-kdm/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  let kdmList = loadKDM();
  kdmList = kdmList.filter(k => k.id !== id);
  saveKDM(kdmList);
  res.json({ message: "تم الحذف" });
});

// --- فحص انتهاء صلاحية KDM وإرسال إشعارات (مثال بسيط كل دقيقة) ---
setInterval(() => {
  const kdmList = loadKDM();
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7*24*60*60*1000);

  kdmList.forEach(kdm => {
    const end = new Date(kdm.endDate);
    // إذا تبقى أقل من أسبوع لكن لم نتجاوز النهاية
    if (end > now && end <= weekFromNow) {
      // هنا ترسل بريد تنبيه (يمكن تحسين بعدم التكرار)
      const mailOptions = {
        from: "your_email@gmail.com",
        to: "your_email@gmail.com",  // استبدلها أو اجعلها ديناميكية لاحقًا
        subject: `تنبيه انتهاء صلاحية KDM لفيلم ${kdm.movieName}`,
        text: `ستنتهي صلاحية KDM للفيلم "${kdm.movieName}" بتاريخ ${kdm.endDate}. الرجاء تحديثها.`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("خطأ في إرسال البريد:", error);
        else console.log("تم إرسال بريد تنبيه:", info.response);
      });
    }
  });
}, 60 * 1000); // كل دقيقة

// --- تشغيل السيرفر ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
