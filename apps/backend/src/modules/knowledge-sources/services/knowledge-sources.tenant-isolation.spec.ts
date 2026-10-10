import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KnowledgeSourceStatus } from '../entities/enums/knowledge-source-status.enum';
import { KnowledgeSourceType } from '../entities/enums/knowledge-source-type.enum';
import { KnowledgeSourcesService } from './knowledge-sources.service';

const tenantId = 'tenant-alpha';

function queryBuilder() {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue({ avg: '0' }),
  };
}

function setup() {
  const qb = queryBuilder();
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'source-1', ...value })),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => qb),
  };
  const service = new KnowledgeSourcesService(
    repository as never,
    {} as never,
    {} as never,
    {} as never,
  );
  jest.spyOn(service, 'processKnowledgeSource').mockResolvedValue(undefined);
  return { service, repository, qb };
}

describe('KnowledgeSourcesService tenant isolation', () => {
  it('rejects operations without a valid tenant before repository access', async () => {
    const { service, repository } = setup();

    await expect(service.findById('', 'source-1')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll('', {})).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search('', { query: 'billing' })).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('stamps authenticated tenant on create and carries it into processing', async () => {
    const { service, repository } = setup();

    await service.create(tenantId, {
      title: 'Runbook',
      sourceType: KnowledgeSourceType.TEXT,
      extractedContent: 'Recovery instructions',
      uploadedById: 'user-1',
      tenantId: 'attacker-tenant',
    } as never);

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      tenantId,
      status: KnowledgeSourceStatus.PENDING,
    }));
    expect(service.processKnowledgeSource).toHaveBeenCalledWith(tenantId, 'source-1');
  });

  it('loads a source only with the matching tenant predicate', async () => {
    const { service, repository } = setup();
    repository.findOne.mockResolvedValue(null);

    await expect(service.findById(tenantId, 'foreign-source')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'foreign-source', tenantId },
    }));
  });

  it('scopes list and full-text search queries to the authenticated tenant', async () => {
    const list = setup();
    await list.service.findAll(tenantId, {});
    expect(list.qb.where).toHaveBeenCalledWith('ks.tenantId = :tenantId', { tenantId });

    const search = setup();
    await search.service.search(tenantId, { query: 'billing' });
    expect(search.qb.where).toHaveBeenCalledWith('ks.tenantId = :tenantId', { tenantId });
    expect(search.qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('to_tsvector'), { query: 'billing' });
  });

  it('uses tenant predicates for aggregate statistics', async () => {
    const { service, repository } = setup();

    await service.getStatistics(tenantId);

    expect(repository.count).toHaveBeenCalledWith({ where: { tenantId } });
    expect(repository.createQueryBuilder).toHaveBeenCalledTimes(3);
  });
});
