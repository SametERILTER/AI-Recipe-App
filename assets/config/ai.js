import { GoogleGenerativeAI } from "@google/generative-ai";

// .env dosyasından API anahtarını alır (Expo SDK 54 EXPO_PUBLIC_ önekini otomatik okur)
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Tek, hızlı ve yüksek ücretsiz kotalı model (Günlük 500 istek - RPD)
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

export async function generateAIContent(prompt, generationConfig = {}) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
    throw new Error('API_KEY_MISSING: .env dosyasında EXPO_PUBLIC_GEMINI_API_KEY tanımlı değil.');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
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
}
