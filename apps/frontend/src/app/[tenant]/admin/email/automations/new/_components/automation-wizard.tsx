'use client';

import { useWizardStore } from './wizard-store';
import { WizardLayout } from './wizard-layout';
import { BlueprintSelector } from './blueprint-selector';
import { TriggerConfigurator } from './trigger-configurator';
import { WorkflowStep } from './workflow-step';
import { ActivationConsole } from './activation-console';
import { useEffect } from 'react';

export function AutomationWizard() {
    const { currentStep, resetWizard } = useWizardStore();

    // Reset state on initial mount (unmount cleanup)
    useEffect(() => {
        return () => resetWizard();
    }, [resetWizard]);

    const renderStep = () => {
        switch (currentStep) {
            case 'blueprint':
                return <BlueprintSelector />;
            case 'trigger':
                return <TriggerConfigurator />;
            case 'workflow':
                return <WorkflowStep />;
            case 'review':
                return <ActivationConsole />;
            default:
                return null;
        }
    };

    return (
        <WizardLayout>
            {renderStep()}
        </WizardLayout>
    );
}
