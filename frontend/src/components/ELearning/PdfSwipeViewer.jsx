import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PdfSwipeViewer = ({ document, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const canvasRef = useRef(null);

  const fileUrl = useMemo(() => {
    if (!document?._id) return null;
    const apiUrl = process.env.REACT_APP_API_URL || 'https://hrms.talentshield.co.uk';
    const token = localStorage.getItem('auth_token');
    return `${apiUrl}/api/documentManagement/documents/${document._id}/view` + (token ? `?token=${encodeURIComponent(token)}` : '');
  }, [document?._id]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!fileUrl) return;
      try {
        setLoading(true);
        setError('');
        setPdfDoc(null);
        setNumPages(0);
        setPageNumber(1);

        const loadingTask = pdfjsLib.getDocument({ url: fileUrl, withCredentials: true });
        const pdf = await loadingTask.promise;

        if (!isMounted) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load PDF');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [fileUrl]);

  useEffect(() => {
    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.6 });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        setError('Failed to render PDF page');
      }
    };

    render();
  }, [pdfDoc, pageNumber]);

  const goPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goNext = () => setPageNumber((p) => Math.min(numPages || 1, p + 1));

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  };

  if (!document) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="min-w-0">
              <div className="text-white font-semibold truncate">{document.name || document.fileName}</div>
              <div className="text-blue-100 text-sm">Page {pageNumber} of {numPages || 0}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={pageNumber <= 1 || loading}
                className="p-2 rounded-lg hover:bg-white/20 text-white disabled:opacity-50"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                disabled={pageNumber >= numPages || loading}
                className="p-2 rounded-lg hover:bg-white/20 text-white disabled:opacity-50"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 text-white"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center">
            {loading ? (
              <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading PDF...</p>
              </div>
            ) : error ? (
              <div className="text-center p-8">
                <p className="text-red-600 mb-2">{error}</p>
              </div>
            ) : (
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -120) goNext();
                  if (info.offset.x > 120) goPrev();
                }}
                className="p-4"
              >
                <canvas ref={canvasRef} className="bg-white shadow rounded" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PdfSwipeViewer;
