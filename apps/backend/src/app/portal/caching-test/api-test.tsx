'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ApiTestPage() {
  const [endpoint, setEndpoint] = useState('/users');
  const [method, setMethod] = useState('GET');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);

  const makeRequest = async () => {
    setLoading(true);
    setResponse('');
    setTimeTaken(0);
    
    const startTime = performance.now();
    
    try {
      const res = await fetch(`http://localhost:9004${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      const endTime = performance.now();
      
      setTimeTaken(Math.round(endTime - startTime));
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const endTime = performance.now();
      setTimeTaken(Math.round(endTime - startTime));
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">API Test</h2>
        <p className="text-muted-foreground">
          Test the backend API endpoints and observe caching performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/users"
              />
            </div>
          </div>
          
          <Button onClick={makeRequest} disabled={loading}>
            {loading ? 'Loading...' : 'Send Request'}
          </Button>
          
          {timeTaken > 0 && (
            <div className="text-sm text-muted-foreground">
              Response time: {timeTaken}ms
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={response}
            readOnly
            className="min-h-[300px] font-mono text-sm"
            placeholder="Response will appear here..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <h3 className="font-medium">Users</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <Button variant="outline" onClick={() => {setEndpoint('/users'); setMethod('GET');}}>
              GET /users
            </Button>
            <Button variant="outline" onClick={() => {setEndpoint('/users/1'); setMethod('GET');}}>
              GET /users/1
            </Button>
          </div>
          
          <h3 className="font-medium mt-4">Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <Button variant="outline" onClick={() => {setEndpoint('/events'); setMethod('GET');}}>
              GET /events
            </Button>
            <Button variant="outline" onClick={() => {setEndpoint('/events/1'); setMethod('GET');}}>
              GET /events/1
            </Button>
          </div>
          
          <h3 className="font-medium mt-4">Email Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <Button variant="outline" onClick={() => {setEndpoint('/email-campaigns'); setMethod('GET');}}>
              GET /email-campaigns
            </Button>
            <Button variant="outline" onClick={() => {setEndpoint('/email-campaigns/1'); setMethod('GET');}}>
              GET /email-campaigns/1
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}