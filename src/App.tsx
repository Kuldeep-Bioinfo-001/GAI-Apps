/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TasksListView } from './components/TasksListView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { TaskModal } from './components/TaskModal';
import { QuickTaskModal } from './components/QuickTaskModal';
import { FocusModeView } from './components/FocusModeView';
import { DailyReviewModal } from './components/DailyReviewModal';
import { DailyPlanModal } from './components/DailyPlanModal';
import { NotificationBanner } from './components/NotificationBanner';
import { OfflineIndicator } from './components/OfflineIndicator';

import { Task, UserSettings } from './types/task';
import {
  loadTasks,
  saveTasks,
  loadSettings,
  saveSettings,
  addHistoryEntry,
  DEFAULT_SETTINGS,
} from './services/storage';
import { checkAndFireTaskNotifications } from './services/notificationService';
import { generateRecurringOccurrences } from './utils/recurring';
import { toDateString } from './utils/timeUtils';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskDate, setDefaultTaskDate] = useState<string>(toDateString());

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [isDailyPlanOpen, setIsDailyPlanOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);

  // 1. Initial Load from IndexedDB
  useEffect(() => {
    async function init() {
      try {
        const [loadedTasks, loadedSettings] = await Promise.all([
          loadTasks(),
          loadSettings(),
        ]);
        setTasks(loadedTasks);
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Failed to load initial data', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // 2. Sync Theme with HTML element
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // 3. Automated Time-Based Notification Engine Loop
  useEffect(() => {
    if (isLoading || tasks.length === 0) return;

    // Run check immediately and then every 10 seconds
    checkAndFireTaskNotifications(tasks, settings);

    const interval = setInterval(() => {
      checkAndFireTaskNotifications(tasks, settings);
    }, 10000);

    return () => clearInterval(interval);
  }, [tasks, settings, isLoading]);

  // Task Mutations
  const handleSaveTask = useCallback(
    async (taskData: Task) => {
      let updatedList: Task[];
      const isExisting = tasks.some((t) => t.id === taskData.id);

      if (isExisting) {
        // Update existing task
        updatedList = tasks.map((t) => (t.id === taskData.id ? taskData : t));
        addHistoryEntry({
          taskId: taskData.id,
          taskTitle: taskData.title,
          action: 'updated',
          details: `Updated task schedule to ${taskData.date} at ${taskData.startTime}`,
        });
      } else {
        // New Task: generate recurring series if applicable
        if (taskData.repeatRule && taskData.repeatRule.frequency !== 'none') {
          const occurrences = generateRecurringOccurrences(taskData, 10);
          updatedList = [...occurrences, ...tasks];
        } else {
          updatedList = [taskData, ...tasks];
        }
        addHistoryEntry({
          taskId: taskData.id,
          taskTitle: taskData.title,
          action: 'created',
          details: `Scheduled for ${taskData.date} at ${taskData.startTime}`,
        });
      }

      setTasks(updatedList);
      await saveTasks(updatedList);
    },
    [tasks]
  );

  const handleToggleComplete = useCallback(
    async (task: Task) => {
      const willBeCompleted = task.status !== 'completed';
      const updated: Task = {
        ...task,
        status: willBeCompleted ? 'completed' : 'pending',
        completedAt: willBeCompleted ? Date.now() : undefined,
        updatedAt: Date.now(),
      };

      const updatedList = tasks.map((t) => (t.id === task.id ? updated : t));
      setTasks(updatedList);
      await saveTasks(updatedList);

      addHistoryEntry({
        taskId: task.id,
        taskTitle: task.title,
        action: willBeCompleted ? 'completed' : 'uncompleted',
        details: willBeCompleted ? 'Completed task on schedule' : 'Reopened task',
      });
    },
    [tasks]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      const target = tasks.find((t) => t.id === taskId);
      const updatedList = tasks.filter((t) => t.id !== taskId);
      setTasks(updatedList);
      await saveTasks(updatedList);

      if (target) {
        addHistoryEntry({
          taskId: target.id,
          taskTitle: target.title,
          action: 'deleted',
        });
      }
    },
    [tasks]
  );

  const handleDuplicateTask = useCallback(
    async (task: Task) => {
      const now = Date.now();
      const duplicate: Task = {
        ...task,
        id: `task-${now}-${Math.random().toString(36).slice(2, 7)}`,
        title: `${task.title} (Copy)`,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        completedAt: undefined,
      };

      const updatedList = [duplicate, ...tasks];
      setTasks(updatedList);
      await saveTasks(updatedList);

      addHistoryEntry({
        taskId: duplicate.id,
        taskTitle: duplicate.title,
        action: 'created',
        details: 'Duplicated from existing task',
      });
    },
    [tasks]
  );

  const handleSnoozeTask = useCallback(
    async (taskId: string, minutes: number) => {
      const snoozeUntil = Date.now() + minutes * 60 * 1000;
      const updatedList = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            snoozedUntil: snoozeUntil,
            updatedAt: Date.now(),
          };
        }
        return t;
      });

      setTasks(updatedList);
      await saveTasks(updatedList);

      const target = tasks.find((t) => t.id === taskId);
      if (target) {
        addHistoryEntry({
          taskId: target.id,
          taskTitle: target.title,
          action: 'snoozed',
          details: `Snoozed reminder for ${minutes} minutes`,
        });
      }
    },
    [tasks]
  );

  const handleRescheduleTask = useCallback(
    async (task: Task, newDate: string, newTime?: string) => {
      const updated: Task = {
        ...task,
        date: newDate,
        startTime: newTime || task.startTime,
        status: 'pending',
        snoozedUntil: undefined,
        updatedAt: Date.now(),
      };

      const updatedList = tasks.map((t) => (t.id === task.id ? updated : t));
      setTasks(updatedList);
      await saveTasks(updatedList);

      addHistoryEntry({
        taskId: task.id,
        taskTitle: task.title,
        action: 'rescheduled',
        details: `Moved to ${newDate} at ${updated.startTime}`,
      });
    },
    [tasks]
  );

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleImportData = async (importedTasks: Task[], importedSettings?: UserSettings) => {
    setTasks(importedTasks);
    await saveTasks(importedTasks);
    if (importedSettings) {
      setSettings(importedSettings);
      await saveSettings(importedSettings);
    }
  };

  const handleClearData = () => {
    setTasks([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleOpenCreateModal = (defaultDate?: string) => {
    setDefaultTaskDate(defaultDate || toDateString());
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider mt-4">
          Initializing DayPilot Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Interactive In-App Notification Alerts Banner with Web Audio chime */}
      <NotificationBanner
        onCompleteTask={(taskId) => {
          const t = tasks.find((item) => item.id === taskId);
          if (t) handleToggleComplete(t);
        }}
        onSnoozeTask={handleSnoozeTask}
        onOpenFocusMode={(task) => setFocusTask(task)}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Header conforming to Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCreateTask={() => handleOpenCreateModal()}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        settings={settings}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            settings={settings}
            onOpenCreateTask={handleOpenCreateModal}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onOpenDailyPlan={() => setIsDailyPlanOpen(true)}
            onOpenDailyReview={() => setIsDailyReviewOpen(true)}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
            onDuplicateTask={handleDuplicateTask}
            onSnoozeTask={handleSnoozeTask}
            onRescheduleTask={handleRescheduleTask}
            onStartFocus={(task) => setFocusTask(task)}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksListView
            tasks={tasks}
            settings={settings}
            onOpenCreateTask={handleOpenCreateModal}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
            onDuplicateTask={handleDuplicateTask}
            onSnoozeTask={handleSnoozeTask}
            onRescheduleTask={handleRescheduleTask}
            onStartFocus={(task) => setFocusTask(task)}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            settings={settings}
            onSelectTask={handleOpenEditModal}
            onOpenCreateTask={handleOpenCreateModal}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {currentTab === 'analytics' && <AnalyticsView tasks={tasks} />}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            tasks={tasks}
            onUpdateSettings={handleUpdateSettings}
            onImportData={handleImportData}
            onClearData={handleClearData}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Modals & Dialogs */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultDate={defaultTaskDate}
        existingTasks={tasks}
      />

      <QuickTaskModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleSaveTask}
        existingTasks={tasks}
      />

      <DailyPlanModal
        isOpen={isDailyPlanOpen}
        onClose={() => setIsDailyPlanOpen(false)}
        tasks={tasks}
        settings={settings}
        onOpenCreateTask={handleOpenCreateModal}
      />

      <DailyReviewModal
        isOpen={isDailyReviewOpen}
        onClose={() => setIsDailyReviewOpen(false)}
        tasks={tasks}
        settings={settings}
        onRescheduleTask={handleRescheduleTask}
        onCompleteTask={handleToggleComplete}
      />

      {/* Focus Mode Fullscreen View */}
      {focusTask && (
        <FocusModeView
          task={focusTask}
          settings={settings}
          onExit={() => setFocusTask(null)}
          onCompleteTask={(taskId) => {
            const t = tasks.find((item) => item.id === taskId);
            if (t) handleToggleComplete(t);
          }}
        />
      )}
    </div>
  );
}
