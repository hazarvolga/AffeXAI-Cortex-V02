import { assertWritableFields } from './recipient-input-policy';
import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TenantService } from '../../core/tenant/tenant.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(requestedTenantId?: string): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    if (requestedTenantId && requestedTenantId !== tenantId) throw new ForbiddenException('Tenant mismatch');
    return tenantId;
  }

  async create(createGroupDto: CreateGroupDto, tenantId?: string): Promise<Group> {
    const activeTenantId = this.getTenantId(tenantId);
    assertWritableFields(createGroupDto, ['name', 'description']);
    const group = this.groupsRepository.create({
      ...createGroupDto,
      tenantId: activeTenantId,
    });
    return this.groupsRepository.save(group);
  }

  async findAll(tenantId?: string): Promise<Group[]> {
    const activeTenantId = this.getTenantId(tenantId);
    return this.groupsRepository.find({
      where: { tenantId: activeTenantId },
      order: { name: 'ASC' }
    });
  }

  async findAllForImport(tenantId?: string): Promise<Array<{ id: string; name: string; description: string; subscriberCount: number }>> {
    const activeTenantId = this.getTenantId(tenantId);
    const groups = await this.groupsRepository.find({
      select: ['id', 'name', 'description', 'subscriberCount'],
      where: { tenantId: activeTenantId },
      order: { name: 'ASC' }
    });

    return groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description || '',
      subscriberCount: group.subscriberCount
    }));
  }

  async findOne(id: string, tenantId?: string): Promise<Group> {
    const activeTenantId = this.getTenantId(tenantId);
    const group = await this.groupsRepository.findOne({ where: { id, tenantId: activeTenantId } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto, tenantId?: string): Promise<Group> {
    const activeTenantId = this.getTenantId(tenantId);
    const group = await this.findOne(id, activeTenantId);
    assertWritableFields(updateGroupDto, ['name', 'description']);
    return this.groupsRepository.save(this.groupsRepository.create({ ...group, ...updateGroupDto }));
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const activeTenantId = this.getTenantId(tenantId);
    const group = await this.findOne(id, activeTenantId);
    await this.groupsRepository.remove(group);
  }
}