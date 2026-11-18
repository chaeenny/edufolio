import React, { useEffect, useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Film,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Download,
  Eye,
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FolderArchive,
} from 'lucide-react';
import { AttachmentItem } from '../types/edufolio';
import { resolveAttachmentUrl, uploadFileAttachment } from '../services/storageManager';
import { formatBytes } from '../data/sampleData';

interface SmartDropzoneProps {
  attachments: AttachmentItem[];
  onChange: (next: AttachmentItem[]) => void;
  onPreview: (index: number) => void;
  defaultTag?: AttachmentItem['tag'];
  showExperimentTags?: boolean;
  compact?: boolean;
}

const TAG_OPTIONS: { value: NonNullable<AttachmentItem['tag']>; label: string; color: string }[] = [
  { value: '일반', label: '일반 자료', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: '실험성공', label: '✓ 실험 성공', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: '실험실패', label: '✕ 시행착오/실패', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: '이수증', label: '이수증/확인서', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: '활동지', label: '활동지/산출물', color: 'bg-amber-50 text-amber-800 border-amber-200' },
];

export function SmartDropzone({
  attachments,
  onChange,
  onPreview,
  defaultTag = '일반',
  showExperimentTags = false,
  compact = false,
}: SmartDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
  const [selectedTag, setSelectedTag] = useState<AttachmentItem['tag']>(defaultTag);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [thumbMap, setThumbMap] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadThumbs() {
      const nextMap: Record<string, string> = {};
      for (const att of attachments) {
        if (att.previewDataUrl) {
          nextMap[att.id] = att.previewDataUrl;
        } else if (att.mimeType.startsWith('image/')) {
          const url = await resolveAttachmentUrl(att);
          if (url) nextMap[att.id] = url;
        }
      }
      if (active) setThumbMap(nextMap);
    }
    loadThumbs();
    return () => {
      active = false;
    };
  }, [attachments]);

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const uploadedItems: AttachmentItem[] = [];
    for (const file of files) {
      const tempId = `up_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setUploadingFiles((prev) => [...prev, { id: tempId, name: file.name, progress: 10 }]);

      const att = await uploadFileAttachment(file, selectedTag, (pct) => {
        setUploadingFiles((prev) =>
          prev.map((u) => (u.id === tempId ? { ...u, progress: pct } : u))
        );
      });
      uploadedItems.push(att);
      setUploadingFiles((prev) => prev.filter((u) => u.id !== tempId));
    }

    onChange([...attachments, ...uploadedItems]);
  };

  const handleDownloadSingle = async (att: AttachmentItem) => {
    const url = await resolveAttachmentUrl(att);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = async () => {
    for (const att of attachments) {
      await handleDownloadSingle(att);
    }
  };

  const startRename = (att: AttachmentItem) => {
    setEditingId(att.id);
    setEditingName(att.name);
  };

  const saveRename = (id: string) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    onChange(
      attachments.map((a) => (a.id === id ? { ...a, name: editingName.trim() } : a))
    );
    setEditingId(null);
  };

  const changeTag = (id: string, tag: AttachmentItem['tag']) => {
    onChange(attachments.map((a) => (a.id === id ? { ...a, tag } : a)));
  };

  return (
    <div className="space-y-4">
      {/* Tag Pre-selector & Bulk Download */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            업로드 파일 분류 태그:
          </span>
          {TAG_OPTIONS.filter(
            (t) => showExperimentTags || (t.value !== '실험성공' && t.value !== '실험실패')
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedTag(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                selectedTag === opt.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {attachments.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <FolderArchive className="w-3.5 h-3.5" /> 전체 다운로드 ({attachments.length}개)
          </button>
        )}
      </div>

      {/* Interactive Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/90 scale-[1.01] shadow-lg ring-4 ring-indigo-500/20'
            : 'border-slate-300 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/30'
        } ${compact ? 'p-4' : 'p-6'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
              isDragging
                ? 'bg-indigo-600 text-white scale-110 animate-bounce'
                : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {isDragging
                ? '여기에 파일을 놓아 업로드하세요!'
                : '파일을 마우스로 끌어다 놓거나 클릭하여 다중 업로드'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              실험 사진(JPG/PNG/SVG), PDF 활동지, 한글(HWPX), 워드/PPTX/엑셀, 실험 영상(MP4) 지원 •{' '}
              <span className="text-indigo-600 font-semibold">
                화면 캡처 후 Ctrl+V (Cmd+V) 바로 붙여넣기 가능
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress Bars */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
          {uploadingFiles.map((u) => (
            <div key={u.id} className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-indigo-900">
                <span className="truncate">{u.name} 업로드 중...</span>
                <span>{u.progress}%</span>
              </div>
              <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                  style={{ width: `${u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Grid */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att, idx) => {
            const isImg = att.mimeType.startsWith('image/');
            const isVid = att.mimeType.startsWith('video/');
            const thumb = thumbMap[att.id];

            return (
              <div
                key={att.id}
                className="group relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition"
              >
                {/* Thumbnail or File Icon */}
                <div
                  onClick={() => onPreview(idx)}
                  className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer relative group/thumb"
                >
                  {isImg && thumb ? (
                    <img
                      src={thumb}
                      alt={att.name}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition"
                    />
                  ) : isVid ? (
                    <Film className="w-7 h-7 text-rose-500" />
                  ) : isImg ? (
                    <ImageIcon className="w-7 h-7 text-indigo-500" />
                  ) : (
                    <FileText className="w-7 h-7 text-emerald-600" />
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* File Meta & Rename & Tag Selector */}
                <div className="flex-1 min-w-0">
                  {editingId === att.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(att.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full text-xs font-medium border border-indigo-400 rounded px-2 py-1 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveRename(att.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPreview(idx)}
                      className="text-left text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 truncate block w-full"
                      title={att.name}
                    >
                      {att.name}
                    </button>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatBytes(att.size)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <select
                      value={att.tag || '일반'}
                      onChange={(e) =>
                        changeTag(att.id, e.target.value as AttachmentItem['tag'])
                      }
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer focus:outline-none ${
                        att.tag === '실험성공'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : att.tag === '실험실패'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : att.tag === '이수증'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {TAG_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreview(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    title="미리보기"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(att)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="파일명 변경"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(att)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(attachments.filter((a) => a.id !== att.id))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
