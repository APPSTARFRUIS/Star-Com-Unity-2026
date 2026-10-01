import { supabase } from './supabaseClient';

export interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  actions: string[];
  extractedText: string;
}

const callDocumentApi = async (payload: Record<string, unknown>): Promise<any> => {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');

  const response = await fetch('/api/document-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'L’analyse du document a échoué.');
  return data;
};

export const mistralDocumentService = {
  async extractFromUrl(url: string, fileName: string, mimeType: string): Promise<string> {
    const data = await callDocumentApi({ action: 'extract', url, fileName, mimeType });
    return String(data.extractedText || '').trim();
  },

  async summarizeText(text: string, fileName: string, mimeType: string): Promise<DocumentAnalysis> {
    const data = await callDocumentApi({ action: 'summarize', text, fileName, mimeType });
    return {
      summary: String(data.summary || ''),
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.map(String) : [],
      actions: Array.isArray(data.actions) ? data.actions.map(String) : [],
      extractedText: String(text || ''),
    };
  },
};
