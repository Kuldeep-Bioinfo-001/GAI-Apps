import { Task, UserSettings } from '../types/task';
import { formatTimeDisplay, taskDateTimeToDate } from '../utils/timeUtils';

// Web Audio chime generator - creates a crisp, pleasant bell chime without external audio assets
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (err) {
    console.warn('AudioContext initialization failed', err);
  }
  return audioCtx;
}

export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Harmonic warm chime: Notes C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    const tones = [
      { freq: 523.25, time: 0, duration: 0.8, gain: 0.3 },
      { freq: 659.25, time: 0.12, duration: 0.8, gain: 0.25 },
      { freq: 783.99, time: 0.24, duration: 1.1, gain: 0.35 },
    ];

    tones.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Smooth attack & exponential decay
      gainNode.gain.setValueAtTime(0.0001, now + time);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration + 0.1);
    });
  } catch (e) {
    console.warn('Could not play notification chime', e);
  }
}

export function triggerVibration(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch {
      // Ignore vibration error on unsupported devices
    }
  }
}

export interface InAppAlert {
  id: string;
  taskId: string;
  task: Task;
  title: string;
  message: string;
  timestamp: number;
}

type AlertListener = (alert: InAppAlert) => void;
const alertListeners: Set<AlertListener> = new Set();

export function onInAppAlert(listener: AlertListener): () => void {
  alertListeners.add(listener);
  return () => {
    alertListeners.delete(listener);
  };
}

export function broadcastAlert(alert: InAppAlert): void {
  alertListeners.forEach((fn) => fn(alert));
}

// Track fired notification keys (e.g. `taskId_reminderMinutes`) to avoid duplicates in a session
const firedReminders = new Set<string>();

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Failed to request notification permission', err);
    return 'denied';
  }
}

/**
 * Check active tasks for due notifications
 */
export function checkAndFireTaskNotifications(tasks: Task[], settings: UserSettings): void {
  const now = Date.now();

  for (const task of tasks) {
    if (task.status !== 'pending' || !task.notificationEnabled) {
      continue;
    }

    // Check if task is currently snoozed
    if (task.snoozedUntil && task.snoozedUntil > now) {
      continue;
    }

    // Check if snooze expired within the last 45 seconds
    if (task.snoozedUntil && Math.abs(now - task.snoozedUntil) <= 45000) {
      const snoozeKey = `${task.id}_snooze_${task.snoozedUntil}`;
      if (!firedReminders.has(snoozeKey)) {
        firedReminders.add(snoozeKey);
        triggerNotification(
          task,
          `Snooze ended! It's time for "${task.title}".`,
          settings,
          0
        );
      }
      continue;
    }

    // Standard reminders
    const taskStartMs = taskDateTimeToDate(task.date, task.startTime).getTime();
    const reminders = task.reminderMinutes && task.reminderMinutes.length > 0
      ? task.reminderMinutes
      : [0];

    for (const minsBefore of reminders) {
      const reminderTargetMs = taskStartMs - minsBefore * 60 * 1000;
      // Fire if current time is within +/- 35 seconds of reminder time
      const timeDiff = now - reminderTargetMs;

      if (timeDiff >= -5000 && timeDiff <= 45000) {
        const reminderKey = `${task.id}_${minsBefore}_${task.date}_${task.startTime}`;
        if (!firedReminders.has(reminderKey)) {
          firedReminders.add(reminderKey);

          let message = '';
          const formattedTime = formatTimeDisplay(task.startTime, settings.clockFormat);
          if (minsBefore === 0) {
            message = `It's time! You should start "${task.title}" (${task.category}).`;
          } else {
            message = `Upcoming in ${minsBefore} minutes! Scheduled for ${formattedTime}.`;
          }

          triggerNotification(task, message, settings, minsBefore);
        }
      }
    }
  }
}

/**
 * Triggers both system notification and in-app banner/sound
 */
export function triggerNotification(
  task: Task,
  message: string,
  settings: UserSettings,
  minsBefore: number
): void {
  // 1. Play sound if enabled
  if (settings.soundEnabled) {
    playNotificationSound();
  }

  // 2. Vibrate if enabled
  if (settings.vibrationEnabled) {
    triggerVibration();
  }

  // 3. System Notification
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const title = minsBefore === 0 ? `Time to start: ${task.title}` : `Upcoming Task Reminder: ${task.title}`;
      const options: NotificationOptions = {
        body: message,
        icon: '/icon.svg',
        tag: `daypilot-${task.id}-${minsBefore}`,
        badge: '/icon.svg',
      };

      // Try ServiceWorker notification first for native mobile action buttons, fallback to window.Notification
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, options).catch(() => {
            new Notification(title, options);
          });
        }).catch(() => {
          new Notification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    } catch (err) {
      console.warn('System notification error', err);
    }
  }

  // 4. In-App alert
  broadcastAlert({
    id: `alert-${Date.now()}-${task.id}`,
    taskId: task.id,
    task,
    title: minsBefore === 0 ? 'Task Starting Now' : 'Upcoming Task Reminder',
    message,
    timestamp: Date.now(),
  });
}
