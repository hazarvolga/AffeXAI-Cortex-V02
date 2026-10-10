
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Circle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { supportTickets, SupportTicket } from '@/lib/support-data';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

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

const getStatusIcon = (status: SupportTicket['status']) => {
  switch (status) {
    case 'Open':
      return <ArrowRight className="h-4 w-4 text-blue-500" />;
    case 'In Progress':
      return <Circle className="h-4 w-4 text-yellow-500 animate-pulse" />;
    case 'Resolved':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'Closed':
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

const getPriorityIcon = (priority: SupportTicket['priority']) => {
  switch (priority) {
    case 'High':
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case 'Medium':
      return <ArrowRight className="h-4 w-4 text-yellow-500" />;
    case 'Low':
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    default:
      return <ArrowRight className="h-4 w-4" />;
  }
};

export default function UserSupportTicketsPage() {
  const userTickets = mockUser.role === 'Support Team'
    ? supportTickets // Support Team sees all tickets
    : supportTickets.filter(ticket => ticket.user.id === mockUser.id); // Customers see only their own tickets

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Destek Taleplerim</h2>
          <p className="text-muted-foreground">
            Oluşturduğunuz tüm destek taleplerini buradan yönetebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild>
                <Link href="/portal/support/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Destek Talebi Oluştur
                </Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/portal/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Geri Dön
                </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talep ID</TableHead>
                <TableHead>Konu</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Son Güncelleme</TableHead>
                <TableHead>
                  <span className="sr-only">Eylemler</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userTickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs">#{ticket.id}</TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/portal/support/${ticket.id}`}
                      className="hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {ticket.category}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.status === 'Resolved' || ticket.status === 'Closed'
                          ? 'outline'
                          : 'default'
                      }
                      className={cn(
                        'flex items-center gap-1.5 w-fit',
                        ticket.status === 'Open' && 'bg-blue-500/20 text-blue-700',
                        ticket.status === 'In Progress' &&
                          'bg-yellow-500/20 text-yellow-700',
                         ticket.status === 'Resolved' &&
                          'bg-green-500/20 text-green-700'
                      )}
                    >
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getPriorityIcon(ticket.priority)}
                      {ticket.priority}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.lastUpdated).toLocaleDateString('tr-TR')}
                  </TableCell>
                   <TableCell>
                      <Button asChild variant="outline" size="sm">
                          <Link href={`/portal/support/${ticket.id}`}>
                            Görüntüle
                          </Link>
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-end pt-6">
             <Pagination>
                <PaginationContent>
                    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                    <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                    <PaginationItem><PaginationNext href="#" /></PaginationItem>
                </PaginationContent>
            </Pagination>
        </CardFooter>
      </Card>
    </div>
  );
}
