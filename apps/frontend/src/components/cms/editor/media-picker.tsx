'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MediaLibrary } from './media-library';
import { Media, MediaType } from '@/lib/media/types';
import { Image as ImageIcon } from 'lucide-react';

interface MediaPickerProps {
  value?: string; // Media ID
  onChange: (mediaId: string | null) => void;
  placeholder?: string;
  filterType?: MediaType;
}

/**
 * MediaPicker - Simple wrapper around MediaLibrary for form fields
 * Opens a dialog to select media from the library
 */
export const MediaPicker: React.FC<MediaPickerProps> = ({
  value,
  onChange,
  placeholder = 'Select media',
  filterType,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMediaSelect = (media: Media) => {
    onChange(media.id);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() => setIsOpen(true)}
      >
        <ImageIcon className="h-4 w-4 mr-2" />
        {value ? `Selected: ${value.substring(0, 8)}...` : placeholder}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>
          <MediaLibrary onMediaSelect={handleMediaSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
};
