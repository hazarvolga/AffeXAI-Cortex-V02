'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import settingsService, { SiteSettings } from '@/lib/api/settingsService';

export default function SettingsTestPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSiteSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    if (!settings) return;
    
    try {
      setUpdating(true);
      const updatedSettings = await settingsService.updateSiteSettings(settings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: keyof SiteSettings, value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        [field]: value
      });
    }
  };

  const handleContactChange = (field: keyof SiteSettings['contact'], value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        contact: {
          ...settings.contact,
          [field]: value
        }
      });
    }
  };

  const handleSeoChange = (field: keyof SiteSettings['seo'], value: string) => {
    if (settings) {
      setSettings({
        ...settings,
        seo: {
          ...settings.seo,
          [field]: value
        }
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings API Test</h2>
        <p className="text-muted-foreground">
          Test the new backend settings API integration
        </p>
      </div>

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl}
                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoDarkUrl">Dark Logo URL</Label>
              <Input
                id="logoDarkUrl"
                value={settings.logoDarkUrl}
                onChange={(e) => handleInputChange('logoDarkUrl', e.target.value)}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={settings.contact.address}
                    onChange={(e) => handleContactChange('address', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.contact.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.contact.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTitle">Default Title</Label>
                  <Input
                    id="defaultTitle"
                    value={settings.seo.defaultTitle}
                    onChange={(e) => handleSeoChange('defaultTitle', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultDescription">Default Description</Label>
                  <Input
                    id="defaultDescription"
                    value={settings.seo.defaultDescription}
                    onChange={(e) => handleSeoChange('defaultDescription', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2">
              <Button onClick={updateSettings} disabled={updating}>
                {updating ? 'Updating...' : 'Update Settings'}
              </Button>
              <Button variant="outline" onClick={fetchSettings}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}