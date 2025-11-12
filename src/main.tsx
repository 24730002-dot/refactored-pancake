
  console.log("✅ Vercel 환경변수:", import.meta.env.VITE_API_URL);
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(<App />);
// ✅ 백엔드 연결 테스트용 코드 (여기!)
fetch(`${import.meta.env.VITE_API_URL}/test`)
  .then((res) => res.json())
  .then((data) => console.log("🟢 백엔드 응답:", data))
  .catch((err) => console.error("🔴 연결 실패:", err));