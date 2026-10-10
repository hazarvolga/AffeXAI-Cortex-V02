import assert from 'node:assert/strict';
import { test } from 'node:test';
import bulkImportService, { ImportJobStatus, ImportResultStatus, type ImportResult } from '../../../lib/api/bulkImportService';
import bulkExportService, { ExportJobStatus } from '../../../lib/api/bulkExportService';
import { httpClient } from '../../../lib/api/http-client';
import { AxiosHeaders, type AxiosRequestConfig } from 'axios';
import { triggerEventGroups } from '../../../modules/email-marketing/components/automation/trigger-event-options';

test('bulk progress uses the lowercase statuses returned by backend entities', () => {
  assert.equal(ImportJobStatus.PENDING, 'pending');
  assert.equal(ImportJobStatus.PROCESSING, 'processing');
  assert.equal(ImportJobStatus.COMPLETED, 'completed');
  assert.equal(ImportJobStatus.FAILED, 'failed');
  assert.equal(ExportJobStatus.PENDING, 'pending');
  assert.equal(ExportJobStatus.PROCESSING, 'processing');
  assert.equal(ExportJobStatus.COMPLETED, 'completed');
  assert.equal(ExportJobStatus.FAILED, 'failed');
});

function row(id: string, status: ImportResultStatus, error: string | null = null): ImportResult {
  return {
    id, importJobId: 'job-1', email: `${id}@example.test`, status,
    confidenceScore: 100, validationDetails: null, issues: null, suggestions: null,
    imported: status === ImportResultStatus.VALID, error, originalData: null,
    rowNumber: 1, subscriberId: null, createdAt: new Date(0), updatedAt: new Date(0),
  };
}

test('partial import handling classifies row validation failures and persisted errors', async (t) => {
  const valid = row('valid', ImportResultStatus.VALID);
  const invalid = { ...row('invalid', ImportResultStatus.INVALID), issues: ['Invalid address syntax'] };
  const writeFailure = row('write-failure', ImportResultStatus.VALID, 'Subscriber could not be saved');
  const duplicate = row('duplicate', ImportResultStatus.DUPLICATE);
  t.mock.method(bulkImportService, 'getImportResults', async () => ({
    results: [valid, invalid, writeFailure, duplicate], total: 4, page: 1, limit: 1000,
  }));

  const result = await bulkImportService.processImportWithPartialFailureHandling('job-1');

  assert.equal(result.totalProcessed, 4);
  assert.deepEqual(result.successful.map(item => item.id), ['valid', 'duplicate']);
  assert.equal(result.failureCount, 2);
  assert.deepEqual(result.failed.map(item => item.error.message), [
    'Invalid address syntax', 'Subscriber could not be saved',
  ]);
});

test('segment triggers submit supported backend event IDs; unavailable events cannot be selected', () => {
  const options = triggerEventGroups.flatMap(group => group.events);
  assert.equal(options.find(option => option.label === 'Joined Segment')?.event, 'subscriber.segment_added');
  assert.equal(options.find(option => option.label === 'Left Segment')?.event, 'subscriber.segment_removed');
  for (const id of ['subscriber.unsubscribed', 'email.bounced', 'campaign.sent']) {
    const option = options.find(item => item.value === id);
    assert.ok(option, `${id} remains visible`);
    assert.equal(option.event, undefined, `${id} is unavailable for selection`);
    assert.match(option.label, /not yet supported/);
  }
});

test('export create sends the flat DTO and unwraps the transport envelope', async (t) => {
  const summary = {
    id: 'export-1', fileName: 'export.csv', status: 'pending', totalRecords: 5,
    processedRecords: 0, progressPercentage: 0, createdAt: '2026-10-07T10:00:00Z',
    completedAt: null, error: null,
  };
  let request: AxiosRequestConfig | undefined;
  t.mock.method(httpClient.getAxiosInstance(), 'request', async (config: AxiosRequestConfig) => {
    request = config;
    return { data: { success: true, data: summary }, status: 201, statusText: 'Created',
      headers: {}, config: { ...config, headers: new AxiosHeaders() } };
  });
  const result = await bulkExportService.createExportJob({
    filters: { groupIds: ['group-a'] },
    options: { fields: ['email'], format: 'csv', includeMetadata: false, batchSize: 1000 },
  });
  assert.equal(result.id, 'export-1');
  assert.equal(result.options, undefined, 'summary responses do not fabricate details');
  assert.deepEqual(request?.data, {
    groupIds: ['group-a'], fields: ['email'], format: 'csv', includeMetadata: false, batchSize: 1000,
  });
});

test('bulk status, history and results consume ResponseInterceptor envelopes', async (t) => {
  t.mock.method(httpClient.getAxiosInstance(), 'request', async (config: AxiosRequestConfig) => {
    const payload = config.url?.endsWith('/results')
      ? { results: [row('imported', ImportResultStatus.VALID)], total: 1, page: 1, limit: 100 }
      : config.url?.endsWith('/jobs')
        ? { jobs: [], total: 0, page: 1, limit: 20 }
        : { id: 'job-1', status: 'completed', progressPercentage: 100 };
    return { data: { success: true, data: payload }, status: 200, statusText: 'OK',
      headers: {}, config: { ...config, headers: new AxiosHeaders() } };
  });
  assert.equal((await bulkExportService.getExportStatus('job-1')).status, 'completed');
  assert.equal((await bulkImportService.getImportStatus('job-1')).status, 'completed');
  assert.equal((await bulkImportService.getImportResults('job-1')).results[0].email, 'imported@example.test');
  assert.deepEqual((await bulkExportService.getExportJobs()).jobs, []);
  assert.deepEqual((await bulkImportService.getImportJobs()).jobs, []);
});

test('export preview sends selected fields and maps backend statistics without inventing sample rows', async (t) => {
  let request: AxiosRequestConfig | undefined;
  t.mock.method(httpClient.getAxiosInstance(), 'request', async (config: AxiosRequestConfig) => {
    request = config;
    return { data: { success: true, data: {
      totalSubscribers: 15, estimatedFileSizeBytes: 300, estimatedProcessingTimeSeconds: 1,
    } }, status: 200, statusText: 'OK', headers: {}, config: { ...config, headers: new AxiosHeaders() } };
  });
  const preview = await bulkExportService.getExportPreview({ groupIds: ['group-a'] }, {
    fields: ['email'], format: 'csv', includeMetadata: false, batchSize: 1000,
  });
  assert.equal(preview.totalRecords, 15);
  assert.equal(preview.estimatedFileSize, '300 bytes');
  assert.equal(preview.sampleRecords, undefined);
  assert.deepEqual(request?.data, {
    groupIds: ['group-a'], fields: ['email'], format: 'csv', includeMetadata: false, batchSize: 1000,
  });
});
