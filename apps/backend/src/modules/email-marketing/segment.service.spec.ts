import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SegmentService } from '../segment.service';
import { Segment } from '../entities/segment.entity';

describe('SegmentService', () => {
    let service: SegmentService;
    let segmentRepository: Repository<Segment>;

    const mockSegment: Partial<Segment> = {
        id: '123',
        name: 'Test Segment',
        description: 'Test Description',
        conditions: {},
        isActive: true,
        subscriberCount: 0,
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SegmentService,
                {
                    provide: getRepositoryToken(Segment),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<SegmentService>(SegmentService);
        segmentRepository = module.get(getRepositoryToken(Segment));

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new segment', async () => {
            mockRepository.create.mockReturnValue(mockSegment);
            mockRepository.save.mockResolvedValue(mockSegment);

            const result = await service.create({
                name: 'Test Segment',
                conditions: {},
            });

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockSegment);
        });
    });

    describe('findAll', () => {
        it('should return all segments', async () => {
            mockRepository.find.mockResolvedValue([mockSegment]);

            const result = await service.findAll();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual([mockSegment]);
        });
    });

    describe('findOne', () => {
        it('should return a segment by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockSegment);

            const result = await service.findOne('123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
            expect(result).toEqual(mockSegment);
        });

        it('should throw NotFoundException if segment not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a segment', async () => {
            mockRepository.findOne.mockResolvedValue(mockSegment);
            mockRepository.save.mockResolvedValue({ ...mockSegment, name: 'Updated' });

            const result = await service.update('123', { name: 'Updated' });

            expect(mockRepository.save).toHaveBeenCalled();
            expect(result.name).toBe('Updated');
        });
    });

    describe('remove', () => {
        it('should remove a segment', async () => {
            mockRepository.findOne.mockResolvedValue(mockSegment);
            mockRepository.remove.mockResolvedValue(mockSegment);

            await service.remove('123');

            expect(mockRepository.remove).toHaveBeenCalledWith(mockSegment);
        });
    });
});
