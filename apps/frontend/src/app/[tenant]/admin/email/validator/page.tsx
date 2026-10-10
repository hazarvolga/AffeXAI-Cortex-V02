"use client";

import { EmailValidator } from '@/modules/email-marketing/components/email-validator';
import { BccEditorialWrapper } from '@/components/brand/BccEditorialWrapper';
import { EmailModuleNav } from '@/components/admin/email/EmailModuleNav';


export default function EmailValidatorPage() {
  return (
    <BccEditorialWrapper
      headerTitle="Neural Validator"
      headerSubtitle="Integrity verification for entry parameters"
      headerBadge="Security"
      moduleNav={<EmailModuleNav />}
      telemetryData={[
        { label: "Check Latency", value: "12ms", color: "#9df425" },
        { label: "Accuracy Index", value: "99.9", suffix: "%", color: "#ff8c00" }
      ]}
    >
      <div className="container mx-auto py-8 animate-in fade-in duration-700">
        <EmailValidator />
      </div>
    </BccEditorialWrapper>
  );
}
