import React, { useEffect, useState } from 'react';
import {
  X,
  Edit3,
  Trash2,
  History,
  CheckSquare,
  Square,
  Calendar,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Clock,
  Pin,
} from 'lucide-react';
import {
  AttachmentItem,
  CategoryItem,
  EduRecord,
  LabStage,
} from '../types/edufolio';
import { COLOR_PALETTE, DynamicIcon } from '../utils/uiTheme';
import { SmartDropzone } from './SmartDropzone';
import { MultiLinkList } from './MultiLinkManager';
import { resolveAttachmentUrl, uploadFileAttachment } from '../services/storageManager';

interface RecordDetailModalProps {
  record: EduRecord;
  category: CategoryItem;
  onUpdateRecord: (updated: EduRecord) => Promise<void>;
  onEditClick: () => void;
  onQuickUpdateClick: () => void;
  onDeleteRecord: (id: string) => Promise<void>;
  onPreviewAttachment: (attachments: AttachmentItem[], index: number) => void;
  onClose: () => void;
}

const LAB_STAGES: LabStage[] = ['아이디어', '예비실험', '수정보완', '완성/수업적용'];

export function RecordDetailModal({
  record,
  category,
  onUpdateRecord,
  onEditClick,
  onQuickUpdateClick,
  onDeleteRecord,
  onPreviewAttachment,
  onClose,
}: RecordDetailModalProps) {
  const [isDraggingOverModal, setIsDraggingOverModal] = useState(false);
  const [dropUploading, setDropUploading] = useState(false);
  const [compareThumbs, setCompareThumbs] = useState<Record<string, string>>({});

  const pal = COLOR_PALETTE[category?.color || 'indigo'];
  const templateType = category?.templateType || 'custom';

  const successPhotos = record.attachments.filter((a) => a.tag === '실험성공');
  const failPhotos = record.attachments.filter((a) => a.tag === '실험실패');

  useEffect(() => {
    let active = true;
    async function loadPhotos() {
      const map: Record<string, string> = {};
      for (const att of [...successPhotos, ...failPhotos]) {
        const url = await resolveAttachmentUrl(att);
        if (url) map[att.id] = url;
      }
      if (active) setCompareThumbs(map);
    }
    loadPhotos();
    return () => {
      active = false;
    };
  }, [record.attachments]);

  // Support Ctrl+V paste directly inside the detail modal
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files.length) return;
      const files = Array.from(e.clipboardData.files);
      if (!files.length) return;
      await handleInstantDropFiles(files);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [record]);

  const handleInstantDropFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setDropUploading(true);
    const newAtts: AttachmentItem[] = [];
    for (const f of files) {
      const named =
        f.name && f.name !== 'image.png'
          ? f
          : new File(
              [f],
              `캡처첨부_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`,
              { type: f.type || 'image/png' }
            );
      const att = await uploadFileAttachment(
        named,
        templateType === 'lab'
          ? '실험성공'
          : templateType === 'training'
          ? '이수증'
          : '활동지'
      );
      newAtts.push(att);
    }
    const updated: EduRecord = {
      ...record,
      attachments: [...record.attachments, ...newAtts],
      updatedAt: new Date().toISOString(),
    };
    await onUpdateRecord(updated);
    setDropUploading(false);
  };

  const toggleChecklist = async (itemId: string) => {
    const nextList = (record.payload.materialsChecklist || []).map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    await onUpdateRecord({
      ...record,
      payload: {
        ...record.payload,
        materialsChecklist: nextList,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const changeLabStage = async (nextStage: LabStage) => {
    await onUpdateRecord({
      ...record,
      payload: {
        ...record.payload,
        stage: nextStage,
        status: nextStage,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOverModal(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.currentTarget === e.target) {
            setIsDraggingOverModal(false);
          }
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOverModal(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleInstantDropFiles(e.dataTransfer.files);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-3xl shadow-2xl border max-w-4xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col transition-all ${
          isDraggingOverModal
            ? 'border-4 border-dashed border-indigo-500 ring-8 ring-indigo-500/20'
            : 'border-slate-200'
        }`}
      >
        {/* Drag Overlay inside Detail View */}
        {isDraggingOverModal && (
          <div className="absolute inset-0 z-50 bg-indigo-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 pointer-events-none animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500 flex items-center justify-center mb-4 animate-bounce shadow-2xl">
              <UploadCloud className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-extrabold">
              여기에 파일을 놓아 이 기록에 즉시 첨부하세요!
            </h3>
            <p className="text-sm text-indigo-200 mt-2">
              실험 사진, 활동지 PDF/HWPX, 이수증 등 다중 파일이 즉시 저장 및 동기화됩니다.
            </p>
          </div>
        )}

        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-start justify-between gap-4 shrink-0">
          <div className="space-y-2 flex-1 min-w-[240px]">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${pal.badge}`}
              >
                <DynamicIcon name={category?.icon || 'Folder'} className="w-3.5 h-3.5" />
                {category?.name}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {record.date}
              </span>
              {record.pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  <Pin className="w-3.5 h-3.5" /> 상단 고정
                </span>
              )}
              {templateType === 'training' && record.payload.hours > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                  <Clock className="w-3.5 h-3.5" /> {record.payload.hours}시간 이수 ({record.payload.trainingType})
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {record.title}
            </h2>
            {record.summary && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {record.summary}
              </p>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onQuickUpdateClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition"
            >
              <History className="w-4 h-4" /> + 버전 업데이트
            </button>
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition"
            >
              <Edit3 className="w-4 h-4" /> 편집
            </button>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('이 기록을 삭제하시겠습니까?')) {
                  await onDeleteRecord(record.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {dropUploading && (
          <div className="bg-indigo-600 text-white text-xs font-bold py-2 px-6 text-center animate-pulse">
            파일을 첨부하고 실시간 스토리지에 반영하는 중입니다...
          </div>
        )}

        {/* Main Scrollable Detail Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Tags */}
          {record.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {record.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* =================================================================
              Lab & Material Dev Specialized View
             ================================================================= */}
          {templateType === 'lab' && (
            <div className="space-y-5">
              {/* Interactive Stage Pipeline Bar */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    대상 학년/단원: {record.payload.gradeSubject || '미지정'} •{' '}
                    {record.payload.unitName || '단원 미지정'}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    아래 단계를 클릭하면 개발 진행 상태가 즉시 변경됩니다.
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {LAB_STAGES.map((st, idx) => {
                    const active = (record.payload.stage || '예비실험') === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => changeLabStage(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          active
                            ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                            : 'bg-white text-slate-600 border border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        <span>{idx + 1}.</span> {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Side-by-Side Experiment Photo Comparison (Success vs Trial-and-Error) */}
              {(successPhotos.length > 0 || failPhotos.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Success Column */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        실험 성공 / 최적 조건 사진 ({successPhotos.length})
                      </h4>
                    </div>
                    {successPhotos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {successPhotos.map((att) => (
                          <div
                            key={att.id}
                            onClick={() =>
                              onPreviewAttachment(
                                record.attachments,
                                record.attachments.findIndex((a) => a.id === att.id)
                              )
                            }
                            className="cursor-pointer group rounded-xl overflow-hidden border border-emerald-200 bg-white shadow-sm"
                          >
                            {compareThumbs[att.id] && (
                              <img
                                src={compareThumbs[att.id]}
                                alt={att.name}
                                className="w-full h-44 object-cover group-hover:scale-[1.02] transition"
                              />
                            )}
                            <div className="px-3 py-1.5 text-xs font-semibold text-emerald-900 truncate">
                              {att.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        성공 사진이 아직 없습니다. 파일을 드래그하여 추가해보세요.
                      </p>
                    )}
                  </div>

                  {/* Trial-and-Error / Fail Column */}
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        예비실험 시행착오 / 실패 비교 ({failPhotos.length})
                      </h4>
                    </div>
                    {failPhotos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {failPhotos.map((att) => (
                          <div
                            key={att.id}
                            onClick={() =>
                              onPreviewAttachment(
                                record.attachments,
                                record.attachments.findIndex((a) => a.id === att.id)
                              )
                            }
                            className="cursor-pointer group rounded-xl overflow-hidden border border-rose-200 bg-white shadow-sm"
                          >
                            {compareThumbs[att.id] && (
                              <img
                                src={compareThumbs[att.id]}
                                alt={att.name}
                                className="w-full h-44 object-cover group-hover:scale-[1.02] transition"
                              />
                            )}
                            <div className="px-3 py-1.5 text-xs font-semibold text-rose-900 truncate">
                              {att.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        등록된 시행착오 사진이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Hypothesis & Materials Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800">
                    🎯 실험 목표 및 가설
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.hypothesis || '등록된 가설이 없습니다.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800">
                    🧪 준비물 · 시약 · 교구 체크리스트
                  </h4>
                  <div className="space-y-1.5">
                    {(record.payload.materialsChecklist || []).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className="w-full flex items-center gap-2 text-left text-xs sm:text-sm py-1 px-2 rounded-lg hover:bg-white transition"
                      >
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span
                          className={
                            item.checked
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 font-medium'
                          }
                        >
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Procedure & Observations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800">
                    📋 실험 절차
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.procedure || '-'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800">
                    📊 관찰 결과 및 측정 데이터
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.observationsData || '-'}
                  </p>
                </div>
              </div>

              {/* Trial & Error / Tips / Safety */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> 시행착오 노트
                  </h4>
                  <p className="text-xs sm:text-sm text-rose-950 whitespace-pre-line leading-relaxed">
                    {record.payload.trialAndErrorNotes || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-emerald-600" /> 개선 노하우 (Tip)
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-950 whitespace-pre-line leading-relaxed">
                    {record.payload.improvementTips || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-1.5">
                  <h4 className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" /> 안전 주의사항
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-950 whitespace-pre-line leading-relaxed">
                    {record.payload.safetyNotes || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              Training Specialized View
             ================================================================= */}
          {templateType === 'training' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">연수 기관</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {record.payload.institution || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold">이수 시간</span>
                  <p className="text-sm font-bold text-indigo-700 mt-0.5">
                    {record.payload.hours || 0}시간
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold">연수 형태</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {record.payload.trainingType || '원격'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-indigo-900">
                    💡 핵심 배움 요약
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.keyLearnings || '-'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-emerald-900">
                    🚀 수업 및 평가 적용 아이디어
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.classroomIdeas || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              PLC Specialized View
             ================================================================= */}
          {templateType === 'plc' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">교학공 모임명</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {record.payload.groupName || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-semibold">참여 교사</span>
                  <p className="text-sm font-bold text-emerald-800 mt-0.5">
                    {record.payload.participants || '-'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 font-semibold">공동 연구 주제</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {record.payload.topic || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-emerald-900">
                    🤝 공동 연구 및 수업 나눔 내용
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.sharedContent || '-'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    📝 회의록 및 차기 일정
                  </h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.meetingMinutes || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              Custom Category View
             ================================================================= */}
          {templateType === 'custom' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">
                    주관 기관 / 역할
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {record.payload.organizationOrRole || '-'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-violet-600 text-white text-xs font-bold">
                  {record.payload.status || '완성/수업적용'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900">주요 활동 내용</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.keyPoints || '-'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900">성과 및 성찰</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {record.payload.outcomes || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Links */}
          {record.links?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800">
                🔗 연결된 클라우드 문서 및 외부 링크 ({record.links.length})
              </h4>
              <MultiLinkList links={record.links} />
            </div>
          )}

          {/* Interactive Dropzone & Gallery inside Detail Modal */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-800">
              📎 첨부파일 아카이브 & 즉시 드래그앤드롭 추가 ({record.attachments.length}개)
            </h4>
            <SmartDropzone
              attachments={record.attachments}
              onChange={async (nextAtts) => {
                await onUpdateRecord({
                  ...record,
                  attachments: nextAtts,
                  updatedAt: new Date().toISOString(),
                });
              }}
              onPreview={(idx) => onPreviewAttachment(record.attachments, idx)}
              showExperimentTags={templateType === 'lab'}
              compact
            />
          </div>

          {/* Version History Timeline (v1.0 -> v1.1 -> v2.0) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" />
                버전 히스토리 (업데이트 타임라인)
              </h4>
              <button
                type="button"
                onClick={onQuickUpdateClick}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> + 새 버전(v1.x / v2.0) 추가
              </button>
            </div>

            <div className="relative pl-6 border-l-2 border-indigo-200 space-y-4">
              {(record.versionHistory || []).map((ver, i) => (
                <div
                  key={ver.id}
                  className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200"
                >
                  <div
                    className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-white ${
                      i === 0 ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-400'
                    }`}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                          i === 0
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ver.version}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {ver.date}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {ver.note}
                  </p>
                  {ver.links?.length > 0 && (
                    <div className="mt-2">
                      <MultiLinkList links={ver.links} compact />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
