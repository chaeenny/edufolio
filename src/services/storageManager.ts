import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { AttachmentItem, CategoryItem, CloudConfig, EduRecord } from '../types/edufolio';

const DB_NAME = 'EduFolioIndexedDB_v1';
const STORE_RECORDS = 'records';
const STORE_CATEGORIES = 'categories';
const STORE_BLOBS = 'file_blobs';
const CLOUD_CONFIG_KEY = 'edufolio_firebase_config_v1';
const PLC_GROUPS_KEY = 'edufolio_plc_groups_v1';

export const DEFAULT_PLC_GROUPS = [
  '신과람 (신나는 과학을 만드는 사람들)',
  '청담고 과학과 교학공',
  '디지털·AI 화학탐구 교학공',
];

export function getSavedPlcGroups(): string[] {
  try {
    const raw = localStorage.getItem(PLC_GROUPS_KEY);
    if (!raw) return DEFAULT_PLC_GROUPS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure 신과람 is always present at top
      const hasSingwaram = parsed.some((g: string) => g.includes('신과람'));
      return hasSingwaram ? parsed : [DEFAULT_PLC_GROUPS[0], ...parsed];
    }
    return DEFAULT_PLC_GROUPS;
  } catch {
    return DEFAULT_PLC_GROUPS;
  }
}

export function savePlcGroups(groups: string[]): void {
  localStorage.setItem(PLC_GROUPS_KEY, JSON.stringify(groups));
}

// Root Vault Collection (Secured by Secret Key in Production Firestore Rules)
export const COL_VAULTS = 'edufolio_vaults';
export const SUBCOL_RECORDS = 'records';
export const SUBCOL_CATEGORIES = 'categories';
export const SUBCOL_FILES = 'files'; // Chunked base64 files for Spark Free Tier

// Each Firestore doc limit is 1 MiB. We use 650 KB base64 chunks to stay safely below the limit.
const CHUNK_SIZE = 650_000;

const objectUrlCache = new Map<string, string>();

// ============================================================================
// IndexedDB Setup
// ============================================================================
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Firebase Cloud Config & Smart Parser
// ============================================================================
export function getCloudConfig(): CloudConfig {
  const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY || '';
  const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '';
  const envSecretKey = (import.meta as any).env?.VITE_FIREBASE_SECRET_KEY || '';
  const envAppId = (import.meta as any).env?.VITE_FIREBASE_APP_ID || '';
  const envAuthDomain = (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '';

  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (!raw) {
      return {
        apiKey: envApiKey,
        projectId: envProjectId,
        secretKey: envSecretKey,
        appId: envAppId,
        authDomain: envAuthDomain,
        enabled: Boolean(envApiKey && envProjectId && envSecretKey),
      };
    }
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey || envApiKey,
      projectId: parsed.projectId || envProjectId,
      secretKey: parsed.secretKey || envSecretKey,
      appId: parsed.appId || envAppId,
      authDomain: parsed.authDomain || envAuthDomain,
      enabled: Boolean(parsed.enabled),
      lastSyncedAt: parsed.lastSyncedAt,
    };
  } catch {
    return {
      apiKey: envApiKey,
      projectId: envProjectId,
      secretKey: envSecretKey,
      appId: envAppId,
      authDomain: envAuthDomain,
      enabled: Boolean(envApiKey && envProjectId && envSecretKey),
    };
  }
}

export function saveCloudConfig(config: CloudConfig): void {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
}

// Parses raw `const firebaseConfig = { ... }` snippet copied directly from Firebase Console
export function parseFirebaseConfigSnippet(snippet: string): Partial<CloudConfig> {
  const extract = (key: string) => {
    const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`);
    const match = snippet.match(regex);
    return match ? match[1].trim() : '';
  };
  return {
    apiKey: extract('apiKey'),
    projectId: extract('projectId'),
    appId: extract('appId'),
    authDomain: extract('authDomain'),
  };
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let currentProjectKey = '';

export function getFirestoreClient(config?: CloudConfig): Firestore | null {
  const cfg = config || getCloudConfig();
  if (
    !cfg.enabled ||
    !cfg.apiKey.trim() ||
    !cfg.projectId.trim() ||
    !cfg.secretKey.trim()
  ) {
    return null;
  }

  const cacheKey = `${cfg.projectId.trim()}:::${cfg.apiKey.trim()}`;
  if (firestoreInstance && currentProjectKey === cacheKey) {
    return firestoreInstance;
  }

  try {
    const existingApps = getApps();
    for (const app of existingApps) {
      deleteApp(app).catch(() => {});
    }

    const projectId = cfg.projectId.trim();
    firebaseAppInstance = initializeApp({
      apiKey: cfg.apiKey.trim(),
      projectId,
      authDomain: cfg.authDomain?.trim() || `${projectId}.firebaseapp.com`,
      appId: cfg.appId?.trim() || undefined,
    });
    firestoreInstance = getFirestore(firebaseAppInstance);
    currentProjectKey = cacheKey;
    return firestoreInstance;
  } catch (err) {
    console.error('Failed to initialize Firebase Firestore:', err);
    return null;
  }
}

// Helper to get the secret-key-scoped subcollection reference
function getVaultCol(db: Firestore, secretKey: string, subcol: string) {
  return collection(db, COL_VAULTS, secretKey.trim(), subcol);
}

function getVaultDoc(db: Firestore, secretKey: string, subcol: string, docId: string) {
  return doc(db, COL_VAULTS, secretKey.trim(), subcol, docId);
}

// ============================================================================
// IndexedDB Operations (Records & Categories)
// ============================================================================
export async function getAllLocalCategories(): Promise<CategoryItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIES, 'readonly');
    const store = tx.objectStore(STORE_CATEGORIES);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []) as CategoryItem[];
      items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalCategory(category: CategoryItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIES, 'readwrite');
    tx.objectStore(STORE_CATEGORIES).put(category);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLocalCategory(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIES, 'readwrite');
    tx.objectStore(STORE_CATEGORIES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllLocalRecords(): Promise<EduRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, 'readonly');
    const store = tx.objectStore(STORE_RECORDS);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []) as EduRecord[];
      items.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.date.localeCompare(a.date);
      });
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalRecord(record: EduRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    tx.objectStore(STORE_RECORDS).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLocalRecord(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, 'readwrite');
    tx.objectStore(STORE_RECORDS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================================================
// Binary File Blob Operations (IndexedDB + Firestore Chunked Storage for Spark Plan)
// ============================================================================
export async function saveLocalBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, 'readwrite');
    tx.objectStore(STORE_BLOBS).put({ key, blob, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalBlob(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BLOBS, 'readonly');
    const req = tx.objectStore(STORE_BLOBS).get(key);
    req.onsuccess = () => {
      resolve(req.result ? (req.result.blob as Blob) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Upload a file blob to secret-protected Firestore vault in 650KB chunks
export async function uploadBlobToFirestore(
  fileId: string,
  blob: Blob,
  mimeType: string
): Promise<boolean> {
  const cfg = getCloudConfig();
  const db = getFirestoreClient(cfg);
  if (!db || !cfg.secretKey.trim()) return false;
  if (blob.size > 10 * 1024 * 1024) {
    console.warn('File larger than 10MB kept in local IndexedDB to save Spark quota');
    return false;
  }

  try {
    const secret = cfg.secretKey.trim();
    const dataUrl = await blobToDataUrl(blob);
    const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);

    await setDoc(getVaultDoc(db, secret, SUBCOL_FILES, fileId), {
      id: fileId,
      mimeType,
      size: blob.size,
      totalChunks,
      updatedAt: new Date().toISOString(),
    });

    for (let i = 0; i < totalChunks; i++) {
      const slice = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await setDoc(getVaultDoc(db, secret, SUBCOL_FILES, `${fileId}_chunk_${i}`), {
        fileId,
        index: i,
        data: slice,
      });
    }
    return true;
  } catch (err) {
    console.warn('Firestore chunked file upload failed:', err);
    return false;
  }
}

export async function downloadBlobFromFirestore(
  fileId: string,
  localKey?: string
): Promise<Blob | null> {
  const cfg = getCloudConfig();
  const db = getFirestoreClient(cfg);
  if (!db || !cfg.secretKey.trim()) return null;

  try {
    const secret = cfg.secretKey.trim();
    const metaSnap = await getDoc(getVaultDoc(db, secret, SUBCOL_FILES, fileId));
    if (!metaSnap.exists()) return null;
    const meta = metaSnap.data();
    const totalChunks: number = meta.totalChunks || 0;
    if (totalChunks <= 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkSnap = await getDoc(
        getVaultDoc(db, secret, SUBCOL_FILES, `${fileId}_chunk_${i}`)
      );
      if (!chunkSnap.exists()) return null;
      parts.push(chunkSnap.data().data || '');
    }

    const fullDataUrl = parts.join('');
    const blob = dataUrlToBlob(fullDataUrl);
    if (localKey) {
      await saveLocalBlob(localKey, blob);
    }
    return blob;
  } catch (err) {
    console.warn('Firestore chunked file download failed:', err);
    return null;
  }
}

export async function resolveAttachmentUrl(att: AttachmentItem): Promise<string> {
  if (att.cloudUrl) {
    return att.cloudUrl;
  }
  if (att.previewDataUrl && att.storageMode === 'dataurl') {
    return att.previewDataUrl;
  }
  const cacheKey = att.localKey || att.id;
  if (objectUrlCache.has(cacheKey)) {
    return objectUrlCache.get(cacheKey)!;
  }

  if (att.localKey) {
    const localBlob = await getLocalBlob(att.localKey);
    if (localBlob) {
      const url = URL.createObjectURL(localBlob);
      objectUrlCache.set(cacheKey, url);
      return url;
    }
  }

  if (att.cloudDocId) {
    const remoteBlob = await downloadBlobFromFirestore(att.cloudDocId, att.localKey);
    if (remoteBlob) {
      const url = URL.createObjectURL(remoteBlob);
      objectUrlCache.set(cacheKey, url);
      return url;
    }
  }

  return att.previewDataUrl || '';
}

async function generateImageThumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 540;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(undefined);
        }
      };
      img.onerror = () => resolve(undefined);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

export async function uploadFileAttachment(
  file: File,
  tag: AttachmentItem['tag'] = '일반',
  onProgress?: (percent: number) => void
): Promise<AttachmentItem> {
  const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const localKey = `blob_${id}`;
  const mimeType = file.type || guessMimeType(file.name);

  onProgress?.(15);
  await saveLocalBlob(localKey, file);
  onProgress?.(45);

  const previewDataUrl = await generateImageThumbnail(file);
  onProgress?.(70);

  let storageMode: AttachmentItem['storageMode'] = 'indexeddb';
  let cloudDocId: string | undefined;

  const db = getFirestoreClient();
  if (db) {
    const uploaded = await uploadBlobToFirestore(id, file, mimeType);
    if (uploaded) {
      storageMode = 'firestore';
      cloudDocId = id;
    }
  }

  onProgress?.(100);

  return {
    id,
    name: file.name,
    originalName: file.name,
    mimeType,
    size: file.size,
    storageMode,
    localKey,
    cloudDocId,
    previewDataUrl,
    tag,
    uploadedAt: new Date().toISOString(),
  };
}

export function guessMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.hwpx') || lower.endsWith('.hwp')) return 'application/x-hwp';
  if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'application/msword';
  return 'application/octet-stream';
}

// ============================================================================
// Firestore Realtime Sync & CRUD Operations (Scoped to Secret Key Vault)
// ============================================================================
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function syncRecordToCloud(record: EduRecord): Promise<boolean> {
  const cfg = getCloudConfig();
  const db = getFirestoreClient(cfg);
  if (!db || !cfg.secretKey.trim()) return false;
  try {
    await setDoc(
      getVaultDoc(db, cfg.secretKey, SUBCOL_RECORDS, record.id),
      sanitizeForFirestore(record)
    );
    return true;
  } catch (err) {
    console.warn('Firestore record save error:', err);
    return false;
  }
}

export async function deleteRecordFromCloud(id: string): Promise<boolean> {
  const cfg = getCloudConfig();
  const db = getFirestoreClient(cfg);
  if (!db || !cfg.secretKey.trim()) return false;
  try {
    await deleteDoc(getVaultDoc(db, cfg.secretKey, SUBCOL_RECORDS, id));
    return true;
  } catch {
    return false;
  }
}

export async function syncCategoryToCloud(category: CategoryItem): Promise<boolean> {
  const cfg = getCloudConfig();
  const db = getFirestoreClient(cfg);
  if (!db || !cfg.secretKey.trim()) return false;
  try {
    await setDoc(
      getVaultDoc(db, cfg.secretKey, SUBCOL_CATEGORIES, category.id),
      sanitizeForFirestore(category)
    );
    return true;
  } catch {
    return false;
  }
}

export async function deleteCategoryFromCloud(id: string): Promise<boolean> {
  const cfg = getCloudConfig();
  const db = getFirestoreClient(cfg);
  if (!db || !cfg.secretKey.trim()) return false;
  try {
    await deleteDoc(getVaultDoc(db, cfg.secretKey, SUBCOL_CATEGORIES, id));
    return true;
  } catch {
    return false;
  }
}

// Test connection against the Secret Key Vault
export async function verifyVaultConnection(config: CloudConfig): Promise<{
  ok: boolean;
  error?: string;
}> {
  const db = getFirestoreClient(config);
  if (!db || !config.secretKey.trim()) {
    return { ok: false, error: 'Project ID, API Key, 비밀 동기화 키를 모두 입력해주세요.' };
  }
  try {
    await getDoc(getVaultDoc(db, config.secretKey, SUBCOL_RECORDS, '_connection_check_'));
    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.code || err?.message || 'Permission Denied',
    };
  }
}

// Subscribe to Firestore Realtime changes (onSnapshot)
export function subscribeToFirestoreRealtime(
  config: CloudConfig,
  callbacks: {
    onRecordsUpdated: (records: EduRecord[]) => void;
    onCategoriesUpdated: (categories: CategoryItem[]) => void;
    onStatusChange: (status: 'syncing' | 'cloud' | 'error') => void;
  }
): Unsubscribe | null {
  const db = getFirestoreClient(config);
  if (!db || !config.secretKey.trim()) return null;

  callbacks.onStatusChange('syncing');
  const secret = config.secretKey.trim();

  const unsubRecords = onSnapshot(
    getVaultCol(db, secret, SUBCOL_RECORDS),
    async (snapshot) => {
      const remoteRecords: EduRecord[] = [];
      for (const docSnap of snapshot.docs) {
        const rec = docSnap.data() as EduRecord;
        if (rec && rec.id) {
          remoteRecords.push(rec);
          await saveLocalRecord(rec);
        }
      }
      if (remoteRecords.length > 0) {
        callbacks.onRecordsUpdated(remoteRecords);
      }
      callbacks.onStatusChange('cloud');
    },
    (err) => {
      console.warn('Firestore onSnapshot error:', err);
      callbacks.onStatusChange('error');
    }
  );

  const unsubCategories = onSnapshot(
    getVaultCol(db, secret, SUBCOL_CATEGORIES),
    async (snapshot) => {
      const remoteCats: CategoryItem[] = [];
      for (const docSnap of snapshot.docs) {
        const cat = docSnap.data() as CategoryItem;
        if (cat && cat.id) {
          remoteCats.push(cat);
          await saveLocalCategory(cat);
        }
      }
      if (remoteCats.length > 0) {
        callbacks.onCategoriesUpdated(remoteCats);
      }
    },
    () => {}
  );

  return () => {
    unsubRecords();
    unsubCategories();
  };
}

// One-click Local -> Firebase Firestore Full Sync (Scoped to Secret Key Vault)
export async function syncAllLocalToCloud(
  onStatus?: (msg: string, progress: number) => void
): Promise<{ syncedRecords: number; syncedFiles: number; error?: string }> {
  const cfg = getCloudConfig();
  const db = getFirestoreClient(cfg);
  if (!db || !cfg.secretKey.trim()) {
    return {
      syncedRecords: 0,
      syncedFiles: 0,
      error: 'Firebase Project ID, API Key, 나만의 비밀 동기화 키를 모두 입력해주세요.',
    };
  }

  const secret = cfg.secretKey.trim();

  try {
    onStatus?.('카테고리 데이터 암호화 볼트 동기화 중...', 10);
    const localCats = await getAllLocalCategories();
    for (const cat of localCats) {
      await setDoc(
        getVaultDoc(db, secret, SUBCOL_CATEGORIES, cat.id),
        sanitizeForFirestore(cat)
      );
    }

    onStatus?.('첨부파일 Firestore 보안 볼트 업로드 중...', 30);
    const localRecords = await getAllLocalRecords();
    let syncedFiles = 0;

    for (let i = 0; i < localRecords.length; i++) {
      const rec = localRecords[i];
      let modified = false;

      for (const att of rec.attachments) {
        if (!att.cloudDocId && att.localKey) {
          const blob = await getLocalBlob(att.localKey);
          if (blob) {
            const ok = await uploadBlobToFirestore(att.id, blob, att.mimeType);
            if (ok) {
              att.cloudDocId = att.id;
              att.storageMode = 'firestore';
              syncedFiles++;
              modified = true;
            }
          }
        }
      }

      if (modified) {
        await saveLocalRecord(rec);
      }

      await setDoc(
        getVaultDoc(db, secret, SUBCOL_RECORDS, rec.id),
        sanitizeForFirestore(rec)
      );

      const pct = 30 + Math.round(((i + 1) / Math.max(1, localRecords.length)) * 50);
      onStatus?.(`Firestore 보안 볼트 동기화 중 (${i + 1}/${localRecords.length})...`, pct);
    }

    onStatus?.('다른 기기의 Firestore 데이터 병합 중...', 90);
    const remoteRecSnap = await getDocs(getVaultCol(db, secret, SUBCOL_RECORDS));
    for (const d of remoteRecSnap.docs) {
      const rec = d.data() as EduRecord;
      if (rec && rec.id) await saveLocalRecord(rec);
    }

    const remoteCatSnap = await getDocs(getVaultCol(db, secret, SUBCOL_CATEGORIES));
    for (const d of remoteCatSnap.docs) {
      const cat = d.data() as CategoryItem;
      if (cat && cat.id) await saveLocalCategory(cat);
    }

    onStatus?.('Firebase 프로덕션 보안 동기화 완료!', 100);
    return { syncedRecords: localRecords.length, syncedFiles };
  } catch (err: any) {
    return {
      syncedRecords: 0,
      syncedFiles: 0,
      error:
        err?.message ||
        '동기화 실패: 비밀 동기화 키가 Firestore 보안 규칙(Rules)에 설정한 키와 일치하는지 확인해주세요.',
    };
  }
}
