require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fetch   = global.fetch || require("node-fetch");

const API_KEY  = process.env.API_KEY || "";
const API_BASE = process.env.API_BASE || detectBase(API_KEY);
const MODEL    = process.env.MODEL    || "gpt-4o-mini";
const PORT     = process.env.PORT     || 3000;

function detectBase(key) {
  if (key.startsWith("sk-or-")) return "https://openrouter.ai/api/v1";
  if (key.startsWith("AIza"))   return "https://generativelanguage.googleapis.com/v1beta";
  return "https://api.openai.com/v1";
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── POST /api/chat ──────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Thiếu nội dung message." });
  }

  if (!API_KEY) {
    return res.status(500).json({
      error: "Chưa cấu hình API_KEY. Tạo file .env và thêm API_KEY=<key của bạn>.",
    });
  }

  // Gemini
  if (API_BASE.includes("googleapis")) {
    return callGemini(message, res);
  }

  // OpenAI / OpenRouter
  return callOpenAI(message, res);
});

async function callOpenAI(message, res) {
  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${API_KEY}`,
        ...(API_BASE.includes("openrouter") && {
          "HTTP-Referer": "http://localhost:" + PORT,
          "X-Title":      "AI Chat Personal",
        }),
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Bạn là trợ lý AI hữu ích. Trả lời bằng tiếng Việt nếu câu hỏi bằng tiếng Việt." },
          { role: "user",   content: message },
        ],
        temperature: 0.7,
        max_tokens:  1500,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || `Lỗi API (${response.status})` });
    }
    const answer = data.choices?.[0]?.message?.content?.trim() || "Không có phản hồi.";
    return res.json({ answer });
  } catch (err) {
    console.error("OpenAI/OpenRouter error:", err);
    return res.status(500).json({ error: "Lỗi kết nối API." });
  }
}

async function callGemini(message, res) {
  try {
    const model = MODEL.startsWith("gemini") ? MODEL : "gemini-1.5-flash";
    const url   = `${API_BASE}/models/${model}:generateContent?key=${API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || `Lỗi Gemini (${response.status})` });
    }
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Không có phản hồi.";
    return res.json({ answer });
  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: "Lỗi kết nối Gemini API." });
  }
}

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => {
  console.log(`\n✦ AI Chat đang chạy tại http://localhost:${PORT}`);
  console.log(`  Mô hình: ${MODEL}`);
  console.log(`  API:     ${API_BASE}\n`);
});
