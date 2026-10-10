import { Controller, Get, Post, Put, Body, UseGuards, Param, Delete } from '@nestjs/common';
import { ProductManagementService } from '../services/product-management.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Controller('commerce/admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminProductController {
    constructor(private readonly productManagementService: ProductManagementService) { }

    @Get()
    async getProducts() {
        return this.productManagementService.getAdminProducts();
    }

    @Post()
    async createProduct(@Body() body: any) {
        // Body validation should be handled by DTO
        return this.productManagementService.createProduct(body);
    }

    @Get(':id')
    async getProductById(@Param('id') id: string) {
        return this.productManagementService.getProductById(id);
    }

    @Put(':id')
    async updateProduct(@Param('id') id: string, @Body() body: any) {
        return this.productManagementService.updateProduct(id, body);
    }

    @Delete(':id')
    async archiveProduct(@Param('id') id: string) {
        return this.productManagementService.archiveProduct(id);
    }
}
