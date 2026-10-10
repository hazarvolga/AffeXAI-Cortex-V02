'use client';

import { useEffect, useState, useRef } from "react";
import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Mail, Phone, Building, User, Calendar, Tag, Folder, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import Link from "next/link";
import subscribersService, { Subscriber } from "@/lib/api/subscribersService";

export default function SubscriberDetailPage({ params }: { params: Promise<{ subscriberId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { subscriberId } = unwrappedParams;
  
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedSubscriber = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedSubscriber.current) return;
    hasFetchedSubscriber.current = true;
    
    const fetchSubscriber = async () => {
      try {
        setLoading(true);
        const subscriberData = await subscribersService.getSubscriberById(subscriberId);
        setSubscriber(subscriberData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching subscriber:', err);
        if (err.response?.status === 404) {
          notFound();
        } else {
          setError('Abone bilgileri yüklenirken bir hata oluştu.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriber();
  }, [subscriberId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!subscriber) {
    notFound();
    return null;
  }

  const getStatusVariant = (status: Subscriber['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'unsubscribed': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: Subscriber['status']) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'pending': return 'Onay Bekliyor';
      case 'unsubscribed': return 'İptal Edilmiş';
      default: return status;
    }
  };

  const getMailerCheckIcon = (result: string | undefined) => {
    if (!result) return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    
    switch (result.toLowerCase()) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMailerCheckText = (result: string | undefined) => {
    if (!result) return 'Bilinmiyor';
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/newsletter">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abone Detayı</h1>
          <p className="text-muted-foreground">{subscriber.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Abone Bilgileri</CardTitle>
              <CardDescription>
                Abonenin detaylı bilgileri ve tercihleri.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/admin/newsletter/subscribers/${subscriberId}`}>
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-lg">{subscriber.email}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Durum</span>
              </div>
              <Badge variant={getStatusVariant(subscriber.status)}>
                {getStatusText(subscriber.status)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Groups */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Gruplar</span>
            </div>
            {subscriber.groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {subscriber.groups.map((group, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {group}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Bu abone hiçbir gruba eklenmemiş.</p>
            )}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Ad</span>
              </div>
              <p>{subscriber.firstName || 'Belirtilmemiş'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Soyad</span>
              </div>
              <p>{subscriber.lastName || 'Belirtilmemiş'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Şirket</span>
              </div>
              <p>{subscriber.company || 'Belirtilmemiş'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Telefon</span>
              </div>
              <p>{subscriber.phone || 'Belirtilmemiş'}</p>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Müşteri Durumu</span>
              </div>
              <p>{subscriber.customerStatus || 'Bilinmiyor'}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Kalıcı/SUB/SSA</span>
              </div>
              <p>{subscriber.subscriptionType || 'Belirtilmemiş'}</p>
            </div>
          </div>

          <Separator />

          {/* MailerCheck Result */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {getMailerCheckIcon(subscriber.mailerCheckResult)}
              <span className="text-sm font-medium">MailerCheck result</span>
            </div>
            <p>{getMailerCheckText(subscriber.mailerCheckResult)}</p>
          </div>

          <Separator />

          {/* Subscription Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Abonelik Tarihi</span>
            </div>
            <p>{new Date(subscriber.subscribedAt).toLocaleDateString('tr-TR')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}