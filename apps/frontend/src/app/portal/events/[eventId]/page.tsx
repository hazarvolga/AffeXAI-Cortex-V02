"use client";

import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Loader2,
  Users,
  Ticket,
  Share2,
  Heart,
  CheckCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, use } from "react";
import { eventsService, authService } from "@/lib/api";
import { type EventWithUIData } from "@affexai/shared-types";
import { useToast } from "@/hooks/use-toast";
import { registerCurrentUser } from "./registration";

// Placeholder for ticket options until backend provides them
const ticketOptions = [
  { type: "Genel Giriş", price: 0, benefits: ["Etkinlik Girişi"], stock: 100 },
];

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventWithUIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventsService.getById(eventId);
        setEvent(data as EventWithUIData);
      } catch (error) {
        console.error("Failed to fetch event:", error);
        // If 404, we could redirect or show not found
        // For now, let's just stay on page with error
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleRegister = async () => {
    if (!event) return;

    setRegistering(true);
    try {
      await registerCurrentUser(event.id, {
        getCurrentUser: () => authService.getCurrentUser(),
        register: (eventId, data) => eventsService.register(eventId, data),
      });
      toast({
        title: "Başarılı",
        description: "Etkinliğe başarıyla kayıt oldunuz.",
      });
    } catch (error) {
      // Surface registration failures without confirming an unsuccessful booking.
      toast({
        title: "Kayıt başarısız",
        description:
          error instanceof Error
            ? error.message
            : "Etkinlik kaydı tamamlanamadı.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h1 className="text-2xl font-bold mb-2">Etkinlik Bulunamadı</h1>
        <p className="text-muted-foreground mb-4">
          Aradığınız etkinlik mevcut değil veya kaldırılmış olabilir.
        </p>
        <Button onClick={() => router.back()}>Geri Dön</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative h-[40vh] min-h-[300px] rounded-lg overflow-hidden bg-muted">
        {/* Use fallback image or event image */}
        <Image
          src={
            event.imageUrl ||
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3"
          }
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          {event.category && (
            <Badge variant="secondary" className="mb-2">
              {event.category}
            </Badge>
          )}
          <h1 className="text-4xl font-bold">{event.title}</h1>
          <p className="text-lg mt-1">
            {new Date(event.startDate).toLocaleString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Etkinlik Hakkında</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biletler / Kayıt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticketOptions.map((ticket) => (
                <div
                  key={ticket.type}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{ticket.type}</h3>
                    <p className="text-sm text-muted-foreground">
                      {ticket.benefits.join(", ")}
                    </p>
                    {ticket.price > 0 && (
                      <span className="font-semibold text-primary">
                        {ticket.price} TL
                      </span>
                    )}
                  </div>
                  <Button onClick={handleRegister} disabled={registering}>
                    {registering ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Ticket className="mr-2 h-4 w-4" />
                    )}
                    {ticket.price > 0 ? "Satın Al" : "Kayıt Ol"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ticket className="mr-2 h-4 w-4" />
              )}
              Şimdi Kayıt Ol
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">Favorilere ekle</span>
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Paylaş</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detaylar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Tarih & Saat</p>
                  <p className="text-muted-foreground">
                    {new Date(event.startDate).toLocaleString("tr-TR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Mekan</p>
                  <p className="text-muted-foreground">
                    {event.isOnline ? "Çevrimiçi" : event.location}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Organizatör</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      {/* <AvatarImage src={event.organizer?.avatarUrl} /> */}
                      <AvatarFallback>
                        {event.organizer?.name?.charAt(0) || "O"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">
                      {event.organizer?.name || "Belirtilmemiş"}
                    </span>
                  </div>
                </div>
              </div>
              {event.grantsCertificate && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Sertifika</p>
                    <p className="text-muted-foreground">
                      Bu etkinlik sonunda katılım sertifikası verilmektedir.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
