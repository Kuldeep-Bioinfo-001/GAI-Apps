import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Flame,
  Calendar,
} from 'lucide-react';
import { Task } from '../types/task';
import { CATEGORIES_LIST, CATEGORY_META_MAP } from '../utils/categoryTheme';
import { isTaskOverdue, toDateString } from '../utils/timeUtils';

interface AnalyticsViewProps {
  tasks: Task[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks }) => {
  const activeTasks = tasks.filter((t) => t.status !== 'archived');
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter((t) => t.status === 'completed');
  const pendingTasks = activeTasks.filter((t) => t.status === 'pending');
  const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t));

  const overallRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Last 7 days breakdown
  const last7Days: { dateStr: string; label: string; total: number; completed: number; rate: number }[] = [];
  const dayNameCounts: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dStr = toDateString(d);
    const dayTasks = activeTasks.filter((t) => t.date === dStr);
    const dayCompleted = dayTasks.filter((t) => t.status === 'completed').length;
    const rate = dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0;
    const label = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' });

    last7Days.push({
      dateStr: dStr,
      label,
      total: dayTasks.length,
      completed: dayCompleted,
      rate,
    });
  }

  // Count which day of the week has the most completed tasks
  completedTasks.forEach((t) => {
    const parts = t.date.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });
      if (dayNameCounts[dayName] !== undefined) {
        dayNameCounts[dayName]++;
      }
    }
  });

  let mostProductiveDay = 'Monday';
  let maxCompletedOnDay = -1;
  Object.entries(dayNameCounts).forEach(([day, count]) => {
    if (count > maxCompletedOnDay) {
      maxCompletedOnDay = count;
      mostProductiveDay = day;
    }
  });

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  CATEGORIES_LIST.forEach((cat) => {
    categoryCounts[cat] = 0;
  });
  activeTasks.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Scheduled
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {totalTasks}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Across active calendar
          </span>
        </div>

        {/* Completed */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed Tasks
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
            {completedTasks.length}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {overallRate}% completion rate
          </span>
        </div>

        {/* Pending */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Next
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-2">
            {pendingTasks.length}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Scheduled on docket
          </span>
        </div>

        {/* Overdue */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overdue Items
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-2">
            {overdueTasks.length}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Require attention / reschedule
          </span>
        </div>
      </div>

      {/* 2-Column Split: 7-Day Performance & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Completion Histogram */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">7-Day Completion Pace</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Last 7 Days
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-48 pt-6 pb-2">
              {last7Days.map((day) => {
                const heightPercent = day.total > 0 ? Math.min(100, Math.max(15, (day.completed / 6) * 100)) : 8;
                return (
                  <div key={day.dateStr} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono tabular-nums font-semibold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition">
                      {day.completed}/{day.total}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-36 flex items-end overflow-hidden p-0.5">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          day.rate >= 80
                            ? 'bg-emerald-500'
                            : day.rate >= 50
                            ? 'bg-indigo-500'
                            : day.total > 0
                            ? 'bg-amber-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Peak day: <strong className="text-slate-800 dark:text-slate-200">{mostProductiveDay}</strong></span>
            <span>Average completion: <strong className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{overallRate}%</strong></span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Category Distribution</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {sortedCategories.length} active
              </span>
            </div>

            <div className="space-y-3 pt-4">
              {sortedCategories.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No task categories tracked yet.
                </div>
              ) : (
                sortedCategories.slice(0, 5).map(([catName, count]) => {
                  const meta = CATEGORY_META_MAP[catName as keyof typeof CATEGORY_META_MAP];
                  const Icon = meta ? meta.icon : Clock;
                  const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;

                  return (
                    <div key={catName}>
                      <div className="flex items-center justify-between text-xs font-medium mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${meta?.color || ''}`} />
                          <span className="text-slate-700 dark:text-slate-200">{catName}</span>
                        </div>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {count} tasks ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Top focus: <strong className="text-slate-800 dark:text-slate-200">{sortedCategories[0]?.[0] || 'Work'}</strong></span>
            </span>
            <span className="font-mono text-slate-400">DayPilot Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
