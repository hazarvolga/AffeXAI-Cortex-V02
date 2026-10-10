import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/guards/permissions.guard';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Ip } from '@nestjs/common';
import { SubscriberService } from './subscriber.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { Subscriber } from './entities/subscriber.entity';
import { AdvancedEmailValidationService } from './services/advanced-email-validation.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('marketing.manage')
@Controller('email-marketing/subscribers')
export class SubscriberController {
  constructor(
    private readonly subscriberService: SubscriberService,
    private readonly advancedEmailValidationService: AdvancedEmailValidationService
  ) { }

  @Post()
  create(@Body() createSubscriberDto: CreateSubscriberDto, @Ip() ip: string): Promise<Subscriber> {
    return this.subscriberService.create(createSubscriberDto, ip);
  }

  @Get('validate-email')
  async validateEmail(
    @Query('email') email: string,
    @Query('ip') ip?: string
  ): Promise<any> {
    // This endpoint can be used by the frontend to validate an email before adding a subscriber
    const result = await this.advancedEmailValidationService.validateEmail(email, ip);
    return result;
  }

  @Get()
  findAll(): Promise<Subscriber[]> {
    return this.subscriberService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Subscriber> {
    return this.subscriberService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubscriberDto: UpdateSubscriberDto): Promise<Subscriber> {
    return this.subscriberService.update(id, updateSubscriberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.subscriberService.remove(id);
  }

  @Post('subscribe')
  subscribe(@Body('email') email: string, @Ip() ip: string): Promise<Subscriber> {
    return this.subscriberService.subscribe(email, ip);
  }

  @Post('unsubscribe')
  unsubscribe(@Body('email') email: string): Promise<Subscriber> {
    return this.subscriberService.unsubscribe(email);
  }
}