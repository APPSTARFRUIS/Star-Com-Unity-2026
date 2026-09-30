import { supabase } from './supabaseClient';
import * as tus from 'tus-js-client';

export const MEDIA_BUCKET = 'star-community-media';

export const sanitizeFileName = (fileName: string) => {
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? parts.pop() : '';
  const baseName = parts.join('.') || 'file';

  const cleanBase = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'file';

  const cleanExtension = (extension || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return cleanExtension ? `${cleanBase}.${cleanExtension}` : cleanBase;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const optimizeImageForUpload = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;
  if (file.size <= 2 * 1024 * 1024) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Impossible de préparer cette image.'));
      img.src = objectUrl;
    });

    const maxDimension = 1920;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.86));
    if (!blob || blob.size >= file.size) return file;

    const base = sanitizeFileName(file.name).replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const uploadMediaToStorage = async (file: File, folder = 'uploads', onProgress?: (percent: number) => void): Promise<string> => {
  if (!supabase) throw new Error('Supabase n’est pas configuré.');

  // Ne pas imposer de plafond artificiel côté interface : la limite réelle est
  // celle configurée sur le bucket Supabase. Les vidéos sont donc envoyées au
  // Storage au lieu d'être rejetées arbitrairement à 100 Mo.
  const preparedFile = await optimizeImageForUpload(file);
  const safeFolder = folder
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9-_/]+/g, '-') || 'uploads';
  const safeName = sanitizeFileName(preparedFile.name);
  const filePath = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  // Les gros fichiers (notamment les vidéos) passent par TUS : upload par morceaux,
  // reprise après coupure et progression réelle. Supabase le recommande au-delà de 6 Mo.
  if (preparedFile.size > 6 * 1024 * 1024) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) throw new Error('Session Supabase indisponible. Reconnectez-vous puis réessayez.');

    const configuredUrl = String((import.meta as any).env.VITE_SUPABASE_URL || '');
    const projectId = configuredUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1];
    if (!projectId) throw new Error('URL Supabase invalide : impossible de préparer l’upload vidéo.');

    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(preparedFile, {
        endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'false',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: MEDIA_BUCKET,
          objectName: filePath,
          contentType: preparedFile.type || 'application/octet-stream',
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: (error) => reject(error),
        onProgress: (bytesUploaded, bytesTotal) => {
          onProgress?.(Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100)));
        },
        onSuccess: () => { onProgress?.(100); resolve(); },
      });
      upload.findPreviousUploads().then(previous => {
        if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
        upload.start();
      }).catch(reject);
    });

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(filePath, preparedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: preparedFile.type || undefined,
        });

      if (!error) {
        const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
        return data.publicUrl;
      }

      const message = String(error.message || error);
      // Un timeout peut arriver après que Storage a réellement enregistré le fichier.
      if (/already exists|duplicate/i.test(message)) {
        const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
        return data.publicUrl;
      }

      lastError = error;
      const retryable = /timed out|timeout|fetch|network|502|503|504|database/i.test(message);
      if (!retryable || attempt === 3) break;
      await sleep(attempt * 900);
    } catch (error: any) {
      lastError = error;
      const message = String(error?.message || error);
      if (attempt === 3 || !/timed out|timeout|fetch|network|502|503|504|database/i.test(message)) break;
      await sleep(attempt * 900);
    }
  }

  throw new Error(`Upload impossible après 3 tentatives : ${lastError?.message || lastError || 'erreur réseau inconnue'}`);
};
