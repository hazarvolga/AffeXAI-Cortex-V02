'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield, Users, Clock } from 'lucide-react';
import { useState } from 'react';

export enum ActionImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface ApprovalSettingsProps {
  requiresApproval: boolean;
  impactLevel: ActionImpactLevel;
  onRequiresApprovalChange: (value: boolean) => void;
  onImpactLevelChange: (value: ActionImpactLevel) => void;
}

const impactLevelConfig = {
  [ActionImpactLevel.LOW]: {
    label: 'Düşük Etki',
    description: 'Otomatik onaylama - Düşük riskli işlemler (bildirimler, iç kayıtlar)',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle,
    requiredApprovals: 0,
    expirationTime: '-',
    examples: [
      'İç bildirim gönderme',
      'Aktivite kaydı oluşturma',
      'Dashboard verisi güncelleme',
    ],
  },
  [ActionImpactLevel.MEDIUM]: {
    label: 'Orta Etki',
    description: 'Tek onay gerekli - Standart işlemler (e-posta, içerik)',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: Shield,
    requiredApprovals: 1,
    expirationTime: '24 saat',
    examples: [
      'E-posta kampanyası gönderme',
      'CMS içeriği yayınlama',
      'Etkinlik yayınlama',
    ],
  },
  [ActionImpactLevel.HIGH]: {
    label: 'Yüksek Etki',
    description: 'Çift onay gerekli - Kritik işlemler (toplu işlemler, dış sistemler)',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    icon: AlertTriangle,
    requiredApprovals: 2,
    expirationTime: '4 saat',
    examples: [
      'Toplu e-posta gönderimi (>1000 alıcı)',
      'Webhook tetikleme',
      'Sertifika toplu gönderimi',
    ],
  },
  [ActionImpactLevel.CRITICAL]: {
    label: 'Kritik Etki',
    description: 'Üçlü onay gerekli - Çok kritik işlemler (veri silme, sistem değişiklikleri)',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: AlertTriangle,
    requiredApprovals: 3,
    expirationTime: '1 saat',
    examples: [
      'Toplu veri silme',
      'Sistem ayarı değişikliği',
      'Yüksek bütçeli kampanya',
    ],
  },
};

export default function ApprovalSettings({
  requiresApproval,
  impactLevel,
  onRequiresApprovalChange,
  onImpactLevelChange,
}: ApprovalSettingsProps) {
  const config = impactLevelConfig[impactLevel];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Onay Ayarları
        </CardTitle>
        <CardDescription>
          Otomasyonun çalışması için onay gerektirip gerektirmediğini ayarlayın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Requires Approval Toggle */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="requires-approval" className="text-base font-medium">
              Onay Gerektir
            </Label>
            <p className="text-sm text-muted-foreground">
              Bu otomasyon çalışmadan önce yetkili bir kullanıcının onayını al
            </p>
          </div>
          <Switch
            id="requires-approval"
            checked={requiresApproval}
            onCheckedChange={onRequiresApprovalChange}
          />
        </div>

        {requiresApproval && (
          <>
            <div className="space-y-3">
              <Label htmlFor="impact-level">Etki Seviyesi</Label>
              <Select
                value={impactLevel}
                onValueChange={(value) => onImpactLevelChange(value as ActionImpactLevel)}
              >
                <SelectTrigger id="impact-level">
                  <SelectValue placeholder="Etki seviyesi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(impactLevelConfig).map(([level, cfg]) => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <cfg.icon className="h-4 w-4" />
                        {cfg.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>

            {/* Impact Level Details */}
            <Alert>
              <Icon className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Seçilen Seviye:</span>
                    <Badge className={config.color}>
                      {config.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Gerekli Onay</p>
                        <p className="text-muted-foreground">
                          {config.requiredApprovals === 0
                            ? 'Otomatik'
                            : `${config.requiredApprovals} kişi`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Süre Aşımı</p>
                        <p className="text-muted-foreground">
                          {config.expirationTime}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Kullanım Örnekleri:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {config.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Warning for Critical */}
            {impactLevel === ActionImpactLevel.CRITICAL && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dikkat!</strong> Kritik seviye otomasyonlar 3 farklı yetkili
                  kullanıcının onayını gerektirir ve 1 saat içinde onaylanmazsa iptal olur.
                  Sadece gerçekten kritik işlemler için kullanın.
                </AlertDescription>
              </Alert>
            )}

            {/* Info for Low */}
            {impactLevel === ActionImpactLevel.LOW && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Düşük etki seviyesinde "Onay Gerektir" açık olsa bile, otomasyon
                  otomatik olarak onaylanıp çalıştırılır. Bu ayar sadece kayıt tutma
                  amaçlıdır.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
