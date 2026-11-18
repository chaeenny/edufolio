import React from 'react';
import {
  GraduationCap,
  Users,
  FlaskConical,
  Trophy,
  BookOpen,
  Sparkles,
  Laptop,
  Microscope,
  Folder,
  Award,
  Presentation,
  Lightbulb,
} from 'lucide-react';
import { CategoryColor } from '../types/edufolio';

export const AVAILABLE_ICONS = [
  { name: 'GraduationCap', label: '학사모 (연수)', component: GraduationCap },
  { name: 'Users', label: '교학공 (모임)', component: Users },
  { name: 'FlaskConical', label: '플라스크 (실험)', component: FlaskConical },
  { name: 'Microscope', label: '현미경 (탐구)', component: Microscope },
  { name: 'Trophy', label: '트로피 (대회)', component: Trophy },
  { name: 'Presentation', label: '발표/강의', component: Presentation },
  { name: 'Laptop', label: '에듀테크/SW', component: Laptop },
  { name: 'BookOpen', label: '독서/교재연구', component: BookOpen },
  { name: 'Lightbulb', label: '발명/아이디어', component: Lightbulb },
  { name: 'Award', label: '인증/선도교사', component: Award },
  { name: 'Sparkles', label: '동아리/창체', component: Sparkles },
  { name: 'Folder', label: '일반 폴더', component: Folder },
];

export function DynamicIcon({
  name,
  className = 'w-5 h-5',
}: {
  name: string;
  className?: string;
}) {
  const found = AVAILABLE_ICONS.find((i) => i.name === name);
  const IconComp = found ? found.component : Folder;
  return <IconComp className={className} />;
}

export const COLOR_PALETTE: Record<
  CategoryColor,
  {
    bg: string;
    lightBg: string;
    text: string;
    border: string;
    badge: string;
    ring: string;
    dot: string;
  }
> = {
  indigo: {
    bg: 'bg-indigo-600',
    lightBg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    ring: 'ring-indigo-500',
    dot: 'bg-indigo-500',
  },
  emerald: {
    bg: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-600',
    lightBg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    ring: 'ring-amber-500',
    dot: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-600',
    lightBg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    ring: 'ring-rose-500',
    dot: 'bg-rose-500',
  },
  sky: {
    bg: 'bg-sky-600',
    lightBg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    ring: 'ring-sky-500',
    dot: 'bg-sky-500',
  },
  violet: {
    bg: 'bg-violet-600',
    lightBg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    ring: 'ring-violet-500',
    dot: 'bg-violet-500',
  },
  teal: {
    bg: 'bg-teal-600',
    lightBg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    ring: 'ring-teal-500',
    dot: 'bg-teal-500',
  },
  orange: {
    bg: 'bg-orange-600',
    lightBg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    ring: 'ring-orange-500',
    dot: 'bg-orange-500',
  },
};
