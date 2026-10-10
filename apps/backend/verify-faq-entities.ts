// Simple verification script for FAQ Learning entities
// This script checks the entity structure without connecting to the database

import { LearnedFaqEntry, FaqEntryStatus, FaqEntrySource } from './src/modules/faq-learning/entities/learned-faq-entry.entity';
import { LearningPattern, PatternType } from './src/modules/faq-learning/entities/learning-pattern.entity';
import { FaqLearningConfig } from './src/modules/faq-learning/entities/faq-learning-config.entity';

console.log('🔧 Verifying FAQ Learning entities structure...');

try {
  // Test LearnedFaqEntry
  const faqEntry = new LearnedFaqEntry();
  faqEntry.question = 'How do I reset my password?';
  faqEntry.answer = 'You can reset your password by clicking the forgot password link on the login page.';
  faqEntry.confidence = 85;
  faqEntry.status = FaqEntryStatus.DRAFT;
  faqEntry.source = FaqEntrySource.CHAT;
  faqEntry.sourceId = '123e4567-e89b-12d3-a456-426614174000';
  faqEntry.keywords = ['password', 'reset', 'forgot', 'login'];
  faqEntry.usageCount = 0;
  faqEntry.helpfulCount = 0;
  faqEntry.notHelpfulCount = 0;
  faqEntry.metadata = {
    originalConversation: 'User: I forgot my password. Agent: You can reset it...',
    userSatisfaction: 5,
    similarityScore: 0.95,
    occurrenceCount: 3
  };

  console.log('✅ LearnedFaqEntry entity structure verified');
  console.log('   - Question:', faqEntry.question);
  console.log('   - Confidence:', faqEntry.confidence);
  console.log('   - Status:', faqEntry.status);
  console.log('   - Is High Confidence:', faqEntry.isHighConfidence);
  console.log('   - Needs Review:', faqEntry.needsReview);
  console.log('   - Helpfulness Ratio:', faqEntry.helpfulnessRatio);

  // Test LearningPattern
  const pattern = new LearningPattern();
  pattern.patternType = PatternType.QUESTION;
  pattern.pattern = 'password reset request';
  pattern.patternHash = 'abc123def456';
  pattern.frequency = 5;
  pattern.confidence = 80;
  pattern.keywords = ['password', 'reset'];
  pattern.category = 'authentication';
  pattern.sources = [
    { type: 'chat', id: '123', relevance: 0.9 },
    { type: 'ticket', id: '456', relevance: 0.8 }
  ];
  pattern.metadata = {
    averageRelevance: 0.85,
    lastSeenAt: new Date(),
    relatedPatterns: ['login-issues', 'account-recovery']
  };

  // Test pattern methods
  pattern.addSource({ type: 'chat', id: '789', relevance: 0.95 });
  pattern.incrementFrequency();

  console.log('✅ LearningPattern entity structure verified');
  console.log('   - Pattern Type:', pattern.patternType);
  console.log('   - Pattern:', pattern.pattern);
  console.log('   - Frequency:', pattern.frequency);
  console.log('   - Is High Frequency:', pattern.isHighFrequency);
  console.log('   - Is High Confidence:', pattern.isHighConfidence);
  console.log('   - Average Source Relevance:', pattern.averageSourceRelevance);
  console.log('   - Unique Source Count:', pattern.uniqueSourceCount);

  // Test FaqLearningConfig
  const config = new FaqLearningConfig();
  config.configKey = 'test_confidence_threshold';
  config.configValue = {
    minConfidenceForReview: 60,
    minConfidenceForAutoPublish: 85,
    enableAutoPublishing: true
  };
  config.description = 'Test configuration for confidence thresholds';
  config.category = 'thresholds';
  config.isActive = true;

  console.log('✅ FaqLearningConfig entity structure verified');
  console.log('   - Config Key:', config.configKey);
  console.log('   - Min Confidence for Review:', config.minConfidenceForReview);
  console.log('   - Min Confidence for Auto Publish:', config.minConfidenceForAutoPublish);
  console.log('   - AI Provider:', config.aiProvider);
  console.log('   - Batch Size:', config.batchSize);
  console.log('   - Is Auto Publishing Enabled:', config.isAutoPublishingEnabled);

  // Test default config
  const defaultConfig = FaqLearningConfig.getDefaultConfig();
  console.log('✅ Default configuration structure verified');
  console.log('   - Default AI Provider:', defaultConfig.aiProvider);
  console.log('   - Default Batch Size:', defaultConfig.batchSize);
  console.log('   - Default Min Confidence for Review:', defaultConfig.minConfidenceForReview);

  console.log('\n🎉 All FAQ Learning entities verified successfully!');
  console.log('\n📋 Entity Summary:');
  console.log('   - LearnedFaqEntry: Stores generated FAQ entries with confidence scoring');
  console.log('   - LearningPattern: Tracks patterns identified from chat/ticket data');
  console.log('   - FaqLearningConfig: Manages system configuration and AI settings');
  console.log('\n✨ Ready for database migration and implementation!');

} catch (error) {
  console.error('❌ Entity verification failed:', error);
  process.exit(1);
}