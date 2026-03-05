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
      `Você é especialista em copywriting para Instagram.
Com base na estratégia: "${promptContext}", crie 3 variações de criativo (imagem única).
Cada criativo deve ter um texto principal e uma legenda.
Responda APENAS com JSON válido:
[
  {
    "backgroundPrompt": "prompt em inglês para gerar imagem de fundo profissional e atrativa",
    "caption": "legenda completa do post com call to action e hashtags relevantes"
  },
  {
    "backgroundPrompt": "prompt diferente em inglês para segunda variação",
    "caption": "segunda legenda variação"
  },
  {
    "backgroundPrompt": "prompt diferente em inglês para terceira variação",
    "caption": "terceira legenda variação"
  }
]`,
    ]);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const data = JSON.parse(clean);
    return res.status(200).json(data);
  } catch (err) {
    console.error("generate-copy error:", err);
    return res.status(500).json({ error: err.message || "Erro ao gerar copy." });
  }
};
