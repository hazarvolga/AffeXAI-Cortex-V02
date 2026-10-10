'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Code, FileCode } from "lucide-react";

interface EmailTemplate {
  name: string;
  displayName: string;
  description: string;
  category: string;
  variables: string[];
  usedBy: string[];
}

const eventsEmailTemplates: EmailTemplate[] = [
  {
    name: "event-registration-confirmation",
    displayName: "Etkinlik Kayıt Onayı",
    description: "Kullanıcı bir etkinliğe kaydolduğunda gönderilen onay emaili",
    category: "Transactional",
    variables: [
      "recipientName",
      "eventName",
      "eventDate",
      "eventTime",
      "location",
      "eventUrl"
    ],
    usedBy: [
      "EventsService.registerToEvent()",
      "EventRegistrationController.register()"
    ]
  },
  {
    name: "event-reminder",
    displayName: "Etkinlik Hatırlatma",
    description: "Etkinlik başlamadan önce katılımcılara gönderilen hatırlatma emaili",
    category: "Notification",
    variables: [
      "recipientName",
      "eventName",
      "eventDate",
      "eventTime",
      "location",
      "eventUrl",
      "daysUntilEvent"
    ],
    usedBy: [
      "EventReminderJob.sendReminders()",
      "EventsService.sendEventReminder()"
    ]
  },
  {
    name: "event-cancellation",
    displayName: "Etkinlik İptali",
    description: "Etkinlik iptal edildiğinde katılımcılara gönderilen bilgilendirme emaili",
    category: "Notification",
    variables: [
      "recipientName",
      "eventName",
      "eventDate",
      "cancellationReason",
      "refundInfo"
    ],
    usedBy: [
      "EventsService.cancelEvent()",
      "EventCancellationJob.notifyParticipants()"
    ]
  },
  {
    name: "event-update",
    displayName: "Etkinlik Güncelleme",
    description: "Etkinlik detayları değiştiğinde katılımcılara gönderilen bilgilendirme emaili",
    category: "Notification",
    variables: [
      "recipientName",
      "eventName",
      "eventDate",
      "changes",
      "eventUrl"
    ],
    usedBy: [
      "EventsService.updateEvent()",
      "EventUpdateJob.notifyParticipants()"
    ]
  }
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Transactional": "bg-blue-500",
    "Notification": "bg-purple-500",
  };
  return colors[category] || "bg-gray-500";
};

export default function EventsEmailTemplatesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Etkinlikler - Email Şablonları
          </h1>
          <p className="text-muted-foreground mt-2">
            Etkinlik modülünde kullanılan tüm email şablonları ve değişkenler
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {eventsEmailTemplates.length} Şablon
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
              apps/backend/src/modules/events/templates/
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {eventsEmailTemplates.map((template) => (
          <Card key={template.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
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

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            💡 Template Kullanım Örnekleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>Kayıt Onayı Gönderme:</strong>
            <pre className="mt-2 bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-800 overflow-x-auto">
{`await this.mailService.sendEmail({
  to: user.email,
  templateName: 'event-registration-confirmation',
  variables: {
    recipientName: user.name,
    eventName: event.title,
    eventDate: event.startDate,
    eventTime: event.startTime,
    location: event.location,
    eventUrl: \`\${baseUrl}/events/\${event.id}\`
  }
});`}
            </pre>
          </div>

          <div>
            <strong>Hatırlatma Gönderme:</strong>
            <pre className="mt-2 bg-white dark:bg-gray-900 p-3 rounded border border-blue-200 dark:border-blue-800 overflow-x-auto">
{`await this.mailService.sendEmail({
  to: participant.email,
  templateName: 'event-reminder',
  variables: {
    recipientName: participant.name,
    eventName: event.title,
    eventDate: event.startDate,
    eventTime: event.startTime,
    location: event.location,
    eventUrl: \`\${baseUrl}/events/\${event.id}\`,
    daysUntilEvent: 3
  }
});`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
