import { useState, useEffect } from 'react';
import { httpClient } from '@/lib/api/http-client';

export interface ImportGroup {
  id: string;
  name: string;
  description: string;
  subscriberCount: number;
}

export interface ImportSegment {
  id: string;
  name: string;
  description: string;
  subscriberCount: number;
  openRate: number;
  clickRate: number;
}

export function useGroupsAndSegments() {
  const [groups, setGroups] = useState<ImportGroup[]>([]);
  const [segments, setSegments] = useState<ImportSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const result = await httpClient.getWrapped<ImportGroup[]>('/email-marketing/groups/import/options');
      setGroups(result || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const fetchSegments = async () => {
    try {
      const result = await httpClient.getWrapped<ImportSegment[]>('/email-marketing/segments/import/options');
      setSegments(result || []);
    } catch (err) {
      console.error('Error fetching segments:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([fetchGroups(), fetchSegments()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    groups,
    segments,
    loading,
    error,
    refetch: fetchData,
  };
}