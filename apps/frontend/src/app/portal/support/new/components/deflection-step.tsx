import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronRight, FileText, MessageCircle, HelpCircle, ThumbsUp } from 'lucide-react';
import { FaqSearchResult } from '@/lib/api/faqService';
import { cn } from '@/lib/utils';

interface DeflectionStepProps {
    query: string;
    results: FaqSearchResult[];
    onSolved: () => void;
    onProceed: () => void;
    onBack: () => void;
    onChat: () => void;
}

export function DeflectionStep({ query, results, onSolved, onProceed, onBack, onChat }: DeflectionStepProps) {

    // If no results, render a "No results found" state that automatically suggests proceeding
    if (results.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto text-center p-6">
                <CardHeader>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-6 h-6 text-orange-600" />
                    </div>
                    <CardTitle>Benzer bir çözüm bulamadık</CardTitle>
                    <CardDescription>
                        "{query}" ile ilgili otomatik bir çözüm bulamadık. Destek ekibimiz size yardımcı olmak için hazır.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" onClick={onBack}>Geri Dön</Button>
                    <Button onClick={onProceed} className="bg-primary">Destek Talebi Oluştur</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-3xl mx-auto shadow-lg">
            <CardHeader className="border-b bg-muted/30 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Bu çözümler yardımcı olabilir mi?</CardTitle>
                        <CardDescription className="mt-1">
                            Sorununuz için bulduğumuz en iyi eşleşmeler:
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
                        Aramayı Değiştir
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-6">
                    <div className="space-y-4">
                        {results.map((result) => (
                            <div
                                key={result.id}
                                className="group border rounded-lg p-4 hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer relative"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {result.type === 'article' ? (
                                            <div className="p-2 bg-blue-100 rounded text-blue-600"><FileText className="w-4 h-4" /></div>
                                        ) : (
                                            <div className="p-2 bg-green-100 rounded text-green-600"><MessageCircle className="w-4 h-4" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                                {result.question}
                                            </h4>
                                            <Badge variant="secondary" className="text-xs font-normal opacity-70">
                                                {Math.round(result.confidence)}% Eşleşme
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {result.answer}
                                        </p>
                                        <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                            {result.category && <span className="bg-muted px-2 py-0.5 rounded">{result.category}</span>}
                                            <span>{result.usageCount} kişi görüntüledi</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 ml-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 bottom-4">
                                        <Button size="sm" variant="secondary" className="h-8 text-xs">
                                            Görüntüle <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-muted/30 border-t">
                <div className="text-center sm:text-left">
                    <h4 className="font-semibold text-sm">Sorununuz çözülmedi mi?</h4>
                    <p className="text-xs text-muted-foreground">Destek ekibimize detaylı bildirim gönderin.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={onSolved}>
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Evet, Çözüldü
                    </Button>
                    <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onChat}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        AI Asistana Sor
                    </Button>
                    <Button className="flex-1 sm:flex-none" onClick={onProceed}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Hayır, Ticket Oluştur
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
