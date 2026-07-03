require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fetch   = global.fetch || require("node-fetch");

const API_KEY  = process.env.API_KEY || "";
const API_BASE = process.env.API_BASE || detectBase(API_KEY);
const MODEL    = process.env.MODEL    || "gpt-4o-mini";
const PORT     = process.env.PORT     || 3000;

const SYSTEM_PROMPT =
  "Bạn là trợ lý AI hữu ích. Trả lời bằng tiếng Việt nếu câu hỏi bằng tiếng Việt. " +
  "Đây là một cuộc hội thoại liên tục — hãy dùng các câu hỏi/trả lời trước đó làm ngữ cảnh khi trả lời câu hỏi mới.";

const MAX_HISTORY_MESSAGES = 20; // giới hạn số lượt hội thoại gửi kèm để tránh payload quá lớn

function detectBase(key) {
  if (key.startsWith("sk-or-")) return "https://openrouter.ai/api/v1";
  if (key.startsWith("AIza"))   return "https://generativelanguage.googleapis.com/v1beta";
  return "https://api.openai.com/v1";
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" })); // tăng giới hạn để nhận ảnh base64
app.use(express.static(path.join(__dirname)));

// Chỉ giữ lại các message hợp lệ {role, content} và cắt bớt nếu quá dài
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (h) =>
        h &&
        (h.role === "user" || h.role === "assistant") &&
        typeof h.content === "string" &&
        h.content.trim() !== ""
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((h) => ({ role: h.role, content: h.content }));
}

// Tách dataURL "data:image/png;base64,AAAA..." thành mimeType + data
function parseImageDataUrl(image) {
  if (typeof image !== "string") return null;
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

// ── POST /api/chat ──────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, image, history } = req.body || {};
  const text = typeof message === "string" ? message.trim() : "";
  const parsedImage = image ? parseImageDataUrl(image) : null;

  if (!text && !parsedImage) {
    return res.status(400).json({ error: "Thiếu nội dung message hoặc ảnh." });
  }
  if (image && !parsedImage) {
    return res.status(400).json({ error: "Định dạng ảnh không hợp lệ." });
  }

  if (!API_KEY) {
    return res.status(500).json({
      error: "Chưa cấu hình API_KEY. Tạo file .env và thêm API_KEY=<key của bạn>.",
    });
  }

  const finalText = text || "Hãy mô tả và phân tích hình ảnh này.";
  const safeHistory = sanitizeHistory(history);

  // Gemini
  if (API_BASE.includes("googleapis")) {
    return callGemini(finalText, parsedImage, safeHistory, res);
  }

  // OpenAI / OpenRouter
  return callOpenAI(finalText, parsedImage, safeHistory, res);
});

async function callOpenAI(message, image, history, res) {
  try {
    const userContent = image
      ? [
          { type: "text", text: message },
          {
            type: "image_url",
            image_url: { url: `data:${image.mimeType};base64,${image.data}` },
          },
        ]
      : message;

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
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: userContent },
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

async function callGemini(message, image, history, res) {
  try {
    const model = MODEL.startsWith("gemini") ? MODEL : "gemini-1.5-flash";
    const url   = `${API_BASE}/models/${model}:generateContent?key=${API_KEY}`;

    const contents = history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));

    const currentParts = [{ text: message }];
    if (image) {
      currentParts.push({
        inlineData: { mimeType: image.mimeType, data: image.data },
      });
    }
    contents.push({ role: "user", parts: currentParts });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
// Luôn trả về index.html cho mọi đường dẫn (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.listen(PORT, () => {
  console.log(`\n✦ AI Chat đang chạy tại http://localhost:${PORT}`);
  console.log(`  Mô hình: ${MODEL}`);
  console.log(`  API:     ${API_BASE}\n`);
});
