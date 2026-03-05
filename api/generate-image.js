// api/generate-image.js
// Gerador de imagem via prompt livre (usado pelo botão 🖼️)
const IMAGEN_MODEL = "imagen-4.0-generate-001";
const VALID_ASPECT_RATIOS = ["1:1", "9:16", "16:9", "4:3", "3:4"];
function sanitizeAspectRatio(raw) {
  if (VALID_ASPECT_RATIOS.includes(raw)) return raw;
  return "1:1"; // corrige o bug do "4:5" padrão
}
function buildMagneticPrompt(prompt) {
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
  return `${prompt}, ${styleModifiers}`;
}
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  const apiKey = req.body?.apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
  const { prompt, aspectRatio: rawAspect, sampleCount = 1, language = "pt" } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt é obrigatório." });
  const aspectRatio = sanitizeAspectRatio(rawAspect); // corrige "4:5" → "1:1"
  try {
    const enhancedPrompt = buildMagneticPrompt(prompt);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: enhancedPrompt }],
        parameters: {
          sampleCount,
          aspectRatio,
          personGeneration: "allow_adult",
          language,
        },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Erro Imagen 4: ${errText}` });
    }
    const data = await response.json();
    const prediction = data?.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
      return res.status(500).json({ error: "Nenhuma imagem retornada." });
    }
    return res.status(200).json({
      imageB64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || "image/png",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
