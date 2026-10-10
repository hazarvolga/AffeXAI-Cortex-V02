import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketDataExtractorService } from './ticket-data-extractor.service';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { TicketMessage } from '../../tickets/entities/ticket-message.entity';
import { DataNormalizerService } from './data-normalizer.service';
import { TicketStatus } from '../../tickets/enums/ticket-status.enum';

describe('TicketDataExtractorService', () => {
    let service: TicketDataExtractorService;
    let ticketRepository: Repository<Ticket>;
    let ticketMessageRepository: Repository<TicketMessage>;
    let dataNormalizer: DataNormalizerService;

    const mockTicketRepository = {
        find: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            count: jest.fn(),
            orderBy: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
        })),
        count: jest.fn(),
        findOne: jest.fn(),
    };

    const mockTicketMessageRepository = {
        find: jest.fn(),
    };

    const mockDataNormalizer = {
        cleanText: jest.fn(text => text),
        validateDataQuality: jest.fn(() => true),
    };

    const mockTicket = {
        id: 'ticket-123',
        subject: 'Cannot access account',
        description: 'I am getting a 403 error',
        status: TicketStatus.RESOLVED,
        createdAt: new Date(Date.now() - 86400000),
        resolvedAt: new Date(),
        metadata: {
            satisfactionScore: 5
        },
        messages: [
            {
                id: 'msg-1',
                content: 'Please clear your cache.',
                senderType: 'agent',
                createdAt: new Date()
            }
        ]
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TicketDataExtractorService,
                {
                    provide: getRepositoryToken(Ticket),
                    useValue: mockTicketRepository,
                },
                {
                    provide: getRepositoryToken(TicketMessage),
                    useValue: mockTicketMessageRepository,
                },
                {
                    provide: DataNormalizerService,
                    useValue: mockDataNormalizer,
                },
            ],
        }).compile();

        service = module.get<TicketDataExtractorService>(TicketDataExtractorService);
        ticketRepository = module.get(getRepositoryToken(Ticket));
        ticketMessageRepository = module.get(getRepositoryToken(TicketMessage));
        dataNormalizer = module.get(DataNormalizerService);

        jest.clearAllMocks();
    });

    describe('extract', () => {
        it('should extract data from resolved tickets', async () => {
            mockTicketRepository.createQueryBuilder().getMany.mockResolvedValue([mockTicket]);
            // Spy on internal method extractAnswer
            jest.spyOn(service, 'extractAnswer').mockResolvedValue('Please clear your cache.');

            const result = await service.extract({});

            expect(result).toHaveLength(1);
            expect(result[0].question).toContain('Cannot access account'); // Usually subject + description
            expect(result[0].answer).toBe('Please clear your cache.');
        });
    });

    describe('extractQuestion', () => {
        it('should combine subject and description', () => {
            const q = service.extractQuestion(mockTicket as any);
            expect(q).toContain('Cannot access account');
            expect(q).toContain('I am getting a 403 error');
        });
    });

    describe('extractAnswer', () => {
        it('should finding best agent response', async () => {
            // Assuming it uses the messages attached to ticket or queries repo if not present
            // Since mockTicket has messages, it might use them
            const answer = await service.extractAnswer(mockTicket as any);
            // Assuming it picks the last agent message or calculates best one
            expect(answer).toBeTruthy();
        });
    });

    describe('calculateTicketConfidence', () => {
        it('should calculate confidence based on factors', () => {
            const confidence = service.calculateTicketConfidence(mockTicket as any, 3600);
            expect(confidence).toBeGreaterThan(0);
        });
    });

    describe('hasSolutionKeywords', () => {
        it('should detect solution keywords', () => {
            expect(service.hasSolutionKeywords('The solution is to...')).toBe(true);
            expect(service.hasSolutionKeywords('I dont know')).toBe(false);
        });
    });

    describe('getExtractionStats', () => {
        it('should return ticket statistics', async () => {
            mockTicketRepository.count.mockResolvedValue(50);

            const stats = await service.getExtractionStats();

            expect(stats.totalTickets).toBe(50);
        });
    });
});
