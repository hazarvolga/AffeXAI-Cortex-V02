// Block property configurations
export interface BlockPropertySchema {
  [key: string]: {
    type: 'text' | 'number' | 'boolean' | 'color' | 'select' | 'image' | 'list' | 'textarea';
    label: string;
    options?: string[]; // For select type
    defaultValue?: any;
    // For list type
    itemSchema?: {
      [subKey: string]: {
        type: 'text' | 'number' | 'boolean' | 'color' | 'select' | 'image' | 'textarea' | 'list';
        label: string;
        options?: string[];
        defaultValue?: any;
        // For nested list type
        itemSchema?: {
          [subKey: string]: {
            type: 'text' | 'number' | 'boolean' | 'color' | 'select' | 'image' | 'textarea' | 'list';
            label: string;
            options?: string[];
            defaultValue?: any;
            // For deeply nested list type
            itemSchema?: {
              [subKey: string]: {
                type: 'text' | 'number' | 'boolean' | 'color' | 'select' | 'image' | 'textarea';
                label: string;
                options?: string[];
                defaultValue?: any;
              };
            };
          };
        };
      };
    };
  };
}

// Navigation Blocks Config
export const navigationBlocksConfig: Record<string, BlockPropertySchema> = {
  'nav-minimal-logo-left': {
    logoText: { type: 'text', label: 'Logo Text', defaultValue: 'Company' },
    navItems: {
      type: 'list',
      label: 'Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Home' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    backgroundColor: { type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
    showBorder: { type: 'boolean', label: 'Show Border', defaultValue: true },
  },
  'nav-centered-logo': {
    logoText: { type: 'text', label: 'Logo Text', defaultValue: 'Company' },
    leftNavItems: {
      type: 'list',
      label: 'Left Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Home' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    rightNavItems: {
      type: 'list',
      label: 'Right Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Contact' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    backgroundColor: { type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
    showBorder: { type: 'boolean', label: 'Show Border', defaultValue: true },
  },
  'nav-logo-cta': {
    logoText: { type: 'text', label: 'Logo Text', defaultValue: 'Company' },
    navItems: {
      type: 'list',
      label: 'Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Home' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    ctaButtonText: { type: 'text', label: 'CTA Button Text', defaultValue: 'Sign Up' },
    backgroundColor: { type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
  },
  'nav-social-links': {
    logoText: { type: 'text', label: 'Logo Text', defaultValue: 'Company' },
    navItems: {
      type: 'list',
      label: 'Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Home' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    socialLinks: {
      type: 'list',
      label: 'Social Links',
      itemSchema: {
        text: { type: 'text', label: 'Icon Text', defaultValue: 'f' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    backgroundColor: { type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
    showSocialIcons: { type: 'boolean', label: 'Show Social Icons', defaultValue: true },
  },
  'nav-sticky-transparent': {
    logoText: { type: 'text', label: 'Logo Text', defaultValue: 'Company' },
    navItems: {
      type: 'list',
      label: 'Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Home' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    transparentBackground: { type: 'boolean', label: 'Transparent Background', defaultValue: true },
  },
  'nav-split': {
    logoText: { type: 'text', label: 'Logo Text', defaultValue: 'Company' },
    leftNavItems: {
      type: 'list',
      label: 'Left Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Products' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    rightNavItems: {
      type: 'list',
      label: 'Right Navigation Items',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Contact' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    backgroundColor: { type: 'color', label: 'Background Color', defaultValue: '#ffffff' },
    showBorder: { type: 'boolean', label: 'Show Border', defaultValue: true },
  },
};

// Hero Blocks Config
export const heroBlocksConfig: Record<string, BlockPropertySchema> = {
  'hero-centered-bg-image': {
    title: { type: 'text', label: 'Title', defaultValue: 'Welcome to Our Platform' },
    subtitle: { type: 'text', label: 'Subtitle', defaultValue: 'Discover amazing features and services that will transform your experience.' },
    primaryButtonText: { type: 'text', label: 'Primary Button Text', defaultValue: 'Get Started' },
    secondaryButtonText: { type: 'text', label: 'Secondary Button Text', defaultValue: 'Learn More' },
    backgroundImage: { type: 'image', label: 'Background Image' },
  },
  'hero-split-image-right': {
    title: { type: 'text', label: 'Title', defaultValue: 'Transform Your Business' },
    subtitle: { type: 'text', label: 'Subtitle', defaultValue: 'Our innovative solutions help you achieve more with less effort.' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Start Free Trial' },
    imageUrl: { type: 'image', label: 'Image URL' },
  },
  'hero-gradient-floating-cta': {
    title: { type: 'text', label: 'Title', defaultValue: 'Innovation Meets Excellence' },
    subtitle: { type: 'text', label: 'Subtitle', defaultValue: 'Join thousands of satisfied customers who have transformed their workflow.' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Get Started' },
  },
  'hero-video-background': {
    title: { type: 'text', label: 'Title', defaultValue: 'Experience the Future' },
    subtitle: { type: 'text', label: 'Subtitle', defaultValue: 'Immersive experiences that captivate and engage your audience.' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Watch Demo' },
  },
  'hero-fullscreen-sticky-cta': {
    title: { type: 'text', label: 'Title', defaultValue: 'Make Your Mark' },
    subtitle: { type: 'text', label: 'Subtitle', defaultValue: 'The ultimate platform for creators and innovators.' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Get Started Now' },
  },
  'hero-carousel-slides': {
    title: { type: 'text', label: 'Title', defaultValue: 'Featured Solutions' },
    subtitle: { type: 'text', label: 'Subtitle', defaultValue: 'Discover our most popular offerings' },
    items: {
      type: 'list',
      label: 'Carousel Items',
      itemSchema: {
        slideTitle: { type: 'text', label: 'Slide Title', defaultValue: 'Solution One' },
        slideDescription: { type: 'textarea', label: 'Slide Description', defaultValue: 'Brief description of this amazing solution.' },
        buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Learn More' },
      },
    },
  },
};

// Content Blocks Config
export const contentBlocksConfig: Record<string, BlockPropertySchema> = {
  'content-simple-block': {
    title: { type: 'text', label: 'Title', defaultValue: 'Important Information' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'This is a standard content block with a title and paragraph. It\'s perfect for displaying clean information without additional styling.' },
  },
  'content-boxed-block': {
    title: { type: 'text', label: 'Title', defaultValue: 'Featured Content' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'This boxed content block adds a bordered or shaded background to emphasize important information.' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Learn More' },
  },
  'content-image-side-by-side': {
    title: { type: 'text', label: 'Title', defaultValue: 'Product Explanation' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'This layout is perfect for product explanations or team introductions where you want to show a visual alongside descriptive text.' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'View Details' },
    imageUrl: { type: 'image', label: 'Image URL' },
  },
  'content-double-image-text': {
    title: { type: 'text', label: 'Title', defaultValue: 'Feature Comparison' },
    items: {
      type: 'list',
      label: 'Feature Items',
      itemSchema: {
        title: { type: 'text', label: 'Feature Title', defaultValue: 'Feature One' },
        content: { type: 'textarea', label: 'Feature Description', defaultValue: 'Detailed explanation of the first feature and its benefits.' },
        imageUrl: { type: 'image', label: 'Image URL' },
      },
    },
  },
  'content-triple-grid': {
    title: { type: 'text', label: 'Title', defaultValue: 'Key Benefits' },
    items: {
      type: 'list',
      label: 'Benefit Items',
      itemSchema: {
        title: { type: 'text', label: 'Benefit Title', defaultValue: 'Benefit One' },
        content: { type: 'textarea', label: 'Benefit Description', defaultValue: 'Description of the first key benefit that provides value to users.' },
        buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Learn More' },
      },
    },
  },
  'content-cta-box': {
    title: { type: 'text', label: 'Title', defaultValue: 'Ready to Get Started?' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'Join thousands of satisfied customers today and experience the difference.' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Sign Up Free' },
  },
  'content-image-stacked': {
    title: { type: 'text', label: 'Title', defaultValue: 'Visual Storytelling' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'This visual-first layout places the image above the supporting text, making it perfect for storytelling or showcasing products where the visual is the primary focus.' },
    imageUrl: { type: 'image', label: 'Image URL' },
  },
  'content-mini-box-cta': {
    title: { type: 'text', label: 'Title', defaultValue: 'Special Offer' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'Limited time discount for new customers!' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Claim Offer' },
  },
  'content-single-fullwidth': {
    title: { type: 'text', label: 'Title', defaultValue: 'Important Announcement' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'This is a focused message to communicate important information to your visitors.' },
  },
  'content-two-column': {
    title: { type: 'text', label: 'Title', defaultValue: 'Our Services' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'We provide comprehensive solutions tailored to your business needs. Our expert team delivers results that exceed expectations.' },
    ctaText: { type: 'text', label: 'CTA Button Text', defaultValue: 'Learn More' },
    image: { type: 'image', label: 'Image' },
  },
  'content-three-column-grid': {
    title: { type: 'text', label: 'Section Title', defaultValue: 'Our Features' },
    items: {
      type: 'list',
      label: 'Feature Items',
      itemSchema: {
        title: { type: 'text', label: 'Feature Title', defaultValue: 'Feature Name' },
        content: { type: 'textarea', label: 'Feature Description', defaultValue: 'Description of this feature.' },
        ctaText: { type: 'text', label: 'CTA Text', defaultValue: 'Learn More' },
      },
    },
  },
  'content-asymmetric-accent': {
    containerPadding: { type: 'select', label: 'Container Padding', options: ['none', 'sm', 'md', 'lg', 'xl', '2xl'], defaultValue: 'xl' },
    containerBackground: { type: 'select', label: 'Container Background', options: ['none', 'muted', 'primary', 'secondary'], defaultValue: 'none' },
    items: {
      type: 'list',
      label: 'Content Cards',
      itemSchema: {
        title: { type: 'text', label: 'Card Title', defaultValue: 'Card Title' },
        titleVariant: { type: 'select', label: 'Title Variant', options: ['heading1', 'heading2', 'heading3', 'body', 'caption'], defaultValue: 'heading3' },
        titleAlign: { type: 'select', label: 'Title Alignment', options: ['left', 'center', 'right'], defaultValue: 'left' },
        titleColor: { type: 'select', label: 'Title Color', options: ['primary', 'secondary', 'muted', 'success', 'warning', 'danger'], defaultValue: 'primary' },
        titleWeight: { type: 'select', label: 'Title Weight', options: ['normal', 'medium', 'bold'], defaultValue: 'bold' },
        content: { type: 'textarea', label: 'Card Content', defaultValue: 'Card description text.' },
        contentVariant: { type: 'select', label: 'Content Variant', options: ['heading1', 'heading2', 'heading3', 'body', 'caption'], defaultValue: 'body' },
        contentAlign: { type: 'select', label: 'Content Alignment', options: ['left', 'center', 'right'], defaultValue: 'left' },
        contentColor: { type: 'select', label: 'Content Color', options: ['primary', 'secondary', 'muted', 'success', 'warning', 'danger'], defaultValue: 'muted' },
        contentWeight: { type: 'select', label: 'Content Weight', options: ['normal', 'medium', 'bold'], defaultValue: 'normal' },
        hasBackground: { type: 'boolean', label: 'Has Background', defaultValue: false },
      },
    },
  },
};

// Element Blocks Config
export const elementBlocksConfig: Record<string, BlockPropertySchema> = {
  'element-spacer': {
    height: { type: 'select', label: 'Height', options: ['py-2', 'py-4', 'py-6', 'py-8', 'py-12', 'py-16', 'py-20'], defaultValue: 'py-12' },
  },
  'element-divider': {
    showBorder: { type: 'boolean', label: 'Show Border', defaultValue: true },
  },
  'element-title-subtitle': {
    title: { type: 'text', label: 'Title', defaultValue: 'Section Title' },
    titleVariant: { type: 'select', label: 'Title Variant', options: ['heading1', 'heading2', 'heading3', 'body', 'caption'], defaultValue: 'heading2' },
    titleAlign: { type: 'select', label: 'Title Alignment', options: ['left', 'center', 'right'], defaultValue: 'center' },
    titleColor: { type: 'select', label: 'Title Color', options: ['primary', 'secondary', 'muted', 'success', 'warning', 'danger'], defaultValue: 'primary' },
    titleWeight: { type: 'select', label: 'Title Weight', options: ['normal', 'medium', 'bold'], defaultValue: 'bold' },
    subtitle: { type: 'text', label: 'Subtitle', defaultValue: 'Brief supporting description for this section' },
    subtitleVariant: { type: 'select', label: 'Subtitle Variant', options: ['heading1', 'heading2', 'heading3', 'body', 'caption'], defaultValue: 'body' },
    subtitleAlign: { type: 'select', label: 'Subtitle Alignment', options: ['left', 'center', 'right'], defaultValue: 'center' },
    subtitleColor: { type: 'select', label: 'Subtitle Color', options: ['primary', 'secondary', 'muted', 'success', 'warning', 'danger'], defaultValue: 'muted' },
    subtitleWeight: { type: 'select', label: 'Subtitle Weight', options: ['normal', 'medium', 'bold'], defaultValue: 'normal' },
  },
  'element-title-button': {
    title: { type: 'text', label: 'Title', defaultValue: 'Featured Section' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Learn More' },
  },
  'element-quote-block': {
    quote: { type: 'textarea', label: 'Quote', defaultValue: '“The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle.”' },
    author: { type: 'text', label: 'Author', defaultValue: '— Steve Jobs' },
  },
  'element-media-image': {
    imageUrl: { type: 'image', label: 'Image URL' },
    caption: { type: 'text', label: 'Caption', defaultValue: 'Image caption or description' },
  },
  'element-button-group': {
    buttons: {
      type: 'list',
      label: 'Buttons',
      itemSchema: {
        text: { type: 'text', label: 'Button Text', defaultValue: 'Action' },
        variant: { type: 'select', label: 'Variant', options: ['default', 'outline', 'ghost', 'link'], defaultValue: 'default' },
      },
    },
  },
  'element-table-list': {
    title: { type: 'text', label: 'Title', defaultValue: 'Resource Links' },
    links: {
      type: 'list',
      label: 'Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Documentation' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
};

// Special Blocks Config
export const specialBlocksConfig: Record<string, BlockPropertySchema> = {
  'special-accordion-faq': {
    title: { type: 'text', label: 'Section Title', defaultValue: 'Frequently Asked Questions' },
    items: {
      type: 'list',
      label: 'FAQ Items',
      itemSchema: {
        question: { type: 'text', label: 'Question', defaultValue: 'Your question here' },
        answer: { type: 'textarea', label: 'Answer', defaultValue: 'Your answer here' },
      },
    },
  },
  'special-feature-trio': {
    title: { type: 'text', label: 'Section Title', defaultValue: 'Why Choose Us' },
    items: {
      type: 'list',
      label: 'Feature Items',
      itemSchema: {
        icon: { type: 'text', label: 'Icon (emoji or text)', defaultValue: '⚡' },
        title: { type: 'text', label: 'Feature Title', defaultValue: 'Feature Name' },
        content: { type: 'textarea', label: 'Feature Description', defaultValue: 'Description of this feature.' },
      },
    },
  },
};

// E-commerce Blocks Config
export const ecommerceBlocksConfig: Record<string, BlockPropertySchema> = {
  'ecommerce-two-product-grid': {
    title: { type: 'text', label: 'Section Title', defaultValue: 'Featured Products' },
    items: {
      type: 'list',
      label: 'Products',
      itemSchema: {
        image: { type: 'image', label: 'Product Image' },
        title: { type: 'text', label: 'Product Title', defaultValue: 'Product Name' },
        description: { type: 'textarea', label: 'Product Description', defaultValue: 'Product description.' },
        price: { type: 'text', label: 'Price', defaultValue: '$99.99' },
        ctaText: { type: 'text', label: 'CTA Text', defaultValue: 'Add to Cart' },
      },
    },
  },
  'ecommerce-three-product-grid': {
    title: { type: 'text', label: 'Section Title', defaultValue: 'Featured Products' },
    items: {
      type: 'list',
      label: 'Products',
      itemSchema: {
        image: { type: 'image', label: 'Product Image' },
        title: { type: 'text', label: 'Product Title', defaultValue: 'Product Name' },
        description: { type: 'textarea', label: 'Product Description', defaultValue: 'Product description.' },
        price: { type: 'text', label: 'Price', defaultValue: '$99.99' },
        ctaText: { type: 'text', label: 'CTA Text', defaultValue: 'Add to Cart' },
      },
    },
  },
};

// Gallery Blocks Config
export const galleryBlocksConfig: Record<string, BlockPropertySchema> = {
  'gallery-three-image-grid': {
    title: { type: 'text', label: 'Section Title', defaultValue: 'Featured Highlights' },
    items: {
      type: 'list',
      label: 'Gallery Items',
      itemSchema: {
        image: { type: 'image', label: 'Image' },
        title: { type: 'text', label: 'Title', defaultValue: 'Image Title' },
      },
    },
  },
  'gallery-four-image-mosaic': {
    title: { type: 'text', label: 'Section Title', defaultValue: 'Our Portfolio' },
    items: {
      type: 'list',
      label: 'Gallery Items',
      itemSchema: {
        image: { type: 'image', label: 'Image' },
        title: { type: 'text', label: 'Title', defaultValue: 'Project Name' },
        description: { type: 'textarea', label: 'Description', defaultValue: 'Project description.' },
      },
    },
  },
};

// Footer Blocks Config
export const footerBlocksConfig: Record<string, BlockPropertySchema> = {
  'footer-basic': {
    companyName: { type: 'text', label: 'Company Name', defaultValue: 'Company Name' },
    companyDescription: { type: 'textarea', label: 'Company Description', defaultValue: 'Building amazing products for amazing people.' },
    links: {
      type: 'list',
      label: 'Link Sections',
      itemSchema: {
        title: { type: 'text', label: 'Section Title', defaultValue: 'Links' },
        items: {
          type: 'list',
          label: 'Links',
          itemSchema: {
            text: { type: 'text', label: 'Link Text', defaultValue: 'Home' },
            url: { type: 'text', label: 'Link URL', defaultValue: '#' },
          },
        },
      },
    },
    contactInfo: {
      type: 'list',
      label: 'Contact Information',
      itemSchema: {
        title: { type: 'text', label: 'Section Title', defaultValue: 'Contact' },
        email: { type: 'text', label: 'Email', defaultValue: 'info@company.com' },
        phone: { type: 'text', label: 'Phone', defaultValue: '+1 (555) 123-4567' },
      },
    },
    copyrightText: { type: 'text', label: 'Copyright Text', defaultValue: '© 2023 Company Name. All rights reserved.' },
  },
  'footer-multi-column': {
    companyName: { type: 'text', label: 'Company Name', defaultValue: 'Company Name' },
    companyDescription: { type: 'textarea', label: 'Company Description', defaultValue: 'Creating innovative solutions for modern businesses.' },
    socialLinks: {
      type: 'list',
      label: 'Social Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'FB' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    columns: {
      type: 'list',
      label: 'Columns',
      itemSchema: {
        title: { type: 'text', label: 'Column Title', defaultValue: 'Products' },
        items: {
          type: 'list',
          label: 'Column Items',
          itemSchema: {
            text: { type: 'text', label: 'Item Text', defaultValue: 'Features' },
            url: { type: 'text', label: 'Item URL', defaultValue: '#' },
          },
        },
      },
    },
    copyrightText: { type: 'text', label: 'Copyright Text', defaultValue: '© 2023 Company Name. All rights reserved.' },
    legalLinks: {
      type: 'list',
      label: 'Legal Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Privacy Policy' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
  'footer-newsletter-signup': {
    newsletterTitle: { type: 'text', label: 'Newsletter Title', defaultValue: 'Subscribe to our newsletter' },
    newsletterDescription: { type: 'text', label: 'Newsletter Description', defaultValue: 'Stay updated with our latest news and offers.' },
    copyrightText: { type: 'text', label: 'Copyright Text', defaultValue: '© 2023 Company Name. All rights reserved.' },
    legalLinks: {
      type: 'list',
      label: 'Legal Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Privacy' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    socialLinks: {
      type: 'list',
      label: 'Social Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'f' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
  'footer-social-heavy': {
    companyName: { type: 'text', label: 'Company Name', defaultValue: 'Company Name' },
    companyDescription: { type: 'textarea', label: 'Company Description', defaultValue: 'Connect with us on social media for updates and community.' },
    socialTitle: { type: 'text', label: 'Social Title', defaultValue: 'Follow Us' },
    socialPlatforms: {
      type: 'list',
      label: 'Social Platforms',
      itemSchema: {
        text: { type: 'text', label: 'Platform Name', defaultValue: 'Facebook' },
        url: { type: 'text', label: 'Platform URL', defaultValue: '#' },
      },
    },
    copyrightText: { type: 'text', label: 'Copyright Text', defaultValue: '© 2023 Company Name. All rights reserved.' },
    legalLinks: {
      type: 'list',
      label: 'Legal Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Privacy' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
  'footer-compact-centered': {
    companyName: { type: 'text', label: 'Company Name', defaultValue: 'Company Name' },
    links: {
      type: 'list',
      label: 'Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Home' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    copyrightText: { type: 'text', label: 'Copyright Text', defaultValue: '© 2023 Company Name. All rights reserved.' },
  },
  'footer-extended-cta': {
    ctaTitle: { type: 'text', label: 'CTA Title', defaultValue: 'Ready to get started?' },
    ctaDescription: { type: 'textarea', label: 'CTA Description', defaultValue: 'Join thousands of satisfied customers today.' },
    ctaButtonText: { type: 'text', label: 'CTA Button Text', defaultValue: 'Start Free Trial' },
    companyName: { type: 'text', label: 'Company Name', defaultValue: 'Company Name' },
    companyDescription: { type: 'textarea', label: 'Company Description', defaultValue: 'Creating innovative solutions for modern businesses.' },
    columns: {
      type: 'list',
      label: 'Columns',
      itemSchema: {
        title: { type: 'text', label: 'Column Title', defaultValue: 'Products' },
        items: {
          type: 'list',
          label: 'Column Items',
          itemSchema: {
            text: { type: 'text', label: 'Item Text', defaultValue: 'Features' },
            url: { type: 'text', label: 'Item URL', defaultValue: '#' },
          },
        },
      },
    },
    copyrightText: { type: 'text', label: 'Copyright Text', defaultValue: '© 2023 Company Name. All rights reserved.' },
    legalLinks: {
      type: 'list',
      label: 'Legal Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Privacy Policy' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
    socialLinks: {
      type: 'list',
      label: 'Social Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'f' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
};

// Blog/RSS Blocks Config
export const blogRssBlocksConfig: Record<string, BlockPropertySchema> = {
  'blog-extended-feature': {
    category: { type: 'text', label: 'Category', defaultValue: 'Technology' },
    date: { type: 'text', label: 'Date', defaultValue: 'October 5, 2023' },
    title: { type: 'text', label: 'Title', defaultValue: 'The Future of Web Development: Trends to Watch in 2023' },
    excerpt: { type: 'textarea', label: 'Excerpt', defaultValue: 'Explore the latest trends shaping the web development landscape, from AI-powered tools to progressive web apps and beyond.' },
    authorName: { type: 'text', label: 'Author Name', defaultValue: 'John Doe' },
    authorInitials: { type: 'text', label: 'Author Initials', defaultValue: 'JD' },
    imageUrl: { type: 'image', label: 'Image URL' },
  },
  'blog-basic-list': {
    title: { type: 'text', label: 'Title', defaultValue: 'Latest Articles' },
    posts: {
      type: 'list',
      label: 'Posts',
      itemSchema: {
        title: { type: 'text', label: 'Post Title', defaultValue: 'Blog Post Title 1' },
        excerpt: { type: 'textarea', label: 'Post Excerpt', defaultValue: 'Brief excerpt of the blog post content to entice readers to click through...' },
        date: { type: 'text', label: 'Post Date', defaultValue: 'October 5, 2023' },
        imageUrl: { type: 'image', label: 'Image URL' },
      },
    },
  },
  'blog-double-post-highlight': {
    title: { type: 'text', label: 'Title', defaultValue: 'Featured Stories' },
    posts: {
      type: 'list',
      label: 'Posts',
      itemSchema: {
        title: { type: 'text', label: 'Post Title', defaultValue: 'Innovative Design Techniques' },
        excerpt: { type: 'textarea', label: 'Post Excerpt', defaultValue: 'Discover cutting-edge design techniques that are revolutionizing the industry.' },
        buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Read More' },
        imageUrl: { type: 'image', label: 'Image URL' },
      },
    },
  },
  'blog-mini-highlight': {
    title: { type: 'text', label: 'Title', defaultValue: 'Latest from the Blog' },
    posts: {
      type: 'list',
      label: 'Posts',
      itemSchema: {
        title: { type: 'text', label: 'Post Title', defaultValue: 'Quick Insight #1' },
        date: { type: 'text', label: 'Post Date', defaultValue: 'Oct 5' },
      },
    },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'View All Posts' },
  },
  'blog-author-bio-left': {
    authorName: { type: 'text', label: 'Author Name', defaultValue: 'Jane Doe' },
    authorTitle: { type: 'text', label: 'Author Title', defaultValue: 'Senior Content Writer' },
    authorBio: { type: 'textarea', label: 'Author Bio', defaultValue: 'Jane is a seasoned content creator with over 10 years of experience in digital marketing and brand storytelling. She specializes in creating engaging content that drives results.' },
    authorInitials: { type: 'text', label: 'Author Initials', defaultValue: 'JD' },
    socialLinks: {
      type: 'list',
      label: 'Social Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Twitter' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
  'blog-author-bio-centered': {
    authorName: { type: 'text', label: 'Author Name', defaultValue: 'Jane Doe' },
    authorTitle: { type: 'text', label: 'Author Title', defaultValue: 'Senior Content Writer' },
    authorBio: { type: 'textarea', label: 'Author Bio', defaultValue: 'Jane is a seasoned content creator with over 10 years of experience in digital marketing and brand storytelling. She specializes in creating engaging content that drives results.' },
    authorInitials: { type: 'text', label: 'Author Initials', defaultValue: 'JD' },
    socialLinks: {
      type: 'list',
      label: 'Social Links',
      itemSchema: {
        text: { type: 'text', label: 'Link Text', defaultValue: 'Twitter' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
  'blog-rss-featured-article': {
    source: { type: 'text', label: 'Source', defaultValue: 'RSS FEED' },
    date: { type: 'text', label: 'Date', defaultValue: 'October 5, 2023' },
    title: { type: 'text', label: 'Title', defaultValue: 'Industry Insights: The Rise of AI in Content Creation' },
    excerpt: { type: 'textarea', label: 'Excerpt', defaultValue: 'Exploring how artificial intelligence is transforming the landscape of content creation and what it means for creators and businesses.' },
    author: { type: 'text', label: 'Author', defaultValue: 'By Industry Watch Team' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Read Full Article' },
  },
  'blog-rss-list': {
    source: { type: 'text', label: 'Source', defaultValue: 'RSS FEED' },
    title: { type: 'text', label: 'Title', defaultValue: 'Latest Industry News' },
    buttonText: { type: 'text', label: 'Button Text', defaultValue: 'Refresh' },
    items: {
      type: 'list',
      label: 'Items',
      itemSchema: {
        headline: { type: 'text', label: 'Headline', defaultValue: 'Industry News Headline 1: Brief summary of the news item' },
        source: { type: 'text', label: 'Source', defaultValue: 'Industry Source' },
        time: { type: 'text', label: 'Time', defaultValue: '2 hours ago' },
      },
    },
  },
};

// Social Sharing Blocks Config
export const socialSharingBlocksConfig: Record<string, BlockPropertySchema> = {
  'social-links-row': {
    socialLinks: {
      type: 'list',
      label: 'Social Links',
      itemSchema: {
        text: { type: 'text', label: 'Icon Text', defaultValue: 'f' },
        url: { type: 'text', label: 'Link URL', defaultValue: '#' },
      },
    },
  },
  'social-share-buttons': {
    title: { type: 'text', label: 'Title', defaultValue: 'Share this page:' },
    shareButtons: {
      type: 'list',
      label: 'Share Buttons',
      itemSchema: {
        text: { type: 'text', label: 'Button Text', defaultValue: 'Facebook' },
        url: { type: 'text', label: 'Button URL', defaultValue: '#' },
      },
    },
  },
  'social-facebook-embed': {
    companyName: { type: 'text', label: 'Company Name', defaultValue: 'Company Name' },
    companyHandle: { type: 'text', label: 'Company Handle', defaultValue: '@company' },
    content: { type: 'textarea', label: 'Content', defaultValue: 'Exciting news! We\'ve just launched our new product feature that will revolutionize how you work. Check it out and let us know what you think!' },
    likes: { type: 'text', label: 'Likes', defaultValue: '42 Likes' },
    comments: { type: 'text', label: 'Comments', defaultValue: '8 Comments' },
  },
  'social-instagram-grid': {
    title: { type: 'text', label: 'Title', defaultValue: 'Follow us on Instagram' },
    images: {
      type: 'list',
      label: 'Images',
      itemSchema: {
        text: { type: 'text', label: 'Image Text', defaultValue: 'IG 1' },
        url: { type: 'text', label: 'Image URL', defaultValue: '#' },
      },
    },
  },
  'social-tiktok-youtube-embed': {
    title: { type: 'text', label: 'Title', defaultValue: 'Featured Video' },
    description: { type: 'text', label: 'Description', defaultValue: 'Check out our latest video content' },
    videoUrl: { type: 'text', label: 'Video URL', defaultValue: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    videoTitle: { type: 'text', label: 'Video Title', defaultValue: 'How to Use Our Platform - Quick Tutorial' },
    videoDescription: { type: 'textarea', label: 'Video Description', defaultValue: 'Learn the basics of our platform in just 2 minutes with this quick tutorial.' },
    views: { type: 'text', label: 'Views', defaultValue: '1.2K views' },
    date: { type: 'text', label: 'Date', defaultValue: '3 days ago' },
  },
};

// All block configurations
export const allBlockConfigs: Record<string, BlockPropertySchema> = {
  ...navigationBlocksConfig,
  ...heroBlocksConfig,
  ...contentBlocksConfig,
  ...elementBlocksConfig,
  ...specialBlocksConfig,
  ...ecommerceBlocksConfig,
  ...galleryBlocksConfig,
  ...footerBlocksConfig,
  ...blogRssBlocksConfig,
  ...socialSharingBlocksConfig,
};