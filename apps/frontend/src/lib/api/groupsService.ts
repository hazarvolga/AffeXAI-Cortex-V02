import { BaseApiService } from './base-service';
import type {
  Group,
  CreateGroupDto,
  UpdateGroupDto,
} from '@affexai/shared-types';

// Re-export types for convenience
export type {
  Group,
  CreateGroupDto,
  UpdateGroupDto,
};

/**
 * Groups Service
 * Handles email marketing group operations extending BaseApiService
 */
class GroupsService extends BaseApiService<Group, CreateGroupDto, UpdateGroupDto> {
  constructor() {
    super({ endpoint: '/email-marketing/groups', useWrappedResponses: true });
  }
}

export const groupsService = new GroupsService();
export default groupsService;