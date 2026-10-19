import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ResourceItem, User } from '../types';
import { supabase } from '../supabaseClient';
import { canViewAudience } from '../audience';
import PdfJsViewer from './PdfJsViewer';

interface Props { currentUser: User; onOpenGames: () => void; }

const ResourcesView: React.FC<Props> = ({ currentUser, onOpenGames }) => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [documentPreview, setDocumentPreview] = useState<{ title: string; url: string } | null>(null);
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewError, setDocumentPreviewError] = useState('');

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const loadResources = async (attempt = 0) => {
      if (!supabase || !active) return;
      setLoading(true);

      // In an installed desktop PWA, Supabase can restore the persisted auth
      // session a fraction later than React mounts. learning_resources is
      // authenticated-only: wait for session restoration before querying it.
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session && attempt < 6) {
        retryTimer = setTimeout(() => void loadResources(attempt + 1), 350 * (attempt + 1));
        return;
      }

      const { data, error } = await supabase.from('learning_resources').select('*').eq('published', true).order('sort_order').order('created_at', { ascending: false });
      if (error) {
        console.warn('[Ressources] chargement impossible:', error.message);
        if (attempt < 6) {
          retryTimer = setTimeout(() => void loadResources(attempt + 1), 500 * (attempt + 1));
          return;
        }
      }
      if (active && data) setResources(data.map((r:any) => ({
        id:r.id, title:r.title, summary:r.summary || '', content:r.content || '', category:r.category || 'Général', mediaType:r.media_type || 'text', resourceUrl:r.resource_url || '', thumbnailUrl:r.thumbnail_url || '', audienceCompanies:r.audience_companies || ['ALL'], published:r.published !== false, sortOrder:r.sort_order || 0, createdAt:r.created_at, learningPath:r.learning_path || '', levelNumber:r.level_number || 1
      })).filter((r:ResourceItem) => canViewAudience(currentUser, r.audienceCompanies)));
      if (active) setLoading(false);
    };

    void loadResources();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && active) void loadResources();
    });

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      authListener?.subscription?.unsubscribe();
    };
  }, [currentUser.id, currentUser.company]);

  const categories = useMemo(() => ['Toutes', ...Array.from(new Set(resources.map(r => r.category).filter(Boolean)))], [resources]);
  const visible = useMemo(() => resources.filter(r => (category === 'Toutes' || r.category === category) && `${r.title} ${r.summary} ${r.content}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>{ const pa=(a.learningPath||'~~~~').localeCompare(b.learningPath||'~~~~','fr'); return pa!==0?pa:Number(a.levelNumber||1)-Number(b.levelNumber||1); }), [resources, category, search]);

  const typeLabel = (type:string) => type === 'video' ? 'Vidéo' : type === 'document' ? 'Document' : type === 'image' ? 'Image' : type === 'link' ? 'Lien' : 'À lire';

  const closeDocumentPreview = () => {
    if (documentPreview?.url?.startsWith('blob:')) URL.revokeObjectURL(documentPreview.url);
    setDocumentPreview(null);
    setDocumentPreviewError('');
    setDocumentPreviewLoading(false);
  };

  const openDocumentForReading = async (resource: ResourceItem) => {
    if (!resource.resourceUrl) return;
    setDocumentPreviewLoading(true);
    setDocumentPreviewError('');
    setDocumentPreview({ title: resource.title, url: '' });
    try {
      const response = await fetch(resource.resourceUrl);
      if (!response.ok) throw new Error('Impossible de charger le document.');
      const sourceBlob = await response.blob();
      const pdfBlob = new Blob([sourceBlob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);
      setDocumentPreview({ title: resource.title, url: objectUrl });
    } catch (error) {
      console.error('Lecture de la ressource impossible :', error);
      setDocumentPreviewError('Impossible d’afficher ce document dans le lecteur.');
    } finally {
      setDocumentPreviewLoading(false);
    }
  };

  useEffect(() => () => {
    if (documentPreview?.url?.startsWith('blob:')) URL.revokeObjectURL(documentPreview.url);
  }, [documentPreview?.url]);

  return <div className="max-w-6xl mx-auto p-4 md:p-8 text-left space-y-7">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-[.25em] text-green-700">Ressources & Jeux</p><h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">Ressources</h1><p className="text-slate-500 mt-2">Retrouvez les contenus utiles pour apprendre, comprendre et préparer les quiz.</p></div>
      <div className="flex rounded-2xl bg-slate-100 p-1 w-fit"><button className="px-5 py-2.5 rounded-xl bg-white shadow-sm font-black text-green-800">Ressources</button><button onClick={onOpenGames} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:text-green-800">Jeux</button></div>
    </div>
    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une ressource..." className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-green-500" />
      <select value={category} onChange={e=>setCategory(e.target.value)} className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold">{categories.map(c=><option key={c}>{c}</option>)}</select>
    </div>
    {loading ? <div className="py-16 text-center text-slate-400 font-bold">Chargement des ressources…</div> : visible.length === 0 ? <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center"><h3 className="font-black text-slate-700">Aucune ressource disponible</h3><p className="text-sm text-slate-400 mt-2">Les contenus publiés apparaîtront ici.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{visible.map(r=><article key={r.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      {(r.thumbnailUrl || (r.mediaType === 'image' && r.resourceUrl)) ? <img src={r.thumbnailUrl || r.resourceUrl} className="w-full h-40 object-cover" alt="" /> : <div className="h-32 bg-gradient-to-br from-green-50 to-slate-50 flex items-center justify-center text-4xl">{r.mediaType === 'video' ? '▶' : r.mediaType === 'document' ? '▤' : '✦'}</div>}
      <div className="p-5 flex-1 flex flex-col"><div className="flex gap-2 mb-3"><span className="text-[10px] uppercase tracking-widest font-black text-green-700 bg-green-50 px-2.5 py-1 rounded-full">{r.category}</span><span className="text-[10px] uppercase tracking-widest font-black text-slate-400 px-2 py-1">{typeLabel(r.mediaType)}</span></div>{r.learningPath&&<div className="mb-2 flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">{r.learningPath}</span><span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">Niveau {r.levelNumber||1}</span></div>}<h2 className="text-xl font-black text-slate-900">{r.title}</h2>{r.summary && <p className="text-sm text-slate-500 mt-2">{r.summary}</p>}{r.content && <p className="text-sm text-slate-700 mt-4 whitespace-pre-line line-clamp-5">{r.content}</p>}{r.resourceUrl && (r.mediaType === 'document' ? <button type="button" onClick={() => openDocumentForReading(r)} className="mt-auto pt-5 text-sm font-black text-green-700 hover:text-green-900 text-left">Ouvrir le document →</button> : <a href={r.resourceUrl} target="_blank" rel="noreferrer" className="mt-auto pt-5 text-sm font-black text-green-700 hover:text-green-900">{r.mediaType === 'video' ? 'Voir la vidéo →' : r.mediaType === 'image' ? 'Voir l’image →' : 'Consulter →'}</a>)}{r.learningPath&&<button type="button" onClick={onOpenGames} className="mt-3 text-xs font-black text-indigo-700 text-left">Passer au quiz du parcours →</button>}</div></article>)}</div>}

    {documentPreview && createPortal(
      <div className="fixed inset-0 z-[9999] bg-black/70 p-3 md:p-6 flex items-center justify-center" onClick={closeDocumentPreview}>
        <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
            <div className="min-w-0"><h2 className="font-black text-slate-900 truncate">{documentPreview.title}</h2><p className="text-xs text-slate-400 mt-1">Lecture du document</p></div>
            <button type="button" onClick={closeDocumentPreview} className="text-3xl leading-none text-slate-400 hover:text-slate-700 shrink-0" aria-label="Fermer">×</button>
          </div>
          <div className="flex-1 min-h-0 bg-slate-100">
            {documentPreviewLoading ? <div className="h-full flex items-center justify-center text-slate-500 font-bold">Chargement du document…</div> : documentPreviewError ? <div className="h-full flex items-center justify-center p-8 text-center text-slate-600 font-bold">{documentPreviewError}</div> : documentPreview.url ? <PdfJsViewer source={documentPreview.url} fileName={documentPreview.title} onDownload={() => window.open(documentPreview.url, '_blank', 'noopener,noreferrer')} /> : null}
          </div>
        </div>
      </div>,
      document.body
    )}
  </div>;
};
export default ResourcesView;
