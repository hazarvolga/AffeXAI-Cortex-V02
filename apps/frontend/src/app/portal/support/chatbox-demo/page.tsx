'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Bot, 
  Settings, 
  Play,
  Pause,
  RotateCcw,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ChatBox } from '@/components/support/chatbox';
import type { ChatMessage, ChatSession } from '@/components/support/chatbox/ChatBox';

export default function ChatboxDemoPage() {
  const [demoActive, setDemoActive] = useState(false);
  const [sessionType, setSessionType] = useState<'support' | 'general'>('support');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const handleSessionCreate = (session: ChatSession) => {
    setCurrentSession(session);
    console.log('Session created:', session);
  };

  const handleMessageSent = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    console.log('Message sent:', message);
  };

  const resetDemo = () => {
    setMessages([]);
    setCurrentSession(null);
    setDemoActive(false);
  };

  const toggleDemo = () => {
    if (demoActive) {
      setDemoActive(false);
    } else {
      setDemoActive(true);
      setConnectionStatus('connecting');
      // Simulate connection
      setTimeout(() => {
        setConnectionStatus('connected');
      }, 1000);
    }
  };

  const demoFeatures = [
    {
      title: 'Real-time Mesajlaşma',
      description: 'WebSocket tabanlı anlık mesaj gönderme ve alma',
      status: 'implemented'
    },
    {
      title: 'AI Yanıtları',
      description: 'Context-aware AI yanıtları ve streaming desteği',
      status: 'implemented'
    },
    {
      title: 'Dosya Yükleme',
      description: 'Sürükle & bırak ile çoklu dosya yükleme',
      status: 'implemented'
    },
    {
      title: 'URL İşleme',
      description: 'Web sayfası analizi ve içerik çıkarma',
      status: 'implemented'
    },
    {
      title: 'Bağlam Görselleştirme',
      description: 'Kaynak alıntıları ve alaka düzeyi skorları',
      status: 'implemented'
    },
    {
      title: 'Destek Ekibi Entegrasyonu',
      description: 'Canlı destek ve chat transfer özellikleri',
      status: 'planned'
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Support Chatbox Demo</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          AI destekli destek chatbox sisteminin tüm özelliklerini test edin. 
          Real-time mesajlaşma, dosya yükleme, URL analizi ve daha fazlası.
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Demo Kontrolleri</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Demo Durumu:</span>
                <Badge variant={demoActive ? 'default' : 'secondary'}>
                  {demoActive ? 'Aktif' : 'Pasif'}
                </Badge>
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                  {connectionStatus === 'connected' ? 'Bağlı' : 
                   connectionStatus === 'connecting' ? 'Bağlanıyor...' : 'Bağlantı Yok'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Oturum Türü:</span>
                <Tabs value={sessionType} onValueChange={(value) => setSessionType(value as 'support' | 'general')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="support">Destek</TabsTrigger>
                    <TabsTrigger value="general">Genel</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={toggleDemo}
                variant={demoActive ? 'destructive' : 'default'}
              >
                {demoActive ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Durdur
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Başlat
                  </>
                )}
              </Button>
              <Button onClick={resetDemo} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Sıfırla
              </Button>
            </div>
          </div>

          {/* Session Info */}
          {currentSession && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Aktif Oturum:</strong> {currentSession.id.slice(0, 8)}... • 
                Tür: {currentSession.sessionType} • 
                Mesaj Sayısı: {messages.length} • 
                Durum: {currentSession.status}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Özellik Durumu</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                {feature.status === 'implemented' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <Badge variant={feature.status === 'implemented' ? 'default' : 'secondary'} className="text-xs">
                    {feature.status === 'implemented' ? 'Tamamlandı' : 'Planlandı'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Talimatları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Temel Özellikler</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Sağ alt köşedeki chat butonuna tıklayın</li>
                <li>• Mesaj yazın ve Enter'a basın</li>
                <li>• AI yanıtlarını gerçek zamanlı olarak görün</li>
                <li>• Chat penceresini minimize/maximize edin</li>
                <li>• Mobil uyumlu responsive tasarımı test edin</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Gelişmiş Özellikler</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Dosya yükleme butonuna tıklayın (📎)</li>
                <li>• URL paylaşma butonuna tıklayın (🔗)</li>
                <li>• AI yanıtlarındaki kaynak alıntılarını inceleyin</li>
                <li>• Yazma göstergelerini gözlemleyin</li>
                <li>• Bağlam kaynaklarını genişletin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Chatbox */}
      {demoActive && (
        <ChatBox
          sessionType={sessionType}
          onSessionCreate={handleSessionCreate}
          onMessageSent={handleMessageSent}
          className="demo-chatbox"
        />
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Bu demo sayfası geliştirme amaçlıdır. Gerçek AI yanıtları için backend bağlantısı gereklidir.</p>
      </div>
    </div>
  );
}