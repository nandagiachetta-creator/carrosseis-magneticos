const { GoogleGenerativeAI } = require("@google/generative-ai");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { promptContext, backgroundPrompt, hasExpertImage, apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!promptContext) return res.status(400).json({ error: "promptContext é obrigatório." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const systemPrompt = `Você é um especialista em marketing digital para Instagram.
Crie um carrossel de 5 a 7 slides com base na estratégia fornecida.
Identifique o nicho do negócio entre: saude, beleza, fitness, culinaria, moda, tech, educacao, advocacia, confeitaria, psico, imoveis, cosmeticos, espiritualidade, geral.
Responda APENAS com JSON válido, sem markdown, sem blocos de código, sem texto extra.
Formato obrigatório:
{
  "niche": "string (um dos nichos listados)",
  "caption": "string (legenda para o Instagram com hashtags, máximo 300 caracteres)",
  "slides": [
    {
      "title": "string (título curto e impactante, máximo 6 palavras)",
      "subtitle": "string (texto de apoio, máximo 15 palavras)",
      "image_prompt": "string (prompt em inglês para gerar imagem de fundo, seja descritivo e visual)",
      "slide_role": "hook | content | cta"
    }
  ]
}
Regras:
- Primeiro slide: slide_role = "hook" (gancho chamativo)
- Últimos slide: slide_role = "cta" (call to action)
- Slides do meio: slide_role = "content"
- image_prompt deve ser em inglês e descrever uma cena fotográfica real, não abstrata
- Se backgroundPrompt tiver informações de estilo visual, use-as nos image_prompts
- hasExpertImage = ${hasExpertImage ? "true (há foto de especialista, os prompts de imagem devem considerar espaço para pessoa)" : "false"}`;
    const userPrompt = `Estratégia do anúncio: ${promptContext}
${backgroundPrompt ? `\nEstilo visual desejado: ${backgroundPrompt}` : ""}`;
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const data = JSON.parse(clean);
    if (!data.niche || !data.slides || !Array.isArray(data.slides)) {
      throw new Error("Resposta da IA em formato inválido.");
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error("generate-carousel error:", err);
    if (err.message?.includes("API_KEY_INVALID") || err.status === 401 || err.status === 403) {
      return res.status(403).json({ error: "Chave de API inválida." });
    }
    return res.status(500).json({ error: err.message || "Erro ao gerar carrossel." });
  }
};
