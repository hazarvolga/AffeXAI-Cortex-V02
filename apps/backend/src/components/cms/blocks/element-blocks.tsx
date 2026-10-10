'use client';

import React from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';
import { ImageComponent } from '@/components/cms/image-component';

// Element Block 1: Spacer Element
export const ElementSpacer: React.FC<{ props?: any }> = ({ props }) => {
  const height = props?.height || "py-12";

  return (
    <ContainerComponent 
      id="element-spacer-container"
      padding="none" 
      background="none"
      className={height}
    >
      <div></div>
    </ContainerComponent>
  );
};

// Element Block 2: Divider Element
export const ElementDivider: React.FC<{ props?: any }> = ({ props }) => {
  return (
    <ContainerComponent 
      id="element-divider-container"
      padding="md" 
      background="none"
    >
      <hr className="border-t border-border" />
    </ContainerComponent>
  );
};

// Element Block 3: Title with Subtitle
export const ElementTitleSubtitle: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Section Title";
  const titleVariant = props?.titleVariant || "heading2";
  const titleAlign = props?.titleAlign || "center";
  const titleColor = props?.titleColor || "primary";
  const titleWeight = props?.titleWeight || "bold";
  
  const subtitle = props?.subtitle || "Brief supporting description for this section";
  const subtitleVariant = props?.subtitleVariant || "body";
  const subtitleAlign = props?.subtitleAlign || "center";
  const subtitleColor = props?.subtitleColor || "muted";
  const subtitleWeight = props?.subtitleWeight || "normal";

  return (
    <ContainerComponent 
      id="element-title-subtitle-container"
      padding="md" 
      background="none"
      className="text-center"
    >
      <TextComponent 
        id="element-title-subtitle-title"
        content={title}
        variant={titleVariant}
        align={titleAlign}
        color={titleColor}
        weight={titleWeight}
        className="mb-2" 
      />
      <TextComponent 
        id="element-title-subtitle-subtitle"
        content={subtitle}
        variant={subtitleVariant}
        align={subtitleAlign}
        color={subtitleColor}
        weight={subtitleWeight}
        className="text-muted-foreground max-w-2xl mx-auto" 
      />
    </ContainerComponent>
  );
};

// Element Block 4: Title with Button
export const ElementTitleButton: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Featured Section";
  const buttonText = props?.buttonText || "Learn More";

  return (
    <ContainerComponent 
      id="element-title-button-container"
      padding="md" 
      background="none"
      className="flex flex-col md:flex-row justify-between items-center"
    >
      <TextComponent 
        id="element-title-button-title"
        content={title} 
        variant="heading2" 
        className="mb-4 md:mb-0" 
      />
      <ButtonComponent 
        id="element-title-button-btn"
        text={buttonText} 
        variant="default" 
      />
    </ContainerComponent>
  );
};

// Element Block 5: Quote Block
export const ElementQuoteBlock: React.FC<{ props?: any }> = ({ props }) => {
  const quote = props?.quote || "“The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.”";
  const author = props?.author || "— Steve Jobs";

  return (
    <ContainerComponent 
      id="element-quote-container"
      padding="xl" 
      background="muted"
      className="text-center py-12"
    >
      <TextComponent 
        id="element-quote-text"
        content={quote} 
        variant="heading2" 
        className="italic mb-4" 
      />
      <TextComponent 
        id="element-quote-author"
        content={author} 
        variant="body" 
        className="font-medium" 
      />
    </ContainerComponent>
  );
};

// Element Block 6: Media Element (Image)
export const ElementMediaImage: React.FC<{ props?: any }> = ({ props }) => {
  const imageUrl = props?.imageUrl || "/placeholder-image.jpg";
  const caption = props?.caption || "Image caption or description";

  return (
    <ContainerComponent 
      id="element-media-container"
      padding="md" 
      background="none"
      className="text-center"
    >
      <ImageComponent 
        id="element-media-image"
        src={imageUrl} 
        alt="Featured Media" 
        className="rounded-lg shadow-lg mx-auto" 
      />
      <TextComponent 
        id="element-media-caption"
        content={caption} 
        variant="body" 
        className="text-muted-foreground mt-4" 
      />
    </ContainerComponent>
  );
};

// Element Block 7: Button Group (1–3 Buttons)
export const ElementButtonGroup: React.FC<{ props?: any }> = ({ props }) => {
  const buttons = props?.buttons || [
    {
      id: '1',
      text: "Primary Action",
      variant: "default"
    },
    {
      id: '2',
      text: "Secondary",
      variant: "outline"
    },
    {
      id: '3',
      text: "Learn More",
      variant: "ghost"
    }
  ];

  return (
    <ContainerComponent 
      id="element-button-group-container"
      padding="md" 
      background="none"
      className="text-center"
    >
      <GridComponent 
        id="element-button-group-grid"
        columns={buttons.length} 
        gap="md" 
        className="justify-center space-x-4"
      >
        {buttons.map((button: any, index: number) => (
          <ButtonComponent 
            id={`element-button-${index + 1}`} 
            key={button.id || index}
            text={button.text} 
            variant={button.variant} 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Element Block 8: Table / Link List Element
export const ElementTableList: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Resource Links";
  const links = props?.links || [
    {
      id: '1',
      text: "Documentation",
      url: "#"
    },
    {
      id: '2',
      text: "API Reference",
      url: "#"
    },
    {
      id: '3',
      text: "Tutorials",
      url: "#"
    },
    {
      id: '4',
      text: "Community Forum",
      url: "#"
    }
  ];

  return (
    <ContainerComponent 
      id="element-table-container"
      padding="md" 
      background="none"
    >
      <CardComponent 
        id="element-table-card"
        padding="lg" 
        rounded="lg" 
        shadow="md"
      >
        <TextComponent 
          id="element-table-title"
          content={title} 
          variant="heading3" 
          className="mb-4" 
        />
        <ul className="space-y-2">
          {links.map((link: any, index: number) => (
            <li key={link.id || index}>
              <a href={link.url} className="text-primary hover:underline">{link.text}</a>
            </li>
          ))}
        </ul>
      </CardComponent>
    </ContainerComponent>
  );
};

// Export all element blocks
export const elementBlocks = [
  {
    id: 'element-spacer',
    name: 'Spacer Element',
    description: 'Adds vertical or horizontal spacing; supports layout breathing room.',
    category: 'Element',
    component: ElementSpacer,
  },
  {
    id: 'element-divider',
    name: 'Divider Element',
    description: 'Horizontal rule or line separator; used to divide logical content blocks.',
    category: 'Element',
    component: ElementDivider,
  },
  {
    id: 'element-title-subtitle',
    name: 'Title with Subtitle',
    description: 'Section heading with an optional supporting line; introduces sections clearly.',
    category: 'Element',
    component: ElementTitleSubtitle,
  },
  {
    id: 'element-title-button',
    name: 'Title with Button',
    description: 'A compact header followed by an action; good for mini callouts or feature intros.',
    category: 'Element',
    component: ElementTitleButton,
  },
  {
    id: 'element-quote-block',
    name: 'Quote Block',
    description: 'Large typography for testimonials or quotes; helps create emphasis.',
    category: 'Element',
    component: ElementQuoteBlock,
  },
  {
    id: 'element-media-image',
    name: 'Media Element (Image)',
    description: 'Displays media inline with adjustable ratio and alignment.',
    category: 'Element',
    component: ElementMediaImage,
  },
  {
    id: 'element-button-group',
    name: 'Button Group (1–3 Buttons)',
    description: 'Single or multiple CTA buttons with layout variations (stacked or inline).',
    category: 'Element',
    component: ElementButtonGroup,
  },
  {
    id: 'element-table-list',
    name: 'Table / Link List Element',
    description: 'For structured information or resource lists.',
    category: 'Element',
    component: ElementTableList,
  },
];