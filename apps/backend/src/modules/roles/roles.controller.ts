import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  /**
   * Create a new role
   * Only Admin can create roles
   */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  /**
   * Get all roles
   * Admin and Viewers can see all roles
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Returns all roles with user counts' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('resources')
  @Roles(UserRole.ADMIN, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get the canonical tenant permission catalog' })
  getResources() {
    return this.rolesService.getResources();
  }

  /**
   * Get role by ID
   * Admin and Viewers can view role details
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Returns role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  /**
   * Update role
   * Only Admin can update roles
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify system roles' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  /**
   * Delete role
   * Only Admin can delete roles
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete system role or role with users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
  }

  /**
   * Get role permissions
   * Admin and Viewers can view permissions
   */
  @Get(':id/permissions')
  @Roles(UserRole.ADMIN, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get role permissions' })
  @ApiResponse({ status: 200, description: 'Returns array of permission IDs' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  getPermissions(@Param('id') id: string) {
    return this.rolesService.getPermissions(id);
  }

  /**
   * Update role permissions
   * Only Admin can update permissions
   */
  @Patch(':id/permissions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  updatePermissions(
    @Param('id') id: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.rolesService.updatePermissions(id, permissions);
  }

  /**
   * Get user count for role
   */
  @Get(':id/user-count')
  @Roles(UserRole.ADMIN, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get number of users with this role' })
  @ApiResponse({ status: 200, description: 'Returns user count' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getUserCount(@Param('id') id: string) {
    const count = await this.rolesService.getUserCount(id);
    return { count };
  }
}
