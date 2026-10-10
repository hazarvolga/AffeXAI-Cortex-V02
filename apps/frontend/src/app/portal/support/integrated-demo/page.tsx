'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  FileText, 
  Lightbulb, 
  CheckCircle,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

export default function IntegratedDemoPage() {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getViewportClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portal Entegrasyonu Demo</h2>
          <p className="text-muted-foreground">
            Chatbox'ın portal destek sayfasına entegrasyonunun demo görünümü
          </p>
        </div>
        
        {/* Viewport Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={viewMode === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tablet')}
          >
            <Tablet className="h-4 w-4 mr-2" />
            Tablet
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>
      </div>

      {/* Integration Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Responsive Layout</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Desktop: Side-by-side form ve chat</li>
              <li>• Tablet: Stacked layout</li>
              <li>• Mobile: Tab-based navigation</li>
              <li>• Floating chat button</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>State Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• LocalStorage persistence</li>
              <li>• Tab state korunması</li>
              <li>• Chat visibility toggle</li>
              <li>• Session management</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>User Experience</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Seamless form-chat geçiş</li>
              <li>• Quick action buttons</li>
              <li>• Contextual help</li>
              <li>• Progressive disclosure</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Demo Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Entegrasyon Önizlemesi</CardTitle>
          <CardDescription>
            Gerçek portal sayfasının {viewMode} görünümü
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`transition-all duration-300 ${getViewportClass()}`}>
            <div className="border rounded-lg p-4 bg-background">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Destek Merkezi</h3>
                    <p className="text-sm text-muted-foreground">
                      Destek talebi oluşturun veya AI asistanımızla sohbet edin
                    </p>
                  </div>
                  {viewMode === 'desktop' && (
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      AI Chat'i Göster
                    </Button>
                  )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="form" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="form" className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Destek Formu</span>
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>AI Sohbet</span>
                      <Badge variant="secondary" className="ml-2">Aktif</Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="form" className="mt-4">
                    <div className={`grid gap-4 ${viewMode === 'desktop' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                      <div className={viewMode === 'desktop' ? 'col-span-2' : ''}>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Destek Talebi Formu</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="h-4 bg-muted rounded w-16"></div>
                                <div className="h-10 bg-muted rounded"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-muted rounded w-20"></div>
                                <div className="h-10 bg-muted rounded"></div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-4 bg-muted rounded w-24"></div>
                              <div className="h-32 bg-muted rounded"></div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {viewMode === 'desktop' && (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center space-x-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                <span>İpuçları</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                              <div className="h-3 bg-muted rounded w-full"></div>
                              <div className="h-3 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-5/6"></div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="mt-4">
                    <div className={`grid gap-4 ${viewMode === 'desktop' ? 'grid-cols-4' : 'grid-cols-1'}`}>
                      <div className={viewMode === 'desktop' ? 'col-span-3' : ''}>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <MessageCircle className="h-5 w-5" />
                              <span>AI Destek Asistanı</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-96 bg-muted rounded flex items-center justify-center">
                              <div className="text-center space-y-2">
                                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Chatbox bileşeni burada görünür
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {viewMode === 'desktop' && (
                        <div className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Özellikler</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Real-time</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>Dosya yükleme</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Mobile floating button */}
                {viewMode === 'mobile' && (
                  <div className="fixed bottom-4 right-4">
                    <Button className="rounded-full h-12 w-12 shadow-lg" size="icon">
                      <MessageCircle className="h-6 w-6" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Teknik Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Responsive Breakpoints</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Mobile: &lt; 768px - Tab navigation</li>
                <li>• Tablet: 768px - 1024px - Stacked layout</li>
                <li>• Desktop: &gt; 1024px - Side-by-side</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">State Persistence</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• localStorage için tab durumu</li>
                <li>• Chat visibility tercihi</li>
                <li>• Session bilgileri</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Deneyimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Navigation Flow</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Form → Chat geçişi</li>
                <li>• Quick action buttons</li>
                <li>• Contextual help sidebar</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Accessibility</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Keyboard navigation</li>
                <li>• Screen reader support</li>
                <li>• Focus management</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button asChild>
          <a href="/portal/support/new">
            Gerçek Sayfayı Görüntüle
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/portal/support/chatbox-demo">
            Chatbox Demo
          </a>
        </Button>
      </div>
    </div>
  );
}