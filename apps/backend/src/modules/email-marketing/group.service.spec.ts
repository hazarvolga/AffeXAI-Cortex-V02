import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GroupService } from '../group.service';
import { SubscriberGroup } from '../entities/subscriber-group.entity';

describe('GroupService', () => {
    let service: GroupService;
    let groupRepository: Repository<SubscriberGroup>;

    const mockGroup: Partial<SubscriberGroup> = {
        id: '123',
        name: 'Test Group',
        description: 'Test Description',
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
                GroupService,
                {
                    provide: getRepositoryToken(SubscriberGroup),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<GroupService>(GroupService);
        groupRepository = module.get(getRepositoryToken(SubscriberGroup));

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new group', async () => {
            mockRepository.create.mockReturnValue(mockGroup);
            mockRepository.save.mockResolvedValue(mockGroup);

            const result = await service.create({
                name: 'Test Group',
                description: 'Test Description',
            });

            expect(mockRepository.create).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockGroup);
        });
    });

    describe('findAll', () => {
        it('should return all groups', async () => {
            mockRepository.find.mockResolvedValue([mockGroup]);

            const result = await service.findAll();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual([mockGroup]);
        });
    });

    describe('findOne', () => {
        it('should return a group by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockGroup);

            const result = await service.findOne('123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: '123' } });
            expect(result).toEqual(mockGroup);
        });

        it('should throw NotFoundException if group not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a group', async () => {
            mockRepository.findOne.mockResolvedValue(mockGroup);
            mockRepository.save.mockResolvedValue({ ...mockGroup, name: 'Updated' });

            const result = await service.update('123', { name: 'Updated' });

            expect(mockRepository.save).toHaveBeenCalled();
            expect(result.name).toBe('Updated');
        });
    });

    describe('remove', () => {
        it('should remove a group', async () => {
            mockRepository.findOne.mockResolvedValue(mockGroup);
            mockRepository.remove.mockResolvedValue(mockGroup);

            await service.remove('123');

            expect(mockRepository.remove).toHaveBeenCalledWith(mockGroup);
        });
    });
});
