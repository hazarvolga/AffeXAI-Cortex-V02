/**
 * FAQ Learning Settings Frontend Integration Tests
 * Tests the complete frontend integration for FAQ learning settings
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import ConfigurationManagementPage from '../src/app/admin/support/faq-learning/settings/page';

// Mock the service
const mockFaqLearningService = {
  getConfig: jest.fn(),
  getAiProviderInfo: jest.fn(),
  bulkUpdateConfig: jest.fn(),
  resetConfigSection: jest.fn(),
};

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the service import
jest.mock('@/services/faq-learning.service', () => ({
  FaqLearningService: mockFaqLearningService,
}));

// Mock UI components that might cause issues in tests
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-${value}`} onClick={() => onClick?.(value)}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

describe('FAQ Learning Settings Integration', () => {
  const mockConfigData = {
    configurations: [
      {
        key: 'minConfidenceForReview',
        value: 60,
        description: 'Minimum confidence score for review',
        category: 'thresholds',
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        key: 'enableRealTimeProcessing',
        value: false,
        description: 'Enable real-time processing',
        category: 'processing',
        type: 'boolean',
        isActive: true,
        updatedAt: new Date(),
      },
      {
        key: 'temperature',
        value: 0.7,
        description: 'AI model creativity level',
        category: 'ai',
        type: 'range',
        min: 0,
        max: 2,
        step: 0.1,
        isActive: true,
        updatedAt: new Date(),
      },
      {
        key: 'excludedCategories',
        value: [],
        description: 'Categories to exclude',
        category: 'categories',
        type: 'multiselect',
        options: [
          { value: 'spam', label: 'Spam' },
          { value: 'test', label: 'Test' },
        ],
        isActive: true,
        updatedAt: new Date(),
      },
    ],
  };

  const mockAiProviderInfo = {
    currentProvider: 'openai',
    currentModel: 'gpt-4',
    available: true,
    isReadOnly: true,
    globalSettingsUrl: '/admin/profile/ai-preferences',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFaqLearningService.getConfig.mockResolvedValue(mockConfigData);
    mockFaqLearningService.getAiProviderInfo.mockResolvedValue(mockAiProviderInfo);
    mockFaqLearningService.bulkUpdateConfig.mockResolvedValue({
      success: true,
      message: 'Configurations updated successfully',
      results: mockConfigData.configurations.map(c => ({
        configKey: c.key,
        success: true,
      })),
    });
    mockFaqLearningService.resetConfigSection.mockResolvedValue({
      success: true,
      message: 'Section reset successfully',
      resetConfigs: [],
    });
  });

  describe('Initial Load and Data Display', () => {
    it('should load and display all configuration settings correctly', async () => {
      render(<ConfigurationManagementPage />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Verify API calls were made
      expect(mockFaqLearningService.getConfig).toHaveBeenCalledTimes(1);
      expect(mockFaqLearningService.getAiProviderInfo).toHaveBeenCalledTimes(1);

      // Verify page title
      expect(screen.getByText('FAQ Learning Ayarları')).toBeInTheDocument();

      // Verify tabs are rendered
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('should display AI provider information correctly', async () => {
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Check AI provider info is displayed
      expect(screen.getByText('OPENAI')).toBeInTheDocument();
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
    });

    it('should handle loading states properly', async () => {
      // Mock delayed response
      mockFaqLearningService.getConfig.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockConfigData), 100))
      );

      render(<ConfigurationManagementPage />);

      // Should show loading state initially
      expect(screen.getByText(/animate-pulse/)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/animate-pulse/)).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should handle API errors gracefully', async () => {
      mockFaqLearningService.getConfig.mockRejectedValue(new Error('API Error'));

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Hata',
          description: 'Ayarlar yüklenemedi. Lütfen daha sonra tekrar deneyin.',
          variant: 'destructive',
        });
      });

      // Should show empty state
      expect(screen.getByText('Ayar Bulunamadı')).toBeInTheDocument();
    });
  });

  describe('Setting Input Components', () => {
    it('should render different input types correctly', async () => {
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Range input (slider)
      const confidenceSlider = screen.getByRole('slider');
      expect(confidenceSlider).toBeInTheDocument();
      expect(confidenceSlider).toHaveAttribute('min', '0');
      expect(confidenceSlider).toHaveAttribute('max', '100');

      // Boolean input (switch)
      const realtimeSwitch = screen.getByRole('switch');
      expect(realtimeSwitch).toBeInTheDocument();
      expect(realtimeSwitch).not.toBeChecked();

      // Multiselect input
      const categorySelect = screen.getByText('Kategori seçin...');
      expect(categorySelect).toBeInTheDocument();
    });

    it('should update setting values when inputs change', async () => {
      const user = userEvent.setup();
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Change boolean setting
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      // Should show change indicator
      await waitFor(() => {
        expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
      });

      // Should enable save button
      const saveButton = screen.getByText(/Tüm Ayarları Kaydet/);
      expect(saveButton).not.toBeDisabled();
    });

    it('should validate input values and show errors', async () => {
      const user = userEvent.setup();
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Find a number input and enter invalid value
      const numberInput = screen.getByDisplayValue('60');
      await user.clear(numberInput);
      await user.type(numberInput, '150'); // Above max of 100

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/en fazla 100 olmalıdır/)).toBeInTheDocument();
      });

      // Save button should be disabled
      const saveButton = screen.getByText(/Tüm Ayarları Kaydet/);
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Save Functionality', () => {
    it('should save all changes successfully', async () => {
      const user = userEvent.setup();
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Make a change
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      // Wait for change to be tracked
      await waitFor(() => {
        expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
      });

      // Click save
      const saveButton = screen.getByText(/Tüm Ayarları Kaydet/);
      await user.click(saveButton);

      // Should show loading state
      expect(screen.getByText(/Kaydediliyor.../)).toBeInTheDocument();

      // Wait for save to complete
      await waitFor(() => {
        expect(mockFaqLearningService.bulkUpdateConfig).toHaveBeenCalledWith([
          {
            configKey: 'minConfidenceForReview',
            configValue: 60,
            description: 'Minimum confidence score for review',
            category: 'thresholds',
          },
          {
            configKey: 'enableRealTimeProcessing',
            configValue: true, // Changed value
            description: 'Enable real-time processing',
            category: 'processing',
          },
          {
            configKey: 'temperature',
            configValue: 0.7,
            description: 'AI model creativity level',
            category: 'ai',
          },
          {
            configKey: 'excludedCategories',
            configValue: [],
            description: 'Categories to exclude',
            category: 'categories',
          },
        ]);
      });

      // Should show success message
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Başarılı',
        description: expect.stringContaining('ayar başarıyla kaydedildi'),
        variant: 'default',
      });

      // Should clear change indicators
      expect(screen.queryByText('1 değişiklik')).not.toBeInTheDocument();
    });

    it('should handle save errors gracefully', async () => {
      const user = userEvent.setup();
      mockFaqLearningService.bulkUpdateConfig.mockRejectedValue(new Error('Save failed'));

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Make a change and save
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      await waitFor(() => {
        expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/Tüm Ayarları Kaydet/);
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Kaydetme Hatası',
          description: 'Save failed',
          variant: 'destructive',
        });
      });
    });

    it('should handle partial save success', async () => {
      const user = userEvent.setup();
      mockFaqLearningService.bulkUpdateConfig.mockResolvedValue({
        success: false,
        message: 'Partial success',
        results: [
          { configKey: 'minConfidenceForReview', success: true },
          { configKey: 'enableRealTimeProcessing', success: false, error: 'Validation failed' },
        ],
      });

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Make changes and save
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      await waitFor(() => {
        expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/Tüm Ayarları Kaydet/);
      await user.click(saveButton);

      // Should show partial success message
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Kısmi Başarı',
          description: expect.stringContaining('1 ayar kaydedildi, 1 ayar başarısız oldu'),
          variant: 'destructive',
        });
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset category to defaults successfully', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Find and click reset button for a category
      const resetButton = screen.getByText(/Varsayılana Dön/);
      await user.click(resetButton);

      // Should show confirmation dialog
      expect(confirmSpy).toHaveBeenCalled();

      // Should call reset API
      await waitFor(() => {
        expect(mockFaqLearningService.resetConfigSection).toHaveBeenCalledWith('thresholds');
      });

      // Should show success message
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Başarılı',
        description: expect.stringContaining('varsayılan değerlere sıfırlandı'),
        variant: 'default',
      });

      confirmSpy.mockRestore();
    });

    it('should cancel reset when user declines confirmation', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      const resetButton = screen.getByText(/Varsayılana Dön/);
      await user.click(resetButton);

      // Should not call reset API
      expect(mockFaqLearningService.resetConfigSection).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should handle reset errors gracefully', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      mockFaqLearningService.resetConfigSection.mockRejectedValue(new Error('Reset failed'));

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      const resetButton = screen.getByText(/Varsayılana Dön/);
      await user.click(resetButton);

      // Should show error message
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Sıfırlama Hatası',
          description: expect.stringContaining('Reset failed'),
          variant: 'destructive',
        });
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Change Tracking and UX', () => {
    it('should track changes across different categories', async () => {
      const user = userEvent.setup();
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Make changes in different categories
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      const confidenceSlider = screen.getByRole('slider');
      fireEvent.change(confidenceSlider, { target: { value: '70' } });

      // Should track multiple changes
      await waitFor(() => {
        expect(screen.getByText('2 değişiklik')).toBeInTheDocument();
      });

      // Should show change indicators on tabs
      const processingTab = screen.getByTestId('tab-processing');
      expect(processingTab.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should warn about unsaved changes before navigation', async () => {
      const user = userEvent.setup();
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Make a change
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      await waitFor(() => {
        expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
      });

      // Should show unsaved changes alert
      expect(screen.getByText(/değişiklik yaptınız/)).toBeInTheDocument();
      expect(screen.getByText(/Değişiklikleri kaydetmeyi unutmayın/)).toBeInTheDocument();
    });

    it('should allow canceling all changes', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Make changes
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      await waitFor(() => {
        expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
      });

      // Cancel changes
      const cancelButton = screen.getByText(/Değişiklikleri İptal Et/);
      await user.click(cancelButton);

      // Should restore original values
      expect(realtimeSwitch).not.toBeChecked();
      expect(screen.queryByText('1 değişiklik')).not.toBeInTheDocument();

      confirmSpy.mockRestore();
    });
  });

  describe('Responsive Design and Accessibility', () => {
    it('should render properly on different screen sizes', async () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Should still render all essential elements
      expect(screen.getByText('FAQ Learning Ayarları')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should have proper ARIA labels and accessibility features', async () => {
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Check for proper labels
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-label');

      const switch_ = screen.getByRole('switch');
      expect(switch_).toHaveAttribute('aria-label');

      // Check for proper form structure
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('id');
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should show appropriate loading states during operations', async () => {
      const user = userEvent.setup();
      
      // Mock slow save operation
      mockFaqLearningService.bulkUpdateConfig.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          message: 'Success',
          results: []
        }), 100))
      );

      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Make change and save
      const realtimeSwitch = screen.getByRole('switch');
      await user.click(realtimeSwitch);

      await waitFor(() => {
        expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/Tüm Ayarları Kaydet/);
      await user.click(saveButton);

      // Should show loading state
      expect(screen.getByText(/Kaydediliyor.../)).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/Kaydediliyor.../)).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should handle rapid user interactions gracefully', async () => {
      const user = userEvent.setup();
      render(<ConfigurationManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Yükleniyor/)).not.toBeInTheDocument();
      });

      // Rapidly toggle switch multiple times
      const realtimeSwitch = screen.getByRole('switch');
      
      await act(async () => {
        await user.click(realtimeSwitch);
        await user.click(realtimeSwitch);
        await user.click(realtimeSwitch);
      });

      // Should handle final state correctly
      expect(realtimeSwitch).toBeChecked();
      expect(screen.getByText('1 değişiklik')).toBeInTheDocument();
    });
  });
});