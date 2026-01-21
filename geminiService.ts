
export class GeminiService {
  private async callMistral(prompt: string): Promise<string> {
    // Utilisation de la clé fournie par l'utilisateur
    const apiKey = 'tBRn6S2Cl6F0CE76lxGyZ2wN2XUOI4tF';

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Mistral API Error:", errorData);
        return '';
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error("Mistral Fetch Error:", error);
      return '';
    }
  }

  async refinePostContent(content: string): Promise<string> {
    if (!content) return content;
    const prompt = `Agis comme un expert en communication interne d'entreprise. Réécris le message suivant pour qu'il soit professionnel, chaleureux et engageant, tout en restant naturel. Ne change pas le sens fondamental : "${content}"`;
    const refined = await this.callMistral(prompt);
    return refined || content;
  }

  async generatePostTitle(content: string): Promise<string> {
    if (!content) return 'Nouvelle Publication';
    const prompt = `Génère un titre percutant de 3 à 5 mots maximum pour le message suivant de communication interne : "${content}". Réponds uniquement le titre, sans guillemets.`;
    const title = await this.callMistral(prompt);
    return title?.replace(/"/g, '').trim() || 'Mise à jour';
  }
}

export const geminiService = new GeminiService();
