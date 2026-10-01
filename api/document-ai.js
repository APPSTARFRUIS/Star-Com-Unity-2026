import { createClient } from '@supabase/supabase-js';

const parseStructuredSummary = (value) => {
  const raw = String(value || '').replace(/```(?:json|text)?/gi, '').trim();
  if (!raw) return null;

  // Compatibilité avec une éventuelle réponse JSON spontanée, sans jamais l'imposer au modèle.
  try {
    const parsed = JSON.parse(raw);
    return {
      summary: String(parsed?.summary || '').trim(),
      keyPoints: Array.isArray(parsed?.keyPoints) ? parsed.keyPoints.map(String).filter(Boolean) : [],
      actions: Array.isArray(parsed?.actions) ? parsed.actions.map(String).filter(Boolean) : [],
    };
  } catch {}

  const normalized = raw.replace(/\r\n/g, '\n');
  const section = (name, nextNames = []) => {
    const alternatives = nextNames.length ? `(?=\n(?:${nextNames.join('|')}):|$)` : '$';
    const re = new RegExp(`(?:^|\n)${name}:\s*([\s\S]*?)${alternatives}`, 'i');
    return (normalized.match(re)?.[1] || '').trim();
  };
  const summary = section('SUMMARY', ['KEY_POINTS', 'ACTIONS']);
  const pointsRaw = section('KEY_POINTS', ['ACTIONS']);
  const actionsRaw = section('ACTIONS');
  const list = (block) => String(block || '')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((line) => line && !/^(?:aucune?|néant|none)$/i.test(line));

  // Même si le modèle oublie les marqueurs, on ne fait plus échouer l'analyse :
  // sa réponse devient la synthèse et les listes restent vides.
  return {
    summary: summary || normalized.trim(),
    keyPoints: list(pointsRaw),
    actions: list(actionsRaw),
  };
};

const mistralFetch = async (path, apiKey, body, stage = 'mistral') => {
  const res = await fetch(`https://api.mistral.ai${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw: raw.slice(0, 1000) }; }
  if (!res.ok) {
    const detail = data?.message || data?.error?.message || data?.detail || data?.raw || `HTTP ${res.status}`;
    const err = new Error(String(detail));
    err.status = res.status;
    err.provider = 'mistral';
    err.stage = stage;
    err.providerBody = data;
    const requestId = res.headers.get('x-request-id') || res.headers.get('request-id') || '';
    if (requestId) err.requestId = requestId;
    throw err;
  }
  return data;
};


const groqFetch = async (path, apiKey, body, stage = 'summary') => {
  const res = await fetch(`https://api.groq.com/openai${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw: raw.slice(0, 1000) }; }
  if (!res.ok) {
    const detail = data?.error?.message || data?.message || data?.detail || data?.raw || `HTTP ${res.status}`;
    const err = new Error(String(detail));
    err.status = res.status;
    err.provider = 'groq';
    err.stage = stage;
    err.providerBody = data;
    const requestId = res.headers.get('x-request-id') || res.headers.get('request-id') || '';
    if (requestId) err.requestId = requestId;
    err.rateLimit = {
      retryAfter: res.headers.get('retry-after'),
      remainingTokens: res.headers.get('x-ratelimit-remaining-tokens'),
      resetTokens: res.headers.get('x-ratelimit-reset-tokens'),
      remainingRequests: res.headers.get('x-ratelimit-remaining-requests'),
    };
    throw err;
  }
  return data;
};


const chooseGroqModel = async (apiKey) => {
  const configured = String(process.env.GROQ_DOCUMENT_MODEL || '').trim();
  const preferred = [configured, 'openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'].filter(Boolean);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      const ids = new Set((Array.isArray(data?.data) ? data.data : []).map((m) => m?.id).filter(Boolean));
      const available = preferred.find((id) => ids.has(id));
      if (available) return available;
    }
  } catch (error) {
    console.warn('Groq model discovery failed; using production fallback.', String(error?.message || error));
  }
  return 'openai/gpt-oss-20b';
};

const mimeFromName = (name = '', fallback = '') => {
  if (fallback && fallback !== 'application/octet-stream') return fallback;
  const n = String(name).toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.doc')) return 'application/msword';
  if (n.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (n.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (n.endsWith('.png')) return 'image/png';
  if (/\.jpe?g$/.test(n)) return 'image/jpeg';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.avif')) return 'image/avif';
  return fallback || 'application/octet-stream';
};

const fetchAsDataUrl = async (url, fileName, declaredMime) => {
  const source = await fetch(url, { redirect: 'follow' });
  if (!source.ok) {
    const err = new Error(`Le fichier source n’est pas accessible (HTTP ${source.status}).`);
    err.status = source.status;
    err.provider = 'source';
    throw err;
  }
  const buffer = Buffer.from(await source.arrayBuffer());
  if (!buffer.length) throw new Error('Le fichier source est vide.');
  // Garde une marge sous les limites des fonctions serverless et de l'API OCR.
  if (buffer.length > 20 * 1024 * 1024) {
    const err = new Error('Ce document est trop volumineux pour l’analyse automatique (maximum 20 Mo).');
    err.status = 413;
    err.provider = 'source';
    throw err;
  }
  const contentType = mimeFromName(fileName, (source.headers.get('content-type') || declaredMime || '').split(';')[0]);
  return { dataUrl: `data:${contentType};base64,${buffer.toString('base64')}`, contentType };
};

const prepareGroqText = (value, maxChars = 18000) => {
  const text = String(value || '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();
  if (text.length <= maxChars) return { text, truncated: false, originalLength: text.length };

  // Conserve le début, le milieu et la fin du document afin de rester sous le TPM
  // du tier gratuit Groq sans résumer uniquement les premières pages.
  const separator = '\n\n[... extrait intermédiaire ...]\n\n';
  const budget = maxChars - separator.length * 2;
  const firstSize = Math.floor(budget * 0.45);
  const middleSize = Math.floor(budget * 0.25);
  const lastSize = budget - firstSize - middleSize;
  const middleStart = Math.max(firstSize, Math.floor((text.length - middleSize) / 2));
  const selected = [
    text.slice(0, firstSize),
    text.slice(middleStart, middleStart + middleSize),
    text.slice(-lastSize),
  ].join(separator);
  return { text: selected, truncated: true, originalLength: text.length };
};

const friendlyError = (error) => {
  const raw = String(error?.message || error || 'Erreur inconnue');
  const status = Number(error?.status || 500);
  const stage = error?.stage === 'ocr' ? 'OCR' : error?.stage === 'summary' ? 'synthèse' : 'analyse';
  const provider = error?.provider === 'groq' ? 'Groq' : 'Mistral';
  if (/api key|unauthorized|invalid.*key|401/i.test(raw) || status === 401) return `La clé ${provider} configurée sur Vercel est refusée. Vérifiez qu’elle est active.`;
  if (status === 429 || /rate.?limit|too many/i.test(raw)) return `${provider} limite actuellement l’étape ${stage} (429). Détail : ${raw.slice(0, 300)}`;
  if (status === 402 || /payment|billing|credit|insufficient|balance/i.test(raw)) return `${provider} refuse l’étape ${stage} pour un problème de crédit ou de facturation. Détail : ${raw.slice(0, 220)}`;
  if (status === 403) return `${provider} refuse l’accès à l’étape ${stage} (403). La clé est reconnue mais n’a probablement pas accès au modèle ou au service demandé.`;
  if (status === 413 || /too (large|big)|maximum 20/i.test(raw)) return raw;
  if (error?.provider === 'source') return raw;
  if (/unsupported|not supported|format|media type/i.test(raw)) return `${provider} ne peut pas traiter ce format : ${raw}`;
  return `L’analyse ${provider} a échoué (${status}). ${raw.slice(0, 300)}`;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Méthode non autorisée.' });
  }

  try {
    const mistralKey = process.env.MISTRAL_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const authorization = request.headers.authorization;

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
      if (!mistralKey) return response.status(500).json({ error: 'La clé Mistral n’est pas configurée sur Vercel (MISTRAL_API_KEY). Elle est uniquement requise pour l’OCR de secours.' });
      const url = String(body.url || '').trim();
      const fileName = String(body.fileName || 'document');
      const declaredMime = String(body.mimeType || '').toLowerCase();
      if (!url || !/^https?:\/\//i.test(url)) return response.status(400).json({ error: 'URL du document invalide.' });

      // Les URL Supabase peuvent être privées/signées et Mistral n'arrive pas toujours à les relire.
      // La fonction serveur récupère donc le fichier puis l'envoie à Mistral en data URL.
      const { dataUrl, contentType } = await fetchAsDataUrl(url, fileName, declaredMime);
      const isImage = contentType.startsWith('image/');
      const ocr = await mistralFetch('/v1/ocr', mistralKey, {
        model: 'mistral-ocr-latest',
        document: isImage
          ? { type: 'image_url', image_url: dataUrl }
          : { type: 'document_url', document_url: dataUrl },
        table_format: 'markdown',
        include_image_base64: false,
      }, 'ocr');
      const pages = Array.isArray(ocr?.pages) ? ocr.pages : [];
      const extractedText = pages.map((p) => p?.markdown || p?.text || '').filter(Boolean).join('\n\n').trim();
      if (!extractedText) return response.status(422).json({ error: 'Aucun contenu exploitable n’a été extrait de ce document.' });
      return response.status(200).json({ ok: true, extractedText });
    }

    if (action === 'summarize') {
      if (!groqKey) return response.status(500).json({ error: 'La clé Groq n’est pas configurée sur Vercel (GROQ_API_KEY).' });
      const rawText = String(body.text || '').replace(/\u0000/g, '').trim();
      const fileName = String(body.fileName || 'document');
      const mimeType = String(body.mimeType || '');
      if (rawText.length < 20) return response.status(400).json({ error: 'Le document ne contient pas assez de contenu exploitable.' });
      const prepared = prepareGroqText(rawText, 18000);
      const text = prepared.text;

      const prompt = `Tu analyses un document interne nommé "${fileName}" (${mimeType || 'type inconnu'}).\n` +
        `Base-toi UNIQUEMENT sur son contenu. N'invente aucune information. Adapte la synthèse au type de document : pour un tableur, décris les feuilles/tableaux, indicateurs et données saillantes ; pour une présentation, restitue les messages des diapositives ; pour un document texte, restitue sa structure et son contenu.\n` +
        `Réponds en texte simple, sans JSON, sans markdown complexe et avec EXACTEMENT ces trois marqueurs :\n` +
        `SUMMARY:\n3 à 6 phrases de synthèse.\nKEY_POINTS:\n- 3 à 8 points clés, un par ligne.\nACTIONS:\n- uniquement les actions, décisions ou échéances explicitement présentes ; écris "Aucune" s'il n'y en a pas.${prepared.truncated ? `\nLe document est long : le contenu fourni contient des extraits répartis dans le début, le milieu et la fin. Ne prétends pas couvrir des éléments absents des extraits.` : ''}\n\nCONTENU :\n${text}`;

      const completion = await groqFetch('/v1/chat/completions', groqKey, {
        model: await chooseGroqModel(groqKey),
        messages: [
          { role: 'system', content: 'Tu produis une synthèse fidèle du document. Respecte les marqueurs SUMMARY:, KEY_POINTS: et ACTIONS:. Ne produis pas de JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0,
        max_tokens: 900,
      }, 'summary');
      const parsed = parseStructuredSummary(completion?.choices?.[0]?.message?.content);
      if (!parsed?.summary) return response.status(502).json({ error: 'Groq n’a renvoyé aucun contenu de synthèse exploitable. Réessayez.' });
      return response.status(200).json({
        ok: true,
        summary: String(parsed.summary || ''),
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
        actions: Array.isArray(parsed.actions) ? parsed.actions.map(String) : [],
      });
    }

    return response.status(400).json({ error: 'Action d’analyse inconnue.' });
  } catch (error) {
    console.error('Document AI error:', {
      message: String(error?.message || error),
      status: error?.status || 500,
      provider: error?.provider || 'server',
      stage: error?.stage || 'server',
      requestId: error?.requestId || null,
      providerBody: error?.providerBody || null,
      rateLimit: error?.rateLimit || null,
    });
    return response.status(Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500)
      .json({ error: friendlyError(error) });
  }
}
