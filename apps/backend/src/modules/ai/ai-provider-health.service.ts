import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiProviderHealthService {
  private readonly logger = new Logger(AiProviderHealthService.name);
  private readonly cortexUrl = process.env.CORTEX_URL || 'http://localhost:8000';

  async getCortexStatus() {
    try {
      const start = Date.now();
      const response = await axios.get(`${this.cortexUrl}/health`, { timeout: 3000 });
      const responseTime = Date.now() - start;
      
      return {
        available: response.status === 200 && response.data.status === 'alive',
        responseTime,
        brain: 'readiness-not-verified',
        livenessOnly: true,
        lastChecked: new Date(),
      };
    } catch (error) {
      this.logger.warn('Cortex liveness check failed');
      return {
        available: false,
        error: 'Cortex is unavailable',
        lastChecked: new Date(),
      };
    }
  }
}
