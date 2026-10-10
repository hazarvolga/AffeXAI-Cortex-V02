'use client';

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { notFound, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  User as UserIcon,
  Hash,
  Tag,
  Shield,
  Send,
  Paperclip,
  Eye,
  EyeOff,
  Users,
  Building,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Toggle } from '@/components/ui/toggle';
import { ticketsService, Ticket, TicketStatus, TicketPriority } from '@/lib/api/ticketsService';
import { usersService, type User } from '@/lib/api/usersService';
import { useToast } from '@/hooks/use-toast';

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { ticketId } = unwrappedParams;
  const router = useRouter();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [attachments, setAttachments] = useState<{ id: string, name: string, size: number, type: string }[]>([]);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [supportUsers, setSupportUsers] = useState<User[]>([]);
  const [assigningTicket, setAssigningTicket] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const hasFetchedTicket = useRef(false);
  const hasFetchedUsers = useRef(false);

  // Fetch ticket data
  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedTicket.current) return;
    hasFetchedTicket.current = true;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const ticketData = await ticketsService.getTicketById(ticketId);
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

  // Fetch support team users
  useEffect(() => {
    if (hasFetchedUsers.current) return;
    hasFetchedUsers.current = true;

    const fetchSupportUsers = async () => {
      try {
        const response = await usersService.getUsersList();
        const users = response.data || [];

        // Filter for support team members (admin, support_manager, support_agent)
        const supportTeam = users.filter(user =>
          user.roles?.some(role =>
            ['admin', 'support_manager', 'support_agent', 'support_team'].includes(role.name)
          )
        );

        setSupportUsers(supportTeam);
      } catch (error) {
        console.error('Failed to fetch support users:', error);
      }
    };

    fetchSupportUsers();
  }, []);

  const handleAddMessage = async () => {
    if (!messageContent.trim() || !ticket) return;

    try {
      const newMessage = await ticketsService.addMessage(ticket.id, {
        content: messageContent,
        isInternal: isInternalNote,
      });

      // Refresh ticket data to get updated messages
      const updatedTicket = await ticketsService.getTicketById(ticketId);
      setTicket(updatedTicket);
      setMessageContent('');
      setAttachments([]);

      toast({
        title: isInternalNote ? "Dahili not kaydedildi" : "Mesaj gönderildi",
        description: isInternalNote ? "Dahili not başarıyla kaydedildi." : "Mesaj müşteriye başarıyla gönderildi.",
      });
    } catch (err: any) {
      console.error('Error adding message:', err);
      toast({
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;

    try {
      setUpdatingStatus(true);
      const updatedTicket = await ticketsService.updateTicketStatus(ticket.id, { status });
      setTicket(updatedTicket);

      toast({
        title: "Durum güncellendi",
        description: "Talep durumu başarıyla güncellendi.",
      });
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!ticket) return;

    try {
      setUpdatingPriority(true);
      const updatedTicket = await ticketsService.updateTicket(ticket.id, { priority });
      setTicket(updatedTicket);

      toast({
        title: "Öncelik güncellendi",
        description: "Talep önceliği başarıyla güncellendi.",
      });
    } catch (err: any) {
      console.error('Error updating priority:', err);
      toast({
        title: "Hata",
        description: "Öncelik güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAssignTicket = async (assignedToId: string) => {
    if (!ticket) return;

    try {
      setAssigningTicket(true);
      // Convert "unassigned" to null
      const actualAssignedId = assignedToId === 'unassigned' ? null : assignedToId;
      const updatedTicket = await ticketsService.assignTicket(ticket.id, {
        assignedToId: actualAssignedId as any
      });
      setTicket(updatedTicket);

      toast({
        title: "Atama güncellendi",
        description: actualAssignedId
          ? "Talep başarıyla atandı."
          : "Talep ataması kaldırıldı.",
      });
    } catch (err: any) {
      console.error('Error assigning ticket:', err);
      toast({
        title: "Hata",
        description: "Atama yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setAssigningTicket(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

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

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
            <CardDescription>
              {ticket.user?.firstName} {ticket.user?.lastName} tarafından{' '}
              {formatDate(ticket.createdAt.toString())}{' '}
              tarihinde oluşturuldu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {ticket.messages?.map((message, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.user?.firstName} ${message.user?.lastName}`} />
                    <AvatarFallback>
                      {getInitials(`${message.user?.firstName} ${message.user?.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{message.user?.firstName} {message.user?.lastName}</p>
                      <div className="flex items-center gap-2">
                        {message.isInternal && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Dahili Not
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt.toString())}
                        </p>
                      </div>
                    </div>
                    <div className={`mt-2 p-4 rounded-lg text-sm ${message.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-secondary/50'}`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
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
            <div className="mb-4 flex items-center justify-between">
              <Label>Mesaj Türü</Label>
              <div className="flex items-center gap-2">
                <Toggle
                  pressed={!isInternalNote}
                  onPressedChange={() => setIsInternalNote(false)}
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Müşteriye Görünür
                </Toggle>
                <Toggle
                  pressed={isInternalNote}
                  onPressedChange={() => setIsInternalNote(true)}
                  size="sm"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Dahili Not
                </Toggle>
              </div>
            </div>
            <RichTextEditor
              content={messageContent}
              onChange={setMessageContent}
              placeholder={isInternalNote ? "Dahili notunuzu buraya yazın..." : "Cevabınızı buraya yazın..."}
              className="min-h-[150px]"
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Dosya Ekle</span>
              </Button>
            </div>
            <Button onClick={handleAddMessage} disabled={!messageContent.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {isInternalNote ? 'Dahili Notu Kaydet' : 'Cevabı Gönder'}
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
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    ticket.status === 'new' ? 'default' :
                      ticket.status === 'open' ? 'secondary' :
                        ticket.status === 'pending_customer' ? 'outline' :
                          ticket.status === 'pending_internal' ? 'outline' :
                            ticket.status === 'pending_third_party' ? 'outline' :
                              ticket.status === 'resolved' ? 'default' :
                                ticket.status === 'closed' ? 'secondary' :
                                  'destructive'
                  }
                  className={
                    ticket.status === 'new' ? 'bg-blue-500' :
                      ticket.status === 'open' ? 'bg-green-500' :
                        ticket.status === 'pending_customer' ? 'bg-yellow-500' :
                          ticket.status === 'pending_internal' ? 'bg-orange-500' :
                            ticket.status === 'pending_third_party' ? 'bg-purple-500' :
                              ticket.status === 'resolved' ? 'bg-emerald-500' :
                                ticket.status === 'closed' ? 'bg-gray-500' :
                                  'bg-red-500'
                  }
                >
                  {ticket.status === 'new' && 'Yeni'}
                  {ticket.status === 'open' && 'Açık'}
                  {ticket.status === 'pending_customer' && 'Müşteri Yanıtı Bekleniyor'}
                  {ticket.status === 'pending_internal' && 'İç Ekip Bekleniyor'}
                  {ticket.status === 'pending_third_party' && 'Üçüncü Taraf Bekleniyor'}
                  {ticket.status === 'resolved' && 'Çözüldü'}
                  {ticket.status === 'closed' && 'Kapalı'}
                  {ticket.status === 'cancelled' && 'İptal Edildi'}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Label>Hızlı İşlemler</Label>
              <div className="flex flex-col gap-2">
                {/* Mark as Pending Customer */}
                {ticket.status !== TicketStatus.PENDING_CUSTOMER && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.CANCELLED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(TicketStatus.PENDING_CUSTOMER)}
                    disabled={updatingStatus}
                    className="justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Müşteri Yanıtı Bekle
                  </Button>
                )}

                {/* Mark as Pending Internal */}
                {ticket.status !== TicketStatus.PENDING_INTERNAL && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.CANCELLED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(TicketStatus.PENDING_INTERNAL)}
                    disabled={updatingStatus}
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    İç Ekip Bekle
                  </Button>
                )}

                {/* Mark as Pending Third Party */}
                {ticket.status !== TicketStatus.PENDING_THIRD_PARTY && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.CANCELLED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(TicketStatus.PENDING_THIRD_PARTY)}
                    disabled={updatingStatus}
                    className="justify-start"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Üçüncü Taraf Bekle
                  </Button>
                )}

                {/* Mark as Resolved */}
                {ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.CANCELLED && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusChange(TicketStatus.RESOLVED)}
                    disabled={updatingStatus}
                    className="justify-start bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Çözüldü Olarak İşaretle
                  </Button>
                )}

                {/* Cancel Ticket */}
                {ticket.status !== TicketStatus.CANCELLED && ticket.status !== TicketStatus.CLOSED && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleStatusChange(TicketStatus.CANCELLED)}
                    disabled={updatingStatus}
                    className="justify-start"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    İptal Et
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Öncelik</Label>
              <Select
                value={ticket.priority}
                onValueChange={(priority) => handlePriorityChange(priority as TicketPriority)}
                disabled={updatingPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketPriority.LOW}>Düşük</SelectItem>
                  <SelectItem value={TicketPriority.MEDIUM}>Orta</SelectItem>
                  <SelectItem value={TicketPriority.HIGH}>Yüksek</SelectItem>
                  <SelectItem value={TicketPriority.URGENT}>Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Atanan Kişi</Label>
              <Select
                value={ticket.assignedToId || 'unassigned'}
                onValueChange={handleAssignTicket}
                disabled={assigningTicket}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Atanmamış" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Atanmamış</SelectItem>
                  {supportUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <span className="font-mono text-xs">#{ticket.id.substring(0, 8)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" /> Kategori
              </span>
              <Badge variant="outline">{ticket.category?.name || 'Belirtilmemiş'}</Badge>
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
                <UserIcon className="h-4 w-4" /> Müşteri
              </span>
              <span>{ticket.user?.firstName} {ticket.user?.lastName}</span>
            </div>
            <p className="text-muted-foreground">{ticket.user?.email}</p>
            <p className="text-muted-foreground text-xs">Şirket bilgisi yok</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}