export interface WorkingHoursDay {
  weekday: number; // 0=Sunday, 1=Monday ... 6=Saturday
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  enabled: boolean;
}

/**
 * Pure function to compute the SLA deadline.
 * - If workingHours is disabled or empty, computes 24x7: startTime + hours + pausedMs.
 * - If workingHours is enabled, only counts hours that fall within enabled working hour windows.
 */
export function computeSlaDueAt(
  startTime: Date,
  hours: number,
  workingHoursConfig?: WorkingHoursDay[],
  pausedIntervalsMs: number = 0
): Date {
  const isWorkingHoursActive =
    workingHoursConfig &&
    workingHoursConfig.length > 0 &&
    workingHoursConfig.some((d) => d.enabled);

  // If 24x7 mode (default): simple deterministic addition
  if (!isWorkingHoursActive) {
    const totalMs = hours * 60 * 60 * 1000 + pausedIntervalsMs;
    return new Date(startTime.getTime() + totalMs);
  }

  // Working hours mode: Step minute by minute through business windows
  let remainingMinutes = hours * 60 + Math.floor(pausedIntervalsMs / (60 * 1000));
  const current = new Date(startTime.getTime());

  // Safety break: max 365 days forward
  const maxIterations = 365 * 24 * 60;
  let iterations = 0;

  const dayMap = new Map<number, WorkingHoursDay>();
  for (const wh of workingHoursConfig!) {
    dayMap.set(wh.weekday, wh);
  }

  while (remainingMinutes > 0 && iterations < maxIterations) {
    iterations++;
    const weekday = current.getDay();
    const config = dayMap.get(weekday);

    if (config && config.enabled) {
      const [startHour, startMin] = config.startTime.split(':').map(Number);
      const [endHour, endMin] = config.endTime.split(':').map(Number);

      const curHour = current.getHours();
      const curMin = current.getMinutes();
      const curTimeVal = curHour * 60 + curMin;
      const startTimeVal = (startHour ?? 9) * 60 + (startMin ?? 0);
      const endTimeVal = (endHour ?? 18) * 60 + (endMin ?? 0);

      if (curTimeVal >= startTimeVal && curTimeVal < endTimeVal) {
        remainingMinutes--;
      }
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return current;
}
