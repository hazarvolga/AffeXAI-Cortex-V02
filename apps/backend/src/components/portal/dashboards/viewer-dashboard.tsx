
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Calendar, LifeBuoy, Users, Award, Mail, Share2 } from "lucide-react";
import Link from "next/link";
import { socialPosts, getSourceContentName, getPlatformIcon } from "@/lib/social-media-data";
import { events } from "@/lib/events-data";
import { campaigns } from "@/lib/newsletter-data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ViewerDashboard() {
    const sortedSocialPosts = socialPosts.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    const latestPost = sortedSocialPosts[0];
    const pastPosts = sortedSocialPosts.slice(1);
    
    const sortedCampaigns = campaigns.filter(c => c.status === 'gönderildi').sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
    const latestCampaign = sortedCampaigns[0];
    const pastCampaigns = sortedCampaigns.slice(1);

    const upcomingEvent = events.find(e => new Date(e.date) > new Date());
    const pastEvents = events.filter(e => new Date(e.date) < new Date()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const PlatformIcon = latestPost ? getPlatformIcon(latestPost.accountId.split('-')[1]) : Share2;

    return (
        <>
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İzleyici Paneli (Salt Okunur)</h2>
                    <p className="text-muted-foreground">
                        Sistemdeki son aktivitelere genel bir bakış.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {/* Latest Social Post */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-primary"/> Son Sosyal Medya Gönderisi</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {latestPost ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                     <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                                     <span className="text-sm font-semibold">{latestPost.accountId.split('-')[1].toUpperCase()}</span>
                                     <Badge variant="outline">{new Date(latestPost.publishedAt!).toLocaleDateString('tr-TR')}</Badge>
                                </div>
                                <p className="text-muted-foreground text-sm line-clamp-4">{latestPost.content}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Gösterilecek gönderi yok.</p>
                        )}
                    </CardContent>
                </Card>
                
                {/* Latest Email Campaign */}
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/> Son Email Kampanyası</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        {latestCampaign ? (
                             <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                     <Badge variant="secondary">{new Date(latestCampaign.sentAt!).toLocaleDateString('tr-TR')}</Badge>
                                </div>
                                <h3 className="font-semibold">{latestCampaign.title}</h3>
                                <p className="text-muted-foreground text-sm">"{latestCampaign.subject}"</p>
                            </div>
                        ) : (
                             <p className="text-muted-foreground text-sm">Gösterilecek kampanya yok.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Event */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/> Yaklaşan Etkinlik</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         {upcomingEvent ? (
                             <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                     <Badge>{upcomingEvent.category}</Badge>
                                      <Badge variant="outline">{new Date(upcomingEvent.date).toLocaleDateString('tr-TR')}</Badge>
                                </div>
                                <h3 className="font-semibold">{upcomingEvent.title}</h3>
                                <p className="text-muted-foreground text-sm line-clamp-2">{upcomingEvent.description}</p>
                            </div>
                        ) : (
                             <p className="text-muted-foreground text-sm">Yaklaşan etkinlik yok.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-primary"/> Geçmiş Sosyal Medya Gönderileri</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <ScrollArea className="h-64">
                            <div className="space-y-4">
                                {pastPosts.map(post => {
                                    const PostIcon = getPlatformIcon(post.accountId.split('-')[1]);
                                    return (
                                        <div key={post.id}>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <PostIcon className="h-3 w-3" />
                                                <span>{new Date(post.publishedAt!).toLocaleDateString('tr-TR')}</span>
                                            </div>
                                            <p className="text-sm line-clamp-2">{post.content}</p>
                                        </div>
                                    )
                                })}
                                {pastPosts.length === 0 && <p className="text-sm text-muted-foreground">Gösterilecek geçmiş gönderi yok.</p>}
                           </div>
                       </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/> Geçmiş Email Kampanyaları</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <ScrollArea className="h-64">
                            <div className="space-y-4">
                                {pastCampaigns.map(campaign => (
                                     <div key={campaign.id}>
                                        <p className="text-xs text-muted-foreground">{new Date(campaign.sentAt!).toLocaleDateString('tr-TR')}</p>
                                        <p className="font-semibold text-sm">{campaign.title}</p>
                                        <p className="text-xs text-muted-foreground">"{campaign.subject}"</p>
                                    </div>
                                ))}
                                {pastCampaigns.length === 0 && <p className="text-sm text-muted-foreground">Gösterilecek geçmiş kampanya yok.</p>}
                            </div>
                         </ScrollArea>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/> Geçmiş Etkinlikler</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <ScrollArea className="h-64">
                            <div className="space-y-4">
                                {pastEvents.map(event => (
                                     <div key={event.id}>
                                        <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString('tr-TR')}</p>
                                        <p className="font-semibold text-sm">{event.title}</p>
                                    </div>
                                ))}
                                {pastEvents.length === 0 && <p className="text-sm text-muted-foreground">Gösterilecek geçmiş etkinlik yok.</p>}
                            </div>
                         </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
