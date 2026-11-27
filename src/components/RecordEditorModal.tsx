import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  FlaskConical,
  GraduationCap,
  Users,
  Sparkles,
  Pin,
} from 'lucide-react';
import {
  AttachmentItem,
  CategoryItem,
  ChecklistItem,
  CURRICULUM_2022_SUBJECTS,
  EduRecord,
  ExternalLinkItem,
  LabStage,
  TrainingDivision,
} from '../types/edufolio';
import { SmartDropzone } from './SmartDropzone';
import { MultiLinkEditor } from './MultiLinkManager';
import {
  getSavedPlcGroups,
  savePlcGroups,
  uploadFileAttachment,
} from '../services/storageManager';

interface RecordEditorModalProps {
  categories: CategoryItem[];
  initialCategoryId: string;
  editingRecord?: EduRecord | null;
  onSave: (record: EduRecord) => Promise<void>;
  onPreviewAttachment: (attachments: AttachmentItem[], index: number) => void;
  onClose: () => void;
}

const LAB_STAGES: LabStage[] = ['아이디어', '예비실험', '수정보완', '완성/수업적용'];

export function RecordEditorModal({
  categories,
  initialCategoryId,
  editingRecord,
  onSave,
  onPreviewAttachment,
  onClose,
}: RecordEditorModalProps) {
  const [categoryId, setCategoryId] = useState(
    editingRecord?.categoryId || initialCategoryId || 'lab'
  );
  const [title, setTitle] = useState(editingRecord?.title || '');
  const [date, setDate] = useState(
    editingRecord?.date || new Date().toISOString().slice(0, 10)
  );
  const [tagsInput, setTagsInput] = useState(
    editingRecord?.tags?.join(', ') || ''
  );
  const [summary, setSummary] = useState(editingRecord?.summary || '');
  const [pinned, setPinned] = useState(editingRecord?.pinned || false);

  // 1. Training Payload (직무연수 vs 자율연수 구분 포함)
  const [trainingDivision, setTrainingDivision] = useState<TrainingDivision>(
    editingRecord?.payload?.trainingDivision || '직무연수'
  );
  const [institution, setInstitution] = useState(
    editingRecord?.payload?.institution || ''
  );
  const [hours, setHours] = useState<number>(
    editingRecord?.payload?.hours ?? 15
  );
  const [trainingType, setTrainingType] = useState<
    '원격' | '집합' | '실습' | '혼합'
  >(editingRecord?.payload?.trainingType || '원격');
  const [keyLearnings, setKeyLearnings] = useState(
    editingRecord?.payload?.keyLearnings || ''
  );
  const [classroomIdeas, setClassroomIdeas] = useState(
    editingRecord?.payload?.classroomIdeas || ''
  );

  // 2. PLC Payload (신과람 & 추가/삭제 가능한 교학공 프리셋 선택)
  const [plcGroups, setPlcGroups] = useState<string[]>(getSavedPlcGroups());
  const [groupName, setGroupName] = useState(
    editingRecord?.payload?.groupName || getSavedPlcGroups()[0] || '신과람 (신나는 과학을 만드는 사람들)'
  );
  const [newPlcGroupName, setNewPlcGroupName] = useState('');
  const [participants, setParticipants] = useState(
    editingRecord?.payload?.participants || ''
  );
  const [topic, setTopic] = useState(editingRecord?.payload?.topic || '');
  const [sharedContent, setSharedContent] = useState(
    editingRecord?.payload?.sharedContent || ''
  );
  const [meetingMinutes, setMeetingMinutes] = useState(
    editingRecord?.payload?.meetingMinutes || ''
  );

  // 3. Lab Payload (2022 개정 교육과정 화학/통합과학/과탐실 교과 선택)
  const [gradeSubject, setGradeSubject] = useState(
    editingRecord?.payload?.gradeSubject || '화학'
  );
  const [unitName, setUnitName] = useState(
    editingRecord?.payload?.unitName || ''
  );
  const [stage, setStage] = useState<LabStage>(
    editingRecord?.payload?.stage || '예비실험'
  );
  const [hypothesis, setHypothesis] = useState(
    editingRecord?.payload?.hypothesis || ''
  );
  const [materialsChecklist, setMaterialsChecklist] = useState<ChecklistItem[]>(
    editingRecord?.payload?.materialsChecklist || [
      { id: 'm1', text: '주요 시약 및 센서 장비 점검', checked: false },
    ]
  );
  const [newMaterialText, setNewMaterialText] = useState('');
  const [procedure, setProcedure] = useState(
    editingRecord?.payload?.procedure || ''
  );
  const [observationsData, setObservationsData] = useState(
    editingRecord?.payload?.observationsData || ''
  );
  const [trialAndErrorNotes, setTrialAndErrorNotes] = useState(
    editingRecord?.payload?.trialAndErrorNotes || ''
  );
  const [improvementTips, setImprovementTips] = useState(
    editingRecord?.payload?.improvementTips || ''
  );
  const [safetyNotes, setSafetyNotes] = useState(
    editingRecord?.payload?.safetyNotes || ''
  );

  // 4. Custom Payload
  const [organizationOrRole, setOrganizationOrRole] = useState(
    editingRecord?.payload?.organizationOrRole || ''
  );
  const [status, setStatus] = useState<LabStage>(
    editingRecord?.payload?.status || '완성/수업적용'
  );
  const [keyPoints, setKeyPoints] = useState(
    editingRecord?.payload?.keyPoints || ''
  );
  const [outcomes, setOutcomes] = useState(
    editingRecord?.payload?.outcomes || ''
  );

  // Attachments & Links
  const [attachments, setAttachments] = useState<AttachmentItem[]>(
    editingRecord?.attachments || []
  );
  const [links, setLinks] = useState<ExternalLinkItem[]>(
    editingRecord?.links || []
  );
  const [pasteToast, setPasteToast] = useState<string | null>(null);

  const selectedCategory =
    categories.find((c) => c.id === categoryId) || categories[0];
  const templateType = selectedCategory?.templateType || 'custom';

  // Support Ctrl+V / Cmd+V clipboard image/file paste directly inside the editor modal
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files.length) return;
      const files = Array.from(e.clipboardData.files);
      if (files.length === 0) return;

      setPasteToast(`클립보드에서 이미지/파일 ${files.length}개 붙여넣기 업로드 중...`);
      const uploaded: AttachmentItem[] = [];
      for (const f of files) {
        const namedFile =
          f.name && f.name !== 'image.png'
            ? f
            : new File(
                [f],
                `캡처이미지_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`,
                { type: f.type || 'image/png' }
              );
        const att = await uploadFileAttachment(
          namedFile,
          templateType === 'lab' ? '실험성공' : templateType === 'training' ? '이수증' : '일반'
        );
        uploaded.push(att);
      }
      setAttachments((prev) => [...prev, ...uploaded]);
      setPasteToast(`✓ 클립보드 파일 ${uploaded.length}개가 즉시 첨부되었습니다!`);
      setTimeout(() => setPasteToast(null), 3000);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [templateType]);

  const handleAddPlcGroup = () => {
    const trimmed = newPlcGroupName.trim();
    if (!trimmed) return;
    if (!plcGroups.includes(trimmed)) {
      const next = [...plcGroups, trimmed];
      setPlcGroups(next);
      savePlcGroups(next);
    }
    setGroupName(trimmed);
    setNewPlcGroupName('');
  };

  const handleRemovePlcGroup = (target: string) => {
    if (target.includes('신과람')) {
      alert('매년 참여하시는 기본 연구회(신과람)는 고정 항목입니다.');
      return;
    }
    const next = plcGroups.filter((g) => g !== target);
    setPlcGroups(next);
    savePlcGroups(next);
    if (groupName === target) {
      setGroupName(next[0] || '신과람 (신나는 과학을 만드는 사람들)');
    }
  };

  const handleAddChecklistItem = () => {
    if (!newMaterialText.trim()) return;
    setMaterialsChecklist([
      ...materialsChecklist,
      {
        id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        text: newMaterialText.trim(),
        checked: false,
      },
    ]);
    setNewMaterialText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedYear = parseInt(date.slice(0, 4), 10) || new Date().getFullYear();
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const nowIso = new Date().toISOString();
    const record: EduRecord = {
      id:
        editingRecord?.id ||
        `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      categoryId,
      title: title.trim(),
      date,
      year: parsedYear,
      tags: parsedTags,
      summary: summary.trim(),
      pinned,
      payload: {
        trainingDivision,
        institution,
        hours: Number(hours) || 0,
        trainingType,
        keyLearnings,
        classroomIdeas,
        certificateAttached: attachments.some((a) => a.tag === '이수증'),
        groupName,
        participants,
        topic,
        sharedContent,
        meetingMinutes,
        gradeSubject,
        unitName,
        stage,
        hypothesis,
        materialsChecklist,
        procedure,
        observationsData,
        trialAndErrorNotes,
        improvementTips,
        safetyNotes,
        organizationOrRole,
        status,
        keyPoints,
        outcomes,
      },
      attachments,
      links,
      versionHistory: editingRecord?.versionHistory?.length
        ? editingRecord.versionHistory
        : [
            {
              id: `ver_${Date.now()}`,
              version: 'v1.0',
              date,
              note: '최초 기록 작성 및 파일 아카이브 등록',
              attachments: [...attachments],
              links: [...links],
            },
          ],
      createdAt: editingRecord?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    await onSave(record);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {templateType === 'lab' ? (
              <FlaskConical className="w-5 h-5 text-amber-400" />
            ) : templateType === 'training' ? (
              <GraduationCap className="w-5 h-5 text-indigo-400" />
            ) : templateType === 'plc' ? (
              <Users className="w-5 h-5 text-emerald-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-rose-400" />
            )}
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {editingRecord ? '아카이브 기록 수정' : '새 아카이브 기록 작성'}
              </h2>
              <p className="text-xs text-slate-400">
                어디서든 파일을 드래그 앤 드롭하거나 화면 캡처 후 Ctrl+V로 즉시 첨부할 수 있습니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pasteToast && (
          <div className="bg-indigo-600 text-white text-xs font-bold px-6 py-2 text-center animate-pulse">
            {pasteToast}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto flex-1"
        >
          {/* Common Top Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                활동 카테고리 *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold focus:border-indigo-600 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                활동 일자 / 기준일 *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                  pinned
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Pin className="w-3.5 h-3.5" />
                {pinned ? '상단 고정됨 ★' : '상단 고정하기'}
              </button>
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                제목 (연수명 / 연구회·교학공 주제 / 실험 자료명) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 산화·환원 SSC 한천 젤 전기분해 실험 키트 개발"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                핵심 한 줄 요약
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="카드 목록에 표시될 핵심 요약 내용을 입력하세요"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                검색 태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="예: 화학, 통합과학1, 과탐실1, MBL센서, 예비실험완료"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* ================================================================
              1. 직무·자율 연수 (Training) 특화 섹션 - 직무 vs 자율 선택 버튼 포함!
             ================================================================ */}
          {templateType === 'training' && (
            <div className="space-y-4 p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  직무·자율 연수 상세 정보
                </h3>

                {/* 직무연수 vs 자율연수 구분 토글 */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200">
                  {(['직무연수', '자율연수'] as TrainingDivision[]).map((div) => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => setTrainingDivision(div)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition ${
                        trainingDivision === div
                          ? div === '직무연수'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-indigo-50'
                      }`}
                    >
                      {div === '직무연수' ? '✓ 직무연수 (통계 합산)' : '자율연수'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    연수 기관
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="예: 서울특별시교육청융합과학교육원"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    이수 시간 (시간)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    연수 형태
                  </label>
                  <select
                    value={trainingType}
                    onChange={(e) =>
                      setTrainingType(
                        e.target.value as '원격' | '집합' | '실습' | '혼합'
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="원격">원격연수</option>
                    <option value="집합">집합연수</option>
                    <option value="실습">실험·실습연수</option>
                    <option value="혼합">혼합형(블렌디드)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  핵심 배움 요약
                </label>
                <textarea
                  rows={3}
                  value={keyLearnings}
                  onChange={(e) => setKeyLearnings(e.target.value)}
                  placeholder="연수에서 배운 핵심 내용과 인사이트를 기록하세요"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  수업 적용 아이디어
                </label>
                <textarea
                  rows={3}
                  value={classroomIdeas}
                  onChange={(e) => setClassroomIdeas(e.target.value)}
                  placeholder="실제 화학/통합과학 수업이나 실험 수행평가에 어떻게 적용할지 적어보세요"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>
            </div>
          )}

          {/* ================================================================
              2. 연구회 · 교학공 (PLC) 특화 섹션 - 신과람 고정 + 교학공 이름 추가/삭제 선택기
             ================================================================ */}
          {templateType === 'plc' && (
            <div className="space-y-4 p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                연구회(신과람) · 교사학습공동체 활동 기록
              </h3>

              {/* 연구회 / 교학공 원클릭 선택 및 추가/제거 매니저 */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    연구회 / 교학공 선택 (클릭하여 선택 · 매년 바뀌는 교학공을 추가/삭제하세요)
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700">
                    선택됨: {groupName}
                  </span>
                </div>

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-2">
                  {plcGroups.map((grp) => {
                    const isSelected = groupName === grp;
                    const isSingwaram = grp.includes('신과람');
                    return (
                      <div
                        key={grp}
                        className={`inline-flex items-center rounded-xl border text-xs font-bold transition overflow-hidden ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setGroupName(grp)}
                          className="px-3 py-1.5 text-left"
                        >
                          {isSingwaram ? `★ ${grp}` : grp}
                        </button>
                        {!isSingwaram && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlcGroup(grp);
                            }}
                            className={`px-2 py-1.5 border-l transition ${
                              isSelected
                                ? 'border-emerald-500 text-emerald-100 hover:bg-emerald-700 hover:text-white'
                                : 'border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                            title="이 교학공 이름 목록에서 제거"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new PLC group input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newPlcGroupName}
                    onChange={(e) => setNewPlcGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPlcGroup();
                      }
                    }}
                    placeholder="새 교학공/연구회 이름 추가 (예: 2026 에듀테크 화학 교학공)"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs sm:text-sm focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPlcGroup}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0"
                  >
                    + 목록에 추가
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    선택된 모임명 (직접 수정도 가능)
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    참여 교사
                  </label>
                  <input
                    type="text"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="예: 신과람 화학분과 교사 8명"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  모임 연구 주제
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 2022 개정 화학 반응의 세계 SSC 키트 공동 개발"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  공동 연구 및 수업 나눔 내용
                </label>
                <textarea
                  rows={3}
                  value={sharedContent}
                  onChange={(e) => setSharedContent(e.target.value)}
                  placeholder="선생님들과 나눈 수업 사례, 실험 팁, 피드백 내용을 기록하세요"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  회의록 및 차기 일정
                </label>
                <textarea
                  rows={3}
                  value={meetingMinutes}
                  onChange={(e) => setMeetingMinutes(e.target.value)}
                  placeholder="결정 사항, 역할 분담, 다음 모임 일정을 정리하세요"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>
            </div>
          )}

          {/* ================================================================
              3. 교육자료 개발 - 실험 중심 (2022 개정 교육과정 화학/통합과학/과탐실 버튼 선택)
             ================================================================ */}
          {templateType === 'lab' && (
            <div className="space-y-4 p-5 rounded-2xl border border-amber-200 bg-amber-50/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-amber-600" />
                  실험 중심 교육자료 개발 (2022 개정 교육과정)
                </h3>

                {/* Stage Pill Selector */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200">
                  {LAB_STAGES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStage(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        stage === st
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-amber-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2022 개정 교육과정 교과 빠른 선택 버튼 & 직접 입력 */}
              <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  2022 개정 교육과정 교과 선택 (클릭 시 즉시 선택)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CURRICULUM_2022_SUBJECTS.map((subj) => {
                    const active = gradeSubject === subj;
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setGradeSubject(subj)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          active
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                        }`}
                      >
                        {subj}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      선택된 교과명 (직접 수정/입력 가능)
                    </label>
                    <input
                      type="text"
                      value={gradeSubject}
                      onChange={(e) => setGradeSubject(e.target.value)}
                      placeholder="예: 화학, 물질과 에너지, 화학 반응의 세계"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-amber-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      단원명 / 성취기준 주제
                    </label>
                    <input
                      type="text"
                      value={unitName}
                      onChange={(e) => setUnitName(e.target.value)}
                      placeholder="예: 산화와 환원 / 엔탈피와 화학 평형"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  실험 목표 및 가설 설정
                </label>
                <textarea
                  rows={2}
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder="이 실험을 통해 검증하고자 하는 핵심 가설과 정량적 목표를 작성하세요"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>

              {/* Materials Checklist */}
              <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800">
                  준비물 · 시약 · 센서 교구 체크리스트
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMaterialText}
                    onChange={(e) => setNewMaterialText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="준비물/시약 추가 (예: 0.1M 황산나트륨 수용액, MBL pH 센서)"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shrink-0"
                  >
                    + 항목 추가
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {materialsChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setMaterialsChecklist(
                            materialsChecklist.map((m) =>
                              m.id === item.id ? { ...m, checked: !m.checked } : m
                            )
                          )
                        }
                        className="flex items-center gap-2 text-left flex-1 font-medium text-slate-700"
                      >
                        {item.checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={item.checked ? 'line-through text-slate-400' : ''}>
                          {item.text}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMaterialsChecklist(
                            materialsChecklist.filter((m) => m.id !== item.id)
                          )
                        }
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    실험 절차 (Step-by-Step)
                  </label>
                  <textarea
                    rows={4}
                    value={procedure}
                    onChange={(e) => setProcedure(e.target.value)}
                    placeholder="1. 시료 준비&#10;2. 변인 통제 조건&#10;3. 측정 및 기록 방법"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    관찰 결과 및 측정 데이터
                  </label>
                  <textarea
                    rows={4}
                    value={observationsData}
                    onChange={(e) => setObservationsData(e.target.value)}
                    placeholder="차수별 예비실험 측정값, 센서 기울기, 색변화 시간 등 정량/정성 데이터를 기록하세요"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">
                    시행착오 및 실패 원인 분석
                  </label>
                  <textarea
                    rows={3}
                    value={trialAndErrorNotes}
                    onChange={(e) => setTrialAndErrorNotes(e.target.value)}
                    placeholder="예비실험에서 겪은 실패 원인과 해결 과정을 기록하세요"
                    className="w-full rounded-xl border border-rose-200 bg-white p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    수업 성공 노하우 (개선 Tip)
                  </label>
                  <textarea
                    rows={3}
                    value={improvementTips}
                    onChange={(e) => setImprovementTips(e.target.value)}
                    placeholder="학생 실험 성공률을 높이는 결정적 꿀팁을 적어두세요"
                    className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    실험실 안전 주의사항
                  </label>
                  <textarea
                    rows={3}
                    value={safetyNotes}
                    onChange={(e) => setSafetyNotes(e.target.value)}
                    placeholder="시약 취급, 폐수 처리, 화상/유리기구 주의사항"
                    className="w-full rounded-xl border border-amber-200 bg-white p-3 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              4. 자유 확장 카테고리 (Custom) 섹션
             ================================================================ */}
          {templateType === 'custom' && (
            <div className="space-y-4 p-5 rounded-2xl border border-violet-200 bg-violet-50/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-violet-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  {selectedCategory?.name} 상세 기록
                </h3>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-violet-200">
                  {LAB_STAGES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        status === st
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-violet-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  주관 기관 / 담당 역할 / 참여 대상
                </label>
                <input
                  type="text"
                  value={organizationOrRole}
                  onChange={(e) => setOrganizationOrRole(e.target.value)}
                  placeholder="예: 과학전람회 지도교사 / 에듀테크 선도교사단 컨설턴트"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  주요 활동 내용
                </label>
                <textarea
                  rows={3}
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="주요 추진 내용과 과정을 상세히 기록하세요"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  산출물 성과 및 향후 계획
                </label>
                <textarea
                  rows={3}
                  value={outcomes}
                  onChange={(e) => setOutcomes(e.target.value)}
                  placeholder="활동 성과, 수상/발표 내역, 추후 보완할 점을 기록하세요"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                />
              </div>
            </div>
          )}

          {/* Drag & Drop File Uploader */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              첨부파일 드래그 앤 드롭 (실험 성공/실패 사진, 이수증, 활동지 PDF/HWPX, 영상 등)
            </label>
            <SmartDropzone
              attachments={attachments}
              onChange={setAttachments}
              onPreview={(idx) => onPreviewAttachment(attachments, idx)}
              defaultTag={
                templateType === 'lab'
                  ? '실험성공'
                  : templateType === 'training'
                  ? '이수증'
                  : '활동지'
              }
              showExperimentTags={templateType === 'lab'}
            />
          </div>

          {/* Multi-Link Manager */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              멀티 링크 매니저 (구글 드라이브, 노션, 캔바, 유튜브 실험 영상, 패들렛 등)
            </label>
            <MultiLinkEditor links={links} onChange={setLinks} />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              {editingRecord ? '수정 내용 저장' : '아카이브에 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
