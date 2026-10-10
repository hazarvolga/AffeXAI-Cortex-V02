import * as cheerio from 'cheerio';
import { ContentParser } from './ContentParser';
import {
  ParsedContent,
  ContentSection,
} from './types';

/**
 * EventPageParser - Parser for event/webinar pages
 * Extracts event details, schedule, speakers, and registration
 */
export class EventPageParser extends ContentParser {
  /**
   * Parse event page content
   */
  parseEventPage(htmlContent: string, filename: string): ParsedContent {
    const $ = cheerio.load(htmlContent);
    
    // Get base parsed content
    const baseContent = this.parse(htmlContent, filename);
    
    // Extract structured sections
    const sections: ContentSection[] = [];
    
    // 1. Event Hero
    const heroSection = this.extractEventHero($);
    if (heroSection) {
      sections.push(heroSection);
    }
    
    // 2. Event Details
    const detailsSection = this.extractEventDetails($);
    if (detailsSection) {
      sections.push(detailsSection);
    }
    
    // 3. Schedule/Agenda
    const scheduleSection = this.extractSchedule($);
    if (scheduleSection) {
      sections.push(scheduleSection);
    }
    
    // 4. Speakers
    const speakersSection = this.extractSpeakers($);
    if (speakersSection) {
      sections.push(speakersSection);
    }
    
    // 5. Registration CTA
    const ctaSection = this.extractCTA($);
    if (ctaSection) {
      sections.push(ctaSection);
    }
    
    return {
      ...baseContent,
      sections,
    };
  }
  
  /**
   * Extract event hero section
   */
  private extractEventHero($: cheerio.CheerioAPI): ContentSection | null {
    const title = $('h1').first().text().trim();
    const subtitle = $('h2, p').first().text().trim();
    const image = $('img').first().attr('src') || '';
    
    if (!title) return null;
    
    return {
      type: 'hero',
      order: 0,
      content: {
        blockType: 'event-hero',
        title,
        subtitle,
        image,
      },
    };
  }
  
  /**
   * Extract event details (date, time, location)
   */
  private extractEventDetails($: cheerio.CheerioAPI): ContentSection | null {
    const text = $.root().text();
    
    // Extract date patterns
    const dateMatch = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i);
    const date = dateMatch ? dateMatch[0] : '';
    
    // Extract time patterns
    const timeMatch = text.match(/\d{1,2}:\d{2}\s*(?:AM|PM)?/i);
    const time = timeMatch ? timeMatch[0] : '';
    
    // Extract location
    let location = '';
    const locationKeywords = ['location:', 'venue:', 'where:', 'online', 'webinar'];
    for (const keyword of locationKeywords) {
      const index = text.toLowerCase().indexOf(keyword);
      if (index !== -1) {
        location = text.substring(index, Math.min(text.length, index + 100)).trim();
        break;
      }
    }
    
    if (!date && !time && !location) return null;
    
    return {
      type: 'text',
      order: 1,
      content: {
        blockType: 'event-details',
        date,
        time,
        location,
      },
    };
  }
  
  /**
   * Extract schedule/agenda
   */
  private extractSchedule($: cheerio.CheerioAPI): ContentSection | null {
    const scheduleItems: any[] = [];
    
    // Look for time-based items
    $('li, tr').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      // Check if contains time
      if (/\d{1,2}:\d{2}/.test(text)) {
        scheduleItems.push({
          text,
        });
      }
    });
    
    if (scheduleItems.length === 0) return null;
    
    return {
      type: 'text',
      order: 2,
      content: {
        blockType: 'event-schedule',
        items: scheduleItems,
      },
    };
  }
  
  /**
   * Extract speakers
   */
  private extractSpeakers($: cheerio.CheerioAPI): ContentSection | null {
    const speakers: any[] = [];
    
    // Look for speaker information
    $('h3, h4').each((_, el) => {
      const $el = $(el);
      const name = $el.text().trim();
      
      if (name.length > 3 && name.length < 50) {
        const $bio = $el.next('p');
        const bio = $bio.text().trim();
        
        const $image = $el.prevAll('img').first();
        const image = $image.attr('src') || '';
        
        if (bio || image) {
          speakers.push({
            name,
            bio,
            image,
          });
        }
      }
    });
    
    if (speakers.length === 0) return null;
    
    return {
      type: 'text',
      order: 3,
      content: {
        blockType: 'speakers-section',
        speakers,
      },
    };
  }
  
  /**
   * Extract registration CTA
   */
  private extractCTA($: cheerio.CheerioAPI): ContentSection | null {
    const buttons: any[] = [];
    
    $('a, button').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const href = $el.attr('href') || '';
      
      // Look for registration-related text
      const isRegistration = /register|sign up|rsvp|join|attend/i.test(text);
      
      if (isRegistration && text.length > 3 && text.length < 50) {
        buttons.push({
          text,
          href,
        });
      }
    });
    
    if (buttons.length === 0) return null;
    
    return {
      type: 'cta',
      order: 10,
      content: {
        blockType: 'event-registration',
        title: 'Register for this event',
        buttons,
      },
    };
  }
}
