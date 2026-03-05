const { GoogleGenerativeAI } = require("@google/generative-ai");
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { base64ImageData, mimeType = "image/png", prompt, aspectRatio = "4:5", styleHint, apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!base64ImageData) return res.status(400).json({ error: "base64ImageData é obrigatório." });
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-preview-image-generation" });
    const imagePrompt = prompt || "Recriar esta imagem com fundo profissional e iluminação de estúdio.";
    const fullPrompt = styleHint ? `${imagePrompt}. Style: ${styleHint}. Aspect ratio: ${aspectRatio}` : `${imagePrompt}. Aspect ratio: ${aspectRatio}`;
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64ImageData } },
      { text: fullPrompt },
    ]);
    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
    if (!imagePart) throw new Error("Imagem não retornada pela API.");
    return res.status(200).json({ imageB64: imagePart.inlineData.data });
  } catch (err) {
    console.error("recreate-expert-image error:", err);
    if (err.status === 401 || err.status === 403) return res.status(403).json({ error: "Chave de API inválida." });
    return res.status(500).json({ error: err.message || "Erro ao recriar imagem." });
  }
};
