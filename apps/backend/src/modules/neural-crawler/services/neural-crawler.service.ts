import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { publicUrlFetcher } from '../../../core/network/public-url-fetcher';
import * as cheerio from 'cheerio';
import { CrawlQueueService } from './crawl-queue.service';
import { NeuralSignal } from '../../neural-grid/interfaces/neural-signal.interface';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class NeuralCrawlerService {
    private readonly logger = new Logger(NeuralCrawlerService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly eventEmitter: EventEmitter2,
        private readonly queueService: CrawlQueueService,
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
        private readonly settingsService: SettingsService,
    ) { }

    /**
     * [NEURAL CRAWLER] Main entry point for crawling a target
     */
    async processTarget(tenantId: string, url: string, type: 'COMPETITOR' | 'SECTOR' | 'REPUTATION') {
        this.logger.log(`[NeuralCrawler] Task Queued: ${type} | URL: ${url}`);

        // Add to strict sequential queue to protect RAM
        return this.queueService.addJob(async () => {
            try {
                const content = await this.performLightweightCrawl(url);

                // Emit intelligence signal to Neural Grid
                const signal: any = {
                    source: 'crawler',
                    type: `intelligence.${type.toLowerCase()}`,
                    tenantId,
                    content: `EXTERNAL_INTEL [${type}]: ${content.substring(0, 1000)}...`,
                    metadata: {
                        url,
                        crawledAt: new Date(),
                        confidence: 0.85
                    }
                };

                this.eventEmitter.emit('neural.signal', signal);
                this.logger.log(`[NeuralCrawler] Signal Emitted: ${type}`);

                return content;
            } catch (err) {
                this.logger.error(`[NeuralCrawler] Crawl failed for ${url}: ${err.message}`);
                throw err;
            }
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleNightlyCrawl() {
        this.logger.log('[NeuralCrawler] Starting nightly autonomous intelligence scan...');

        // Fetch all active tenants
        const organizations = await this.orgRepo.find({ where: { isActive: true } });
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0-6 (Sunday-Saturday)

        for (const org of organizations) {
            const tenantId = org.slug || org.id;

            try {
                // Get tenant specific Strategic Radar settings
                const settings = await this.settingsService.getSiteSettings(tenantId);
                const radar = settings.strategicRadar;

                if (!radar || !radar.competitors?.enabled && !radar.focusPulse?.enabled) {
                    this.logger.debug(`[NeuralCrawler] Skipping tenant ${tenantId}: Radar disabled.`);
                    continue;
                }

                // Check reporting cycle (Safe staggered execution)
                const cycle = radar.reportingCycle || 'weekly';
                const shouldCrawlToday =
                    cycle === 'daily' ||
                    (cycle === 'weekly' && dayOfWeek === 1) || // Mondays
                    (cycle === 'bi-weekly' && (dayOfWeek === 1 && Math.floor(now.getDate() / 7) % 2 === 0)) ||
                    (cycle === 'monthly' && now.getDate() === 1);

                if (!shouldCrawlToday) {
                    this.logger.debug(`[NeuralCrawler] Skipping tenant ${tenantId}: Cycle ${cycle} is not due today.`);
                    continue;
                }

                this.logger.log(`[NeuralCrawler] Executing Radar for Tenant: ${tenantId}`);

                // 1. Competitor Scan
                if (radar.competitors?.enabled && radar.competitors.urls.length > 0) {
                    for (const url of radar.competitors.urls) {
                        await this.processTarget(tenantId, url, 'COMPETITOR');
                    }
                }

                // 2. Focus Pulse (Keyword Scan)
                if (radar.focusPulse?.enabled && radar.focusPulse.keywords.length > 0) {
                    for (const keyword of radar.focusPulse.keywords) {
                        const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(keyword)}`;
                        await this.processTarget(tenantId, searchUrl, 'REPUTATION');
                    }
                }

            } catch (err) {
                this.logger.error(`[NeuralCrawler] Intelligence failed for tenant ${tenantId}: ${err.message}`);
            }
        }
    }

    /**
     * [NEURAL GRID] Reactive Ticket Knowledge Enhancement
     * Triggered when a new ticket is created
     */
    @OnEvent('ticket.created')
    async handleTicketIntelligence(payload: any) {
        const { id, subject, tenantId } = payload;
        this.logger.log(`[NeuralCrawler] Enhancing intelligence for Ticket: ${id}`);

        // Search sectoral documentation based on ticket subject
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(subject + " documentation solution")}`;
        await this.processTarget(tenantId, searchUrl, 'SECTOR');
    }

    /**
     * Tries to fetch data using simple HTTP first (No browser)
     */
    private async performLightweightCrawl(url: string): Promise<string> {
        this.logger.debug(`[NeuralCrawler] Attempting lightweight fetch: ${url}`);
        const response = await publicUrlFetcher.fetch(url, { timeoutMs: 10000 });
        const contentType = String(response.headers['content-type'] || '');
        if (!/^(text\/html|application\/xhtml\+xml|text\/plain)(?:;|$)/i.test(contentType)) {
            throw new Error('Unsupported crawl content type');
        }
        const $ = cheerio.load(response.text);
        $('script, style, nav, header, footer, aside, iframe, noscript').remove();
        const content = (contentType.startsWith('text/plain') ? response.text : $('body').text()).replace(/\s+/g, ' ').trim();
        if (!content) throw new Error('No readable static content; isolated dynamic rendering is not supported');
        return content;
    }
}
