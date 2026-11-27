export type SyncStatus = 'local' | 'syncing' | 'cloud' | 'error';

export type CategoryColor =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'teal'
  | 'orange';

export interface CategoryItem {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: CategoryColor;
  description: string;
  isDefault?: boolean;
  templateType: 'training' | 'plc' | 'lab' | 'custom';
  sortOrder: number;
}

export type LabStage = '아이디어' | '예비실험' | '수정보완' | '완성/수업적용';

export type TrainingDivision = '직무연수' | '자율연수';

// 2022 개정 교육과정 과학(화학 중심 + 공통/교양) 교과 목록
export const CURRICULUM_2022_SUBJECTS = [
  '통합과학1',
  '통합과학2',
  '과학탐구실험1',
  '과학탐구실험2',
  '화학',
  '물질과 에너지',
  '화학 반응의 세계',
  '생활과 과학',
  '융합과학 탐구',
  '과학과제 연구',
] as const;

export interface AttachmentItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageMode: 'indexeddb' | 'firestore' | 'dataurl';
  localKey?: string;
  cloudUrl?: string;
  cloudDocId?: string;
  previewDataUrl?: string;
  tag?: '실험성공' | '실험실패' | '이수증' | '활동지' | '일반';
  uploadedAt: string;
}

export interface ExternalLinkItem {
  id: string;
  title: string;
  url: string;
  domainType: 'gdrive' | 'notion' | 'canva' | 'youtube' | 'padlet' | 'github' | 'general';
}

export interface VersionEntry {
  id: string;
  version: string; // e.g., v1.0, v1.1, v2.0
  date: string;
  note: string;
  attachments: AttachmentItem[];
  links: ExternalLinkItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// 1. 직무·자율 연수 (Training)
export interface TrainingPayload {
  trainingDivision?: TrainingDivision; // '직무연수' | '자율연수' (직무연수 별도 통계용)
  institution: string; // 연수 기관
  hours: number; // 이수 시간
  trainingType: '원격' | '집합' | '실습' | '혼합'; // 연수 형태
  keyLearnings: string; // 핵심 배움 요약
  classroomIdeas: string; // 수업 적용 아이디어
  certificateAttached?: boolean;
}

// 2. 연구회 · 교학공 (PLC / Community - 신과람 & 교학공)
export interface PlcPayload {
  groupName: string; // 모임명 (예: 신과람, 교학공 이름 선택)
  participants: string; // 참여 교사
  topic: string; // 주제
  sharedContent: string; // 공동 연구/나눔 내용
  meetingMinutes: string; // 회의록
}

// 3. 교육자료 개발 - 실험 중심 (Lab & Material Dev)
export interface LabPayload {
  gradeSubject: string; // 2022 개정 교육과정 교과명
  unitName: string; // 단원명
  stage: LabStage; // 개발 단계: 아이디어 -> 예비실험 -> 수정보완 -> 완성/수업적용
  hypothesis: string; // 실험 목표/가설
  materialsChecklist: ChecklistItem[]; // 준비물·시약·교구 체크리스트
  procedure: string; // 실험 절차
  observationsData: string; // 관찰 결과/데이터
  trialAndErrorNotes: string; // 시행착오 노트 (성공 vs 실패 원인 분석)
  improvementTips: string; // 개선 노하우 (Tip)
  safetyNotes: string; // 안전 주의사항
}

// 4. 자유 확장 영역 (Custom Category)
export interface CustomPayload {
  organizationOrRole: string; // 소속/역할/대상
  status: LabStage; // 진행 상태 호환
  keyPoints: string; // 주요 활동 내용
  outcomes: string; // 성과 및 성찰
}

export interface EduRecord {
  id: string;
  categoryId: string; // 'training' | 'plc' | 'lab' | custom id
  title: string;
  date: string; // YYYY-MM-DD
  year: number;
  tags: string[];
  summary: string;
  pinned: boolean;
  payload: TrainingPayload & PlcPayload & LabPayload & CustomPayload;
  attachments: AttachmentItem[];
  links: ExternalLinkItem[];
  versionHistory: VersionEntry[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'dashboard' | 'gallery' | 'table' | 'kanban';

export interface CloudConfig {
  apiKey: string;
  projectId: string;
  secretKey: string;
  appId?: string;
  authDomain?: string;
  enabled: boolean;
  lastSyncedAt?: string;
}
