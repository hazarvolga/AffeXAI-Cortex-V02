import { Test, TestingModule } from '@nestjs/testing';
import { TriggerEvaluatorService } from './trigger-evaluator.service';

describe('TriggerEvaluatorService', () => {
    let service: TriggerEvaluatorService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TriggerEvaluatorService],
        }).compile();

        service = module.get<TriggerEvaluatorService>(TriggerEvaluatorService);
    });

    describe('evaluateTrigger', () => {
        it('should evaluate subscriber_added trigger', () => {
            const trigger = { type: 'subscriber_added' };
            const event = { type: 'subscriber_added', data: { email: 'test@example.com' } };

            const result = service.evaluateTrigger(trigger, event);

            expect(result).toBe(true);
        });

        it('should evaluate field_changed trigger', () => {
            const trigger = { type: 'field_changed', config: { field: 'status', value: 'active' } };
            const event = { type: 'field_changed', data: { field: 'status', newValue: 'active' } };

            const result = service.evaluateTrigger(trigger, event);

            expect(result).toBe(true);
        });

        it('should evaluate date_based trigger', () => {
            const trigger = { type: 'date_based', config: { field: 'birthday', offset: 0 } };
            const event = { type: 'date_based', data: { date: new Date() } };

            const result = service.evaluateTrigger(trigger, event);

            expect(result).toBe(true);
        });

        it('should return false for non-matching trigger', () => {
            const trigger = { type: 'subscriber_added' };
            const event = { type: 'subscriber_removed' };

            const result = service.evaluateTrigger(trigger, event);

            expect(result).toBe(false);
        });
    });

    describe('checkConditions', () => {
        it('should check multiple conditions with AND logic', () => {
            const conditions = [
                { field: 'status', operator: 'equals', value: 'active' },
                { field: 'emailVerified', operator: 'equals', value: true },
            ];
            const data = { status: 'active', emailVerified: true };

            const result = service.checkConditions(conditions, data, 'AND');

            expect(result).toBe(true);
        });

        it('should check multiple conditions with OR logic', () => {
            const conditions = [
                { field: 'status', operator: 'equals', value: 'active' },
                { field: 'status', operator: 'equals', value: 'pending' },
            ];
            const data = { status: 'active' };

            const result = service.checkConditions(conditions, data, 'OR');

            expect(result).toBe(true);
        });
    });
});
