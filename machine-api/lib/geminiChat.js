const { GoogleGenAI } = require("@google/genai");
const { KeyRotator } = require("./keyRotator");

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

function loadKeys() {
  const keys = [];
  for (let i = 1; i <= 20; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  if (process.env.GEMINI_API_KEY) keys.unshift(process.env.GEMINI_API_KEY);
  return keys;
}

const rotator = new KeyRotator(loadKeys());

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
];

const SYSTEM_PROMPT = `Kamu adalah asisten AI dari platform "Machine API" buatan XYCoolcraft.
Jawab dengan ramah, jelas, dan membantu. Gunakan bahasa yang sama dengan bahasa pengguna.
Jika pengguna mengirim gambar atau file, analisis isinya sebelum menjawab.`;

function buildContents(history, message, files) {
  const contents = [];

  for (const turn of history || []) {
    contents.push({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.text }]
    });
  }

  const parts = [{ text: message || "" }];
  for (const f of files || []) {
    if (f.base64 && f.mimeType) {
      parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
    }
  }

  contents.push({ role: "user", parts });
  return contents;
}

async function chatWithGemini({ message, history, files }) {
  if (!rotator.hasKeys()) {
    throw new Error("Belum ada GEMINI_API_KEY yang diset di .env");
  }

  return rotator.run(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });
    const contents = buildContents(history, message, files);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        safetySettings: SAFETY_SETTINGS
      }
    });

    const text = response.text || (response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content &&
      response.candidates[0].content.parts &&
      response.candidates[0].content.parts.map(p => p.text || "").join("")) || "";

    return { text, model: MODEL };
  });
}

module.exports = { chatWithGemini, MODEL };
