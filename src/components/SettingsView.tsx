import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Volume2,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  Trash2,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';
import { Task, UserSettings, TaskPriority } from '../types/task';
import {
  playNotificationSound,
  requestNotificationPermission,
  getNotificationPermission,
  triggerNotification,
} from '../services/notificationService';
import {
  exportDataAsJSON,
  exportTasksAsCSV,
  clearAllAppData,
} from '../services/storage';

interface SettingsViewProps {
  settings: UserSettings;
  tasks: Task[];
  onUpdateSettings: (newSettings: UserSettings) => void;
  onImportData: (tasks: Task[], settings?: UserSettings) => void;
  onClearData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  tasks,
  onUpdateSettings,
  onImportData,
  onClearData,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [theme, setTheme] = useState(settings.theme);
  const [clockFormat, setClockFormat] = useState(settings.clockFormat);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled);
  const [defaultPriority, setDefaultPriority] = useState<TaskPriority>(settings.defaultPriority);
  const [weekStartDay, setWeekStartDay] = useState<0 | 1>(settings.weekStartDay);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(getNotificationPermission());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (updated: Partial<UserSettings>) => {
    const next: UserSettings = {
      ...settings,
      userName,
      theme,
      clockFormat,
      soundEnabled,
      vibrationEnabled,
      defaultPriority,
      weekStartDay,
      timezone,
      ...updated,
    };
    onUpdateSettings(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm);
  };

  const handleTestNotification = () => {
    if (soundEnabled) {
      playNotificationSound();
    }
    const testTask: Task = {
      id: 'test-task',
      title: 'DayPilot Test Notification',
      date: new Date().toISOString().slice(0, 10),
      startTime: 'Now',
      category: 'Work',
      priority: 'High',
      reminderMinutes: [0],
      notificationEnabled: true,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    triggerNotification(
      testTask,
      'Your time-based reminder notifications and sound system are working properly!',
      settings,
      0
    );
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          onImportData(parsed.tasks, parsed.settings);
          alert(`Successfully restored ${parsed.tasks.length} tasks!`);
        } else if (Array.isArray(parsed)) {
          onImportData(parsed);
          alert(`Successfully imported ${parsed.length} tasks!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl space-y-6">
      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Preferences saved successfully!</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">User Profile</h3>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 min-w-32">
            Display Name:
          </label>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
            <button
              onClick={() => handleSave({ userName })}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Notifications & Sound Center */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scheduled Notification Engine</h3>
          </div>
          <span className="text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400">
            Permission: {permissionStatus}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Browser Notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive system banners on desktop and mobile when task reminders strike.
              </p>
            </div>
            {permissionStatus !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                Grant Permission
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Granted</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Harmonic Audio Chime</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthesized Web Audio bell chime (zero latency, works 100% offline).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => {
                  setSoundEnabled(e.target.checked);
                  handleSave({ soundEnabled: e.target.checked });
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Haptic Vibration</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tactile feedback vibration on compatible mobile devices.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => {
                  setVibrationEnabled(e.target.checked);
                  handleSave({ vibrationEnabled: e.target.checked });
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              onClick={handleTestNotification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Chime & Notification</span>
            </button>
          </div>
        </div>
      </div>

      {/* Display & Time Preferences */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Display & Time Preferences</h3>
        </div>

        {/* Theme mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Application Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose between light, dark, or system preference</p>
          </div>
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Laptop },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setTheme(id as any);
                  handleSave({ theme: id as any });
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  theme === id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clock Format */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Clock Display Format</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">12-hour (e.g. 02:30 PM) or 24-hour (e.g. 14:30)</p>
          </div>
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['12h', '24h'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setClockFormat(fmt);
                  handleSave({ clockFormat: fmt });
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg font-mono transition ${
                  clockFormat === fmt
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Week Start Day */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Week Starts On</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">First day column displayed in calendar views</p>
          </div>
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { val: 1, label: 'Monday' },
              { val: 0, label: 'Sunday' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => {
                  setWeekStartDay(val as 0 | 1);
                  handleSave({ weekStartDay: val as 0 | 1 });
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  weekStartDay === val
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Local Timezone</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{timezone}</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-400">Auto-detected</span>
        </div>
      </div>

      {/* Data Backup, Export & Restore */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Backup & Export</h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          DayPilot stores all your schedules locally on your device with IndexedDB persistence. You can export backups anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => exportDataAsJSON(tasks, settings)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            onClick={() => exportTasksAsCSV(tasks)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Tasks (CSV)</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore from JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>

        {/* Clear Data */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Application Data</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
              <p className="font-semibold text-rose-800 dark:text-rose-200">
                Are you sure? This will delete all tasks and reset preferences.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await clearAllAppData();
                    onClearData();
                    setShowClearConfirm(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
