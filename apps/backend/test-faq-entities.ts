import 'reflect-metadata';
import { AppDataSource } from './src/database/data-source';
import { LearnedFaqEntry, FaqEntryStatus, FaqEntrySource } from './src/modules/faq-learning/entities/learned-faq-entry.entity';
import { LearningPattern, PatternType } from './src/modules/faq-learning/entities/learning-pattern.entity';
import { FaqLearningConfig } from './src/modules/faq-learning/entities/faq-learning-config.entity';

async function testFaqEntities() {
  try {
    console.log('🔧 Testing FAQ Learning entities...');
    
    // Initialize data source
    await AppDataSource.initialize();
    console.log('✅ Database connection successful!');
    
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      // Check if our new tables exist
      const learnedFaqTableExists = await queryRunner.hasTable('learned_faq_entries');
      const learningPatternsTableExists = await queryRunner.hasTable('learning_patterns');
      const faqConfigTableExists = await queryRunner.hasTable('faq_learning_config');
      
      console.log('📊 FAQ Learning table status:');
      console.log(`  - learned_faq_entries: ${learnedFaqTableExists ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - learning_patterns: ${learningPatternsTableExists ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - faq_learning_config: ${faqConfigTableExists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (learnedFaqTableExists && learningPatternsTableExists && faqConfigTableExists) {
        console.log('🎉 All FAQ Learning tables exist!');
        
        // Test entity creation (without saving to DB)
        const testFaqEntry = new LearnedFaqEntry();
        testFaqEntry.question = 'How do I reset my password?';
        testFaqEntry.answer = 'You can reset your password by clicking the forgot password link.';
        testFaqEntry.confidence = 85;
        testFaqEntry.status = FaqEntryStatus.DRAFT;
        testFaqEntry.source = FaqEntrySource.CHAT;
        testFaqEntry.sourceId = '123e4567-e89b-12d3-a456-426614174000';
        testFaqEntry.keywords = ['password', 'reset', 'forgot'];
        
        const testPattern = new LearningPattern();
        testPattern.patternType = PatternType.QUESTION;
        testPattern.pattern = 'password reset';
        testPattern.patternHash = 'abc123';
        testPattern.frequency = 5;
        testPattern.confidence = 80;
        
        const testConfig = new FaqLearningConfig();
        testConfig.configKey = 'test_config';
        testConfig.configValue = { testValue: true };
        testConfig.description = 'Test configuration';
        
        console.log('✅ Entity creation test successful!');
        console.log('📝 Test FAQ Entry:', {
          question: testFaqEntry.question,
          confidence: testFaqEntry.confidence,
          status: testFaqEntry.status,
          isHighConfidence: testFaqEntry.isHighConfidence
        });
        
        console.log('📝 Test Pattern:', {
          type: testPattern.patternType,
          pattern: testPattern.pattern,
          frequency: testPattern.frequency,
          isHighFrequency: testPattern.isHighFrequency
        });
        
      } else {
        console.log('⚠️  Some tables are missing. Run migrations first.');
      }
      
    } finally {
      await queryRunner.release();
    }
    
    await AppDataSource.destroy();
    console.log('🎉 FAQ Learning entities test completed successfully!');
    
  } catch (error) {
    console.error('❌ FAQ Learning entities test failed:', error);
    process.exit(1);
  }
}

testFaqEntities();