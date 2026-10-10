import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CrawlQueueService {
    private readonly logger = new Logger(CrawlQueueService.name);
    private queue: Array<() => Promise<any>> = [];
    private isProcessing = false;

    /**
     * Adds a crawl job to the sequential queue
     */
    async addJob<T>(job: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const wrappedJob = async () => {
                try {
                    const result = await job();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };

            this.queue.push(wrappedJob);
            this.processNext();
        });
    }

    private async processNext() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const currentJob = this.queue.shift();

        if (currentJob) {
            this.logger.debug(`[CrawlQueue] Processing next job. Queue depth: ${this.queue.length}`);
            try {
                await currentJob();
            } finally {
                // RAM Guard: Small delay between jobs to allow GC
                setTimeout(() => {
                    this.isProcessing = false;
                    this.processNext();
                }, 1000);
            }
        }
    }
}
