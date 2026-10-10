import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CommerceController } from './controllers/commerce.controller';
import { CommerceService } from './services/commerce.service';
import { Product } from './entities/product.entity';
import { Price } from './entities/price.entity';
import { Subscription } from './entities/subscription.entity';
import { UsageRecord } from './entities/usage-record.entity';
import { StripeProvider } from './services/stripe.provider';
import { PaymentWebhookController } from './controllers/payment.webhook.controller';
import { AdminProductController } from './controllers/admin-product.controller';
import { ProductManagementService } from './services/product-management.service';
import { ProvisioningService } from './services/provisioning.service';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { MailModule } from '../mail/mail.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            Price,
            Subscription,
            UsageRecord,
            Organization,
            User,
            Role
        ]),
        forwardRef(() => MailModule),
        forwardRef(() => SettingsModule),
        ConfigModule,
    ],
    controllers: [CommerceController, PaymentWebhookController, AdminProductController],
    providers: [CommerceService, StripeProvider, ProductManagementService, ProvisioningService],
    exports: [CommerceService, StripeProvider, ProductManagementService, ProvisioningService],
})
export class CommerceModule { }
