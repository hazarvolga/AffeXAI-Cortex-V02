import { httpClient } from "@/lib/api/http-client";

export interface CrmCustomer {
  id: string;
  companyName: string;
  email: string;
  customerNumber?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Neural Metrics
  resonanceScore?: number;
  sentimentScore?: number;
  frictionRank?: number;
  lastInteractionAt?: string;
}

export interface CreateCrmCustomerDto {
  companyName: string;
  email: string;
  customerNumber?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  isActive?: boolean;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface BulkImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface CrmStats {
  total: number;
  active: number;
  inactive: number;
}

export interface CrmCustomerPage {
  items: CrmCustomer[];
  total: number;
  page: number;
  limit: number;
}

interface CrmCustomerPageResponse {
  success: true;
  data: CrmCustomer[];
  meta: { total: number; page: number; limit: number; count: number };
}

class CrmService {
  private baseUrl = "/crm";

  async getPage(page = 1, limit = 25, search = ""): Promise<CrmCustomerPage> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search.trim()) params.set("search", search.trim());
    const response = await httpClient.get<CrmCustomerPageResponse>(
      `${this.baseUrl}?${params.toString()}`,
    );
    return {
      items: response.data,
      total: response.meta.total,
      page: response.meta.page,
      limit: response.meta.limit,
    };
  }

  async getStats(): Promise<CrmStats> {
    return httpClient.getWrapped<CrmStats>(`${this.baseUrl}/stats`);
  }

  async getOne(id: string): Promise<CrmCustomer> {
    return httpClient.getWrapped<CrmCustomer>(`${this.baseUrl}/${id}`);
  }

  async create(data: CreateCrmCustomerDto): Promise<CrmCustomer> {
    return httpClient.postWrapped<CrmCustomer>(this.baseUrl, data);
  }

  async bulkImport(
    customers: CreateCrmCustomerDto[],
  ): Promise<BulkImportResult> {
    return httpClient.postWrapped<BulkImportResult>(`${this.baseUrl}/import`, {
      customers,
    });
  }

  async update(
    id: string,
    data: Partial<CreateCrmCustomerDto>,
  ): Promise<CrmCustomer> {
    return httpClient.putWrapped<CrmCustomer>(`${this.baseUrl}/${id}`, data);
  }

  async remove(id: string): Promise<void> {
    await httpClient.deleteWrapped<void>(`${this.baseUrl}/${id}`);
  }

  async hardDelete(id: string): Promise<void> {
    await httpClient.deleteWrapped<void>(`${this.baseUrl}/${id}/hard`);
  }
}

export const crmService = new CrmService();
