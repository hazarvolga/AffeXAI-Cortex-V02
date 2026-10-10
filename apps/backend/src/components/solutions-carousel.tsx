
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { solutionsData } from '@/lib/solutions-data';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

export function SolutionsCarousel() {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbApi]
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const newSelectedIndex = mainApi.selectedScrollSnap();
    setSelectedIndex(newSelectedIndex);
    thumbApi.scrollTo(newSelectedIndex);
  }, [mainApi, thumbApi, setSelectedIndex]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on('select', onSelect);
    mainApi.on('reInit', onSelect);
  }, [mainApi, onSelect]);

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
            Çözümlerimiz
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Sektörünüz ne olursa olsun, projenizin her aşaması için güçlü ve esnek bir çözümümüz var.
          </p>
        </div>

        {/* Main Carousel */}
        <Carousel
          setApi={setMainApi}
          opts={{ loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {solutionsData.map((slide) => (
              <CarouselItem key={slide.id}>
                <Card className="overflow-hidden shadow-lg border-none bg-secondary/20">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-4">
                        <Badge variant="secondary" className="gap-2 items-center">
                            <slide.Icon className="h-4 w-4" />
                            {slide.category}
                        </Badge>
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 font-headline leading-tight hover:text-primary transition-colors">
                            {slide.title}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {slide.description}
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
                           {slide.items.map(item => (
                                <li key={item.title}>
                                    <Link href={item.href} className="hover:text-primary transition-colors">{item.title}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative aspect-[4/3] lg:aspect-auto min-h-[300px]">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        data-ai-hint={slide.imageHint}
                      />
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Thumbnail Carousel */}
        <div className="mt-8">
          <Carousel
            setApi={setThumbApi}
            opts={{
              align: 'start',
              containScroll: 'keepSnaps',
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {solutionsData.map((slide, index) => (
                <CarouselItem
                  key={slide.id}
                  onClick={() => onThumbClick(index)}
                  className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 group"
                >
                  <div
                    className={cn(
                      'block aspect-[4/3] relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ring-2 ring-transparent',
                      selectedIndex === index ? 'ring-primary shadow-2xl' : 'hover:ring-primary/50'
                    )}
                  >
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      data-ai-hint={slide.imageHint}
                    />
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300",
                        selectedIndex === index ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                    )} />
                     <div className="absolute bottom-0 left-0 p-3 text-white">
                        <h4 className="text-sm font-bold leading-tight line-clamp-2">{slide.title}</h4>
                     </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
