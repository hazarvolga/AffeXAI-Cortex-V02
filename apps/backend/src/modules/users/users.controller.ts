import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  ForbiddenException,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { TicketsService } from '../tickets/tickets.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UserRolesService } from './user-roles.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { UserRole } from './enums/user-role.enum';
import { InviteUserDto } from './dto/invite-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userRolesService: UserRolesService,
    @Inject(forwardRef(() => TicketsService))
    private readonly ticketsService: TicketsService,
  ) { }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(createUserDto, user.tenantId);
  }

  @Post('invitations')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Invite a tenant user to choose their own password' })
  invite(@Body() dto: InviteUserDto, @CurrentUser() user: any) {
    return this.usersService.invite(dto, user.tenantId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Query() filterDto: FilterUsersDto, @CurrentUser() user: any) {
    return this.usersService.findAll(filterDto, user.tenantId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStats(@CurrentUser() user: any) {
    // Verified: user.tenantId comes from JwtStrategy
    return this.usersService.getStats(user.tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile (self-service)' })
  @ApiResponse({ status: 200, description: 'Current user retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getCurrentUser(@CurrentUser('id') userId: string, @CurrentUser() user: any) {
    return this.usersService.findOne(userId, user.tenantId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent user activity' })
  @ApiResponse({ status: 200, description: 'User activity retrieved successfully' })
  async getRecentActivity(@CurrentUser('id') userId: string, @CurrentUser() currentUser: any) {
    const user = await this.usersService.findOne(userId, currentUser.tenantId);
    // Note: Tickets service might need tenantId if checking tickets across tenants
    const tickets = await this.ticketsService.getRecentByUser(userId, 5);

    const activities = [];

    // Add tickets to activity
    for (const ticket of tickets) {
      activities.push({
        id: ticket.id,
        type: 'ticket',
        title: `Destek Talebi: ${ticket.displayNumber}`,
        description: ticket.subject,
        timestamp: ticket.createdAt,
        metadata: {
          status: ticket.status,
          displayNumber: ticket.displayNumber
        }
      });
    }

    // Add last login
    if (user.lastLoginAt) {
      activities.push({
        id: `login-${user.lastLoginAt.getTime()}`,
        type: 'login',
        title: 'Oturum Açma',
        description: 'Hesabınıza giriş yapıldı.',
        timestamp: user.lastLoginAt,
      });
    }

    // Add profile update if available (using metadata mostly as we don't track audit logs for profile yet)
    // Placeholder for now.

    // Sort by timestamp desc
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user.tenantId);
  }

  @Patch('complete-profile')
  @ApiOperation({ summary: 'Complete user profile after registration (self-service)' })
  @ApiResponse({ status: 200, description: 'Profile completed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  completeProfile(@CurrentUser('id') userId: string, @Body() completeProfileDto: CompleteProfileDto) {
    return this.usersService.completeProfile(userId, completeProfileDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, updateUserDto, user.tenantId, false, user);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({ status: 200, description: 'User role changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changeRole(@Param('id') id: string, @Body() changeRoleDto: ChangeUserRoleDto, @CurrentUser() user: any) {
    return this.usersService.changeRole(id, changeRoleDto, user.tenantId, user);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status toggled successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.toggleActive(id, user.tenantId, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a user (can be restored)' })
  @ApiResponse({ status: 204, description: 'User soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.tenantId, user);
  }

  @Delete(':id/permanent')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a user (CANNOT be restored)' })
  @ApiResponse({ status: 204, description: 'User permanently deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  hardDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.hardDelete(id, user.tenantId, user);
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User is not deleted' })
  restore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.restore(id, user.tenantId, user);
  }

  // NEW: Multi-role endpoints
  @Post(':id/roles')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign multiple roles to a user' })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 400, description: 'Invalid role assignment' })
  async assignRoles(
    @Param('id') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.userRolesService.assignRoles(
      userId,
      assignRolesDto.primaryRoleId,
      assignRolesDto.additionalRoleIds || [],
      assignRolesDto.replaceExisting ?? true,
      currentUserId,
      (user as any).tenantId,
      user,
    );
  }

  @Get(':id/roles')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all roles for a user' })
  @ApiResponse({ status: 200, description: 'User roles retrieved successfully' })
  async getUserRoles(@Param('id') userId: string, @CurrentUser() user: any) {
    return this.userRolesService.getUserRoles(userId, user.tenantId);
  }

  @Delete(':id/roles/:roleId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a specific role from a user' })
  @ApiResponse({ status: 204, description: 'Role removed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot remove primary role' })
  async removeRole(
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: any,
  ) {
    await this.userRolesService.removeRole(userId, roleId, user.tenantId, user);
  }
}
