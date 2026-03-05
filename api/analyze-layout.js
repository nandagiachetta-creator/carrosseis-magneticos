const { GoogleGenerativeAI } = require("@google/generative-ai");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { imageB64, title, subtitle, slideRole, nicheHint, apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!imageB64) return res.status(400).json({ error: "imageB64 é obrigatório." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      { inlineData: { mimeType: "image/png", data: imageB64 } },
      `Analise esta imagem e sugira uma paleta de cores e tipografia para um slide de carrossel de Instagram.
Slide: "${title}" / "${subtitle}" (papel: ${slideRole || "content"}, nicho: ${nicheHint || "geral"})
Responda APENAS com JSON válido:
{
  "textColor": "#hexcolor (cor do texto que contrasta bem com a imagem)",
  "overlayColor": "#hexcolor (cor do overlay/sombra, geralmente escura)",
  "badgeColor": "#hexcolor (cor de destaque/badge)",
  "fontFamily": "nome da fonte (Poppins, Inter, Montserrat, Playfair Display, etc)",
  "overlayOpacity": 0.45
}`,
    ]);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const data = JSON.parse(clean);
    return res.status(200).json(data);
  } catch (err) {
    console.error("analyze-layout error:", err);
    return res.status(500).json({ error: err.message || "Erro ao analisar layout." });
  }
};
