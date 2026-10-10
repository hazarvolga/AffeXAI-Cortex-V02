'use client';

import React from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';
import { ImageComponent } from '@/components/cms/image-component';

// Content Block 1: Simple Content Block
export const ContentSimpleBlock: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Important Information";
  const content = props?.content || "This is a standard content block with a title and paragraph. It's perfect for displaying clean information without additional styling.";

  return (
    <ContainerComponent 
      id="content-simple-container"
      padding="md" 
      background="none"
    >
      <TextComponent 
        id="content-simple-title"
        content={title} 
        variant="heading2" 
        className="mb-4" 
      />
      <TextComponent 
        id="content-simple-text"
        content={content} 
        variant="body" 
        className="text-muted-foreground" 
      />
    </ContainerComponent>
  );
};

// Content Block 2: Boxed Content Block
export const ContentBoxedBlock: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Featured Content";
  const content = props?.content || "This boxed content block adds a bordered or shaded background to emphasize important information.";
  const buttonText = props?.buttonText || "Learn More";

  return (
    <ContainerComponent 
      id="content-boxed-container"
      padding="none" 
      background="none"
    >
      <CardComponent 
        id="content-boxed-card"
        padding="lg" 
        rounded="lg" 
        shadow="md"
      >
        <TextComponent 
          id="content-boxed-title"
          content={title} 
          variant="heading3" 
          className="mb-3" 
        />
        <TextComponent 
          id="content-boxed-text"
          content={content} 
          variant="body" 
          className="mb-4 text-muted-foreground" 
        />
        <ButtonComponent id="content-boxed-btn" text={buttonText} variant="outline" size="sm" />
      </CardComponent>
    </ContainerComponent>
  );
};

// Content Block 3: Image + Content Side-by-Side
export const ContentImageSideBySide: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Product Explanation";
  const content = props?.content || "This layout is perfect for product explanations or team introductions where you want to show a visual alongside descriptive text.";
  const buttonText = props?.buttonText || "View Details";
  const imageUrl = props?.imageUrl || "/placeholder-image.jpg";

  return (
    <ContainerComponent 
      id="content-image-side-container"
      padding="md" 
      background="muted"
      className="py-12"
    >
      <GridComponent 
        id="content-image-side-grid"
        columns={2} 
        gap="xl" 
        className="items-center"
      >
        <div>
          <ImageComponent 
            id="content-image-side-image"
            src={imageUrl} 
            alt="Product" 
            className="rounded-lg shadow-lg w-full h-auto" 
          />
        </div>
        <div>
          <TextComponent 
            id="content-image-side-title"
            content={title} 
            variant="heading2" 
            className="mb-4" 
          />
          <TextComponent 
            id="content-image-side-text"
            content={content} 
            variant="body" 
            className="mb-6 text-muted-foreground" 
          />
          <ButtonComponent id="content-image-side-btn" text={buttonText} variant="default" />
        </div>
      </GridComponent>
    </ContainerComponent>
  );
};

// Content Block 4: Double Image and Text Block
export const ContentDoubleImageText: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Feature Comparison";
  const items = props?.items || [
    {
      id: '1',
      title: "Feature One",
      content: "Detailed explanation of the first feature and its benefits.",
      imageUrl: "/placeholder-image.jpg"
    },
    {
      id: '2',
      title: "Feature Two",
      content: "Detailed explanation of the second feature and its benefits.",
      imageUrl: "/placeholder-image.jpg"
    }
  ];

  return (
    <ContainerComponent 
      id="content-double-container"
      padding="md" 
      background="none"
      className="py-12"
    >
      <TextComponent 
        id="content-double-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="content-double-grid"
        columns={2} 
        gap="xl" 
      >
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`content-double-card-${index + 1}`}
            key={item.id || index}
            padding="lg" 
            rounded="lg" 
            shadow="md"
          >
            <ImageComponent 
              id={`content-double-image-${index + 1}`}
              src={item.imageUrl} 
              alt={item.title} 
              className="rounded-md mb-4" 
            />
            <TextComponent 
              id={`content-double-card-${index + 1}-title`}
              content={item.title} 
              variant="heading3" 
              className="mb-2" 
            />
            <TextComponent 
              id={`content-double-card-${index + 1}-text`}
              content={item.content} 
              variant="body" 
              className="mb-4 text-muted-foreground" 
            />
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Content Block 5: Triple Content Grid
export const ContentTripleGrid: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Key Benefits";
  const items = props?.items || [
    {
      id: '1',
      title: "Benefit One",
      content: "Description of the first key benefit that provides value to users.",
      buttonText: "Learn More"
    },
    {
      id: '2',
      title: "Benefit Two",
      content: "Description of the second key benefit that provides value to users.",
      buttonText: "Learn More"
    },
    {
      id: '3',
      title: "Benefit Three",
      content: "Description of the third key benefit that provides value to users.",
      buttonText: "Learn More"
    }
  ];

  return (
    <ContainerComponent 
      id="content-triple-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <TextComponent 
        id="content-triple-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="content-triple-grid"
        columns={3} 
        gap="xl" 
      >
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`content-triple-card-${index + 1}`}
            key={item.id || index}
            padding="lg" 
            rounded="lg" 
            shadow="md"
            className="text-center"
          >
            <TextComponent 
              id={`content-triple-card-${index + 1}-title`}
              content={item.title} 
              variant="heading3" 
              className="mb-3" 
            />
            <TextComponent 
              id={`content-triple-card-${index + 1}-text`}
              content={item.content} 
              variant="body" 
              className="mb-4 text-muted-foreground" 
            />
            <ButtonComponent id={`content-triple-card-${index + 1}-btn`} text={item.buttonText} variant="outline" size="sm" />
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Content Block 6: CTA Content Box
export const ContentCtaBox: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Ready to Get Started?";
  const content = props?.content || "Join thousands of satisfied customers today and experience the difference.";
  const buttonText = props?.buttonText || "Sign Up Free";

  return (
    <ContainerComponent 
      id="content-cta-container"
      padding="none" 
      background="none"
    >
      <CardComponent 
        id="content-cta-card"
        padding="xl" 
        rounded="lg" 
        shadow="md"
        background="primary"
        className="text-center text-white"
      >
        <TextComponent 
          id="content-cta-title"
          content={title} 
          variant="heading2" 
          className="mb-4" 
        />
        <TextComponent 
          id="content-cta-text"
          content={content} 
          variant="body" 
          className="mb-8 max-w-2xl mx-auto text-white/80" 
        />
        <ButtonComponent 
          id="content-cta-btn"
          text={buttonText} 
          variant="default" 
          size="lg" 
          className="bg-white text-primary hover:bg-white/90" 
        />
      </CardComponent>
    </ContainerComponent>
  );
};

// Content Block 7: Image + Simple Content (Stacked)
export const ContentImageStacked: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Visual Storytelling";
  const content = props?.content || "This visual-first layout places the image above the supporting text, making it perfect for storytelling or showcasing products where the visual is the primary focus.";
  const imageUrl = props?.imageUrl || "/placeholder-image.jpg";

  return (
    <ContainerComponent 
      id="content-stacked-container"
      padding="md" 
      background="none"
      className="py-12"
    >
      <TextComponent 
        id="content-stacked-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-8" 
      />
      <ImageComponent 
        id="content-stacked-image"
        src={imageUrl} 
        alt="Story" 
        className="rounded-lg shadow-lg mx-auto mb-8" 
      />
      <TextComponent 
        id="content-stacked-text"
        content={content} 
        variant="body" 
        className="text-center max-w-3xl mx-auto text-muted-foreground" 
      />
    </ContainerComponent>
  );
};

// Content Block 8: Mini Box CTA
export const ContentMiniBoxCta: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Special Offer";
  const content = props?.content || "Limited time discount for new customers!";
  const buttonText = props?.buttonText || "Claim Offer";

  return (
    <ContainerComponent 
      id="content-mini-container"
      padding="md" 
      background="none"
      className="text-center"
    >
      <CardComponent 
        id="content-mini-card"
        padding="lg" 
        rounded="lg" 
        shadow="md"
        className="inline-block"
      >
        <TextComponent 
          id="content-mini-title"
          content={title} 
          variant="heading3" 
          className="mb-2" 
        />
        <TextComponent 
          id="content-mini-text"
          content={content} 
          variant="body" 
          className="mb-4 text-muted-foreground" 
        />
        <ButtonComponent id="content-mini-btn" text={buttonText} variant="default" size="sm" />
      </CardComponent>
    </ContainerComponent>
  );
};

// Export all content variant blocks
export const contentVariantBlocks = [
  {
    id: 'content-simple-block',
    name: 'Simple Content Block',
    description: 'Standard title and paragraph; for clean information display.',
    category: 'Content',
    component: ContentSimpleBlock,
  },
  {
    id: 'content-boxed-block',
    name: 'Boxed Content Block',
    description: 'Adds a bordered or shaded background to emphasize content.',
    category: 'Content',
    component: ContentBoxedBlock,
  },
  {
    id: 'content-image-side-by-side',
    name: 'Image + Content Side-by-Side',
    description: 'For product explanations or team introductions.',
    category: 'Content',
    component: ContentImageSideBySide,
  },
  {
    id: 'content-double-image-text',
    name: 'Double Image and Text Block',
    description: 'Dual layout showing comparisons or feature pairs.',
    category: 'Content',
    component: ContentDoubleImageText,
  },
  {
    id: 'content-triple-grid',
    name: 'Triple Content Grid',
    description: 'Three equal boxes; great for highlighting multiple features.',
    category: 'Content',
    component: ContentTripleGrid,
  },
  {
    id: 'content-cta-box',
    name: 'CTA Content Box',
    description: 'Content area with bold CTA; designed for conversions.',
    category: 'Content',
    component: ContentCtaBox,
  },
  {
    id: 'content-image-stacked',
    name: 'Image + Simple Content (Stacked)',
    description: 'Visual-first layout with supporting text below.',
    category: 'Content',
    component: ContentImageStacked,
  },
  {
    id: 'content-mini-box-cta',
    name: 'Mini Box CTA',
    description: 'Compact, reusable CTA for embedding between other sections.',
    category: 'Content',
    component: ContentMiniBoxCta,
  },
];