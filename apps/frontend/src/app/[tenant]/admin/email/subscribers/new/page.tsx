'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Save, Plus, CheckCircle, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import subscribersService, { CreateSubscriberDto } from '@/lib/api/subscribersService';
import groupsService from '@/lib/api/groupsService';
import segmentsService from '@/lib/api/segmentsService';
import emailValidationService from '@/lib/api/emailValidationService';
import { Group } from '@/lib/api/groupsService';
import { Segment } from '@/lib/api/segmentsService';

// Define the enhanced email validation result interface
interface EmailValidationResult {
  email: string;
  isValid: boolean;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  confidence: number;
  checks?: {
    syntax?: { isValid: boolean; details: string };
    domain?: { isValid: boolean; details: string };
    mx?: { isValid: boolean; details: string };
    disposable?: { isValid: boolean; details: string };
    roleAccount?: { isValid: boolean; details: string };
    typo?: { isValid: boolean; details: string; suggestion?: string };
    ipReputation?: { isValid: boolean; details: string; reputation: string; confidence: number };
    domainReputation?: { isValid: boolean; details: string; reputation: string; confidence: number };
  };
  error?: string;
}

export default function NewSubscriberPage() {
  const [subscriber, setSubscriber] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    customerStatus: '',
    subscriptionType: '',
    mailerCheckResult: '',
    status: 'pending' as 'active' | 'pending' | 'unsubscribed',
    groups: [] as string[],
    segments: [] as string[],
  });
  
  const [newGroup, setNewGroup] = useState("");
  const [newSegment, setNewSegment] = useState("");
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  const [showSegmentSuggestions, setShowSegmentSuggestions] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [availableSegments, setAvailableSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [emailValidationResult, setEmailValidationResult] = useState<EmailValidationResult | null>(null);
  const emailValidationTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGroupsAndSegments = async () => {
      try {
        setLoading(true);
        const [groups, segments] = await Promise.all([
          groupsService.getAll(),
          segmentsService.getAll()
        ]);
        setAvailableGroups(groups);
        setAvailableSegments(segments);
      } catch (err) {
        console.error('Error fetching groups and segments:', err);
        setError('Gruplar ve segmentler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupsAndSegments();
  }, []);

  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailValidationResult(null);
      return;
    }

    setValidatingEmail(true);
    try {
      // In a real application, we would get the client's IP address here
      // For now, we'll pass undefined to let the backend use the request IP
      const result = await emailValidationService.validateEmail(email, undefined);
      setEmailValidationResult(result);
      
      // Automatically set the mailerCheckResult field
      setSubscriber(prev => ({
        ...prev,
        mailerCheckResult: result.status
      }));
    } catch (err) {
      console.error('Error validating email:', err);
      setEmailValidationResult({ 
        email,
        isValid: false,
        status: 'unknown',
        confidence: 0
      } as EmailValidationResult);
    } finally {
      setValidatingEmail(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setSubscriber({
      ...subscriber,
      email: value
    });

    // Clear previous validation result
    setEmailValidationResult(null);
    
    // Clear any existing timeout
    if (emailValidationTimeout.current) {
      clearTimeout(emailValidationTimeout.current);
    }
    
    // Set new timeout to validate email after user stops typing
    if (value) {
      emailValidationTimeout.current = setTimeout(() => {
        validateEmail(value);
      }, 500);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await subscribersService.create({
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        company: subscriber.company,
        phone: subscriber.phone,
        customerStatus: subscriber.customerStatus,
        subscriptionType: subscriber.subscriptionType,
        mailerCheckResult: subscriber.mailerCheckResult,
        status: subscriber.status,
        groups: subscriber.groups,
        segments: subscriber.segments,
      });
      
      router.push('/admin/email-marketing/subscribers');
    } catch (err) {
      console.error('Error creating subscriber:', err);
      setError('Abone oluşturulurken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setSubscriber({
      ...subscriber,
      status: value as 'active' | 'pending' | 'unsubscribed',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setSubscriber({
      ...subscriber,
      [field]: value,
    });
  };

  const addGroup = () => {
    if (newGroup.trim() !== "" && !subscriber.groups.includes(newGroup.trim())) {
      setSubscriber({
        ...subscriber,
        groups: [...subscriber.groups, newGroup.trim()],
      });
      setNewGroup("");
      setShowGroupSuggestions(false);
    }
  };

  const removeGroup = (group: string) => {
    setSubscriber({
      ...subscriber,
      groups: subscriber.groups.filter(g => g !== group),
    });
  };

  const addSegment = () => {
    if (newSegment.trim() !== "" && !subscriber.segments.includes(newSegment.trim())) {
      setSubscriber({
        ...subscriber,
        segments: [...subscriber.segments, newSegment.trim()],
      });
      setNewSegment("");
      setShowSegmentSuggestions(false);
    }
  };

  const removeSegment = (segment: string) => {
    setSubscriber({
      ...subscriber,
      segments: subscriber.segments.filter(s => s !== segment),
    });
  };

  const getValidationIcon = () => {
    if (validatingEmail) {
      return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />;
    }
    
    if (!emailValidationResult) return null;
    
    switch (emailValidationResult.status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'risky':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getValidationText = () => {
    if (validatingEmail) return 'Doğrulanıyor...';
    if (!emailValidationResult) return '';
    
    switch (emailValidationResult.status) {
      case 'valid': return 'Geçerli';
      case 'invalid': return 'Geçersiz';
      case 'risky': return 'Riskli';
      default: return 'Bilinmiyor';
    }
  };

  const getValidationColor = () => {
    if (!emailValidationResult) return '';
    
    switch (emailValidationResult.status) {
      case 'valid': return 'text-green-500';
      case 'invalid': return 'text-red-500';
      case 'risky': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/email-marketing/subscribers">
            <X className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Abone Ekle</h1>
          <p className="text-muted-foreground">Yeni bir bülten abonesi oluşturun.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Abone Bilgileri</CardTitle>
          <CardDescription>Abonenin iletişim ve profil bilgilerini girin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="email"
                    type="email"
                    value={subscriber.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="flex-1 pr-10"
                    placeholder="E-posta adresi"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {getValidationIcon()}
                  </div>
                </div>
              </div>
              {emailValidationResult && (
                <div className="space-y-1">
                  <p className={`text-sm ${getValidationColor()}`}>
                    {getValidationText()}
                    {emailValidationResult.confidence !== undefined && ` (Güven: ${emailValidationResult.confidence}%)`}
                  </p>
                  {emailValidationResult.checks?.typo?.suggestion && (
                    <p className="text-sm text-muted-foreground">
                      Muhtemel yazım hatası: {emailValidationResult.checks.typo.suggestion}
                    </p>
                  )}
                  {emailValidationResult.checks?.ipReputation && (
                    <p className="text-sm text-muted-foreground">
                      IP Rep: {emailValidationResult.checks.ipReputation.reputation} 
                      {emailValidationResult.checks.ipReputation.confidence !== undefined && 
                        ` (${emailValidationResult.checks.ipReputation.confidence}% güven)`}
                    </p>
                  )}
                  {emailValidationResult.checks?.domainReputation && (
                    <p className="text-sm text-muted-foreground">
                      Domain Rep: {emailValidationResult.checks.domainReputation.reputation}
                      {emailValidationResult.checks.domainReputation.confidence !== undefined && 
                        ` (${emailValidationResult.checks.domainReputation.confidence}% güven)`}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select value={subscriber.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="pending">Onay Bekliyor</SelectItem>
                  <SelectItem value="unsubscribed">İptal Edilmiş</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ad</Label>
              <Input
                id="firstName"
                value={subscriber.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Ad"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Soyad</Label>
              <Input
                id="lastName"
                value={subscriber.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Soyad"
              />
            </div>
          </div>

          {/* Company and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company">Şirket</Label>
              <Input
                id="company"
                value={subscriber.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Şirket adı"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={subscriber.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Telefon numarası"
              />
            </div>
          </div>

          <Separator />

          {/* Customer Status and Subscription Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customerStatus">Müşteri Durumu</Label>
              <Input
                id="customerStatus"
                value={subscriber.customerStatus}
                onChange={(e) => handleInputChange('customerStatus', e.target.value)}
                placeholder="Müşteri durumu"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subscriptionType">Kalıcı/SUB/SSA</Label>
              <Input
                id="subscriptionType"
                value={subscriber.subscriptionType}
                onChange={(e) => handleInputChange('subscriptionType', e.target.value)}
                placeholder="Abonelik Türü"
              />
            </div>
          </div>

          <Separator />

          {/* Groups */}
          <div className="space-y-2">
            <Label htmlFor="groups">Gruplar</Label>
            <div className="flex gap-2">
              <Input
                id="groups"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addGroup();
                  }
                }}
                placeholder="Grup adı girin"
              />
              <Button type="button" onClick={addGroup} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {subscriber.groups.map((group) => (
                <Badge key={group} variant="secondary" className="gap-1 pr-1">
                  {group}
                  <button
                    type="button"
                    onClick={() => removeGroup(group)}
                    className="rounded-full hover:bg-secondary-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Segments */}
          <div className="space-y-2">
            <Label htmlFor="segments">Segmentler</Label>
            <div className="flex gap-2">
              <Input
                id="segments"
                value={newSegment}
                onChange={(e) => setNewSegment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSegment();
                  }
                }}
                placeholder="Segment adı girin"
              />
              <Button type="button" onClick={addSegment} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {subscriber.segments.map((segment) => (
                <Badge key={segment} variant="secondary" className="gap-1 pr-1">
                  {segment}
                  <button
                    type="button"
                    onClick={() => removeSegment(segment)}
                    className="rounded-full hover:bg-secondary-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* MailerCheck Result */}
          <div className="space-y-2">
            <Label htmlFor="mailerCheckResult">MailerCheck result</Label>
            <Input
              id="mailerCheckResult"
              value={subscriber.mailerCheckResult}
              onChange={(e) => handleInputChange('mailerCheckResult', e.target.value)}
              placeholder="MailerCheck Sonucu"
            />
            <p className="text-sm text-muted-foreground">
              E-posta doğrulama sonucu otomatik olarak doldurulur, ancak manuel olarak da düzenleyebilirsiniz.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/email-marketing/subscribers">İptal</Link>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !subscriber.email}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Kaydediliyor...' : 'Abone Ekle'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}