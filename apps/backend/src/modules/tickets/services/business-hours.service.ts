import { Injectable, Logger } from '@nestjs/common';

/**
 * Business Hours Service
 * Handles business hour calculations for SLA tracking
 */

export interface BusinessHoursConfig {
  timezone: string; // e.g., 'Europe/Istanbul'
  workDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  workHours: {
    start: string; // HH:MM format, e.g., '09:00'
    end: string; // HH:MM format, e.g., '18:00'
  };
  holidays: Date[]; // Array of holiday dates
}

export interface BusinessHoursDuration {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

@Injectable()
export class BusinessHoursService {
  private readonly logger = new Logger(BusinessHoursService.name);

  // Default business hours configuration (Turkey)
  private config: BusinessHoursConfig = {
    timezone: 'Europe/Istanbul',
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
    workHours: {
      start: '09:00',
      end: '18:00',
    },
    holidays: [
      // 2025 Turkish National Holidays (example)
      new Date('2025-01-01'), // New Year
      new Date('2025-04-23'), // National Sovereignty Day
      new Date('2025-05-01'), // Labor Day
      new Date('2025-05-19'), // Youth and Sports Day
      new Date('2025-08-30'), // Victory Day
      new Date('2025-10-29'), // Republic Day
      // Religious holidays would be added based on lunar calendar
    ],
  };

  /**
   * Update business hours configuration
   */
  setConfig(config: Partial<BusinessHoursConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Business hours configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): BusinessHoursConfig {
    return this.config;
  }

  /**
   * Check if a given date/time is within business hours
   */
  isBusinessHours(date: Date): boolean {
    // Check if it's a work day
    if (!this.config.workDays.includes(date.getDay())) {
      return false;
    }

    // Check if it's a holiday
    if (this.isHoliday(date)) {
      return false;
    }

    // Check if time is within work hours
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return timeStr >= this.config.workHours.start && timeStr < this.config.workHours.end;
  }

  /**
   * Check if a date is a holiday
   */
  isHoliday(date: Date): boolean {
    return this.config.holidays.some(
      holiday =>
        holiday.getFullYear() === date.getFullYear() &&
        holiday.getMonth() === date.getMonth() &&
        holiday.getDate() === date.getDate(),
    );
  }

  /**
   * Get the next business hour timestamp
   */
  getNextBusinessHour(from: Date): Date {
    const next = new Date(from);

    // If already in business hours, return as is
    if (this.isBusinessHours(next)) {
      return next;
    }

    // Move to next business hour
    while (!this.isBusinessHours(next)) {
      // If after work hours, move to next day's start
      const timeStr = `${next.getHours().toString().padStart(2, '0')}:${next.getMinutes().toString().padStart(2, '0')}`;

      if (timeStr >= this.config.workHours.end) {
        // Move to next day
        next.setDate(next.getDate() + 1);
        const [startHour, startMinute] = this.config.workHours.start.split(':').map(Number);
        next.setHours(startHour, startMinute, 0, 0);
      } else if (timeStr < this.config.workHours.start) {
        // Move to start of work day
        const [startHour, startMinute] = this.config.workHours.start.split(':').map(Number);
        next.setHours(startHour, startMinute, 0, 0);
      } else {
        // Weekend or holiday, move to next day
        next.setDate(next.getDate() + 1);
        const [startHour, startMinute] = this.config.workHours.start.split(':').map(Number);
        next.setHours(startHour, startMinute, 0, 0);
      }
    }

    return next;
  }

  /**
   * Calculate business hours duration between two timestamps
   */
  calculateBusinessHoursDuration(start: Date, end: Date): BusinessHoursDuration {
    let totalMinutes = 0;
    const current = new Date(start);

    while (current < end) {
      if (this.isBusinessHours(current)) {
        totalMinutes++;
      }

      // Move to next minute
      current.setMinutes(current.getMinutes() + 1);
    }

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
    };
  }

  /**
   * Add business hours to a timestamp
   * @param from - Starting timestamp
   * @param hours - Number of business hours to add
   */
  addBusinessHours(from: Date, hours: number): Date {
    const result = new Date(from);
    let remainingMinutes = hours * 60;

    // Move to next business hour if starting outside business hours
    if (!this.isBusinessHours(result)) {
      const nextBH = this.getNextBusinessHour(result);
      result.setTime(nextBH.getTime());
    }

    while (remainingMinutes > 0) {
      if (this.isBusinessHours(result)) {
        result.setMinutes(result.getMinutes() + 1);
        remainingMinutes--;
      } else {
        // Move to next business hour
        const nextBH = this.getNextBusinessHour(result);
        result.setTime(nextBH.getTime());
      }
    }

    return result;
  }

  /**
   * Calculate SLA due date considering business hours
   * @param startDate - Ticket creation time
   * @param slaHours - SLA in hours
   * @param useBusinessHours - Whether to use business hours (default: true)
   */
  calculateSLADueDate(
    startDate: Date,
    slaHours: number,
    useBusinessHours: boolean = true,
  ): Date {
    if (!useBusinessHours) {
      // Simple calculation without business hours
      const dueDate = new Date(startDate);
      dueDate.setHours(dueDate.getHours() + slaHours);
      return dueDate;
    }

    // Calculate with business hours
    return this.addBusinessHours(startDate, slaHours);
  }

  /**
   * Get remaining business hours until deadline
   */
  getRemainingBusinessHours(deadline: Date, now: Date = new Date()): BusinessHoursDuration {
    if (now >= deadline) {
      return { hours: 0, minutes: 0, totalMinutes: 0 };
    }

    return this.calculateBusinessHoursDuration(now, deadline);
  }

  /**
   * Check if SLA is breached considering business hours
   */
  isSLABreached(dueDate: Date, now: Date = new Date()): boolean {
    return now > dueDate;
  }

  /**
   * Get business hours percentage remaining
   */
  getSLAProgressPercentage(
    startDate: Date,
    dueDate: Date,
    now: Date = new Date(),
  ): number {
    const total = this.calculateBusinessHoursDuration(startDate, dueDate);
    const elapsed = this.calculateBusinessHoursDuration(startDate, now);

    if (total.totalMinutes === 0) return 100;

    const percentage = (elapsed.totalMinutes / total.totalMinutes) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * Add a holiday to the configuration
   */
  addHoliday(date: Date): void {
    if (!this.isHoliday(date)) {
      this.config.holidays.push(date);
      this.logger.log(`Added holiday: ${date.toDateString()}`);
    }
  }

  /**
   * Remove a holiday from the configuration
   */
  removeHoliday(date: Date): void {
    this.config.holidays = this.config.holidays.filter(
      holiday =>
        !(
          holiday.getFullYear() === date.getFullYear() &&
          holiday.getMonth() === date.getMonth() &&
          holiday.getDate() === date.getDate()
        ),
    );
    this.logger.log(`Removed holiday: ${date.toDateString()}`);
  }

  /**
   * Get all holidays for a given year
   */
  getHolidaysForYear(year: number): Date[] {
    return this.config.holidays.filter(holiday => holiday.getFullYear() === year);
  }

  /**
   * Get business hours statistics for a time range
   */
  getBusinessHoursStats(startDate: Date, endDate: Date): {
    totalDays: number;
    businessDays: number;
    weekendDays: number;
    holidays: number;
    totalBusinessHours: number;
  } {
    let totalDays = 0;
    let businessDays = 0;
    let weekendDays = 0;
    let holidays = 0;

    const current = new Date(startDate);
    const [startHour, startMinute] = this.config.workHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.config.workHours.end.split(':').map(Number);
    const hoursPerDay = endHour - startHour + (endMinute - startMinute) / 60;

    while (current <= endDate) {
      totalDays++;

      if (this.isHoliday(current)) {
        holidays++;
      } else if (this.config.workDays.includes(current.getDay())) {
        businessDays++;
      } else {
        weekendDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return {
      totalDays,
      businessDays,
      weekendDays,
      holidays,
      totalBusinessHours: businessDays * hoursPerDay,
    };
  }
}
