const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 قاعدة البيانات
mongoose.connect("mongodb+srv://<username>:<password>@cluster0.abkeh.mongodb.net/kdmDB?retryWrites=true&w=majority")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 🟢 نموذج KDM
const kdmSchema = new mongoose.Schema({
  movieName: String,
  startTime: String,
  endTime: String
});
const KDM = mongoose.model("KDM", kdmSchema);

// 🟢 API لجلب جميع KDM
app.get("/kdms", async (req, res) => {
  const kdms = await KDM.find();
  res.json(kdms);
});

// 🟢 API لإضافة KDM
app.post("/kdms", async (req, res) => {
  const kdm = new KDM(req.body);
  await kdm.save();
  res.status(201).json(kdm);
});

// 🟢 API لحذف KDM
app.delete("/kdms/:id", async (req, res) => {
  await KDM.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// 🟢 API لتعديل KDM
app.put("/kdms/:id", async (req, res) => {
  const updated = await KDM.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// 🟢 إرسال ملف index.html مباشرة من الجذر
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🟢 إرسال ملفات CSS أو JS من الجذر
app.use(express.static(__dirname));

// 🟢 بدء السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
