'use client';

import React from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';
import { ImageComponent } from '@/components/cms/image-component';

// E-commerce Block 1: Single Product Layout
export const EcommerceSingleProduct: React.FC = () => {
  return (
    <ContainerComponent 
      id="ecommerce-single-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <GridComponent 
        id="ecommerce-single-grid"
        columns={2} 
        gap="xl" 
        className="items-center"
      >
        <div className="flex justify-center">
          <CardComponent 
            id="ecommerce-single-card"
            padding="lg" 
            rounded="lg" 
            shadow="md"
          >
            <ImageComponent 
              id="ecommerce-single-image"
              src="/placeholder-image.jpg" 
              alt="Product" 
              className="rounded-md" 
            />
          </CardComponent>
        </div>
        <div>
          <TextComponent 
            id="ecommerce-single-category"
            content="Electronics" 
            variant="body" 
            className="text-primary font-medium mb-2" 
          />
          <TextComponent 
            id="ecommerce-single-title"
            content="Premium Wireless Headphones" 
            variant="heading2" 
            className="mb-4" 
          />
          <TextComponent 
            id="ecommerce-single-desc"
            content="Experience crystal-clear sound with our premium wireless headphones. Featuring noise cancellation, 30-hour battery life, and comfortable over-ear design." 
            variant="body" 
            className="mb-6 text-muted-foreground" 
          />
          <TextComponent 
            id="ecommerce-single-price"
            content="$199.99" 
            variant="heading3" 
            className="mb-6" 
          />
          <GridComponent 
            id="ecommerce-single-btn-grid"
            columns={2} 
            gap="md" 
            className="mb-6"
          >
            <select className="border rounded-md px-3 py-2">
              <option>Quantity: 1</option>
              <option>Quantity: 2</option>
              <option>Quantity: 3</option>
            </select>
            <ButtonComponent 
              id="ecommerce-single-cart-btn"
              text="Add to Cart" 
              variant="default" 
            />
          </GridComponent>
          <ButtonComponent 
            id="ecommerce-single-buy-btn"
            text="Buy Now" 
            variant="outline" 
            className="w-full" 
          />
        </div>
      </GridComponent>
    </ContainerComponent>
  );
};

// E-commerce Block 2: Aligned Product Layout
export const EcommerceAlignedProduct: React.FC = () => {
  return (
    <ContainerComponent 
      id="ecommerce-aligned-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <GridComponent 
        id="ecommerce-aligned-grid"
        columns={2} 
        gap="xl" 
      >
        <div>
          <TextComponent 
            id="ecommerce-aligned-title"
            content="Smart Watch Series 5" 
            variant="heading2" 
            className="mb-4" 
          />
          <TextComponent 
            id="ecommerce-aligned-desc"
            content="The latest in wearable technology with health monitoring, GPS tracking, and 7-day battery life." 
            variant="body" 
            className="mb-6 text-muted-foreground" 
          />
          <TextComponent 
            id="ecommerce-aligned-price"
            content="$299.99" 
            variant="heading3" 
            className="mb-6" 
          />
          <GridComponent 
            id="ecommerce-aligned-features-grid"
            columns={1} 
            gap="sm" 
            className="mb-6"
          >
            <TextComponent 
              id="ecommerce-aligned-feature-1"
              content="✓ Heart rate monitoring" 
              variant="body" 
            />
            <TextComponent 
              id="ecommerce-aligned-feature-2"
              content="✓ Water resistant up to 50m" 
              variant="body" 
            />
            <TextComponent 
              id="ecommerce-aligned-feature-3"
              content="✓ 7-day battery life" 
              variant="body" 
            />
          </GridComponent>
          <ButtonComponent 
            id="ecommerce-aligned-btn"
            text="Shop Now" 
            variant="default" 
          />
        </div>
        <div className="flex justify-center">
          <ImageComponent 
            id="ecommerce-aligned-image"
            src="/placeholder-image.jpg" 
            alt="Smart Watch" 
            className="rounded-lg shadow-lg" 
          />
        </div>
      </GridComponent>
    </ContainerComponent>
  );
};

// E-commerce Block 3: Two-Product Grid
export const EcommerceTwoProductGrid: React.FC<{ props?: any }> = ({ props }) => {
  // Use props or fallback to default values
  const title = props?.title || "Featured Products";
  const items = props?.items || [
    {
      image: "/placeholder-image.jpg",
      title: "Premium Headphones",
      description: "High-quality wireless headphones with noise cancellation.",
      price: "$199.99",
      ctaText: "Add to Cart",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Smart Watch",
      description: "Feature-rich smartwatch with health monitoring.",
      price: "$299.99",
      ctaText: "Add to Cart",
    },
  ];

  return (
    <ContainerComponent 
      id="ecommerce-two-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <TextComponent 
        id="ecommerce-two-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="ecommerce-two-grid"
        columns={2} 
        gap="xl" 
      >
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`ecommerce-two-card-${index + 1}`}
            key={index}
            padding="lg" 
            rounded="lg" 
            shadow="md"
          >
            <ImageComponent 
              id={`ecommerce-two-image-${index + 1}`}
              src={item.image} 
              alt={item.title} 
              className="rounded-md mb-4" 
            />
            <TextComponent 
              id={`ecommerce-two-card-${index + 1}-title`}
              content={item.title} 
              variant="heading3" 
              className="mb-2" 
            />
            <TextComponent 
              id={`ecommerce-two-card-${index + 1}-desc`}
              content={item.description} 
              variant="body" 
              className="mb-4 text-muted-foreground" 
            />
            <TextComponent 
              id={`ecommerce-two-card-${index + 1}-price`}
              content={item.price} 
              variant="heading3" 
              className="mb-4" 
            />
            <ButtonComponent 
              id={`ecommerce-two-card-${index + 1}-btn`}
              text={item.ctaText} 
              variant="default" 
              className="w-full" 
            />
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// E-commerce Block 4: Three-Product Grid
export const EcommerceThreeProductGrid: React.FC<{ props?: any }> = ({ props }) => {
  // Use props or fallback to default values
  const title = props?.title || "Featured Products";
  const items = props?.items || [
    {
      image: "/placeholder-image.jpg",
      title: "Premium Headphones",
      description: "High-quality wireless headphones with noise cancellation.",
      price: "$199.99",
      ctaText: "Add to Cart",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Smart Watch",
      description: "Feature-rich smartwatch with health monitoring.",
      price: "$299.99",
      ctaText: "Add to Cart",
    },
    {
      image: "/placeholder-image.jpg",
      title: "Wireless Speaker",
      description: "Portable speaker with 360-degree sound.",
      price: "$149.99",
      ctaText: "Add to Cart",
    },
  ];

  return (
    <ContainerComponent 
      id="ecommerce-three-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <TextComponent 
        id="ecommerce-three-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="ecommerce-three-grid"
        columns={3} 
        gap="xl" 
      >
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`ecommerce-three-card-${index + 1}`}
            key={index}
            padding="lg" 
            rounded="lg" 
            shadow="md"
          >
            <ImageComponent 
              id={`ecommerce-three-image-${index + 1}`}
              src={item.image} 
              alt={item.title} 
              className="rounded-md mb-4" 
            />
            <TextComponent 
              id={`ecommerce-three-card-${index + 1}-title`}
              content={item.title} 
              variant="heading3" 
              className="mb-2" 
            />
            <TextComponent 
              id={`ecommerce-three-card-${index + 1}-desc`}
              content={item.description} 
              variant="body" 
              className="mb-4 text-muted-foreground" 
            />
            <TextComponent 
              id={`ecommerce-three-card-${index + 1}-price`}
              content={item.price} 
              variant="heading3" 
              className="mb-4" 
            />
            <ButtonComponent 
              id={`ecommerce-three-card-${index + 1}-btn`}
              text={item.ctaText} 
              variant="default" 
              className="w-full" 
            />
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// E-commerce Block 5: Three-Product Showcase
export const EcommerceThreeProductShowcase: React.FC = () => {
  return (
    <ContainerComponent 
      id="ecommerce-three-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <TextComponent 
        id="ecommerce-three-title"
        content="Popular Items" 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="ecommerce-three-grid"
        columns={3} 
        gap="xl" 
      >
        <CardComponent 
          id="ecommerce-three-card-1"
          padding="lg" 
          rounded="lg" 
          shadow="md"
          className="text-center"
        >
          <ImageComponent 
            id="ecommerce-three-image-1"
            src="/placeholder-image.jpg" 
            alt="Product 1" 
            className="rounded-md mx-auto mb-4" 
          />
          <TextComponent 
            id="ecommerce-three-card-1-title"
            content="Smartphone X" 
            variant="heading3" 
            className="mb-2" 
          />
          <TextComponent 
            id="ecommerce-three-card-1-desc"
            content="Latest model with advanced features" 
            variant="body" 
            className="mb-4 text-muted-foreground" 
          />
          <TextComponent 
            id="ecommerce-three-card-1-price"
            content="$699.99" 
            variant="body" 
            className="font-medium mb-4" 
          />
          <ButtonComponent 
            id="ecommerce-three-card-1-btn"
            text="View Details" 
            variant="outline" 
            size="sm" 
          />
        </CardComponent>
        
        <CardComponent 
          id="ecommerce-three-card-2"
          padding="lg" 
          rounded="lg" 
          shadow="md"
          className="text-center"
        >
          <ImageComponent 
            id="ecommerce-three-image-2"
            src="/placeholder-image.jpg" 
            alt="Product 2" 
            className="rounded-md mx-auto mb-4" 
          />
          <TextComponent 
            id="ecommerce-three-card-2-title"
            content="Tablet Pro" 
            variant="heading3" 
            className="mb-2" 
          />
          <TextComponent 
            id="ecommerce-three-card-2-desc"
            content="Powerful tablet for work and play" 
            variant="body" 
            className="mb-4 text-muted-foreground" 
          />
          <TextComponent 
            id="ecommerce-three-card-2-price"
            content="$499.99" 
            variant="body" 
            className="font-medium mb-4" 
          />
          <ButtonComponent 
            id="ecommerce-three-card-2-btn"
            text="View Details" 
            variant="outline" 
            size="sm" 
          />
        </CardComponent>
        
        <CardComponent 
          id="ecommerce-three-card-3"
          padding="lg" 
          rounded="lg" 
          shadow="md"
          className="text-center"
        >
          <ImageComponent 
            id="ecommerce-three-image-3"
            src="/placeholder-image.jpg" 
            alt="Product 3" 
            className="rounded-md mx-auto mb-4" 
          />
          <TextComponent 
            id="ecommerce-three-card-3-title"
            content="Laptop Ultra" 
            variant="heading3" 
            className="mb-2" 
          />
          <TextComponent 
            id="ecommerce-three-card-3-desc"
            content="Lightweight laptop with long battery" 
            variant="body" 
            className="mb-4 text-muted-foreground" 
          />
          <TextComponent 
            id="ecommerce-three-card-3-price"
            content="$1,199.99" 
            variant="body" 
            className="font-medium mb-4" 
          />
          <ButtonComponent 
            id="ecommerce-three-card-3-btn"
            text="View Details" 
            variant="outline" 
            size="sm" 
          />
        </CardComponent>
      </GridComponent>
    </ContainerComponent>
  );
};

// E-commerce Block 6: Discount Banner Block
export const EcommerceDiscountBanner: React.FC = () => {
  return (
    <ContainerComponent 
      id="ecommerce-discount-container"
      padding="xl" 
      background="none"
      className="py-16 relative overflow-hidden rounded-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-90"></div>
      <div className="relative z-10 text-center text-white">
        <TextComponent 
          id="ecommerce-discount-badge"
          content="SALE" 
          variant="body" 
          className="inline-block bg-destructive text-white px-4 py-1 rounded-full mb-4" 
        />
        <TextComponent 
          id="ecommerce-discount-title"
          content="Summer Sale - Up to 50% Off" 
          variant="heading1" 
          className="mb-4" 
        />
        <TextComponent 
          id="ecommerce-discount-desc"
          content="Limited time offer on selected items. Don't miss out!" 
          variant="body" 
          className="mb-8 max-w-2xl mx-auto text-white/80" 
        />
        <ButtonComponent 
          id="ecommerce-discount-btn"
          text="Shop Now" 
          variant="default" 
          size="lg" 
          className="bg-white text-primary hover:bg-white/90" 
        />
      </div>
    </ContainerComponent>
  );
};

// E-commerce Block 7: Horizontal Discount Block
export const EcommerceHorizontalDiscount: React.FC = () => {
  return (
    <ContainerComponent 
      id="ecommerce-horizontal-container"
      padding="none" 
      background="none"
      className="relative rounded-lg overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      <GridComponent 
        id="ecommerce-horizontal-grid"
        columns={2} 
        gap="none" 
      >
        <div className="relative z-10 p-12 text-white">
          <TextComponent 
            id="ecommerce-horizontal-badge"
            content="EXCLUSIVE DEAL" 
            variant="body" 
            className="inline-block bg-white text-primary px-4 py-1 rounded-full mb-4" 
          />
          <TextComponent 
            id="ecommerce-horizontal-title"
            content="Flash Sale" 
            variant="heading2" 
            className="mb-4" 
          />
          <TextComponent 
            id="ecommerce-horizontal-desc"
            content="24 hours only - Save big on our bestsellers" 
            variant="body" 
            className="mb-6 text-white/80" 
          />
          <ButtonComponent 
            id="ecommerce-horizontal-btn"
            text="Shop the Sale" 
            variant="default" 
            className="bg-white text-primary hover:bg-white/90" 
          />
        </div>
        <div className="relative z-10 flex items-center justify-center p-12">
          <TextComponent 
            id="ecommerce-horizontal-discount"
            content="50% OFF" 
            variant="heading1" 
            className="text-white font-bold text-6xl" 
          />
        </div>
      </GridComponent>
    </ContainerComponent>
  );
};

// Export all e-commerce blocks
export const ecommerceBlocks = [
  {
    id: 'ecommerce-single-product',
    name: 'Single Product Layout',
    description: 'Showcases one product with image, price, and CTA.',
    category: 'E-commerce',
    component: EcommerceSingleProduct,
  },
  {
    id: 'ecommerce-aligned-product',
    name: 'Aligned Product Layout',
    description: 'Single product aligned to one side with descriptive text.',
    category: 'E-commerce',
    component: EcommerceAlignedProduct,
  },
  {
    id: 'ecommerce-two-product-grid',
    name: 'Two-Product Grid',
    description: 'Balanced grid for comparing or cross-promoting products.',
    category: 'E-commerce',
    component: EcommerceTwoProductGrid,
  },
  {
    id: 'ecommerce-three-product-grid',
    name: 'Three-Product Grid',
    description: 'Displays three related products; ideal for small catalogs.',
    category: 'E-commerce',
    component: EcommerceThreeProductGrid,
  },
  {
    id: 'ecommerce-discount-banner',
    name: 'Discount Banner Block',
    description: 'Promotional area with percentage badge and CTA.',
    category: 'E-commerce',
    component: EcommerceDiscountBanner,
  },
  {
    id: 'ecommerce-horizontal-discount',
    name: 'Horizontal Discount Block',
    description: 'Wide layout with background image; good for homepage sales banners.',
    category: 'E-commerce',
    component: EcommerceHorizontalDiscount,
  },
];