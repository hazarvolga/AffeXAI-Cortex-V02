#!/usr/bin/env node

/**
 * WordPress to CMS Migration Script
 * 
 * Migrates content from WordPress XML export to Payload CMS
 * - 398 images already in MinIO
 * - 150 YouTube videos
 * - Relative path strategy for media
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const axios = require('axios');

// Configuration
const CONFIG = {
  wordpressXmlPath: process.env.WP_XML_PATH || './wordpress-export.xml',
  cmsApiUrl: process.env.CMS_API_URL || 'http://localhost:3001/api',
  cmsApiKey: process.env.CMS_API_KEY || '',
  minioBaseUrl: '/media', // Relative path strategy
  dryRun: process.env.DRY_RUN === 'true',
  batchSize: 10,
  logFile: './logs/migration.log'
};

// Logger
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.ensureLogDir();
  }

  ensureLogDir() {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
    
    console.log(`[${timestamp}] ${level}: ${message}`);
    if (data) console.log(data);
  }

  info(message, data) { this.log('INFO', message, data); }
  error(message, data) { this.log('ERROR', message, data); }
  success(message, data) { this.log('SUCCESS', message, data); }
  warn(message, data) { this.log('WARN', message, data); }
}

const logger = new Logger(CONFIG.logFile);

// WordPress XML Parser
class WordPressParser {
  async parse(xmlPath) {
    logger.info(`Parsing WordPress XML: ${xmlPath}`);
    
    const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);
    
    return this.extractPosts(result);
  }

  extractPosts(xmlData) {
    const channel = xmlData.rss?.channel?.[0];
    if (!channel) {
      throw new Error('Invalid WordPress XML structure');
    }

    const items = channel.item || [];
    const posts = [];

    for (const item of items) {
      const postType = this.getField(item, 'wp:post_type');
      
      // Only process posts and pages
      if (postType !== 'post' && postType !== 'page') continue;
      
      const status = this.getField(item, 'wp:status');
      if (status !== 'publish') continue;

      posts.push({
        title: this.getField(item, 'title'),
        slug: this.getField(item, 'wp:post_name'),
        content: this.getField(item, 'content:encoded'),
        excerpt: this.getField(item, 'excerpt:encoded'),
        publishedAt: this.getField(item, 'wp:post_date'),
        author: this.getField(item, 'dc:creator'),
        categories: this.getCategories(item),
        tags: this.getTags(item),
        featuredImage: this.getFeaturedImage(item),
        type: postType
      });
    }

    logger.success(`Extracted ${posts.length} posts from WordPress`);
    return posts;
  }

  getField(item, fieldName) {
    const parts = fieldName.split(':');
    if (parts.length === 2) {
      const [namespace, field] = parts;
      return item[`${namespace}:${field}`]?.[0] || '';
    }
    return item[fieldName]?.[0] || '';
  }

  getCategories(item) {
    const categories = item.category || [];
    return categories
      .filter(cat => cat.$.domain === 'category')
      .map(cat => cat.$.nicename);
  }

  getTags(item) {
    const categories = item.category || [];
    return categories
      .filter(cat => cat.$.domain === 'post_tag')
      .map(cat => cat.$.nicename);
  }

  getFeaturedImage(item) {
    const postmeta = item['wp:postmeta'] || [];
    const thumbnailMeta = postmeta.find(
      meta => meta['wp:meta_key']?.[0] === '_thumbnail_id'
    );
    return thumbnailMeta?.['wp:meta_value']?.[0] || null;
  }
}

// Media Processor
class MediaProcessor {
  constructor(minioBaseUrl) {
    this.minioBaseUrl = minioBaseUrl;
    this.imageMap = new Map();
    this.videoMap = new Map();
  }

  processContent(content) {
    if (!content) return content;

    // Replace WordPress image URLs with MinIO URLs
    content = this.replaceImageUrls(content);
    
    // Replace YouTube embeds
    content = this.replaceYouTubeEmbeds(content);
    
    return content;
  }

  replaceImageUrls(content) {
    // Match WordPress image URLs
    const wpImageRegex = /https?:\/\/[^\/]+\/wp-content\/uploads\/(\d{4}\/\d{2}\/[^"'\s]+)/g;
    
    return content.replace(wpImageRegex, (match, imagePath) => {
      // Convert to MinIO relative path
      const fileName = path.basename(imagePath);
      return `${this.minioBaseUrl}/${fileName}`;
    });
  }

  replaceYouTubeEmbeds(content) {
    // Match various YouTube embed formats
    const patterns = [
      /https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
      /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/g,
      /<iframe[^>]+src="https?:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)"[^>]*><\/iframe>/g
    ];

    let processed = content;
    
    for (const pattern of patterns) {
      processed = processed.replace(pattern, (match, videoId) => {
        return `https://www.youtube.com/embed/${videoId}`;
      });
    }

    return processed;
  }

  extractMediaFromContent(content) {
    const media = {
      images: [],
      videos: []
    };

    if (!content) return media;

    // Extract image URLs
    const imageRegex = /src="([^"]+\.(jpg|jpeg|png|gif|webp))"/gi;
    let match;
    while ((match = imageRegex.exec(content)) !== null) {
      media.images.push(match[1]);
    }

    // Extract YouTube video IDs
    const youtubeRegex = /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/g;
    while ((match = youtubeRegex.exec(content)) !== null) {
      media.videos.push(match[1]);
    }

    return media;
  }
}

// CMS API Client
class CMSClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.axios = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });
  }

  async createPost(postData) {
    try {
      const response = await this.axios.post('/posts', postData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  async createPage(pageData) {
    try {
      const response = await this.axios.post('/pages', pageData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  async uploadMedia(mediaData) {
    try {
      const response = await this.axios.post('/media', mediaData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }
}

// Migration Manager
class MigrationManager {
  constructor(config) {
    this.config = config;
    this.parser = new WordPressParser();
    this.mediaProcessor = new MediaProcessor(config.minioBaseUrl);
    this.cmsClient = new CMSClient(config.cmsApiUrl, config.cmsApiKey);
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }

  async run() {
    logger.info('Starting WordPress to CMS migration...');
    logger.info('Configuration:', this.config);

    try {
      // Parse WordPress XML
      const posts = await this.parser.parse(this.config.wordpressXmlPath);
      this.stats.total = posts.length;

      // Process in batches
      for (let i = 0; i < posts.length; i += this.config.batchSize) {
        const batch = posts.slice(i, i + this.config.batchSize);
        await this.processBatch(batch, i);
      }

      this.printSummary();
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  async processBatch(posts, startIndex) {
    logger.info(`Processing batch ${startIndex / this.config.batchSize + 1}`);

    for (const post of posts) {
      await this.migratePost(post);
    }
  }

  async migratePost(post) {
    logger.info(`Migrating: ${post.title}`);

    try {
      // Process content (replace media URLs)
      const processedContent = this.mediaProcessor.processContent(post.content);
      const processedExcerpt = this.mediaProcessor.processContent(post.excerpt);

      // Extract media info for logging
      const media = this.mediaProcessor.extractMediaFromContent(processedContent);
      logger.info(`  - Images: ${media.images.length}, Videos: ${media.videos.length}`);

      // Prepare CMS data
      const cmsData = {
        title: post.title,
        slug: post.slug,
        content: processedContent,
        excerpt: processedExcerpt,
        publishedAt: post.publishedAt,
        author: post.author,
        categories: post.categories,
        tags: post.tags,
        status: 'published'
      };

      // Dry run check
      if (this.config.dryRun) {
        logger.info('  [DRY RUN] Would create:', { title: post.title, slug: post.slug });
        this.stats.success++;
        return;
      }

      // Create in CMS
      const result = post.type === 'page'
        ? await this.cmsClient.createPage(cmsData)
        : await this.cmsClient.createPost(cmsData);

      if (result.success) {
        logger.success(`  ✓ Migrated: ${post.title}`);
        this.stats.success++;
      } else {
        logger.error(`  ✗ Failed: ${post.title}`, result.error);
        this.stats.failed++;
      }
    } catch (error) {
      logger.error(`  ✗ Error migrating ${post.title}:`, error);
      this.stats.failed++;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total posts:     ${this.stats.total}`);
    console.log(`✓ Success:       ${this.stats.success}`);
    console.log(`✗ Failed:        ${this.stats.failed}`);
    console.log(`⊘ Skipped:       ${this.stats.skipped}`);
    console.log('='.repeat(60));
    console.log(`Log file: ${this.config.logFile}`);
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  try {
    const manager = new MigrationManager(CONFIG);
    await manager.run();
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationManager, WordPressParser, MediaProcessor, CMSClient };
