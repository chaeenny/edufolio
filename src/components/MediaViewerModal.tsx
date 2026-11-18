import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  FileText,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AttachmentItem } from '../types/edufolio';
import { resolveAttachmentUrl } from '../services/storageManager';
import { formatBytes } from '../data/sampleData';

interface MediaViewerModalProps {
  attachments: AttachmentItem[];
  initialIndex: number;
  onClose: () => void;
}

export function MediaViewerModal({
  attachments,
  initialIndex,
  onClose,
}: MediaViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [zoom, setZoom] = useState(1);

  const current = attachments[currentIndex];

  useEffect(() => {
    let active = true;
    setZoom(1);
    if (current) {
      resolveAttachmentUrl(current).then((url) => {
        if (active) setResolvedUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [current]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [attachments.length, onClose]);

  if (!current) return null;

  const isImage = current.mimeType.startsWith('image/');
  const isPdf = current.mimeType === 'application/pdf' || current.name.toLowerCase().endsWith('.pdf');
  const isVideo =
    current.mimeType.startsWith('video/') ||
    /\.(mp4|webm|mov)$/i.test(current.name);

  const handleDownload = async () => {
    const url = await resolveAttachmentUrl(current);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = current.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md text-white"
      onClick={onClose}
    >
      {/* Top Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isImage ? (
            <ImageIcon className="w-5 h-5 text-indigo-400 shrink-0" />
          ) : isVideo ? (
            <Film className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm sm:text-base truncate">
                {current.name}
              </h3>
              {current.tag === '실험성공' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 실험 성공
                </span>
              )}
              {current.tag === '실험실패' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                  <AlertTriangle className="w-3.5 h-3.5" /> 시행착오/실패
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {formatBytes(current.size)} • {currentIndex + 1} / {attachments.length} •{' '}
              {current.storageMode === 'firestore' ? 'Firestore Cloud 🟢' : 'Local IndexedDB ⚡'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isImage && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                title="축소"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                title="확대"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs sm:text-sm font-medium transition"
          >
            <Download className="w-4 h-4" /> 다운로드
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition ml-2"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {attachments.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1))
            }
            className="absolute left-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-indigo-600 border border-white/15 text-white shadow-xl transition"
            title="이전 파일 (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="max-w-5xl w-full h-full flex items-center justify-center">
          {isImage && resolvedUrl ? (
            <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
              <img
                src={resolvedUrl}
                alt={current.name}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                className="max-h-[76vh] max-w-full rounded-xl shadow-2xl transition-transform duration-200 object-contain bg-slate-900/40"
              />
            </div>
          ) : isPdf && resolvedUrl ? (
            <iframe
              src={resolvedUrl}
              title={current.name}
              className="w-full h-[78vh] rounded-xl border border-white/20 bg-white"
            />
          ) : isVideo && resolvedUrl ? (
            <video
              src={resolvedUrl}
              controls
              autoPlay
              className="max-h-[78vh] max-w-full rounded-xl shadow-2xl bg-black"
            />
          ) : (
            <div className="bg-slate-900 border border-white/15 rounded-2xl p-10 text-center max-w-md space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-indigo-300" />
              </div>
              <h4 className="text-lg font-bold">{current.name}</h4>
              <p className="text-sm text-slate-400">
                한글(HWPX), 워드, 엑셀, PPT 등 오피스 문서 파일입니다. 아래 다운로드 버튼을 눌러 원본 파일로 열람하세요.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm"
              >
                <Download className="w-4 h-4" /> 원본 파일 다운로드 ({formatBytes(current.size)})
              </button>
            </div>
          )}
        </div>

        {attachments.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0))
            }
            className="absolute right-4 z-10 p-3 rounded-full bg-slate-900/80 hover:bg-indigo-600 border border-white/15 text-white shadow-xl transition"
            title="다음 파일 (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {attachments.length > 1 && (
        <div
          className="px-6 py-3 bg-slate-900/80 border-t border-white/10 flex items-center justify-center gap-2.5 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {attachments.map((att, idx) => (
            <button
              key={att.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition shrink-0 ${
                idx === currentIndex
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="truncate max-w-[140px]">{att.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
