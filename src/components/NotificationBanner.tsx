import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, Eye, X } from 'lucide-react';
import { InAppAlert, onInAppAlert } from '../services/notificationService';
import { Task } from '../types/task';
import { CATEGORY_META_MAP } from '../utils/categoryTheme';

interface NotificationBannerProps {
  onCompleteTask: (taskId: string) => void;
  onSnoozeTask: (taskId: string, minutes: number) => void;
  onOpenFocusMode: (task: Task) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onCompleteTask,
  onSnoozeTask,
  onOpenFocusMode,
}) => {
  const [alerts, setAlerts] = useState<InAppAlert[]>([]);

  useEffect(() => {
    const unsubscribe = onInAppAlert((alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 2)]); // Keep max 3 at a time
    });
    return unsubscribe;
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {alerts.map((alert) => {
        const catMeta = CATEGORY_META_MAP[alert.task.category];
        const CatIcon = catMeta ? catMeta.icon : Bell;

        return (
          <div
            key={alert.id}
            role="alert"
            className="pointer-events-auto bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xl rounded-2xl p-4 transition-all transform animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <CatIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <span>{alert.title}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-slate-500 dark:text-slate-400">{alert.task.startTime}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {alert.task.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {alert.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  onCompleteTask(alert.taskId);
                  dismissAlert(alert.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>

              <button
                onClick={() => {
                  onSnoozeTask(alert.taskId, 5);
                  dismissAlert(alert.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Snooze 5m</span>
              </button>

              <button
                onClick={() => {
                  onSnoozeTask(alert.taskId, 10);
                  dismissAlert(alert.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>10m</span>
              </button>

              <button
                onClick={() => {
                  onOpenFocusMode(alert.task);
                  dismissAlert(alert.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-medium transition ml-auto"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Focus</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
