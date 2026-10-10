'use client';

import { useState } from 'react';
import CachingPerformanceTest from './caching-performance-test';
import ApiTestPage from './api-test';

export default function CachingTestPage() {
  const [activeTab, setActiveTab] = useState<'performance' | 'api'>('performance');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Caching Test</h2>
        <p className="text-muted-foreground">
          Test the caching performance of backend services
        </p>
      </div>

      <div className="flex space-x-4 border-b">
        <button
          className={`pb-2 px-1 ${activeTab === 'performance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance Test
        </button>
        <button
          className={`pb-2 px-1 ${activeTab === 'api' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('api')}
        >
          API Test
        </button>
      </div>

      {activeTab === 'performance' ? <CachingPerformanceTest /> : <ApiTestPage />}
    </div>
  );
}