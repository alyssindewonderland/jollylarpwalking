import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  addDays,
} from "date-fns";

export const GROUP_TIMEZONE = process.env.GROUP_TIMEZONE || "Europe/Rome";

/** "YYYY-MM-DD" for `when` (defaults to now) as a calendar date in the group's timezone. */
export function dateKey(when: Date = new Date(), tz: string = GROUP_TIMEZONE): string {
  return format(toZonedTime(when, tz), "yyyy-MM-dd");
}

export function todayKey(tz: string = GROUP_TIMEZONE): string {
  return dateKey(new Date(), tz);
}

export function yesterdayKey(tz: string = GROUP_TIMEZONE): string {
  return dateKey(subDays(new Date(), 1), tz);
}

/** Start-of-day instant (UTC Date object) for a given "YYYY-MM-DD" key in the group tz. */
export function startOfDateKey(key: string, tz: string = GROUP_TIMEZONE): Date {
  return fromZonedTime(`${key}T00:00:00`, tz);
}

/** Monday-Sunday week (ISO) containing `when`, as date keys, in the group tz. */
export function weekRange(when: Date = new Date(), tz: string = GROUP_TIMEZONE) {
  const zoned = toZonedTime(when, tz);
  const start = startOfWeek(zoned, { weekStartsOn: 1 });
  const end = endOfWeek(zoned, { weekStartsOn: 1 });
  return { startKey: format(start, "yyyy-MM-dd"), endKey: format(end, "yyyy-MM-dd") };
}

/** The most recently *completed* Mon-Sun week relative to `when`. */
export function previousWeekRange(when: Date = new Date(), tz: string = GROUP_TIMEZONE) {
  const zoned = toZonedTime(when, tz);
  const lastWeekAnchor = subDays(startOfWeek(zoned, { weekStartsOn: 1 }), 1);
  return weekRange(lastWeekAnchor, tz);
}

export function monthRange(when: Date = new Date(), tz: string = GROUP_TIMEZONE) {
  const zoned = toZonedTime(when, tz);
  const start = startOfMonth(zoned);
  const end = endOfMonth(zoned);
  return { startKey: format(start, "yyyy-MM-dd"), endKey: format(end, "yyyy-MM-dd") };
}

export function datesBetween(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  let cursor = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);
  while (cursor <= end) {
    out.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function isFutureDateKey(key: string, tz: string = GROUP_TIMEZONE): boolean {
  return key > todayKey(tz);
}

/** Current local hour (0-23) in the group timezone, for quiet-hours / scheduling checks. */
export function localHour(when: Date = new Date(), tz: string = GROUP_TIMEZONE): number {
  return Number(format(toZonedTime(when, tz), "H"));
}

export function isQuietHours(when: Date = new Date(), tz: string = GROUP_TIMEZONE): boolean {
  const h = localHour(when, tz);
  return h >= 23 || h < 8;
}
