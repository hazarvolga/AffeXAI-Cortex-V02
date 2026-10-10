'use client';

/**
 * V2 Gallery Block
 * Image gallery grid
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface GalleryImage {
    url?: string;
    alt?: string;
    caption?: string;
}

export interface V2GalleryProps {
    heading?: string;
    subheading?: string;
    images?: GalleryImage[];
    columns?: 2 | 3 | 4;
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

export function V2Gallery({
    heading = 'Our Gallery',
    subheading = 'A showcase of our work',
    images = [
        { url: '', alt: 'Gallery image 1', caption: 'Project 1' },
        { url: '', alt: 'Gallery image 2', caption: 'Project 2' },
        { url: '', alt: 'Gallery image 3', caption: 'Project 3' },
        { url: '', alt: 'Gallery image 4', caption: 'Project 4' },
    ],
    columns = 3,
    backgroundColor = '#ffffff',
    textColor = '#1a1a2e',
    className,
}: V2GalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const columnClasses = {
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    };

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const nextImage = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
        }
    };

    return (
        <section
            className={cn('py-16 md:py-24 px-4', className)}
            style={{ backgroundColor, color: textColor }}
        >
            <div className="container mx-auto">
                {/* Header */}
                {(heading || subheading) && (
                    <div className="text-center mb-12 max-w-2xl mx-auto">
                        {heading && (
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                {heading}
                            </h2>
                        )}
                        {subheading && (
                            <p className="text-lg opacity-70">
                                {subheading}
                            </p>
                        )}
                    </div>
                )}

                {/* Gallery Grid */}
                <div className={cn('grid gap-4', columnClasses[columns])}>
                    {images?.map((image, index) => (
                        <div
                            key={index}
                            onClick={() => openLightbox(index)}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                        >
                            {image.url ? (
                                <Image
                                    src={image.url}
                                    alt={image.alt || ''}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <span className="text-muted-foreground">No image</span>
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-white font-medium">{image.caption}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Lightbox */}
                {lightboxIndex !== null && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-4 right-4 text-white hover:bg-white/20"
                            onClick={closeLightbox}
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute left-4 text-white hover:bg-white/20"
                            onClick={prevImage}
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </Button>

                        <div className="relative w-[80vw] h-[80vh]">
                            {images[lightboxIndex]?.url ? (
                                <Image
                                    src={images[lightboxIndex].url}
                                    alt={images[lightboxIndex].alt || ''}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                                    <span className="text-muted-foreground">No image</span>
                                </div>
                            )}
                        </div>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-4 text-white hover:bg-white/20"
                            onClick={nextImage}
                        >
                            <ChevronRight className="w-8 h-8" />
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}

export default V2Gallery;
