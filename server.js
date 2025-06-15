const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const kdmSchema = new mongoose.Schema({
  movieName: String,
  startTime: String,
  endTime: String
});

const KDM = mongoose.model("KDM", kdmSchema);

// Get all KDMs
app.get("/kdms", async (req, res) => {
  const kdms = await KDM.find();
  res.json(kdms);
});

// Add new KDM
app.post("/kdms", async (req, res) => {
  const newKdm = new KDM(req.body);
  await newKdm.save();
  res.json({ message: "تمت الإضافة بنجاح" });
});

// Update KDM
app.put("/kdms/:id", async (req, res) => {
  await KDM.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "تم التحديث" });
});

// Delete KDM
app.delete("/kdms/:id", async (req, res) => {
  await KDM.findByIdAndDelete(req.params.id);
  res.json({ message: "تم الحذف" });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
