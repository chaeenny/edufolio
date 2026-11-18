import React, { useState } from 'react';
import {
  Cloud,
  X,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Database,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ClipboardPaste,
  KeyRound,
  Lock,
} from 'lucide-react';
import { CloudConfig, SyncStatus } from '../types/edufolio';
import {
  parseFirebaseConfigSnippet,
  syncAllLocalToCloud,
  verifyVaultConnection,
} from '../services/storageManager';

interface CloudSettingsModalProps {
  config: CloudConfig;
  syncStatus: SyncStatus;
  onSaveConfig: (next: CloudConfig) => void;
  onAfterFullSync: () => Promise<void>;
  onClose: () => void;
}

export function CloudSettingsModal({
  config,
  syncStatus,
  onSaveConfig,
  onAfterFullSync,
  onClose,
}: CloudSettingsModalProps) {
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [projectId, setProjectId] = useState(config.projectId || '');
  const [secretKey, setSecretKey] = useState(config.secretKey || '');
  const [appId, setAppId] = useState(config.appId || '');
  const [authDomain, setAuthDomain] = useState(config.authDomain || '');
  const [enabled, setEnabled] = useState(config.enabled);

  const [snippetInput, setSnippetInput] = useState('');
  const [tab, setTab] = useState<'connect' | 'guide'>('connect');
  const [copied, setCopied] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ msg: string; pct: number } | null>(
    null
  );
  const [syncResult, setSyncResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const safeSecret = secretKey.trim() || 'YOUR_SECRET_SYNC_KEY';

  // Dynamic Production Rules that ONLY allow access if the client knows the exact Secret Key!
  const dynamicFirestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // [프로덕션 보안 모드] 내가 설정한 비밀 동기화 키(${safeSecret})와 일치하는 경로만 읽기/쓰기 허용!
    // 비밀 키를 모르는 외부인은 절대 목록을 조회하거나 접근할 수 없으며, 30일 만료도 없습니다.
    match /edufolio_vaults/{vaultKey}/{document=**} {
      allow read, write: if vaultKey == "${safeSecret}";
    }
  }
}`;

  const handleParseSnippet = (raw: string) => {
    setSnippetInput(raw);
    const parsed = parseFirebaseConfigSnippet(raw);
    if (parsed.apiKey) setApiKey(parsed.apiKey);
    if (parsed.projectId) setProjectId(parsed.projectId);
    if (parsed.appId) setAppId(parsed.appId);
    if (parsed.authDomain) setAuthDomain(parsed.authDomain);
    if (parsed.apiKey && parsed.projectId) {
      setEnabled(true);
      setSyncResult({
        ok: true,
        message: `✓ firebaseConfig 코드에서 Project ID (${parsed.projectId})와 API Key를 자동으로 추출했습니다!`,
      });
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(dynamicFirestoreRules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyAndTest = async () => {
    const nextCfg: CloudConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      secretKey: safeSecret,
      appId: appId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      enabled: Boolean(apiKey.trim() && projectId.trim() && safeSecret && enabled),
      lastSyncedAt: new Date().toISOString(),
    };
    onSaveConfig(nextCfg);

    if (!nextCfg.enabled) {
      setSyncResult({
        ok: true,
        message: '로컬 저장 모드(IndexedDB)로 전환되었습니다.',
      });
      return;
    }

    setSyncProgress({ msg: '프로덕션 보안 볼트(Secret Key) 연결 확인 중...', pct: 30 });
    const res = await verifyVaultConnection(nextCfg);
    setSyncProgress(null);

    if (res.ok) {
      setSyncResult({
        ok: true,
        message: `🔒 프로덕션 보안 연결 성공! 비밀 동기화 키("${safeSecret}")가 일치하는 내 기기에서만 실시간 동기화가 작동합니다.`,
      });
      await onAfterFullSync();
    } else {
      setSyncResult({
        ok: false,
        message: `접근이 거부되었습니다 (${res.error}). 상단 [2. 프로덕션 보안 규칙 & 단계별 가이드] 탭에서 비밀 키("${safeSecret}")가 반영된 보안 규칙을 복사해 Firebase 콘솔 [규칙(Rules)]에 게시하셨는지 확인해주세요!`,
      });
    }
  };

  const handleOneClickSync = async () => {
    const nextCfg: CloudConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      secretKey: safeSecret,
      appId: appId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      enabled: true,
      lastSyncedAt: new Date().toISOString(),
    };
    setEnabled(true);
    onSaveConfig(nextCfg);

    setSyncResult(null);
    setSyncProgress({ msg: '로컬 IndexedDB 데이터 분석 중...', pct: 5 });

    const res = await syncAllLocalToCloud((msg, pct) => {
      setSyncProgress({ msg, pct });
    });

    setSyncProgress(null);
    if (res.error) {
      setSyncResult({
        ok: false,
        message: `동기화 실패: ${res.error}`,
      });
    } else {
      setSyncResult({
        ok: true,
        message: `🔒 프로덕션 보안 볼트 원클릭 동기화 완료! (기록 ${res.syncedRecords}건, 첨부파일 ${res.syncedFiles}개 안전 업로드 완료)`,
      });
      await onAfterFullSync();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Firebase 프로덕션 보안 연동 (Spark 무료 플랜)
              </h2>
              <p className="text-xs text-slate-300">
                나만의 비밀 동기화 키(Secret Key)가 일치하는 기기만 접근을 허용하며 30일 만료가 없습니다
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

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setTab('connect')}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition ${
              tab === 'connect'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. 보안 키 설정 & 원클릭 동기화
          </button>
          <button
            type="button"
            onClick={() => setTab('guide')}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 ${
              tab === 'guide'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> 2. 프로덕션 보안 규칙(Rules) & 단계별 가이드
          </button>
        </div>

        {tab === 'connect' ? (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Current Status Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-500">현재 데이터베이스 상태</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {syncStatus === 'cloud' && 'Cloud Synced 🟢 (프로덕션 보안 볼트 실시간 연동 중)'}
                    {syncStatus === 'syncing' && '동기화 중... 🔄'}
                    {syncStatus === 'local' && '로컬 저장 모드 ⚪ (IndexedDB 저장 중)'}
                    {syncStatus === 'error' && '보안 키 또는 Firestore 규칙 확인 필요 ⚠️'}
                  </div>
                </div>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-slate-700">클라우드 활성화</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Step 1: Secret Key Input */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                나만의 비밀 동기화 키 (Secret Key) *
              </label>
              <input
                type="text"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="예: chungdam-science-2026-secret"
                className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-sm font-mono font-bold text-emerald-900 focus:border-emerald-600 focus:outline-none"
              />
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                • 원하는 비밀번호를 자유롭게 정하세요. 학교 PC, 집 PC, 아이패드에서 <strong>동일한 비밀 키</strong>를 입력하면 내 기기끼리만 안전하게 동기화됩니다.
                <br />• 비밀 키를 바꾸면 <strong>[2. 프로덕션 보안 규칙] 탭의 코드에도 자동 반영</strong>됩니다!
              </p>
            </div>

            {/* Smart Paste Box for firebaseConfig */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
              <label className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                간편 자동 입력: Firebase 콘솔의 <code>firebaseConfig</code> 코드를 통째로 붙여넣으세요
              </label>
              <textarea
                rows={2}
                value={snippetInput}
                onChange={(e) => handleParseSnippet(e.target.value)}
                placeholder={`const firebaseConfig = { apiKey: "AIzaSy...", projectId: "my-edufolio", ... };`}
                className="w-full rounded-xl border border-indigo-200 bg-white p-2.5 text-xs font-mono focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {/* Manual Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Firebase Project ID *
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="예: edufolio-cloud-12345"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Firebase Web API Key *
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Progress bar if syncing */}
            {syncProgress && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    {syncProgress.msg}
                  </span>
                  <span>{syncProgress.pct}%</span>
                </div>
                <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${syncProgress.pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Result Alert */}
            {syncResult && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                  syncResult.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {syncResult.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">{syncResult.message}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleOneClickSync}
                disabled={
                  !apiKey.trim() ||
                  !projectId.trim() ||
                  !safeSecret ||
                  Boolean(syncProgress)
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm shadow-sm transition"
              >
                <RefreshCw className="w-4 h-4" />
                로컬 데이터 → 프로덕션 볼트 원클릭 동기화
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={handleApplyAndTest}
                  disabled={Boolean(syncProgress)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm transition"
                >
                  설정 저장 및 연결 적용
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                🔒 프로덕션 모드 단계별 설정 가이드 (30일 만료 없음 · 외부 접근 원천 차단)
              </h3>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                <li>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5"
                  >
                    Firebase 콘솔 <ExternalLink className="w-3 h-3" />
                  </a>
                  에서 <strong>[빌드] → [Firestore Database] → [데이터베이스 만들기]</strong>를 누릅니다.
                </li>
                <li>
                  위치는 <code>asia-northeast3 (서울)</code>을 선택하고, <strong>[프로덕션 모드에서 시작]</strong>을 선택해 생성합니다.
                </li>
                <li>
                  상단 <strong>[규칙(Rules)]</strong> 탭을 클릭한 뒤, 1번 탭에서 입력하신 비밀 키(<code>{safeSecret}</code>)가 적용된 아래 규칙을 복사해 붙여넣고 <strong>[게시(Publish)]</strong>를 누릅니다.
                </li>
                <li>
                  ⚙️<strong>[프로젝트 설정] → [내 앱]</strong>에서 웹 앱(<code>&lt;/&gt;</code>)의 <code>firebaseConfig</code>를 복사해 1번 탭에 붙여넣고 저장하면 끝납니다!
                </li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  내 비밀 키(<code>{safeSecret}</code>)가 적용된 프로덕션 보안 규칙
                </span>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> 복사 완료!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> 보안 규칙(Rules) 복사
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                {dynamicFirestoreRules}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
