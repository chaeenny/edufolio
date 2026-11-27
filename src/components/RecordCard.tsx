import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Paperclip,
  History,
  UploadCloud,
  Pin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Plus,
} from 'lucide-react';
import { AttachmentItem, CategoryItem, EduRecord } from '../types/edufolio';
import { COLOR_PALETTE, DynamicIcon } from '../utils/uiTheme';
import { resolveAttachmentUrl, uploadFileAttachment } from '../services/storageManager';
import { MultiLinkList } from './MultiLinkManager';

interface RecordCardProps {
  record: EduRecord;
  category: CategoryItem;
  onSelect: () => void;
  onQuickUpdate: () => void;
  onUpdateRecord: (updated: EduRecord) => Promise<void>;
  onPreviewAttachment: (attachments: AttachmentItem[], index: number) => void;
}

export function RecordCard({
  record,
  category,
  onSelect,
  onQuickUpdate,
  onUpdateRecord,
  onPreviewAttachment,
}: RecordCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [heroThumb, setHeroThumb] = useState<string | null>(null);

  const pal = COLOR_PALETTE[category?.color || 'indigo'];
  const templateType = category?.templateType || 'custom';
  const latestVersion = record.versionHistory?.[0]?.version || 'v1.0';

  useEffect(() => {
    let active = true;
    async function loadHero() {
      const firstImg = record.attachments.find((a) =>
        a.mimeType.startsWith('image/')
      );
      if (!firstImg) {
        if (active) setHeroThumb(null);
        return;
      }
      if (firstImg.previewDataUrl) {
        if (active) setHeroThumb(firstImg.previewDataUrl);
        return;
      }
      const url = await resolveAttachmentUrl(firstImg);
      if (active) setHeroThumb(url || null);
    }
    loadHero();
    return () => {
      active = false;
    };
  }, [record.attachments]);

  const handleCardDrop = async (fileList: FileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploaded: AttachmentItem[] = [];
    for (const file of files) {
      const att = await uploadFileAttachment(
        file,
        templateType === 'lab'
          ? '실험성공'
          : templateType === 'training'
          ? '이수증'
          : '활동지'
      );
      uploaded.push(att);
    }

    const updated: EduRecord = {
      ...record,
      attachments: [...record.attachments, ...uploaded],
      updatedAt: new Date().toISOString(),
    };
    await onUpdateRecord(updated);
    setIsUploading(false);
  };

  const successCount = record.attachments.filter((a) => a.tag === '실험성공').length;
  const failCount = record.attachments.filter((a) => a.tag === '실험실패').length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await handleCardDrop(e.dataTransfer.files);
        }
      }}
      onClick={onSelect}
      className={`group relative rounded-2xl bg-white transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${
        isDragOver
          ? 'border-2 border-dashed border-indigo-600 ring-4 ring-indigo-500/15 scale-[1.01] shadow-xl'
          : 'border border-slate-200/90 hover:border-indigo-300 hover:shadow-lg'
      }`}
    >
      {/* Drag-and-Drop Overlay directly on Card */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-indigo-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-2.5 animate-bounce">
            <UploadCloud className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-bold">여기에 파일을 놓아 바로 첨부하세요</p>
        </div>
      )}

      {/* Optional Thumbnail Header */}
      {heroThumb && (
        <div className="relative h-40 w-full bg-slate-900 overflow-hidden border-b border-slate-100">
          <img
            src={heroThumb}
            alt={record.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-1.5">
              {successCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> 성공 {successCount}
                </span>
              )}
              {failCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[11px] font-semibold">
                  <AlertTriangle className="w-3 h-3" /> 시행착오 {failCount}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewAttachment(record.attachments, 0);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/75 hover:bg-indigo-600 backdrop-blur-xs text-[11px] font-semibold transition"
            >
              <Eye className="w-3 h-3" /> 미리보기
            </button>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Top Meta Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${pal.badge}`}
              >
                <DynamicIcon name={category?.icon || 'Folder'} className="w-3.5 h-3.5" />
                {category?.name}
              </span>

              {templateType === 'lab' && record.payload.stage && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                  {record.payload.stage}
                </span>
              )}

              {templateType === 'training' && record.payload.hours > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                  <Clock className="w-3 h-3" /> {record.payload.trainingDivision || '직무연수'} · {record.payload.hours}h
                </span>
              )}

              {templateType === 'plc' && record.payload.groupName && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] truncate max-w-[160px]">
                  {record.payload.groupName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {record.pinned && (
                <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              )}
              <span className="text-xs text-slate-400 font-medium">{record.date}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-[15px] sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
            {record.title}
          </h3>

          {/* Summary */}
          {record.summary && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {record.summary}
            </p>
          )}
        </div>

        {/* Footer: Links + Attachments & Version */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          {record.links?.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <MultiLinkList links={record.links.slice(0, 2)} compact />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3 font-medium">
              <span className="inline-flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                파일 {record.attachments.length}
              </span>
              <span className="inline-flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-slate-400" />
                {latestVersion}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickUpdate();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" /> 업데이트
            </button>
          </div>

          {isUploading && (
            <div className="text-[11px] font-bold text-indigo-600 animate-pulse text-center">
              파일 첨부 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
