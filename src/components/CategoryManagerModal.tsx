import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { CategoryColor, CategoryItem } from '../types/edufolio';
import { AVAILABLE_ICONS, COLOR_PALETTE, DynamicIcon } from '../utils/uiTheme';

interface CategoryManagerModalProps {
  categories: CategoryItem[];
  editingCategory?: CategoryItem | null;
  onSaveCategory: (cat: CategoryItem) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onClose: () => void;
}

const COLORS: { key: CategoryColor; label: string }[] = [
  { key: 'indigo', label: '인디고' },
  { key: 'emerald', label: '에메랄드' },
  { key: 'amber', label: '앰버' },
  { key: 'rose', label: '로즈' },
  { key: 'sky', label: '스카이' },
  { key: 'violet', label: '바이올렛' },
  { key: 'teal', label: '틸' },
  { key: 'orange', label: '오렌지' },
];

export function CategoryManagerModal({
  categories,
  editingCategory,
  onSaveCategory,
  onDeleteCategory,
  onClose,
}: CategoryManagerModalProps) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [description, setDescription] = useState(editingCategory?.description || '');
  const [icon, setIcon] = useState(editingCategory?.icon || 'Trophy');
  const [color, setColor] = useState<CategoryColor>(editingCategory?.color || 'violet');
  const [templateType, setTemplateType] = useState<CategoryItem['templateType']>(
    editingCategory?.templateType || 'custom'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const item: CategoryItem = {
      id:
        editingCategory?.id ||
        `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      description:
        description.trim() ||
        `${name.trim()} 관련 파일, 사진 및 활동 기록 아카이브`,
      icon,
      color,
      isDefault: editingCategory?.isDefault || false,
      templateType,
      sortOrder: editingCategory?.sortOrder ?? categories.length + 1,
    };

    await onSaveCategory(item);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base">
              {editingCategory ? '활동 카테고리 편집' : '+ 새 활동 카테고리 추가'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              카테고리 이름 *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 과학동아리 지도, 에듀테크 선도교사단, 외부 강의, 연구대회"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              입력 양식 템플릿 선택
            </label>
            <select
              value={templateType}
              onChange={(e) =>
                setTemplateType(e.target.value as CategoryItem['templateType'])
              }
              disabled={Boolean(editingCategory?.isDefault)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none bg-white disabled:bg-slate-100"
            >
              <option value="custom">
                자유 확장형 템플릿 (활동 개요 · 주요 내용 · 성과 · 버전 타임라인)
              </option>
              <option value="lab">
                실험/교육자료 특화 템플릿 (가설 · 준비물 체크리스트 · 시행착오 비교)
              </option>
              <option value="training">
                연수 특화 템플릿 (연수 기관 · 이수 시간 · 핵심 배움 · 수업 아이디어)
              </option>
              <option value="plc">
                교학공/모임 특화 템플릿 (참여 교사 · 공동 연구 주제 · 회의록)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              간단 설명
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 카테고리에서 관리할 자료나 활동 설명을 입력하세요"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              아이콘 선택
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition ${
                    icon === item.name
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                  title={item.label}
                >
                  <DynamicIcon name={item.name} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              테마 색상 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const pal = COLOR_PALETTE[c.key];
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      color === c.key
                        ? `${pal.badge} ring-2 ${pal.ring}`
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${pal.dot}`} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {editingCategory && !editingCategory.isDefault ? (
              <button
                type="button"
                onClick={async () => {
                  if (
                    window.confirm(
                      `"${editingCategory.name}" 카테고리를 삭제하시겠습니까?`
                    )
                  ) {
                    await onDeleteCategory(editingCategory.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" /> 카테고리 삭제
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" /> 저장하기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
