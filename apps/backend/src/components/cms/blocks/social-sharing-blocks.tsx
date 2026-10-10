'use client';

import React from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';

// Social/Sharing Block 1: Social Links Row
export const SocialLinksRow: React.FC<{ props?: any }> = ({ props }) => {
  const socialLinks = props?.socialLinks || [
    { id: '1', text: "f", url: "#" },
    { id: '2', text: "t", url: "#" },
    { id: '3', text: "ig", url: "#" },
    { id: '4', text: "in", url: "#" },
    { id: '5', text: "yt", url: "#" },
    { id: '6', text: "p", url: "#" }
  ];

  return (
    <ContainerComponent 
      id="social-links-container"
      padding="md" 
      background="none"
    >
      <GridComponent 
        id="social-links-grid"
        columns={socialLinks.length} 
        gap="md" 
        className="justify-center space-x-4"
      >
        {socialLinks.map((link: any, index: number) => (
          <ButtonComponent 
            id={`social-links-${index}`} 
            key={link.id || index}
            text={link.text} 
            variant="outline" 
            className="w-10 h-10 rounded-full p-0" 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Social/Sharing Block 2: Social Share Buttons
export const SocialShareButtons: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Share this page:";
  const shareButtons = props?.shareButtons || [
    { id: '1', text: "Facebook", url: "#" },
    { id: '2', text: "Twitter", url: "#" },
    { id: '3', text: "LinkedIn", url: "#" },
    { id: '4', text: "Email", url: "#" }
  ];

  return (
    <ContainerComponent 
      id="social-share-container"
      padding="md" 
      background="none"
    >
      <TextComponent 
        id="social-share-title"
        content={title} 
        variant="body" 
        className="mb-3" 
      />
      <GridComponent 
        id="social-share-grid"
        columns={shareButtons.length} 
        gap="md" 
        className="space-x-2"
      >
        {shareButtons.map((button: any, index: number) => (
          <ButtonComponent 
            id={`social-share-${index}`} 
            key={button.id || index}
            text={button.text} 
            variant="outline" 
            size="sm" 
          />
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Social/Sharing Block 3: Facebook Post Embed
export const SocialFacebookEmbed: React.FC<{ props?: any }> = ({ props }) => {
  const companyName = props?.companyName || "Company Name";
  const companyHandle = props?.companyHandle || "@company";
  const content = props?.content || "Exciting news! We've just launched our new product feature that will revolutionize how you work. Check it out and let us know what you think!";
  const likes = props?.likes || "42 Likes";
  const comments = props?.comments || "8 Comments";

  return (
    <ContainerComponent 
      id="social-fb-container"
      padding="md" 
      background="none"
      className="flex justify-center"
    >
      <CardComponent 
        id="social-fb-card"
        padding="none" 
        rounded="lg" 
        shadow="md"
        className="w-full max-w-md"
      >
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
              f
            </div>
            <div>
              <TextComponent 
                id="social-fb-name"
                content={companyName} 
                variant="body" 
                className="font-medium" 
              />
              <TextComponent 
                id="social-fb-handle"
                content={companyHandle} 
                variant="body" 
                className="text-muted-foreground text-sm" 
              />
            </div>
          </div>
        </div>
        <div className="p-4">
          <TextComponent 
            id="social-fb-content"
            content={content} 
            variant="body" 
            className="mb-4" 
          />
          <div className="bg-muted rounded-lg h-48 flex items-center justify-center mb-4">
            <TextComponent 
              id="social-fb-image-placeholder"
              content="Post Image" 
              variant="body" 
              className="text-muted-foreground" 
            />
          </div>
          <div className="flex text-muted-foreground text-sm">
            <span className="mr-4">👍 {likes}</span>
            <span>💬 {comments}</span>
          </div>
        </div>
      </CardComponent>
    </ContainerComponent>
  );
};

// Social/Sharing Block 4: Instagram Grid Embed
export const SocialInstagramGrid: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Follow us on Instagram";
  const images = props?.images || [
    { id: '1', text: "IG 1", url: "#" },
    { id: '2', text: "IG 2", url: "#" },
    { id: '3', text: "IG 3", url: "#" },
    { id: '4', text: "IG 4", url: "#" },
    { id: '5', text: "IG 5", url: "#" },
    { id: '6', text: "IG 6", url: "#" },
    { id: '7', text: "IG 7", url: "#" },
    { id: '8', text: "IG 8", url: "#" },
    { id: '9', text: "IG 9", url: "#" }
  ];

  return (
    <ContainerComponent 
      id="social-ig-container"
      padding="md" 
      background="none"
    >
      <TextComponent 
        id="social-ig-title"
        content={title} 
        variant="heading3" 
        className="text-center mb-6" 
      />
      <GridComponent 
        id="social-ig-grid"
        columns={3} 
        gap="xs" 
      >
        {images.map((image: any, index: number) => (
          <div 
            key={image.id || index}
            className="aspect-square bg-gradient-to-r from-primary to-secondary flex items-center justify-center"
          >
            <TextComponent 
              id={`social-ig-image-${index + 1}`}
              content={image.text} 
              variant="body" 
              className="text-white" 
            />
          </div>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Social/Sharing Block 5: TikTok / YouTube Embed Block
export const SocialTiktokYoutubeEmbed: React.FC<{ props?: any }> = ({ props }) => {
  const title = props?.title || "Featured Video";
  const description = props?.description || "Check out our latest video content";
  const videoUrl = props?.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ";
  const videoTitle = props?.videoTitle || "How to Use Our Platform - Quick Tutorial";
  const videoDescription = props?.videoDescription || "Learn the basics of our platform in just 2 minutes with this quick tutorial.";
  const views = props?.views || "1.2K views";
  const date = props?.date || "3 days ago";

  return (
    <ContainerComponent 
      id="social-video-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <TextComponent 
        id="social-video-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-4" 
      />
      <TextComponent 
        id="social-video-desc"
        content={description} 
        variant="body" 
        className="text-center mb-8 text-muted-foreground" 
      />
      <CardComponent 
        id="social-video-card"
        padding="none" 
        rounded="lg" 
        shadow="md"
        className="max-w-3xl mx-auto"
      >
        <div className="relative pt-[56.25%]"> {/* 16:9 Aspect Ratio */}
          {videoUrl ? (
            <iframe
              src={videoUrl}
              className="absolute inset-0 w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={videoTitle}
            ></iframe>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-background/20 flex items-center justify-center">
                <TextComponent 
                  id="social-video-play-icon"
                  content="▶" 
                  variant="heading2" 
                  className="text-primary-foreground" 
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <TextComponent 
            id="social-video-video-title"
            content={videoTitle} 
            variant="heading3" 
            className="mb-2" 
          />
          <TextComponent 
            id="social-video-video-desc"
            content={videoDescription} 
            variant="body" 
            className="text-muted-foreground mb-4" 
          />
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="mr-4">👁️ {views}</span>
            <span>📅 {date}</span>
          </div>
        </div>
      </CardComponent>
    </ContainerComponent>
  );
};

// Export all social/sharing blocks
export const socialSharingBlocks = [
  {
    id: 'social-links-row',
    name: 'Social Links Row',
    description: 'Horizontal icon list for social profiles.',
    category: 'Social/Sharing',
    component: SocialLinksRow,
  },
  {
    id: 'social-share-buttons',
    name: 'Social Share Buttons',
    description: 'Inline sharing for Facebook, Twitter, LinkedIn, etc.',
    category: 'Social/Sharing',
    component: SocialShareButtons,
  },
  {
    id: 'social-facebook-embed',
    name: 'Facebook Post Embed',
    description: 'Embedded post for direct engagement.',
    category: 'Social/Sharing',
    component: SocialFacebookEmbed,
  },
  {
    id: 'social-instagram-grid',
    name: 'Instagram Grid Embed',
    description: 'Dynamic feed preview in a 3x3 grid.',
    category: 'Social/Sharing',
    component: SocialInstagramGrid,
  },
  {
    id: 'social-tiktok-youtube-embed',
    name: 'TikTok / YouTube Embed Block',
    description: 'For influencer or media-based landing pages.',
    category: 'Social/Sharing',
    component: SocialTiktokYoutubeEmbed,
  },
];