import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 기본 테스트 라우트
app.get("/", (req, res) => {
  res.send("PetFriendly backend running 🐾");
});

// 테스트용 경로
app.get("/test", (req, res) => {
  res.json({ message: "✅ Server & MongoDB both alive!" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
