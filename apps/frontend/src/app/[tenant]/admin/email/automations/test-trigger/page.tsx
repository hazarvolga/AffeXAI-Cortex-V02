/**
 * Test page for Trigger Configuration Form
 */

'use client';

import { useState } from 'react';
import { TriggerConfigForm } from '@/modules/email-marketing/components/automation/trigger-config-form';
import { TriggerType, type TriggerConfig } from '@/types/automation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TriggerConfigTestPage() {
  const [submittedData, setSubmittedData] = useState<any>(null);

  const handleSubmit = (data: {
    triggerType: TriggerType;
    config: TriggerConfig;
    segmentId?: string;
  }) => {
    console.log('Submitted trigger config:', data);
    setSubmittedData(data);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trigger Configuration Form Test</h1>
        <p className="text-muted-foreground">
          Test the trigger configuration form component
        </p>
      </div>

      <div className="grid gap-8">
        <TriggerConfigForm onSubmit={handleSubmit} />

        {submittedData && (
          <Card>
            <CardHeader>
              <CardTitle>Submitted Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(submittedData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
