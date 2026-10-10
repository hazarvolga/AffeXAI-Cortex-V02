'use client';

/**
 * Image Replacer
 * Quick image replacement with media picker
 */

import React, { useState } from 'react';
import { useQuickEdit } from './QuickEditProvider';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ImageIcon, Upload, X, Check, Replace } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ImageReplacerProps {
    componentId: string;
    propKey: string;
    currentSrc: string;
    alt?: string;
    aspectRatio?: string;
    className?: string;
    imageClassName?: string;
}

export function ImageReplacer({
    componentId,
    propKey,
    currentSrc,
    alt = 'Image',
    aspectRatio,
    className,
    imageClassName,
}: ImageReplacerProps) {
    const { isEditMode, setPendingChange } = useQuickEdit();
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [previewSrc, setPreviewSrc] = useState(currentSrc);

    const handleImageSelect = (newSrc: string) => {
        setPreviewSrc(newSrc);
        setPendingChange(componentId, propKey, newSrc);
        setIsOpen(false);
    };

    if (!isEditMode) {
        return (
            <div className={cn('relative', className)}>
                <Image
                    src={currentSrc}
                    alt={alt}
                    fill={!aspectRatio}
                    width={aspectRatio ? 400 : undefined}
                    height={aspectRatio ? 300 : undefined}
                    className={cn('object-cover', imageClassName)}
                />
            </div>
        );
    }

    return (
        <div
            className={cn('relative group', className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Current/Preview Image */}
            <Image
                src={previewSrc || currentSrc}
                alt={alt}
                fill={!aspectRatio}
                width={aspectRatio ? 400 : undefined}
                height={aspectRatio ? 300 : undefined}
                className={cn('object-cover', imageClassName)}
            />

            {/* Hover Overlay */}
            {isHovered && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="gap-2">
                                <Replace className="h-4 w-4" />
                                Replace Image
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Select Image</DialogTitle>
                            </DialogHeader>
                            <ImagePickerContent onSelect={handleImageSelect} />
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* Changed Indicator */}
            {previewSrc !== currentSrc && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs">
                    Changed
                </div>
            )}
        </div>
    );
}

/**
 * Simple Image Picker Content
 * For use inside the dialog
 */
interface ImagePickerContentProps {
    onSelect: (src: string) => void;
}

function ImagePickerContent({ onSelect }: ImagePickerContentProps) {
    const [uploadUrl, setUploadUrl] = useState('');

    // Sample images for demo
    const sampleImages = [
        'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    ];

    return (
        <div className="space-y-4">
            {/* URL Input */}
            <div className="flex gap-2">
                <input
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                />
                <Button
                    onClick={() => uploadUrl && onSelect(uploadUrl)}
                    disabled={!uploadUrl}
                >
                    Use URL
                </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">or select from library</div>

            {/* Image Grid */}
            <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {sampleImages.map((src, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(src)}
                        className="relative aspect-video rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                    >
                        <Image
                            src={src}
                            alt={`Sample ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Upload Button */}
            <div className="text-center pt-2 border-t">
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload New Image
                </Button>
            </div>
        </div>
    );
}
