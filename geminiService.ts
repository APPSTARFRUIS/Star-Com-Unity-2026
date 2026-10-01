
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

  async summarizeDocument(text: string): Promise<{ summary: string; keyPoints: string[]; actions: string[] }> {
    const cleaned = (text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) throw new Error('Aucun texte exploitable trouvé dans ce document.');
    if (!process.env.API_KEY) throw new Error('La clé IA n’est pas configurée.');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse uniquement le contenu du document ci-dessous. Ne complète rien avec des connaissances externes. Réponds en JSON strict avec exactement ces clés : summary (chaîne, 3 à 6 phrases), keyPoints (tableau de 3 à 8 chaînes), actions (tableau de chaînes contenant uniquement les échéances, actions ou décisions explicitement présentes; tableau vide s’il n’y en a pas).\n\nDOCUMENT :\n${cleaned.slice(0, 120000)}`,
    });
    const raw = (response.text || '').trim().replace(/^```json\s*/i, '').replace(/```$/,'').trim();
    try {
      const parsed = JSON.parse(raw);
      return {
        summary: String(parsed.summary || ''),
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
        actions: Array.isArray(parsed.actions) ? parsed.actions.map(String) : [],
      };
    } catch {
      throw new Error('La réponse IA n’a pas pu être interprétée. Réessayez.');
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