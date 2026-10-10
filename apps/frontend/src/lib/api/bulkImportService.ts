import { httpClient } from './http-client';
import { 
  bulkOperationErrorHandler, 
  BulkOperationError, 
  BulkOperationErrorType,
  PartialFailureResult 
} from '../errors/bulk-operation-errors';

import { type ImportJob as StoredImportJob, ImportJobStatus, ImportOptions, ImportResult, ImportResultStatus } from '@affexai/shared-types';
export type { ImportOptions, ImportResult } from '@affexai/shared-types';
export { ImportJobStatus, ImportResultStatus } from '@affexai/shared-types';

// Status/list return summaries, while upload/details include configuration fields.
export type ImportJob = Pick<StoredImportJob,
  'id' | 'fileName' | 'status' | 'totalRecords' | 'processedRecords' | 'validRecords' |
  'invalidRecords' | 'riskyRecords' | 'duplicateRecords' | 'progressPercentage' |
  'createdAt' | 'completedAt' | 'error'>
  & Partial<Pick<StoredImportJob, 'options' | 'columnMapping' | 'validationSummary' | 'filePath'>>;

export interface UploadImportFileRequest {
  file: File;
  options: ImportOptions;
}

export interface ImportStatusResponse extends ImportJob {}

export interface ImportResultsResponse {
  results: ImportResult[];
  total: number;
  page: number;
  limit: number;
}

class BulkImportService {
  // Base URL without /api prefix (httpClient adds it automatically)
  // For fetch calls, we'll use the full path with /api
  private baseUrl = '/email-marketing/import';
  private fetchBaseUrl = '/api/email-marketing/import';

  /**
   * Upload CSV file and start import job with comprehensive error handling
   */
  async uploadFile(request: UploadImportFileRequest): Promise<ImportJob> {
    return bulkOperationErrorHandler.executeWithRetry(async () => {
      // Validate file before upload
      this.validateFileBeforeUpload(request.file);

      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('options', JSON.stringify(request.options));

      // Get authentication token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.fetchBaseUrl}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Failed to upload file');
      }

      const result = await response.json();
      console.log('[BulkImportService] Upload response:', result);
      
      // Backend returns wrapped response: { success: true, data: ImportJob, meta: {...} }
      if (result.success && result.data) {
        console.log('[BulkImportService] Extracted job data:', result.data);
        return result.data;
      }
      
      // Fallback: return as-is if not wrapped
      return result;
    }, { operation: 'file_upload', fileName: request.file.name });
  }

  /**
   * Validate file before upload to catch issues early
   */
  private validateFileBeforeUpload(file: File): void {
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      const error = bulkOperationErrorHandler.classifyError(
        new Error('File size exceeds maximum limit of 50MB'),
        { fileName: file.name, fileSize: file.size }
      );
      error.type = BulkOperationErrorType.FILE_TOO_LARGE;
      throw error;
    }

    // Check file type
    const allowedTypes = ['text/csv', 'application/csv', 'text/plain'];
    const allowedExtensions = ['.csv', '.txt'];
    
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      const error = bulkOperationErrorHandler.classifyError(
        new Error('Invalid file format. Please upload a CSV file.'),
        { fileName: file.name, fileType: file.type }
      );
      error.type = BulkOperationErrorType.FILE_INVALID_FORMAT;
      throw error;
    }
  }

  /**
   * Get import job status and progress with retry logic
   */
  async getImportStatus(jobId: string): Promise<ImportStatusResponse> {
    return bulkOperationErrorHandler.executeWithRetry(
      () => httpClient.getWrapped<ImportStatusResponse>(`${this.baseUrl}/${jobId}/status`),
      { operation: 'get_import_status', jobId }
    );
  }

  /**
   * Get detailed import results with error handling
   */
  async getImportResults(
    jobId: string, 
    page: number = 1, 
    limit: number = 100
  ): Promise<ImportResultsResponse> {
    return bulkOperationErrorHandler.executeWithRetry(
      () => httpClient.getWrapped<ImportResultsResponse>(`${this.baseUrl}/${jobId}/results`, {
        params: { page, limit }
      }),
      { operation: 'get_import_results', jobId, page, limit }
    );
  }

  /**
   * Download detailed import report with retry logic
   */
  async downloadReport(jobId: string): Promise<Blob> {
    return bulkOperationErrorHandler.executeWithRetry(async () => {
      const response = await fetch(`${this.baseUrl}/${jobId}/report`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to download report' }));
        throw new Error(error.message || 'Failed to download report');
      }

      return response.blob();
    }, { operation: 'download_report', jobId });
  }

  /**
   * Cancel import job with error handling
   */
  async cancelImport(jobId: string): Promise<void> {
    return bulkOperationErrorHandler.executeWithRetry(
      () => httpClient.deleteWrapped<void>(`${this.baseUrl}/${jobId}`),
      { operation: 'cancel_import', jobId }
    );
  }

  /**
   * Get all import jobs for current user with error handling
   */
  async getImportJobs(
    page: number = 1, 
    limit: number = 20
  ): Promise<{ jobs: ImportJob[]; total: number }> {
    return bulkOperationErrorHandler.executeWithRetry(
      () => httpClient.getWrapped<{ jobs: ImportJob[]; total: number }>(`${this.baseUrl}/jobs`, {
        params: { page, limit }
      }),
      { operation: 'get_import_jobs', page, limit }
    );
  }

  /**
   * Validate CSV structure before upload with comprehensive error handling
   */
  async validateCsvStructure(file: File): Promise<{
    headers: string[];
    rowCount: number;
    sampleRows: string[][];
    isValid: boolean;
    errors: string[];
  }> {
    return bulkOperationErrorHandler.executeWithRetry(async () => {
      // Pre-validate file
      this.validateFileBeforeUpload(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/validate-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Validation failed' }));
        throw new Error(error.message || 'Failed to validate CSV');
      }

      return response.json();
    }, { operation: 'validate_csv', fileName: file.name });
  }

  /**
   * Process import with partial failure handling
   */
  async processImportWithPartialFailureHandling(
    jobId: string,
    batchSize: number = 1000
  ): Promise<PartialFailureResult<ImportResult>> {
    try {
      // Get all results for the job
      const allResults: ImportResult[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.getImportResults(jobId, page, batchSize);
        allResults.push(...response.results);
        hasMore = response.results.length === batchSize;
        page++;
      }

      // Process results in batches with partial failure handling
      return await bulkOperationErrorHandler.handlePartialFailure(
        allResults,
        async (result: ImportResult, index: number) => {
          // Report failures recorded for individual imported rows
          if (result.status === ImportResultStatus.INVALID || result.error) {
            throw new Error(result.error || result.issues?.[0] || 'Processing failed');
          }
          return result;
        },
        { operation: 'process_import_results', jobId }
      );
    } catch (error) {
      const bulkError = bulkOperationErrorHandler.classifyError(error, {
        operation: 'process_import_with_partial_failure',
        jobId
      });
      throw bulkError;
    }
  }

  /**
   * Get user-friendly error message for import operations
   */
  getUserFriendlyErrorMessage(error: any): string {
    // Check if error is already a BulkOperationError by checking for required properties
    if (error && typeof error === 'object' && error.type && error.message && error.timestamp) {
      return bulkOperationErrorHandler.getUserFriendlyMessage(error as BulkOperationError);
    }

    const bulkError = bulkOperationErrorHandler.classifyError(error);
    return bulkOperationErrorHandler.getUserFriendlyMessage(bulkError);
  }
}

export const bulkImportService = new BulkImportService();
export default bulkImportService;
