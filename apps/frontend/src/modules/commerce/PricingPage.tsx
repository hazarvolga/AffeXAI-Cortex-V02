import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/lib/auth/auth-context';

interface Product {
    id: string;
    name: string;
    description: string;
    metadata: {
        ai_tokens: number;
        storage_gb: number;
        badges?: string[];
        tier?: number;
    };
    features: string[];
    prices: {
        id: string;
        amount: number;
        interval: string;
        currency: string;
    }[];
}

export const PricingPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth(); // Assuming auth context exists

    useEffect(() => {
        // Fetch products from public API
        axios.get('/api/commerce/products')
            .then(res => setProducts(res.data))
            .catch(err => console.error('Failed to load pricing', err))
            .finally(() => setLoading(false));
    }, []);

    const handleSubscribe = async (priceId: string) => {
        if (!user) {
            window.location.href = '/login?redirect=/pricing';
            return;
        }
        try {
            // Initiate Checkout Session
            const res = await axios.post('/api/commerce/checkout', { priceId });
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (err) {
            console.error('Subscription failed', err);
            alert('Failed to start checkout. Please try again.');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Plans...</div>;

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h1>
                <p className="text-muted-foreground text-lg">Choose the perfect plan for your AI journey.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                    const price = product.prices.find(p => p.interval === 'month');
                    const isPopular = product.metadata.badges?.includes('PRO');

                    return (
                        <Card key={product.id} className={`flex flex-col relative ${isPopular ? 'border-primary border-2 shadow-lg scale-105' : ''}`}>
                            {isPopular && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-2xl">{product.name}</CardTitle>
                                <CardDescription>{product.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">
                                        {price ? `$${price.amount}` : 'Custom'}
                                    </span>
                                    {price && <span className="text-muted-foreground">/mo</span>}
                                </div>
                                <ul className="space-y-2">
                                    {product.features?.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={isPopular ? 'default' : 'outline'}
                                    onClick={() => price && handleSubscribe(price.id)}
                                    disabled={!price} // Contact Sales if no price
                                >
                                    {price ? (user ? 'Upgrade' : 'Get Started') : 'Contact Sales'}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
