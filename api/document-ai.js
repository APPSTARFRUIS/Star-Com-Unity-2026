import { createClient } from '@supabase/supabase-js';

const jsonFromModel = (value) => {
  const raw = String(value || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(raw); } catch { return null; }
};

const mistralFetch = async (path, apiKey, body) => {
  const response = await fetch(`https://api.mistral.ai${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error?.message || `Erreur Mistral (${response.status})`;
    throw new Error(message);
  }
  return data;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Méthode non autorisée.' });
  }

  try {
    const mistralKey = process.env.MISTRAL_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const authorization = request.headers.authorization;

    if (!mistralKey) return response.status(500).json({ error: 'La clé Mistral n’est pas configurée sur Vercel (MISTRAL_API_KEY).' });
    if (!supabaseUrl || !anonKey) return response.status(500).json({ error: 'Configuration Supabase serveur incomplète.' });
    if (!authorization) return response.status(401).json({ error: 'Session utilisateur manquante.' });

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) return response.status(401).json({ error: 'Session utilisateur invalide.' });

    const body = request.body || {};
    const action = String(body.action || '');

    if (action === 'extract') {
      const url = String(body.url || '').trim();
      const mimeType = String(body.mimeType || '').toLowerCase();
      if (!url || !/^https?:\/\//i.test(url)) return response.status(400).json({ error: 'URL du document invalide.' });

      const isImage = mimeType.startsWith('image/') || /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(url);
      const ocr = await mistralFetch('/v1/ocr', mistralKey, {
        model: 'mistral-ocr-latest',
        document: isImage
          ? { type: 'image_url', image_url: url }
          : { type: 'document_url', document_url: url },
        table_format: 'markdown',
        include_image_base64: false,
      });
      const pages = Array.isArray(ocr?.pages) ? ocr.pages : [];
      const extractedText = pages.map((p) => p?.markdown || p?.text || '').filter(Boolean).join('\n\n').trim();
      if (!extractedText) return response.status(422).json({ error: 'Aucun contenu exploitable n’a été extrait de ce document.' });
      return response.status(200).json({ ok: true, extractedText });
    }

    if (action === 'summarize') {
      const text = String(body.text || '').replace(/\u0000/g, '').trim();
      const fileName = String(body.fileName || 'document');
      const mimeType = String(body.mimeType || '');
      if (text.length < 20) return response.status(400).json({ error: 'Le document ne contient pas assez de contenu exploitable.' });

      const prompt = `Tu analyses un document interne nommé "${fileName}" (${mimeType || 'type inconnu'}).\n` +
        `Base-toi UNIQUEMENT sur son contenu. N'invente aucune information. Adapte la synthèse au type de document : pour un tableur, décris les feuilles/tableaux, indicateurs et données saillantes ; pour une présentation, restitue les messages des diapositives ; pour un document texte, restitue sa structure et son contenu.\n` +
        `Réponds en JSON strict avec exactement : {"summary":"3 à 6 phrases","keyPoints":["3 à 8 points"],"actions":["uniquement actions, décisions ou échéances explicitement présentes"]}. Si aucune action/échéance n'est présente, actions doit être [].\n\nCONTENU :\n${text.slice(0, 180000)}`;

      const completion = await mistralFetch('/v1/chat/completions', mistralKey, {
        model: process.env.MISTRAL_DOCUMENT_MODEL || 'mistral-small-latest',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      const parsed = jsonFromModel(completion?.choices?.[0]?.message?.content);
      if (!parsed) return response.status(502).json({ error: 'Mistral a renvoyé une réponse inexploitable. Réessayez.' });
      return response.status(200).json({
        ok: true,
        summary: String(parsed.summary || ''),
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
        actions: Array.isArray(parsed.actions) ? parsed.actions.map(String) : [],
      });
    }

    return response.status(400).json({ error: 'Action d’analyse inconnue.' });
  } catch (error) {
    console.error('Document AI error:', error);
    const raw = String(error?.message || error || 'Erreur inconnue');
    const clean = /api key|unauthorized|401/i.test(raw)
      ? 'La configuration Mistral doit être vérifiée sur Vercel.'
      : 'Impossible d’analyser ce document pour le moment. Réessayez dans quelques instants.';
    return response.status(500).json({ error: clean });
  }
}
