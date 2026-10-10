import { Test, TestingModule } from '@nestjs/testing';
import { BusinessHoursService } from './business-hours.service';

describe('BusinessHoursService', () => {
    let service: BusinessHoursService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BusinessHoursService],
        }).compile();

        service = module.get<BusinessHoursService>(BusinessHoursService);
    });

    describe('isBusinessHours', () => {
        it('should return true for weekday during business hours', () => {
            // Monday 10:00 AM
            const date = new Date('2024-01-08T10:00:00+03:00');
            const result = service.isBusinessHours(date);
            expect(result).toBe(true);
        });

        it('should return false for weekend', () => {
            // Saturday 10:00 AM
            const date = new Date('2024-01-06T10:00:00+03:00');
            const result = service.isBusinessHours(date);
            expect(result).toBe(false);
        });

        it('should return false for before business hours', () => {
            // Monday 8:00 AM (before 9:00 AM start)
            const date = new Date('2024-01-08T08:00:00+03:00');
            const result = service.isBusinessHours(date);
            expect(result).toBe(false);
        });

        it('should return false for after business hours', () => {
            // Monday 7:00 PM (after 6:00 PM end)
            const date = new Date('2024-01-08T19:00:00+03:00');
            const result = service.isBusinessHours(date);
            expect(result).toBe(false);
        });

        it('should return false for holidays', () => {
            const holiday = new Date('2024-01-01T10:00:00+03:00');
            service.addHoliday(holiday);

            const result = service.isBusinessHours(holiday);
            expect(result).toBe(false);
        });
    });

    describe('getNextBusinessHour', () => {
        it('should return same time if already in business hours', () => {
            const date = new Date('2024-01-08T10:00:00+03:00'); // Monday 10 AM
            const result = service.getNextBusinessHour(date);

            expect(result.getTime()).toBe(date.getTime());
        });

        it('should return next business day start if weekend', () => {
            const saturday = new Date('2024-01-06T10:00:00+03:00');
            const result = service.getNextBusinessHour(saturday);

            // Should be Monday 9:00 AM
            expect(result.getDay()).toBe(1); // Monday
            expect(result.getHours()).toBe(9);
        });

        it('should return next day start if after business hours', () => {
            const afterHours = new Date('2024-01-08T19:00:00+03:00'); // Monday 7 PM
            const result = service.getNextBusinessHour(afterHours);

            // Should be Tuesday 9:00 AM
            expect(result.getDay()).toBe(2); // Tuesday
            expect(result.getHours()).toBe(9);
        });

        it('should skip holidays', () => {
            const holiday = new Date('2024-01-08T10:00:00+03:00');
            service.addHoliday(holiday);

            const result = service.getNextBusinessHour(holiday);

            // Should be next business day
            expect(result.getDate()).not.toBe(holiday.getDate());
        });
    });

    describe('calculateBusinessHoursDuration', () => {
        it('should calculate duration within same business day', () => {
            const start = new Date('2024-01-08T10:00:00+03:00');
            const end = new Date('2024-01-08T14:00:00+03:00');

            const result = service.calculateBusinessHoursDuration(start, end);

            expect(result.hours).toBe(4);
            expect(result.totalMinutes).toBe(240);
        });

        it('should exclude non-business hours', () => {
            const start = new Date('2024-01-08T17:00:00+03:00'); // 5 PM
            const end = new Date('2024-01-09T10:00:00+03:00'); // Next day 10 AM

            const result = service.calculateBusinessHoursDuration(start, end);

            // 1 hour on first day (17:00-18:00) + 1 hour on second day (09:00-10:00)
            expect(result.hours).toBe(2);
        });

        it('should exclude weekends', () => {
            const friday = new Date('2024-01-05T17:00:00+03:00'); // Friday 5 PM
            const monday = new Date('2024-01-08T10:00:00+03:00'); // Monday 10 AM

            const result = service.calculateBusinessHoursDuration(friday, monday);

            // 1 hour Friday (17:00-18:00) + 1 hour Monday (09:00-10:00)
            expect(result.hours).toBe(2);
        });
    });

    describe('addBusinessHours', () => {
        it('should add business hours within same day', () => {
            const start = new Date('2024-01-08T10:00:00+03:00');
            const result = service.addBusinessHours(start, 2);

            expect(result.getHours()).toBe(12);
            expect(result.getDate()).toBe(start.getDate());
        });

        it('should span to next business day if needed', () => {
            const start = new Date('2024-01-08T17:00:00+03:00'); // 5 PM
            const result = service.addBusinessHours(start, 2);

            // 1 hour same day (17:00-18:00) + 1 hour next day (09:00-10:00)
            expect(result.getDate()).toBe(9); // Next day
            expect(result.getHours()).toBe(10);
        });

        it('should skip weekends', () => {
            const friday = new Date('2024-01-05T17:00:00+03:00'); // Friday 5 PM
            const result = service.addBusinessHours(friday, 2);

            // Should land on Monday
            expect(result.getDay()).toBe(1); // Monday
        });
    });

    describe('calculateSLADueDate', () => {
        it('should calculate due date with business hours', () => {
            const start = new Date('2024-01-08T10:00:00+03:00');
            const result = service.calculateSLADueDate(start, 4, true);

            expect(result.getHours()).toBe(14); // 10 AM + 4 hours = 2 PM
        });

        it('should calculate due date without business hours', () => {
            const start = new Date('2024-01-08T10:00:00+03:00');
            const result = service.calculateSLADueDate(start, 4, false);

            // Simple addition without business hours logic
            expect(result.getTime()).toBe(start.getTime() + 4 * 60 * 60 * 1000);
        });

        it('should handle overnight SLA', () => {
            const start = new Date('2024-01-08T17:00:00+03:00'); // 5 PM
            const result = service.calculateSLADueDate(start, 2, true);

            // Should be next business day
            expect(result.getDate()).toBe(9);
        });
    });

    describe('getRemainingBusinessHours', () => {
        it('should calculate remaining hours correctly', () => {
            const deadline = new Date('2024-01-08T14:00:00+03:00');
            const now = new Date('2024-01-08T10:00:00+03:00');

            const result = service.getRemainingBusinessHours(deadline, now);

            expect(result.hours).toBe(4);
        });

        it('should return zero if deadline passed', () => {
            const deadline = new Date('2024-01-08T10:00:00+03:00');
            const now = new Date('2024-01-08T14:00:00+03:00');

            const result = service.getRemainingBusinessHours(deadline, now);

            expect(result.hours).toBe(0);
        });
    });

    describe('isSLABreached', () => {
        it('should return false if deadline not reached', () => {
            const dueDate = new Date(Date.now() + 3600000); // 1 hour in future
            const result = service.isSLABreached(dueDate);

            expect(result).toBe(false);
        });

        it('should return true if deadline passed', () => {
            const dueDate = new Date(Date.now() - 3600000); // 1 hour in past
            const result = service.isSLABreached(dueDate);

            expect(result).toBe(true);
        });
    });

    describe('getSLAProgressPercentage', () => {
        it('should calculate progress percentage', () => {
            const start = new Date('2024-01-08T09:00:00+03:00');
            const due = new Date('2024-01-08T17:00:00+03:00'); // 8 hours
            const now = new Date('2024-01-08T13:00:00+03:00'); // 4 hours elapsed

            const result = service.getSLAProgressPercentage(start, due, now);

            expect(result).toBe(50); // 50% elapsed
        });

        it('should return 100 if deadline passed', () => {
            const start = new Date('2024-01-08T09:00:00+03:00');
            const due = new Date('2024-01-08T17:00:00+03:00');
            const now = new Date('2024-01-08T18:00:00+03:00'); // After deadline

            const result = service.getSLAProgressPercentage(start, due, now);

            expect(result).toBe(100);
        });
    });

    describe('holiday management', () => {
        it('should add holiday', () => {
            const holiday = new Date('2024-12-25');
            service.addHoliday(holiday);

            expect(service.isHoliday(holiday)).toBe(true);
        });

        it('should remove holiday', () => {
            const holiday = new Date('2024-12-25');
            service.addHoliday(holiday);
            service.removeHoliday(holiday);

            expect(service.isHoliday(holiday)).toBe(false);
        });

        it('should get holidays for year', () => {
            const holiday1 = new Date('2024-01-01');
            const holiday2 = new Date('2024-12-25');
            service.addHoliday(holiday1);
            service.addHoliday(holiday2);

            const holidays = service.getHolidaysForYear(2024);

            expect(holidays.length).toBe(2);
        });
    });

    describe('getBusinessHoursStats', () => {
        it('should calculate statistics for date range', () => {
            const start = new Date('2024-01-01'); // Monday
            const end = new Date('2024-01-07'); // Sunday

            const result = service.getBusinessHoursStats(start, end);

            expect(result.totalDays).toBe(7);
            expect(result.businessDays).toBe(5); // Mon-Fri
            expect(result.weekendDays).toBe(2); // Sat-Sun
        });
    });

    describe('configuration', () => {
        it('should update configuration', () => {
            service.setConfig({
                workHours: { start: '08:00', end: '17:00' },
            });

            const config = service.getConfig();
            expect(config.workHours.start).toBe('08:00');
            expect(config.workHours.end).toBe('17:00');
        });

        it('should get current configuration', () => {
            const config = service.getConfig();

            expect(config).toHaveProperty('timezone');
            expect(config).toHaveProperty('workDays');
            expect(config).toHaveProperty('workHours');
        });
    });
});
