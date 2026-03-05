// ============================================================
// GEMINI IMAGE SERVICE — Carrosseis Magnéticos
// Usa Imagen 4 via REST API (v1beta) — modelo correto e funcional
// ============================================================
const IMAGEN_MODEL = "imagen-4.0-generate-001";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
// Mapeamento de proporção para formato aceito pela API
const ASPECT_RATIO_MAP = {
  "1:1": "1:1",
  "9:16": "9:16",
  "16:9": "16:9",
  "4:3": "4:3",
  "3:4": "3:4",
};
/**
 * Gera imagem via Imagen 4 (Google) com prompt magnético e realista
 * @param {string} prompt - Descrição da imagem
 * @param {string} apiKey - Chave da Google AI API
 * @param {Object} options - Opções: aspectRatio, sampleCount, seed, language
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
export async function generateImageWithImagen(prompt, apiKey, options = {}) {
  const {
    aspectRatio = "1:1",
    sampleCount = 1,
    seed = null,
    language = "pt",
    personGeneration = "allow_adult",
  } = options;
  if (!apiKey) throw new Error("Chave API do Google não informada.");
  // Monta o prompt magnético/realista automaticamente
  const enhancedPrompt = buildMagneticPrompt(prompt);
  const url = `${BASE_URL}/${IMAGEN_MODEL}:predict?key=${apiKey}`;
  const body = {
    instances: [{ prompt: enhancedPrompt }],
    parameters: {
      sampleCount,
      aspectRatio: ASPECT_RATIO_MAP[aspectRatio] || "1:1",
      personGeneration,
      language,
      ...(seed !== null && { seed }),
    },
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
/**
 * Gera imagens para todos os slides automaticamente
 * @param {Array} slides - Array de slides com título e subtítulo
 * @param {string} apiKey - Chave da Google AI API
 * @param {Object} options - Opções globais
 * @param {Function} onProgress - Callback (slideIndex, total, result)
 */
export async function generateAllSlideImages(slides, apiKey, options = {}, onProgress = null) {
  const results = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    try {
      const prompt = buildSlideImagePrompt(slide, options);
      const result = await generateImageWithImagen(prompt, apiKey, options);
      results.push({ index: i, success: true, ...result });
      if (onProgress) onProgress(i, slides.length, result);
    } catch (err) {
      console.error(`Erro no slide ${i + 1}:`, err);
      results.push({ index: i, success: false, error: err.message });
      if (onProgress) onProgress(i, slides.length, null, err);
    }
    // Aguardar entre chamadas para respeitar rate limit
    if (i < slides.length - 1) {
      await sleep(1500);
    }
  }
  return results;
}
// ============================================================
// SISTEMA DE PROMPT MAGNÉTICO E REALISTA
// ============================================================
/**
 * Constrói um prompt magnético/profissional a partir de uma descrição simples
 */
export function buildMagneticPrompt(basePrompt) {
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
/**
 * Constrói prompt específico para cada slide com base no conteúdo do carrossel
 */
export function buildSlideImagePrompt(slide, options = {}) {
  const { titulo, subtitulo, nicho, paleta, indice, total } = slide;
  const { tema, estilo } = options;
  let base = "";
  if (titulo) {
    base += `${titulo}`;
  }
  if (subtitulo) {
    base += ` — ${subtitulo}`;
  }
  const nichoContext = getNichoContext(nicho);
  if (nichoContext) {
    base += `. ${nichoContext}`;
  }
  const paletaStyle = getPaletaStyle(paleta);
  const fullPrompt = buildMagneticPrompt(
    `${base}. ${paletaStyle}. Background suitable for Instagram carousel slide ${indice} of ${total}.`
  );
  return fullPrompt;
}
// Contextos por nicho para prompts mais relevantes
function getNichoContext(nicho) {
  const nichoMap = {
    coach: "motivational coaching scene, empowering atmosphere, successful professional environment",
    nutricionista: "healthy food, clean eating, fresh organic ingredients, wellness lifestyle",
    esteticista: "luxury beauty salon, skincare products, elegant spa atmosphere",
    advogada: "professional law office, sophisticated corporate environment, justice and elegance",
    confeiteira: "artisan bakery, beautiful pastries, warm golden tones, sweet elegant setting",
    personal: "modern gym, fitness motivation, dynamic sports energy, strong body",
    moda: "fashion editorial, trendy clothing, stylish lifestyle, runway aesthetic",
    tech: "modern technology, digital innovation, futuristic clean design, code and data",
    psicologa: "calm therapy environment, mindfulness, emotional wellness, peaceful atmosphere",
    corretora: "luxury real estate, elegant interior design, premium property",
    petshop: "adorable pets, veterinary care, animal wellness, cute and colorful",
    educacao: "inspiring classroom, books and knowledge, academic success, learning journey",
  };
  return nichoMap[nicho?.toLowerCase()] || "";
}
// Estilos visuais por paleta de cores
function getPaletaStyle(paleta) {
  const paletaMap = {
    clean: "minimalist white background, clean lines, pure white tones",
    luxo: "luxurious gold and black, premium elegant look, sophisticated dark tones",
    "rosa-vibrante": "vibrant pink gradient, energetic feminine palette, bold fuchsia tones",
    natureza: "natural green tones, organic earthy colors, botanical fresh atmosphere",
    coral: "warm coral and peach tones, feminine and warm palette",
    royal: "deep royal blue, regal purple accents, prestigious dark palette",
    oceano: "ocean blue and turquoise, fresh aquatic tones, coastal vibes",
    fogo: "fiery red and orange gradient, passionate warm tones, bold energy",
    neutro: "neutral beige and gray tones, sophisticated minimalism",
    dourada: "warm golden tones, luxury metallic accents, elegant amber palette",
    menta: "fresh mint green, light and airy palette, clean refreshing tones",
    ameixa: "deep plum and burgundy, rich dark feminine tones",
    "escuro-pro": "dark moody background, professional dark theme, cinematic noir",
    pastel: "soft pastel rainbow, dreamy gentle colors, delicate feminine palette",
    monocromo: "black and white high contrast, classic monochrome, timeless elegance",
  };
  return paletaMap[paleta?.toLowerCase()] || "clean professional background, neutral tones";
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
