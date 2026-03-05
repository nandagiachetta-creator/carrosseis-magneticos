const { GoogleGenerativeAI } = require("@google/generative-ai");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { audioData, mimeType = "audio/webm", apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!audioData) return res.status(400).json({ error: "audioData é obrigatório." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      { inlineData: { mimeType, data: audioData } },
      { text: "Transcreva o áudio a seguir para texto em português. Retorne APENAS o texto transcrito, sem comentários." },
    ]);
    const text = result.response.text().trim();
    return res.status(200).json({ text });
  } catch (err) {
    console.error("transcribe error:", err);
    return res.status(500).json({ error: err.message || "Erro ao transcrever áudio." });
  }
};
