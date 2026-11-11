import { GoogleGenerativeAI } from "@google/generative-ai";

// .env dosyasından API anahtarını alır (Expo SDK 54 EXPO_PUBLIC_ önekini otomatik okur)
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Birincil hızlı model ve yoğunluk (503/429) durumunda otomatik yedek modeller
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

export async function generateAIContent(prompt, generationConfig = {}) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    throw new Error('API_KEY_MISSING: .env dosyasında EXPO_PUBLIC_GEMINI_API_KEY tanımlı değil.');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
  let lastError = null;

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const modelName = GEMINI_MODELS[i];
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 1.2,
          topP: 0.95,
          topK: 40,
          ...generationConfig,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      const errMsg = ((error && (error.message || error.toString())) || '').toLowerCase();

      // Çevrimdışı / ağ hatasıysa diğer modelleri denemeye gerek yok
      const isNetworkError =
        errMsg.includes('network') ||
        errMsg.includes('failed to fetch') ||
        errMsg.includes('enotfound') ||
        errMsg.includes('econnrefused');

      if (isNetworkError) {
        throw error;
      }

      // 503 (yoğunluk), 429 (kota), 404 (model yok) durumlarında sonraki yedek modele geç
      const shouldFallback =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('unavailable') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('429') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('quota') ||
        errMsg.includes('404') ||
        errMsg.includes('not found');

      if (shouldFallback && i < GEMINI_MODELS.length - 1) {
        console.log(`${modelName} yanıt veremedi, yedek modele geçiliyor (${GEMINI_MODELS[i + 1]})...`);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
