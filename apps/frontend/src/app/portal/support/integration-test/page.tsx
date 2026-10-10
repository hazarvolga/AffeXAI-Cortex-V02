'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  FileText, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock components for testing
const MockChatBox = ({ embedded, showHeader, height, className }: any) => (
  <div className={cn("bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center", className)} style={{ height }}>
    <div className="text-center">
      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">ChatBox Component</p>
      <p className="text-xs text-gray-400">Embedded: {embedded ? 'Yes' : 'No'}</p>
      <p className="text-xs text-gray-400">Header: {showHeader ? 'Yes' : 'No'}</p>
    </div>
  </div>
);

const MockForm = () => (
  <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 h-full flex items-center justify-center">
    <div className="text-center">
      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-400" />
      <p className="text-sm text-blue-600">Support Form Component</p>
      <p className="text-xs text-blue-400">Form fields would be here</p>
    </div>
  </div>
);

export default function IntegrationTestPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'chat' | 'both'>('form');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);

  const toggleChatVisibility = () => {
    const newVisibility = !isChatVisible;
    setIsChatVisible(newVisibility);
    
    if (newVisibility) {
      setIsChatMinimized(false);
      if (activeTab === 'form') {
        setActiveTab('both');
      }
    } else {
      if (activeTab === 'both') {
        setActiveTab('form');
      }
    }
  };

  const toggleChatMinimized = () => {
    setIsChatMinimized(!isChatMinimized);
  };

  const handleTabChange = (value: string) => {
    const newTab = value as 'form' | 'chat' | 'both';
    setActiveTab(newTab);
    
    if ((newTab === 'chat' || newTab === 'both') && !isChatVisible) {
      setIsChatVisible(true);
    }
    
    if (newTab === 'form' && isChatVisible) {
      setIsChatVisible(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal Support Integration Test</h1>
          <p className="text-muted-foreground">
            Testing the chatbox integration with side-by-side layout and toggle functionality.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === 'both' ? "default" : "outline"}
            onClick={() => handleTabChange(activeTab === 'both' ? 'form' : 'both')}
            className="flex items-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{activeTab === 'both' ? 'Yan Yana Görünüm' : 'Form + Chat'}</span>
          </Button>
          <Button
            variant={isChatVisible ? "default" : "outline"}
            onClick={toggleChatVisibility}
            className="flex items-center space-x-2"
          >
            {isChatVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{isChatVisible ? 'Chat\'i Gizle' : 'AI Chat\'i Göster'}</span>
          </Button>
        </div>
      </div>

      {/* Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium">Active Tab</p>
              <Badge variant="outline">{activeTab}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Chat Visible</p>
              <Badge variant={isChatVisible ? "default" : "secondary"}>
                {isChatVisible ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Chat Minimized</p>
              <Badge variant={isChatMinimized ? "default" : "secondary"}>
                {isChatMinimized ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Chat Session</p>
              <Badge variant={chatSession ? "default" : "secondary"}>
                {chatSession ? 'Active' : 'None'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Destek Formu</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>AI Sohbet</span>
            {chatSession && (
              <Badge variant="secondary" className="ml-2">
                Aktif
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="both" className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <MessageCircle className="h-3 w-3" />
            </div>
            <span>Yan Yana</span>
          </TabsTrigger>
        </TabsList>

        {/* Form Tab */}
        <TabsContent value="form" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Form Only</CardTitle>
            </CardHeader>
            <CardContent>
              <MockForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-6">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>AI Chat Only</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full">
              <MockChatBox
                embedded={true}
                showHeader={false}
                height="100%"
                className="w-full h-full"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Side-by-Side Tab */}
        <TabsContent value="both" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px]">
            {/* Form Section */}
            <div className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Destek Talebi Formu</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Detaylı destek talebi oluşturun
                </p>
              </div>
              
              <Card className="flex-1">
                <CardContent className="p-6 h-full">
                  <MockForm />
                </CardContent>
              </Card>
            </div>

            {/* Chat Section */}
            <div className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>AI Destek Asistanı</span>
                    {chatSession && (
                      <Badge variant="outline" className="ml-2">
                        Aktif
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Anında yardım alın veya destek ekibiyle iletişime geçin
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleChatMinimized}
                    className="h-8 w-8"
                  >
                    {isChatMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Card className={cn(
                "flex-1 transition-all duration-300",
                isChatMinimized ? "h-16" : "h-full"
              )}>
                {isChatMinimized ? (
                  <CardContent className="flex items-center justify-center h-full">
                    <Button
                      variant="ghost"
                      onClick={toggleChatMinimized}
                      className="flex items-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat'i Genişlet</span>
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="p-0 h-full">
                    <MockChatBox
                      embedded={true}
                      showHeader={false}
                      height="100%"
                      className="w-full h-full"
                    />
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Buttons (Mobile) */}
      {(!isChatVisible || (activeTab !== 'chat' && activeTab !== 'both')) && (
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          <Button
            onClick={() => {
              if (!isChatVisible) {
                toggleChatVisibility();
              }
              handleTabChange('chat');
            }}
            className="rounded-full h-14 w-14 shadow-lg"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          {chatSession && (
            <Badge variant="secondary" className="absolute -top-2 -left-2 text-xs">
              Aktif
            </Badge>
          )}
        </div>
      )}

      {isChatVisible && activeTab === 'both' && (
        <div className="fixed bottom-4 left-4 z-40 lg:hidden">
          <Button
            onClick={toggleChatMinimized}
            variant="outline"
            className="rounded-full h-12 w-12 shadow-lg"
            size="icon"
          >
            {isChatMinimized ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
}