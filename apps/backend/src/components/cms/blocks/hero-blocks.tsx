'use client';

import React from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';
import { ImageComponent } from '@/components/cms/image-component';

// Hero Block 1: Centered Hero with Background Image
export const HeroCenteredBgImage: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Welcome to Our Platform";
  const subtitle = props?.subtitle || "Discover amazing features and services that will transform your experience.";
  const primaryButtonText = props?.primaryButtonText || "Get Started";
  const secondaryButtonText = props?.secondaryButtonText || "Learn More";

  return (
    <ContainerComponent 
      id="hero-centered-container"
      padding="xl" 
      background="muted"
      className="text-center py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
    >
      <TextComponent 
        id="hero-centered-title"
        content={title} 
        variant="heading1" 
        className="mb-6" 
      />
      <TextComponent 
        id="hero-centered-subtitle"
        content={subtitle} 
        variant="body" 
        className="mb-8 max-w-2xl mx-auto text-white/80" 
      />
      <GridComponent 
        id="hero-centered-btn-grid"
        columns={2} 
        gap="md" 
        className="justify-center space-x-4"
      >
        <ButtonComponent id="hero-get-started-btn" text={primaryButtonText} variant="default" size="lg" />
        <ButtonComponent id="hero-learn-more-btn" text={secondaryButtonText} variant="outline" size="lg" className="border-white text-white hover:bg-white/10" />
      </GridComponent>
    </ContainerComponent>
  );
};

// Hero Block 2: Split Hero with Image on Right
export const HeroSplitImageRight: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Transform Your Business";
  const subtitle = props?.subtitle || "Our innovative solutions help you achieve more with less effort.";
  const buttonText = props?.buttonText || "Start Free Trial";
  const imageUrl = props?.imageUrl || "/placeholder-image.jpg";

  return (
    <ContainerComponent 
      id="hero-split-container"
      padding="xl" 
      background="none"
      className="py-20"
    >
      <GridComponent 
        id="hero-split-grid"
        columns={2} 
        gap="xl" 
        className="items-center"
      >
        <div>
          <TextComponent 
            id="hero-split-title"
            content={title} 
            variant="heading1" 
            className="mb-6" 
          />
          <TextComponent 
            id="hero-split-subtitle"
            content={subtitle} 
            variant="body" 
            className="mb-8 text-muted-foreground" 
          />
          <ButtonComponent id="hero-split-cta-btn" text={buttonText} variant="default" size="lg" />
        </div>
        <div className="flex justify-center">
          <CardComponent 
            id="hero-split-card"
            padding="lg" 
            rounded="lg" 
            shadow="md"
          >
            <ImageComponent 
              id="hero-split-image"
              src={imageUrl} 
              alt="Hero Image" 
              className="rounded-md" 
            />
          </CardComponent>
        </div>
      </GridComponent>
    </ContainerComponent>
  );
};

// Hero Block 3: Gradient Hero with Floating CTA
export const HeroGradientFloatingCta: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Innovation Meets Excellence";
  const subtitle = props?.subtitle || "Join thousands of satisfied customers who have transformed their workflow.";
  const buttonText = props?.buttonText || "Get Started";

  return (
    <ContainerComponent 
      id="hero-gradient-container"
      padding="xl" 
      background="none"
      className="py-32 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-hidden"
    >
      <div className="absolute top-10 right-10">
        <ButtonComponent 
          id="hero-gradient-floating-btn"
          text={buttonText} 
          variant="default" 
          size="lg" 
          className="bg-white text-indigo-600 hover:bg-white/90 shadow-lg"
        />
      </div>
      <TextComponent 
        id="hero-gradient-title"
        content={title} 
        variant="heading1" 
        className="mb-6 max-w-2xl" 
      />
      <TextComponent 
        id="hero-gradient-subtitle"
        content={subtitle} 
        variant="body" 
        className="mb-10 max-w-2xl text-white/80" 
      />
    </ContainerComponent>
  );
};

// Hero Block 4: Video Hero Background
export const HeroVideoBackground: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Experience the Future";
  const subtitle = props?.subtitle || "Immersive experiences that captivate and engage your audience.";
  const buttonText = props?.buttonText || "Watch Demo";

  return (
    <ContainerComponent 
      id="hero-video-container"
      padding="xl" 
      background="none"
      className="py-40 rounded-lg relative overflow-hidden text-white text-center"
    >
      {/* Video background would go here in a real implementation */}
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10">
        <TextComponent 
          id="hero-video-title"
          content={title} 
          variant="heading1" 
          className="mb-6" 
        />
        <TextComponent 
          id="hero-video-subtitle"
          content={subtitle} 
          variant="body" 
          className="mb-10 max-w-2xl mx-auto text-white/80" 
        />
        <ButtonComponent 
          id="hero-video-cta-btn"
          text={buttonText} 
          variant="default" 
          size="lg" 
          className="bg-white text-black hover:bg-white/90"
        />
      </div>
    </ContainerComponent>
  );
};

// Hero Block 5: Fullscreen Hero with Sticky CTA
export const HeroFullscreenStickyCta: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Make Your Mark";
  const subtitle = props?.subtitle || "The ultimate platform for creators and innovators.";
  const buttonText = props?.buttonText || "Get Started Now";

  return (
    <ContainerComponent 
      id="hero-fullscreen-container"
      padding="none" 
      background="none"
      className="h-screen flex flex-col justify-center items-center text-center relative"
    >
      <TextComponent 
        id="hero-fullscreen-title"
        content={title} 
        variant="heading1" 
        className="mb-6" 
      />
      <TextComponent 
        id="hero-fullscreen-subtitle"
        content={subtitle} 
        variant="body" 
        className="mb-10 max-w-2xl mx-auto text-muted-foreground" 
      />
      <div className="fixed bottom-8">
        <ButtonComponent 
          id="hero-fullscreen-cta-btn"
          text={buttonText} 
          variant="default" 
          size="lg" 
        />
      </div>
    </ContainerComponent>
  );
};

// Hero Block 6: Carousel Hero with Multiple Slides
export const HeroCarouselSlides: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Featured Solutions";
  const subtitle = props?.subtitle || "Discover our most popular offerings";
  const items = props?.items || [
    {
      id: '1',
      slideTitle: "Solution One",
      slideDescription: "Brief description of this amazing solution.",
      buttonText: "Learn More"
    },
    {
      id: '2',
      slideTitle: "Solution Two",
      slideDescription: "Another great solution for your business needs.",
      buttonText: "Learn More"
    },
    {
      id: '3',
      slideTitle: "Solution Three",
      slideDescription: "Our most popular solution with advanced features.",
      buttonText: "Learn More"
    }
  ];

  return (
    <ContainerComponent 
      id="hero-carousel-container"
      padding="xl" 
      background="muted"
      className="py-20 rounded-lg"
    >
      <GridComponent 
        id="hero-carousel-grid"
        columns={1} 
        gap="md" 
      >
        <TextComponent 
          id="hero-carousel-title"
          content={title} 
          variant="heading2" 
          className="text-center mb-4" 
        />
        <TextComponent 
          id="hero-carousel-subtitle"
          content={subtitle} 
          variant="body" 
          className="text-center mb-8 text-muted-foreground" 
        />
        {/* In a real implementation, this would be a carousel component */}
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`hero-carousel-card-${index + 1}`}
            key={item.id || index}
            padding="lg" 
            rounded="lg" 
            shadow="md"
            className="text-center"
          >
            <TextComponent 
              id={`hero-carousel-slide-title-${index + 1}`}
              content={item.slideTitle} 
              variant="heading3" 
              className="mb-3" 
            />
            <TextComponent 
              id={`hero-carousel-slide-desc-${index + 1}`}
              content={item.slideDescription} 
              variant="body" 
              className="mb-4 text-muted-foreground" 
            />
            <ButtonComponent 
              id={`hero-carousel-slide-btn-${index + 1}`}
              text={item.buttonText} 
              variant="outline" 
              size="sm" 
            />
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Export all hero blocks
export const heroBlocks = [
  {
    id: 'hero-centered-bg-image',
    name: 'Centered Hero with Background Image',
    description: 'A minimal hero with centered content and full-width background image; great for clean, modern landing pages.',
    category: 'Hero',
    component: HeroCenteredBgImage,
  },
  {
    id: 'hero-split-image-right',
    name: 'Split Hero with Image on Right',
    description: 'Text content on the left and product image on the right; suitable for product showcases or SaaS intros.',
    category: 'Hero',
    component: HeroSplitImageRight,
  },
  {
    id: 'hero-gradient-floating-cta',
    name: 'Gradient Hero with Floating CTA',
    description: 'Gradient background and a floating button element; excellent for app downloads or signups.',
    category: 'Hero',
    component: HeroGradientFloatingCta,
  },
  {
    id: 'hero-video-background',
    name: 'Video Hero Background',
    description: 'Looped video background with overlay text and CTA; ideal for storytelling and brand identity.',
    category: 'Hero',
    component: HeroVideoBackground,
  },
  {
    id: 'hero-fullscreen-sticky-cta',
    name: 'Fullscreen Hero with Sticky CTA',
    description: 'Takes the entire viewport with fixed CTA; optimized for conversions on sales or promotion pages.',
    category: 'Hero',
    component: HeroFullscreenStickyCta,
  },
  {
    id: 'hero-carousel-slides',
    name: 'Carousel Hero with Multiple Slides',
    description: 'Rotating hero slides for multi-feature product promotion or event highlights.',
    category: 'Hero',
    component: HeroCarouselSlides,
  },
];