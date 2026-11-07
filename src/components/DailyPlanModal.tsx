import React, { useState } from 'react';
import { X, Calendar, Plus, Clock, ArrowRight } from 'lucide-react';
import { Task, UserSettings } from '../types/task';
import { toDateString, formatTimeDisplay } from '../utils/timeUtils';

interface DailyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  settings: UserSettings;
  onOpenCreateTask: (targetDate: string) => void;
}

export const DailyPlanModal: React.FC<DailyPlanModalProps> = ({
  isOpen,
  onClose,
  tasks,
  settings,
  onOpenCreateTask,
}) => {
  const tomorrow = toDateString(new Date(Date.now() + 86400000));
  const [selectedDate, setSelectedDate] = useState(tomorrow);

  if (!isOpen) return null;

  const plannedTasks = tasks.filter((t) => t.date === selectedDate && t.status !== 'archived');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Plan Ahead</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Schedule activities for upcoming days in advance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="my-4 flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
          />
        </div>

        {/* Planned tasks for selected date */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {plannedTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium">No tasks scheduled for this day yet.</p>
              <p className="text-xs text-slate-400 mt-1">Get ahead by queuing your priority focus areas.</p>
            </div>
          ) : (
            plannedTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{t.title}</p>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeDisplay(t.startTime, settings.clockFormat)}</span>
                    <span>·</span>
                    <span>{t.category}</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {t.priority}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenCreateTask(selectedDate);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task for {selectedDate === tomorrow ? 'Tomorrow' : selectedDate}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
