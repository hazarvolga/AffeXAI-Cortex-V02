'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Search, 
  Filter,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportResult, ImportResultStatus } from '@affexai/shared-types';
import bulkImportService from '@/lib/api/bulkImportService';

interface ValidationResultsDisplayProps {
  jobId: string;
  onClose?: () => void;
}

interface FilterOptions {
  status: ImportResultStatus | 'all';
  search: string;
  page: number;
  limit: number;
}

export function ValidationResultsDisplay({ jobId, onClose }: ValidationResultsDisplayProps) {
  const [results, setResults] = useState<ImportResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    search: '',
    page: 1,
    limit: 50
  });
  const [selectedResult, setSelectedResult] = useState<ImportResult | null>(null);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await bulkImportService.getImportResults(
        jobId,
        filters.page,
        filters.limit
      );
      
      // Filter results based on status and search
      let filteredResults = response.results;
      
      if (filters.status !== 'all') {
        filteredResults = filteredResults.filter(result => result.status === filters.status);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredResults = filteredResults.filter(result => 
          result.email.toLowerCase().includes(searchLower) ||
          result.issues?.some(issue => issue.toLowerCase().includes(searchLower)) ||
          result.suggestions?.some(suggestion => suggestion.toLowerCase().includes(searchLower))
        );
      }
      
      setResults(filteredResults);
      setTotal(response.total);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [jobId, filters.page, filters.limit]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const handleSearch = () => {
    fetchResults();
  };

  const getStatusIcon = (status: ImportResultStatus) => {
    switch (status) {
      case ImportResultStatus.VALID:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ImportResultStatus.RISKY:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case ImportResultStatus.INVALID:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case ImportResultStatus.DUPLICATE:
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ImportResultStatus) => {
    switch (status) {
      case ImportResultStatus.VALID:
        return 'bg-green-100 text-green-800 border-green-200';
      case ImportResultStatus.RISKY:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ImportResultStatus.INVALID:
        return 'bg-red-100 text-red-800 border-red-200';
      case ImportResultStatus.DUPLICATE:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Validation Results</h3>
          <p className="text-muted-foreground">
            Detailed validation results for each email address
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search emails, issues, or suggestions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="w-48">
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={ImportResultStatus.VALID}>Valid</SelectItem>
                  <SelectItem value={ImportResultStatus.RISKY}>Risky</SelectItem>
                  <SelectItem value={ImportResultStatus.INVALID}>Invalid</SelectItem>
                  <SelectItem value={ImportResultStatus.DUPLICATE}>Duplicate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Results ({total.toLocaleString()} total)
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchResults} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading results...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results List */}
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="font-medium">{result.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Row {result.rowNumber} • Confidence: {result.confidenceScore}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('border', getStatusColor(result.status))}>
                        {result.status}
                      </Badge>
                      {result.imported && (
                        <Badge variant="secondary">Imported</Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {filters.page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      disabled={filters.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={filters.page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Detail Modal */}
      {selectedResult && (
        <Card className="fixed inset-4 z-50 bg-white shadow-lg border max-w-2xl mx-auto my-8 overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(selectedResult.status)}
                Validation Details
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Email Address</h4>
              <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                {selectedResult.email}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Badge className={cn('border', getStatusColor(selectedResult.status))}>
                  {selectedResult.status}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Confidence Score</h4>
                <div className="text-lg font-bold">{selectedResult.confidenceScore}%</div>
              </div>
            </div>

            {selectedResult.validationDetails && (
              <div>
                <h4 className="font-medium mb-2">Validation Checks</h4>
                <div className="space-y-2">
                  {Object.entries(selectedResult.validationDetails).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={cn(
                        "font-medium",
                        typeof value === 'boolean' 
                          ? value ? "text-green-600" : "text-red-600"
                          : "text-gray-600"
                      )}>
                        {typeof value === 'boolean' ? (value ? 'Pass' : 'Fail') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedResult.issues && selectedResult.issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Issues Found</h4>
                <ul className="space-y-1">
                  {selectedResult.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                      <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResult.suggestions && selectedResult.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Suggestions</h4>
                <ul className="space-y-1">
                  {selectedResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResult.error && (
              <div>
                <h4 className="font-medium mb-2">Error</h4>
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {selectedResult.error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backdrop for modal */}
      {selectedResult && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}