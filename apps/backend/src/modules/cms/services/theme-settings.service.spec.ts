import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThemeSettingsService } from './theme-settings.service';
import { ThemeSettings } from '../entities/theme-settings.entity';

describe('ThemeSettingsService', () => {
    let service: ThemeSettingsService;
    let repo: Repository<ThemeSettings>;

    const mockRepo = {
        findOne: jest.fn(),
        find: jest.fn(),
        create: jest.fn().mockImplementation(d => d),
        save: jest.fn().mockImplementation(d => Promise.resolve({ id: 't-1', ...d })),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ThemeSettingsService,
                { provide: getRepositoryToken(ThemeSettings), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<ThemeSettingsService>(ThemeSettingsService);
        repo = module.get(getRepositoryToken(ThemeSettings));
        jest.clearAllMocks();
    });

    describe('getActiveTheme', () => {
        it('should return existing active theme', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'active', isActive: true });
            const result = await service.getActiveTheme();
            expect(result.id).toBe('active');
        });

        it('should create default if none active', async () => {
            mockRepo.findOne.mockResolvedValue(null);
            await service.getActiveTheme();

            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Default Theme', isActive: true })
            );
        });
    });

    describe('activateTheme', () => {
        it('should deactivate others and activate target', async () => {
            mockRepo.findOne.mockResolvedValue({ id: 'target', isActive: false });

            await service.activateTheme('target');

            expect(repo.update).toHaveBeenCalledWith(
                { isActive: true },
                { isActive: false }
            );
            expect(repo.save).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'target', isActive: true })
            );
        });
    });
});
