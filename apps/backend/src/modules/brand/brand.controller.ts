import { Controller, Get, UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandIntelligenceDto } from './dto/brand-intelligence.dto';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';

@Controller('brand')
@UseGuards(JwtAuthGuard)
export class BrandController {
    constructor(private readonly brandService: BrandService) { }

    @Get('intelligence')
    async getIntelligence(@CurrentUser() user: any): Promise<BrandIntelligenceDto> {
        const tenantId = user.tenantId || user.organizationId || 'default';
        return this.brandService.getBrandIntelligence(tenantId);
    }
}
