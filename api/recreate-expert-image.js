// api/recreate-expert-image.js
// Gera/regenera a imagem de um slide usando Google Imagen 4
const IMAGEN_MODEL = "imagen-4.0-generate-001";
const VALID_ASPECT_RATIOS = ["1:1", "9:16", "16:9", "4:3", "3:4"];
// Sistema de prompt magnético e realista
function buildMagneticPrompt(basePrompt, slide = {}) {
  const { title = "", subtitle = "" } = slide;
  const styleModifiers = [
    "ultra-realistic professional photography",
    "8K resolution",
    "cinematic lighting",
    "sharp focus",
    "high detail",
    "magazine editorial quality",
    "vibrant and magnetic composition",
    "no text overlay",
    "no watermark",
  ].join(", ");
  let finalBase = basePrompt;
  if (!finalBase && title) {
    finalBase = `Professional background image representing: ${title}. ${subtitle ? subtitle : ""}`;
  }
  if (!finalBase) {
    finalBase = "Clean professional background for social media carousel slide";
  }
  return `${finalBase}, ${styleModifiers}`;
}
// Sanitizar e validar o aspectRatio
function sanitizeAspectRatio(raw) {
  if (VALID_ASPECT_RATIOS.includes(raw)) return raw;
  return "1:1";
}
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  // Aceitar apiKey do body OU da variável de ambiente do Vercel
  const apiKey = req.body?.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
  // Aceitar tanto o schema antigo { base64ImageData, prompt, ... }
  // quanto o schema novo { slide, ... }
  const slide = req.body?.slide || {};
  const prompt =
    req.body?.prompt ||
    slide?.imagePrompt ||
    `${slide?.title || ""} ${slide?.subtitle || ""}`.trim();
  const rawAspectRatio = req.body?.aspectRatio || req.body?.aspect_ratio || "1:1";
  const aspectRatio = sanitizeAspectRatio(rawAspectRatio);
  if (!prompt) return res.status(400).json({ error: "prompt ou slide é obrigatório." });
  try {
    const enhancedPrompt = buildMagneticPrompt(prompt, slide);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${apiKey}`;
    const body = {
      instances: [{ prompt: enhancedPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio,
        personGeneration: "allow_adult",
        language: "pt",
      },
    };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("Imagen 4 error:", errText);
      return res.status(500).json({ error: `Erro na API Imagen 4: ${errText}` });
    }
    const data = await response.json();
    const prediction = data?.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
      return res.status(500).json({ error: "Nenhuma imagem retornada pelo Imagen 4." });
    }
    return res.status(200).json({
      imageB64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || "image/png",
    });
  } catch (err) {
    console.error("Erro interno:", err);
    return res.status(500).json({ error: err.message });
  }
}
