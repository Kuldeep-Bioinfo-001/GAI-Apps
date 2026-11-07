import React from 'react';
import { X, CheckCircle2, AlertCircle, Clock, Calendar, ArrowRight, Award } from 'lucide-react';
import { Task, UserSettings } from '../types/task';
import { formatTimeDisplay, toDateString } from '../utils/timeUtils';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  settings: UserSettings;
  onRescheduleTask: (task: Task, newDate: string) => void;
  onCompleteTask: (task: Task) => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  isOpen,
  onClose,
  tasks,
  settings,
  onRescheduleTask,
  onCompleteTask,
}) => {
  if (!isOpen) return null;

  const today = toDateString();
  const todayTasks = tasks.filter((t) => t.date === today && t.status !== 'archived');
  const completed = todayTasks.filter((t) => t.status === 'completed');
  const unfinished = todayTasks.filter((t) => t.status === 'pending');
  const completionRate = todayTasks.length > 0 ? Math.round((completed.length / todayTasks.length) * 100) : 0;
  const tomorrow = toDateString(new Date(Date.now() + 86400000));

  const handleRescheduleAllToTomorrow = () => {
    unfinished.forEach((t) => onRescheduleTask(t, tomorrow));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Review</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reflect on today's progress & organize remaining items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress summary banner */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Completion Score</span>
            <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {completionRate}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {completed.length} of {todayTasks.length} tasks completed today
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block">
              {completed.length} Done
            </span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 block mt-0.5">
              {unfinished.length} Unfinished
            </span>
          </div>
        </div>

        {/* Unfinished tasks section */}
        {unfinished.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Unfinished Tasks ({unfinished.length})</span>
              </h4>
              <button
                onClick={handleRescheduleAllToTomorrow}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Move all to Tomorrow
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {unfinished.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</p>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeDisplay(t.startTime, settings.clockFormat)}</span>
                      <span>·</span>
                      <span>{t.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onCompleteTask(t)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => onRescheduleTask(t, tomorrow)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-xs transition"
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Outstanding work! All scheduled tasks are done.
            </p>
            <p className="text-xs mt-1">You have fully cleared today’s agenda.</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};
