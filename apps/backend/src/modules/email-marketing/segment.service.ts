import { assertWritableFields } from './recipient-input-policy';
import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TenantService } from '../../core/tenant/tenant.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Segment } from './entities/segment.entity';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';

@Injectable()
export class SegmentService {
  constructor(
    @InjectRepository(Segment)
    private segmentsRepository: Repository<Segment>,
    private readonly tenantService: TenantService,
  ) { }

  private getTenantId(requestedTenantId?: string): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new UnauthorizedException('Tenant context required');
    if (requestedTenantId && requestedTenantId !== tenantId) throw new ForbiddenException('Tenant mismatch');
    return tenantId;
  }

  async create(createSegmentDto: CreateSegmentDto, tenantId?: string): Promise<Segment> {
    const activeTenantId = this.getTenantId(tenantId);
    assertWritableFields(createSegmentDto, ['name', 'description', 'criteria', 'openRate', 'clickRate']);
    const segment = this.segmentsRepository.create({
      ...createSegmentDto,
      tenantId: activeTenantId,
    });
    return this.segmentsRepository.save(segment);
  }

  async findAll(tenantId?: string): Promise<Segment[]> {
    const activeTenantId = this.getTenantId(tenantId);
    return this.segmentsRepository.find({
      where: { tenantId: activeTenantId },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string, tenantId?: string): Promise<Segment> {
    const activeTenantId = this.getTenantId(tenantId);
    const segment = await this.segmentsRepository.findOne({ where: { id, tenantId: activeTenantId } });
    if (!segment) {
      throw new NotFoundException(`Segment with ID ${id} not found`);
    }
    return segment;
  }

  async findAllForImport(tenantId?: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    subscriberCount: number;
    openRate: number;
    clickRate: number;
  }>> {
    const activeTenantId = this.getTenantId(tenantId);
    const segments = await this.segmentsRepository.find({
      select: ['id', 'name', 'description', 'subscriberCount', 'openRate', 'clickRate'],
      where: { tenantId: activeTenantId },
      order: { name: 'ASC' }
    });

    return segments.map(segment => ({
      id: segment.id,
      name: segment.name,
      description: segment.description || '',
      subscriberCount: segment.subscriberCount,
      openRate: Number(segment.openRate),
      clickRate: Number(segment.clickRate)
    }));
  }

  async update(id: string, updateSegmentDto: UpdateSegmentDto, tenantId?: string): Promise<Segment> {
    const activeTenantId = this.getTenantId(tenantId);
    const segment = await this.findOne(id, activeTenantId);
    assertWritableFields(updateSegmentDto, ['name', 'description', 'criteria', 'openRate', 'clickRate']);
    return this.segmentsRepository.save(this.segmentsRepository.create({ ...segment, ...updateSegmentDto }));
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const activeTenantId = this.getTenantId(tenantId);
    const segment = await this.findOne(id, activeTenantId);
    await this.segmentsRepository.remove(segment);
  }
}