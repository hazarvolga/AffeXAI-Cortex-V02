
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
import { Button } from '@/components/ui/button';
import { timelineData } from '@/lib/timeline-data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Badge } from './ui/badge';

interface TimelineCarouselProps {
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  cssClasses?: string;
}

export function TimelineCarousel({
  backgroundColor = 'transparent',
  paddingTop = '4rem',
  paddingBottom = '6rem',
  cssClasses = '',
}: TimelineCarouselProps = {}) {
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
    <section
      className={cn(
        'w-full',
        // Only apply bg-secondary/20 if no custom backgroundColor is provided
        backgroundColor === 'transparent' && 'bg-secondary/20',
        cssClasses
      )}
      style={{
        backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
        paddingTop,
        paddingBottom,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
            Öne Çıkan Başarı Hikayeleri
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Allplan çözümlerinin, Türkiye ve dünyadan prestijli projelerde nasıl fark yarattığını keşfedin.
          </p>
        </div>

        {/* Main Carousel */}
        <Carousel
          setApi={setMainApi}
          opts={{ loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {timelineData.map((slide) => (
              <CarouselItem key={slide.id}>
                <Card className="overflow-hidden shadow-lg border-none">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-[4/3] lg:aspect-auto">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        data-ai-hint={slide.imageHint}
                      />
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="secondary" className="gap-2 items-center">
                          <slide.Icon className="h-4 w-4" />
                          {slide.category}
                        </Badge>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{slide.date}</span>
                        </div>
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 font-headline leading-tight hover:text-primary transition-colors">
                        <Link href={slide.ctaLink}>{slide.title}</Link>
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {slide.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={slide.author.avatarUrl} alt={slide.author.name} />
                                <AvatarFallback>
                                    <User />
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{slide.author.name}</p>
                                <p className="text-xs text-muted-foreground">Proje Yöneticisi</p>
                            </div>
                        </div>
                        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                          <Link href={slide.ctaLink}>
                            Devamını Oku <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
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
              {timelineData.map((slide, index) => (
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
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{slide.category}</p>
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
