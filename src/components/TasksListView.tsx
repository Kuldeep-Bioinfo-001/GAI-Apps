import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import { Task, UserSettings, TaskCategory, TaskPriority } from '../types/task';
import { TaskCard } from './TaskCard';
import { CATEGORIES_LIST, PRIORITIES_LIST } from '../utils/categoryTheme';
import {
  toDateString,
  formatFriendlyDate,
  timeStringToMinutes,
} from '../utils/timeUtils';

interface TasksListViewProps {
  tasks: Task[];
  settings: UserSettings;
  onOpenCreateTask: (defaultDate?: string) => void;
  onOpenQuickAdd: () => void;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDuplicateTask: (task: Task) => void;
  onSnoozeTask: (taskId: string, minutes: number) => void;
  onRescheduleTask: (task: Task, newDate: string, newTime?: string) => void;
  onStartFocus: (task: Task) => void;
}

type StatusTab = 'all' | 'pending' | 'completed';
type SortField = 'time' | 'priority' | 'title';

export const TasksListView: React.FC<TasksListViewProps> = ({
  tasks,
  settings,
  onOpenCreateTask,
  onOpenQuickAdd,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onSnoozeTask,
  onRescheduleTask,
  onStartFocus,
}) => {
  const todayStr = toDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<StatusTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('time');
  const [allDatesScope, setAllDatesScope] = useState(false);

  // Horizontal Quick Date selector dates (e.g. -2 days to +4 days)
  const dateCarousel: { dateStr: string; label: string; count: number }[] = [];
  for (let i = -2; i <= 4; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const dStr = toDateString(d);
    const dayTasksCount = tasks.filter((t) => t.date === dStr && t.status !== 'archived').length;
    dateCarousel.push({
      dateStr: dStr,
      label: formatFriendlyDate(dStr),
      count: dayTasksCount,
    });
  }

  // Filter & Sort tasks
  const filteredTasks = tasks.filter((t) => {
    if (t.status === 'archived') return false;

    // Date filter if not searching all dates
    if (!allDatesScope && !searchQuery.trim() && t.date !== selectedDate) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && t.category !== categoryFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) || false;
      const matchCat = t.category.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q) || false;
      const matchDate = t.date.includes(q);
      if (!matchTitle && !matchDesc && !matchCat && !matchNotes && !matchDate) {
        return false;
      }
    }

    return true;
  });

  // Sort
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'time') {
      // First by date if multi-date
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
    }
    if (sortBy === 'priority') {
      const pWeights = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const pendingCount = filteredTasks.filter((t) => t.status === 'pending').length;
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* 1. Date Scroller & Scope Toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Schedule Timeline
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllDatesScope(!allDatesScope)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                allDatesScope
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {allDatesScope ? 'Viewing All Dates' : 'Single Day View'}
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setAllDatesScope(false);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Horizontal Date Button Strip */}
        {!allDatesScope && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {dateCarousel.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[76px] py-2 px-3 rounded-2xl text-xs font-medium transition whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span
                    className={`font-mono text-[10px] mt-0.5 tabular-nums ${
                      isSelected ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {item.count} task{item.count === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Search, Status Tabs & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, category, notes, or date..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Add CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQuickAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Add</span>
            </button>

            <button
              onClick={() => onOpenCreateTask(selectedDate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Task</span>
            </button>
          </div>
        </div>

        {/* Interactive Filter Controls (Allowed buttons under Zero-Pill Standard §1.A) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['all', 'pending', 'completed'] as StatusTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 font-semibold rounded-lg transition capitalize ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab} {tab === 'pending' ? `(${pendingCount})` : tab === 'completed' ? `(${completedCount})` : ''}
              </button>
            ))}
          </div>

          {/* Category, Priority and Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Categories</option>
              {CATEGORIES_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES_LIST.map((p) => (
                <option key={p} value={p}>{p} Priority</option>
              ))}
            </select>

            {/* Sort Order */}
            <div className="flex items-center gap-1 pl-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="time">Sort: Time</option>
                <option value="priority">Sort: Priority</option>
                <option value="title">Sort: Title</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Task List Render */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No tasks matching filters
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No tasks found matching "${searchQuery}". Try adjusting your keywords.`
                : 'No tasks scheduled for this view. Create a new task or adjust your filters.'}
            </p>
            <button
              onClick={() => onOpenCreateTask(selectedDate)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Task</span>
            </button>
          </div>
        ) : (
          sortedTasks.map((task) => (
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
  );
};
