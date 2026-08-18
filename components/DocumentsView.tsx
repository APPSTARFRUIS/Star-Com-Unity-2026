import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, DocumentFile, UserRole, OrgEntity } from '../types';
import { uploadMediaToStorage } from '../storageUtils';

interface DocumentsViewProps {
  currentUser: User;
  documents: DocumentFile[];
  categories: string[];
  entities: OrgEntity[];
  onUpload: (
    name: string,
    type: string,
    size: number,
    category: string,
    data: string,
    audienceCompanies: string[]
  ) => void;
  onDelete: (id: string) => void;
}


interface PdfJsViewerProps {
  source: string;
  fileName: string;
  onDownload: () => void;
}

const PdfJsViewer: React.FC<PdfJsViewerProps> = ({ source, fileName, onDownload }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const pdfDocumentRef = useRef<any>(null);
  const [pdfJs, setPdfJs] = useState<any>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.15);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPdfJs = async () => {
      setLoading(true);
      setError('');

      try {
        const moduleUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
        const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
        const library: any = await import(/* @vite-ignore */ moduleUrl);

        library.GlobalWorkerOptions.workerSrc = workerUrl;
        if (!cancelled) setPdfJs(library);
      } catch (loadError) {
        console.error('Chargement PDF.js impossible :', loadError);
        if (!cancelled) {
          setError('Le lecteur PDF intégré n’a pas pu être chargé. Vérifiez la connexion internet.');
          setLoading(false);
        }
      }
    };

    loadPdfJs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pdfJs || !source) return;

    let cancelled = false;
    const loadingTask = pdfJs.getDocument({
      url: source,
      cMapPacked: true,
      enableXfa: true,
    });

    setLoading(true);
    setError('');
    setPageNumber(1);
    setPageCount(0);

    loadingTask.promise
      .then((pdf: any) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }

        pdfDocumentRef.current = pdf;
        setPageCount(pdf.numPages);
        setLoading(false);
      })
      .catch((pdfError: any) => {
        console.error('Ouverture PDF impossible :', pdfError);
        if (!cancelled) {
          setError('Ce PDF ne peut pas être affiché dans le lecteur intégré.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      renderTaskRef.current = null;
      loadingTask.destroy?.();
      pdfDocumentRef.current?.destroy?.();
      pdfDocumentRef.current = null;
    };
  }, [pdfJs, source]);

  useEffect(() => {
    const pdf = pdfDocumentRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || !pageCount) return;

    let cancelled = false;

    const renderPage = async () => {
      setRendering(true);
      setError('');

      try {
        renderTaskRef.current?.cancel?.();

        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale, rotation });
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Canvas indisponible.');

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, viewport.width, viewport.height);

        const renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (renderError: any) {
        if (renderError?.name !== 'RenderingCancelledException') {
          console.error('Rendu PDF impossible :', renderError);
          if (!cancelled) setError('La page du PDF n’a pas pu être affichée.');
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
    };
  }, [pageNumber, pageCount, scale, rotation]);

  const changePage = (nextPage: number) => {
    setPageNumber(Math.min(Math.max(nextPage, 1), pageCount || 1));
  };

  const changeScale = (nextScale: number) => {
    setScale(Math.min(Math.max(nextScale, 0.6), 2.5));
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-slate-200 rounded-xl overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-900 text-white">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Lecteur PDF intégré</p>
          <p className="text-sm font-semibold truncate max-w-[280px]">{fileName}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => changePage(pageNumber - 1)}
            disabled={pageNumber <= 1 || loading}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
            title="Page précédente"
          >
            ←
          </button>

          <div className="px-3 py-2 rounded-lg bg-white/10 text-sm whitespace-nowrap">
            Page {pageNumber} / {pageCount || '—'}
          </div>

          <button
            type="button"
            onClick={() => changePage(pageNumber + 1)}
            disabled={pageNumber >= pageCount || loading}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
            title="Page suivante"
          >
            →
          </button>

          <button
            type="button"
            onClick={() => changeScale(scale - 0.15)}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
            title="Dézoomer"
          >
            −
          </button>

          <span className="text-xs min-w-[46px] text-center">{Math.round(scale * 100)} %</span>

          <button
            type="button"
            onClick={() => changeScale(scale + 0.15)}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
            title="Zoomer"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => setRotation((current) => (current + 90) % 360)}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"
            title="Faire pivoter"
          >
            ↻
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-semibold"
          >
            Télécharger
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-auto p-4 md:p-6">
        {(loading || rendering) && (
          <div className="sticky top-3 z-10 mx-auto mb-3 w-fit px-4 py-2 rounded-full bg-slate-900/85 text-white text-sm shadow-lg flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {loading ? 'Ouverture du PDF…' : 'Affichage de la page…'}
          </div>
        )}

        {error ? (
          <div className="h-full min-h-[300px] flex items-center justify-center">
            <div className="max-w-md text-center bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="font-semibold text-slate-800">{error}</p>
              <button
                type="button"
                onClick={onDownload}
                className="mt-5 px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold"
              >
                Télécharger le PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="min-w-full flex justify-center">
            <canvas ref={canvasRef} className="block bg-white shadow-xl" />
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentsView: React.FC<DocumentsViewProps> = ({
  currentUser,
  documents,
  categories,
  entities,
  onUpload,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentFile | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState(categories[0] || 'Général');
  const [uploadAudience, setUploadAudience] = useState('ALL');

  const docCategoriesForFilter = useMemo(() => ['Tous', ...categories], [categories]);

  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchesCategory = selectedCategory === 'Tous' || doc.category === selectedCategory;
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const audience = doc.audienceCompanies?.length ? doc.audienceCompanies : ['Star Fruits'];
        const matchesAudience = audience.includes('ALL') || audience.some(company => company.toLocaleLowerCase('fr-FR') === (currentUser.company || '').trim().toLocaleLowerCase('fr-FR'));
        return matchesCategory && matchesSearch && matchesAudience;
      })
      .sort((a, b) => new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime());
  }, [documents, selectedCategory, searchQuery, currentUser.company]);

  const getDocumentUrl = (doc: DocumentFile) => doc.data || '';
  const isPdf = (doc: DocumentFile) => (doc.type || '').includes('pdf') || getDocumentUrl(doc).startsWith('data:application/pdf');
  const isImage = (doc: DocumentFile) => (doc.type || '').includes('image') || getDocumentUrl(doc).startsWith('data:image');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const url = await uploadMediaToStorage(file, 'documents');
      onUpload(file.name, file.type, file.size, uploadCategory, url, [uploadAudience]);
    } catch (error: any) {
      alert(error?.message || 'Erreur lors de l’upload du document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const releasePreviewUrl = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl('');
    }
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const loadDocumentBlob = async (doc: DocumentFile): Promise<string> => {
    const url = getDocumentUrl(doc);
    if (!url) throw new Error('URL du document introuvable.');

    if (url.startsWith('data:')) return url;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Impossible de charger le document (${response.status}).`);

    const blob = await response.blob();
    const expectedType = doc.type || (isPdf(doc) ? 'application/pdf' : blob.type);
    const normalizedBlob = blob.type ? blob : new Blob([blob], { type: expectedType });
    return URL.createObjectURL(normalizedBlob);
  };

  const handleViewDocument = async (doc: DocumentFile) => {
    releasePreviewUrl();
    setPreviewDocument(doc);
    setPreviewError('');
    setIsPreviewLoading(true);

    try {
      const objectUrl = await loadDocumentBlob(doc);
      setPreviewObjectUrl(objectUrl);
    } catch (error: any) {
      console.error('Erreur aperçu document:', error);
      setPreviewError(error?.message || 'Impossible de prévisualiser ce document.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleOpenDocument = async (doc: DocumentFile) => {
    const popup = window.open('', '_blank', 'noopener,noreferrer');

    try {
      const url = previewDocument?.id === doc.id && previewObjectUrl
        ? previewObjectUrl
        : await loadDocumentBlob(doc);

      if (popup) popup.location.href = url;
      else window.location.href = url;

      if (url.startsWith('blob:') && url !== previewObjectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error: any) {
      if (popup) popup.close();
      alert(error?.message || 'Impossible d’ouvrir le document.');
    }
  };

  const handleDownloadDocument = (doc: DocumentFile) => {
    const url = getDocumentUrl(doc);
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleDateString('fr-FR');
  };

  const getFileIcon = (type: string) => {
    const safeType = type || '';
    if (safeType.includes('pdf')) return '📄';
    if (safeType.includes('image')) return '🖼️';
    if (safeType.includes('video')) return '🎬';
    if (safeType.includes('spreadsheet') || safeType.includes('excel')) return '📊';
    if (safeType.includes('word') || safeType.includes('document')) return '📝';
    return '📁';
  };

  const previewUrl = previewObjectUrl || (previewDocument && getDocumentUrl(previewDocument).startsWith('data:')
    ? getDocumentUrl(previewDocument)
    : '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {docCategoriesForFilter.map((category) => {
              const count = category === 'Tous' ? documents.length : documents.filter((d) => d.category === category).length;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                    selectedCategory === category ? 'bg-green-800 text-white' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{category}</span>
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <h3 className="font-semibold text-slate-700">Ajouter un fichier</h3>

              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select value={uploadAudience} onChange={e=>setUploadAudience(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                <option value="ALL">Commun à tous</option>
                {entities.filter(e=>e.active).map(e=><option key={e.id} value={e.name}>{e.name} uniquement</option>)}
              </select>

              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-60"
              >
                {isUploading ? 'Téléversement...' : 'Téléverser'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-left text-sm text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4">Taille</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{getFileIcon(doc.type)}</div>
                        <div>
                          <div className="font-medium text-slate-800">{doc.name}</div>
                          <div className="text-sm text-slate-500">Par {doc.uploadedByName || '-'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">{doc.category}</span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">{formatSize(doc.size)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(doc.uploadedAt)}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" title="Prévisualiser" onClick={() => handleViewDocument(doc)} className="text-slate-500 hover:text-green-600">👁️</button>
                        <button type="button" title="Ouvrir" onClick={() => handleOpenDocument(doc)} className="text-slate-500 hover:text-blue-600">↗️</button>
                        <button type="button" title="Télécharger" onClick={() => handleDownloadDocument(doc)} className="text-slate-500 hover:text-blue-600">⬇️</button>

                        {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR) && (
                          <button type="button" title="Supprimer" onClick={() => onDelete(doc.id)} className="text-slate-500 hover:text-red-600">🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredDocs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Aucun document trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewDocument && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden relative flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="font-semibold text-slate-800">{previewDocument.name}</h2>
                <p className="text-xs text-slate-400 mt-1">Aperçu du document</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenDocument(previewDocument)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                >
                  Ouvrir dans un onglet
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDocument)}
                  className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold"
                >
                  Télécharger
                </button>
                <button
                  type="button"
                  onClick={() => {
                    releasePreviewUrl();
                    setPreviewDocument(null);
                    setPreviewError('');
                  }}
                  className="text-slate-500 hover:text-red-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="w-full flex-1 bg-slate-100 overflow-hidden flex items-center justify-center p-4">
              {isPreviewLoading ? (
                <div className="text-center space-y-4 text-slate-600">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto" />
                  <p className="font-semibold">Chargement de l’aperçu…</p>
                </div>
              ) : previewError ? (
                <div className="text-center space-y-4 text-slate-600">
                  <div className="text-5xl">⚠️</div>
                  <p className="font-semibold">{previewError}</p>
                  <button
                    type="button"
                    onClick={() => handleDownloadDocument(previewDocument)}
                    className="px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold"
                  >
                    Télécharger le fichier
                  </button>
                </div>
              ) : isPdf(previewDocument) && previewUrl ? (
                <PdfJsViewer
                  source={previewUrl}
                  fileName={previewDocument.name}
                  onDownload={() => handleDownloadDocument(previewDocument)}
                />
              ) : isImage(previewDocument) && previewUrl ? (
                <img src={previewUrl} alt={previewDocument.name} className="max-w-full max-h-full mx-auto object-contain rounded-xl" />
              ) : (
                <div className="text-center space-y-4 text-slate-600">
                  <div className="text-5xl">📁</div>
                  <p className="font-semibold">Aperçu non disponible pour ce type de fichier.</p>
                  <button
                    type="button"
                    onClick={() => handleDownloadDocument(previewDocument)}
                    className="px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold"
                  >
                    Télécharger le fichier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
