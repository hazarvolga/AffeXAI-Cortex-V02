/**
 * Automation Hooks
 * React Query hooks for marketing automation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '@/lib/api/automation';
import type {
  Automation,
  CreateAutomationDto,
  UpdateAutomationDto,
  GetExecutionsQuery,
  AnalyticsQuery,
} from '@/types/automation';
import { toast } from 'sonner';

// Query keys
export const automationKeys = {
  all: ['automations'] as const,
  lists: () => [...automationKeys.all, 'list'] as const,
  list: (filters?: any) => [...automationKeys.lists(), filters] as const,
  details: () => [...automationKeys.all, 'detail'] as const,
  detail: (id: string) => [...automationKeys.details(), id] as const,
  executions: (query: GetExecutionsQuery) => [...automationKeys.all, 'executions', query] as const,
  analytics: (id: string, query?: AnalyticsQuery) =>
    [...automationKeys.all, 'analytics', id, query] as const,
  queueMetrics: () => [...automationKeys.all, 'queue', 'metrics'] as const,
};

/**
 * Get all automations
 */
export function useAutomations() {
  return useQuery({
    queryKey: automationKeys.lists(),
    queryFn: () => automationApi.getAll(),
  });
}

/**
 * Get automation by ID
 */
export function useAutomation(id: string) {
  return useQuery({
    queryKey: automationKeys.detail(id),
    queryFn: () => automationApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Create automation
 */
export function useCreateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateAutomationDto) => automationApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.lists() });
      toast.success('Automation created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create automation');
    },
  });
}

/**
 * Update automation
 */
export function useUpdateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAutomationDto }) =>
      automationApi.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: automationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: automationKeys.detail(data.id) });
      toast.success('Automation updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update automation');
    },
  });
}

/**
 * Delete automation
 */
export function useDeleteAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => automationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.lists() });
      toast.success('Automation deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete automation');
    },
  });
}

/**
 * Activate automation
 */
export function useActivateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, registerExisting }: { id: string; registerExisting?: boolean }) =>
      automationApi.activate(id, registerExisting),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: automationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: automationKeys.detail(data.id) });
      toast.success('Automation activated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate automation');
    },
  });
}

/**
 * Pause automation
 */
export function usePauseAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cancelPending }: { id: string; cancelPending?: boolean }) =>
      automationApi.pause(id, cancelPending),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: automationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: automationKeys.detail(data.id) });
      toast.success('Automation paused successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to pause automation');
    },
  });
}

/**
 * Get executions
 */
export function useExecutions(query: GetExecutionsQuery) {
  return useQuery({
    queryKey: automationKeys.executions(query),
    queryFn: () => automationApi.getExecutions(query),
  });
}

/**
 * Get analytics
 */
export function useAutomationAnalytics(id: string, query?: AnalyticsQuery) {
  return useQuery({
    queryKey: automationKeys.analytics(id, query),
    queryFn: () => automationApi.getAnalytics(id, query),
    enabled: !!id,
  });
}

/**
 * Test automation
 */
export function useTestAutomation() {
  return useMutation({
    mutationFn: ({
      id,
      subscriberId,
      dryRun,
    }: {
      id: string;
      subscriberId: string;
      dryRun?: boolean;
    }) => automationApi.test(id, subscriberId, dryRun),
    onSuccess: () => {
      toast.success('Test completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Test failed');
    },
  });
}

/**
 * Get queue metrics
 */
export function useQueueMetrics() {
  return useQuery({
    queryKey: automationKeys.queueMetrics(),
    queryFn: () => automationApi.getQueueMetrics(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}
