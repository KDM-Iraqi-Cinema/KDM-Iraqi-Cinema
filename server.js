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

let kdmList = [];
const dataFile = path.join(__dirname, "data.json");

try {
  kdmList = JSON.parse(fs.readFileSync(dataFile, "utf8"));
} catch (e) {
  kdmList = [];
}

app.post("/add-kdm", (req, res) => {
  const kdm = req.body;
  kdmList.push(kdm);
  fs.writeFileSync(dataFile, JSON.stringify(kdmList, null, 2));
  res.status(200).json({ message: "تمت الإضافة" });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_app_password",
  },
});

cron.schedule("0 8 * * *", () => {
  const today = new Date();

  kdmList.forEach(kdm => {
    const end = new Date(kdm.endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diff === 7) {
      const mailOptions = {
        from: "your_email@gmail.com",
        to: "recipient@example.com",
        subject: `تنبيه KDM: "${kdm.movieName}" ينتهي خلال أسبوع`,
        text: `⚠️ ينتهي KDM الخاص بفيلم "${kdm.movieName}" في ${kdm.endDate}.`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("فشل إرسال البريد:", err);
        } else {
          console.log("📨 تم إرسال الإشعار:", info.response);
        }
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🌐 الخادم يعمل على: http://localhost:${PORT}`);
});
