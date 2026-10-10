'use client';

import React from 'react';

interface VideoComponentProps {
  id?: string;
  src?: string;
  poster?: string;
  title?: string;
  caption?: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
}

export const VideoComponent: React.FC<VideoComponentProps> = ({
  id,
  src = '',
  poster,
  title,
  caption,
  width = '100%',
  height = 'auto',
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  className = '',
}) => {
  if (!src) {
    return (
      <div 
        id={id}
        className={`w-full h-64 bg-muted rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <svg
            className="h-16 w-16 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">No video selected</p>
        </div>
      </div>
    );
  }

  return (
    <div id={id} className={`w-full ${className}`}>
      <video
        src={src}
        poster={poster}
        width={width}
        height={height}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={controls}
        className="w-full rounded-lg"
      >
        Your browser does not support the video tag.
      </video>
      
      {(title || caption) && (
        <div className="mt-3">
          {title && (
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
          )}
          {caption && (
            <p className="text-sm text-muted-foreground">{caption}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoComponent;
