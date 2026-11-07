import { Task, RepeatRule } from '../types/task';
import { toDateString } from './timeUtils';

/**
 * Generate upcoming task occurrences for a recurring task rule
 */
export function generateRecurringOccurrences(baseTask: Task, count = 7): Task[] {
  if (!baseTask.repeatRule || baseTask.repeatRule.frequency === 'none') {
    return [baseTask];
  }

  const occurrences: Task[] = [{ ...baseTask }];
  const seriesId = baseTask.recurringSeriesId || baseTask.id;
  baseTask.recurringSeriesId = seriesId;

  const [y, m, d] = baseTask.date.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);
  const freq = baseTask.repeatRule.frequency;

  let added = 1;
  let offsetDay = 1;

  while (added < count && offsetDay <= 60) {
    const candidate = new Date(baseDate);
    candidate.setDate(candidate.getDate() + offsetDay);
    const dayOfWeek = candidate.getDay(); // 0 is Sunday, 1 is Monday
    let shouldInclude = false;

    if (freq === 'daily') {
      shouldInclude = true;
    } else if (freq === 'weekday') {
      shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (freq === 'weekend') {
      shouldInclude = dayOfWeek === 0 || dayOfWeek === 6;
    } else if (freq === 'weekly') {
      shouldInclude = offsetDay % 7 === 0;
    } else if (freq === 'monthly') {
      shouldInclude = candidate.getDate() === baseDate.getDate();
    } else if (freq === 'custom_days' && baseTask.repeatRule.daysOfWeek) {
      shouldInclude = baseTask.repeatRule.daysOfWeek.includes(dayOfWeek);
    }

    if (shouldInclude) {
      const occurrenceDate = toDateString(candidate);
      occurrences.push({
        ...baseTask,
        id: `${seriesId}_occ_${occurrenceDate}`,
        date: occurrenceDate,
        recurringSeriesId: seriesId,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        completedAt: undefined,
      });
      added++;
    }

    offsetDay++;
  }

  return occurrences;
}
