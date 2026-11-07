import React, { useState } from 'react';
import {
  Check,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  AlertCircle,
  Bell,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, UserSettings } from '../types/task';
import { CATEGORY_META_MAP, PRIORITY_META_MAP } from '../utils/categoryTheme';
import { formatTimeDisplay, isTaskOverdue, toDateString } from '../utils/timeUtils';

interface TaskCardProps {
  task: Task;
  settings: UserSettings;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onSnooze: (taskId: string, minutes: number) => void;
  onReschedule: (task: Task, newDate: string, newTime?: string) => void;
  onStartFocus: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  settings,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
  onSnooze,
  onReschedule,
  onStartFocus,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && isTaskOverdue(task);
  const catMeta = CATEGORY_META_MAP[task.category] || CATEGORY_META_MAP['Other'];
  const priorityMeta = PRIORITY_META_MAP[task.priority] || PRIORITY_META_MAP['Medium'];
  const CatIcon = catMeta.icon;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#4F46E5', '#10B981', '#F59E0B', '#6366F1'],
        });
      } catch {
        // ignore
      }
    }
    onToggleComplete(task);
  };

  const handleSnoozeOption = (minutes: number) => {
    onSnooze(task.id, minutes);
    setShowMenu(false);
  };

  const handleRescheduleTomorrow = () => {
    const tomorrow = toDateString(new Date(Date.now() + 86400000));
    onReschedule(task, tomorrow);
    setShowMenu(false);
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-150 p-4 ${
        isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 opacity-80'
          : overdue
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Custom Circular Checkbox Touch Target */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          aria-label={isCompleted ? 'Mark pending' : 'Mark completed'}
          className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition shrink-0 ${
            isCompleted
              ? 'bg-emerald-600 text-white'
              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-600 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/50 text-transparent hover:text-indigo-600/30'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Task Core Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              onClick={() => onEdit(task)}
              className={`text-sm font-semibold truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h4>

            {/* Quick Actions & Menu */}
            <div className="relative flex items-center gap-1 shrink-0">
              {!isCompleted && (
                <button
                  type="button"
                  onClick={() => onStartFocus(task)}
                  className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-md transition"
                  title="Open in Focus Mode"
                >
                  <Eye className="w-3 h-3" />
                  <span>Focus</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-40 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(task);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Details</span>
                    </button>

                    {!isCompleted && (
                      <>
                        <button
                          onClick={() => handleSnoozeOption(10)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Snooze 10 min</span>
                        </button>
                        <button
                          onClick={handleRescheduleTomorrow}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Move to Tomorrow</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDuplicate(task);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duplicate Task</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(task.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Unboxed Metadata Row (Anti-Slop Zero-Pill Standard) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2.5">
            {/* Scheduled Time */}
            <div className="flex items-center gap-1 font-mono tabular-nums text-slate-700 dark:text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatTimeDisplay(task.startTime, settings.clockFormat)}
                {task.endTime && ` – ${formatTimeDisplay(task.endTime, settings.clockFormat)}`}
              </span>
            </div>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

            {/* Category */}
            <div className="flex items-center gap-1">
              <CatIcon className={`w-3.5 h-3.5 ${catMeta.color}`} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">{task.category}</span>
            </div>

            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

            {/* Priority */}
            <span className={`${priorityMeta.textClass}`}>
              {task.priority} Priority
            </span>

            {/* Reminder Status */}
            {task.notificationEnabled && task.reminderMinutes && task.reminderMinutes.length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Bell className="w-3 h-3 text-indigo-500" />
                  <span>
                    {task.reminderMinutes.includes(0) ? 'At start' : ''}
                    {task.reminderMinutes.filter(m => m > 0).map(m => `${m}m before`).join(', ')}
                  </span>
                </span>
              </>
            )}

            {/* Overdue Warning */}
            {overdue && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  <span>Overdue</span>
                </span>
              </>
            )}

            {/* Notes Toggle */}
            {task.notes && (
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:underline ml-auto font-medium"
              >
                <span>Notes</span>
                {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Expanded Task Notes */}
          {showNotes && task.notes && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
              {task.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
