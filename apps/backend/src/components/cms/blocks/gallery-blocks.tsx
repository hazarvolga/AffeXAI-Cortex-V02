'use client';

import React from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';
import { ImageComponent } from '@/components/cms/image-component';

// Gallery Block 1: Single Image Display
export const GallerySingleImage: React.FC = () => {
  return (
    <ContainerComponent 
      id="gallery-single-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <CardComponent 
        id="gallery-single-card"
        padding="none" 
        rounded="lg" 
        shadow="md"
      >
        <ImageComponent 
          id="gallery-single-image"
          src="/placeholder-image.jpg" 
          alt="Featured Image" 
          className="rounded-lg w-full h-auto" 
        />
        <div className="p-6">
          <TextComponent 
            id="gallery-single-title"
            content="Featured Project" 
            variant="heading3" 
            className="mb-2" 
          />
          <TextComponent 
            id="gallery-single-caption"
            content="Brief description of this featured project or image." 
            variant="body" 
            className="text-muted-foreground" 
          />
        </div>
      </CardComponent>
    </ContainerComponent>
  );
};

// Gallery Block 2: Two-Image Split Gallery
export const GalleryTwoImageSplit: React.FC = () => {
  return (
    <ContainerComponent 
      id="gallery-two-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <TextComponent 
        id="gallery-two-title"
        content="Our Work" 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="gallery-two-grid"
        columns={2} 
        gap="xl" 
      >
        <CardComponent 
          id="gallery-two-card-1"
          padding="none" 
          rounded="lg" 
          shadow="md"
        >
          <ImageComponent 
            id="gallery-two-image-1"
            src="/placeholder-image.jpg" 
            alt="Project 1" 
            className="rounded-t-lg w-full h-auto" 
          />
          <div className="p-6">
            <TextComponent 
              id="gallery-two-card-1-title"
              content="Project Alpha" 
              variant="heading3" 
              className="mb-2" 
            />
            <TextComponent 
              id="gallery-two-card-1-caption"
              content="Web design and development for a tech startup." 
              variant="body" 
              className="text-muted-foreground" 
            />
          </div>
        </CardComponent>
        
        <CardComponent 
          id="gallery-two-card-2"
          padding="none" 
          rounded="lg" 
          shadow="md"
        >
          <ImageComponent 
            id="gallery-two-image-2"
            src="/placeholder-image.jpg" 
            alt="Project 2" 
            className="rounded-t-lg w-full h-auto" 
          />
          <div className="p-6">
            <TextComponent 
              id="gallery-two-card-2-title"
              content="Project Beta" 
              variant="heading3" 
              className="mb-2" 
            />
            <TextComponent 
              id="gallery-two-card-2-caption"
              content="Branding and marketing campaign for a retail brand." 
              variant="body" 
              className="text-muted-foreground" 
            />
          </div>
        </CardComponent>
      </GridComponent>
    </ContainerComponent>
  );
};

// Gallery Block 3: Three-Image Grid
export const GalleryThreeImageGrid: React.FC<{ props?: any }> = ({ props }) => {
  // Use props or fallback to default values
  const title = props?.title || "Featured Highlights";
  const items = props?.items || [
    {
      image: "/placeholder-image.jpg",
      title: "Design Excellence",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Innovation",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Quality",
    },
  ];

  return (
    <ContainerComponent 
      id="gallery-three-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <TextComponent 
        id="gallery-three-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="gallery-three-grid"
        columns={3} 
        gap="lg" 
      >
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`gallery-three-card-${index + 1}`}
            key={index}
            padding="none" 
            rounded="lg" 
            shadow="md"
          >
            <ImageComponent 
              id={`gallery-three-image-${index + 1}`}
              src={item.image} 
              alt={item.title} 
              className="rounded-lg w-full h-auto" 
            />
            <div className="p-4">
              <TextComponent 
                id={`gallery-three-card-${index + 1}-title`}
                content={item.title} 
                variant="body" 
                className="font-medium" 
              />
            </div>
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Gallery Block 4: Four-Image Mosaic
export const GalleryFourImageMosaic: React.FC<{ props?: any }> = ({ props }) => {
  // Use props or fallback to default values
  const title = props?.title || "Our Portfolio";
  const items = props?.items || [
    {
      image: "/placeholder-image.jpg",
      title: "Project Alpha",
      description: "Web design project for a tech startup.",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Project Beta",
      description: "Branding campaign for a retail company.",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Project Gamma",
      description: "Mobile app design and development.",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Project Delta",
      description: "E-commerce website implementation.",
    },
  ];

  return (
    <ContainerComponent 
      id="gallery-four-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <TextComponent 
        id="gallery-four-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="gallery-four-grid"
        columns={4} 
        gap="sm" 
        className="grid grid-cols-2 md:grid-cols-4 auto-rows-auto"
      >
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`gallery-four-card-${index + 1}`}
            key={index}
            padding="none" 
            rounded="lg" 
            shadow="sm"
            className={index === 0 ? "md:col-span-2 md:row-span-2" : ""}
          >
            <ImageComponent 
              id={`gallery-four-image-${index + 1}`}
              src={item.image} 
              alt={item.title} 
              className="rounded-lg w-full h-full object-cover" 
            />
            <div className="p-3">
              <TextComponent 
                id={`gallery-four-card-${index + 1}-title`}
                content={item.title} 
                variant="body" 
                className="font-medium mb-1" 
              />
              <TextComponent 
                id={`gallery-four-card-${index + 1}-desc`}
                content={item.description} 
                variant="caption" 
                className="text-muted-foreground" 
              />
            </div>
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Gallery Block 5: Five-Image Showcase
export const GalleryFiveImageShowcase: React.FC = () => {
  return (
    <ContainerComponent 
      id="gallery-five-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <TextComponent 
        id="gallery-five-title"
        content="Recent Work" 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="gallery-five-grid"
        columns={5} 
        gap="md" 
      >
        <CardComponent 
          id="gallery-five-card-1"
          padding="none" 
          rounded="lg" 
          shadow="md"
        >
          <ImageComponent 
            id="gallery-five-image-1"
            src="/placeholder-image.jpg" 
            alt="Work 1" 
            className="rounded-lg w-full h-auto" 
          />
        </CardComponent>
        
        <CardComponent 
          id="gallery-five-card-2"
          padding="none" 
          rounded="lg" 
          shadow="md"
        >
          <ImageComponent 
            id="gallery-five-image-2"
            src="/placeholder-image.jpg" 
            alt="Work 2" 
            className="rounded-lg w-full h-auto" 
          />
        </CardComponent>
        
        <CardComponent 
          id="gallery-five-card-3"
          padding="none" 
          rounded="lg" 
          shadow="md"
        >
          <ImageComponent 
            id="gallery-five-image-3"
            src="/placeholder-image.jpg" 
            alt="Work 3" 
            className="rounded-lg w-full h-auto" 
          />
        </CardComponent>
        
        <CardComponent 
          id="gallery-five-card-4"
          padding="none" 
          rounded="lg" 
          shadow="md"
        >
          <ImageComponent 
            id="gallery-five-image-4"
            src="/placeholder-image.jpg" 
            alt="Work 4" 
            className="rounded-lg w-full h-auto" 
          />
        </CardComponent>
        
        <CardComponent 
          id="gallery-five-card-5"
          padding="none" 
          rounded="lg" 
          shadow="md"
        >
          <ImageComponent 
            id="gallery-five-image-5"
            src="/placeholder-image.jpg" 
            alt="Work 5" 
            className="rounded-lg w-full h-auto" 
          />
        </CardComponent>
      </GridComponent>
    </ContainerComponent>
  );
};

// Gallery Block 6: Carousel Gallery
export const GalleryCarousel: React.FC = () => {
  return (
    <ContainerComponent 
      id="gallery-carousel-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <TextComponent 
        id="gallery-carousel-title"
        content="Image Gallery" 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <CardComponent 
        id="gallery-carousel-card"
        padding="none" 
        rounded="lg" 
        shadow="md"
      >
        <div className="relative">
          <ImageComponent 
            id="gallery-carousel-image"
            src="/placeholder-image.jpg" 
            alt="Gallery Image" 
            className="rounded-t-lg w-full h-96 object-cover" 
          />
          <div className="absolute inset-0 flex items-center justify-between p-4">
            <button className="bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">
              ‹
            </button>
            <button className="bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center">
              ›
            </button>
          </div>
        </div>
        <div className="p-6">
          <TextComponent 
            id="gallery-carousel-caption"
            content="Image 1 of 5: Description of this image in the carousel." 
            variant="body" 
            className="text-muted-foreground text-center" 
          />
        </div>
        <div className="flex justify-center p-4 space-x-2">
          {[1, 2, 3, 4, 5].map((index) => (
            <button 
              key={index}
              className={`w-3 h-3 rounded-full ${index === 1 ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </CardComponent>
    </ContainerComponent>
  );
};

// Export all gallery blocks
export const galleryBlocks = [
  {
    id: 'gallery-single-image',
    name: 'Single Image Display',
    description: 'Full-width spotlight image with caption.',
    category: 'Gallery',
    component: GallerySingleImage,
  },
  {
    id: 'gallery-two-image-split',
    name: 'Two-Image Split Gallery',
    description: 'Side-by-side layout for visual storytelling.',
    category: 'Gallery',
    component: GalleryTwoImageSplit,
  },
  {
    id: 'gallery-three-image-grid',
    name: 'Three-Image Grid',
    description: 'Balanced gallery for feature highlights.',
    category: 'Gallery',
    component: GalleryThreeImageGrid,
  },
  {
    id: 'gallery-four-image-mosaic',
    name: 'Four-Image Mosaic',
    description: 'Compact mosaic layout; great for portfolios.',
    category: 'Gallery',
    component: GalleryFourImageMosaic,
  },
  {
    id: 'gallery-five-image-showcase',
    name: 'Five-Image Showcase',
    description: 'Extended grid for editorial layouts.',
    category: 'Gallery',
    component: GalleryFiveImageShowcase,
  },
  {
    id: 'gallery-carousel',
    name: 'Carousel Gallery',
    description: 'Scrollable gallery for dynamic presentations.',
    category: 'Gallery',
    component: GalleryCarousel,
  },
];