import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { faqService } from '@/lib/api/faqService';

interface SearchStepProps {
    onSearch: (query: string, results: any[]) => void;
}

export function SearchStep({ onSearch }: SearchStepProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await faqService.search({
                query,
                limit: 5,
                include_articles: true
            });
            onSearch(query, response.faqs);
        } catch (error) {
            console.error('Search failed:', error);
            // Even on error, proceed to form with empty results
            onSearch(query, []);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-2 border-primary/5">
            <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Size nasıl yardımcı olabiliriz?</CardTitle>
                <CardDescription className="text-lg">
                    Sorununuzu birkaç kelimeyle özetleyin, size anında çözüm bulalım.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Örn: Şifremi unuttum veya Fatura görüntüleyemiyorum"
                            className="h-14 text-lg px-6 rounded-full shadow-sm hover:shadow-md transition-shadow border-primary/20 focus-visible:ring-primary/30"
                            autoFocus
                            minLength={3}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-2 top-2 h-10 w-10 rounded-full"
                            disabled={loading || !query.trim()}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground p-2">
                        AI asistanımız veritabanımızdaki makale ve çözümleri tarayacaktır.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
