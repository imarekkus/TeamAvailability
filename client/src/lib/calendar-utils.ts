/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Gets the day of the week (0-6) that the first day of the month falls on
 * Adjusted to start week on Monday (0 = Monday, 6 = Sunday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert from Sunday-based (0-6) to Monday-based (0-6)
  return day === 0 ? 6 : day - 1;
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
