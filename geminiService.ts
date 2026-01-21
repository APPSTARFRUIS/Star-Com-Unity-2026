
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // Fix: Replaced Mistral API with Gemini API and used process.env.API_KEY as per guidelines
  private async callGemini(prompt: string, systemInstruction: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    try {
      const response = await ai.models.generateContent({
        // Fix: Using gemini-3-flash-preview for basic text refinement tasks
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      // Fix: Accessing .text property directly from GenerateContentResponse
      return response.text || '';
    } catch (error) {
      console.error("Gemini API Error:", error);
      return '';
    }
  }

  async refinePostContent(content: string): Promise<string> {
    if (!content) return content;
    // Fix: Using systemInstruction instead of manual prompt construction
    const systemInstruction = "Agis comme un expert en communication interne d'entreprise. Réécris le message suivant pour qu'il soit professionnel, chaleureux et engageant, tout en restant naturel. Ne change pas le sens fondamental.";
    const refined = await this.callGemini(content, systemInstruction);
    return refined || content;
  }

  async generatePostTitle(content: string): Promise<string> {
    if (!content) return 'Nouvelle Publication';
    // Fix: Using systemInstruction for title generation
    const systemInstruction = "Génère un titre percutant de 3 à 5 mots maximum pour le message suivant de communication interne. Réponds uniquement le titre, sans guillemets.";
    const title = await this.callGemini(content, systemInstruction);
    return title?.replace(/"/g, '').trim() || 'Mise à jour';
  }
}

export const geminiService = new GeminiService();
