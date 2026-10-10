'use client';

import React from 'react';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { ContainerComponent } from '@/components/cms/container-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';
import { PreviewProvider } from '@/components/cms/preview-context';

const CmsResponsiveDemoPage = () => {
  return (
    <PreviewProvider initialMode="public">
      <div className="container mx-auto py-8">
        <ContainerComponent
          id="header-container"
          padding="lg"
          background="primary"
          rounded="lg"
          className="mb-8 text-center"
        >
          <TextComponent
            id="heading"
            content="Responsive CMS Demo"
            variant="heading1"
            align="center"
            className="text-white mb-4"
          />
          <TextComponent
            id="subtitle"
            content="Showcasing responsive design across all components"
            variant="heading2"
            align="center"
            className="text-white/90"
            color="secondary"
          />
        </ContainerComponent>

        <ContainerComponent
          id="section1-container"
          padding="md"
          className="mb-8"
        >
          <TextComponent
            id="section1-heading"
            content="Responsive Text Components"
            variant="heading2"
            className="mb-4"
          />
          <TextComponent
            id="section1-text1"
            content="This is a body text that will adapt to different screen sizes. On mobile devices, the text will be easier to read with appropriate spacing and sizing."
            variant="body"
            className="mb-4"
          />
          <TextComponent
            id="section1-text2"
            content="Notice how the alignment and spacing adjust based on the viewport size."
            variant="body"
            color="secondary"
          />
        </ContainerComponent>

        <ContainerComponent
          id="section2-container"
          padding="md"
          className="mb-8"
        >
          <TextComponent
            id="section2-heading"
            content="Responsive Grid Layout"
            variant="heading2"
            className="mb-6"
          />
          <GridComponent
            id="grid-layout"
            columns="auto"
            gap="lg"
          >
            <CardComponent
              id="card1"
              padding="lg"
              rounded="lg"
              shadow="md"
              className="text-center"
            >
              <TextComponent
                id="card1-title"
                content="Mobile First"
                variant="heading3"
                className="mb-2"
              />
              <TextComponent
                id="card1-text"
                content="This card layout adjusts from 1 column on mobile to 3 columns on desktop."
                variant="body"
                color="secondary"
              />
              <ButtonComponent
                id="card1-button"
                text="Learn More"
                variant="default"
                className="mt-4"
              />
            </CardComponent>

            <CardComponent
              id="card2"
              padding="lg"
              rounded="lg"
              shadow="md"
              className="text-center"
            >
              <TextComponent
                id="card2-title"
                content="Flexible Grid"
                variant="heading3"
                className="mb-2"
              />
              <TextComponent
                id="card2-text"
                content="The grid system automatically adjusts based on available space."
                variant="body"
                color="secondary"
              />
              <ButtonComponent
                id="card2-button"
                text="Explore"
                variant="outline"
                className="mt-4"
              />
            </CardComponent>

            <CardComponent
              id="card3"
              padding="lg"
              rounded="lg"
              shadow="md"
              className="text-center"
            >
              <TextComponent
                id="card3-title"
                content="Consistent Design"
                variant="heading3"
                className="mb-2"
              />
              <TextComponent
                id="card3-text"
                content="All components maintain consistent styling across devices."
                variant="body"
                color="secondary"
              />
              <ButtonComponent
                id="card3-button"
                text="Get Started"
                variant="secondary"
                className="mt-4"
              />
            </CardComponent>
          </GridComponent>
        </ContainerComponent>

        <ContainerComponent
          id="cta-container"
          padding="xl"
          background="muted"
          rounded="lg"
          className="text-center mb-8"
        >
          <TextComponent
            id="cta-heading"
            content="Experience Responsive Design"
            variant="heading2"
            className="mb-4"
          />
          <TextComponent
            id="cta-text"
            content="Resize your browser window to see how components adapt to different screen sizes."
            variant="body"
            color="secondary"
            className="mb-6"
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonComponent
              id="cta-button1"
              text="View Documentation"
              variant="default"
              size="lg"
            />
            <ButtonComponent
              id="cta-button2"
              text="Try Demo"
              variant="outline"
              size="lg"
            />
          </div>
        </ContainerComponent>

        <ContainerComponent
          id="footer-container"
          padding="md"
        >
          <TextComponent
            id="footer-heading"
            content="Cross-Device Consistency"
            variant="heading3"
            className="mb-4 text-center"
          />
          <TextComponent
            id="footer-text"
            content="All CMS components are built with responsive design principles, ensuring a consistent experience across desktop, tablet, and mobile devices. The flexible grid system, adaptive typography, and scalable components work together to provide an optimal viewing experience on any device."
            variant="body"
            align="center"
            color="secondary"
          />
        </ContainerComponent>
      </div>
    </PreviewProvider>
  );
};

export default CmsResponsiveDemoPage;