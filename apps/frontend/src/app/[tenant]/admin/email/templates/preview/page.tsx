'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Import all email templates
import { WelcomeEmail } from '@/emails/welcome';
import { PasswordResetEmail } from '@/emails/password-reset';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { AbandonedCartEmail } from '@/emails/abandoned-cart';
import { MonthlyNewsletterEmail as NewsletterEmail } from '@/emails/monthly-newsletter';
import { InvoiceEmail } from '@/emails/invoice';
import { ShippingUpdatesEmail as ShippingUpdateEmail } from '@/emails/shipping-updates';
import { SecurityAlertEmail } from '@/emails/security-alert';

const templates = [
  { id: 'welcome', name: 'Hoş Geldin', component: WelcomeEmail, category: 'transactional' },
  { id: 'password-reset', name: 'Şifre Sıfırlama', component: PasswordResetEmail, category: 'transactional' },
  { id: 'order-confirmation', name: 'Sipariş Onayı', component: OrderConfirmationEmail, category: 'transactional' },
  { id: 'abandoned-cart', name: 'Terk Edilmiş Sepet', component: AbandonedCartEmail, category: 'marketing' },
  { id: 'newsletter', name: 'Aylık Bülten', component: NewsletterEmail, category: 'marketing' },
  { id: 'invoice', name: 'Fatura', component: InvoiceEmail, category: 'transactional' },
  { id: 'shipping', name: 'Kargo Güncelleme', component: ShippingUpdateEmail, category: 'transactional' },
  { id: 'security', name: 'Güvenlik Uyarısı', component: SecurityAlertEmail, category: 'transactional' },
];

export default function EmailTemplatePreview() {
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [userName, setUserName] = useState('Ahmet Yılmaz');
  const [category, setCategory] = useState('all');

  const filteredTemplates = templates.filter(t =>
    category === 'all' || t.category === category
  );

  const currentTemplate = templates.find(t => t.id === selectedTemplate);
  const EmailComponent = currentTemplate?.component;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Template Önizleme</h1>
          <p className="text-muted-foreground">
            Tüm email template'lerinizi burada önizleyebilir ve test edebilirsiniz
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sol Panel - Template Listesi */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Template Seçimi</CardTitle>
              <CardDescription>Önizlemek için bir template seçin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="transactional">İşlemsel</SelectItem>
                    <SelectItem value="marketing">Pazarlama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Test Verileri</Label>
                <Input
                  placeholder="Kullanıcı Adı"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Panel - Template Önizleme */}
        <div className="col-span-9">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{currentTemplate?.name} Önizleme</CardTitle>
                  <CardDescription>
                    Site ayarlarınızdaki bilgiler otomatik olarak kullanılıyor
                  </CardDescription>
                </div>
                <Button variant="outline">Test Email Gönder</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="desktop" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="desktop">Masaüstü</TabsTrigger>
                  <TabsTrigger value="mobile">Mobil</TabsTrigger>
                </TabsList>
                <TabsContent value="desktop" className="mt-6">
                  <div className="border rounded-lg bg-gray-50 p-8">
                    <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
                      {EmailComponent && (
                        <div dangerouslySetInnerHTML={{
                          __html: renderEmailToHtml(<EmailComponent userName={userName} />)
                        }} />
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="mobile" className="mt-6">
                  <div className="border rounded-lg bg-gray-50 p-8">
                    <div className="bg-white rounded-lg shadow-lg max-w-sm mx-auto">
                      {EmailComponent && (
                        <div dangerouslySetInnerHTML={{
                          __html: renderEmailToHtml(<EmailComponent userName={userName} />)
                        }} />
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to render React Email component to HTML
function renderEmailToHtml(component: React.ReactElement): string {
  // This is a simplified version - in production you'd use @react-email/render
  return '<div>Email Preview Loading...</div>';
}