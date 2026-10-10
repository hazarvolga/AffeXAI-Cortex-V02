import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Box, CreditCard, User, Shield, Globe, Monitor, Smartphone, Wifi, HelpCircle, ChevronLeft } from 'lucide-react';
import { ticketsService, TicketCategory } from '@/lib/api/ticketsService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Step1CategoryProps {
    onSelect: (categoryId: string, categoryName: string) => void;
}

// Icon mapping helper
const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('teknik') || lowerName.includes('technical')) return Monitor;
    if (lowerName.includes('fatura') || lowerName.includes('payment') || lowerName.includes('billing')) return CreditCard;
    if (lowerName.includes('hesap') || lowerName.includes('account')) return User;
    if (lowerName.includes('güvenlik') || lowerName.includes('security')) return Shield;
    if (lowerName.includes('sipariş') || lowerName.includes('order')) return Box;
    if (lowerName.includes('internet') || lowerName.includes('bağlantı')) return Wifi;
    if (lowerName.includes('mobil') || lowerName.includes('app')) return Smartphone;
    return HelpCircle;
};

export function Step1Category({ onSelect }: Step1CategoryProps) {
    const { toast } = useToast();
    const [allCategories, setAllCategories] = useState<TicketCategory[]>([]);
    const [parentCategories, setParentCategories] = useState<TicketCategory[]>([]);
    const [selectedParent, setSelectedParent] = useState<TicketCategory | null>(null);
    const [subcategories, setSubcategories] = useState<TicketCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await ticketsService.getCategories();
            setAllCategories(data);

            // Separate parent and child categories
            const parents = data.filter(c => !c.parentId);
            setParentCategories(parents);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast({
                title: 'Hata',
                description: 'Kategoriler yüklenirken bir hata oluştu.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleParentSelect = (parent: TicketCategory) => {
        // Find subcategories for this parent
        const children = allCategories.filter(c => c.parentId === parent.id);

        if (children.length > 0) {
            // Has subcategories - show them
            setSelectedParent(parent);
            setSubcategories(children);
        } else {
            // No subcategories - proceed directly
            onSelect(parent.id, parent.name);
        }
    };

    const handleSubcategorySelect = (subcategory: TicketCategory) => {
        onSelect(subcategory.id, subcategory.name);
    };

    const handleBackToParents = () => {
        setSelectedParent(null);
        setSubcategories([]);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Kategoriler yükleniyor...</p>
            </div>
        );
    }

    // Show subcategories if parent is selected
    if (selectedParent && subcategories.length > 0) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToParents}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Geri
                    </Button>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">{selectedParent.name}</h2>
                    <p className="text-muted-foreground">
                        Sorununuza en uygun alt kategoriyi seçin.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subcategories.map((category) => {
                        const Icon = getCategoryIcon(category.name);
                        return (
                            <Card
                                key={category.id}
                                className="cursor-pointer hover:border-primary hover:bg-accent/50 transition-all group"
                                onClick={() => handleSubcategorySelect(category)}
                            >
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{category.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                {category.description && (
                                    <CardContent>
                                        <CardDescription className="line-clamp-2">
                                            {category.description}
                                        </CardDescription>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Show parent categories
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Size nasıl yardımcı olabiliriz?</h2>
                <p className="text-muted-foreground">
                    Devam etmek için sorununuzla ilgili en uygun kategoriyi seçin.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parentCategories.map((category) => {
                    const Icon = getCategoryIcon(category.name);
                    const hasChildren = allCategories.some(c => c.parentId === category.id);

                    return (
                        <Card
                            key={category.id}
                            className="cursor-pointer hover:border-primary hover:bg-accent/50 transition-all group"
                            onClick={() => handleParentSelect(category)}
                        >
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-base">{category.name}</CardTitle>
                                    {hasChildren && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Alt kategoriler mevcut →
                                        </p>
                                    )}
                                </div>
                            </CardHeader>
                            {category.description && (
                                <CardContent>
                                    <CardDescription className="line-clamp-2">
                                        {category.description}
                                    </CardDescription>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {parentCategories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    Görüntülenecek kategori bulunamadı. Lütfen daha sonra tekrar deneyin.
                </div>
            )}
        </div>
    );
}
