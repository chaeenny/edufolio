import React, { useRef } from 'react';
import { CategoryItem, EduRecord } from '../types/edufolio';
import {
  saveLocalCategory,
  saveLocalRecord,
  syncCategoryToCloud,
  syncRecordToCloud,
} from '../services/storageManager';
import { Download, Upload, FileSpreadsheet, FileCode } from 'lucide-react';

export function ExportBackupBar({
  records,
  categories,
  onAfterImport,
}: {
  records: EduRecord[];
  categories: CategoryItem[];
  onAfterImport: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 1. Full JSON Backup
  const handleJsonBackup = () => {
    const payload = {
      app: 'EduFolio Cloud',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      categories,
      records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduFolio_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. JSON Restore
  const handleJsonRestore = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.categories)) {
        for (const cat of parsed.categories) {
          await saveLocalCategory(cat);
          await syncCategoryToCloud(cat);
        }
      }
      if (Array.isArray(parsed.records)) {
        for (const rec of parsed.records) {
          await saveLocalRecord(rec);
          await syncRecordToCloud(rec);
        }
      }
      await onAfterImport();
      alert(
        `JSON 백업 복원 완료! (${parsed.records?.length || 0}건의 기록이 복원되었습니다)`
      );
    } catch (err: any) {
      alert(`JSON 복원 중 오류가 발생했습니다: ${err?.message || err}`);
    }
  };

  // 3. CSV (Excel) Export with UTF-8 BOM for Korean Excel compatibility
  const handleCsvExport = () => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const headers = [
      '카테고리',
      '일자',
      '연도',
      '제목',
      '이수시간(연수)',
      '기관/모임/교과',
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

  // 4. Markdown Portfolio Export
  const handleMarkdownExport = () => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const totalTrainingHours = records
      .filter((r) => r.categoryId === 'training')
      .reduce((acc, r) => acc + (Number(r.payload.hours) || 0), 0);

    let md = `# 🎓 EduFolio Cloud 교사 전문성 & 실험 개발 포트폴리오\n\n`;
    md += `- **내보내기 일시**: ${new Date().toLocaleString('ko-KR')}\n`;
    md += `- **총 아카이브 기록**: ${records.length}건\n`;
    md += `- **누적 직무·자율 연수 이수 시간**: ${totalTrainingHours}시간\n\n---\n\n`;

    for (const r of records) {
      const catName = catMap.get(r.categoryId) || r.categoryId;
      md += `## [${catName}] ${r.title}\n`;
      md += `- **일자**: ${r.date} | **버전**: ${
        r.versionHistory?.[0]?.version || 'v1.0'
      }\n`;
      if (r.tags?.length) {
        md += `- **태그**: ${r.tags.map((t) => `#${t}`).join(' ')}\n`;
      }
      if (r.summary) {
        md += `- **요약**: ${r.summary}\n`;
      }
      if (r.categoryId === 'training') {
        md += `- **연수 기관**: ${r.payload.institution} (${r.payload.hours}시간 / ${r.payload.trainingType})\n`;
        if (r.payload.keyLearnings) {
          md += `\n### 핵심 배움 요약\n${r.payload.keyLearnings}\n`;
        }
        if (r.payload.classroomIdeas) {
          md += `\n### 수업 적용 아이디어\n${r.payload.classroomIdeas}\n`;
        }
      } else if (r.categoryId === 'plc') {
        md += `- **모임명**: ${r.payload.groupName} | **참여 교사**: ${r.payload.participants}\n`;
        if (r.payload.sharedContent) {
          md += `\n### 공동 연구 및 수업 나눔\n${r.payload.sharedContent}\n`;
        }
      } else if (r.categoryId === 'lab') {
        md += `- **학년/단원**: ${r.payload.gradeSubject} - ${r.payload.unitName} (**단계**: ${r.payload.stage})\n`;
        if (r.payload.hypothesis) {
          md += `\n### 실험 가설\n${r.payload.hypothesis}\n`;
        }
        if (r.payload.observationsData) {
          md += `\n### 관찰 결과 및 데이터\n${r.payload.observationsData}\n`;
        }
        if (r.payload.trialAndErrorNotes) {
          md += `\n### 시행착오 및 개선 노하우\n${r.payload.trialAndErrorNotes}\n`;
        }
      }

      if (r.links?.length) {
        md += `\n### 참고 링크\n`;
        for (const l of r.links) {
          md += `- [${l.title}](${l.url})\n`;
        }
      }
      md += `\n---\n\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduFolio_Portfolio_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleJsonRestore(f);
            e.target.value = '';
          }
        }}
      />
      <button
        type="button"
        onClick={handleCsvExport}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-xs font-semibold transition"
        title="연수 시간 및 전체 활동 내역을 엑셀(CSV)로 내보냅니다"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> CSV(엑셀)
      </button>

      <button
        type="button"
        onClick={handleMarkdownExport}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-xs font-semibold transition"
        title="전체 포트폴리오를 마크다운(.md) 문서로 내보냅니다"
      >
        <FileCode className="w-3.5 h-3.5 text-indigo-600" /> MD 내보내기
      </button>

      <button
        type="button"
        onClick={handleJsonBackup}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition"
        title="전체 데이터 JSON 백업"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" /> JSON 백업
      </button>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition"
        title="JSON 백업 파일 복원"
      >
        <Upload className="w-3.5 h-3.5 text-slate-500" /> 복원
      </button>
    </div>
  );
}
