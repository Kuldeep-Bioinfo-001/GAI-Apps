import { Task, UserSettings, TaskHistoryEntry } from '../types/task';
import { toDateString } from '../utils/timeUtils';

const DB_NAME = 'daypilot_db';
const DB_VERSION = 1;
const TASKS_STORE = 'tasks';
const SETTINGS_STORE = 'settings';
const HISTORY_STORE = 'history';

const LOCAL_STORAGE_TASKS_KEY = 'daypilot_tasks_backup';
const LOCAL_STORAGE_SETTINGS_KEY = 'daypilot_settings_backup';
const LOCAL_STORAGE_HISTORY_KEY = 'daypilot_history_backup';

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Productive Pilot',
  theme: 'system',
  clockFormat: '12h',
  defaultReminderMinutes: [10],
  soundEnabled: true,
  vibrationEnabled: true,
  defaultPriority: 'Medium',
  weekStartDay: 1, // Monday
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  autoRescheduleOverdue: false,
};

function getSeedTasks(): Task[] {
  const today = toDateString(new Date());
  const tomorrow = toDateString(new Date(Date.now() + 86400000));
  const now = Date.now();

  return [
    {
      id: 'task-1',
      title: 'Review Daily Goals & Priority Inbox',
      description: 'Check priority items, clear unread notifications, and align today’s schedule.',
      date: today,
      startTime: '08:30',
      endTime: '09:00',
      category: 'Work',
      priority: 'High',
      reminderMinutes: [10],
      notificationEnabled: true,
      status: 'completed',
      createdAt: now - 3600000 * 5,
      updatedAt: now - 3600000 * 3,
      completedAt: now - 3600000 * 3,
      notes: 'All morning priorities aligned with team deliverables.',
    },
    {
      id: 'task-2',
      title: 'Study Machine Learning Architecture',
      description: 'Go through transformer attention layers and latent space representations.',
      date: today,
      startTime: '10:00',
      endTime: '11:30',
      category: 'Study',
      priority: 'Urgent',
      reminderMinutes: [15, 0],
      notificationEnabled: true,
      status: 'pending',
      createdAt: now - 3600000 * 4,
      updatedAt: now - 3600000 * 4,
      notes: 'Prepare notes for chapter 4 and write working test benchmarks.',
    },
    {
      id: 'task-3',
      title: 'Team Product Sync & Sprint Planning',
      description: 'Review milestone progress, unblock pipeline issues, and assign weekly sprints.',
      date: today,
      startTime: '13:00',
      endTime: '14:00',
      category: 'Meetings',
      priority: 'High',
      reminderMinutes: [10],
      notificationEnabled: true,
      status: 'pending',
      createdAt: now - 3600000 * 3,
      updatedAt: now - 3600000 * 3,
    },
    {
      id: 'task-4',
      title: 'Cardio & Strength Training Workout',
      description: '45-minute HIIT workout session followed by stretching and hydration.',
      date: today,
      startTime: '17:30',
      endTime: '18:30',
      category: 'Exercise / Fitness',
      priority: 'Medium',
      reminderMinutes: [30],
      notificationEnabled: true,
      status: 'pending',
      createdAt: now - 3600000 * 2,
      updatedAt: now - 3600000 * 2,
    },
    {
      id: 'task-5',
      title: 'Weekly Grocery Restock',
      description: 'Fresh fruits, vegetables, oats, almond milk, and pantry staples.',
      date: today,
      startTime: '19:00',
      endTime: '19:45',
      category: 'Shopping',
      priority: 'Low',
      reminderMinutes: [15],
      notificationEnabled: true,
      status: 'pending',
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
    },
    {
      id: 'task-6',
      title: 'Quarterly Research Synthesis',
      description: 'Compile findings from user study feedback and customer benchmark telemetry.',
      date: tomorrow,
      startTime: '09:30',
      endTime: '11:00',
      category: 'Research',
      priority: 'High',
      reminderMinutes: [15],
      notificationEnabled: true,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-7',
      title: 'Household Budget & Bills Review',
      description: 'Review subscription renewals, utilities, and monthly savings allocation.',
      date: tomorrow,
      startTime: '16:00',
      endTime: '16:45',
      category: 'Household',
      priority: 'Medium',
      reminderMinutes: [10],
      notificationEnabled: true,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        db.createObjectStore(TASKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load tasks from storage
 */
export async function loadTasks(): Promise<Task[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(TASKS_STORE, 'readonly');
    const store = tx.objectStore(TASKS_STORE);
    const request = store.getAll();

    return new Promise<Task[]>((resolve) => {
      request.onsuccess = () => {
        const result = request.result as Task[];
        if (result && result.length > 0) {
          // Sync to localStorage backup
          localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(result));
          resolve(result);
        } else {
          // Check localStorage fallback
          const backup = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
          if (backup) {
            try {
              const parsed = JSON.parse(backup);
              if (Array.isArray(parsed) && parsed.length > 0) {
                // save into indexedDB
                saveTasks(parsed);
                return resolve(parsed);
              }
            } catch {
              // ignore parse error
            }
          }
          // Pre-seed default tasks
          const seeds = getSeedTasks();
          saveTasks(seeds);
          resolve(seeds);
        }
      };
      request.onerror = () => {
        resolve(getTasksFromLocalStorageFallback());
      };
    });
  } catch {
    return getTasksFromLocalStorageFallback();
  }
}

function getTasksFromLocalStorageFallback(): Task[] {
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  const seeds = getSeedTasks();
  localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(seeds));
  return seeds;
}

/**
 * Save all tasks into storage
 */
export async function saveTasks(tasks: Task[]): Promise<void> {
  // Always update localStorage backup first
  try {
    localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // ignore quota error
  }

  try {
    const db = await openDB();
    const tx = db.transaction(TASKS_STORE, 'readwrite');
    const store = tx.objectStore(TASKS_STORE);
    store.clear();
    for (const task of tasks) {
      store.put(task);
    }
  } catch (err) {
    console.warn('Error saving to IndexedDB', err);
  }
}

/**
 * Load User Settings
 */
export async function loadSettings(): Promise<UserSettings> {
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (backup) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(backup) };
    }

    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const store = tx.objectStore(SETTINGS_STORE);
    const request = store.get('user_settings');

    return new Promise<UserSettings>((resolve) => {
      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_SETTINGS, ...request.result.value });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      request.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save User Settings
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }

  try {
    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    store.put({ key: 'user_settings', value: settings });
  } catch (err) {
    console.warn('Error saving settings to IndexedDB', err);
  }
}

/**
 * Load History
 */
export async function loadHistory(): Promise<TaskHistoryEntry[]> {
  try {
    const backup = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (backup) {
      return JSON.parse(backup);
    }

    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    const store = tx.objectStore(HISTORY_STORE);
    const request = store.getAll();

    return new Promise<TaskHistoryEntry[]>((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Append History Entry
 */
export async function addHistoryEntry(entry: Omit<TaskHistoryEntry, 'id' | 'timestamp'>): Promise<void> {
  const fullEntry: TaskHistoryEntry = {
    ...entry,
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  const current = await loadHistory();
  const updated = [fullEntry, ...current].slice(0, 100); // keep last 100 entries

  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  try {
    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    store.put(fullEntry);
  } catch (err) {
    console.warn('Error adding history entry', err);
  }
}

/**
 * Export tasks to JSON file download
 */
export function exportDataAsJSON(tasks: Task[], settings: UserSettings): void {
  const exportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings,
    tasks,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `daypilot_backup_${toDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Export tasks to CSV
 */
export function exportTasksAsCSV(tasks: Task[]): void {
  const headers = ['ID', 'Title', 'Description', 'Date', 'Start Time', 'End Time', 'Category', 'Priority', 'Status', 'Notes'];
  const rows = tasks.map((t) => [
    `"${t.id}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.date}"`,
    `"${t.startTime}"`,
    `"${t.endTime || ''}"`,
    `"${t.category}"`,
    `"${t.priority}"`,
    `"${t.status}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `daypilot_tasks_${toDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Clear all data from application
 */
export async function clearAllAppData(): Promise<void> {
  localStorage.removeItem(LOCAL_STORAGE_TASKS_KEY);
  localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY);
  localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);

  try {
    const db = await openDB();
    const tx = db.transaction([TASKS_STORE, SETTINGS_STORE, HISTORY_STORE], 'readwrite');
    tx.objectStore(TASKS_STORE).clear();
    tx.objectStore(SETTINGS_STORE).clear();
    tx.objectStore(HISTORY_STORE).clear();
  } catch (err) {
    console.warn('Error clearing IndexedDB', err);
  }
}
