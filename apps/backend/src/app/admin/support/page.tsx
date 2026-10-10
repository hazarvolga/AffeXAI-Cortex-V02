
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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
  Book,
  Activity,
  Check,
  Clock,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('');
};

export default function SupportDashboardPage() {

  const stats = {
    open: supportTickets.filter(t => t.status === 'Open').length,
    inProgress: supportTickets.filter(t => t.status === 'In Progress').length,
    resolved: supportTickets.filter(t => t.status === 'Resolved').length,
    closed: supportTickets.filter(t => t.status === 'Closed').length,
  }

  const statCards = [
    { title: "Açık Talepler", value: stats.open, icon: Activity },
    { title: "İşlemde", value: stats.inProgress, icon: Clock },
    { title: "Çözüldü", value: stats.resolved, icon: Check },
    { title: "Kapandı", value: stats.closed, icon: XCircle },
  ]

  const recentTickets = [...supportTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Destek Paneli</h2>
            <p className="text-muted-foreground">
              Destek taleplerine genel bir bakış.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
                <Link href="/admin/support/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Talep Oluştur
                </Link>
            </Button>
             <Button asChild variant="outline">
                <Link href="/admin/support/categories">
                    <Book className="mr-2 h-4 w-4" />
                    Kategorileri Yönet
                </Link>
            </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            {statCards.map(stat => (
                 <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Son Destek Talepleri</CardTitle>
              <CardDescription>
                En son oluşturulan 5 destek talebi.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talep ID</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>
                    <span className="sr-only">Eylemler</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">#{ticket.id}</TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {ticket.category}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(ticket.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{ticket.user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.user.email}
                          </div>
                        </div>
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
                          'flex items-center gap-1.5',
                          ticket.status === 'Open' && 'bg-blue-500/20 text-blue-700',
                          ticket.status === 'In Progress' &&
                            'bg-yellow-500/20 text-yellow-700'
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menüyü aç</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/support/${ticket.id}`}>
                              Görüntüle ve Cevapla
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Kullanıcıyı Görüntüle</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-between">
            <p className="text-sm text-muted-foreground">Toplam {supportTickets.length} talep bulunuyor.</p>
            <Button variant="outline" size="sm" asChild>
                <Link href="#">Tüm Talepleri Gör</Link>
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}
