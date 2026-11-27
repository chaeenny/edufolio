import React from 'react';
import { CategoryItem, EduRecord } from '../types/edufolio';
import { FileSpreadsheet } from 'lucide-react';

export function ExportBackupBar({
  records,
  categories,
}: {
  records: EduRecord[];
  categories: CategoryItem[];
  onAfterImport?: () => Promise<void>;
}) {
  // CSV (Excel) Export with UTF-8 BOM for Korean Excel compatibility
  const handleCsvExport = () => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const headers = [
      '카테고리',
      '연수구분(직무/자율)',
      '일자',
      '연도',
      '제목',
      '이수시간(연수)',
      '기관/연구회/교과(2022개정)',
      '단계/형태',
      '핵심요약',
      '태그',
      '첨부파일수',
      '외부링크수',
      '최신버전',
    ];

    const escapeCsv = (val: any) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = records.map((r) => {
      const catName = catMap.get(r.categoryId) || r.categoryId;
      const division =
        r.categoryId === 'training'
          ? r.payload.trainingDivision || '직무연수'
          : '-';
      const org =
        r.payload.institution ||
        r.payload.groupName ||
        r.payload.gradeSubject ||
        r.payload.organizationOrRole ||
        '';
      const stageOrType =
        r.payload.stage || r.payload.trainingType || r.payload.status || '';
      const latestVer = r.versionHistory?.[0]?.version || 'v1.0';
      return [
        catName,
        division,
        r.date,
        r.year,
        r.title,
        r.payload.hours || 0,
        org,
        stageOrType,
        r.summary,
        (r.tags || []).join(', '),
        r.attachments?.length || 0,
        r.links?.length || 0,
        latestVer,
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduFolio_연수및활동이력_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleCsvExport}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-bold transition"
      title="연수 시간 및 전체 활동 내역을 엑셀 파일로 내려받습니다"
    >
      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> 엑셀 다운로드
    </button>
  );
}
