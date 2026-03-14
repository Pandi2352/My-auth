/**
 * DateHelper - A comprehensive utility class for date manipulation and calculations.
 *
 * Provides utilities for:
 * - Timezone conversions
 * - Date arithmetic (add/subtract days, months, years)
 * - Date comparisons
 * - Date formatting
 * - Date difference calculations
 * - Business day calculations
 *
 * @example
 * ```typescript
 * const dateHelper = DateHelper.Instance;
 *
 * // Get current date in specific timezone
 * const istDate = dateHelper.getCurrentLocalDate();
 *
 * // Add days to a date
 * const futureDate = dateHelper.addDays(new Date(), 7);
 *
 * // Calculate difference in months
 * const months = dateHelper.getDiffInMonths(startDate, endDate);
 * ```
 */
export class DateHelper {
    private static _instance: DateHelper;

    // Constants for time calculations
    private static readonly MS_PER_SECOND = 1000;
    private static readonly MS_PER_MINUTE = 60 * 1000;
    private static readonly MS_PER_HOUR = 60 * 60 * 1000;
    private static readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

    /**
     * Get the singleton instance of DateHelper
     */
    static get Instance() {
        if (!this._instance) {
            this._instance = new DateHelper();
        }
        return this._instance;
    }

    /**
     * Convert a date to a specific timezone.
     *
     * @param target_date - The date to convert
     * @param timeZone - IANA timezone string (default: 'Asia/Kolkata')
     * @returns Date object in the specified timezone
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-01T12:00:00Z');
     * const istDate = dateHelper.getLocalDate(date, 'Asia/Kolkata');
     * const estDate = dateHelper.getLocalDate(date, 'America/New_York');
     * ```
     */
    getLocalDate(target_date: Date, timeZone = 'Asia/Kolkata'): Date {
        const ist_end_date_string = target_date.toLocaleString("en-US", { timeZone: timeZone })
        return new Date(ist_end_date_string);
    }

    /**
     * Get the current date in the default timezone (Asia/Kolkata).
     *
     * @returns Current date in Asia/Kolkata timezone
     *
     * @example
     * ```typescript
     * const currentIST = dateHelper.getCurrentLocalDate();
     * console.log(currentIST);
     * ```
     */
    getCurrentLocalDate(): Date {
        return this.getLocalDate(new Date());
    }

    /**
     * Set time to start of day (00:00:00.000).
     *
     * **WARNING**: This method mutates the input date object.
     * Use `getStartDateImmutable()` for a non-mutating version.
     *
     * @param date - The date to modify (will be mutated)
     * @returns The same date object with time set to 00:00:00.000
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T14:30:00');
     * dateHelper.getStartDate(date);
     * console.log(date); // 2024-01-15T00:00:00.000
     * ```
     */
    getStartDate(date: Date): Date {
        date.setHours(0, 0, 0, 0);
        return date;
    }

    /**
     * Set time to end of day (23:59:59.999).
     *
     * **WARNING**: This method mutates the input date object.
     * Use `getEndDateImmutable()` for a non-mutating version.
     *
     * @param date - The date to modify (will be mutated)
     * @returns The same date object with time set to 23:59:59.999
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T14:30:00');
     * dateHelper.getEndDate(date);
     * console.log(date); // 2024-01-15T23:59:59.999
     * ```
     */
    getEndDate(date: Date): Date {
        date.setHours(23, 59, 59, 999);
        return date;
    }

    /**
     * Get start of day without mutating the original date.
     *
     * @param date - The date to use (will not be modified)
     * @returns New date object with time set to 00:00:00.000
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T14:30:00');
     * const startDate = dateHelper.getStartDateImmutable(date);
     * console.log(date);      // 2024-01-15T14:30:00 (unchanged)
     * console.log(startDate); // 2024-01-15T00:00:00.000
     * ```
     */
    getStartDateImmutable(date: Date): Date {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    }

    /**
     * Get end of day without mutating the original date.
     *
     * @param date - The date to use (will not be modified)
     * @returns New date object with time set to 23:59:59.999
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T14:30:00');
     * const endDate = dateHelper.getEndDateImmutable(date);
     * console.log(date);    // 2024-01-15T14:30:00 (unchanged)
     * console.log(endDate); // 2024-01-15T23:59:59.999
     * ```
     */
    getEndDateImmutable(date: Date): Date {
        const newDate = new Date(date);
        newDate.setHours(23, 59, 59, 999);
        return newDate;
    }

    /**
     * Calculate the difference between two dates in days.
     *
     * @param start_date - Start date
     * @param end_date - End date
     * @returns Number of days between the dates (can be fractional)
     *
     * @example
     * ```typescript
     * const start = new Date('2024-01-01');
     * const end = new Date('2024-01-08');
     * const days = dateHelper.getDiffInDays(start, end);
     * console.log(days); // 7
     * ```
     */
    getDiffInDays(start_date: Date, end_date: Date): number {
        const dif = end_date.getTime() - start_date.getTime();
        const days = dif / DateHelper.MS_PER_DAY;
        return days;
    }

    /**
     * Calculate the difference between two dates in months.
     *
     * This method calculates the calendar month difference, taking into account
     * the year and month values.
     *
     * @param start_date - Start date
     * @param end_date - End date
     * @returns Number of months between the dates
     *
     * @example
     * ```typescript
     * const start = new Date('2024-01-15');
     * const end = new Date('2024-04-15');
     * const months = dateHelper.getDiffInMonths(start, end);
     * console.log(months); // 3
     * ```
     */
    getDiffInMonths(start_date: Date, end_date: Date): number {
        const yearDiff = end_date.getFullYear() - start_date.getFullYear();
        const monthDiff = end_date.getMonth() - start_date.getMonth();
        return yearDiff * 12 + monthDiff;
    }

    /**
     * Calculate the difference between two dates in hours.
     *
     * @param start_date - Start date
     * @param end_date - End date
     * @returns Number of hours between the dates (can be fractional)
     *
     * @example
     * ```typescript
     * const start = new Date('2024-01-01T10:00:00');
     * const end = new Date('2024-01-01T15:30:00');
     * const hours = dateHelper.getDiffInHours(start, end);
     * console.log(hours); // 5.5
     * ```
     */
    getDiffInHours(start_date: Date, end_date: Date): number {
        const dif = end_date.getTime() - start_date.getTime();
        return dif / DateHelper.MS_PER_HOUR;
    }

    /**
     * Calculate the difference between two dates in minutes.
     *
     * @param start_date - Start date
     * @param end_date - End date
     * @returns Number of minutes between the dates (can be fractional)
     *
     * @example
     * ```typescript
     * const start = new Date('2024-01-01T10:00:00');
     * const end = new Date('2024-01-01T10:45:30');
     * const minutes = dateHelper.getDiffInMinutes(start, end);
     * console.log(minutes); // 45.5
     * ```
     */
    getDiffInMinutes(start_date: Date, end_date: Date): number {
        const dif = end_date.getTime() - start_date.getTime();
        return dif / DateHelper.MS_PER_MINUTE;
    }

    /**
     * Calculate the difference between two dates in seconds.
     *
     * @param start_date - Start date
     * @param end_date - End date
     * @returns Number of seconds between the dates (can be fractional)
     *
     * @example
     * ```typescript
     * const start = new Date('2024-01-01T10:00:00');
     * const end = new Date('2024-01-01T10:00:45');
     * const seconds = dateHelper.getDiffInSeconds(start, end);
     * console.log(seconds); // 45
     * ```
     */
    getDiffInSeconds(start_date: Date, end_date: Date): number {
        const dif = end_date.getTime() - start_date.getTime();
        return dif / DateHelper.MS_PER_SECOND;
    }

    /**
     * Add a specified number of days to a date.
     *
     * @param date - The starting date (will not be modified)
     * @param days - Number of days to add (can be negative to subtract)
     * @returns New date with days added
     *
     * @example
     * ```typescript
     * const today = new Date('2024-01-15');
     * const nextWeek = dateHelper.addDays(today, 7);
     * const lastWeek = dateHelper.addDays(today, -7);
     * ```
     */
    addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Add a specified number of months to a date.
     *
     * @param date - The starting date (will not be modified)
     * @param months - Number of months to add (can be negative to subtract)
     * @returns New date with months added
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-31');
     * const future = dateHelper.addMonths(date, 3); // 2024-04-30
     * const past = dateHelper.addMonths(date, -2);  // 2023-11-30
     * ```
     */
    addMonths(date: Date, months: number): Date {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    /**
     * Add a specified number of years to a date.
     *
     * @param date - The starting date (will not be modified)
     * @param years - Number of years to add (can be negative to subtract)
     * @returns New date with years added
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15');
     * const future = dateHelper.addYears(date, 5);  // 2029-01-15
     * const past = dateHelper.addYears(date, -10);  // 2014-01-15
     * ```
     */
    addYears(date: Date, years: number): Date {
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        return result;
    }

    /**
     * Add a specified number of hours to a date.
     *
     * @param date - The starting date (will not be modified)
     * @param hours - Number of hours to add (can be negative to subtract)
     * @returns New date with hours added
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T10:00:00');
     * const future = dateHelper.addHours(date, 5);  // 2024-01-15T15:00:00
     * ```
     */
    addHours(date: Date, hours: number): Date {
        const result = new Date(date);
        result.setTime(result.getTime() + (hours * DateHelper.MS_PER_HOUR));
        return result;
    }

    /**
     * Add a specified number of minutes to a date.
     *
     * @param date - The starting date (will not be modified)
     * @param minutes - Number of minutes to add (can be negative to subtract)
     * @returns New date with minutes added
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T10:00:00');
     * const future = dateHelper.addMinutes(date, 30);  // 2024-01-15T10:30:00
     * ```
     */
    addMinutes(date: Date, minutes: number): Date {
        const result = new Date(date);
        result.setTime(result.getTime() + (minutes * DateHelper.MS_PER_MINUTE));
        return result;
    }

    /**
     * Check if the first date is before the second date.
     *
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if date1 is before date2
     *
     * @example
     * ```typescript
     * const earlier = new Date('2024-01-01');
     * const later = new Date('2024-12-31');
     * console.log(dateHelper.isBefore(earlier, later)); // true
     * ```
     */
    isBefore(date1: Date, date2: Date): boolean {
        return date1.getTime() < date2.getTime();
    }

    /**
     * Check if the first date is after the second date.
     *
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if date1 is after date2
     *
     * @example
     * ```typescript
     * const earlier = new Date('2024-01-01');
     * const later = new Date('2024-12-31');
     * console.log(dateHelper.isAfter(later, earlier)); // true
     * ```
     */
    isAfter(date1: Date, date2: Date): boolean {
        return date1.getTime() > date2.getTime();
    }

    /**
     * Check if two dates represent the same moment in time.
     *
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if dates are the same
     *
     * @example
     * ```typescript
     * const date1 = new Date('2024-01-15T10:00:00Z');
     * const date2 = new Date('2024-01-15T10:00:00Z');
     * console.log(dateHelper.isSame(date1, date2)); // true
     * ```
     */
    isSame(date1: Date, date2: Date): boolean {
        return date1.getTime() === date2.getTime();
    }

    /**
     * Check if two dates are on the same calendar day (ignoring time).
     *
     * @param date1 - First date
     * @param date2 - Second date
     * @returns True if dates are on the same day
     *
     * @example
     * ```typescript
     * const date1 = new Date('2024-01-15T10:00:00');
     * const date2 = new Date('2024-01-15T22:30:00');
     * console.log(dateHelper.isSameDay(date1, date2)); // true
     * ```
     */
    isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    /**
     * Check if a date falls between two other dates (inclusive).
     *
     * @param date - Date to check
     * @param start - Start of range
     * @param end - End of range
     * @returns True if date is between start and end (inclusive)
     *
     * @example
     * ```typescript
     * const date = new Date('2024-06-15');
     * const start = new Date('2024-01-01');
     * const end = new Date('2024-12-31');
     * console.log(dateHelper.isBetween(date, start, end)); // true
     * ```
     */
    isBetween(date: Date, start: Date, end: Date): boolean {
        const timestamp = date.getTime();
        return timestamp >= start.getTime() && timestamp <= end.getTime();
    }

    /**
     * Check if a date falls on a weekend (Saturday or Sunday).
     *
     * @param date - Date to check
     * @returns True if date is Saturday (6) or Sunday (0)
     *
     * @example
     * ```typescript
     * const saturday = new Date('2024-01-13'); // Saturday
     * const monday = new Date('2024-01-15');   // Monday
     * console.log(dateHelper.isWeekend(saturday)); // true
     * console.log(dateHelper.isWeekend(monday));   // false
     * ```
     */
    isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    /**
     * Check if a date is a weekday (Monday-Friday).
     *
     * @param date - Date to check
     * @returns True if date is Monday through Friday
     *
     * @example
     * ```typescript
     * const monday = new Date('2024-01-15');   // Monday
     * const saturday = new Date('2024-01-13'); // Saturday
     * console.log(dateHelper.isWeekday(monday));   // true
     * console.log(dateHelper.isWeekday(saturday)); // false
     * ```
     */
    isWeekday(date: Date): boolean {
        return !this.isWeekend(date);
    }

    /**
     * Get the week number of the year (ISO 8601 standard).
     *
     * @param date - Date to get week number for
     * @returns Week number (1-53)
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15');
     * const weekNumber = dateHelper.getWeekNumber(date);
     * console.log(weekNumber); // 3
     * ```
     */
    getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / DateHelper.MS_PER_DAY) + 1) / 7);
    }

    /**
     * Get the day of the year (1-366).
     *
     * @param date - Date to get day number for
     * @returns Day of year (1-366)
     *
     * @example
     * ```typescript
     * const date = new Date('2024-02-01');
     * const dayOfYear = dateHelper.getDayOfYear(date);
     * console.log(dayOfYear); // 32
     * ```
     */
    getDayOfYear(date: Date): number {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const diff = date.getTime() - startOfYear.getTime();
        return Math.floor(diff / DateHelper.MS_PER_DAY) + 1;
    }

    /**
     * Get the quarter of the year (1-4).
     *
     * @param date - Date to get quarter for
     * @returns Quarter number (1-4)
     *
     * @example
     * ```typescript
     * const date = new Date('2024-05-15');
     * const quarter = dateHelper.getQuarter(date);
     * console.log(quarter); // 2
     * ```
     */
    getQuarter(date: Date): number {
        return Math.floor(date.getMonth() / 3) + 1;
    }

    /**
     * Format a date as YYYY-MM-DD.
     *
     * @param date - Date to format
     * @returns Date string in YYYY-MM-DD format
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T10:30:00');
     * const formatted = dateHelper.formatDate(date);
     * console.log(formatted); // "2024-01-15"
     * ```
     */
    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Format a date as HH:MM:SS.
     *
     * @param date - Date to format
     * @returns Time string in HH:MM:SS format
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T10:30:45');
     * const formatted = dateHelper.formatTime(date);
     * console.log(formatted); // "10:30:45"
     * ```
     */
    formatTime(date: Date): string {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Format a date as YYYY-MM-DD HH:MM:SS.
     *
     * @param date - Date to format
     * @returns DateTime string in YYYY-MM-DD HH:MM:SS format
     *
     * @example
     * ```typescript
     * const date = new Date('2024-01-15T10:30:45');
     * const formatted = dateHelper.formatDateTime(date);
     * console.log(formatted); // "2024-01-15 10:30:45"
     * ```
     */
    formatDateTime(date: Date): string {
        return `${this.formatDate(date)} ${this.formatTime(date)}`;
    }

    /**
     * Check if a year is a leap year.
     *
     * @param year - Year to check
     * @returns True if year is a leap year
     *
     * @example
     * ```typescript
     * console.log(dateHelper.isLeapYear(2024)); // true
     * console.log(dateHelper.isLeapYear(2023)); // false
     * ```
     */
    isLeapYear(year: number): boolean {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    /**
     * Get the number of days in a month.
     *
     * @param year - Year
     * @param month - Month (0-11, where 0 is January)
     * @returns Number of days in the month
     *
     * @example
     * ```typescript
     * const days = dateHelper.getDaysInMonth(2024, 1); // February 2024
     * console.log(days); // 29 (leap year)
     * ```
     */
    getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }
}