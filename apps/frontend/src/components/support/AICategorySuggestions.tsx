'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, XCircle, Loader2, Brain } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CategoryPrediction {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasons: string[];
}

interface AICategorySuggestionsProps {
  ticketId: string;
  currentCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
}

export function AICategorySuggestions({
  ticketId,
  currentCategoryId,
  onCategorySelect,
}: AICategorySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CategoryPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [ticketId]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tickets/ai/${ticketId}/suggestions`);

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch AI suggestions:', error);
      setError(error.message || 'Failed to load AI suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCategorizе = async () => {
    try {
      setApplying(true);
      setError(null);

      const response = await fetch(`/api/tickets/ai/${ticketId}/categorize`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to apply category');
      }

      const result = await response.json();

      if (result.success && result.category) {
        if (onCategorySelect) {
          onCategorySelect(result.category.categoryId);
        }
        // Refresh suggestions
        await fetchSuggestions();
      } else {
        setError(result.message || 'Could not categorize with sufficient confidence');
      }
    } catch (error: any) {
      console.error('Failed to apply category:', error);
      setError(error.message || 'Failed to apply category');
    } finally {
      setApplying(false);
    }
  };

  const handleSelectSuggestion = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return 'Yüksek Güven';
    if (confidence >= 60) return 'Orta Güven';
    return 'Düşük Güven';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">AI önerileri yükleniyor...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <XCircle className="h-8 w-8 text-destructive" />
          <span className="ml-3 text-destructive">{error}</span>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            AI kategori önerisi bulunamadı
          </p>
          <Button variant="outline" onClick={fetchSuggestions} className="mt-4">
            Yeniden Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">AI Kategori Önerileri</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={handleAutoCategorizе}
            disabled={applying || suggestions[0]?.confidence < 60}
          >
            {applying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uygulanıyor...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Otomatik Uygula
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI tarafından analiz edilen kategori önerileri
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.categoryId}
            className={`p-4 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
              currentCategoryId === suggestion.categoryId
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => handleSelectSuggestion(suggestion.categoryId)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-lg">
                    {index + 1}. {suggestion.categoryName}
                  </span>
                  {currentCategoryId === suggestion.categoryId && (
                    <Badge variant="default">Seçili</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm px-2 py-1 rounded border ${getConfidenceColor(
                      suggestion.confidence
                    )}`}
                  >
                    {getConfidenceLabel(suggestion.confidence)}
                  </span>
                  <span className="text-sm font-medium">
                    {suggestion.confidence}% Güven
                  </span>
                </div>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="mb-3">
              <Progress value={suggestion.confidence} className="h-2" />
            </div>

            {/* Matched Keywords */}
            {suggestion.reasons && suggestion.reasons.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Eşleşen anahtar kelimeler:
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestion.reasons.slice(0, 5).map((reason, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                  {suggestion.reasons.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{suggestion.reasons.length - 5} daha
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Info Footer */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 AI önerileri, ticket içeriği analiz edilerek oluşturulur. %60+ güven ile
            otomatik uygulanabilir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
