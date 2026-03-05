const { GoogleGenerativeAI } = require("@google/generative-ai");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { promptContext, backgroundPrompt, hasExpertImage, brandName, brandHandle, apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Você é um designer especialista em carrosseis de Instagram no estilo Design Pro.
Crie um carrossel de 5 a 7 slides para: ${promptContext}
${backgroundPrompt ? `Estilo visual: ${backgroundPrompt}` : ""}
${brandName ? `Marca: ${brandName} (@${brandHandle || brandName})` : ""}
Responda APENAS com JSON válido:
{
  "caption": "legenda para o post com hashtags",
  "theme": {
    "accentColor": "#hexcolor",
    "fontTitle": "nome da fonte para títulos (ex: Poppins, Playfair Display, Montserrat)",
    "fontBody": "nome da fonte para corpo (ex: Inter, Lato, Open Sans)"
  },
  "slides": [
    {
      "layout": "hero | quote | stat | content | cta",
      "title": "título do slide",
      "body": "texto principal do slide",
      "swipe_text": "texto de call to action para deslizar (ex: Deslize →)",
      "stat_value": "valor numérico se layout=stat (ex: 87%)",
      "stat_label": "label do stat se layout=stat",
      "quote_text": "texto da citação se layout=quote",
      "quote_author": "autor se layout=quote",
      "quote_role": "cargo/papel do autor se layout=quote",
      "cta_button": "texto do botão se layout=cta"
    }
  ]
}`;
    const result = await model.generateContent([prompt]);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const data = JSON.parse(clean);
    return res.status(200).json(data);
  } catch (err) {
    console.error("generate-designer-carousel error:", err);
    return res.status(500).json({ error: err.message || "Erro ao gerar carrossel designer." });
  }
};
