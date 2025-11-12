// 1. import 문 (맨 위)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// 2. 설정
dotenv.config();

// 3. express app 만들기
const app = express();
app.use(cors());
app.use(express.json());

// 4. 몽고DB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 5. 모델 (중복 방지 버전)
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);

// 6. 라우트
app.get("/", (req, res) => {
  res.send("PetFriendly backend running 🐾");
});

app.get("/test", (req, res) => {
  res.json({ message: "✅ Server & MongoDB both alive!" });
});

app.post("/post", async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({ title, content });
    await newPost.save();
    res.json({ message: "✅ Post saved successfully!", data: newPost });
  } catch (error) {
    console.error("❌ Error saving post:", error);
    res.status(500).json({ message: "Error saving post" });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// 7. 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
