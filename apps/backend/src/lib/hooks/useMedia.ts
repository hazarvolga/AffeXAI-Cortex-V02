import { useState, useEffect } from 'react';
import mediaService, { Media } from '@/lib/api/mediaService';

interface UseMediaOptions {
  type?: string;
  enabled?: boolean;
}

export function useMedia(options: UseMediaOptions = {}) {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { type, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const fetchMedia = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mediaService.getAllMedia(type);
        setMediaItems(data);
      } catch (err) {
        console.error('Error fetching media:', err);
        setError('Medya dosyaları yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [type, enabled]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mediaService.getAllMedia(type);
      setMediaItems(data);
    } catch (err) {
      console.error('Error refreshing media:', err);
      setError('Medya dosyaları yenilenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return {
    mediaItems,
    loading,
    error,
    refresh,
  };
}

export function useMediaById(id: string | null) {
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setMedia(null);
      setLoading(false);
      return;
    }

    const fetchMedia = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mediaService.getMediaById(id);
        setMedia(data);
      } catch (err) {
        console.error('Error fetching media:', err);
        setError('Medya dosyası yüklenirken bir hata oluştu.');
        setMedia(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [id]);

  return {
    media,
    loading,
    error,
  };
}