'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Loader2, 
  Shield,
  AlertTriangle
} from 'lucide-react';
import ipReputationService, { IpReputationResult } from '@/lib/api/ipReputationService';

export default function EmailValidationPage() {
  const [ipAddress, setIpAddress] = useState('');
  const [result, setResult] = useState<IpReputationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckReputation = async () => {
    if (!ipAddress) {
      setError('Please enter an IP address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ipReputationService.checkIpReputation(ipAddress);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while checking IP reputation');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getReputationIcon = () => {
    if (!result) return null;
    
    switch (result.reputation) {
      case 'clean':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'listed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'unknown':
      default:
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getReputationColor = () => {
    if (!result) return '';
    
    switch (result.reputation) {
      case 'clean':
        return 'text-green-500';
      case 'listed':
        return 'text-red-500';
      case 'unknown':
      default:
        return 'text-yellow-500';
    }
  };

  const getReputationText = () => {
    if (!result) return '';
    
    switch (result.reputation) {
      case 'clean':
        return 'Clean';
      case 'listed':
        return 'Listed';
      case 'unknown':
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Validation Tools</h1>
        <p className="text-muted-foreground">Check IP reputation and validate email addresses</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* IP Reputation Checker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IP Reputation Checker
            </CardTitle>
            <CardDescription>
              Check if an IP address is listed on spam blacklists
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip-address">IP Address</Label>
              <div className="flex gap-2">
                <Input
                  id="ip-address"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="Enter IP address (e.g., 192.168.1.1)"
                  className="flex-1"
                />
                <Button 
                  onClick={handleCheckReputation} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check'
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">IP: {result.ip}</h3>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {result.confidence}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getReputationIcon()}
                    <span className={`font-medium ${getReputationColor()}`}>
                      {getReputationText()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Details</h4>
                  <p className="text-sm text-muted-foreground">
                    {result.details}
                  </p>
                </div>

                {result.listedOn && result.listedOn.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Listed On</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.listedOn.map((server, index) => (
                        <Badge key={index} variant="destructive">
                          {server}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Errors</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {result.errors.map((error, index) => (
                        <p key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            <p>
              This tool checks the IP address against multiple DNS-based blackhole lists (DNSBLs) 
              to determine if it's associated with spam or malicious activity.
            </p>
          </CardFooter>
        </Card>

        {/* Email Validator (Placeholder for future implementation) */}
        <Card>
          <CardHeader>
            <CardTitle>Email Validator</CardTitle>
            <CardDescription>
              Validate email addresses for format, domain existence, and reputation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This feature will be implemented in a future update. It will provide comprehensive 
              email validation including syntax checking, domain verification, and spam detection.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}