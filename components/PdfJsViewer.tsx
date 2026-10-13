import React, { useEffect, useRef, useState } from 'react';

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

export default PdfJsViewer;
