import React, { useEffect, useState } from 'react';
import { Clock, Play, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { Task, UserSettings } from '../types/task';
import { CATEGORY_META_MAP, PRIORITY_META_MAP } from '../utils/categoryTheme';
import { formatTimeDisplay, getTaskCountdown } from '../utils/timeUtils';

interface NextTaskCardProps {
  task: Task | null;
  settings: UserSettings;
  onComplete: (task: Task) => void;
  onStartFocus: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onOpenNewTask: () => void;
}

export const NextTaskCard: React.FC<NextTaskCardProps> = ({
  task,
  settings,
  onComplete,
  onStartFocus,
  onOpenDetails,
  onOpenNewTask,
}) => {
  const [countdown, setCountdown] = useState<{
    label: string;
    isStartingSoon: boolean;
    isInProgress: boolean;
    isOverdue: boolean;
  }>({
    label: '',
    isStartingSoon: false,
    isInProgress: false,
    isOverdue: false,
  });

  useEffect(() => {
    if (!task) return;
    const update = () => {
      setCountdown(getTaskCountdown(task));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [task]);

  if (!task) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center bg-white/40 dark:bg-slate-900/40">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No upcoming scheduled tasks
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Your schedule for the rest of today is clear. Schedule your next priority or take a well-deserved break!
        </p>
        <button
          onClick={onOpenNewTask}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <span>Schedule Next Task</span>
        </button>
      </div>
    );
  }

  const catMeta = CATEGORY_META_MAP[task.category] || CATEGORY_META_MAP['Other'];
  const priorityMeta = PRIORITY_META_MAP[task.priority] || PRIORITY_META_MAP['Medium'];
  const CatIcon = catMeta.icon;

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Countdown & Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Next Scheduled Activity
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span
              className={`font-mono tabular-nums text-xs font-bold px-2 py-0.5 rounded-md ${
                countdown.isInProgress
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : countdown.isStartingSoon
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 animate-pulse'
                  : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {countdown.label || 'Upcoming'}
            </span>
          </div>

          <h3
            onClick={() => onOpenDetails(task)}
            className="text-lg font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            {task.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            <div className="flex items-center gap-1 font-mono font-medium text-slate-700 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatTimeDisplay(task.startTime, settings.clockFormat)}
                {task.endTime && ` – ${formatTimeDisplay(task.endTime, settings.clockFormat)}`}
              </span>
            </div>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <div className="flex items-center gap-1">
              <CatIcon className={`w-3.5 h-3.5 ${catMeta.color}`} />
              <span>{task.category}</span>
            </div>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className={priorityMeta.textClass}>{task.priority} Priority</span>
          </div>
        </div>

        {/* Right Side: Action CTA Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onStartFocus(task)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Focus</span>
          </button>

          <button
            onClick={() => onComplete(task)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 text-xs font-semibold transition border border-slate-200/80 dark:border-slate-700 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Mark Completed</span>
          </button>

          <button
            onClick={() => onOpenDetails(task)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="View task details"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
