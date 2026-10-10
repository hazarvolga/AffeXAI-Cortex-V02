
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

// Mock user object to simulate roles. In a real app, this would come from an auth context.
const mockUser = {
    id: 'usr-portal-01', // This is the normal user 'Ayşe Vural'
    role: 'Customer', // Can be 'Customer', 'Editor', or 'Support Team'
};

// To test the support team view, change the mockUser to this:
/*
const mockUser = {
    id: 'usr-002', // This is the support agent 'Zeynep Kaya'
    role: 'Support Team', 
};
*/

export default function TicketDetailPage({
  params,
}: {
  params: { ticketId: string };
}) {
  const ticket = supportTickets.find(t => t.id === params.ticketId);

  if (!ticket) {
    notFound();
  }
  
  // Determine if the current user can reply
  const canReply = 
    // Case 1: The user is the original creator of the ticket
    ticket.user.id === mockUser.id || 
    // Case 2: The user is a Support Team member AND the ticket is assigned to them
    (mockUser.role === 'Support Team' && ticket.assignee.id === mockUser.id);


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
            <div className="flex justify-between items-start">
                <div>
                    <Badge variant="outline" className='mb-2'>{ticket.category}</Badge>
                    <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                    <CardDescription>
                    Talep ID: #{ticket.id}
                    </CardDescription>
                </div>
                 <div className='text-right'>
                    <Badge variant={ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'default' : 'destructive'} className={ticket.status === 'Open' ? 'bg-blue-500' : ticket.status === 'In Progress' ? 'bg-yellow-500' : ''}>{ticket.status}</Badge>
                    <p className='text-sm text-muted-foreground mt-1'>Öncelik: {ticket.priority}</p>
                 </div>
            </div>
          </CardHeader>
          <Separator/>
          <CardContent className="pt-6">
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
                        {new Date(message.timestamp).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}
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

        {canReply && (
            <Card>
            <CardHeader>
                <CardTitle>Cevap Yaz</CardTitle>
                <CardDescription>Talebinize yeni bir mesaj ekleyin.</CardDescription>
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
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Talep Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Atanan Temsilci
              </span>
              <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.assignee.avatarUrl} />
                        <AvatarFallback>{getInitials(ticket.assignee.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{ticket.assignee.name}</span>
                </div>
            </div>
            <Separator/>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Oluşturulma
              </span>
              <span>
                {new Date(ticket.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Son Güncelleme
              </span>
              <span>
                 {new Date(ticket.lastUpdated).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <Separator />
             <Button variant="outline" className="w-full">Talebi Kapat</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
