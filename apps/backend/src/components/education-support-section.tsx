
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { educationData } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar, ChevronRight, Download, PlayCircle, UserCheck } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay";

export function EducationSupportSection() {
    const [activeTab, setActiveTab] = useState(educationData.tabs[0].id);

    return (
        <section className="w-full py-16 md:py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
                        Eğitim & Destek
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Bilgi birikiminizi artırın, kaynaklarımıza erişin ve ihtiyacınız olan desteği alın.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
                        {educationData.tabs.map(tab => (
                            <TabsTrigger key={tab.id} value={tab.id} className="py-2.5 flex items-center gap-2">
                                <tab.icon className="h-4 w-4" />
                                {tab.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value="training" className="mt-8">
                        <Carousel 
                            opts={{ align: "start", loop: true }}
                            plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
                            className="w-full"
                        >
                            <CarouselContent>
                                {educationData.content.training.map((item, index) => (
                                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                        <Card className="h-full flex flex-col">
                                            <CardHeader>
                                                <CardTitle className="text-xl">{item.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <Calendar className="h-4 w-4"/>
                                                    <span>{item.date}</span>
                                                </div>
                                                <p className="text-muted-foreground">{item.description}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                                                    <a href={item.ctaLink}>{item.ctaText} <ChevronRight className="ml-2 h-4 w-4" /></a>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex" />
                            <CarouselNext className="hidden md:flex" />
                        </Carousel>
                    </TabsContent>

                    <TabsContent value="downloads" className="mt-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {educationData.content.downloads.map((item, index) => (
                                <Card key={index} className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-semibold">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.category}</p>
                                    </div>
                                    <Button asChild variant="outline" size="icon">
                                        <a href={item.ctaLink}><Download className="h-4 w-4"/></a>
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="support" className="mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {educationData.content.support.map((item) => (
                                <Card key={item.id} className="text-center p-6 flex flex-col items-center">
                                     <div className="mb-4 rounded-full bg-primary/10 p-3">
                                        <item.icon className="h-8 w-8 text-primary"/>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground mb-4 flex-grow">{item.description}</p>
                                    <Button asChild className="w-full">
                                        <a href={item.ctaLink}>{item.ctaText}</a>
                                    </Button>
                                </Card>
                             ))}
                        </div>
                    </TabsContent>

                     <TabsContent value="videos" className="mt-8">
                        <Carousel opts={{ align: "start", loop: true }} className="w-full">
                            <CarouselContent>
                                {educationData.content.videos.map((item, index) => (
                                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                        <Card className="overflow-hidden group">
                                             <div className="relative aspect-video">
                                                <Image src={item.thumbnail} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>
                                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <PlayCircle className="h-16 w-16 text-white/80 group-hover:text-white transition-colors"/>
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <p className="font-semibold truncate">{item.title}</p>
                                                <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                                            </CardContent>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden md:flex" />
                            <CarouselNext className="hidden md:flex" />
                        </Carousel>
                    </TabsContent>

                    <TabsContent value="students" className="mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {educationData.content.students.map((item, index) => (
                                <Card key={index} className="p-6 text-center">
                                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground mb-4">{item.description}</p>
                                    <Button asChild className="bg-accent text-accent-foreground">
                                        <a href={item.ctaLink}>{item.ctaText}</a>
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="documents" className="mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {educationData.content.documents.map((item, index) => (
                                <Card key={index} className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-semibold">{item.title}</p>
                                        <p className="text-sm text-muted-foreground">{item.category}</p>
                                    </div>
                                    <Button asChild variant="outline" size="icon">
                                        <a href={item.ctaLink}><Download className="h-4 w-4"/></a>
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
