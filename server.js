const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const { User, Kdm } = require("./models");

const app = express();
const PORT = 3000;

// ----- ضع هنا رابط اتصال MongoDB الخاص بك -----

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://<db_username>:<db_password>@cluster0.abkeh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

// ----------------------------------------------

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// تسجيل حساب جديد
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "الرجاء إدخال اسم مستخدم وكلمة مرور" });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(409).json({ message: "اسم المستخدم موجود بالفعل" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ message: "تم إنشاء الحساب بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحساب" });
  }
});

// تسجيل الدخول
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "الرجاء إدخال اسم مستخدم وكلمة مرور" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور خاطئة" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور خاطئة" });

    res.json({ message: "تم تسجيل الدخول بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
  }
});

// جلب كل KDM
app.get("/get-kdms", async (req, res) => {
  try {
    const kdms = await Kdm.find();
    res.json(kdms);
  } catch {
    res.status(500).json({ message: "حدث خطأ أثناء جلب البيانات" });
  }
});

// إضافة KDM جديد
app.post("/add-kdm", async (req, res) => {
  const { movieName, startDate, endDate } = req.body;
  if (!movieName || !startDate || !endDate) return res.status(400).json({ message: "جميع الحقول مطلوبة" });

  try {
    const newKdm = new Kdm({ movieName, startDate, endDate });
    await newKdm.save();
    res.json({ message: "تمت الإضافة بنجاح" });
  } catch {
    res.status(500).json({ message: "حدث خطأ أثناء إضافة KDM" });
  }
});

// تعديل KDM
app.put("/edit-kdm/:id", async (req, res) => {
  const { id } = req.params;
  const { movieName, startDate, endDate } = req.body;

  try {
    const updated = await Kdm.findByIdAndUpdate(id, { movieName, startDate, endDate }, { new: true });
    if (!updated) return res.status(404).json({ message: "KDM غير موجود" });
    res.json({ message: "تم التعديل بنجاح" });
  } catch {
    res.status(500).json({ message: "حدث خطأ أثناء تعديل KDM" });
  }
});

// حذف KDM
app.delete("/delete-kdm/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Kdm.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "KDM غير موجود" });
    res.json({ message: "تم الحذف بنجاح" });
  } catch {
    res.status(500).json({ message: "حدث خطأ أثناء حذف KDM" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
