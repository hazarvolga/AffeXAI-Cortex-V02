
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  Save,
  Play,
  Eye,
  AlertTriangle,
  LayoutTemplate,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TriggerConfigForm } from './trigger-config-form';
import { WorkflowBuilder } from './workflow-builder';
import { TemplateGallery } from './template-gallery';
import { StrategicTemplate } from './strategic-templates';

type Step = 'template' | 'trigger' | 'workflow' | 'review';

interface AutomationData {
  name: string;
  description?: string;
  trigger?: any;
  workflow?: {
    nodes: any[];
    edges: any[];
  };
}

interface AutomationBuilderProps {
  automationId?: string;
  initialData?: AutomationData;
  mode?: 'create' | 'edit';
  initialStep?: Step;
}

export function AutomationBuilder({
  automationId,
  initialData,
  mode = 'create',
  initialStep,
}: AutomationBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  // Start with 'template' step only if creating new, unless initialStep is provided
  const [currentStep, setCurrentStep] = useState<Step>(
    initialStep || (mode === 'create' ? 'template' : 'trigger')
  );
  const [automationData, setAutomationData] = useState<AutomationData>(
    initialData || {
      name: '',
      description: '',
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const steps: { id: Step; label: string; description: string }[] = [
    {
      id: 'template',
      label: 'Select Blueprint',
      description: 'Choose a strategic starting point',
    },
    {
      id: 'trigger',
      label: 'Configure Trigger',
      description: 'When should this automation start?',
    },
    {
      id: 'workflow',
      label: 'Build Workflow',
      description: 'What actions should happen?',
    },
    {
      id: 'review',
      label: 'Review & Activate',
      description: 'Review and activate your automation',
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleTemplateSelect = (template: StrategicTemplate) => {
    setAutomationData({
      name: template.name,
      description: template.description,
      trigger: {
        type: template.triggerType,
      },
      workflow: {
        nodes: template.nodes,
        edges: template.edges,
      }
    });

    toast({
      title: "Blueprint Loaded",
      description: `Initialized with ${template.name} strategy.`,
    });

    handleNext();
  };

  const handleTriggerUpdate = useCallback((triggerData: any) => {
    setAutomationData((prev) => ({
      ...prev,
      trigger: triggerData,
    }));
  }, []);

  const handleWorkflowUpdate = useCallback((workflowData: any) => {
    setAutomationData((prev) => ({
      ...prev,
      workflow: workflowData,
    }));
  }, []);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'template':
        // Can always skip template (manual creation) or proceed if selected
        return true;
      case 'trigger':
        return !!automationData.trigger;
      case 'workflow':
        return !!(
          automationData.workflow?.nodes &&
          automationData.workflow.nodes.length > 1
        );
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'template') {
      setCurrentStep('trigger');
    } else if (currentStep === 'trigger') {
      setCurrentStep('workflow');
    } else if (currentStep === 'workflow') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'trigger') {
      setCurrentStep('template');
    } else if (currentStep === 'workflow') {
      setCurrentStep('trigger');
    } else if (currentStep === 'review') {
      setCurrentStep('workflow');
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Save to backend API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: 'Draft saved',
        description: 'Your automation has been saved as a draft.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    setIsSaving(true);
    try {
      // Activate automation via backend API
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      toast({
        title: 'Automation activated!',
        description: 'Your automation is now running.',
      });

      router.push('/admin/email-marketing/automations');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate automation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestFlow = () => {
    toast({
      title: 'Test Started',
      description: 'A test execution has been initiated with your email.',
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Select a Strategic Blueprint</h3>
                <p className="text-sm text-muted-foreground">
                  Start with a pre-configured marketing strategy or build from scratch.
                </p>
              </div>
              <Button variant="outline" onClick={handleNext}>
                Skip to Manual Setup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-[500px]">
              <TemplateGallery onSelect={handleTemplateSelect} />
            </div>
          </div>
        );

      case 'trigger':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configure Trigger</CardTitle>
              <CardDescription>
                Define when this automation should start for your subscribers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TriggerConfigForm
                initialData={automationData.trigger}
                onUpdate={handleTriggerUpdate}
              />
            </CardContent>
          </Card>
        );

      case 'workflow':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Build Your Workflow</h3>
                <p className="text-sm text-muted-foreground">
                  Drag steps from the library to create your automation flow
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {automationData.workflow?.nodes?.length || 0} steps added
              </Badge>
            </div>
            <div className="border rounded-lg overflow-hidden h-[600px]">
              <WorkflowBuilder
                initialNodes={automationData.workflow?.nodes}
                initialEdges={automationData.workflow?.edges}
                onChange={handleWorkflowUpdate}
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            {/* Automation Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Automation Summary</CardTitle>
                <CardDescription>
                  Review your automation configuration before activating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trigger Info */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Trigger Configuration
                  </h4>
                  <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                    <p>Type: {automationData.trigger?.type || 'Not configured'}</p>
                    {automationData.trigger?.eventType && (
                      <p>Event: {automationData.trigger.eventType}</p>
                    )}
                    {automationData.trigger?.segment && (
                      <p>Segment: {automationData.trigger.segment}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Workflow Info */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Workflow Steps
                  </h4>
                  <div className="ml-6 space-y-2 text-sm">
                    {automationData.workflow?.nodes?.map((node: any, index: number) => (
                      <div key={node.id} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Step {index + 1}
                        </Badge>
                        <span className="text-muted-foreground">
                          {node.data?.label || node.type}
                        </span>
                        {node.data?.configured === false && (
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Validation Warnings */}
                {automationData.workflow?.nodes?.some(
                  (n: any) => n.data?.configured === false
                ) && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200 dark:border-amber-900">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Unconfigured Steps
                          </h4>
                          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                            Some workflow steps are not fully configured. Please review
                            and complete all step configurations before activating.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" onClick={handleTestFlow} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Test Flow
              </Button>
              <Button onClick={handleActivate} disabled={isSaving} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {isSaving ? 'Activating...' : 'Activate Automation'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === 'edit' ? 'Edit Automation' : 'Create New Automation'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Build powerful automated workflows for your subscribers
          </p>
        </div>
        <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    isActive && 'text-primary font-medium'
                  )}
                  onClick={() => setCurrentStep(step.id)}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  )}
                  <div className="hidden sm:block">
                    <div className="text-sm">{step.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <Separator className="flex-1 mx-4" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStepContent()}</div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep !== 'review' && currentStep !== 'template' ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext()}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : currentStep === 'template' ? (
          null
        ) : (
          <div className="text-sm text-muted-foreground">
            Review complete
          </div>
        )}
      </div>
    </div>
  );
}
