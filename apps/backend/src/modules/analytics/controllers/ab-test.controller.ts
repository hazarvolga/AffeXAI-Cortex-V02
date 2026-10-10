import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ABTestingService } from '../services';
import { CreateABTestDto, UpdateABTestDto } from '../dto';
import { ABTestStatus } from '../entities';

@Controller('ab-tests')
@UseGuards(JwtAuthGuard)
export class ABTestController {
  constructor(private readonly abTestingService: ABTestingService) { }

  /**
   * Create new A/B test
   * POST /ab-tests
   */
  @Post()
  async createTest(@Body() dto: CreateABTestDto, @CurrentUser() user: User) {
    return this.abTestingService.createTest(dto);
  }

  /**
   * Get all A/B tests
   * GET /ab-tests
   */
  @Get()
  async getAllTests(@Query('status') status: ABTestStatus, @CurrentUser() user: User) {
    return this.abTestingService.getAllTests(status);
  }

  /**
   * Get A/B test by ID
   * GET /ab-tests/:id
   */
  @Get(':id')
  async getTestById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.abTestingService.getTestById(id);
  }

  /**
   * Update A/B test
   * PUT /ab-tests/:id
   */
  @Put(':id')
  async updateTest(@Param('id') id: string, @Body() dto: UpdateABTestDto, @CurrentUser() user: User) {
    return this.abTestingService.updateTest(id, dto);
  }

  /**
   * Delete A/B test
   * DELETE /ab-tests/:id
   */
  @Delete(':id')
  async deleteTest(@Param('id') id: string, @CurrentUser() user: User) {
    await this.abTestingService.deleteTest(id);
    return { message: 'Test deleted successfully' };
  }

  /**
   * Start A/B test
   * POST /ab-tests/:id/start
   */
  @Post(':id/start')
  async startTest(@Param('id') id: string, @CurrentUser() user: User) {
    return this.abTestingService.startTest(id);
  }

  /**
   * Pause A/B test
   * POST /ab-tests/:id/pause
   */
  @Post(':id/pause')
  async pauseTest(@Param('id') id: string, @CurrentUser() user: User) {
    return this.abTestingService.pauseTest(id);
  }

  /**
   * Complete A/B test
   * POST /ab-tests/:id/complete
   */
  @Post(':id/complete')
  async completeTest(
    @Param('id') id: string,
    @Body('winnerVariantId') winnerVariantId: string,
    @CurrentUser() user: User,
  ) {
    return this.abTestingService.completeTest(id, winnerVariantId);
  }
}
