"use client";

import { useState } from "react";
import { useAsyncEffect } from "@/hooks/use-async-effect";
import { filterTickets } from "./ticket-filters";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Loader2,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import {
  ticketsService,
  type Ticket,
  TicketStatus,
  TicketPriority,
} from "@/lib/api/ticketsService";
import { authService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";
import { Wifi, WifiOff, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusIcon = (status: TicketStatus) => {
  switch (status) {
    case TicketStatus.OPEN:
      return <ArrowRight className="h-4 w-4 text-blue-500" />;
    case TicketStatus.PENDING_INTERNAL:
      return <Circle className="h-4 w-4 text-yellow-500 animate-pulse" />;
    case TicketStatus.PENDING_CUSTOMER:
      return <Circle className="h-4 w-4 text-orange-500" />;
    case TicketStatus.RESOLVED:
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case TicketStatus.CLOSED:
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

const getPriorityIcon = (priority: TicketPriority) => {
  switch (priority) {
    case TicketPriority.URGENT:
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case TicketPriority.HIGH:
      return <ArrowUp className="h-4 w-4 text-orange-500" />;
    case TicketPriority.MEDIUM:
      return <ArrowRight className="h-4 w-4 text-yellow-500" />;
    case TicketPriority.LOW:
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    default:
      return <ArrowRight className="h-4 w-4" />;
  }
};

export default function UserSupportTicketsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isConnected } = useTicketNotifications();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadTickets = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push("/login");
        return;
      }

      setLoading(true);
      // Get tickets for current user only
      const data = await ticketsService.getMyTickets();
      setTickets(data);
    } catch (error: any) {
      console.error("Error loading tickets:", error);
      toast({
        title: "Hata",
        description:
          error.message || "Destek talepleri yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useAsyncEffect(() => loadTickets(), []);

  const filteredTickets = filterTickets(tickets, {
    status: statusFilter,
    priority: priorityFilter,
    query: searchQuery,
  });
  // Any filter change starts again from the first page.
  const updateFilter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setCurrentPage(1);
    };

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Destek Taleplerim
            </h1>
            <p className="text-muted-foreground">
              Oluşturduğunuz tüm destek taleplerini buradan yönetebilirsiniz.
            </p>
          </div>
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Canlı
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Bağlantı Kesildi
              </>
            )}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Filters Section */}
      {tickets.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ticket ara (ID, başlık, açıklama)..."
                    value={searchQuery}
                    onChange={(e) =>
                      updateFilter(setSearchQuery)(e.target.value)
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={updateFilter(setStatusFilter)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Durum Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value={TicketStatus.OPEN}>Açık</SelectItem>
                    <SelectItem value={TicketStatus.PENDING_INTERNAL}>
                      İşlemde
                    </SelectItem>
                    <SelectItem value={TicketStatus.PENDING_CUSTOMER}>
                      Müşteri Bekliyor
                    </SelectItem>
                    <SelectItem value={TicketStatus.RESOLVED}>
                      Çözüldü
                    </SelectItem>
                    <SelectItem value={TicketStatus.CLOSED}>Kapalı</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={updateFilter(setPriorityFilter)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Öncelik Filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öncelikler</SelectItem>
                    <SelectItem value={TicketPriority.URGENT}>Acil</SelectItem>
                    <SelectItem value={TicketPriority.HIGH}>Yüksek</SelectItem>
                    <SelectItem value={TicketPriority.MEDIUM}>Orta</SelectItem>
                    <SelectItem value={TicketPriority.LOW}>Düşük</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {filteredTickets.length} / {tickets.length} ticket gösteriliyor
              </span>
              {(statusFilter !== "all" ||
                priorityFilter !== "all" ||
                searchQuery.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                >
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Circle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Henüz destek talebiniz yok
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bir sorunla karşılaştığınızda yeni bir destek talebi
              oluşturabilirsiniz.
            </p>
            <Button asChild>
              <Link href="/portal/support/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                İlk Destek Talebini Oluştur
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                {currentTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">
                      #{ticket.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/portal/support/${ticket.id}`}
                        className="hover:underline"
                      >
                        {ticket.subject}
                      </Link>
                      {ticket.category && (
                        <div className="text-xs text-muted-foreground">
                          {ticket.category.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "flex items-center gap-1.5 w-fit",
                          ticketsService.getStatusColor(ticket.status),
                        )}
                      >
                        {getStatusIcon(ticket.status)}
                        {ticketsService.getStatusLabel(ticket.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          "flex items-center gap-1.5",
                          ticketsService.getPriorityColor(ticket.priority),
                        )}
                      >
                        {getPriorityIcon(ticket.priority)}
                        {ticketsService.getPriorityLabel(ticket.priority)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.updatedAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
          {totalPages > 1 && (
            <CardFooter className="justify-end pt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
