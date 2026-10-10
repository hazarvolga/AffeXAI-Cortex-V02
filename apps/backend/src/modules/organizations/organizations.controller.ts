import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../core/auth/guards/platform-admin.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateOrganizationDto, SetOrganizationStatusDto } from './dto/organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  @UseGuards(PlatformAdminGuard)
  create(@Body() dto: CreateOrganizationDto, @CurrentUser('id') actorId: string) {
    return this.organizations.createOrganization(dto, actorId);
  }

  @Patch(':id/status')
  @UseGuards(PlatformAdminGuard)
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetOrganizationStatusDto, @CurrentUser('id') actorId: string) {
    return this.organizations.setStatus(id, dto.isActive, actorId);
  }

  @Get('current')
  @Roles(UserRole.ADMIN, UserRole.VIEWER)
  async current() {
    const organization = await this.organizations.getCurrent();
    const { settings: _settings, users: _users, ...summary } = organization;
    return summary;
  }

  @Get('current/members')
  @Roles(UserRole.ADMIN)
  members() {
    return this.organizations.listMembers();
  }

  @Post('current/members/:userId')
  @Roles(UserRole.ADMIN)
  linkMember(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser('id') actorId: string) {
    return this.organizations.linkMember(userId, actorId);
  }

  @Delete('current/members/:userId')
  @Roles(UserRole.ADMIN)
  removeMember(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser('id') actorId: string) {
    return this.organizations.removeMember(userId, actorId);
  }
}
