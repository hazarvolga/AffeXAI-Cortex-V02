import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TemplateService } from '../template.service';
import { EmailTemplate, TemplateType } from '../entities/email-template.entity';
import { MjmlRendererService } from '../services/mjml-renderer.service';
import { CreateEmailTemplateDto } from '../dto/create-template.dto';
import { UpdateEmailTemplateDto } from '../dto/update-template.dto';
import { CloneTemplateDto } from '../dto/clone-template.dto';

describe('TemplateService', () => {
    let service: TemplateService;
    let templateRepository: Repository<EmailTemplate>;
    let mjmlRendererService: MjmlRendererService;

    const mockTemplate: Partial<EmailTemplate> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Template',
        description: 'Test Description',
        type: TemplateType.CUSTOM,
        isActive: true,
        isEditable: true,
        content: '<html>Test</html>',
        compiledHtml: '<html>Test</html>',
        compiledMjml: '<mjml>Test</mjml>',
        structure: { rows: [] },
        variables: [],
        version: 1,
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockMjmlRendererService = {
        renderEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemplateService,
                {
                    provide: getRepositoryToken(EmailTemplate),
                    useValue: mockRepository,
                },
                {
                    provide: MjmlRendererService,
                    useValue: mockMjmlRendererService,
                },
            ],
        }).compile();

        service = module.get<TemplateService>(TemplateService);
        templateRepository = module.get<Repository<EmailTemplate>>(
            getRepositoryToken(EmailTemplate),
        );
        mjmlRendererService = module.get<MjmlRendererService>(MjmlRendererService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new template', async () => {
            const createDto: CreateEmailTemplateDto = {
                name: 'New Template',
                description: 'New Description',
                type: TemplateType.CUSTOM,
            };

            mockRepository.create.mockReturnValue(mockTemplate);
            mockRepository.save.mockResolvedValue(mockTemplate);

            const result = await service.create(createDto);

            expect(mockRepository.create).toHaveBeenCalledWith(createDto);
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result).toEqual(mockTemplate);
        });
    });

    describe('findAll', () => {
        it('should return all templates', async () => {
            const templates = [mockTemplate];
            mockRepository.find.mockResolvedValue(templates);

            const result = await service.findAll();

            expect(mockRepository.find).toHaveBeenCalled();
            expect(result).toEqual(templates);
        });
    });

    describe('findOne', () => {
        it('should return a template by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockTemplate);

            const result = await service.findOne(mockTemplate.id);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: mockTemplate.id },
            });
            expect(result).toEqual(mockTemplate);
        });

        it('should throw NotFoundException if template not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findByName', () => {
        it('should return a template by name', async () => {
            mockRepository.findOne.mockResolvedValue(mockTemplate);

            const result = await service.findByName(mockTemplate.name);

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { name: mockTemplate.name },
            });
            expect(result).toEqual(mockTemplate);
        });

        it('should throw NotFoundException if template not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findByName('Non Existent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should update a template', async () => {
            const updateDto: UpdateEmailTemplateDto = {
                name: 'Updated Template',
            };

            mockRepository.findOne.mockResolvedValue(mockTemplate);
            mockRepository.save.mockResolvedValue({
                ...mockTemplate,
                ...updateDto,
            });

            const result = await service.update(mockTemplate.id, updateDto);

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
            expect(result.name).toBe(updateDto.name);
        });
    });

    describe('remove', () => {
        it('should remove a template', async () => {
            mockRepository.findOne.mockResolvedValue(mockTemplate);
            mockRepository.remove.mockResolvedValue(mockTemplate);

            await service.remove(mockTemplate.id);

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(mockRepository.remove).toHaveBeenCalledWith(mockTemplate);
        });
    });

    describe('cloneTemplate', () => {
        it('should clone a template with new name', async () => {
            const cloneDto: CloneTemplateDto = {
                newName: 'Cloned Template',
            };

            mockRepository.findOne.mockResolvedValue(mockTemplate);
            mockRepository.create.mockReturnValue({
                ...mockTemplate,
                name: cloneDto.newName,
            });
            mockRepository.save.mockResolvedValue({
                ...mockTemplate,
                name: cloneDto.newName,
            });
            mockMjmlRendererService.renderEmail.mockResolvedValue({
                mjml: '<mjml>Rendered</mjml>',
                html: '<html>Rendered</html>',
            });

            const result = await service.cloneTemplate(mockTemplate.id, cloneDto);

            expect(mockRepository.findOne).toHaveBeenCalled();
            expect(mockRepository.create).toHaveBeenCalled();
            expect(result.name).toBe(cloneDto.newName);
        });

        it('should use default name if not provided', async () => {
            const cloneDto: CloneTemplateDto = {};

            mockRepository.findOne.mockResolvedValue(mockTemplate);
            mockRepository.create.mockReturnValue(mockTemplate);
            mockRepository.save.mockResolvedValue(mockTemplate);
            mockMjmlRendererService.renderEmail.mockResolvedValue({
                mjml: '<mjml>Rendered</mjml>',
                html: '<html>Rendered</html>',
            });

            const result = await service.cloneTemplate(mockTemplate.id, cloneDto);

            expect(result.name).toContain('(Copy)');
        });

        it('should render structure if template has structure', async () => {
            const templateWithStructure = {
                ...mockTemplate,
                structure: { rows: [{ type: 'section' }] },
            };

            mockRepository.findOne.mockResolvedValue(templateWithStructure);
            mockRepository.create.mockReturnValue(templateWithStructure);
            mockRepository.save.mockResolvedValue(templateWithStructure);
            mockMjmlRendererService.renderEmail.mockResolvedValue({
                mjml: '<mjml>Rendered</mjml>',
                html: '<html>Rendered</html>',
            });

            await service.cloneTemplate(mockTemplate.id, {});

            expect(mockMjmlRendererService.renderEmail).toHaveBeenCalled();
        });
    });

    describe('renderTemplate', () => {
        it('should render template with structure', async () => {
            const templateWithStructure = {
                ...mockTemplate,
                structure: { rows: [] },
            };

            mockRepository.findOne.mockResolvedValue(templateWithStructure);
            mockRepository.update.mockResolvedValue({ affected: 1 });
            mockMjmlRendererService.renderEmail.mockResolvedValue({
                mjml: '<mjml>Rendered</mjml>',
                html: '<html>Rendered</html>',
            });

            const result = await service.renderTemplate(mockTemplate.id);

            expect(mockMjmlRendererService.renderEmail).toHaveBeenCalled();
            expect(mockRepository.update).toHaveBeenCalled();
            expect(result).toEqual({
                mjml: '<mjml>Rendered</mjml>',
                html: '<html>Rendered</html>',
            });
        });

        it('should return legacy HTML if no structure', async () => {
            const legacyTemplate = {
                ...mockTemplate,
                structure: null,
                content: '<html>Legacy</html>',
            };

            mockRepository.findOne.mockResolvedValue(legacyTemplate);

            const result = await service.renderTemplate(mockTemplate.id);

            expect(mockMjmlRendererService.renderEmail).not.toHaveBeenCalled();
            expect(result).toEqual({
                html: '<html>Legacy</html>',
                mjml: null,
            });
        });
    });
});
