import { Task, TimeConflict } from '../types/task';

/**
 * Format a 24h HH:mm string according to 12h/24h preference
 */
export function formatTimeDisplay(timeStr: string, format: '12h' | '24h' = '12h'): string {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get Greeting based on current hour
 */
export function getTimeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 22) return 'Good Evening';
  return 'Good Night';
}

/**
 * Format date to standard YYYY-MM-DD
 */
export function toDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Friendly date label (e.g. "Today", "Tomorrow", "Yesterday", or "Tue, Nov 10")
 */
export function formatFriendlyDate(dateStr: string): string {
  const today = toDateString(new Date());
  const tomorrow = toDateString(new Date(Date.now() + 86400000));
  const yesterday = toDateString(new Date(Date.now() - 86400000));

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return dateStr;
}

/**
 * Full date header label (e.g. "Saturday, November 7, 2026")
 */
export function formatFullHeaderDate(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Convert YYYY-MM-DD and HH:mm to a Date object
 */
export function taskDateTimeToDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Convert time string HH:mm to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert minutes from midnight to HH:mm string
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Detect time conflicts for a task against an existing list of tasks
 */
export function detectTimeConflicts(
  targetDate: string,
  startTime: string,
  endTime: string | undefined,
  existingTasks: Task[],
  excludeTaskId?: string
): TimeConflict[] {
  if (!startTime) return [];
  const startMin = timeStringToMinutes(startTime);
  const endMin = endTime ? timeStringToMinutes(endTime) : startMin + 30; // default 30 min duration

  const conflicts: TimeConflict[] = [];

  const dayTasks = existingTasks.filter(
    (t) =>
      t.date === targetDate &&
      t.status !== 'archived' &&
      t.id !== excludeTaskId
  );

  for (const t of dayTasks) {
    if (!t.startTime) continue;
    const tStartMin = timeStringToMinutes(t.startTime);
    const tEndMin = t.endTime ? timeStringToMinutes(t.endTime) : tStartMin + 30;

    // Overlap condition: start1 < end2 AND start2 < end1
    if (startMin < tEndMin && tStartMin < endMin) {
      conflicts.push({
        conflictingTaskId: t.id,
        conflictingTaskTitle: t.title,
        startTime: t.startTime,
        endTime: t.endTime || minutesToTimeString(tStartMin + 30),
      });
    }
  }

  return conflicts;
}

/**
 * Suggest a free time slot on a given date (default 30-min duration)
 */
export function suggestNextFreeSlot(
  dateStr: string,
  existingTasks: Task[],
  preferredDurationMinutes = 30
): { startTime: string; endTime: string } | null {
  const dayTasks = existingTasks
    .filter((t) => t.date === dateStr && t.status !== 'archived')
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  // Search between 08:00 (480 min) and 20:00 (1200 min)
  const windowStart = 8 * 60;
  const windowEnd = 20 * 60;

  let currentCandidate = windowStart;

  // If date is today, start search from current hour/next half hour
  const todayStr = toDateString(new Date());
  if (dateStr === todayStr) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const roundedNow = Math.ceil(nowMin / 30) * 30;
    if (roundedNow > currentCandidate) {
      currentCandidate = roundedNow;
    }
  }

  while (currentCandidate + preferredDurationMinutes <= windowEnd) {
    const candidateEnd = currentCandidate + preferredDurationMinutes;
    const hasConflict = dayTasks.some((t) => {
      const tStart = timeStringToMinutes(t.startTime);
      const tEnd = t.endTime ? timeStringToMinutes(t.endTime) : tStart + 30;
      return currentCandidate < tEnd && tStart < candidateEnd;
    });

    if (!hasConflict) {
      return {
        startTime: minutesToTimeString(currentCandidate),
        endTime: minutesToTimeString(candidateEnd),
      };
    }

    currentCandidate += 30;
  }

  return null;
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task, now = new Date()): boolean {
  if (task.status === 'completed' || task.status === 'archived') return false;
  const taskDate = taskDateTimeToDate(task.date, task.startTime);
  // Add 15 minute grace period or use endTime
  const cutoffTime = task.endTime
    ? taskDateTimeToDate(task.date, task.endTime).getTime()
    : taskDate.getTime();
  return now.getTime() > cutoffTime;
}

/**
 * Calculate countdown string to a task
 */
export function getTaskCountdown(task: Task, now = new Date()): {
  label: string;
  isStartingSoon: boolean;
  isInProgress: boolean;
  isOverdue: boolean;
  diffSeconds: number;
} {
  const start = taskDateTimeToDate(task.date, task.startTime).getTime();
  const end = task.endTime
    ? taskDateTimeToDate(task.date, task.endTime).getTime()
    : start + 30 * 60 * 1000;
  const current = now.getTime();

  if (current >= start && current <= end) {
    const remaining = Math.max(0, Math.floor((end - current) / 1000));
    const mins = Math.floor(remaining / 60);
    return {
      label: mins > 0 ? `In progress (${mins}m left)` : 'Ending soon',
      isStartingSoon: false,
      isInProgress: true,
      isOverdue: false,
      diffSeconds: remaining,
    };
  }

  if (current > end) {
    return {
      label: 'Overdue',
      isStartingSoon: false,
      isInProgress: false,
      isOverdue: true,
      diffSeconds: Math.floor((current - end) / 1000),
    };
  }

  // Future
  const diffSec = Math.floor((start - current) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);

  let label = '';
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    label = `In ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    label = `In ${hours}h ${mins}m`;
  } else if (mins > 0) {
    label = `In ${mins} min${mins > 1 ? 's' : ''}`;
  } else {
    label = `In ${diffSec}s`;
  }

  return {
    label,
    isStartingSoon: diffSec <= 15 * 60, // within 15 minutes
    isInProgress: false,
    isOverdue: false,
    diffSeconds: diffSec,
  };
}
