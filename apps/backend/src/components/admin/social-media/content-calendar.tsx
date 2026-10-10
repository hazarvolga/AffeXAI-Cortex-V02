
'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { socialPosts, socialAccounts, getPlatformIcon } from '@/lib/social-media-data';
import { SocialPost } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Clock, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { add, format, startOfWeek, eachDayOfInterval, getMonth, getYear, isSameMonth, setMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


// --- SHARED HELPER ---
const scheduledPosts = socialPosts.filter(p => p.status === 'Planlandı' && p.scheduledAt);
const postsByDay = scheduledPosts.reduce((acc, post) => {
    const day = new Date(post.scheduledAt!).toDateString();
    if (!acc[day]) {
        acc[day] = [];
    }
    acc[day].push(post);
    return acc;
}, {} as Record<string, SocialPost[]>);

// --- MONTHLY VIEW ---
const MonthlyView = ({ selectedDate, onDateChange }: { selectedDate: Date | undefined, onDateChange: (date: Date | undefined) => void }) => {
    const DayCell = ({ date }: { date: Date }) => {
        const posts = postsByDay[date.toDateString()];
        
        if (posts && posts.length > 0) {
            return (
                <Popover>
                    <PopoverTrigger asChild>
                         <div className="relative flex h-full w-full items-center justify-center">
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            {date.getDate()}
                         </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 z-50">
                        <div className="space-y-4">
                             <h4 className="font-medium leading-none">{date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                             {posts.map(post => {
                                const account = socialAccounts.find(a => a.id === post.accountId);
                                const PlatformIcon = account ? getPlatformIcon(account.platform) : Share2;
                                return (
                                    <div key={post.id} className="text-sm">
                                         <div className="flex items-center gap-2 font-semibold">
                                            <PlatformIcon className="h-4 w-4 text-muted-foreground"/>
                                            <span>{account?.platform}</span>
                                            <span className="text-xs text-muted-foreground font-normal">{new Date(post.scheduledAt!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="line-clamp-2 text-muted-foreground">{post.content}</p>
                                    </div>
                                )
                             })}
                        </div>
                    </PopoverContent>
                </Popover>
            );
        }
        return date.getDate();
    };

    return (
        <div className="flex justify-center">
             <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateChange}
                className="w-full"
                components={{ Day: DayCell }}
            />
        </div>
    );
};

// --- DAILY VIEW ---
const DailyView = ({ selectedDate }: { selectedDate: Date | undefined }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i); // 0 to 23
    const selectedDayPosts = selectedDate ? postsByDay[selectedDate.toDateString()] || [] : [];

    const postsByHour = selectedDayPosts.reduce((acc, post) => {
        const hour = new Date(post.scheduledAt!).getHours();
        if (!acc[hour]) {
            acc[hour] = [];
        }
        acc[hour].push(post);
        return acc;
    }, {} as Record<number, SocialPost[]>);

    return (
        <div className="border rounded-md">
            <h3 className="font-semibold mb-4 p-4 border-b">{selectedDate ? selectedDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Bir gün seçin'}</h3>
            <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-2">
                    {hours.map(hour => {
                        const postsInHour = postsByHour[hour] || [];
                        return (
                            <div key={hour} className="grid grid-cols-[auto_1fr] gap-4 items-start min-h-[60px]">
                                <div className="text-right text-xs text-muted-foreground pt-1">
                                    {format(new Date(0, 0, 0, hour), 'HH:mm')}
                                </div>
                                <div className="border-l pl-4 py-1 space-y-2">
                                    {postsInHour.length > 0 ? (
                                        postsInHour.map(post => {
                                            const account = socialAccounts.find(a => a.id === post.accountId);
                                            const PlatformIcon = account ? getPlatformIcon(account.platform) : Share2;
                                            return (
                                                <div key={post.id} className="bg-secondary p-2 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <PlatformIcon className="h-4 w-4 text-muted-foreground"/>
                                                        <span className="font-semibold text-sm">{account?.platform}</span>
                                                        <span className="text-xs text-muted-foreground">({format(new Date(post.scheduledAt!), 'HH:mm')})</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="h-full"></div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}

// --- WEEKLY VIEW ---
const WeeklyView = ({ selectedDate, onDateChange }: { selectedDate: Date, onDateChange: (date: Date) => void }) => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: add(weekStart, { days: 6 }) });

    return (
        <div className="border rounded-md">
            <div className="grid grid-cols-7">
                {weekDays.map(day => (
                    <div key={day.toString()} className="border-b border-r last:border-r-0">
                        <h4 className="text-center font-semibold text-sm py-2 border-b">
                            {format(day, 'EEE', { locale: tr })}
                             <span className='block text-xs font-normal text-muted-foreground'>{format(day, 'd MMM', { locale: tr })}</span>
                        </h4>
                        <div className="h-64 p-2 space-y-2 overflow-y-auto">
                            {(postsByDay[day.toDateString()] || []).map(post => {
                                const account = socialAccounts.find(a => a.id === post.accountId);
                                const PlatformIcon = account ? getPlatformIcon(account.platform) : Share2;
                                return (
                                    <div key={post.id} className="p-1.5 rounded-md bg-secondary text-xs">
                                        <div className="flex items-center justify-between font-semibold">
                                            <PlatformIcon className="h-3 w-3" />
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3"/>
                                                {new Date(post.scheduledAt!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2 text-muted-foreground mt-1">{post.content}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- YEARLY VIEW ---
const YearlyView = ({ selectedDate, onDateChange, onTabChange }: { selectedDate: Date, onDateChange: (date: Date) => void, onTabChange: (tab: string) => void }) => {
    const year = getYear(selectedDate);
    const months = Array.from({ length: 12 }, (_, i) => i);

    const getPostCountForMonth = (month: number) => {
        return scheduledPosts.filter(p => {
            const postDate = new Date(p.scheduledAt!);
            return getYear(postDate) === year && getMonth(postDate) === month;
        }).length;
    };

    const handleMonthClick = (month: number) => {
        onDateChange(setMonth(new Date(year, 0, 1), month));
        onTabChange('monthly');
    };

    return (
        <div className="p-4 border rounded-md">
            <h3 className="text-lg font-bold text-center mb-4">{year} Yılı İçerik Yoğunluğu</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {months.map(month => {
                    const postCount = getPostCountForMonth(month);
                    const opacity = Math.min(postCount / 10, 1); // Max 10 posts for full opacity
                    return (
                        <Button 
                            key={month}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center gap-1"
                            style={{ backgroundColor: postCount > 0 ? `rgba(59, 130, 246, ${opacity})` : undefined, color: postCount > 0 ? 'white': undefined }}
                            onClick={() => handleMonthClick(month)}
                        >
                            <span className="font-semibold">{format(new Date(year, month), 'MMMM', { locale: tr })}</span>
                            <span className={cn("text-xs", postCount > 0 ? 'text-white/80' : 'text-muted-foreground')}>{postCount} gönderi</span>
                        </Button>
                    )
                })}
            </div>
        </div>
    )
}


export const ContentCalendar = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [activeTab, setActiveTab] = useState('monthly');

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                        <CardTitle>İçerik Takvimi</CardTitle>
                        <CardDescription>Planlanmış sosyal medya gönderilerinin takvimi.</CardDescription>
                    </div>
                     <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="daily">Günlük</TabsTrigger>
                            <TabsTrigger value="weekly">Haftalık</TabsTrigger>
                            <TabsTrigger value="monthly">Aylık</TabsTrigger>
                            <TabsTrigger value="yearly">Yıllık</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                 <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsContent value="monthly">
                        <MonthlyView selectedDate={date} onDateChange={setDate} />
                    </TabsContent>
                     <TabsContent value="daily">
                        <DailyView selectedDate={date} />
                    </TabsContent>
                    <TabsContent value="weekly">
                        <WeeklyView selectedDate={date || new Date()} onDateChange={setDate} />
                    </TabsContent>
                    <TabsContent value="yearly">
                        <YearlyView selectedDate={date || new Date()} onDateChange={setDate} onTabChange={setActiveTab} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

    