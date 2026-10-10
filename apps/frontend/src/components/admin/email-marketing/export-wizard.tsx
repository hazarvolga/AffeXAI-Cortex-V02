'use client';

import { useState } from 'react';
import type { ExportJob } from '@/lib/api/bulkExportService';
import { ExportConfiguration } from './export-configuration';
import { ExportProgressTracker } from './export-progress-tracker';
import { ExportHistory } from './export-history';

interface ExportWizardProps {
  onComplete?: (job: ExportJob) => void;
  onCancel?: () => void;
}

type WizardStep = 'configure' | 'progress' | 'history';

export function ExportWizard({ onComplete, onCancel }: ExportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('configure');
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);

  const handleExportStart = (job: ExportJob) => {
    setCurrentJob(job);
    setCurrentStep('progress');
  };

  const handleExportComplete = (job: ExportJob) => {
    setCurrentJob(job);
    onComplete?.(job);
  };

  const handleViewHistory = () => {
    setCurrentStep('history');
  };

  const handleViewJob = (job: ExportJob) => {
    setCurrentJob(job);
    setCurrentStep('progress');
  };

  const handleNewExport = () => {
    setCurrentJob(null);
    setCurrentStep('configure');
  };

  const handleCancel = () => {
    setCurrentJob(null);
    setCurrentStep('configure');
    onCancel?.();
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'configure':
        return (
          <ExportConfiguration
            onComplete={handleExportStart}
            onCancel={handleCancel}
          />
        );
      
      case 'progress':
        return currentJob ? (
          <ExportProgressTracker
            job={currentJob}
            onComplete={handleExportComplete}
            onCancel={handleCancel}
            onNewExport={handleNewExport}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Dışa aktarma işi bulunamadı.</p>
          </div>
        );
      
      case 'history':
        return (
          <ExportHistory
            onViewJob={handleViewJob}
            onNewExport={handleNewExport}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      {currentStep !== 'configure' && (
        <div className="flex items-center gap-4 pb-4 border-b">
          <button
            onClick={handleNewExport}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Yeni Dışa Aktarma
          </button>
          <span className="text-muted-foreground">•</span>
          <button
            onClick={handleViewHistory}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Geçmiş
          </button>
        </div>
      )}

      {renderCurrentStep()}
    </div>
  );
}