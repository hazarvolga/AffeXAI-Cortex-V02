import { AppDataSource } from './src/database/data-source';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection successful!');
    
    // Check if knowledge base tables exist
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      const categoriesTableExists = await queryRunner.hasTable('knowledge_base_categories');
      const articlesTableExists = await queryRunner.hasTable('knowledge_base_articles');
      
      console.log('📊 Table status:');
      console.log(`  - knowledge_base_categories: ${categoriesTableExists ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - knowledge_base_articles: ${articlesTableExists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (!categoriesTableExists || !articlesTableExists) {
        console.log('🔧 Creating missing tables...');
        
        if (!categoriesTableExists) {
          await queryRunner.query(`
            CREATE TABLE knowledge_base_categories (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(255) NOT NULL,
              description TEXT,
              slug VARCHAR(255) UNIQUE NOT NULL,
              color VARCHAR(50) DEFAULT 'blue',
              icon VARCHAR(50) DEFAULT 'folder',
              "sortOrder" INTEGER DEFAULT 0,
              "isActive" BOOLEAN DEFAULT true,
              "parentId" UUID,
              "articleCount" INTEGER DEFAULT 0,
              "createdBy" UUID NOT NULL,
              "updatedBy" UUID NOT NULL,
              "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              "deletedAt" TIMESTAMP WITH TIME ZONE,
              
              CONSTRAINT fk_kb_categories_parent FOREIGN KEY ("parentId") REFERENCES knowledge_base_categories(id) ON DELETE SET NULL,
              CONSTRAINT fk_kb_categories_created_by FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE RESTRICT,
              CONSTRAINT fk_kb_categories_updated_by FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE RESTRICT
            );
          `);
          console.log('✅ Created knowledge_base_categories table');
        }
        
        if (!articlesTableExists) {
          await queryRunner.query(`
            CREATE TABLE knowledge_base_articles (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              title VARCHAR(500) NOT NULL,
              content TEXT NOT NULL,
              summary TEXT,
              slug VARCHAR(500) UNIQUE NOT NULL,
              "categoryId" UUID,
              "authorId" UUID NOT NULL,
              tags TEXT,
              "isPublished" BOOLEAN DEFAULT false,
              "isFeatured" BOOLEAN DEFAULT false,
              "viewCount" INTEGER DEFAULT 0,
              "helpfulCount" INTEGER DEFAULT 0,
              "notHelpfulCount" INTEGER DEFAULT 0,
              "searchScore" INTEGER DEFAULT 0,
              "relatedArticleIds" TEXT,
              metadata JSONB,
              status VARCHAR(50) DEFAULT 'draft',
              "publishedAt" TIMESTAMP WITH TIME ZONE,
              "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              
              CONSTRAINT fk_kb_articles_category FOREIGN KEY ("categoryId") REFERENCES knowledge_base_categories(id) ON DELETE SET NULL,
              CONSTRAINT fk_kb_articles_author FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE RESTRICT
            );
          `);
          console.log('✅ Created knowledge_base_articles table');
        }
        
        // Create indexes
        console.log('🔧 Creating indexes...');
        await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS idx_kb_categories_slug ON knowledge_base_categories(slug);
          CREATE INDEX IF NOT EXISTS idx_kb_categories_parent ON knowledge_base_categories("parentId");
          CREATE INDEX IF NOT EXISTS idx_kb_categories_active ON knowledge_base_categories("isActive");
          CREATE INDEX IF NOT EXISTS idx_kb_categories_sort ON knowledge_base_categories("sortOrder");
          CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON knowledge_base_articles(slug);
          CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles("categoryId");
          CREATE INDEX IF NOT EXISTS idx_kb_articles_author ON knowledge_base_articles("authorId");
          CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON knowledge_base_articles("isPublished");
        `);
        console.log('✅ Created indexes');
      }
      
    } finally {
      await queryRunner.release();
    }
    
    await AppDataSource.destroy();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();