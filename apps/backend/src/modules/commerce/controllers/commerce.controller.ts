import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { CommerceService } from '../services/commerce.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { PlatformAdminGuard } from '../../../core/auth/guards/platform-admin.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Controller('commerce')
@UseGuards(JwtAuthGuard)
export class CommerceController {
    constructor(private readonly commerceService: CommerceService) { }

    @Public()
    @Get('products')
    async getProducts() {
        return this.commerceService.getProducts();
    }

    @Post('products')
    @UseGuards(PlatformAdminGuard)
    async createProduct(@Body() body: any) {
        return this.commerceService.createProduct(body);
    }

    @Get('subscription')
    async getMySubscription(@Request() req) {
        return this.commerceService.getSubscription(req.user.tenantId);
    }

    @Get('limits')
    async getLimits(@Request() req) {
        console.log(`[CommerceController] checkLimit for tenant: ${req.user?.tenantId}`);
        return this.commerceService.checkLimit(req.user?.tenantId);
    }

    @Get('usage')
    async getUsage(@Request() req) {
        return this.commerceService.getUsageStats(req.user?.tenantId);
    }

    @Post('checkout')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async createCheckoutSession(@Request() req, @Body() body: { priceId: string }) {
        const session = await this.commerceService.createCheckoutSession(req.user.tenantId, req.user.id, body.priceId, req.user.email);
        return { url: session.url };
    }

    // Admin-only (protected by role in real scenario) or Debug endpoint
    @Post('assign-plan')
    @UseGuards(PlatformAdminGuard)
    async assignPlan(@Body() body: { tenantId: string; priceId: string }) {
        return this.commerceService.assignPlan(body.tenantId, body.priceId);
    }

    // ── Auditor / Admin Analytics ──
    @Get('admin/revenue-summary')
    @UseGuards(PlatformAdminGuard)
    async getRevenueSummary() {
        return this.commerceService.getRevenueSummary();
    }

    @Get('admin/invoices')
    @UseGuards(PlatformAdminGuard)
    async getAdminInvoices() {
        return this.commerceService.getAdminInvoices();
    }

    @Get('admin/token-economics')
    @UseGuards(PlatformAdminGuard)
    async getTokenEconomics() {
        return this.commerceService.getTokenEconomics();
    }
}
