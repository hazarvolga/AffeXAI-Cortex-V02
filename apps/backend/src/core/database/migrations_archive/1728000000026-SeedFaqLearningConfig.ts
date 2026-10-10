import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFaqLearningConfig1728000000026 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert default configuration values
    await queryRunner.query(`
      INSERT INTO faq_learning_config (
        "configKey", 
        "configValue", 
        "description", 
        "category",
        "isActive"
      ) VALUES 
      (
        'confidence_thresholds',
        '{"minConfidenceForReview": 60, "minConfidenceForAutoPublish": 85}',
        'Minimum confidence scores for review and auto-publishing',
        'thresholds',
        true
      ),
      (
        'pattern_recognition',
        '{"minPatternFrequency": 3, "similarityThreshold": 0.8}',
        'Pattern recognition parameters for identifying FAQ candidates',
        'recognition',
        true
      ),
      (
        'data_processing',
        '{"batchSize": 100, "processingInterval": 3600}',
        'Batch processing configuration for learning pipeline',
        'processing',
        true
      ),
      (
        'quality_filters',
        '{"minQuestionLength": 10, "maxQuestionLength": 500, "minAnswerLength": 20}',
        'Quality filters for question and answer validation',
        'quality',
        true
      ),
      (
        'source_preferences',
        '{"chatSessionMinDuration": 300, "ticketMinResolutionTime": 1800, "requiredSatisfactionScore": 4}',
        'Preferences for learning from different data sources',
        'sources',
        true
      ),
      (
        'categorization',
        '{"excludedCategories": [], "autoCategorizationEnabled": true}',
        'Category management and auto-categorization settings',
        'categories',
        true
      ),
      (
        'ai_model_settings',
        '{"aiProvider": "openai", "modelName": "gpt-4", "temperature": 0.7, "maxTokens": 1000}',
        'AI model configuration for FAQ generation',
        'ai',
        true
      ),
      (
        'provider_settings',
        '{
          "openai": {
            "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
            "defaultModel": "gpt-4"
          },
          "anthropic": {
            "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
            "defaultModel": "claude-3-sonnet"
          },
          "google": {
            "models": ["gemini-pro", "gemini-pro-vision", "gemini-1.5-pro"],
            "defaultModel": "gemini-pro"
          },
          "openrouter": {
            "models": ["meta-llama/llama-2-70b-chat", "anthropic/claude-2", "openai/gpt-4"],
            "defaultModel": "openai/gpt-4"
          }
        }',
        'Provider-specific model configurations',
        'providers',
        true
      ),
      (
        'advanced_settings',
        '{
          "enableRealTimeProcessing": false,
          "enableAutoPublishing": false,
          "maxDailyProcessingLimit": 1000,
          "retentionPeriodDays": 365
        }',
        'Advanced system settings and limits',
        'advanced',
        true
      ),
      (
        'system_status',
        '{
          "isLearningEnabled": true,
          "lastProcessingRun": null,
          "totalFaqsGenerated": 0,
          "totalPatternsIdentified": 0
        }',
        'System status and statistics',
        'status',
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all seeded configuration data
    await queryRunner.query(`
      DELETE FROM faq_learning_config 
      WHERE "configKey" IN (
        'confidence_thresholds',
        'pattern_recognition',
        'data_processing',
        'quality_filters',
        'source_preferences',
        'categorization',
        'ai_model_settings',
        'provider_settings',
        'advanced_settings',
        'system_status'
      )
    `);
  }
}