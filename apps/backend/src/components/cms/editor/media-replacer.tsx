'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MediaLibrary } from './media-library';
import { Media } from '@/lib/media/types';
import { Image as ImageIcon, Upload } from 'lucide-react';

interface MediaReplacerProps {
  currentSrc?: string;
  onMediaSelect: (media: Media) => void;
  className?: string;
}

export const MediaReplacer: React.FC<MediaReplacerProps> = ({ 
  currentSrc, 
  onMediaSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMediaSelect = (media: Media) => {
    onMediaSelect(media);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${className}`}
        >
          <Upload className="h-4 w-4" />
          Replace Media
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Replace Media</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {currentSrc && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Current Media</h4>
              <div className="border rounded-lg p-2 inline-block">
                <img 
                  src={currentSrc} 
                  alt="Current media" 
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
            </div>
          )}
          <MediaLibrary onMediaSelect={handleMediaSelect} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaReplacer;