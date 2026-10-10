import { V2ContentText, V2ContentSplit, V2FeatureGrid, V2StatsGrid, V2Testimonials, V2Pricing, V2Faq, V2Gallery, V2LogoCloud, V2Newsletter, V2ContactForm, V2TeamGrid } from './v2';

export const contentBlocks = [
    { id: 'content-text', name: 'Text Content', component: V2ContentText },
    { id: 'content-split', name: 'Split Content', component: V2ContentSplit },
    { id: 'feature-grid', name: 'Features', component: V2FeatureGrid },
    { id: 'stats-grid', name: 'Statistics', component: V2StatsGrid },
    { id: 'testimonials', name: 'Testimonials', component: V2Testimonials },
    { id: 'pricing', name: 'Pricing', component: V2Pricing },
    { id: 'faq', name: 'FAQ', component: V2Faq },
    { id: 'gallery', name: 'Gallery', component: V2Gallery },
    { id: 'logo-cloud', name: 'Logo Cloud', component: V2LogoCloud },
    { id: 'newsletter', name: 'Newsletter', component: V2Newsletter },
    { id: 'contact-form', name: 'Contact Form', component: V2ContactForm },
    { id: 'team-grid', name: 'Team Grid', component: V2TeamGrid },
];
