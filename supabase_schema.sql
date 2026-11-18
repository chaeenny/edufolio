-- ============================================================================
-- EduFolio Cloud - Supabase Realtime DB & Storage Setup SQL Schema
-- ============================================================================
-- [3분 연동 가이드]
-- 1. Supabase 대시보드(https://supabase.com)에서 새 프로젝트를 생성합니다.
-- 2. 좌측 메뉴의 [SQL Editor] -> [New query]를 클릭합니다.
-- 3. 아래 SQL 전체를 복사하여 붙여넣고 [Run] 버튼을 클릭합니다.
-- 4. [Project Settings] -> [API]에서 Project URL과 anon public Key를 복사하여
--    EduFolio 앱 상단의 [클라우드 연동 설정]에 입력하면 즉시 실시간 동기화됩니다!
-- ============================================================================

-- 1. 카테고리 테이블 (기본 3대 영역 + 사용자 자유 확장 영역)
CREATE TABLE IF NOT EXISTS public.edufolio_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Folder',
  color TEXT NOT NULL DEFAULT 'indigo',
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 아카이브 레코드 테이블 (연수 / 교학공 / 실험 교육자료 / 커스텀 활동 통합 + JSONB 확장)
CREATE TABLE IF NOT EXISTS public.edufolio_records (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  year INTEGER NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  summary TEXT DEFAULT '',
  pinned BOOLEAN DEFAULT FALSE,
  payload JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '[]'::jsonb,
  version_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Row Level Security) 설정 - 개인/교사 멀티디바이스 간편 연동을 위한 익명 읽기/쓰기 허용
ALTER TABLE public.edufolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edufolio_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on edufolio_categories" ON public.edufolio_categories;
CREATE POLICY "Allow public full access on edufolio_categories"
  ON public.edufolio_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public full access on edufolio_records" ON public.edufolio_records;
CREATE POLICY "Allow public full access on edufolio_records"
  ON public.edufolio_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Realtime (실시간 멀티 디바이스 동기화) 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.edufolio_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.edufolio_records;

-- 5. 클라우드 스토리지 버킷 생성 (드래그앤드롭 대용량 파일, 실험 사진, PDF, HWPX 등)
INSERT INTO storage.buckets (id, name, public)
VALUES ('edufolio-files', 'edufolio-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public upload and read on edufolio-files" ON storage.objects;
CREATE POLICY "Allow public upload and read on edufolio-files"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'edufolio-files')
  WITH CHECK (bucket_id = 'edufolio-files');
