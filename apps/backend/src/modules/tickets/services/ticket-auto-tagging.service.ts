import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Auto-tagging Service
 * Automatically assigns tags to tickets based on content analysis
 */

export interface TagRule {
  tag: string;
  keywords: string[];
  priority?: number;
}

@Injectable()
export class TicketAutoTaggingService {
  private readonly logger = new Logger(TicketAutoTaggingService.name);

  // Tag rules with keywords (Turkish + English)
  private readonly tagRules: TagRule[] = [
    // Technical Issues
    {
      tag: 'bug',
      keywords: [
        'bug', 'hata', 'sorun', 'problem', 'çalışmıyor', 'not working',
        'error', 'crash', 'broken', 'fail', 'failed', 'bozuk', 'arıza',
      ],
      priority: 10,
    },
    {
      tag: 'performance',
      keywords: [
        'slow', 'yavaş', 'ağır', 'lag', 'latency', 'freeze', 'donma',
        'takılıyor', 'kasma', 'gecikmeli', 'timeout', '느림',
      ],
      priority: 8,
    },

    // Feature & Enhancement
    {
      tag: 'feature-request',
      keywords: [
        'feature', 'özellik', 'request', 'istek', 'can you add', 'ekleyebilir misiniz',
        'would be nice', 'suggestion', 'öneri', 'improvement', 'iyileştirme',
        'enhancement', 'geliştirme',
      ],
      priority: 7,
    },
    {
      tag: 'enhancement',
      keywords: [
        'better', 'daha iyi', 'improve', 'geliştir', 'optimize', 'optimize et',
        'faster', 'daha hızlı', 'easier', 'daha kolay', 'modernize',
      ],
      priority: 6,
    },

    // Account & Authentication
    {
      tag: 'authentication',
      keywords: [
        'login', 'giriş', 'password', 'şifre', 'sign in', 'oturum',
        'logout', 'çıkış', 'forgot password', 'şifremi unuttum',
        'reset password', 'şifre sıfırlama', '2fa', 'two-factor',
      ],
      priority: 9,
    },
    {
      tag: 'account',
      keywords: [
        'account', 'hesap', 'profile', 'profil', 'settings', 'ayarlar',
        'delete account', 'hesabı sil', 'suspend', 'askıya al',
      ],
      priority: 8,
    },

    // Billing & Payments
    {
      tag: 'billing',
      keywords: [
        'billing', 'fatura', 'invoice', 'payment', 'ödeme', 'charge',
        'ücret', 'subscription', 'abonelik', 'plan', 'upgrade',
        'yükselt', 'downgrade', 'düşür', 'refund', 'iade',
      ],
      priority: 9,
    },
    {
      tag: 'payment-failed',
      keywords: [
        'payment failed', 'ödeme başarısız', 'declined', 'reddedildi',
        'credit card', 'kredi kartı', 'insufficient funds', 'yetersiz bakiye',
      ],
      priority: 10,
    },

    // Questions & Support
    {
      tag: 'question',
      keywords: [
        'how to', 'nasıl', 'how do i', 'how can i', 'nasıl yapabilirim',
        'what is', 'nedir', 'where is', 'nerede', 'why', 'neden',
        'soru', 'question', 'help', 'yardım',
      ],
      priority: 5,
    },
    {
      tag: 'documentation',
      keywords: [
        'documentation', 'dokümantasyon', 'guide', 'kılavuz', 'tutorial',
        'how-to', 'manual', 'kullanım kılavuzu', 'instructions', 'talimatlar',
      ],
      priority: 4,
    },

    // Integration & API
    {
      tag: 'api',
      keywords: [
        'api', 'endpoint', 'webhook', 'integration', 'entegrasyon',
        'rest', 'graphql', 'sdk', 'library', 'kütüphane',
      ],
      priority: 7,
    },
    {
      tag: 'integration',
      keywords: [
        'integration', 'entegrasyon', 'connect', 'bağlan', 'sync', 'senkronize',
        'import', 'export', 'dışa aktar', 'içe aktar', 'third-party',
      ],
      priority: 7,
    },

    // Security & Privacy
    {
      tag: 'security',
      keywords: [
        'security', 'güvenlik', 'hack', 'breach', 'ihlal', 'vulnerability',
        'zafiyet', 'encrypt', 'şifreleme', 'ssl', 'https', 'secure',
      ],
      priority: 10,
    },
    {
      tag: 'privacy',
      keywords: [
        'privacy', 'gizlilik', 'gdpr', 'kvkk', 'personal data', 'kişisel veri',
        'delete data', 'veriyi sil', 'data protection', 'veri koruma',
      ],
      priority: 9,
    },

    // Mobile & Desktop
    {
      tag: 'mobile',
      keywords: [
        'mobile', 'mobil', 'ios', 'android', 'phone', 'telefon',
        'tablet', 'app', 'uygulama',
      ],
      priority: 6,
    },
    {
      tag: 'desktop',
      keywords: [
        'desktop', 'masaüstü', 'windows', 'mac', 'linux',
        'electron', 'application',
      ],
      priority: 6,
    },

    // UI/UX
    {
      tag: 'ui',
      keywords: [
        'ui', 'user interface', 'arayüz', 'design', 'tasarım',
        'button', 'buton', 'menu', 'menü', 'layout', 'düzen',
      ],
      priority: 5,
    },
    {
      tag: 'ux',
      keywords: [
        'ux', 'user experience', 'kullanıcı deneyimi', 'confusing', 'kafa karıştırıcı',
        'difficult', 'zor', 'complicated', 'karmaşık', 'usability',
      ],
      priority: 5,
    },

    // Data & Export
    {
      tag: 'data-loss',
      keywords: [
        'data loss', 'veri kaybı', 'lost data', 'kayıp veri', 'missing', 'eksik',
        'disappeared', 'kayboldu', 'deleted', 'silindi',
      ],
      priority: 10,
    },
    {
      tag: 'export',
      keywords: [
        'export', 'dışa aktar', 'download', 'indir', 'csv', 'excel',
        'pdf', 'backup', 'yedek',
      ],
      priority: 5,
    },

    // Notification & Email
    {
      tag: 'notification',
      keywords: [
        'notification', 'bildirim', 'alert', 'uyarı', 'email notification',
        'e-posta bildirimi', 'push notification',
      ],
      priority: 4,
    },
    {
      tag: 'email',
      keywords: [
        'email', 'e-posta', 'mail', 'posta', 'inbox', 'gelen kutusu',
        'spam', 'newsletter', 'bülten',
      ],
      priority: 4,
    },
  ];

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Get current tenant ID from TenantService
   * @private
   */
  private getActiveTenantId(): string {
    const tenantId = this.tenantService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return tenantId;
  }

  /**
   * Automatically tag a ticket based on content
   */
  async autoTag(ticket: Ticket): Promise<string[]> {
    const content = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const detectedTags: { tag: string; score: number }[] = [];

    // Check each rule
    for (const rule of this.tagRules) {
      let score = 0;

      for (const keyword of rule.keywords) {
        const keywordLower = keyword.toLowerCase();
        const occurrences = keywordLower ? content.split(keywordLower).length - 1 : 0;

        if (occurrences > 0) {
          // Weight by keyword occurrence and priority
          score += occurrences * (rule.priority || 1);
        }
      }

      if (score > 0) {
        detectedTags.push({ tag: rule.tag, score });
      }
    }

    // Sort by score and take top tags
    detectedTags.sort((a, b) => b.score - a.score);
    const selectedTags = detectedTags.slice(0, 5).map(t => t.tag);

    this.logger.log(
      `Auto-tagged ticket ${ticket.id} with: ${selectedTags.join(', ')} (from ${detectedTags.length} detected tags)`,
    );

    return selectedTags;
  }

  /**
   * Update ticket with auto-generated tags
   */
  async applyAutoTags(ticketId: string): Promise<Ticket> {
    const tenantId = this.getActiveTenantId();
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const autoTags = await this.autoTag(ticket);

    // Merge with existing tags (avoid duplicates)
    const existingTags = ticket.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...autoTags]));

    const result = await this.ticketRepository.update({ id: ticketId, tenantId }, { tags: mergedTags });
    if (result.affected !== 1) throw new NotFoundException(`Ticket ${ticketId} not found`);

    this.logger.log(`Applied auto-tags to ticket ${ticketId}: ${autoTags.join(', ')}`);
    return { ...ticket, tags: mergedTags };
  }

  /**
   * Get suggested tags without applying them
   */
  async getSuggestedTags(ticketId: string): Promise<string[]> {
    const tenantId = this.getActiveTenantId();
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    return await this.autoTag(ticket);
  }

  /**
   * Add custom tag rule
   */
  addTagRule(rule: TagRule): void {
    this.tagRules.push({ ...rule, keywords: [...rule.keywords] });
    this.logger.log(`Added custom tag rule: ${rule.tag}`);
  }

  /**
   * Get all tag rules
   */
  getTagRules(): TagRule[] {
    return this.tagRules.map(rule => ({ ...rule, keywords: [...rule.keywords] }));
  }
}
