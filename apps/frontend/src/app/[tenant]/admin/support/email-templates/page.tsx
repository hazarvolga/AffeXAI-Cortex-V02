'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, FileCode } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmailTemplate {
  name: string;
  displayName: string;
  description: string;
  category: string;
  variables: string[];
  usedBy: string[];
}

const supportEmailTemplates: EmailTemplate[] = [
  {
    name: "ticket-created-customer",
    displayName: "Ticket Oluşturuldu (Müşteri)",
    description: "Müşteriye yeni ticket oluşturulduğunda gönderilen email",
    category: "Ticket Lifecycle",
    variables: ["customerName", "displayNumber", "subject", "priority", "ticketUrl"],
    usedBy: ["TicketEmailService.sendTicketCreatedEmail()"]
  },
  {
    name: "ticket-created-support",
    displayName: "Ticket Oluşturuldu (Destek Ekibi)",
    description: "Destek ekibine yeni ticket bildirimi",
    category: "Ticket Lifecycle",
    variables: ["displayNumber", "subject", "priority", "customerName", "description", "ticketUrl"],
    usedBy: ["TicketEmailService.sendTicketCreatedEmail()"]
  },
  {
    name: "ticket-assigned",
    displayName: "Ticket Atandı",
    description: "Destek ekibine ticket atandığında gönderilen email",
    category: "Ticket Lifecycle",
    variables: ["assignedToName", "displayNumber", "subject", "customerName", "ticketUrl"],
    usedBy: ["TicketEmailService.sendTicketAssignedEmail()"]
  },
  {
    name: "ticket-new-message",
    displayName: "Yeni Mesaj",
    description: "Ticket'a yeni mesaj eklendiğinde gönderilen email",
    category: "Communication",
    variables: ["recipientName", "displayNumber", "subject", "messageContent", "senderName", "ticketUrl"],
    usedBy: ["TicketEmailService.sendNewMessageEmail()"]
  },
  {
    name: "ticket-resolved",
    displayName: "Ticket Çözüldü",
    description: "Ticket çözüldüğünde müşteriye gönderilen email",
    category: "Ticket Lifecycle",
    variables: ["customerName", "displayNumber", "subject", "resolutionNotes", "ticketUrl", "feedbackUrl"],
    usedBy: ["TicketEmailService.sendTicketResolvedEmail()"]
  },
  {
    name: "ticket-escalated",
    displayName: "Ticket Yükseltildi",
    description: "Ticket yöneticiye yükseltildiğinde gönderilen email",
    category: "Escalation",
    variables: ["recipientName", "displayNumber", "ticketTitle", "priority", "escalationReason", "ticketUrl"],
    usedBy: ["TicketEscalationService.escalateTicket()"]
  },
  {
    name: "sla-approaching-alert",
    displayName: "SLA Yaklaşıyor",
    description: "SLA süresi dolmak üzereyken uyarı emaili",
    category: "SLA",
    variables: ["recipientName", "displayNumber", "ticketTitle", "remainingTime", "slaDeadline", "ticketUrl"],
    usedBy: ["SLAService.checkSLA()"]
  },
  {
    name: "sla-breach-alert",
    displayName: "SLA İhlali",
    description: "SLA süresi aşıldığında uyarı emaili",
    category: "SLA",
    variables: ["recipientName", "displayNumber", "ticketTitle", "breachTime", "ticketUrl"],
    usedBy: ["SLAService.handleSLABreach()"]
  },
  {
    name: "csat-survey",
    displayName: "Memnuniyet Anketi",
    description: "Ticket kapandıktan sonra memnuniyet anketi",
    category: "Survey",
    variables: ["customerName", "ticketTitle", "displayNumber", "surveyUrl", "agentName"],
    usedBy: ["CSATService.sendSurvey()"]
  },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Ticket Lifecycle": "bg-blue-500",
    "Communication": "bg-green-500",
    "Escalation": "bg-orange-500",
    "SLA": "bg-red-500",
    "Survey": "bg-purple-500",
  };
  return colors[category] || "bg-gray-500";
};

export default function SupportEmailTemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Email Şablonları</h1>
          <p className="text-muted-foreground mt-2">
            Ticket sistemi için kullanılan {supportEmailTemplates.length} email şablonu
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/support">
            <Mail className="mr-2 h-4 w-4" />
            Destek Merkezine Dön
          </Link>
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>📧 Modüler Email Mimarisi</CardTitle>
          <CardDescription>
            Her modül kendi email template'lerini yönetir. Tüm template'ler <code>apps/backend/src/modules/tickets/templates/</code> klasöründe bulunur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <FileCode className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">React Email (.tsx)</p>
                <p className="text-sm text-muted-foreground">TypeScript + React components</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileCode className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Compiled (.html)</p>
                <p className="text-sm text-muted-foreground">Handlebars templates</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Shared Components</p>
                <p className="text-sm text-muted-foreground">EmailFooter (tüm modüller)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportEmailTemplates.map((template) => (
          <Card key={template.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.displayName}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Variables */}
              <div>
                <p className="text-sm font-medium mb-2">Template Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Used By */}
              <div>
                <p className="text-sm font-medium mb-2">Kullanıldığı Servisler:</p>
                {template.usedBy.map((service) => (
                  <code key={service} className="text-xs bg-muted px-2 py-1 rounded block">
                    {service}
                  </code>
                ))}
              </div>

              {/* File Paths */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📄 <code>templates/{template.name}.tsx</code></p>
                <p>📄 <code>templates/{template.name}.html</code></p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a
                    href={`vscode://file/Users/hazarekiz/Projects/v06/Affexai/apps/backend/src/modules/tickets/templates/${template.name}.tsx`}
                    target="_blank"
                  >
                    <FileCode className="mr-2 h-3 w-3" />
                    TSX Aç
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a
                    href={`vscode://file/Users/hazarekiz/Projects/v06/Affexai/apps/backend/src/modules/tickets/templates/${template.name}.html`}
                    target="_blank"
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    HTML Aç
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
