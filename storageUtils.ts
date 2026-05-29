import { supabase } from './supabaseClient';

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

export const uploadMediaToStorage = async (file: File, folder = 'uploads'): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase n’est pas configuré.');
  }

  const maxSize = 100 * 1024 * 1024; // 100 Mo
  if (file.size > maxSize) {
    throw new Error('Fichier trop lourd. Limite recommandée : 100 Mo.');
  }

  const safeFolder = folder
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9-_/]+/g, '-') || 'uploads';

  const safeName = sanitizeFileName(file.name);
  const filePath = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw new Error(`Upload impossible : ${error.message}`);
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};
