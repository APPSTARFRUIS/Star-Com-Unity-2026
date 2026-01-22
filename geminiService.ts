
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async refinePostContent(content: string): Promise<string> {
    if (!process.env.API_KEY) return content;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Veuillez affiner le message suivant pour une communication interne d'entreprise, tout en restant naturel : "${content}"`,
      });
      return response.text || content;
    } catch (error) {
      console.error("Gemini Error:", error);
      return content;
    }
  }

  async generatePostTitle(content: string): Promise<string> {
    if (!process.env.API_KEY) return 'Nouvelle Publication';

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Donne-moi un titre très court (3-5 mots maximum) et accrocheur pour ce message : "${content}"`,
      });
      return response.text?.replace(/"/g, '') || 'Mise à jour';
    } catch (error) {
      return 'Nouvelle Publication';
    }
  }
}

export const geminiService = new GeminiService();