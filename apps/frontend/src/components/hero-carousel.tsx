
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { heroData, type HeroSlide } from '@/lib/hero-data';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Autoplay from "embla-carousel-autoplay";

const TABS = [
    { id: 'solutions', name: 'Çözümler' },
    { id: 'products', name: 'Ürünler' },
    { id: 'successStories', name: 'Başarı Hikayeleri' },
];

export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [slides, setSlides] = useState<HeroSlide[]>([]);

  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  useEffect(() => {
    // Set initial slides
    setSlides(heroData[activeTab as keyof typeof heroData]);
    setCurrent(0);
    api?.scrollTo(0, true);
  }, [activeTab, api]);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    onSelect(); // Set initial state

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const scrollPrev = () => api?.scrollPrev();
  const scrollNext = () => api?.scrollNext();


  return (
    <section className="relative w-full bg-secondary overflow-hidden">
        <Carousel 
            setApi={setApi} 
            className="w-full"
            plugins={[autoplay.current]}
            onMouseEnter={autoplay.current.stop}
            onMouseLeave={autoplay.current.reset}
        >
            <CarouselContent>
            {slides.map((slide, index) => (
                <CarouselItem key={index}>
                <div className="relative aspect-[16/7] w-full">
                    <Image
                        src={slide.image}
                        alt={slide.headline}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        data-ai-hint={slide.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
                        <div className="container mx-auto px-4">
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white max-w-3xl drop-shadow-lg font-headline">
                                {slide.headline}
                            </h1>
                            <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md">
                                {slide.subheadline}
                            </p>
                            <Button size="lg" asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
                                <Link href={slide.ctaLink}>
                                    {slide.ctaText} <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                </CarouselItem>
            ))}
            </CarouselContent>
            {/* Custom Navigation Buttons */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12 bg-white/20 hover:bg-white/80 backdrop-blur-sm border-white/50" onClick={scrollPrev}>
                    <ChevronLeft className="h-6 w-6 text-white" />
                </Button>
            </div>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
                <Button variant="outline" size="icon" className="rounded-full h-12 w-12 bg-white/20 hover:bg-white/80 backdrop-blur-sm border-white/50" onClick={scrollNext}>
                    <ChevronRight className="h-6 w-6 text-white" />
                </Button>
            </div>
        </Carousel>
        
        <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="container mx-auto px-4">
                 <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-2xl">
                    <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-sm p-1.5 h-auto rounded-t-lg rounded-b-none border-b-0">
                        {TABS.map(tab => (
                            <TabsTrigger 
                                key={tab.id} 
                                value={tab.id} 
                                className="text-white/80 data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md py-2.5 transition-all"
                            >
                                {tab.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                 {/* Carousel Dots */}
                <div className="absolute bottom-0 right-4 hidden md:flex items-center gap-2 pb-4">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={cn(
                                "h-2 w-2 rounded-full bg-white/50 transition-all",
                                current === index ? "w-4 bg-white" : "hover:bg-white/80"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    </section>
  );
}
