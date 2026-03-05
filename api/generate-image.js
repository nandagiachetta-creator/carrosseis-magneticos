module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { prompt, aspectRatio = "4:5", styleHint, apiKey } = req.body;
    if (!apiKey) return res.status(401).json({ error: "Chave de API não configurada." });
    if (!prompt) return res.status(400).json({ error: "prompt é obrigatório." });
    const ratioMap = {
      "1:1": "1:1", "4:5": "4:5", "9:16": "9:16",
      "16:9": "16:9", "3:4": "3:4",
    };
    const ratio = ratioMap[aspectRatio] || "4:5";
    const fullPrompt = styleHint ? `${prompt}. Style: ${styleHint}` : prompt;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: fullPrompt }],
        parameters: { sampleCount: 1, aspectRatio: ratio },
      }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw Object.assign(new Error(errData?.error?.message || `HTTP ${response.status}`), { status: response.status });
    }
    const data = await response.json();
    const imageB64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!imageB64) throw new Error("Imagem não retornada pela API.");
    return res.status(200).json({ imageB64 });
  } catch (err) {
    console.error("generate-image error:", err);
    if (err.status === 401 || err.status === 403) return res.status(403).json({ error: "Chave de API inválida." });
    return res.status(500).json({ error: err.message || "Erro ao gerar imagem." });
  }
};
