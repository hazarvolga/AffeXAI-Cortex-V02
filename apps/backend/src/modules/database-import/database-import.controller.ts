import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, UseGuards } from '@nestjs/common';
import { DatabaseImportService } from './database-import.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('database-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class DatabaseImportController {
  constructor(private readonly databaseImportService: DatabaseImportService) { }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async executeSql(
    @Body('sql') sql: string,
    @Body('token') token: string,
  ) {
    // Security: Only allow in production with correct token
    if (process.env.NODE_ENV !== 'production') {
      throw new UnauthorizedException('This endpoint only works in production');
    }

    const IMPORT_TOKEN = process.env.DATABASE_IMPORT_TOKEN;
    if (!IMPORT_TOKEN || token !== IMPORT_TOKEN) {
      throw new UnauthorizedException('Invalid import token');
    }

    const result = await this.databaseImportService.executeSql(sql);
    return {
      success: true,
      message: 'SQL executed successfully',
      rowsAffected: result.rowsAffected,
    };
  }
}
