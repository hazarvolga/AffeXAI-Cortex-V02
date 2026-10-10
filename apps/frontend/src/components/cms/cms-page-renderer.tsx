'use client';

import React from 'react';
import { TextComponent } from './text-component';
import { ButtonComponent } from './button-component';
import { ImageComponent } from './image-component';
import { ContainerComponent } from './container-component';
import { CardComponent } from './card-component';
import { GridComponent } from './grid-component';
import { PreviewProvider } from './preview-context';

interface CmsComponent {
  id: string;
  type: 'text' | 'button' | 'image' | 'container' | 'card' | 'grid';
  props: any;
  children?: CmsComponent[];
}

interface CmsPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  components: CmsComponent[];
}

interface CmsPageRendererProps {
  page: CmsPage;
}

export const CmsPageRenderer: React.FC<CmsPageRendererProps> = ({ page }) => {
  const renderComponent = (component: CmsComponent): React.ReactNode => {
    switch (component.type) {
      case 'text':
        return <TextComponent key={component.id} {...component.props} />;
      
      case 'button':
        return <ButtonComponent key={component.id} {...component.props} />;
      
      case 'image':
        return <ImageComponent key={component.id} {...component.props} />;
      
      case 'container':
        return (
          <ContainerComponent key={component.id} {...component.props}>
            {component.children?.map(renderComponent)}
          </ContainerComponent>
        );
      
      case 'card':
        return (
          <CardComponent key={component.id} {...component.props}>
            {component.children?.map(renderComponent)}
          </CardComponent>
        );
      
      case 'grid':
        return (
          <GridComponent key={component.id} {...component.props}>
            {component.children?.map(renderComponent)}
          </GridComponent>
        );
      
      default:
        return null;
    }
  };

  return (
    <PreviewProvider initialMode="public">
      <div className="cms-page">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{page.title}</h1>
          {page.description && (
            <p className="text-muted-foreground">{page.description}</p>
          )}
        </header>
        
        <main>
          {page.components.map(renderComponent)}
        </main>
      </div>
    </PreviewProvider>
  );
};

export default CmsPageRenderer;