import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, DocumentFile, UserRole, OrgEntity } from '../types';
import AudienceSelector from './AudienceSelector';
import { canViewAudience } from '../audience';
import { uploadMediaToStorage } from '../storageUtils';
import { supabase } from '../supabaseClient';
import { mistralDocumentService } from '../mistralDocumentService';

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
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisDocument, setAnalysisDocument] = useState<DocumentFile | null>(null);

  const docCategoriesForFilter = useMemo(() => ['Tous', ...categories], [categories]);

  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchesCategory = selectedCategory === 'Tous' || doc.category === selectedCategory;
        const haystack = [doc.name, doc.summary || '', ...(doc.keyPoints || []), ...(doc.actions || []), doc.extractedText || ''].join(' ').toLowerCase();
        const matchesSearch = haystack.includes(searchQuery.toLowerCase());
        const matchesAudience = canViewAudience(currentUser, doc.audienceCompanies);
        return matchesCategory && matchesSearch && matchesAudience;
      })
      .sort((a, b) => new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime());
  }, [documents, selectedCategory, searchQuery, currentUser.company]);

  const getDocumentUrl = (doc: DocumentFile) => doc.data || doc.storagePath || '';
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
    let url = getDocumentUrl(doc);

    // Compatibilité anciens documents : leur base64 n'est plus téléchargé avec la liste.
    // On le demande uniquement lorsque l'utilisateur ouvre réellement le document.
    if (!url && supabase) {
      const { data: legacy, error } = await supabase
        .from('documents')
        .select('data,storage_path')
        .eq('id', doc.id)
        .maybeSingle();
      if (error) throw error;
      url = legacy?.storage_path || legacy?.data || '';
    }

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

  const handleDownloadDocument = async (doc: DocumentFile) => {
    try {
      const url = await loadDocumentBlob(doc);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (url.startsWith('blob:') && url !== previewObjectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error: any) {
      alert(error?.message || 'Impossible de télécharger le document.');
    }
  };

  const extractPdfText = async (doc: DocumentFile): Promise<string> => {
    const url = await loadDocumentBlob(doc);
    try {
      // Réutilise PDF.js déjà employé par le lecteur intégré : aucun appel OCR si le PDF contient du vrai texte.
      const moduleUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
      const workerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
      const pdfjs: any = await import(/* @vite-ignore */ moduleUrl);
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const loadingTask = pdfjs.getDocument({ url, cMapPacked: true, enableXfa: true });
      const pdf = await loadingTask.promise;
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const text = (content.items || [])
          .map((item: any) => typeof item?.str === 'string' ? item.str : '')
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (text) pages.push(`PAGE ${pageNumber}\n${text}`);
      }
      try { await pdf.destroy(); } catch {}
      return pages.join('\n\n').trim();
    } finally {
      if (url.startsWith('blob:') && url !== previewObjectUrl) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const extractSpreadsheetText = async (doc: DocumentFile): Promise<string> => {
    const url = await loadDocumentBlob(doc);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Impossible de lire le tableur.');
      const buffer = await response.arrayBuffer();
      const XLSX: any = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const chunks: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
        if (csv.trim()) chunks.push(`FEUILLE : ${sheetName}\n${csv}`);
      }
      return chunks.join('\n\n').trim();
    } finally {
      if (url.startsWith('blob:') && url !== previewObjectUrl) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const decodeOfficeXmlText = (xml: string): string => {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(xml, 'application/xml');
    if (parsed.querySelector('parsererror')) return '';
    return Array.from(parsed.getElementsByTagName('*'))
      .filter((node: any) => ['t', 'tab', 'br'].includes(String(node.localName || '').toLowerCase()))
      .map((node: any) => {
        const name = String(node.localName || '').toLowerCase();
        if (name === 'tab') return '\t';
        if (name === 'br') return '\n';
        return node.textContent || '';
      })
      .join(' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim();
  };

  const extractDocxText = async (doc: DocumentFile): Promise<string> => {
    const url = await loadDocumentBlob(doc);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Impossible de lire le document Word.');
      const buffer = await response.arrayBuffer();
      const { default: JSZip } = await import('jszip');
      const zip = await JSZip.loadAsync(buffer);
      const parts: string[] = [];
      const orderedFiles = [
        'word/document.xml',
        ...Object.keys(zip.files).filter(name => /^word\/(header|footer)\d+\.xml$/i.test(name)).sort(),
        'word/footnotes.xml',
        'word/endnotes.xml',
      ];
      for (const fileName of orderedFiles) {
        const entry = zip.file(fileName);
        if (!entry) continue;
        const text = decodeOfficeXmlText(await entry.async('string'));
        if (text) parts.push(text);
      }
      return parts.join('\n\n').trim();
    } finally {
      if (url.startsWith('blob:') && url !== previewObjectUrl) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const extractPptxText = async (doc: DocumentFile): Promise<string> => {
    const url = await loadDocumentBlob(doc);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Impossible de lire la présentation PowerPoint.');
      const buffer = await response.arrayBuffer();
      const { default: JSZip } = await import('jszip');
      const zip = await JSZip.loadAsync(buffer);
      const slideNames = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a, b) => Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0));
      const slides: string[] = [];
      for (const slideName of slideNames) {
        const entry = zip.file(slideName);
        if (!entry) continue;
        const text = decodeOfficeXmlText(await entry.async('string'));
        if (text) {
          const number = slideName.match(/slide(\d+)\.xml/i)?.[1] || '';
          slides.push(`DIAPOSITIVE ${number}\n${text}`);
        }
      }
      return slides.join('\n\n').trim();
    } finally {
      if (url.startsWith('blob:') && url !== previewObjectUrl) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const extractTextForAnalysis = async (doc: DocumentFile): Promise<string> => {
    const name = (doc.name || '').toLowerCase();
    const safeType = (doc.type || '').toLowerCase();

    // TXT / CSV / Markdown : lecture directe, sans OCR.
    if (safeType.startsWith('text/') || /\.(txt|md|csv)$/i.test(name)) {
      const url = await loadDocumentBlob(doc);
      try {
        const response = await fetch(url);
        return (await response.text()).trim();
      } finally {
        if (url.startsWith('blob:') && url !== previewObjectUrl) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }

    // Excel : extraction des feuilles et cellules dans le navigateur.
    if (/\.(xlsx|xls)$/i.test(name) || /spreadsheet|excel/i.test(safeType)) {
      return extractSpreadsheetText(doc);
    }

    // PDF : extraction locale d'abord. L'OCR Mistral n'est appelé que si le PDF est réellement scanné
    // (pas ou presque pas de texte natif). Cela évite de consommer inutilement le quota OCR.
    if (/\.pdf$/i.test(name) || /pdf/i.test(safeType)) {
      const nativeText = await extractPdfText(doc);
      if (nativeText.replace(/\s+/g, ' ').trim().length >= 80) return nativeText;

      const sourceUrl = getDocumentUrl(doc);
      if (sourceUrl && /^https?:\/\//i.test(sourceUrl)) {
        return mistralDocumentService.extractFromUrl(sourceUrl, doc.name, doc.type || '');
      }
      throw new Error('Ce PDF semble scanné et doit être retéléversé pour permettre son OCR.');
    }

    // DOCX : extraction locale du texte Open XML, sans Mistral OCR.
    if (/\.docx$/i.test(name) || /wordprocessingml/i.test(safeType)) {
      const text = await extractDocxText(doc);
      if (text.length >= 20) return text;
      throw new Error('Ce document Word ne contient pas assez de texte exploitable pour produire une synthèse.');
    }

    // PPTX : extraction locale du texte des diapositives Open XML, sans Mistral OCR.
    if (/\.pptx$/i.test(name) || /presentationml/i.test(safeType)) {
      const text = await extractPptxText(doc);
      if (text.length >= 20) return text;
      throw new Error('Cette présentation ne contient pas assez de texte exploitable pour produire une synthèse.');
    }

    // Images et anciens formats binaires .doc/.ppt : OCR documentaire Mistral en dernier recours.
    if (/\.(doc|ppt|png|jpe?g|webp|avif|gif)$/i.test(name) || /image/i.test(safeType)) {
      const sourceUrl = getDocumentUrl(doc);
      if (sourceUrl && /^https?:\/\//i.test(sourceUrl)) {
        return mistralDocumentService.extractFromUrl(sourceUrl, doc.name, doc.type || '');
      }
      throw new Error('Ce document ancien doit être retéléversé pour permettre son analyse multiformat.');
    }

    throw new Error('Ce format de fichier n’est pas encore pris en charge par l’analyse.');
  };

  const handleAnalyzeDocument = async (doc: DocumentFile) => {
    if (!supabase || analyzingId) return;
    setAnalyzingId(doc.id);
    try {
      const extractedText = await extractTextForAnalysis(doc);
      if (extractedText.length < 20) throw new Error('Le document ne contient pas assez de contenu exploitable pour produire une synthèse.');
      const analysis = await mistralDocumentService.summarizeText(extractedText, doc.name, doc.type || '');
      const analyzedAt = new Date().toISOString();
      const storedText = extractedText.slice(0, 250000);
      const { error } = await supabase.from('documents').update({
        summary: analysis.summary,
        key_points: analysis.keyPoints,
        actions: analysis.actions,
        extracted_text: storedText,
        analyzed_at: analyzedAt,
      }).eq('id', doc.id);
      if (error) throw error;
      Object.assign(doc, { ...analysis, extractedText: storedText, analyzedAt });
      setAnalysisDocument({ ...doc });
    } catch (error: any) {
      console.error('Analyse document:', error);
      alert(error?.message || 'Impossible d’analyser ce document pour le moment.');
    } finally {
      setAnalyzingId(null);
    }
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
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

              <AudienceSelector
                currentUser={currentUser}
                entities={entities}
                value={uploadAudience}
                onChange={setUploadAudience}
                label="Audience du document"
              />

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
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <input
              type="text"
              placeholder="Rechercher dans les noms, résumés et contenus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full min-w-[760px]">
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
                        {doc.summary ? (
                          <button type="button" title="Voir le résumé" onClick={() => setAnalysisDocument(doc)} className="text-slate-500 hover:text-violet-700">✨</button>
                        ) : (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR || doc.uploadedBy === currentUser.id) ? (
                          <button type="button" title="Analyser et résumer" disabled={analyzingId === doc.id} onClick={() => handleAnalyzeDocument(doc)} className="text-slate-500 hover:text-violet-700 disabled:opacity-40">{analyzingId === doc.id ? '…' : '✦'}</button>
                        ) : null}

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

      {analysisDocument && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto p-7 relative">
            <button type="button" onClick={() => setAnalysisDocument(null)} className="absolute right-5 top-4 text-2xl text-slate-400 hover:text-slate-700">×</button>
            <p className="text-xs font-black uppercase tracking-widest text-violet-600 mb-2">Synthèse du document</p>
            <h2 className="text-2xl font-black text-slate-900 pr-10">{analysisDocument.name}</h2>
            {analysisDocument.analyzedAt && <p className="text-xs text-slate-400 mt-1">Analysé le {formatDate(analysisDocument.analyzedAt)}</p>}
            <section className="mt-6"><h3 className="font-black text-slate-800 mb-2">Résumé</h3><p className="text-slate-600 leading-relaxed whitespace-pre-line">{analysisDocument.summary}</p></section>
            <section className="mt-6"><h3 className="font-black text-slate-800 mb-2">Points clés</h3><ul className="space-y-2">{(analysisDocument.keyPoints || []).map((x,i)=><li key={i} className="flex gap-2 text-slate-600"><span>•</span><span>{x}</span></li>)}</ul></section>
            <section className="mt-6"><h3 className="font-black text-slate-800 mb-2">Échéances / actions</h3>{(analysisDocument.actions || []).length ? <ul className="space-y-2">{analysisDocument.actions!.map((x,i)=><li key={i} className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-slate-700">{x}</li>)}</ul> : <p className="text-slate-500">Aucune échéance ou action explicite détectée.</p>}</section>
            <p className="mt-7 text-xs text-slate-400">Synthèse générée à partir du texte du document. Consultez le document original pour toute décision importante.</p>
          </div>
        </div>
      )}

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
