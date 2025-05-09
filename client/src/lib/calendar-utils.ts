/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Gets the day of the week (0-6) that the first day of the month falls on
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Returns start and end dates for a given month and year
 */
export function getMonthRange(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const start = firstDay.toISOString().split('T')[0];
  const end = lastDay.toISOString().split('T')[0];
  
  return {
    start,
    end,
    year,
    month
  };
}

/**
 * Formats a date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
