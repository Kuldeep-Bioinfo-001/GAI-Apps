import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar as CalendarIcon,
  Bell,
  Repeat,
  AlertTriangle,
  Sparkles,
  AlignLeft,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority, RepeatFrequency } from '../types/task';
import {
  CATEGORIES_LIST,
  CATEGORY_META_MAP,
  PRIORITIES_LIST,
  PRIORITY_META_MAP,
} from '../utils/categoryTheme';
import {
  detectTimeConflicts,
  suggestNextFreeSlot,
  toDateString,
} from '../utils/timeUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task, isSeriesEdit?: boolean) => void;
  initialTask?: Task | null;
  defaultDate?: string;
  existingTasks: Task[];
}

const REMINDER_OPTIONS = [
  { label: 'At time', minutes: 0 },
  { label: '5m before', minutes: 5 },
  { label: '10m before', minutes: 10 },
  { label: '15m before', minutes: 15 },
  { label: '30m before', minutes: 30 },
  { label: '1h before', minutes: 60 },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultDate,
  existingTasks,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || toDateString());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([10]);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Populate form on edit
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setDate(initialTask.date);
      setStartTime(initialTask.startTime);
      setEndTime(initialTask.endTime || '');
      setCategory(initialTask.category);
      setPriority(initialTask.priority);
      setReminderMinutes(initialTask.reminderMinutes || [10]);
      setNotificationEnabled(initialTask.notificationEnabled);
      setRepeatFrequency(initialTask.repeatRule?.frequency || 'none');
      setRepeatDays(initialTask.repeatRule?.daysOfWeek || [1, 2, 3, 4, 5]);
      setNotes(initialTask.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate || toDateString());
      setStartTime('10:00');
      setEndTime('10:45');
      setCategory('Work');
      setPriority('Medium');
      setReminderMinutes([10]);
      setNotificationEnabled(true);
      setRepeatFrequency('none');
      setRepeatDays([1, 2, 3, 4, 5]);
      setNotes('');
    }
    setError(null);
  }, [initialTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  // Real-time conflict detection
  const conflicts = detectTimeConflicts(
    date,
    startTime,
    endTime || undefined,
    existingTasks,
    initialTask?.id
  );

  const toggleReminder = (mins: number) => {
    if (reminderMinutes.includes(mins)) {
      setReminderMinutes(reminderMinutes.filter((m) => m !== mins));
    } else {
      setReminderMinutes([...reminderMinutes, mins].sort((a, b) => b - a));
    }
  };

  const handleApplySuggestedSlot = () => {
    const slot = suggestNextFreeSlot(date, existingTasks, 45);
    if (slot) {
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!startTime) {
      setError('Start time is required');
      return;
    }

    const now = Date.now();
    const taskData: Task = {
      id: initialTask?.id || `task-${now}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime,
      endTime: endTime.trim() || undefined,
      category,
      priority,
      reminderMinutes: reminderMinutes.length > 0 ? reminderMinutes : [0],
      notificationEnabled,
      repeatRule:
        repeatFrequency !== 'none'
          ? {
              frequency: repeatFrequency,
              daysOfWeek: repeatFrequency === 'custom_days' ? repeatDays : undefined,
            }
          : undefined,
      status: initialTask?.status || 'pending',
      createdAt: initialTask?.createdAt || now,
      updatedAt: now,
      completedAt: initialTask?.completedAt,
      notes: notes.trim() || undefined,
    };

    onSave(taskData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialTask ? 'Edit Scheduled Task' : 'Schedule New Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Set priority, exact time, and automated reminder alerts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Work on API Specs"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, links, or objectives..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Time Conflict Alert & Smart Suggestion */}
          {conflicts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Schedule Conflict Detected
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Overlaps with: {conflicts.map((c) => `"${c.conflictingTaskTitle}" (${c.startTime} - ${c.endTime})`).join(', ')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplySuggestedSlot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suggest Next Free Slot</span>
              </button>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Category</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES_LIST.map((cat) => {
                const isSelected = category === cat;
                const meta = CATEGORY_META_MAP[cat];
                const Icon = meta.icon;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition text-left ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${meta.color} shrink-0`} />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES_LIST.map((p) => {
                const isSelected = priority === p;
                const meta = PRIORITY_META_MAP[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder & Notification Settings */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                  Reminders & Alerts
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={(e) => setNotificationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {notificationEnabled && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Select when you want to receive notifications (multi-select supported):
                </p>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OPTIONS.map((opt) => {
                    const isSelected = reminderMinutes.includes(opt.minutes);
                    return (
                      <button
                        key={opt.minutes}
                        type="button"
                        onClick={() => toggleReminder(opt.minutes)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Repeat Schedule */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              <span>Repeat Schedule</span>
            </label>
            <select
              value={repeatFrequency}
              onChange={(e) => setRepeatFrequency(e.target.value as RepeatFrequency)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Every day</option>
              <option value="weekday">Every weekday (Mon - Fri)</option>
              <option value="weekend">Every weekend (Sat - Sun)</option>
              <option value="weekly">Weekly on this day</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Task Notes</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional checklists, reference links, or notes..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialTask ? 'Save Changes' : 'Schedule Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
