
'use client';

import { supportTickets, SupportTicket } from '@/lib/support-data';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Clock,
  User,
  Hash,
  Tag,
  Shield,
  Send,
  Paperclip,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState, useRef } from "react";
import { use } from "react";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { ticketId } = unwrappedParams;
  
  const [ticket, setTicket] = useState<SupportTicket | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedTicket = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedTicket.current) return;
    hasFetchedTicket.current = true;
    
    const fetchTicket = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch the ticket data from an API
        // For now, we're using mock data
        const ticketData = supportTickets.find(t => t.id === ticketId);
        if (!ticketData) {
          notFound();
          return;
        }
        setTicket(ticketData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching ticket:', err);
        setError('Talep bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!ticket) {
    notFound();
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('');
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
            <CardDescription>
              {ticket.user.name} tarafından{' '}
              {new Date(ticket.createdAt).toLocaleString('tr-TR', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}{' '}
              tarihinde oluşturuldu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {ticket.messages.map((message, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={message.author.avatarUrl} />
                    <AvatarFallback>
                      {getInitials(message.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{message.author.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="mt-2 p-4 bg-secondary/50 rounded-lg whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cevap Yaz</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Cevabınızı buraya yazın..."
              className="min-h-[150px]"
            />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Dosya Ekle</span>
              </Button>
            </div>
            <Button>
              <Send className="mr-2 h-4 w-4" /> Cevabı Gönder
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Talep Yönetimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Durum</Label>
              <Select defaultValue={ticket.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Açık</SelectItem>
                  <SelectItem value="In Progress">İşlemde</SelectItem>
                  <SelectItem value="Resolved">Çözüldü</SelectItem>
                  <SelectItem value="Closed">Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Öncelik</Label>
              <Select defaultValue={ticket.priority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Düşük</SelectItem>
                  <SelectItem value="Medium">Orta</SelectItem>
                  <SelectItem value="High">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Atanan Kişi</Label>
              <Select defaultValue={ticket.assignee.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usr-001">Ahmet Yılmaz (Admin)</SelectItem>
                  <SelectItem value="usr-002">Zeynep Kaya (Destek)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">Değişiklikleri Kaydet</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Talep Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" /> Talep ID
              </span>
              <span className="font-mono text-xs">#{ticket.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" /> Kategori
              </span>
              <Badge variant="outline">{ticket.category}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Oluşturulma
              </span>
              <span>
                {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-semibold">
              <span className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Müşteri
              </span>
              <span>{ticket.user.name}</span>
            </div>
            <p className="text-muted-foreground">{ticket.user.email}</p>
            <p className="text-muted-foreground text-xs">{ticket.user.company}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
