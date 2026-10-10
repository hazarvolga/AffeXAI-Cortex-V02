import { NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';

jest.mock('../mail/mail.service', () => ({ MailService: class {} }));
jest.mock('./services/ticket-email.service', () => ({ TicketEmailService: class {} }));
jest.mock('./gateways/ticket-notifications.gateway', () => ({ TicketNotificationsGateway: class {} }));
jest.mock('../settings/settings.service', () => ({ SettingsService: class {} }));
jest.mock('../ai/ai.service', () => ({ AiService: class {} }));
jest.mock('../faq-learning/services/faq-enhanced-search.service', () => ({ FaqEnhancedSearchService: class {} }));
jest.mock('./services/knowledge-base.service', () => ({ KnowledgeBaseService: class {} }));
jest.mock('../strategy/services/strategy.service', () => ({ StrategyService: class {} }));

describe('Ticket intelligence response contract', () => {
  const getInsight = jest.fn();
  const findOne = jest.fn();
  const service = Object.assign(Object.create(TicketsService.prototype), {
    findOne,
    strategyService: { getInsight },
  }) as TicketsService;

  beforeEach(() => jest.resetAllMocks());

  it('preserves both response field contracts using one tenant-scoped insight', async () => {
    findOne.mockResolvedValue({
      id: 'ticket-a', tenantId: 'tenant-a', subject: 'Upload fails',
      description: 'The upload times out', tags: ['upload'],
    });
    getInsight.mockResolvedValue({ insight: 'Check the upload limit.', source: 'rag' });

    const result = await service.getTicketSignal('ticket-a');

    expect(findOne).toHaveBeenCalledWith('ticket-a');
    expect(getInsight).toHaveBeenCalledTimes(1);
    expect(getInsight).toHaveBeenCalledWith(
      'tenant-a', expect.stringContaining('Upload fails'), 'Existing tags: upload',
    );
    expect(result).toEqual({
      ticketId: 'ticket-a', subject: 'Upload fails',
      aiInsight: 'Check the upload limit.', learningSource: 'rag',
      insight: 'Check the upload limit.', source: 'rag', neural_connection: true,
      timestamp: expect.any(Date),
    });
  });

  it('does not call strategy when the tenant-scoped ticket lookup rejects access', async () => {
    findOne.mockRejectedValue(new NotFoundException('Ticket not found'));

    await expect(service.getTicketSignal('other-tenant-ticket')).rejects.toThrow('Ticket not found');
    expect(getInsight).not.toHaveBeenCalled();
  });
});
