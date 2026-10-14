import React, { useState } from "react";
import { Step1Category } from "./step-1-category";
import { Step2Deflection } from "./step-2-deflection";
import { Step3Resolution } from "./step-3-resolution";
import type { UploadedFile } from "@/lib/api/fileUploadService";
import { Progress } from "@/components/ui/progress";

const STEP_LABELS = ["Kategori", "Sorun Tanımı", "Çözüm"] as const;
export function SupportWizard() {
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [problemData, setProblemData] = useState<{
    title: string;
    description: string;
    attachments: UploadedFile[];
  } | null>(null);

  // Helper to calculate progress
  const progress = (step / 3) * 100;

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setStep(2);
  };

  const handleDeflectionNext = (data: {
    title: string;
    description: string;
    attachments: UploadedFile[];
  }) => {
    setProblemData(data);
    setStep(3);
  };

  const handleBackToCategory = () => {
    setStep(1);
    setSelectedCategory(null);
  };

  const handleBackToDeflection = () => {
    setStep(2);
  };

  const handleSolved = () => {
    // Redirect logic handled inside component or here.
    // Assuming component redirects or we redirect to Support Home
    window.location.href = "/portal/support";
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      {/* Progress Bar */}
      <div className="mb-8 space-y-2">
        <ol className="flex justify-between gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {STEP_LABELS.map((label, index) => (
            <li
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
              className={step >= index + 1 ? "text-foreground" : ""}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        <Progress
          value={progress}
          aria-label={`Adım ${step} / ${STEP_LABELS.length}`}
          className="h-2"
        />
      </div>

      {/* Steps */}
      <div className="min-h-[500px]">
        {step === 1 && <Step1Category onSelect={handleCategorySelect} />}

        {step === 2 && selectedCategory && (
          <Step2Deflection
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onBack={handleBackToCategory}
            onSolved={handleSolved}
            onNext={handleDeflectionNext}
            initialData={problemData || undefined}
          />
        )}

        {step === 3 && selectedCategory && problemData && (
          <Step3Resolution
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            initialData={problemData}
            onBack={handleBackToDeflection}
          />
        )}
      </div>
    </div>
  );
}
