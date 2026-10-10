'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Code, FileCode, ShieldCheck } from "lucide-react";

interface EmailTemplate {
  name: string;
  displayName: string;
  description: string;
  category: string;
  variables: string[];
  usedBy: string[];
}

const authEmailTemplates: EmailTemplate[] = [
  {
    name: "welcome-email",
    displayName: "Hoş Geldiniz",
    description: "Yeni kullanıcı kaydı tamamlandığında gönderilen karşılama emaili",
    category: "Authentication",
    variables: [
      "recipientName",
      "portalUrl"
    ],
    usedBy: [
      "AuthService.register()",
      "UsersService.createUser()"
    ]
  },
  {
    name: "email-verification",
    displayName: "Email Doğrulama",
    description: "Kullanıcının email adresini doğrulaması için gönderilen link içeren email",
    category: "Authentication",
    variables: [
      "recipientName",
      "verificationUrl"
    ],
    usedBy: [
      "AuthService.sendVerificationEmail()",
      "EmailVerificationService.send()"
    ]
  },
  {
    name: "password-reset",
    displayName: "Şifre Sıfırlama",
    description: "Kullanıcı şifresini unuttuğunda gönderilen şifre sıfırlama linki",
    category: "Authentication",
    variables: [
      "recipientName",
      "resetUrl"
    ],
    usedBy: [
      "AuthService.forgotPassword()",
      "PasswordResetService.sendResetLink()"
    ]
  },
  {
    name: "password-changed",
    displayName: "Şifre Değişikliği Bildirimi",
    description: "Şifre başarıyla değiştirildiğinde gönderilen bilgilendirme emaili",
    category: "Security",
    variables: [
      "recipientName",
      "changeDate",
      "ipAddress"
    ],
    usedBy: [
      "AuthService.changePassword()",
      "UsersService.updatePassword()"
    ]
  },
  {
    name: "account-locked",
    displayName: "Hesap Kilitlendi",
    description: "Çok fazla başarısız giriş denemesi sonrası hesap kilitlendiğinde gönderilen email",
    category: "Security",
    variables: [
      "recipientName",
      "lockDuration",
      "unlockUrl"
    ],
    usedBy: [
      "AuthService.lockAccount()",
      "SecurityService.handleBruteForce()"
    ]
  },
  {
    name: "new-login-alert",
    displayName: "Yeni Giriş Uyarısı",
    description: "Farklı bir cihaz veya lokasyondan giriş yapıldığında gönderilen güvenlik uyarısı",
    category: "Security",
    variables: [
      "recipientName",
      "deviceInfo",
      "location",
      "loginDate",
      "ipAddress"
    ],
    usedBy: [
      "AuthService.login()",
      "SecurityService.detectNewDevice()"
    ]
  }
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Authentication": "bg-green-500",
    "Security": "bg-red-500",
  };
  return colors[category] || "bg-gray-500";
};

export default function UsersEmailTemplatesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Kullanıcı Yönetimi - Email Şablonları
          </h1>
          <p className="text-muted-foreground mt-2">
            Kimlik doğrulama ve kullanıcı yönetimi modülünde kullanılan email şablonları
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {authEmailTemplates.length} Şablon
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Şablon Dosya Konumu
          </CardTitle>
          <CardDescription>
            Backend email template dosyalarının konumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="h-4 w-4" />
              <span className="text-muted-foreground">Database Templates (Transactional):</span>
            </div>
            <code className="text-primary">
              apps/backend/src/database/seeds/email-templates.seed.ts
            </code>

            <div className="flex items-center gap-2 mt-4 mb-2">
              <FileCode className="h-4 w-4" />
              <span className="text-muted-foreground">React Email Templates (Gelecek):</span>
            </div>
            <code className="text-primary">
              apps/backend/src/modules/auth/templates/
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {authEmailTemplates.map((template) => (
          <Card key={template.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.category === "Security" ? (
                      <ShieldCheck className="h-5 w-5 text-red-500" />
                    ) : (
                      <Mail className="h-5 w-5 text-primary" />
                    )}
                    {template.displayName}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                </div>
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variables Section */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Değişkenler ({template.variables.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="font-mono">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Usage Section */}
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Kullanıldığı Yerler
                </h4>
                <div className="space-y-1">
                  {template.usedBy.map((usage, index) => (
                    <div key={index} className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded">
                      {usage}
                    </div>
                  ))}
                </div>
              </div>

              {/* VSCode Deep Link */}
              <div className="pt-2 border-t">
                <a
                  href={`vscode://file/Users/hazarekiz/Projects/v06/Affexai/apps/backend/src/database/seeds/email-templates.seed.ts`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <FileCode className="h-4 w-4" />
                  VSCode'da Aç →
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">
            💡 Template Kullanım Örnekleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-green-800 dark:text-green-200">
          <div>
            <strong>Hoş Geldiniz Emaili Gönderme:</strong>
            <pre className="mt-2 bg-white dark:bg-gray-900 p-3 rounded border border-green-200 dark:border-green-800 overflow-x-auto">
{`await this.mailService.sendEmail({
  to: user.email,
  templateName: 'welcome-email',
  variables: {
    recipientName: user.name,
    portalUrl: \`\${baseUrl}/portal\`
  }
});`}
            </pre>
          </div>

          <div>
            <strong>Email Doğrulama Gönderme:</strong>
            <pre className="mt-2 bg-white dark:bg-gray-900 p-3 rounded border border-green-200 dark:border-green-800 overflow-x-auto">
{`const verificationToken = await this.generateToken(user);
await this.mailService.sendEmail({
  to: user.email,
  templateName: 'email-verification',
  variables: {
    recipientName: user.name,
    verificationUrl: \`\${baseUrl}/verify?token=\${verificationToken}\`
  }
});`}
            </pre>
          </div>

          <div>
            <strong>Şifre Sıfırlama Linki Gönderme:</strong>
            <pre className="mt-2 bg-white dark:bg-gray-900 p-3 rounded border border-green-200 dark:border-green-800 overflow-x-auto">
{`const resetToken = await this.generateResetToken(user);
await this.mailService.sendEmail({
  to: user.email,
  templateName: 'password-reset',
  variables: {
    recipientName: user.name,
    resetUrl: \`\${baseUrl}/reset-password?token=\${resetToken}\`
  }
});`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Güvenlik Notları
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p>
            <strong>Token Güvenliği:</strong> Tüm verification ve reset token'ları kriptografik olarak güvenli olmalı ve expiry date içermelidir.
          </p>
          <p>
            <strong>Rate Limiting:</strong> Email gönderimi rate limiting ile korunmalıdır (örn: 5 email/saat/user).
          </p>
          <p>
            <strong>IP Tracking:</strong> Güvenlik email'lerinde IP adresi ve device bilgisi her zaman loglanmalıdır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
