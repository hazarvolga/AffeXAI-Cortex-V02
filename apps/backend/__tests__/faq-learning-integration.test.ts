/**
 * FAQ Learning Settings Integration Tests
 * Tests the complete backend-frontend integration for FAQ learning settings
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FaqLearningController } from '../src/modules/faq-learning/controllers/faq-learning.controller';
import { FaqLearningService } from '../src/modules/faq-learning/services/faq-learning.service';
import { FaqLearningConfig } from '../src/modules/faq-learning/entities/faq-learning-config.entity';
import { FaqAiService } from '../src/modules/faq-learning/services/faq-ai.service';

describe('FAQ Learning Settings Integration', () => {
  let app: INestApplication;
  let configRepository: Repository<FaqLearningConfig>;
  let faqLearningService: FaqLearningService;
  let faqAiService: FaqAiService;

  const mockConfigRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockFaqAiService = {
    getProviderStatus: jest.fn().mockResolvedValue({
      provider: 'openai',
      model: 'gpt-4',
      available: true,
      responseTime: 1200
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaqLearningController],
      providers: [
        FaqLearningService,
        {
          provide: getRepositoryToken(FaqLearningConfig),
          useValue: mockConfigRepository,
        },
        {
          provide: FaqAiService,
          useValue: mockFaqAiService,
        },
        // Mock other dependencies
        {
          provide: 'ChatDataExtractorService',
          useValue: { extract: jest.fn() },
        },
        {
          provide: 'TicketDataExtractorService',
          useValue: { extract: jest.fn() },
        },
        {
          provide: 'DataNormalizerService',
          useValue: { normalize: jest.fn() },
        },
        {
          provide: 'PatternRecognitionService',
          useValue: { identifyPatterns: jest.fn() },
        },
        {
          provide: 'ConfidenceCalculatorService',
          useValue: { calculateConfidence: jest.fn() },
        },
        {
          provide: 'BatchProcessorService',
          useValue: { process: jest.fn() },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    configRepository = module.get<Repository<FaqLearningConfig>>(
      getRepositoryToken(FaqLearningConfig)
    );
    faqLearningService = module.get<FaqLearningService>(FaqLearningService);
    faqAiService = module.get<FaqAiService>(FaqAiService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('Configuration API Integration', () => {
    describe('GET /faq-learning/config', () => {
      it('should return all configuration settings with proper structure', async () => {
        const response = await request(app.getHttpServer())
          .get('/faq-learning/config')
          .expect(200);

        expect(response.body).toHaveProperty('configurations');
        expect(Array.isArray(response.body.configurations)).toBe(true);

        // Verify all required categories are present
        const configs = response.body.configurations;
        const categories = [...new Set(configs.map((c: any) => c.category))];
        
        expect(categories).toContain('thresholds');
        expect(categories).toContain('processing');
        expect(categories).toContain('quality');
        expect(categories).toContain('sources');
        expect(categories).toContain('ai');
        expect(categories).toContain('advanced');

        // Verify configuration structure
        configs.forEach((config: any) => {
          expect(config).toHaveProperty('key');
          expect(config).toHaveProperty('value');
          expect(config).toHaveProperty('description');
          expect(config).toHaveProperty('category');
          expect(config).toHaveProperty('type');
          expect(config).toHaveProperty('isActive');
          expect(config).toHaveProperty('updatedAt');
        });
      });

      it('should include proper validation metadata for each setting', async () => {
        const response = await request(app.getHttpServer())
          .get('/faq-learning/config')
          .expect(200);

        const configs = response.body.configurations;
        
        // Check specific settings have proper validation
        const minConfidenceConfig = configs.find((c: any) => c.key === 'minConfidenceForReview');
        expect(minConfidenceConfig).toBeDefined();
        expect(minConfidenceConfig.type).toBe('range');
        expect(minConfidenceConfig.min).toBe(0);
        expect(minConfidenceConfig.max).toBe(100);
        expect(minConfidenceConfig.unit).toBe('%');

        const temperatureConfig = configs.find((c: any) => c.key === 'temperature');
        expect(temperatureConfig).toBeDefined();
        expect(temperatureConfig.type).toBe('range');
        expect(temperatureConfig.min).toBe(0);
        expect(temperatureConfig.max).toBe(2);
        expect(temperatureConfig.step).toBe(0.1);
      });
    });

    describe('PUT /faq-learning/config/bulk', () => {
      it('should successfully update multiple configurations', async () => {
        const updateData = {
          configs: [
            {
              configKey: 'minConfidenceForReview',
              configValue: 70,
              description: 'Updated minimum confidence',
              category: 'thresholds'
            },
            {
              configKey: 'temperature',
              configValue: 0.8,
              description: 'Updated temperature',
              category: 'ai'
            }
          ]
        };

        const response = await request(app.getHttpServer())
          .put('/faq-learning/config/bulk')
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.results).toBeDefined();
        expect(response.body.results).toHaveLength(2);
        
        response.body.results.forEach((result: any) => {
          expect(result.success).toBe(true);
          expect(result.configKey).toBeDefined();
        });
      });

      it('should validate configuration values and return errors for invalid data', async () => {
        const invalidData = {
          configs: [
            {
              configKey: 'minConfidenceForReview',
              configValue: 150, // Invalid: exceeds max of 100
              category: 'thresholds'
            },
            {
              configKey: 'temperature',
              configValue: 3.0, // Invalid: exceeds max of 2
              category: 'ai'
            }
          ]
        };

        const response = await request(app.getHttpServer())
          .put('/faq-learning/config/bulk')
          .send(invalidData)
          .expect(200);

        expect(response.body.success).toBe(false);
        expect(response.body.results).toBeDefined();
        
        const failedResults = response.body.results.filter((r: any) => !r.success);
        expect(failedResults).toHaveLength(2);
        
        failedResults.forEach((result: any) => {
          expect(result.error).toBeDefined();
          expect(result.error).toContain('must be');
        });
      });

      it('should handle partial success scenarios', async () => {
        const mixedData = {
          configs: [
            {
              configKey: 'minConfidenceForReview',
              configValue: 75, // Valid
              category: 'thresholds'
            },
            {
              configKey: 'invalidKey',
              configValue: 100, // Invalid key
              category: 'thresholds'
            }
          ]
        };

        const response = await request(app.getHttpServer())
          .put('/faq-learning/config/bulk')
          .send(mixedData)
          .expect(200);

        expect(response.body.success).toBe(false);
        expect(response.body.results).toHaveLength(2);
        
        const successfulResults = response.body.results.filter((r: any) => r.success);
        const failedResults = response.body.results.filter((r: any) => !r.success);
        
        expect(successfulResults).toHaveLength(1);
        expect(failedResults).toHaveLength(1);
        expect(failedResults[0].error).toContain('Unknown configuration key');
      });
    });

    describe('POST /faq-learning/config/reset/:sectionKey', () => {
      it('should reset configuration section to defaults', async () => {
        const response = await request(app.getHttpServer())
          .post('/faq-learning/config/reset/thresholds')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('reset to defaults');
        expect(response.body.resetConfigs).toBeDefined();
        expect(Array.isArray(response.body.resetConfigs)).toBe(true);
        
        response.body.resetConfigs.forEach((config: any) => {
          expect(config).toHaveProperty('key');
          expect(config).toHaveProperty('oldValue');
          expect(config).toHaveProperty('newValue');
        });
      });

      it('should handle invalid section keys', async () => {
        const response = await request(app.getHttpServer())
          .post('/faq-learning/config/reset/invalidSection')
          .expect(500);

        expect(response.body.message).toContain('Failed to reset configuration section');
      });
    });
  });

  describe('AI Provider Integration', () => {
    describe('GET /faq-learning/ai-provider-info', () => {
      it('should return current AI provider information', async () => {
        const response = await request(app.getHttpServer())
          .get('/faq-learning/ai-provider-info')
          .expect(200);

        expect(response.body.currentProvider).toBe('openai');
        expect(response.body.currentModel).toBe('gpt-4');
        expect(response.body.available).toBe(true);
        expect(response.body.isReadOnly).toBe(true);
        expect(response.body.globalSettingsUrl).toBe('/admin/profile/ai-preferences');
      });
    });

    describe('GET /faq-learning/provider-status', () => {
      it('should return provider status with availability', async () => {
        const response = await request(app.getHttpServer())
          .get('/faq-learning/provider-status')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.provider).toBe('openai');
        expect(response.body.data.model).toBe('gpt-4');
        expect(response.body.data.available).toBe(true);
        expect(response.body.data.responseTime).toBeDefined();
      });
    });
  });

  describe('Default Values Validation', () => {
    it('should apply correct default values for all settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/faq-learning/config')
        .expect(200);

      const configs = response.body.configurations;
      
      // Verify specific default values
      const defaultValues = {
        'minConfidenceForReview': 60,
        'minConfidenceForAutoPublish': 85,
        'minPatternFrequency': 3,
        'similarityThreshold': 0.8,
        'batchSize': 100,
        'processingInterval': 3600,
        'enableRealTimeProcessing': false,
        'enableAutoPublishing': false,
        'temperature': 0.7,
        'maxTokens': 1000,
        'retentionPeriodDays': 365
      };

      Object.entries(defaultValues).forEach(([key, expectedValue]) => {
        const config = configs.find((c: any) => c.key === key);
        expect(config).toBeDefined();
        expect(config.value).toBe(expectedValue);
      });
    });

    it('should maintain data types for all settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/faq-learning/config')
        .expect(200);

      const configs = response.body.configurations;
      
      // Verify data types
      const typeChecks = {
        'minConfidenceForReview': 'number',
        'enableRealTimeProcessing': 'boolean',
        'excludedCategories': 'object', // array
        'temperature': 'number'
      };

      Object.entries(typeChecks).forEach(([key, expectedType]) => {
        const config = configs.find((c: any) => c.key === key);
        expect(config).toBeDefined();
        expect(typeof config.value).toBe(expectedType);
      });
    });
  });

  describe('Category-wise Reset Functionality', () => {
    it('should reset only specified category without affecting others', async () => {
      // First, get current config
      const initialResponse = await request(app.getHttpServer())
        .get('/faq-learning/config')
        .expect(200);

      const initialConfigs = initialResponse.body.configurations;
      const thresholdConfigs = initialConfigs.filter((c: any) => c.category === 'thresholds');
      const processingConfigs = initialConfigs.filter((c: any) => c.category === 'processing');

      // Reset thresholds category
      await request(app.getHttpServer())
        .post('/faq-learning/config/reset/thresholds')
        .expect(200);

      // Verify only thresholds were reset
      const afterResetResponse = await request(app.getHttpServer())
        .get('/faq-learning/config')
        .expect(200);

      const afterResetConfigs = afterResetResponse.body.configurations;
      const afterThresholdConfigs = afterResetConfigs.filter((c: any) => c.category === 'thresholds');
      const afterProcessingConfigs = afterResetConfigs.filter((c: any) => c.category === 'processing');

      // Thresholds should be reset to defaults
      afterThresholdConfigs.forEach((config: any) => {
        const defaultConfig = FaqLearningConfig.getDefaultConfig();
        expect(config.value).toBe(defaultConfig[config.key as keyof typeof defaultConfig]);
      });

      // Processing configs should remain unchanged
      afterProcessingConfigs.forEach((config: any, index: number) => {
        expect(config.value).toBe(processingConfigs[index].value);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network connectivity issues gracefully', async () => {
      // Mock network error
      jest.spyOn(faqAiService, 'getProviderStatus').mockRejectedValueOnce(
        new Error('Network error')
      );

      const response = await request(app.getHttpServer())
        .get('/faq-learning/provider-status')
        .expect(500);

      expect(response.body.message).toContain('Failed to get provider status');
    });

    it('should validate edge cases for numeric ranges', async () => {
      const edgeCases = [
        {
          configKey: 'minConfidenceForReview',
          configValue: -1, // Below minimum
          expectedError: 'must be at least 0'
        },
        {
          configKey: 'temperature',
          configValue: 2.1, // Above maximum
          expectedError: 'must be at most 2'
        },
        {
          configKey: 'batchSize',
          configValue: 5, // Below minimum
          expectedError: 'must be at least 10'
        }
      ];

      for (const testCase of edgeCases) {
        const response = await request(app.getHttpServer())
          .put('/faq-learning/config/bulk')
          .send({ configs: [testCase] })
          .expect(200);

        expect(response.body.success).toBe(false);
        expect(response.body.results[0].success).toBe(false);
        expect(response.body.results[0].error).toContain(testCase.expectedError);
      }
    });

    it('should handle invalid input types', async () => {
      const invalidTypes = [
        {
          configKey: 'minConfidenceForReview',
          configValue: 'not a number',
          expectedError: 'must be a valid number'
        },
        {
          configKey: 'enableRealTimeProcessing',
          configValue: 'not a boolean',
          expectedError: 'must be true or false'
        },
        {
          configKey: 'excludedCategories',
          configValue: 'not an array',
          expectedError: 'must be an array'
        }
      ];

      for (const testCase of invalidTypes) {
        const response = await request(app.getHttpServer())
          .put('/faq-learning/config/bulk')
          .send({ configs: [testCase] })
          .expect(200);

        expect(response.body.success).toBe(false);
        expect(response.body.results[0].success).toBe(false);
        expect(response.body.results[0].error).toContain(testCase.expectedError);
      }
    });
  });

  describe('System Integration', () => {
    it('should maintain consistency between config API and service layer', async () => {
      // Test that service layer reflects API changes
      const updateData = {
        configs: [
          {
            configKey: 'batchSize',
            configValue: 150,
            category: 'processing'
          }
        ]
      };

      await request(app.getHttpServer())
        .put('/faq-learning/config/bulk')
        .send(updateData)
        .expect(200);

      // Verify service layer has updated config
      const pipelineConfig = await (faqLearningService as any).getPipelineConfig();
      expect(pipelineConfig.batchSize).toBe(150);
    });

    it('should handle concurrent configuration updates', async () => {
      const updates = [
        {
          configs: [{ configKey: 'minConfidenceForReview', configValue: 65, category: 'thresholds' }]
        },
        {
          configs: [{ configKey: 'minConfidenceForReview', configValue: 70, category: 'thresholds' }]
        }
      ];

      // Send concurrent requests
      const promises = updates.map(update =>
        request(app.getHttpServer())
          .put('/faq-learning/config/bulk')
          .send(update)
      );

      const responses = await Promise.all(promises);
      
      // Both should succeed (last one wins)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});