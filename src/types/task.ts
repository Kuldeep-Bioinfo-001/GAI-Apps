export type TaskCategory =
  | 'Personal'
  | 'Study'
  | 'Research'
  | 'Work'
  | 'Exercise / Fitness'
  | 'Health'
  | 'Meetings'
  | 'Shopping'
  | 'Household'
  | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'pending' | 'completed' | 'archived';

export type RepeatFrequency =
  | 'none'
  | 'daily'
  | 'weekday'
  | 'weekend'
  | 'weekly'
  | 'custom_days'
  | 'monthly';

export interface RepeatRule {
  frequency: RepeatFrequency;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endDate?: string; // YYYY-MM-DD
  endAfterOccurrences?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour format)
  endTime?: string; // HH:mm
  category: TaskCategory;
  priority: TaskPriority;
  reminderMinutes: number[]; // e.g. [0] for at time, [10] for 10 min before, [15, 0]
  notificationEnabled: boolean;
  repeatRule?: RepeatRule;
  recurringSeriesId?: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  notes?: string;
  tags?: string[];
  snoozedUntil?: number; // timestamp in ms
}

export interface UserSettings {
  userName: string;
  theme: 'light' | 'dark' | 'system';
  clockFormat: '12h' | '24h';
  defaultReminderMinutes: number[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultPriority: TaskPriority;
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  timezone: string;
  autoRescheduleOverdue: boolean;
}

export interface NotificationRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  scheduledForTime: number; // ms timestamp
  reminderMinutesBefore: number;
  delivered: boolean;
  deliveredAt?: number;
  message: string;
}

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  action: 'created' | 'updated' | 'completed' | 'uncompleted' | 'deleted' | 'rescheduled' | 'snoozed';
  timestamp: number;
  details?: string;
}

export interface TimeConflict {
  conflictingTaskId: string;
  conflictingTaskTitle: string;
  startTime: string;
  endTime: string;
}
