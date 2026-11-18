import React, { useState } from 'react';
import { X, History, Sparkles, Plus } from 'lucide-react';
import { AttachmentItem, EduRecord, ExternalLinkItem, VersionEntry } from '../types/edufolio';
import { SmartDropzone } from './SmartDropzone';
import { MultiLinkEditor } from './MultiLinkManager';

interface QuickUpdateModalProps {
  record: EduRecord;
  onSaveRecord: (updated: EduRecord) => Promise<void>;
  onPreviewAttachment: (attachments: AttachmentItem[], index: number) => void;
  onClose: () => void;
}

export function QuickUpdateModal({
  record,
  onSaveRecord,
  onPreviewAttachment,
  onClose,
}: QuickUpdateModalProps) {
  // Suggest next version number automatically
  const suggestNextVersion = () => {
    const latest = record.versionHistory?.[0]?.version || 'v1.0';
    const match = latest.match(/v?(\d+)\.(\d+)/i);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10) + 1;
      return `v${major}.${minor}`;
    }
    return `v1.${(record.versionHistory?.length || 0) + 1}`;
  };

  const [version, setVersion] = useState(suggestNextVersion());
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [links, setLinks] = useState<ExternalLinkItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() && attachments.length === 0 && links.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const newEntry: VersionEntry = {
      id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      version: version.trim() || 'v1.1',
      date: today,
      note:
        note.trim() ||
        `${attachments.length}개의 새 파일 및 ${links.length}개의 링크 업데이트`,
      attachments,
      links,
    };

    const updated: EduRecord = {
      ...record,
      attachments: [...attachments, ...record.attachments],
      links: [...record.links, ...links],
      versionHistory: [newEntry, ...(record.versionHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    await onSaveRecord(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="w-5 h-5 text-amber-300 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-base">⚡ 5초 빠른 버전 업데이트 (Quick Update)</h3>
              <p className="text-xs text-indigo-100 truncate">{record.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                새 버전명 *
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.2"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-indigo-700 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                변경 내역 / 재실험 한 줄 메모 *
              </label>
              <input
                type="text"
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: NaHCO₃ 농도를 0.2M로 보정하여 재실험 성공 사진 및 수정 활동지 첨부"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              업데이트된 파일 드래그 앤 드롭 (실험 사진, 수정된 활동지 PDF/HWPX 등)
            </label>
            <SmartDropzone
              attachments={attachments}
              onChange={setAttachments}
              onPreview={(idx) => onPreviewAttachment(attachments, idx)}
              showExperimentTags={record.categoryId === 'lab'}
              compact
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              추가 외부 링크 (선택)
            </label>
            <MultiLinkEditor links={links} onChange={setLinks} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" /> 타임라인에 버전 누적 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
