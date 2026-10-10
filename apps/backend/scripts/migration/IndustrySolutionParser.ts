import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import {
  IndustrySolutionContent,
  HeroSection,
  WorkflowTabsSection,
  WorkflowTab,
  WorkflowSubTab,
  FeaturesSection,
  Feature,
  StatsSection,
  Stat,
  CTASection,
  ButtonConfig,
} from './types';

/**
 * IndustrySolutionParser extends ContentParser for Industry Solution pages
 * Extracts hero, workflow tabs, features, stats, and CTA sections
 */
export class IndustrySolutionParser extends ContentParser {
  /**
   * Parse Industry Solution page content
   * @param htmlContent - Raw HTML content
   * @param filename - Source filename
   * @returns Parsed Industry Solution content
   */
  parseIndustrySolution(htmlContent: string, filename: string): IndustrySolutionContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract hero section
    const hero = this.extractHeroSection($);
    
    // Extract workflow tabs
    const workflowTabs = this.extractWorkflowTabs($);
    
    // Extract features
    const features = this.extractFeaturesSection($);
    
    // Extract stats
    const stats = this.extractStatsSection($);
    
    // Extract CTA
    const cta = this.extractCTASection($);
    
    return {
      ...baseContent,
      hero,
      workflowTabs,
      features,
      stats,
      cta,
    };
  }
  
  /**
   * Extract hero section (title, subtitle, description, CTAs)
   */
  private extractHeroSection($: cheerio.CheerioAPI): HeroSection {
    // Get first 3 h2 elements as hero content
    const h2Elements = $('h2').slice(0, 3);
    
    const title = h2Elements.eq(0).text().trim() || 'Untitled';
    const subtitle = h2Elements.eq(1).text().trim() || '';
    const description = h2Elements.eq(2).text().trim() || '';
    
    // Find primary button (first link in hero area)
    const firstLink = $('a').first();
    const primaryButton: ButtonConfig | undefined = firstLink.length > 0 ? {
      text: firstLink.text().trim(),
      url: firstLink.attr('href') || '#',
      variant: 'primary',
    } : undefined;
    
    // Find background image (first image)
    const firstImage = $('img').first();
    const backgroundImage = firstImage.attr('src') || undefined;
    
    return {
      title,
      subtitle,
      description,
      primaryButton,
      backgroundImage,
    };
  }
  
  /**
   * Extract workflow tabs structure
   */
  private extractWorkflowTabs($: cheerio.CheerioAPI): WorkflowTabsSection | undefined {
    const tabLists = $('ul[role="tablist"]');
    
    if (tabLists.length === 0) {
      return undefined;
    }
    
    // Find the main workflow tabs section (usually has a title before it)
    const mainTabs: WorkflowTab[] = [];
    
    // Process each tab list
    tabLists.each((tabListIndex, tabListEl) => {
      const $tabList = $(tabListEl);
      const tabs = $tabList.find('li[role="tab"]');
      
      if (tabs.length > 0) {
        // This is a main tab or sub-tab list
        const isMainTab = tabListIndex === 0; // First tab list is main tabs
        
        if (isMainTab) {
          // Process main tabs
          tabs.each((tabIndex, tabEl) => {
            const $tab = $(tabEl);
            const id = $tab.attr('id') || `tab-${tabIndex}`;
            const label = $tab.text().trim();
            
            mainTabs.push({
              id,
              label,
              icon: '', // Icons would need to be extracted from images
              subTabs: [],
            });
          });
        } else {
          // Process sub-tabs (associate with the last main tab)
          if (mainTabs.length > 0) {
            const currentMainTab = mainTabs[mainTabs.length - 1];
            
            tabs.each((tabIndex, tabEl) => {
              const $tab = $(tabEl);
              const id = $tab.attr('id') || `subtab-${tabIndex}`;
              const label = $tab.text().trim();
              
              // Find associated content (next section or paragraph)
              const tabContent = $tab.closest('section').find('p, img').first();
              const description = tabContent.is('p') ? tabContent.text().trim() : '';
              const mediaUrl = tabContent.is('img') ? tabContent.attr('src') : undefined;
              
              currentMainTab.subTabs.push({
                id,
                label,
                icon: '',
                title: label,
                description,
                mediaType: mediaUrl ? 'image' : 'none',
                mediaUrl,
              });
            });
          }
        }
      }
    });
    
    if (mainTabs.length === 0) {
      return undefined;
    }
    
    return {
      title: 'Workflow',
      subtitle: '',
      description: '',
      mainTabs,
    };
  }
  
  /**
   * Extract features with icons (figure + h3 + p pattern)
   */
  private extractFeaturesSection($: cheerio.CheerioAPI): FeaturesSection {
    const features: Feature[] = [];
    
    // Find all figure elements
    $('figure').each((_, figure) => {
      const $figure = $(figure);
      const img = $figure.find('img').attr('src');
      
      // Look for h3 after the figure
      let $next = $figure.next();
      
      // Skip non-h3 elements
      while ($next.length > 0 && !$next.is('h3')) {
        $next = $next.next();
      }
      
      if ($next.is('h3')) {
        const title = $next.text().trim();
        const $description = $next.next('p');
        const description = $description.text().trim();
        
        if (img && title) {
          features.push({
            icon: img,
            title,
            description,
          });
        }
      }
    });
    
    return {
      title: 'Features',
      subtitle: '',
      features,
    };
  }
  
  /**
   * Extract statistics (percentage values)
   */
  private extractStatsSection($: cheerio.CheerioAPI): StatsSection | undefined {
    const stats: Stat[] = [];
    const seenValues = new Set<string>();
    
    // Find direct text nodes or specific elements containing percentage values
    // Look for patterns like: <div>50%</div> or <p>50%</p>
    $('div, p, span').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      // Only match if the element's direct text is mostly just the percentage
      // This avoids matching parent elements that contain child percentages
      const percentMatch = text.match(/^(\d+)%/);
      if (percentMatch && text.length < 100) {
        const value = percentMatch[1] + '%';
        
        // Avoid duplicates
        if (seenValues.has(value)) {
          return;
        }
        seenValues.add(value);
        
        // Get the next sibling or parent's next sibling for label/description
        let $next = $el.next();
        const label = $next.text().trim() || '';
        
        stats.push({
          value,
          label,
          description: '',
        });
      }
    });
    
    if (stats.length === 0) {
      return undefined;
    }
    
    return { stats };
  }
  
  /**
   * Extract CTA section
   */
  private extractCTASection($: cheerio.CheerioAPI): CTASection {
    // Find the last section with links
    const links = $('a');
    const lastLinks = links.slice(-2); // Get last 2 links as potential CTAs
    
    const buttons: ButtonConfig[] = [];
    lastLinks.each((index, link) => {
      const $link = $(link);
      const text = $link.text().trim();
      const url = $link.attr('href') || '#';
      
      if (text && text.length > 0 && text.length < 100) {
        buttons.push({
          text,
          url,
          variant: index === 0 ? 'primary' : 'secondary',
        });
      }
    });
    
    return {
      title: 'Ready to get started?',
      description: '',
      primaryButton: buttons[0],
      secondaryButton: buttons[1],
    };
  }
}
