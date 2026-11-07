import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
} from 'lucide-react';
import { Task, UserSettings } from '../types/task';
import { CATEGORY_META_MAP, PRIORITY_META_MAP } from '../utils/categoryTheme';
import {
  formatTimeDisplay,
  toDateString,
  timeStringToMinutes,
} from '../utils/timeUtils';

interface CalendarViewProps {
  tasks: Task[];
  settings: UserSettings;
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: (date: string) => void;
  onToggleComplete: (task: Task) => void;
}

type CalendarMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  settings,
  onSelectTask,
  onOpenCreateTask,
  onToggleComplete,
}) => {
  const [mode, setMode] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toDateString());

  const todayStr = toDateString();

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (mode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (mode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (mode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (mode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(toDateString(now));
  };

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Determine starting weekday offset based on weekStartDay
  let startDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday
  if (settings.weekStartDay === 1) {
    // Monday start
    startDayIndex = startDayIndex === 0 ? 6 : startDayIndex - 1;
  }

  const daysInMonth = lastDayOfMonth.getDate();

  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < startDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(new Date(year, month, d));
  }

  // Weekdays header
  const weekDays =
    settings.weekStartDay === 1
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current week calculations
  const getWeekDays = (baseDate: Date): Date[] => {
    const curr = new Date(baseDate);
    const day = curr.getDay();
    const diff = settings.weekStartDay === 1 ? (day === 0 ? -6 : 1 - day) : -day;
    curr.setDate(curr.getDate() + diff);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return week;
  };

  const currentWeekDays = getWeekDays(currentDate);

  // Selected date tasks
  const selectedDateTasks = tasks
    .filter((t) => t.date === selectedDateStr && t.status !== 'archived')
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        {/* Navigation & Month Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {currentDate.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </h2>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition ml-1"
          >
            Today
          </button>
        </div>

        {/* View Mode Segmented Control & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['month', 'week', 'day'] as CalendarMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition capitalize ${
                  mode === m
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenCreateTask(selectedDateStr)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Month View */}
      {mode === 'month' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map((wd) => (
              <div
                key={wd}
                className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((dateObj, idx) => {
              if (!dateObj) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/40 dark:bg-slate-950/20" />;
              }

              const dStr = toDateString(dateObj);
              const isToday = dStr === todayStr;
              const isSelected = dStr === selectedDateStr;
              const dayTasks = tasks.filter((t) => t.date === dStr && t.status !== 'archived');
              const completedCount = dayTasks.filter((t) => t.status === 'completed').length;

              return (
                <div
                  key={dStr}
                  onClick={() => setSelectedDateStr(dStr)}
                  className={`h-20 sm:h-24 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                      : isToday
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                        {completedCount}/{dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Micro task list */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[10px] truncate px-1 py-0.5 rounded font-medium ${
                          t.status === 'completed'
                            ? 'line-through text-slate-400 bg-slate-100 dark:bg-slate-800'
                            : 'text-indigo-700 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-900/40'
                        }`}
                      >
                        {t.startTime} {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] text-slate-400 pl-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Week View */}
      {mode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {currentWeekDays.map((d) => {
            const dStr = toDateString(d);
            const isToday = dStr === todayStr;
            const isSelected = dStr === selectedDateStr;
            const dayTasks = tasks
              .filter((t) => t.date === dStr && t.status !== 'archived')
              .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

            return (
              <div
                key={dStr}
                onClick={() => setSelectedDateStr(dStr)}
                className={`rounded-2xl border p-3 flex flex-col h-80 transition cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {d.toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                  <span
                    className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-0.5">
                  {dayTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-[11px]">
                      No tasks
                    </div>
                  ) : (
                    dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(t);
                        }}
                        className={`p-2 rounded-xl text-xs border transition ${
                          t.status === 'completed'
                            ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 line-through border-slate-200 dark:border-slate-800'
                            : 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {formatTimeDisplay(t.startTime, settings.clockFormat)}
                        </div>
                        <div className="font-semibold truncate mt-0.5">{t.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 3: Day View */}
      {mode === 'day' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hourly Schedule: {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 max-h-[500px] overflow-y-auto">
            {Array.from({ length: 16 }, (_, i) => i + 7).map((hour) => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              const hourTasks = selectedDateTasks.filter((t) => {
                const [h] = t.startTime.split(':').map(Number);
                return h === hour;
              });

              return (
                <div key={hour} className="py-2.5 flex items-start gap-4">
                  <div className="w-16 font-mono text-xs text-slate-400 dark:text-slate-500 pt-1 shrink-0 tabular-nums">
                    {formatTimeDisplay(hourStr, settings.clockFormat)}
                  </div>
                  <div className="flex-1 min-h-[36px] flex flex-wrap gap-2">
                    {hourTasks.map((t) => {
                      const catMeta = CATEGORY_META_MAP[t.category];
                      const CatIcon = catMeta ? catMeta.icon : Clock;
                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-medium cursor-pointer hover:border-indigo-400 transition"
                        >
                          <CatIcon className={`w-3.5 h-3.5 ${catMeta?.color || ''}`} />
                          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{t.title}</span>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {t.startTime} {t.endTime ? `- ${t.endTime}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Task Drawer / Summary List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Agenda for {selectedDateStr === todayStr ? 'Today' : selectedDateStr}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? '' : 's'} scheduled
            </p>
          </div>

          <button
            onClick={() => onOpenCreateTask(selectedDateStr)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to this date</span>
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No tasks scheduled for this day yet.
            </div>
          ) : (
            selectedDateTasks.map((t) => {
              const catMeta = CATEGORY_META_MAP[t.category];
              const CatIcon = catMeta ? catMeta.icon : Clock;
              const isCompleted = t.status === 'completed';

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(t)}
                      className={`min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center transition ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 dark:border-slate-600 text-transparent hover:text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="min-w-0">
                      <h4
                        onClick={() => onSelectTask(t)}
                        className={`text-xs font-semibold cursor-pointer truncate ${
                          isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white hover:text-indigo-600'
                        }`}
                      >
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <CatIcon className={`w-3 h-3 ${catMeta?.color || ''}`} />
                        <span>{formatTimeDisplay(t.startTime, settings.clockFormat)}</span>
                        <span>·</span>
                        <span>{t.priority}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTask(t)}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Edit
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
