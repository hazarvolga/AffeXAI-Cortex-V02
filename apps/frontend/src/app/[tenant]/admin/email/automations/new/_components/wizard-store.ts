'use client';

import { create } from 'zustand';
import { CreateAutomationDto, AutomationTrigger } from '@/types/automation';

export type WizardStep = 'blueprint' | 'trigger' | 'workflow' | 'review';

interface WizardState {
    currentStep: WizardStep;
    draftData: Partial<CreateAutomationDto>;
    selectedBlueprintId: string | null;
    validation: {
        isBlueprintValid: boolean;
        isTriggerValid: boolean;
        isWorkflowValid: boolean;
    };

    // Actions
    setStep: (step: WizardStep) => void;
    setDraftData: (data: Partial<CreateAutomationDto>) => void;
    selectBlueprint: (id: string | null) => void;
    setTrigger: (trigger: AutomationTrigger) => void;
    resetWizard: () => void;
    validateStep: (step: WizardStep, isValid: boolean) => void;
}

const INITIAL_STATE = {
    currentStep: 'blueprint' as WizardStep,
    draftData: {
        name: '',
        description: '',
        workflowSteps: [],
        isActive: false,
    },
    selectedBlueprintId: null,
    validation: {
        isBlueprintValid: false,
        isTriggerValid: false,
        isWorkflowValid: false,
    },
};

export const useWizardStore = create<WizardState>((set) => ({
    ...INITIAL_STATE,

    setStep: (step) => set({ currentStep: step }),

    setDraftData: (data) =>
        set((state) => ({
            draftData: { ...state.draftData, ...data }
        })),

    selectBlueprint: (id) =>
        set((state) => ({
            selectedBlueprintId: id,
            validation: { ...state.validation, isBlueprintValid: !!id }
        })),

    setTrigger: (trigger) =>
        set((state) => ({
            draftData: {
                ...state.draftData,
                triggerType: trigger.type,
                triggerConfig: trigger.config
            },
            validation: { ...state.validation, isTriggerValid: !!trigger.type }
        })),

    resetWizard: () => set(INITIAL_STATE),

    validateStep: (step, isValid) =>
        set((state) => {
            switch (step) {
                case 'blueprint':
                    return { validation: { ...state.validation, isBlueprintValid: isValid } };
                case 'trigger':
                    return { validation: { ...state.validation, isTriggerValid: isValid } };
                case 'workflow':
                    return { validation: { ...state.validation, isWorkflowValid: isValid } };
                default:
                    return state;
            }
        }),
}));
