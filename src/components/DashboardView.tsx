import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Award,
  Zap,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Task, UserSettings } from '../types/task';
import { TaskCard } from './TaskCard';
import { NextTaskCard } from './NextTaskCard';
import {
  getTimeOfDayGreeting,
  formatFullHeaderDate,
  toDateString,
  timeStringToMinutes,
  formatTimeDisplay,
  isTaskOverdue,
} from '../utils/timeUtils';

interface DashboardViewProps {
  tasks: Task[];
  settings: UserSettings;
  onOpenCreateTask: (defaultDate?: string) => void;
  onOpenQuickAdd: () => void;
  onOpenDailyPlan: () => void;
  onOpenDailyReview: () => void;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDuplicateTask: (task: Task) => void;
  onSnoozeTask: (taskId: string, minutes: number) => void;
  onRescheduleTask: (task: Task, newDate: string, newTime?: string) => void;
  onStartFocus: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  settings,
  onOpenCreateTask,
  onOpenQuickAdd,
  onOpenDailyPlan,
  onOpenDailyReview,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onSnoozeTask,
  onRescheduleTask,
  onStartFocus,
}) => {
  const [liveClock, setLiveClock] = useState('');
  const todayStr = toDateString();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      const formatted = formatTimeDisplay(`${h}:${m}`, settings.clockFormat);
      setLiveClock(`${formatted}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.clockFormat]);

  // Today's tasks in chronological order
  const todayTasks = tasks
    .filter((t) => t.date === todayStr && t.status !== 'archived')
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  const totalToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.status === 'completed');
  const pendingToday = todayTasks.filter((t) => t.status === 'pending');
  const overdueToday = todayTasks.filter((t) => isTaskOverdue(t));
  const completionPercent = totalToday > 0 ? Math.round((completedToday.length / totalToday) * 100) : 0;

  // Next upcoming task for today
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find the next task that hasn't been completed and whose end time hasn't passed
  const nextTask =
    pendingToday.find((t) => {
      const startMin = timeStringToMinutes(t.startTime);
      const endMin = t.endTime ? timeStringToMinutes(t.endTime) : startMin + 30;
      return endMin >= currentMinutes;
    }) || pendingToday[0] || null;

  const greeting = getTimeOfDayGreeting(now);

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Hero Header: Greeting, Live Clock & Daily Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>{greeting}, {settings.userName}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-400">{formatFullHeaderDate(now)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Today’s Mission Control
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            You have <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">{pendingToday.length} pending</strong> tasks scheduled today.
            Stay focused and let automated notifications keep you on pace.
          </p>
        </div>

        {/* Live Clock & Quick Workflow Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono tabular-nums text-xs font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>{liveClock || '00:00:00'}</span>
          </div>

          <button
            onClick={onOpenDailyPlan}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition"
            title="Plan Tomorrow"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Plan Ahead</span>
          </button>

          <button
            onClick={onOpenDailyReview}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
            title="Daily Review"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Review</span>
          </button>
        </div>
      </div>

      {/* 2. Daily Productivity Summary & Progress Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Daily Schedule Progress
            </h3>
          </div>
          <span className="font-mono tabular-nums text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
            {completionPercent}% Completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            style={{ width: `${completionPercent}%` }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
          />
        </div>

        {/* 4 Summary Metric Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Scheduled</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 block">
              {totalToday}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block">Completed</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {completedToday.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400 block">Pending</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {pendingToday.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400 block">Overdue</span>
            <span className="text-xl font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">
              {overdueToday.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Next Upcoming Task Hero Highlight */}
      <NextTaskCard
        task={nextTask}
        settings={settings}
        onComplete={onToggleComplete}
        onStartFocus={onStartFocus}
        onOpenDetails={onEditTask}
        onOpenNewTask={() => onOpenCreateTask(todayStr)}
      />

      {/* 4. Today's Full Chronological Schedule */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Today’s Chronological Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Arranged by start time · Auto-alert notifications enabled
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Entry</span>
            </button>

            <button
              onClick={() => onOpenCreateTask(todayStr)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Task</span>
            </button>
          </div>
        </div>

        {/* Task Cards List */}
        <div className="mt-5 space-y-3">
          {todayTasks.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 p-6">
              <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No tasks scheduled for today
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ready to organize your day? Schedule your first priority task with automated reminder notifications.
              </p>
              <button
                onClick={() => onOpenCreateTask(todayStr)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Task</span>
              </button>
            </div>
          ) : (
            todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                settings={settings}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onDuplicate={onDuplicateTask}
                onSnooze={onSnoozeTask}
                onReschedule={onRescheduleTask}
                onStartFocus={onStartFocus}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
