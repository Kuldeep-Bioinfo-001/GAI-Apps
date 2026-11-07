import React, { useState, useEffect } from 'react';
import {
  Plus,
  Compass,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserSettings } from '../types/task';
import { formatTimeDisplay } from '../utils/timeUtils';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreateTask: () => void;
  onOpenQuickAdd: () => void;
  settings: UserSettings;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateTask,
  onOpenQuickAdd,
  settings,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const time24 = `${hours}:${minutes}`;
      const formatted = formatTimeDisplay(time24, settings.clockFormat);
      setCurrentTime(`${formatted}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.clockFormat]);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            DayPilot
          </span>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                currentTab === item.id
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
              {currentTab === item.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Live Clock, PWA Install & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live digital clock */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{currentTime || '00:00:00'}</span>
          </div>

          {/* In-App PWA Install Trigger */}
          <PWAInstallButton />

          {/* Quick Add icon trigger */}
          <button
            onClick={onOpenQuickAdd}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Quick Task Entry"
            aria-label="Quick Task Entry"
          >
            <Zap className="w-4 h-4 text-amber-500" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-600/20 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
