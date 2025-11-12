import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// 몽고DB 모델 설정

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

// 게시글 저장용 API
app.post("/post", async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({ title, content });
    await newPost.save();
    res.json({ message: "✅ Post saved successfully!", data: newPost });
  } catch (error) {
    console.error("❌ Error saving post:", error);
    res.status(500).json({ message: "Error saving post", error });
  }
});

// 저장된 게시글 불러오기 API
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});


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
