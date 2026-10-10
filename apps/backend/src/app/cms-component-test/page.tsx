'use client';

import React, { useState } from 'react';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { ContainerComponent } from '@/components/cms/container-component';
import { CardComponent } from '@/components/cms/card-component';
import { GridComponent } from '@/components/cms/grid-component';

const CmsComponentTestPage = () => {
  const [buttonClickCount, setButtonClickCount] = useState(0);

  const handleButtonClick = () => {
    setButtonClickCount(buttonClickCount + 1);
  };

  return (
    <div className="container mx-auto py-8">
      <ContainerComponent
        padding="lg"
        background="primary"
        rounded={true}
        className="mb-8 text-center"
      >
        <TextComponent
          id="heading"
          content="CMS Component Testing"
          variant="heading1"
          align="center"
          className="text-white mb-4"
        />
        <TextComponent
          id="subtitle"
          content="Interactive demonstration of all CMS components"
          variant="heading2"
          align="center"
          className="text-white/90"
          color="secondary"
        />
      </ContainerComponent>

      <ContainerComponent
        padding="md"
        className="mb-8"
      >
        <TextComponent
          id="text-section"
          content="Text Component Examples"
          variant="heading2"
          className="mb-6"
        />
        
        <div className="space-y-4">
          <TextComponent
            id="heading1-example"
            content="Heading 1 Example"
            variant="heading1"
          />
          <TextComponent
            id="heading2-example"
            content="Heading 2 Example"
            variant="heading2"
          />
          <TextComponent
            id="heading3-example"
            content="Heading 3 Example"
            variant="heading3"
          />
          <TextComponent
            id="body-example"
            content="This is a body text example. It demonstrates the default text styling for paragraphs and general content."
            variant="body"
          />
          <TextComponent
            id="caption-example"
            content="This is a caption text example. It's smaller and typically used for supplementary information."
            variant="caption"
            color="secondary"
          />
          <TextComponent
            id="colored-example"
            content="This text uses color variations to demonstrate semantic styling."
            variant="body"
            color="success"
          />
        </div>
      </ContainerComponent>

      <ContainerComponent
        padding="md"
        className="mb-8"
      >
        <TextComponent
          id="button-section"
          content="Button Component Examples"
          variant="heading2"
          className="mb-6"
        />
        
        <div className="flex flex-wrap gap-4 mb-4">
          <ButtonComponent
            id="default-button"
            text="Default Button"
            variant="default"
            onClick={handleButtonClick}
          />
          <ButtonComponent
            id="secondary-button"
            text="Secondary Button"
            variant="secondary"
            onClick={handleButtonClick}
          />
          <ButtonComponent
            id="outline-button"
            text="Outline Button"
            variant="outline"
            onClick={handleButtonClick}
          />
          <ButtonComponent
            id="destructive-button"
            text="Destructive Button"
            variant="destructive"
            onClick={handleButtonClick}
          />
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <ButtonComponent
            id="small-button"
            text="Small Button"
            variant="default"
            size="sm"
            onClick={handleButtonClick}
          />
          <ButtonComponent
            id="large-button"
            text="Large Button"
            variant="default"
            size="lg"
            onClick={handleButtonClick}
          />
        </div>
        
        <TextComponent
          id="button-click-count"
          content={`Button clicked ${buttonClickCount} times`}
          variant="body"
          color="secondary"
        />
      </ContainerComponent>

      <ContainerComponent
        padding="md"
        className="mb-8"
      >
        <TextComponent
          id="layout-section"
          content="Layout Components"
          variant="heading2"
          className="mb-6"
        />
        
        <GridComponent
          columns="auto"
          gap="lg"
        >
          <CardComponent
            padding="lg"
            rounded="lg"
            shadow="md"
          >
            <TextComponent
              id="card1-title"
              content="Card Component"
              variant="heading3"
              className="mb-2"
            />
            <TextComponent
              id="card1-text"
              content="This is a card component demonstrating container styling with padding, rounded corners, and shadow effects."
              variant="body"
              color="secondary"
            />
            <ButtonComponent
              id="card1-button"
              text="Card Action"
              variant="default"
              className="mt-4"
              onClick={handleButtonClick}
            />
          </CardComponent>

          <CardComponent
            padding="lg"
            rounded="lg"
            shadow="md"
            background="muted"
          >
            <TextComponent
              id="card2-title"
              content="Card with Background"
              variant="heading3"
              className="mb-2"
            />
            <TextComponent
              id="card2-text"
              content="Cards can have different background colors for visual distinction."
              variant="body"
              color="secondary"
            />
          </CardComponent>
        </GridComponent>
      </ContainerComponent>

      <ContainerComponent
        padding="xl"
        background="muted"
        rounded="lg"
        className="text-center"
      >
        <TextComponent
          id="conclusion"
          content="Component Testing Complete"
          variant="heading2"
          className="mb-4"
        />
        <TextComponent
          id="conclusion-text"
          content="All CMS components are working correctly. You can interact with the buttons to see state changes."
          variant="body"
          color="secondary"
        />
      </ContainerComponent>
    </div>
  );
};

export default CmsComponentTestPage;