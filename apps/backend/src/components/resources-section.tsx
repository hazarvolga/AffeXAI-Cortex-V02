
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resourcesData } from '@/lib/resources-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ResourcesSection() {
    const [activeTab, setActiveTab] = useState(resourcesData.tabs[0].id);

    return (
        <section className="w-full py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                        Kaynaklar
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Sektördeki bilgiyi keşfedin, becerilerinizi geliştirin ve projelerinizi ileriye taşıyın.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-center">
                        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto">
                            {resourcesData.tabs.map(tab => (
                                <TabsTrigger key={tab.id} value={tab.id} className="py-2.5 flex items-center gap-2">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.title}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {resourcesData.tabs.map(tab => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {resourcesData.content[tab.id].map((item, index) => (
                                    <Card key={index} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                        <CardHeader>
                                            <CardTitle>{item.title}</CardTitle>
                                             {item.description && (
                                                <CardDescription className="pt-2">{item.description}</CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardFooter className="mt-auto">
                                            <Button asChild className="w-full" variant="outline">
                                                <Link href={item.ctaLink}>
                                                    {item.ctaText}
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </section>
    );
}
