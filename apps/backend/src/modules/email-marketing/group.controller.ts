import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Controller, Get, Post, Patch, Delete, Body, Param, NotFoundException, Req } from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) { }

  @Post()
  create(@Body() createGroupDto: CreateGroupDto, @Req() req: any): Promise<Group> {
    const tenantId = req.user.tenantId;
    return this.groupService.create(createGroupDto, tenantId);
  }

  @Get()
  findAll(@Req() req: any): Promise<Group[]> {
    const tenantId = req.user.tenantId;
    return this.groupService.findAll(tenantId);
  }

  @Get('import/options')
  async getImportOptions(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const groups = await this.groupService.findAllForImport(tenantId);
    return {
      success: true,
      data: groups
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any): Promise<Group> {
    const tenantId = req.user.tenantId;
    return this.groupService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto, @Req() req: any): Promise<Group> {
    const tenantId = req.user.tenantId;
    return this.groupService.update(id, updateGroupDto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const tenantId = req.user.tenantId;
    return this.groupService.remove(id, tenantId);
  }
}