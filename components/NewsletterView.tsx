
import React, { useState, useMemo } from 'react';
import { User, Newsletter, NewsletterArticle, UserRole } from '../types';

interface NewsletterViewProps {
  currentUser: User;
  newsletters: Newsletter[];
}

const NewsletterView: React.FC<NewsletterViewProps> = ({ 
  currentUser, 
  newsletters
}) => {
  const [readingNewsletter, setReadingNewsletter] = useState<Newsletter | null>(null);
  const [readingArticle, setReadingArticle] = useState<NewsletterArticle | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Détection si les données sont en cours de chargement ou si une erreur est probable
  // (Si l'app est lancée mais que l'array est vide alors qu'il devrait y avoir du contenu)
  const isEmpty = newsletters.length === 0;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Inconnue';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Date invalide' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return 'Date invalide'; }
  };

  const handleDownloadPDF = async () => {
    if (!readingNewsletter || isExporting) return;
    setIsExporting(true);

    const staging = document.getElementById('pdf-render-staging');
    if (!staging) {
      setIsExporting(false);
      return;
    }

    staging.innerHTML = '';
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.background = 'white';
    
    let html = `
      <div style="width: 100%; background: white; font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 0;">
        <div style="width: 100%; height: 1120px; position: relative; border-bottom: 1px solid #f1f5f9; page-break-after: always; display: flex; flex-direction: column; background: white;">
          ${readingNewsletter.coverImage ? `<img src="${readingNewsletter.coverImage}" style="width: 100%; height: 650px; object-fit: cover;" />` : '<div style="height: 500px; background: #f8fafc;"></div>'}
          <div style="padding: 60px; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div style="color: #16a34a; text-transform: uppercase; letter-spacing: 10px; font-weight: 900; font-size: 20px; margin-bottom: 20px;">STAR FRUITS</div>
            <h1 style="font-size: 64px; margin: 0 0 30px; color: #0f172a; font-weight: 900; text-transform: uppercase;">${readingNewsletter.title}</h1>
            <p style="font-size: 24px; color: #475569; font-style: italic; max-width: 600px;">"${readingNewsletter.summary}"</p>
          </div>
        </div>
        ${readingNewsletter.articles.map((art, i) => `
          <div style="width: 100%; min-height: 1120px; padding: 80px; box-sizing: border-box; page-break-after: always; background: white;">
            <h2 style="font-size: 54px; margin: 0 0 50px; color: #0f172a; font-weight: 900; text-transform: uppercase;">${art.title}</h2>
            ${art.image ? `<img src="${art.image}" style="width: 100%; height: 450px; border-radius: 30px; object-fit: cover; margin-bottom: 50px;" />` : ''}
            <div style="background: #f8fafc; border-left: 15px solid #16a34a; padding: 40px; font-size: 24px; color: #334155; margin-bottom: 50px;">"${art.summary}"</div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
    staging.appendChild(container);

    const opt = {
      margin: 0,
      filename: `Newsletter_${readingNewsletter.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(container).save();
    } finally {
      staging.innerHTML = '';
      setIsExporting(false);
    }
  };

  const sortedNewsletters = useMemo(() => {
    return [...newsletters].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [newsletters]);

  const latest = sortedNewsletters[0];
  const archives = sortedNewsletters.slice(1);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Newsletter</h1>
      </div>

      {latest ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-green-600">À la une</h2>
            <span className="text-xs font-bold text-slate-400">Publié le {formatDate(latest.publishedAt)}</span>
          </div>
          <div onClick={() => setReadingNewsletter(latest)} className="group bg-white rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="h-64 lg:h-[500px] bg-slate-100 overflow-hidden">
                {latest.coverImage && <img src={latest.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />}
              </div>
              <div className="p-12 lg:p-16 flex flex-col justify-center space-y-6">
                <h3 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">{latest.title}</h3>
                <p className="text-slate-500 text-xl italic">"{latest.summary}"</p>
                <div className="pt-8 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-black">{latest.authorName ? latest.authorName.charAt(0) : 'S'}</div>
                      <span className="text-sm font-bold text-slate-800">{latest.authorName}</span>
                   </div>
                   <div className="flex items-center gap-2 text-green-700 font-black uppercase text-xs tracking-widest">Lire la newsletter <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2.5" /></svg></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[48px] space-y-6 bg-white/50">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
          </div>
          <div>
            <p className="text-slate-500 font-bold text-lg">Aucune newsletter disponible</p>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto italic">
              Si vous voyez des erreurs 500 dans la console, veuillez vérifier les règles RLS sur votre tableau de bord Supabase.
            </p>
          </div>
        </div>
      )}

      {archives.length > 0 && (
        <section className="space-y-8">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1 border-b pb-4">Archives</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {archives.map(n => (
                <div key={n.id} onClick={() => setReadingNewsletter(n)} className="bg-white rounded-[32px] border border-slate-100 shadow-lg overflow-hidden cursor-pointer hover:-translate-y-2 transition-all">
                  <div className="h-48 bg-slate-100 overflow-hidden">{n.coverImage && <img src={n.coverImage} className="w-full h-full object-cover" alt="" />}</div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-slate-800 mb-2">{n.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 italic mb-4">"{n.summary}"</p>
                  </div>
                </div>
              ))}
           </div>
        </section>
      )}

      {readingNewsletter && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-6xl h-full md:h-[90vh] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative">
              <div className="bg-white px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <button onClick={() => readingArticle ? setReadingArticle(null) : setReadingNewsletter(null)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg></button>
                   <div className="text-left">
                     <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{readingNewsletter.title}</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Édition du {formatDate(readingNewsletter.publishedAt)}</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button onClick={handleDownloadPDF} disabled={isExporting} className="flex items-center gap-2 px-6 py-2.5 bg-[#14532d] text-white rounded-xl font-bold text-xs hover:bg-green-800 transition-all disabled:opacity-50">
                     {isExporting ? "Génération..." : "Télécharger PDF"}
                   </button>
                   <button onClick={() => setReadingNewsletter(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
                {!readingArticle ? (
                  <div className="p-8 lg:p-16 max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                      <span className="text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-full tracking-[0.2em] uppercase">Sommaire de l'édition</span>
                      <h1 className="text-4xl lg:text-6xl font-black text-slate-900">L'actualité Star Fruits</h1>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {readingNewsletter.articles.map((art, idx) => (
                         <div key={art.id} onClick={() => setReadingArticle(art)} className="group bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02]">
                            <div className="h-56 bg-slate-100 overflow-hidden relative">
                               {art.image && <img src={art.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />}
                               <div className="absolute top-6 left-6"><span className="bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-green-700 shadow-sm">{art.category}</span></div>
                            </div>
                            <div className="p-8 text-left">
                               <h3 className="text-2xl font-black text-slate-900 group-hover:text-green-700 transition-colors leading-tight mb-3">{art.title}</h3>
                               <p className="text-slate-500 line-clamp-3 text-sm italic">"{art.summary}"</p>
                               <div className="mt-6 flex items-center justify-between text-slate-300">
                                  <span className="text-[10px] font-black">ARTICLE 0{idx + 1}</span>
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="3" /></svg>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-right-8 duration-500 pb-32">
                     <div className="relative h-[500px] w-full">
                        {readingArticle.image && <img src={readingArticle.image} className="w-full h-full object-cover" alt="" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-transparent to-black/30" />
                        <div className="absolute bottom-12 left-12 right-12 max-w-4xl mx-auto text-left">
                           <span className="bg-green-600 text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">{readingArticle.category}</span>
                           <h1 className="text-5xl md:text-7xl font-black text-white mt-6 leading-tight drop-shadow-2xl">{readingArticle.title}</h1>
                        </div>
                     </div>
                     <div className="px-8 lg:px-24 py-16 max-w-4xl mx-auto space-y-12 text-left">
                        <div className="p-12 bg-white rounded-[48px] border-l-[16px] border-l-green-600 shadow-sm italic text-2xl md:text-3xl text-slate-600 leading-relaxed">"{readingArticle.summary}"</div>
                        <div className="space-y-12">
                           {readingArticle.blocks.map(block => (
                             <div key={block.id} className="animate-in fade-in duration-700">
                               {block.type === 'text' && <p className="text-xl text-slate-700 leading-relaxed whitespace-pre-wrap">{block.content}</p>}
                               {block.type === 'image' && <img src={block.content} className="w-full rounded-[40px] shadow-2xl" alt="" />}
                               {block.type === 'video' && (
                                  <div className="rounded-[40px] overflow-hidden shadow-2xl bg-black aspect-video">
                                     <video controls src={block.content} className="w-full h-full" />
                                  </div>
                               )}
                             </div>
                           ))}
                        </div>
                        <div className="pt-12 border-t border-slate-200">
                           <button onClick={() => setReadingArticle(null)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black uppercase text-xs tracking-widest transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="4" /></svg>Retour au sommaire</button>
                        </div>
                     </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterView;
