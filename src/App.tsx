import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Cloud,
  RefreshCw,
  HardDrive,
  Plus,
  Search,
  LayoutDashboard,
  LayoutGrid,
  Table as TableIcon,
  Columns3,
  UploadCloud,
  FlaskConical,
  GraduationCap,
  Paperclip,
  Settings,
  Edit3,
  FolderPlus,
  Sparkles,
  Calendar,
  ExternalLink,
  Eye,
  FolderOpen,
} from 'lucide-react';
import {
  AttachmentItem,
  CategoryItem,
  CloudConfig,
  EduRecord,
  LabStage,
  SyncStatus,
  ViewMode,
} from './types/edufolio';
import { DEFAULT_CATEGORIES, INITIAL_SAMPLE_RECORDS, formatBytes } from './data/sampleData';
import {
  deleteCategoryFromCloud,
  deleteLocalCategory,
  deleteLocalRecord,
  deleteRecordFromCloud,
  getAllLocalCategories,
  getAllLocalRecords,
  getCloudConfig,
  saveCloudConfig,
  saveLocalCategory,
  saveLocalRecord,
  subscribeToFirestoreRealtime,
  syncCategoryToCloud,
  syncRecordToCloud,
  uploadFileAttachment,
} from './services/storageManager';
import { COLOR_PALETTE, DynamicIcon } from './utils/uiTheme';
import { RecordCard } from './components/RecordCard';
import { RecordEditorModal } from './components/RecordEditorModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { QuickUpdateModal } from './components/QuickUpdateModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { CloudSettingsModal } from './components/CloudSettingsModal';
import { MediaViewerModal } from './components/MediaViewerModal';
import { ExportBackupBar } from './components/ExportBackupBar';

const LAB_STAGES: LabStage[] = ['아이디어', '예비실험', '수정보완', '완성/수업적용'];

export function App() {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [records, setRecords] = useState<EduRecord[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Cloud & Realtime Sync state
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(getCloudConfig());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [realtimeBanner, setRealtimeBanner] = useState<string | null>(null);

  // Modals
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EduRecord | null>(null);

  const [activeDetailRecordId, setActiveDetailRecordId] = useState<string | null>(null);
  const [quickUpdateRecord, setQuickUpdateRecord] = useState<EduRecord | null>(null);

  // Media Lightbox / PDF / Video Viewer
  const [viewerState, setViewerState] = useState<{
    attachments: AttachmentItem[];
    index: number;
  } | null>(null);

  // Global Window Drag-and-Drop
  const [globalDragOverlay, setGlobalDragOverlay] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDetailRecord = useMemo(
    () => records.find((r) => r.id === activeDetailRecordId) || null,
    [records, activeDetailRecordId]
  );

  // Load initial data from IndexedDB (and seed sample records on first visit)
  const loadFromStorage = useCallback(async () => {
    let localCats = await getAllLocalCategories();
    if (localCats.length === 0) {
      for (const c of DEFAULT_CATEGORIES) {
        await saveLocalCategory(c);
      }
      localCats = DEFAULT_CATEGORIES;
    }
    setCategories(localCats);

    let localRecs = await getAllLocalRecords();
    const seededFlag = localStorage.getItem('edufolio_seeded_v1');
    if (localRecs.length === 0 && !seededFlag) {
      for (const r of INITIAL_SAMPLE_RECORDS) {
        await saveLocalRecord(r);
      }
      localStorage.setItem('edufolio_seeded_v1', 'true');
      localRecs = await getAllLocalRecords();
    }
    setRecords(localRecs);
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Setup Firebase Firestore Realtime Subscription (onSnapshot) when Cloud Config is active
  useEffect(() => {
    if (
      !cloudConfig.enabled ||
      !cloudConfig.apiKey ||
      !cloudConfig.projectId ||
      !cloudConfig.secretKey
    ) {
      setSyncStatus('local');
      return;
    }

    const unsubscribe = subscribeToFirestoreRealtime(cloudConfig, {
      onRecordsUpdated: async () => {
        await loadFromStorage();
      },
      onCategoriesUpdated: async () => {
        await loadFromStorage();
      },
      onStatusChange: (st) => {
        setSyncStatus(st);
      },
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [cloudConfig, loadFromStorage]);

  // Save or Update Record handler
  const handleSaveRecord = useCallback(
    async (record: EduRecord) => {
      if (cloudConfig.enabled) setSyncStatus('syncing');
      await saveLocalRecord(record);
      await loadFromStorage();
      if (cloudConfig.enabled) {
        const ok = await syncRecordToCloud(record);
        setSyncStatus(ok ? 'cloud' : 'error');
      }
    },
    [cloudConfig.enabled, loadFromStorage]
  );

  const handleDeleteRecord = useCallback(
    async (id: string) => {
      if (cloudConfig.enabled) setSyncStatus('syncing');
      await deleteLocalRecord(id);
      await loadFromStorage();
      if (cloudConfig.enabled) {
        const ok = await deleteRecordFromCloud(id);
        setSyncStatus(ok ? 'cloud' : 'error');
      }
    },
    [cloudConfig.enabled, loadFromStorage]
  );

  const handleSaveCategory = useCallback(
    async (cat: CategoryItem) => {
      if (cloudConfig.enabled) setSyncStatus('syncing');
      await saveLocalCategory(cat);
      await loadFromStorage();
      if (cloudConfig.enabled) {
        const ok = await syncCategoryToCloud(cat);
        setSyncStatus(ok ? 'cloud' : 'error');
      }
    },
    [cloudConfig.enabled, loadFromStorage]
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      if (cloudConfig.enabled) setSyncStatus('syncing');
      await deleteLocalCategory(id);
      if (selectedCategoryId === id) setSelectedCategoryId('all');
      await loadFromStorage();
      if (cloudConfig.enabled) {
        const ok = await deleteCategoryFromCloud(id);
        setSyncStatus(ok ? 'cloud' : 'error');
      }
    },
    [cloudConfig.enabled, loadFromStorage, selectedCategoryId]
  );

  // Global Clipboard Paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const onGlobalPaste = async (e: ClipboardEvent) => {
      if (showEditorModal || activeDetailRecordId || quickUpdateRecord) return;
      if (!e.clipboardData || !e.clipboardData.files.length) return;

      const files = Array.from(e.clipboardData.files);
      if (files.length === 0) return;

      setRealtimeBanner(`클립보드 파일 ${files.length}개를 불러오는 중...`);
      const uploaded: AttachmentItem[] = [];
      for (const f of files) {
        const named =
          f.name && f.name !== 'image.png'
            ? f
            : new File(
                [f],
                `클립보드캡처_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`,
                { type: f.type || 'image/png' }
              );
        const att = await uploadFileAttachment(named, '실험성공');
        uploaded.push(att);
      }
      setRealtimeBanner(null);

      const targetCat =
        selectedCategoryId === 'all' ? 'lab' : selectedCategoryId;
      const today = new Date().toISOString().slice(0, 10);
      setEditingRecord({
        id: `rec_${Date.now()}`,
        categoryId: targetCat,
        title: `클립보드 붙여넣기 자료 (${uploaded[0]?.name || '캡처 이미지'})`,
        date: today,
        year: new Date().getFullYear(),
        tags: ['빠른첨부'],
        summary: 'Ctrl+V 클립보드 붙여넣기로 생성된 아카이브 기록입니다.',
        pinned: false,
        payload: {
          institution: '',
          hours: 0,
          trainingType: '실습',
          keyLearnings: '',
          classroomIdeas: '',
          groupName: '',
          participants: '',
          topic: '',
          sharedContent: '',
          meetingMinutes: '',
          gradeSubject: '',
          unitName: '',
          stage: '예비실험',
          hypothesis: '',
          materialsChecklist: [],
          procedure: '',
          observationsData: '',
          trialAndErrorNotes: '',
          improvementTips: '',
          safetyNotes: '',
          organizationOrRole: '',
          status: '예비실험',
          keyPoints: '',
          outcomes: '',
        },
        attachments: uploaded,
        links: [],
        versionHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setShowEditorModal(true);
    };

    window.addEventListener('paste', onGlobalPaste);
    return () => window.removeEventListener('paste', onGlobalPaste);
  }, [
    showEditorModal,
    activeDetailRecordId,
    quickUpdateRecord,
    selectedCategoryId,
  ]);

  // Global drop or Quick Dropzone handler
  const handleGlobalBackgroundDrop = async (fileList: FileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setRealtimeBanner(`드롭한 파일 ${files.length}개 처리 중...`);
    const uploaded: AttachmentItem[] = [];
    for (const f of files) {
      const att = await uploadFileAttachment(f, '실험성공');
      uploaded.push(att);
    }
    setRealtimeBanner(null);

    const targetCat = selectedCategoryId === 'all' ? 'lab' : selectedCategoryId;
    const today = new Date().toISOString().slice(0, 10);
    setEditingRecord({
      id: `rec_${Date.now()}`,
      categoryId: targetCat,
      title: `${files[0].name.replace(/\.[^/.]+$/, '')}`,
      date: today,
      year: new Date().getFullYear(),
      tags: ['드래그앤드롭'],
      summary: `${files.length}개의 첨부파일을 드래그 앤 드롭하여 생성한 기록입니다.`,
      pinned: false,
      payload: {
        institution: '',
        hours: 0,
        trainingType: '실습',
        keyLearnings: '',
        classroomIdeas: '',
        groupName: '',
        participants: '',
        topic: '',
        sharedContent: '',
        meetingMinutes: '',
        gradeSubject: '',
        unitName: '',
        stage: '예비실험',
        hypothesis: '',
        materialsChecklist: [],
        procedure: '',
        observationsData: '',
        trialAndErrorNotes: '',
        improvementTips: '',
        safetyNotes: '',
        organizationOrRole: '',
        status: '예비실험',
        keyPoints: '',
        outcomes: '',
      },
      attachments: uploaded,
      links: [],
      versionHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowEditorModal(true);
  };

  // Filtered Records & Aggregated Statistics
  const availableYears = useMemo(() => {
    const years = new Set<number>(records.map((r) => r.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (selectedCategoryId !== 'all' && rec.categoryId !== selectedCategoryId) {
        return false;
      }
      if (selectedYear !== 'all' && String(rec.year) !== selectedYear) {
        return false;
      }
      if (selectedTag !== 'all' && !(rec.tags || []).includes(selectedTag)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = rec.title.toLowerCase().includes(q);
        const inSummary = (rec.summary || '').toLowerCase().includes(q);
        const inTags = (rec.tags || []).some((t) => t.toLowerCase().includes(q));
        const inPayload = JSON.stringify(rec.payload || {})
          .toLowerCase()
          .includes(q);
        const inFiles = (rec.attachments || []).some((a) =>
          a.name.toLowerCase().includes(q)
        );
        return inTitle || inSummary || inTags || inPayload || inFiles;
      }
      return true;
    });
  }, [records, selectedCategoryId, selectedYear, selectedTag, searchQuery]);

  const stats = useMemo(() => {
    const totalTrainingHours = records
      .filter((r) => r.categoryId === 'training')
      .reduce((sum, r) => sum + (Number(r.payload?.hours) || 0), 0);
    const totalAttachments = records.reduce(
      (sum, r) => sum + (r.attachments?.length || 0),
      0
    );
    const totalStorageBytes = records.reduce(
      (sum, r) =>
        sum +
        (r.attachments || []).reduce((acc, a) => acc + (Number(a.size) || 0), 0),
      0
    );
    const completedLabs = records.filter(
      (r) => r.categoryId === 'lab' && r.payload?.stage === '완성/수업적용'
    ).length;
    const totalLabs = records.filter((r) => r.categoryId === 'lab').length;
    return {
      totalRecords: records.length,
      totalTrainingHours,
      totalAttachments,
      totalStorageBytes,
      completedLabs,
      totalLabs,
    };
  }, [records]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  return (
    <div
      onDragOver={(e) => {
        if (!showEditorModal && !activeDetailRecordId && !quickUpdateRecord) {
          e.preventDefault();
          setGlobalDragOverlay(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          setGlobalDragOverlay(false);
        }
      }}
      onDrop={async (e) => {
        if (!showEditorModal && !activeDetailRecordId && !quickUpdateRecord) {
          e.preventDefault();
          setGlobalDragOverlay(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleGlobalBackgroundDrop(e.dataTransfer.files);
          }
        }
      }}
      className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900"
    >
      {/* Hidden input for Quick Dropzone click */}
      <input
        ref={quickFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files && e.target.files.length > 0) {
            await handleGlobalBackgroundDrop(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Global Drag Banner when dragging over background */}
      {globalDragOverlay && (
        <div
          onDragLeave={() => setGlobalDragOverlay(false)}
          className="fixed inset-4 z-50 rounded-3xl border-4 border-dashed border-indigo-500 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none"
        >
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold">
            여기에 파일을 놓아 업로드하세요
          </h2>
          <p className="text-sm text-indigo-200 mt-1.5">
            카드 위에 놓으면 해당 기록에 첨부되고, 빈 곳에 놓으면 새 기록이 작성됩니다.
          </p>
        </div>
      )}

      {/* Realtime Notification Toast */}
      {realtimeBanner && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{realtimeBanner}</span>
        </div>
      )}

      {/* =====================================================================
          Clean Top Navigation Header
         ===================================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
              EduFolio <span className="text-indigo-600">Cloud</span>
            </span>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="연수명, 실험 키워드, 파일명 검색..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-indigo-500 text-xs sm:text-sm focus:outline-none transition"
              />
            </div>
          </div>

          {/* Right Sync Status Badge + New Record CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCloudModal(true)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                syncStatus === 'cloud'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : syncStatus === 'syncing'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  : syncStatus === 'error'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="클라우드 연동 설정"
            >
              {syncStatus === 'cloud' && <span>Cloud Synced 🟢</span>}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>동기화 중... 🔄</span>
                </>
              )}
              {syncStatus === 'local' && <span>로컬 저장 모드 ⚪</span>}
              {syncStatus === 'error' && <span>연동 점검 필요 ⚠️</span>}
              <Settings className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setShowEditorModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>새 기록 작성</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          Main Workspace Layout (Clean Sidebar + Focused Content Area)
         ===================================================================== */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Only Categories & Simple Quick Drop */}
        <aside className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-bold text-slate-400">카테고리</span>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500"
              >
                <FolderPlus className="w-3.5 h-3.5" /> 추가
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                  selectedCategoryId === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4" /> 전체 보기
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs ${
                    selectedCategoryId === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {records.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = records.filter((r) => r.categoryId === cat.id).length;
                const active = selectedCategoryId === cat.id;
                const pal = COLOR_PALETTE[cat.color || 'indigo'];
                return (
                  <div
                    key={cat.id}
                    className={`group flex items-center justify-between rounded-xl transition ${
                      active ? `${pal.lightBg}` : 'hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-left min-w-0"
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? `${pal.bg} text-white` : `${pal.lightBg} ${pal.text}`
                        }`}
                      >
                        <DynamicIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-bold truncate ${
                          active ? pal.text : 'text-slate-700'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 pr-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                          setShowCategoryModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition"
                        title="카테고리 편집"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-slate-500">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minimal Quick Drop Box */}
          <div
            onClick={() => quickFileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                await handleGlobalBackgroundDrop(e.dataTransfer.files);
              }
            }}
            className="cursor-pointer rounded-2xl border border-dashed border-slate-300 hover:border-indigo-400 bg-white p-4 text-center space-y-1.5 transition"
          >
            <UploadCloud className="w-5 h-5 text-indigo-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              빠른 파일 업로드 (Drop / Ctrl+V)
            </p>
            <p className="text-[11px] text-slate-400">
              파일을 이곳이나 각 카드 위에 놓으세요
            </p>
          </div>
        </aside>

        {/* Main Content Column */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* =================================================================
              Essential 3-Card Dashboard Summary (Only in Dashboard View)
             ================================================================= */}
          {viewMode === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">전체 기록 · 파일</div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {stats.totalRecords}건{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      (파일 {stats.totalAttachments}개)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">누적 연수 이수시간</div>
                  <div className="text-lg font-extrabold text-indigo-600">
                    {stats.totalTrainingHours}시간
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500">실험 교육자료 개발</div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {stats.completedLabs}건 완성{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      / 총 {stats.totalLabs}건
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              View Switcher + Year Filter + Export/Backup Control Bar
             ================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 flex flex-wrap items-center justify-between gap-3">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> 대시보드
              </button>
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'gallery'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> 카드 뷰
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> 테이블 뷰
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" /> 단계별 칸반
              </button>
            </div>

            {/* Right Controls: Year Filter & Export/Backup */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">전체 연도</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}년
                  </option>
                ))}
              </select>

              <ExportBackupBar
                records={records}
                categories={categories}
                onAfterImport={loadFromStorage}
              />
            </div>
          </div>

          {/* =================================================================
              VIEW 1 & 2: Dashboard / Gallery Card View
             ================================================================= */}
          {(viewMode === 'dashboard' || viewMode === 'gallery') && (
            <>
              {filteredRecords.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
                  <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-700">
                    등록된 기록이 없습니다
                  </h3>
                  <p className="text-xs text-slate-400">
                    우측 상단의 [새 기록 작성] 버튼을 누르거나 파일을 화면에 드래그해 보세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecords.map((rec) => {
                    const cat =
                      categoryMap.get(rec.categoryId) || DEFAULT_CATEGORIES[0];
                    return (
                      <RecordCard
                        key={rec.id}
                        record={rec}
                        category={cat}
                        onSelect={() => setActiveDetailRecordId(rec.id)}
                        onQuickUpdate={() => setQuickUpdateRecord(rec)}
                        onUpdateRecord={handleSaveRecord}
                        onPreviewAttachment={(attachments, index) =>
                          setViewerState({ attachments, index })
                        }
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* =================================================================
              VIEW 3: List / Table View
             ================================================================= */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  전체 내역 ({filteredRecords.length}건)
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  연수 시간 합계:{' '}
                  {filteredRecords
                    .filter((r) => r.categoryId === 'training')
                    .reduce((acc, r) => acc + (Number(r.payload?.hours) || 0), 0)}
                  시간
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-4">카테고리</th>
                      <th className="py-3 px-4">일자</th>
                      <th className="py-3 px-4">제목</th>
                      <th className="py-3 px-4">기관 · 모임 · 단원</th>
                      <th className="py-3 px-4">시간 / 단계</th>
                      <th className="py-3 px-4">첨부</th>
                      <th className="py-3 px-4 text-right">업데이트</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm">
                    {filteredRecords.map((rec) => {
                      const cat =
                        categoryMap.get(rec.categoryId) || DEFAULT_CATEGORIES[0];
                      const pal = COLOR_PALETTE[cat.color || 'indigo'];
                      return (
                        <tr
                          key={rec.id}
                          onClick={() => setActiveDetailRecordId(rec.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              e.dataTransfer.files &&
                              e.dataTransfer.files.length > 0
                            ) {
                              const files = Array.from(e.dataTransfer.files);
                              const atts: AttachmentItem[] = [];
                              for (const f of files) {
                                atts.push(await uploadFileAttachment(f, '이수증'));
                              }
                              await handleSaveRecord({
                                ...rec,
                                attachments: [...rec.attachments, ...atts],
                                updatedAt: new Date().toISOString(),
                              });
                            }
                          }}
                          className="hover:bg-slate-50 cursor-pointer transition"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${pal.badge}`}
                            >
                              <DynamicIcon name={cat.icon} className="w-3 h-3" />
                              {cat.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                            {rec.date}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                            {rec.title}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {rec.payload.institution ||
                              rec.payload.groupName ||
                              rec.payload.gradeSubject ||
                              rec.payload.organizationOrRole ||
                              '-'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold">
                            {rec.categoryId === 'training' ? (
                              <span className="text-indigo-600">
                                {rec.payload.hours || 0}시간
                              </span>
                            ) : (
                              <span className="text-amber-700">
                                {rec.payload.stage || rec.payload.status || '완료'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                            파일 {rec.attachments.length} · 링크 {rec.links.length}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickUpdateRecord(rec);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-xs font-semibold text-slate-700 transition"
                            >
                              + 버전
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 4: Stage Kanban View
             ================================================================= */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {LAB_STAGES.map((stageName) => {
                const stageRecords = filteredRecords.filter((r) => {
                  const st = r.payload?.stage || r.payload?.status || '완성/수업적용';
                  return st === stageName;
                });

                return (
                  <div
                    key={stageName}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      const draggedRecordId = e.dataTransfer.getData('text/record-id');
                      if (draggedRecordId) {
                        e.stopPropagation();
                        const target = records.find((r) => r.id === draggedRecordId);
                        if (target) {
                          await handleSaveRecord({
                            ...target,
                            payload: {
                              ...target.payload,
                              stage: stageName,
                              status: stageName,
                            },
                            updatedAt: new Date().toISOString(),
                          });
                        }
                      }
                    }}
                    className="bg-slate-100/80 rounded-2xl p-3.5 border border-slate-200/80 flex flex-col gap-2.5 min-h-[380px]"
                  >
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-extrabold text-slate-700">
                        {stageName}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-white text-slate-600 text-xs font-bold border border-slate-200">
                        {stageRecords.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {stageRecords.map((rec) => {
                        const cat =
                          categoryMap.get(rec.categoryId) || DEFAULT_CATEGORIES[0];
                        const pal = COLOR_PALETTE[cat.color || 'indigo'];
                        return (
                          <div
                            key={rec.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/record-id', rec.id);
                            }}
                            onClick={() => setActiveDetailRecordId(rec.id)}
                            className="bg-white rounded-xl p-3.5 border border-slate-200/90 hover:border-indigo-400 cursor-pointer transition space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${pal.badge}`}
                              >
                                {cat.name}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {rec.versionHistory?.[0]?.version || 'v1.0'}
                              </span>
                            </div>

                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2">
                              {rec.title}
                            </h5>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span>{rec.date}</span>
                              <span>파일 {rec.attachments.length}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* =====================================================================
          Modals
         ===================================================================== */}
      {showCloudModal && (
        <CloudSettingsModal
          config={cloudConfig}
          syncStatus={syncStatus}
          onSaveConfig={(next) => {
            saveCloudConfig(next);
            setCloudConfig(next);
          }}
          onAfterFullSync={loadFromStorage}
          onClose={() => setShowCloudModal(false)}
        />
      )}

      {showCategoryModal && (
        <CategoryManagerModal
          categories={categories}
          editingCategory={editingCategory}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {showEditorModal && (
        <RecordEditorModal
          categories={categories}
          initialCategoryId={
            selectedCategoryId === 'all' ? 'lab' : selectedCategoryId
          }
          editingRecord={editingRecord}
          onSave={handleSaveRecord}
          onPreviewAttachment={(attachments, index) =>
            setViewerState({ attachments, index })
          }
          onClose={() => {
            setShowEditorModal(false);
            setEditingRecord(null);
          }}
        />
      )}

      {activeDetailRecord && (
        <RecordDetailModal
          record={activeDetailRecord}
          category={
            categoryMap.get(activeDetailRecord.categoryId) ||
            DEFAULT_CATEGORIES[0]
          }
          onUpdateRecord={handleSaveRecord}
          onEditClick={() => {
            setEditingRecord(activeDetailRecord);
            setActiveDetailRecordId(null);
            setShowEditorModal(true);
          }}
          onQuickUpdateClick={() => {
            setQuickUpdateRecord(activeDetailRecord);
          }}
          onDeleteRecord={handleDeleteRecord}
          onPreviewAttachment={(attachments, index) =>
            setViewerState({ attachments, index })
          }
          onClose={() => setActiveDetailRecordId(null)}
        />
      )}

      {quickUpdateRecord && (
        <QuickUpdateModal
          record={quickUpdateRecord}
          onSaveRecord={handleSaveRecord}
          onPreviewAttachment={(attachments, index) =>
            setViewerState({ attachments, index })
          }
          onClose={() => setQuickUpdateRecord(null)}
        />
      )}

      {viewerState && (
        <MediaViewerModal
          attachments={viewerState.attachments}
          initialIndex={viewerState.index}
          onClose={() => setViewerState(null)}
        />
      )}
    </div>
  );
}
export default App;
