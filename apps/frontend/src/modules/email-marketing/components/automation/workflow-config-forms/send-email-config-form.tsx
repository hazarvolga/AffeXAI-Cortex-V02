'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SendEmailConfigData = {
  templateId?: string;
  subject?: string;
  fromName?: string;
  fromEmail?: string;
  configured: boolean;
};

interface SendEmailConfigFormProps {
  data: SendEmailConfigData;
  onUpdate: (data: SendEmailConfigData) => void;
  className?: string;
}

// Mock email templates - in production, fetch from API
const mockTemplates = [
  { id: 'welcome-1', name: 'Welcome Email', category: 'Onboarding' },
  { id: 'promo-1', name: 'Summer Sale Promotion', category: 'Marketing' },
  { id: 'newsletter-1', name: 'Monthly Newsletter', category: 'Newsletter' },
  { id: 'abandoned-1', name: 'Abandoned Cart Reminder', category: 'Behavioral' },
  { id: 'reengagement-1', name: 'Re-engagement Campaign', category: 'Lifecycle' },
];

export function SendEmailConfigForm({
  data,
  onUpdate,
  className,
}: SendEmailConfigFormProps) {
  const [formData, setFormData] = useState<SendEmailConfigData>(data);

  // Update parent whenever form changes
  useEffect(() => {
    const isConfigured = !!(formData.templateId && formData.subject);
    onUpdate({ ...formData, configured: isConfigured });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]); // Only depend on formData, not onUpdate

  const selectedTemplate = mockTemplates.find((t) => t.id === formData.templateId);

  const handleTemplateChange = (templateId: string) => {
    setFormData((prev) => ({ ...prev, templateId }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, subject: e.target.value }));
  };

  const handleFromNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, fromName: e.target.value }));
  };

  const handleFromEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, fromEmail: e.target.value }));
  };

  const insertVariable = (variable: string) => {
    const currentSubject = formData.subject || '';
    setFormData((prev) => ({
      ...prev,
      subject: currentSubject + `{{${variable}}}`,
    }));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Template Selection */}
      <div className="space-y-2">
        <Label htmlFor="template" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Template
          <span className="text-destructive">*</span>
        </Label>
        <Select value={formData.templateId} onValueChange={handleTemplateChange}>
          <SelectTrigger id="template">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {mockTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center justify-between gap-2">
                  <span>{template.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTemplate && (
          <p className="text-sm text-muted-foreground">
            Category: {selectedTemplate.category}
          </p>
        )}
      </div>

      <Separator />

      {/* Subject Line */}
      <div className="space-y-2">
        <Label htmlFor="subject" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Subject Line
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          type="text"
          placeholder="Enter email subject..."
          value={formData.subject || ''}
          onChange={handleSubjectChange}
        />
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Insert variable:</span>
          {['firstName', 'lastName', 'email', 'company'].map((variable) => (
            <Button
              key={variable}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => insertVariable(variable)}
            >
              {`{{${variable}}}`}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Sender Override (Optional) */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sender Information (Optional)</Label>
        <div className="space-y-2">
          <Label htmlFor="fromName" className="text-xs text-muted-foreground">
            From Name
          </Label>
          <Input
            id="fromName"
            type="text"
            placeholder="Default sender name"
            value={formData.fromName || ''}
            onChange={handleFromNameChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fromEmail" className="text-xs text-muted-foreground">
            From Email
          </Label>
          <Input
            id="fromEmail"
            type="email"
            placeholder="noreply@company.com"
            value={formData.fromEmail || ''}
            onChange={handleFromEmailChange}
          />
        </div>
      </div>

      <Separator />

      {/* Preview Button */}
      <Button variant="outline" className="w-full" disabled>
        <Eye className="h-4 w-4 mr-2" />
        Preview Email (Coming Soon)
      </Button>

      {/* Configuration Status */}
      {formData.templateId && formData.subject ? (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-900">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✓ Configuration complete
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            ⚠ Please select a template and enter a subject line
          </p>
        </div>
      )}
    </div>
  );
}
