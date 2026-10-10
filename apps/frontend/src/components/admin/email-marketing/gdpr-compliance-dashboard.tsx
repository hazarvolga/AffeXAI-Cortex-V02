'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  FileText, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Trash2,
  Eye,
  UserX
} from 'lucide-react';

interface ComplianceReport {
  reportDate: Date;
  totalSubscribers: number;
  consentedSubscribers: number;
  withdrawnConsents: number;
  pendingRequests: number;
  completedRequests: number;
  dataRetentionCompliance: {
    expiredRecords: number;
    scheduledDeletions: number;
  };
  anonymizationStats: {
    anonymizedRecords: number;
    lastAnonymizationDate: Date;
  };
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    issues: string[];
    recommendations: string[];
  };
}

interface DataSubjectRequest {
  id: string;
  email: string;
  requestType: string;
  requestDate: Date;
  status: string;
  completionDate?: Date;
}

interface ConsentRecord {
  id: string;
  email: string;
  consentType: string;
  consentStatus: string;
  consentDate: Date;
  consentMethod: string;
  legalBasis: string;
}

export default function GdprComplianceDashboard() {
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [dataSubjectRequests, setDataSubjectRequests] = useState<DataSubjectRequest[]>([]);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Load compliance report
      const reportResponse = await fetch('/api/email-marketing/gdpr/compliance-report');
      if (reportResponse.ok) {
        const report = await reportResponse.json();
        setComplianceReport(report.data);
      }

      // Load data subject requests (mock data for now)
      setDataSubjectRequests([
        {
          id: '1',
          email: 'user@example.com',
          requestType: 'ACCESS',
          requestDate: new Date('2024-01-15'),
          status: 'COMPLETED',
          completionDate: new Date('2024-01-16')
        },
        {
          id: '2',
          email: 'another@example.com',
          requestType: 'ERASURE',
          requestDate: new Date('2024-01-20'),
          status: 'PENDING'
        }
      ]);

      // Load consent records (mock data for now)
      setConsentRecords([
        {
          id: '1',
          email: 'user@example.com',
          consentType: 'EMAIL_MARKETING',
          consentStatus: 'GIVEN',
          consentDate: new Date('2024-01-10'),
          consentMethod: 'EXPLICIT_OPT_IN',
          legalBasis: 'CONSENT'
        }
      ]);

    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataRetentionCleanup = async () => {
    try {
      const response = await fetch('/api/email-marketing/gdpr/data-retention/cleanup', {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Cleanup completed: ${result.data.deletedRecords} deleted, ${result.data.anonymizedRecords} anonymized`);
        loadComplianceData();
      }
    } catch (error) {
      console.error('Failed to perform cleanup:', error);
      alert('Cleanup failed. Please try again.');
    }
  };

  const handleDataSubjectRequest = async (email: string, requestType: string) => {
    try {
      const response = await fetch(`/api/email-marketing/gdpr/data-subject-request/${requestType.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${requestType} request processed successfully`);
        loadComplianceData();
      }
    } catch (error) {
      console.error(`Failed to process ${requestType} request:`, error);
      alert(`${requestType} request failed. Please try again.`);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'EXPIRED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GDPR Compliance Dashboard</h1>
          <p className="text-gray-600">Monitor and manage data protection compliance</p>
        </div>
        <Button onClick={loadComplianceData} variant="outline">
          Refresh Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Data Subject Requests</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {complianceReport && (
            <>
              {/* Compliance Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{complianceReport.totalSubscribers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {complianceReport.consentedSubscribers} with valid consent
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Consent Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((complianceReport.consentedSubscribers / complianceReport.totalSubscribers) * 100)}%
                    </div>
                    <Progress 
                      value={(complianceReport.consentedSubscribers / complianceReport.totalSubscribers) * 100} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{complianceReport.pendingRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      {complianceReport.completedRequests} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Badge className={getRiskLevelColor(complianceReport.riskAssessment.level)}>
                      {complianceReport.riskAssessment.level}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {complianceReport.riskAssessment.issues.length} issues identified
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Risk Assessment */}
              {complianceReport.riskAssessment.issues.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Compliance Issues Detected:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {complianceReport.riskAssessment.issues.map((issue, index) => (
                          <li key={index} className="text-sm">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Data Retention Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Retention Compliance</CardTitle>
                  <CardDescription>
                    Monitor data retention policies and scheduled cleanups
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Expired Records</span>
                    <Badge variant="outline">
                      {complianceReport.dataRetentionCompliance.expiredRecords}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Scheduled Deletions</span>
                    <Badge variant="outline">
                      {complianceReport.dataRetentionCompliance.scheduledDeletions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Anonymized Records</span>
                    <Badge variant="outline">
                      {complianceReport.anonymizationStats.anonymizedRecords}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>
                Track and manage GDPR data subject requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataSubjectRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{request.email}</span>
                        <Badge variant="outline">{request.requestType}</Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Requested: {request.requestDate.toLocaleDateString()}
                        {request.completionDate && (
                          <span> • Completed: {request.completionDate.toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {request.status === 'PENDING' && (
                        <Button size="sm" variant="outline">
                          Process
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consent Records</CardTitle>
              <CardDescription>
                View and manage subscriber consent records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consentRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{record.email}</span>
                        <Badge variant="outline">{record.consentType}</Badge>
                        <Badge className={record.consentStatus === 'GIVEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {record.consentStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {record.consentMethod} • {record.legalBasis} • {record.consentDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      {record.consentStatus === 'GIVEN' && (
                        <Button size="sm" variant="outline">
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Retention Actions</CardTitle>
                <CardDescription>
                  Perform automated data retention cleanup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleDataRetentionCleanup} className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Run Data Retention Cleanup
                </Button>
                <p className="text-sm text-gray-600">
                  This will delete or anonymize expired records according to your retention policies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>
                  Generate and download compliance reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Compliance Report
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Consent Records
                </Button>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Export Data Subject Requests
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Data Subject Requests</CardTitle>
                <CardDescription>
                  Process individual data subject requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border rounded-md"
                    id="manual-request-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const email = (document.getElementById('manual-request-email') as HTMLInputElement)?.value;
                      if (email) handleDataSubjectRequest(email, 'ACCESS');
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Access Request
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const email = (document.getElementById('manual-request-email') as HTMLInputElement)?.value;
                      if (email) handleDataSubjectRequest(email, 'ERASURE');
                    }}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Erasure Request
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const email = (document.getElementById('manual-request-email') as HTMLInputElement)?.value;
                      if (email) handleDataSubjectRequest(email, 'PORTABILITY');
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Data Portability
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}