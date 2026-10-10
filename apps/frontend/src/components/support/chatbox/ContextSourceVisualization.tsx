'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Star,
  TrendingUp,
  Database,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContextSource {
  id: string;
  type: 'knowledge_base' | 'faq_learning' | 'document' | 'url';
  title: string;
  content: string;
  relevanceScore: number;
  metadata: {
    // Knowledge Base specific
    articleId?: string;
    categoryName?: string;
    tags?: string[];
    
    // FAQ Learning specific
    faqId?: string;
    confidence?: number;
    learningPattern?: string;
    
    // Document specific
    fileName?: string;
    fileType?: string;
    pageNumber?: number;
    
    // URL specific
    url?: string;
    domain?: string;
    extractedAt?: Date;
  };
  createdAt: Date;
}

interface ContextSourceVisualizationProps {
  sources: ContextSource[];
  className?: string;
  maxSources?: number;
  showRelevanceScores?: boolean;
  onSourceClick?: (source: ContextSource) => void;
}

export function ContextSourceVisualization({
  sources,
  className,
  maxSources = 5,
  showRelevanceScores = true,
  onSourceClick
}: ContextSourceVisualizationProps) {
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  if (!sources || sources.length === 0) {
    return null;
  }

  const sortedSources = sources
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxSources);

  const toggleSourceExpansion = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const getSourceIcon = (type: ContextSource['type']) => {
    switch (type) {
      case 'knowledge_base':
        return BookOpen;
      case 'faq_learning':
        return HelpCircle;
      case 'document':
        return FileText;
      case 'url':
        return LinkIcon;
      default:
        return Database;
    }
  };

  const getSourceTypeLabel = (type: ContextSource['type']) => {
    switch (type) {
      case 'knowledge_base':
        return 'Bilgi Bankası';
      case 'faq_learning':
        return 'FAQ Öğrenme';
      case 'document':
        return 'Belge';
      case 'url':
        return 'Web Sayfası';
      default:
        return 'Kaynak';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 0.8) return 'Yüksek';
    if (score >= 0.6) return 'Orta';
    return 'Düşük';
  };

  const formatRelevanceScore = (score: number) => {
    return Math.round(score * 100);
  };

  const handleSourceClick = (source: ContextSource, e: React.MouseEvent) => {
    e.stopPropagation();
    onSourceClick?.(source);
  };

  const renderSourceMetadata = (source: ContextSource) => {
    const { metadata } = source;
    
    switch (source.type) {
      case 'knowledge_base':
        return (
          <div className="space-y-2">
            {metadata.categoryName && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Kategori:</span>
                <Badge variant="secondary" className="text-xs">
                  {metadata.categoryName}
                </Badge>
              </div>
            )}
            {metadata.tags && metadata.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Etiketler:</span>
                <div className="flex flex-wrap gap-1">
                  {metadata.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {metadata.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{metadata.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'faq_learning':
        return (
          <div className="space-y-2">
            {metadata.confidence && (
              <div className="flex items-center space-x-2">
                <Brain className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Güven:</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(metadata.confidence * 100)}%
                </Badge>
              </div>
            )}
            {metadata.learningPattern && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Öğrenme Deseni:</span>
                <Badge variant="outline" className="text-xs">
                  {metadata.learningPattern}
                </Badge>
              </div>
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className="space-y-2">
            {metadata.fileName && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Dosya:</span>
                <Badge variant="secondary" className="text-xs">
                  {metadata.fileName}
                </Badge>
              </div>
            )}
            <div className="flex items-center space-x-4">
              {metadata.fileType && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">Tür:</span>
                  <Badge variant="outline" className="text-xs">
                    {metadata.fileType.toUpperCase()}
                  </Badge>
                </div>
              )}
              {metadata.pageNumber && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">Sayfa:</span>
                  <Badge variant="outline" className="text-xs">
                    {metadata.pageNumber}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'url':
        return (
          <div className="space-y-2">
            {metadata.domain && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Domain:</span>
                <Badge variant="secondary" className="text-xs">
                  {metadata.domain}
                </Badge>
              </div>
            )}
            {metadata.url && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(metadata.url, '_blank')}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Sayfayı Aç
                </Button>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center space-x-2">
          <Database className="h-4 w-4" />
          <span>Bağlam Kaynakları ({sortedSources.length})</span>
        </h4>
        {showRelevanceScores && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>Alaka Düzeyi</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {sortedSources.map((source) => {
          const SourceIcon = getSourceIcon(source.type);
          const isExpanded = expandedSources.has(source.id);
          
          return (
            <Card key={source.id} className="border-l-4 border-l-primary/20">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSourceExpansion(source.id)}
                  >
                    <div className="flex items-start justify-between space-x-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <SourceIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getSourceTypeLabel(source.type)}
                            </Badge>
                            {showRelevanceScores && (
                              <div className="flex items-center space-x-1">
                                <Progress 
                                  value={source.relevanceScore * 100} 
                                  className="w-12 h-2" 
                                />
                                <span className={cn(
                                  "text-xs font-medium",
                                  getRelevanceColor(source.relevanceScore)
                                )}>
                                  {formatRelevanceScore(source.relevanceScore)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-sm line-clamp-2">
                            {source.title}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {showRelevanceScores && (
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getRelevanceColor(source.relevanceScore))}
                          >
                            {getRelevanceLabel(source.relevanceScore)}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Content Preview */}
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {source.content}
                        </p>
                      </div>
                      
                      {/* Metadata */}
                      {renderSourceMetadata(source)}
                      
                      {/* Actions */}
                      <div className="flex justify-end space-x-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleSourceClick(source, e)}
                          className="text-xs"
                        >
                          Detayları Gör
                        </Button>
                        {source.type === 'url' && source.metadata.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(source.metadata.url, '_blank')}
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Aç
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
      
      {sources.length > maxSources && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            +{sources.length - maxSources} kaynak daha
          </Badge>
        </div>
      )}
    </div>
  );
}