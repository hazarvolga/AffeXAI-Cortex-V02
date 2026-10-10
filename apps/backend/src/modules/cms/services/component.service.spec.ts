import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComponentService } from './component.service';
import { Component } from '../entities/component.entity';
import { NotFoundException } from '@nestjs/common';

describe('ComponentService', () => {
    let service: ComponentService;
    let repository: Repository<Component>;

    const mockRepo = {
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(comp => Promise.resolve({ id: '1', ...comp })),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        })),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ComponentService,
                { provide: getRepositoryToken(Component), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<ComponentService>(ComponentService);
        repository = module.get(getRepositoryToken(Component));
    });

    describe('create', () => {
        it('should create component', async () => {
            const result = await service.create({ type: 'hero' } as any);
            expect(result).toBeDefined();
        });
    });

    describe('findAll', () => {
        it('should find by pageId', async () => {
            await service.findAll('page-1');
            expect(repository.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('reorderComponents', () => {
        it('should update orders sequentially', async () => {
            mockRepo.findOne.mockResolvedValue({ id: '1' });
            await service.reorderComponents(['1', '2'], [0, 1]);

            expect(repository.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('update', () => {
        it('should throw if not found', async () => {
            mockRepo.findOne.mockResolvedValue(null);
            await expect(service.update('bad', {})).rejects.toThrow(NotFoundException);
        });
    });
});
