
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Inconnue';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return 'Date invalide'; }
  };

  // --- LOGIQUE PDF ---
  const escapeHtml = (value: string | undefined) => {
    return (value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const isVideoUrl = (url: string | undefined) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url) || url.startsWith('data:video/');
  };

  const renderPdfBlock = (b: any) => {
    if (!b) return '';

    if (b.type === 'text') {
      return `
        <div class="pdf-text-block">
          ${escapeHtml(b.content).replace(/\n/g, '<br />')}
        </div>
      `;
    }

    if (b.type === 'image') {
      return b.content ? `
        <div class="pdf-media-block">
          <img src="${b.content}" />
        </div>
      ` : '';
    }

    if (b.type === 'video') {
      return `
        <div class="pdf-video-block">
          <div class="pdf-video-icon">▶</div>
          <div class="pdf-video-title">Vidéo disponible dans la newsletter en ligne</div>
          ${b.content ? `<a href="${b.content}" target="_blank" rel="noreferrer">Ouvrir la vidéo</a>` : ''}
        </div>
      `;
    }

    if (b.type === 'button') {
      return b.content ? `
        <div class="pdf-button-block">
          <a href="${b.content}" target="_blank" rel="noreferrer">${escapeHtml(b.label || 'En savoir plus')}</a>
        </div>
      ` : '';
    }

    if (b.type === 'gallery') {
      return `
        <div class="pdf-gallery-block">
          ${(b.images || []).map((img: string) => `<img src="${img}" />`).join('')}
        </div>
      `;
    }

    return '';
  };

  // --- LOGIQUE PDF ---
  const handleDownloadPDF = async () => {
    if (!readingNewsletter || isExporting) return;
    setIsExporting(true);

    const staging = document.getElementById('pdf-render-staging');
    if (!staging) {
      console.error("Staging element not found");
      setIsExporting(false);
      return;
    }

    staging.innerHTML = '';

    const container = document.createElement('div');
    container.style.width = '794px';
    container.style.background = 'white';
    container.style.color = '#0f172a';

    const html = `
      <div class="sf-pdf-export">
        <style>
          .sf-pdf-export {
            width: 794px;
            background: #ffffff;
            color: #0f172a;
            font-family: Helvetica, Arial, sans-serif;
          }

          .pdf-cover,
          .pdf-summary,
          .pdf-article {
            width: 100%;
            box-sizing: border-box;
            background: #ffffff;
          }

          .pdf-cover {
            min-height: 1122px;
            page-break-after: always;
          }

          .pdf-cover-image {
            width: 100%;
            height: 520px;
            object-fit: cover;
            display: block;
          }

          .pdf-cover-empty {
            width: 100%;
            height: 520px;
            background: #f8fafc;
          }

          .pdf-cover-content {
            padding: 70px 72px 40px;
            text-align: center;
          }

          .pdf-brand {
            color: #16a34a;
            text-transform: uppercase;
            letter-spacing: 10px;
            font-weight: 900;
            font-size: 18px;
            margin-bottom: 26px;
          }

          .pdf-cover h1 {
            font-size: 58px;
            line-height: 1.02;
            margin: 0 0 28px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: -1px;
          }

          .pdf-cover-summary {
            font-size: 23px;
            line-height: 1.45;
            color: #475569;
            font-style: italic;
            margin: 0 auto;
            max-width: 640px;
          }

          .pdf-date {
            margin-top: 72px;
            font-size: 12px;
            color: #16a34a;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
          }

          .pdf-summary {
            min-height: 1122px;
            padding: 86px 72px;
            page-break-after: always;
          }

          .pdf-summary h2 {
            font-size: 46px;
            line-height: 1;
            margin: 0 0 60px;
            font-weight: 900;
            display: inline-block;
            border-bottom: 10px solid #16a34a;
            padding-bottom: 12px;
          }

          .pdf-summary-row {
            display: flex;
            gap: 30px;
            padding: 24px 0;
            border-bottom: 1px solid #e2e8f0;
            page-break-inside: avoid;
          }

          .pdf-summary-number {
            width: 70px;
            flex: 0 0 70px;
            color: #dbe3ec;
            font-size: 46px;
            font-weight: 900;
            line-height: 1;
          }

          .pdf-summary-title {
            font-size: 25px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 8px;
            text-transform: uppercase;
          }

          .pdf-summary-text {
            font-size: 15px;
            color: #64748b;
            line-height: 1.5;
            font-style: italic;
          }

          .pdf-tag {
            display: inline-block;
            margin-top: 12px;
            padding: 5px 12px;
            background: #f0fdf4;
            border-radius: 999px;
            color: #16a34a;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .pdf-article {
            padding: 72px;
            page-break-before: always;
          }

          .pdf-article-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 18px;
            margin-bottom: 38px;
          }

          .pdf-category {
            color: #16a34a;
            font-weight: 900;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 3px;
          }

          .pdf-page-number {
            color: #cbd5e1;
            font-weight: 900;
            font-size: 12px;
          }

          .pdf-article h2 {
            font-size: 46px;
            line-height: 1.08;
            margin: 0 0 34px;
            font-weight: 900;
            letter-spacing: -1.5px;
            text-transform: uppercase;
            page-break-after: avoid;
          }

          .pdf-main-image {
            width: 100%;
            height: 320px;
            object-fit: cover;
            border-radius: 22px;
            display: block;
            margin: 0 0 34px;
            page-break-inside: avoid;
          }

          .pdf-article-summary {
            background: #f8fafc;
            border-left: 12px solid #16a34a;
            padding: 28px 32px;
            font-style: italic;
            font-size: 21px;
            color: #334155;
            margin-bottom: 34px;
            border-radius: 0 22px 22px 0;
            line-height: 1.45;
            page-break-inside: avoid;
          }

          .pdf-blocks {
            font-size: 17px;
            line-height: 1.75;
            color: #1e293b;
          }

          .pdf-text-block {
            margin: 0 0 24px;
            white-space: normal;
            page-break-inside: auto;
          }

          .pdf-media-block {
            margin: 28px 0;
            page-break-inside: avoid;
          }

          .pdf-media-block img {
            width: 100%;
            max-height: 520px;
            object-fit: contain;
            border-radius: 20px;
            display: block;
          }

          .pdf-video-block {
            background: #0f172a;
            color: #f8fafc;
            padding: 44px 32px;
            text-align: center;
            border-radius: 26px;
            margin: 30px 0;
            page-break-inside: avoid;
          }

          .pdf-video-icon {
            width: 70px;
            height: 70px;
            line-height: 70px;
            border-radius: 50%;
            margin: 0 auto 16px;
            background: rgba(255,255,255,0.16);
            font-size: 30px;
          }

          .pdf-video-title {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
          }

          .pdf-video-block a,
          .pdf-button-block a {
            display: inline-block;
            background: #14532d;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 24px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }

          .pdf-button-block {
            margin: 30px 0;
            text-align: center;
            page-break-inside: avoid;
          }

          .pdf-gallery-block {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 30px 0;
            page-break-inside: avoid;
          }

          .pdf-gallery-block img {
            width: 100%;
            height: 230px;
            object-fit: cover;
            border-radius: 18px;
            display: block;
          }

          .pdf-footer {
            margin-top: 56px;
            border-top: 2px solid #f1f5f9;
            padding-top: 28px;
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 4px;
            text-transform: uppercase;
            page-break-inside: avoid;
          }
        </style>

        <section class="pdf-cover">
          ${readingNewsletter.coverImage ? `<img src="${readingNewsletter.coverImage}" class="pdf-cover-image" />` : '<div class="pdf-cover-empty"></div>'}
          <div class="pdf-cover-content">
            <div class="pdf-brand">STAR FRUITS</div>
            <h1>${escapeHtml(readingNewsletter.title)}</h1>
            <p class="pdf-cover-summary">“${escapeHtml(readingNewsletter.summary)}”</p>
            <div class="pdf-date">ÉDITION OFFICIELLE • ${formatDate(readingNewsletter.publishedAt).toUpperCase()}</div>
          </div>
        </section>

        <section class="pdf-summary">
          <h2>AU SOMMAIRE</h2>
          ${readingNewsletter.articles.map((art, idx) => `
            <div class="pdf-summary-row">
              <div class="pdf-summary-number">${String(idx + 1).padStart(2, '0')}</div>
              <div>
                <div class="pdf-summary-title">${escapeHtml(art.title)}</div>
                <div class="pdf-summary-text">${escapeHtml(art.summary)}</div>
                ${art.category ? `<div class="pdf-tag">${escapeHtml(art.category)}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </section>

        ${readingNewsletter.articles.map((art, i) => `
          <section class="pdf-article">
            <div class="pdf-article-header">
              <div class="pdf-category">${escapeHtml(art.category)}</div>
              <div class="pdf-page-number">ARTICLE ${String(i + 1).padStart(2, '0')}</div>
            </div>
            <h2>${escapeHtml(art.title)}</h2>
            ${art.image ? `<img src="${art.image}" class="pdf-main-image" />` : ''}
            ${art.summary ? `<div class="pdf-article-summary">“${escapeHtml(art.summary)}”</div>` : ''}
            <div class="pdf-blocks">
              ${(art.blocks || []).map(renderPdfBlock).join('')}
            </div>
            <div class="pdf-footer">STAR FRUITS • CONNECTED COMM</div>
          </section>
        `).join('')}
      </div>
    `;

    container.innerHTML = html;
    staging.appendChild(container);

    const images = Array.from(container.getElementsByTagName('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve(true);
      return new Promise(resolve => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      });
    }));

    await new Promise(resolve => setTimeout(resolve, 800));

    const opt = {
      margin: 0,
      filename: `StarFruits_Newsletter_${readingNewsletter.title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'], before: '.pdf-article' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(container).save();
    } catch (e) {
      console.error("Échec génération PDF:", e);
      alert("Une erreur est survenue lors de la création du PDF. Veuillez recharger la page et réessayer.");
    } finally {
      staging.innerHTML = '';
      setIsExporting(false);
    }
  };

  const sortedNewsletters = useMemo(() => [...newsletters].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()), [newsletters]);
  const latest = sortedNewsletters[0];
  const archives = sortedNewsletters.slice(1);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Newsletter</h1>
        </div>
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
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-black">{latest.authorName.charAt(0)}</div>
                      <span className="text-sm font-bold text-slate-800">{latest.authorName}</span>
                   </div>
                   <div className="flex items-center gap-2 text-green-700 font-black uppercase text-xs tracking-widest">Lire la newsletter <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2.5" /></svg></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="py-32 text-center text-slate-300 italic border-2 border-dashed border-slate-200 rounded-[48px]">Aucune newsletter disponible.</div>
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
              <div className="bg-white px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <button onClick={() => readingArticle ? setReadingArticle(null) : setReadingNewsletter(null)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg></button>
                   <div>
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
                            <div className="p-8">
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
                        <div className="absolute bottom-12 left-12 right-12 max-w-4xl mx-auto">
                           <span className="bg-green-600 text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">{readingArticle.category}</span>
                           <h1 className="text-5xl md:text-7xl font-black text-white mt-6 leading-tight drop-shadow-2xl">{readingArticle.title}</h1>
                        </div>
                     </div>
                     <div className="px-8 lg:px-24 py-16 max-w-4xl mx-auto space-y-12">
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
                               {block.type === 'button' && (
                                  <div className="flex justify-center">
                                     <a
                                       href={block.content}
                                       target="_blank"
                                       rel="noreferrer"
                                       className="inline-flex items-center gap-3 px-8 py-4 bg-[#14532d] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-green-800 transition-all active:scale-95"
                                     >
                                       {block.label || 'En savoir plus'}
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="3" /></svg>
                                     </a>
                                  </div>
                               )}
                               {block.type === 'gallery' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {(block.images || []).map((img, i) => (
                                       <img key={i} src={img} className="w-full rounded-[32px] shadow-xl hover:scale-105 transition-transform duration-500 cursor-pointer" alt="" />
                                     ))}
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
