// ============================================================
// RECREATE EXPERT IMAGE — usa Imagen 4 via REST API
// Substituiu: gemini-2.0-flash-preview-image-generation (quebrado)
// ============================================================
const IMAGEN_MODEL = "imagen-4.0-generate-001";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function buildMagneticPrompt(basePrompt) {
  const style = [
    "professional photography",
    "ultra-realistic",
    "8K resolution",
    "cinematic lighting",
    "sharp focus",
    "high detail",
    "magazine quality",
    "editorial style",
    "vibrant colors",
    "clean composition",
  ].join(", ");
  return `${basePrompt}, ${style}`;
}

async function generateSlideImage(slide, apiKey) {
  const { titulo, subtitulo, nicho, paleta, indice, total } = slide;

  let base = "";
  if (titulo) base += titulo;
  if (subtitulo) base += ` — ${subtitulo}`;

  const prompt = buildMagneticPrompt(
    `${base}. Background suitable for Instagram carousel slide ${indice || 1} of ${total || 1}.`
  );

  const url = `${BASE_URL}/${IMAGEN_MODEL}:predict?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: "1:1", personGeneration: "allow_adult" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro Imagen 4 [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  if (!data.predictions || data.predictions.length === 0) {
    throw new Error("Nenhuma imagem retornada pela API Imagen 4.");
  }

  const prediction = data.predictions[0];
  return {
    base64: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType || "image/png",
    dataUrl: `data:${prediction.mimeType || "image/png"};base64,${prediction.bytesBase64Encoded}`,
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { slide, apiKey, aspectRatio = "1:1" } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!slide) return res.status(400).json({ error: "slide é obrigatório." });

    const result = await generateSlideImage(slide, apiKey);
    return res.status(200).json({ imageB64: result.base64, dataUrl: result.dataUrl });
  } catch (err) {
    console.error("recreate-expert-image error:", err);
    if (err.message?.includes("403") || err.message?.includes("401")) {
      return res.status(403).json({ error: "Chave de API inválida." });
    }
    return res.status(500).json({ error: err.message || "Erro ao recriar imagem." });
  }
};
