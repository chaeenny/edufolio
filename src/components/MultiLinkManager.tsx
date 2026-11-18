import React, { useState } from 'react';
import {
  ExternalLink,
  Plus,
  Trash2,
  Youtube,
  FileSpreadsheet,
  BookOpen,
  Palette,
  LayoutGrid,
  Github,
  Globe,
} from 'lucide-react';
import { ExternalLinkItem } from '../types/edufolio';
import { detectDomainType } from '../data/sampleData';

export function DomainBadge({
  domainType,
}: {
  domainType: ExternalLinkItem['domainType'];
}) {
  switch (domainType) {
    case 'gdrive':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Google Drive
        </span>
      );
    case 'notion':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300">
          <BookOpen className="w-3.5 h-3.5" /> Notion
        </span>
      );
    case 'canva':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
          <Palette className="w-3.5 h-3.5" /> Canva
        </span>
      );
    case 'youtube':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <Youtube className="w-3.5 h-3.5" /> YouTube
        </span>
      );
    case 'padlet':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <LayoutGrid className="w-3.5 h-3.5" /> Padlet
        </span>
      );
    case 'github':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-300">
          <Github className="w-3.5 h-3.5" /> GitHub
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
          <Globe className="w-3.5 h-3.5" /> 외부 링크
        </span>
      );
  }
}

export function MultiLinkList({
  links,
  onRemove,
  compact = false,
}: {
  links: ExternalLinkItem[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((lnk) => (
        <div
          key={lnk.id}
          className={`group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
          }`}
        >
          <DomainBadge domainType={lnk.domainType} />
          <a
            href={lnk.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-slate-700 hover:text-indigo-600 flex items-center gap-1 max-w-[220px] truncate"
            title={`${lnk.title} (${lnk.url})`}
          >
            <span className="truncate">{lnk.title}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
          </a>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(lnk.id);
              }}
              className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
              title="링크 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function MultiLinkEditor({
  links,
  onChange,
}: {
  links: ExternalLinkItem[];
  onChange: (next: ExternalLinkItem[]) => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (!url.trim()) return;
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    const domainType = detectDomainType(normalizedUrl);
    const defaultLabelMap: Record<ExternalLinkItem['domainType'], string> = {
      gdrive: '구글 드라이브 자료',
      notion: '노션 워크스페이스 문서',
      canva: '캔바 디자인 템플릿',
      youtube: '유튜브 실험 영상',
      padlet: '패들렛 수업 보드',
      github: '깃허브 저장소',
      general: '참고 웹사이트',
    };
    const newItem: ExternalLinkItem = {
      id: `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim() || defaultLabelMap[domainType],
      url: normalizedUrl,
      domainType,
    };
    onChange([...links, newItem]);
    setTitle('');
    setUrl('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="링크 제목 (예: MBL 실험 데이터 시트, 시범실험 유튜브)"
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="URL 입력 (구글 드라이브, 노션, 캔바, 유튜브, 패들렛 등)"
          className="flex-[1.3] rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> 링크 추가
        </button>
      </div>
      <MultiLinkList
        links={links}
        onRemove={(id) => onChange(links.filter((l) => l.id !== id))}
      />
    </div>
  );
}
