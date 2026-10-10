import { useState, useEffect } from 'react';
import { httpClient } from '@/lib/api/http-client';

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT';
  description?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  active: boolean;
  sortOrder: number;
}

export interface MappingField {
  key: string;
  label: string;
  required: boolean;
  type: string;
}

export function useCustomFields() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [mappingFields, setMappingFields] = useState<MappingField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomFields = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await httpClient.getWrapped<CustomField[]>('/email-marketing/custom-fields?activeOnly=true');
      setCustomFields(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMappingFields = async () => {
    try {
      const result = await httpClient.getWrapped<MappingField[]>('/email-marketing/custom-fields/mapping-options');
      setMappingFields(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const createCustomField = async (fieldData: Omit<CustomField, 'id' | 'sortOrder' | 'active'>) => {
    try {
      const result = await httpClient.postWrapped<CustomField>('/email-marketing/custom-fields', fieldData);
      await fetchCustomFields(); // Refresh the list
      await fetchMappingFields(); // Refresh mapping options
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const updateCustomField = async (id: string, fieldData: Partial<CustomField>) => {
    try {
      const result = await httpClient.putWrapped<CustomField>(`/email-marketing/custom-fields/${id}`, fieldData);
      await fetchCustomFields(); // Refresh the list
      await fetchMappingFields(); // Refresh mapping options
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const deleteCustomField = async (id: string) => {
    try {
      await httpClient.delete(`/email-marketing/custom-fields/${id}`);
      await fetchCustomFields(); // Refresh the list
      await fetchMappingFields(); // Refresh mapping options
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const reorderCustomFields = async (fieldIds: string[]) => {
    try {
      await httpClient.put('/email-marketing/custom-fields/reorder', { fieldIds });
      await fetchCustomFields(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  useEffect(() => {
    fetchCustomFields();
    fetchMappingFields();
  }, []);

  return {
    customFields,
    mappingFields,
    loading,
    error,
    refetch: () => {
      fetchCustomFields();
      fetchMappingFields();
    },
    createCustomField,
    updateCustomField,
    deleteCustomField,
    reorderCustomFields,
  };
}