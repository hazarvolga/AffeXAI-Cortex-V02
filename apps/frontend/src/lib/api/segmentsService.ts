import { BaseApiService } from './base-service';
import type {
  Segment,
  CreateSegmentDto,
  UpdateSegmentDto,
} from '@affexai/shared-types';

// Re-export types for convenience
export type {
  Segment,
  CreateSegmentDto,
  UpdateSegmentDto,
};

/**
 * Segments Service
 * Handles email marketing segment operations extending BaseApiService
 */
class SegmentsService extends BaseApiService<Segment, CreateSegmentDto, UpdateSegmentDto> {
  constructor() {
    super({ endpoint: '/email-marketing/segments', useWrappedResponses: true });
  }
}

export const segmentsService = new SegmentsService();
export default segmentsService;