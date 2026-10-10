/**
 * Design Tokens Debug Test Page
 * Test CSS injection and token merging
 */

'use client';

import { useDesignTokens } from '@/providers/DesignTokensProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState } from 'react';

// Test color presets
const COLOR_TESTS = [
  { name: 'background', path: 'color.background', testColor: '0 100% 50%', label: 'Background → RED' },
  { name: 'card', path: 'color.card.background', testColor: '240 100% 50%', label: 'Card → BLUE' },
  { name: 'primary', path: 'color.primary.background', testColor: '120 100% 50%', label: 'Primary → GREEN' },
  { name: 'secondary', path: 'color.secondary.background', testColor: '280 100% 50%', label: 'Secondary → PURPLE' },
  { name: 'muted', path: 'color.muted.background', testColor: '60 100% 50%', label: 'Muted → YELLOW' },
  { name: 'accent', path: 'color.accent.background', testColor: '180 100% 50%', label: 'Accent → CYAN' },
  { name: 'destructive', path: 'color.destructive.background', testColor: '300 100% 50%', label: 'Destructive → MAGENTA' },
  { name: 'success', path: 'color.success.background', testColor: '140 100% 30%', label: 'Success → DARK GREEN' },
  { name: 'warning', path: 'color.warning.background', testColor: '40 100% 50%', label: 'Warning → ORANGE' },
  { name: 'info', path: 'color.info.background', testColor: '200 100% 50%', label: 'Info → SKY BLUE' },
];

export default function DebugTokensPage() {
  const { tokens, updateTokens, resetTokens, context, mode } = useDesignTokens();
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'testing' | 'success'>>({});

  // Cast tokens.color to any for easier property access in this debug page
  const colorTokens = tokens.color as any;

  const testSingleColor = (test: typeof COLOR_TESTS[0]) => {
    console.log(`🧪 Testing ${test.name}: ${test.path} → ${test.testColor}`);
    setTestResults(prev => ({ ...prev, [test.name]: 'testing' }));

    const modifiedTokens = JSON.parse(JSON.stringify(tokens));
    const parts = test.path.split('.');
    let current = modifiedTokens;

    console.log('🔍 Path parts:', parts);
    console.log('🔍 Starting from:', current);

    // Navigate to nested path (skip first part if 'color', navigate to parent)
    for (let i = 0; i < parts.length - 1; i++) {
      console.log(`🔍 Navigating to: ${parts[i]}`);
      if (!current[parts[i]]) {
        console.warn(`⚠️ Creating missing path: ${parts[i]}`);
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    // Update the value
    const lastKey = parts[parts.length - 1];
    console.log(`🔍 Setting ${lastKey} =`, test.testColor);

    current[lastKey] = {
      ...current[lastKey],
      $value: test.testColor
    };

    console.log('✅ Modified tokens:', modifiedTokens);
    updateTokens(modifiedTokens);

    // Mark as success after a short delay
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, [test.name]: 'success' }));
    }, 500);
  };

  const testAllColors = () => {
    console.log('🧪 Testing ALL colors sequentially');
    let delay = 0;

    COLOR_TESTS.forEach((test, index) => {
      setTimeout(() => {
        testSingleColor(test);
      }, delay);
      delay += 1000; // 1 second between each test
    });
  };

  const handleReset = () => {
    console.log('🔄 Resetting all tokens');
    resetTokens();
    setTestResults({});
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Design Tokens Automated Test Suite</CardTitle>
          <CardDescription>
            Test each color token individually or run all tests sequentially
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p><strong>Context:</strong> {context}</p>
            <p><strong>Mode:</strong> {mode}</p>
            <p><strong>Current Background:</strong> {(tokens.color as any)?.background?.$value || 'N/A'}</p>
          </div>

          {/* Master Controls */}
          <div className="flex gap-2">
            <Button onClick={testAllColors} className="flex-1" size="lg">
              🎨 Test All Colors (Sequential)
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg">
              🔄 Reset All
            </Button>
          </div>

          {/* Individual Test Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {COLOR_TESTS.map((test) => {
              const status = testResults[test.name];
              const buttonVariant =
                status === 'success' ? 'default' :
                  status === 'testing' ? 'secondary' :
                    'outline';

              return (
                <Button
                  key={test.name}
                  onClick={() => testSingleColor(test)}
                  variant={buttonVariant}
                  className="justify-start"
                  disabled={status === 'testing'}
                >
                  {status === 'success' && '✅ '}
                  {status === 'testing' && '⏳ '}
                  {test.label}
                </Button>
              );
            })}
          </div>

          {/* Console Log Instructions */}
          <div className="text-xs p-4 bg-muted rounded">
            <p className="font-bold mb-2">📊 Check Browser Console (F12) for:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>🎨 updateToken called: (path, value)</li>
              <li>🔄 updateTokens called with: (full tokens)</li>
              <li>🔧 Computed tokens: (merge result)</li>
              <li>🎨 Auto-injecting CSS: (context, mode)</li>
              <li>💉 injectCSSVariables called</li>
              <li>📝 Generated CSS selector: (specificity check)</li>
              <li>✅ Injected CSS variables</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Live Color Preview</CardTitle>
          <CardDescription>
            Watch colors change in real-time as you run tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Background */}
            <div className="p-6 bg-background text-foreground border-2 rounded">
              <p className="font-bold text-lg">Background</p>
              <p className="text-sm text-muted-foreground">bg-background</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.background?.$value}</p>
            </div>

            {/* Card */}
            <div className="p-6 bg-card text-card-foreground border-2 rounded">
              <p className="font-bold text-lg">Card</p>
              <p className="text-sm">bg-card</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.card?.background?.$value}</p>
            </div>

            {/* Primary */}
            <div className="p-6 rounded border-2" style={{
              backgroundColor: `hsl(${colorTokens?.primary?.background?.$value})`,
              color: `hsl(${colorTokens?.primary?.foreground?.$value})`
            }}>
              <p className="font-bold text-lg">Primary (Inline Style)</p>
              <p className="text-sm">Direct HSL injection</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.primary?.background?.$value}</p>
            </div>

            {/* Primary with Tailwind */}
            <div className="p-6 bg-primary text-primary-foreground rounded border-2">
              <p className="font-bold text-lg">Primary (Tailwind)</p>
              <p className="text-sm">bg-primary class</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.primary?.background?.$value}</p>
            </div>

            {/* Secondary */}
            <div className="p-6 bg-secondary text-secondary-foreground rounded">
              <p className="font-bold text-lg">Secondary</p>
              <p className="text-sm">bg-secondary</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.secondary?.background?.$value}</p>
            </div>

            {/* Muted */}
            <div className="p-6 bg-muted text-muted-foreground rounded">
              <p className="font-bold text-lg">Muted</p>
              <p className="text-sm">bg-muted</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.muted?.background?.$value}</p>
            </div>

            {/* Accent */}
            <div className="p-6 bg-accent text-accent-foreground rounded">
              <p className="font-bold text-lg">Accent</p>
              <p className="text-sm">bg-accent</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.accent?.background?.$value}</p>
            </div>

            {/* Destructive */}
            <div className="p-6 bg-destructive text-destructive-foreground rounded">
              <p className="font-bold text-lg">Destructive</p>
              <p className="text-sm">bg-destructive</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.destructive?.background?.$value}</p>
            </div>

            {/* Success */}
            <div className="p-6 bg-success text-success-foreground rounded">
              <p className="font-bold text-lg">Success</p>
              <p className="text-sm">bg-success</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.success?.background?.$value}</p>
            </div>

            {/* Warning */}
            <div className="p-6 bg-warning text-warning-foreground rounded">
              <p className="font-bold text-lg">Warning</p>
              <p className="text-sm">bg-warning</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.warning?.background?.$value}</p>
            </div>

            {/* Info */}
            <div className="p-6 bg-info text-info-foreground rounded">
              <p className="font-bold text-lg">Info</p>
              <p className="text-sm">bg-info</p>
              <p className="text-xs mt-2 font-mono">{colorTokens?.info?.background?.$value}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
