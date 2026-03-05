const { GoogleGenerativeAI } = require("@google/generative-ai");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { promptContext, apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!promptContext) return res.status(400).json({ error: "promptContext é obrigatório." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      `Com base na estratégia: "${promptContext}", crie 3 legendas diferentes para Instagram.
Responda APENAS com JSON válido no formato:
[
  { "caption": "legenda 1 com hashtags", "imagePrompt": "prompt em inglês para imagem de capa" },
  { "caption": "legenda 2 com hashtags", "imagePrompt": "prompt em inglês para imagem de capa" },
  { "caption": "legenda 3 com hashtags", "imagePrompt": "prompt em inglês para imagem de capa" }
]`,
    ]);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const data = JSON.parse(clean);
    return res.status(200).json(data);
  } catch (err) {
    console.error("generate-captions error:", err);
    return res.status(500).json({ error: err.message || "Erro ao gerar legendas." });
  }
};
