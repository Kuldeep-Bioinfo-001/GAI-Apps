import React from 'react';
import {
  Briefcase,
  BookOpen,
  FlaskConical,
  Dumbbell,
  HeartPulse,
  Users,
  ShoppingCart,
  Home,
  User,
  Compass,
} from 'lucide-react';
import { TaskCategory, TaskPriority } from '../types/task';

export interface CategoryMeta {
  label: TaskCategory;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // text color or subtle accent
}

export const CATEGORIES_LIST: TaskCategory[] = [
  'Work',
  'Study',
  'Research',
  'Exercise / Fitness',
  'Health',
  'Meetings',
  'Personal',
  'Shopping',
  'Household',
  'Other',
];

export const CATEGORY_META_MAP: Record<TaskCategory, CategoryMeta> = {
  Work: {
    label: 'Work',
    icon: Briefcase,
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  Study: {
    label: 'Study',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
  },
  Research: {
    label: 'Research',
    icon: FlaskConical,
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  'Exercise / Fitness': {
    label: 'Exercise / Fitness',
    icon: Dumbbell,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  Health: {
    label: 'Health',
    icon: HeartPulse,
    color: 'text-rose-600 dark:text-rose-400',
  },
  Meetings: {
    label: 'Meetings',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
  },
  Personal: {
    label: 'Personal',
    icon: User,
    color: 'text-violet-600 dark:text-violet-400',
  },
  Shopping: {
    label: 'Shopping',
    icon: ShoppingCart,
    color: 'text-amber-600 dark:text-amber-400',
  },
  Household: {
    label: 'Household',
    icon: Home,
    color: 'text-teal-600 dark:text-teal-400',
  },
  Other: {
    label: 'Other',
    icon: Compass,
    color: 'text-slate-600 dark:text-slate-400',
  },
};

export const PRIORITIES_LIST: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const PRIORITY_META_MAP: Record<TaskPriority, { label: string; textClass: string; borderClass: string; weight: number }> = {
  Low: {
    label: 'Low',
    textClass: 'text-slate-500 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-800',
    weight: 1,
  },
  Medium: {
    label: 'Medium',
    textClass: 'text-blue-600 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-900/40',
    weight: 2,
  },
  High: {
    label: 'High',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-900/40',
    weight: 3,
  },
  Urgent: {
    label: 'Urgent',
    textClass: 'text-rose-600 dark:text-rose-400 font-semibold',
    borderClass: 'border-rose-300 dark:border-rose-900/50',
    weight: 4,
  },
};
