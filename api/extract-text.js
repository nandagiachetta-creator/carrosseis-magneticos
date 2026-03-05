const { GoogleGenerativeAI } = require("@google/generative-ai");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { fileData, mimeType = "application/pdf", apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!fileData) return res.status(400).json({ error: "fileData é obrigatório." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      { inlineData: { mimeType, data: fileData } },
      { text: "Extraia todo o texto deste arquivo e retorne apenas o texto extraído, sem comentários adicionais." },
    ]);
    const text = result.response.text().trim();
    return res.status(200).json({ text });
  } catch (err) {
    console.error("extract-text error:", err);
    return res.status(500).json({ error: err.message || "Erro ao extrair texto." });
  }
};
