'use client';

import React from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { GridComponent } from '@/components/cms/grid-component';

// Navigation Block 1: Minimal Navigation with Logo Left
export const NavigationMinimalLogoLeft: React.FC<{ props?: any }> = ({ props }) => {
  const logoText = props?.logoText || "Company";
  const navItems = props?.navItems || [
    {
      id: '1',
      text: "Home",
      url: "#"
    },
    {
      id: '2',
      text: "About",
      url: "#"
    },
    {
      id: '3',
      text: "Services",
      url: "#"
    },
    {
      id: '4',
      text: "Contact",
      url: "#"
    }
  ];

  return (
    <ContainerComponent 
      id="nav-minimal-container"
      padding="md" 
      background="none"
      className="flex items-center justify-between border-b"
    >
      <TextComponent 
        id="nav-minimal-logo"
        content={logoText} 
        variant="heading3" 
        className="font-bold" 
      />
      <GridComponent 
        id="nav-minimal-grid"
        columns={navItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {navItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Navigation Block 2: Centered Navigation with Logo in Middle
export const NavigationCenteredLogo: React.FC<{ props?: any }> = ({ props }) => {
  const logoText = props?.logoText || "Company";
  const leftNavItems = props?.leftNavItems || [
    {
      id: '1',
      text: "Home",
      url: "#"
    },
    {
      id: '2',
      text: "About",
      url: "#"
    }
  ];
  const rightNavItems = props?.rightNavItems || [
    {
      id: '1',
      text: "Services",
      url: "#"
    },
    {
      id: '2',
      text: "Contact",
      url: "#"
    }
  ];

  return (
    <ContainerComponent 
      id="nav-centered-container"
      padding="md" 
      background="none"
      className="flex items-center justify-between border-b"
    >
      <GridComponent 
        id="nav-left-grid"
        columns={leftNavItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {leftNavItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-left-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
          />
        ))}
      </GridComponent>
      <TextComponent 
        id="nav-centered-logo"
        content={logoText} 
        variant="heading3" 
        className="font-bold mx-8" 
      />
      <GridComponent 
        id="nav-right-grid"
        columns={rightNavItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {rightNavItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-right-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Navigation Block 3: Navigation with Logo + CTA Button
export const NavigationLogoCta: React.FC<{ props?: any }> = ({ props }) => {
  const logoText = props?.logoText || "Company";
  const navItems = props?.navItems || [
    {
      id: '1',
      text: "Home",
      url: "#"
    },
    {
      id: '2',
      text: "About",
      url: "#"
    },
    {
      id: '3',
      text: "Services",
      url: "#"
    }
  ];
  const ctaButtonText = props?.ctaButtonText || "Sign Up";

  return (
    <ContainerComponent 
      id="nav-cta-container"
      padding="md" 
      background="none"
      className="flex items-center justify-between border-b"
    >
      <TextComponent 
        id="nav-cta-logo"
        content={logoText} 
        variant="heading3" 
        className="font-bold" 
      />
      <GridComponent 
        id="nav-cta-grid"
        columns={navItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {navItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
          />
        ))}
      </GridComponent>
      <ButtonComponent id="nav-signup-btn" text={ctaButtonText} variant="default" />
    </ContainerComponent>
  );
};

// Navigation Block 4: Navigation with Social Links
export const NavigationSocialLinks: React.FC<{ props?: any }> = ({ props }) => {
  const logoText = props?.logoText || "Company";
  const navItems = props?.navItems || [
    {
      id: '1',
      text: "Home",
      url: "#"
    },
    {
      id: '2',
      text: "About",
      url: "#"
    },
    {
      id: '3',
      text: "Services",
      url: "#"
    },
    {
      id: '4',
      text: "Contact",
      url: "#"
    }
  ];
  const socialLinks = props?.socialLinks || [
    {
      id: '1',
      text: "f",
      url: "#"
    },
    {
      id: '2',
      text: "t",
      url: "#"
    },
    {
      id: '3',
      text: "in",
      url: "#"
    }
  ];

  return (
    <ContainerComponent 
      id="nav-social-container"
      padding="md" 
      background="none"
      className="flex items-center justify-between border-b"
    >
      <TextComponent 
        id="nav-social-logo"
        content={logoText} 
        variant="heading3" 
        className="font-bold" 
      />
      <GridComponent 
        id="nav-social-links-grid"
        columns={navItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {navItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
          />
        ))}
      </GridComponent>
      <GridComponent 
        id="nav-social-icons-grid"
        columns={socialLinks.length} 
        gap="sm" 
        className="flex items-center space-x-2"
      >
        {socialLinks.map((link: any, index: number) => (
          <ButtonComponent 
            id={`nav-social-${index + 1}`} 
            key={link.id || index}
            text={link.text} 
            variant="outline" 
            size="sm" 
            className="w-8 h-8 p-0" 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Navigation Block 5: Sticky Navigation with Transparent Background
export const NavigationStickyTransparent: React.FC<{ props?: any }> = ({ props }) => {
  const logoText = props?.logoText || "Company";
  const navItems = props?.navItems || [
    {
      id: '1',
      text: "Home",
      url: "#"
    },
    {
      id: '2',
      text: "About",
      url: "#"
    },
    {
      id: '3',
      text: "Services",
      url: "#"
    },
    {
      id: '4',
      text: "Contact",
      url: "#"
    }
  ];

  return (
    <ContainerComponent 
      id="nav-sticky-container"
      padding="md" 
      background="none"
      className="flex items-center justify-between absolute top-0 w-full bg-transparent"
    >
      <TextComponent 
        id="nav-sticky-logo"
        content={logoText} 
        variant="heading3" 
        className="font-bold" 
      />
      <GridComponent 
        id="nav-sticky-grid"
        columns={navItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {navItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
            className="text-white hover:text-white" 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Navigation Block 6: Split Navigation (Logo Center, Nav Left & Right)
export const NavigationSplit: React.FC<{ props?: any }> = ({ props }) => {
  const logoText = props?.logoText || "Company";
  const leftNavItems = props?.leftNavItems || [
    {
      id: '1',
      text: "Products",
      url: "#"
    },
    {
      id: '2',
      text: "Solutions",
      url: "#"
    }
  ];
  const rightNavItems = props?.rightNavItems || [
    {
      id: '1',
      text: "Resources",
      url: "#"
    },
    {
      id: '2',
      text: "Contact",
      url: "#"
    }
  ];

  return (
    <ContainerComponent 
      id="nav-split-container"
      padding="md" 
      background="none"
      className="flex items-center justify-between border-b"
    >
      <GridComponent 
        id="nav-split-left-grid"
        columns={leftNavItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {leftNavItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-left-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
          />
        ))}
      </GridComponent>
      <TextComponent 
        id="nav-split-logo"
        content={logoText} 
        variant="heading3" 
        className="font-bold mx-8" 
      />
      <GridComponent 
        id="nav-split-right-grid"
        columns={rightNavItems.length} 
        gap="md" 
        className="flex items-center space-x-6"
      >
        {rightNavItems.map((item: any, index: number) => (
          <ButtonComponent 
            id={`nav-right-item-${index + 1}`} 
            key={item.id || index}
            text={item.text} 
            variant="ghost" 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Export all navigation blocks
export const navigationBlocks = [
  {
    id: 'nav-minimal-logo-left',
    name: 'Minimal Navigation with Logo Left',
    description: 'A clean header layout featuring the logo on the left and compact horizontal navigation on the right; best for content-focused websites and blogs.',
    category: 'Navigation',
    component: NavigationMinimalLogoLeft,
  },
  {
    id: 'nav-centered-logo',
    name: 'Centered Navigation with Logo in Middle',
    description: 'Logo is centered between symmetrical navigation items; great for branding-focused or luxury product sites.',
    category: 'Navigation',
    component: NavigationCenteredLogo,
  },
  {
    id: 'nav-logo-cta',
    name: 'Navigation with Logo + CTA Button',
    description: 'Includes a right-aligned call-to-action button (e.g., "Sign Up"); optimized for marketing and SaaS landing pages.',
    category: 'Navigation',
    component: NavigationLogoCta,
  },
  {
    id: 'nav-social-links',
    name: 'Navigation with Social Links',
    description: 'Displays social media icons beside the navigation links; ideal for portfolio or community sites.',
    category: 'Navigation',
    component: NavigationSocialLinks,
  },
  {
    id: 'nav-sticky-transparent',
    name: 'Sticky Navigation with Transparent Background',
    description: 'A header that becomes solid on scroll; perfect for immersive hero designs.',
    category: 'Navigation',
    component: NavigationStickyTransparent,
  },
  {
    id: 'nav-split',
    name: 'Split Navigation (Logo Center, Nav Left & Right)',
    description: 'Balanced layout placing the logo at the center, with menus divided on both sides; ideal for corporate or agency sites.',
    category: 'Navigation',
    component: NavigationSplit,
  },
];