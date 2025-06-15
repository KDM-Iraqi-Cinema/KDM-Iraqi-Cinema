const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect("YOUR_MONGO_URL", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const kdmSchema = new mongoose.Schema({
  movieName: String,
  startTime: String,
  endTime: String,
});

const KDM = mongoose.model("KDM", kdmSchema);

// Get all
app.get("/kdms", async (req, res) => {
  const kdms = await KDM.find();
  res.json(kdms);
});

// Add
app.post("/kdms", async (req, res) => {
  const newKdm = new KDM(req.body);
  await newKdm.save();
  res.json({ message: "KDM Added" });
});

// Delete
app.delete("/kdms/:id", async (req, res) => {
  await KDM.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Edit
app.put("/kdms/:id", async (req, res) => {
  await KDM.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Updated" });
});

app.listen(port, () => console.log(`Server on port ${port}`));
