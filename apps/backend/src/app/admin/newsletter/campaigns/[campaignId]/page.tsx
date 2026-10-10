'use client';

import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BarChart2, Users, MousePointerClick, MailOpen, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Link from 'next/link';
import { useEffect, useState, useRef } from "react";
import { use } from "react";
import emailCampaignsService from "@/lib/api/emailCampaignsService";
import type { EmailCampaign } from "@/lib/api/emailCampaignsService";

// Mock data for pie chart - in a real app, this would come from the backend
const pieChartData = [
  { name: 'Açıldı', value: 319 }, // 25.5% of 1250
  { name: 'Tıkladı', value: 53 }, // 4.2% of 1250
  { name: 'Açılmadı', value: 878 },
];
const COLORS = ['#10B981', '#F59E0B', '#6B7280'];

export default function CampaignDetailPage({ params }: { params: Promise<{ campaignId: string }> }) {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const { campaignId } = unwrappedParams;
  
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedCampaign = useRef(false);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedCampaign.current) return;
    hasFetchedCampaign.current = true;
    
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        // Fetch campaign from backend
        const campaignData: EmailCampaign = await emailCampaignsService.getCampaignById(campaignId);
        setCampaign(campaignData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching campaign:', err);
        if (err.response?.status === 404) {
          notFound();
        } else {
          setError('Kampanya bilgileri yüklenirken bir hata oluştu.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  if (!campaign) {
    notFound();
    return null;
  }

  const isSent = campaign.status === 'sent';

  // Calculate rates
  const openRate = campaign.totalRecipients > 0 ? Math.round((campaign.openedCount / campaign.totalRecipients) * 100) : 0;
  const clickRate = campaign.totalRecipients > 0 ? Math.round((campaign.clickedCount / campaign.totalRecipients) * 100) : 0;

  const stats = [
    { name: 'Alıcı Sayısı', value: campaign.totalRecipients || 0, icon: Users },
    { name: 'Açılma Oranı', value: isSent ? `${openRate}%` : '-', icon: MailOpen },
    { name: 'Tıklanma Oranı', value: isSent ? `${clickRate}%` : '-', icon: MousePointerClick },
  ];

  return (
    <div className="space-y-8">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
            <Link href="/admin/newsletter/campaigns">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                  {campaign.status === 'draft' ? 'Taslak' : campaign.status === 'scheduled' ? 'Planlandı' : 'Gönderildi'}
                </Badge>
                <span>·</span>
                {campaign.status === 'sent' && campaign.sentAt && (
                    <div className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" /> {new Date(campaign.sentAt).toLocaleString('tr-TR')}</div>
                )}
                 {campaign.status === 'scheduled' && campaign.scheduledAt && (
                    <div className="flex items-center gap-1 text-sm"><Clock className="h-3 w-3" /> {new Date(campaign.scheduledAt).toLocaleString('tr-TR')}</div>
                )}
                 {campaign.status === 'draft' && (
                    <div className="flex items-center gap-1 text-sm"><Calendar className="h-3 w-3" /> {new Date(campaign.createdAt).toLocaleDateString('tr-TR')} tarihinde oluşturuldu</div>
                )}
            </div>
        </div>
      </div>

      {isSent ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map(stat => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <Card>
            <CardHeader>
                <CardTitle>Kampanya Önizlemesi</CardTitle>
                <CardDescription>
                  Bu kampanya henüz gönderilmedi. 
                  {campaign.status === 'scheduled' && campaign.scheduledAt && ` Planlanan gönderim tarihi: ${new Date(campaign.scheduledAt).toLocaleString('tr-TR')}`}
                  {campaign.status === 'draft' && ' Kampanyayı göndermek için taslağı düzenleyin ve gönderime planlayın.'}
                </CardDescription>
            </CardHeader>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>E-posta İçeriği</CardTitle>
              <CardDescription>Bu kampanyada gönderilen veya gönderilecek olan e-posta içeriği.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg border bg-muted p-4">
                 <h2 className="text-lg font-semibold">{campaign.subject}</h2>
                 <Separator className="my-4"/>
                <div
                    className="prose prose-sm dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: campaign.content }}
                 />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Etkileşim Dağılımı</CardTitle>
                </CardHeader>
                <CardContent>
                    {isSent ? (
                        <div className="w-full h-52">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} abone`, name]}/>
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">İstatistikler, kampanya gönderildikten sonra burada görüntülenecektir.</div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}