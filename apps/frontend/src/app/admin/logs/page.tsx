
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

const logData = [
  { id: 'log-001', user: 'admin@example.com', action: 'Kullanıcı Güncelledi', details: 'Kullanıcı ID: usr-002, Rol: Editör -> Admin', timestamp: '2024-07-29 14:30:15', level: 'info' },
  { id: 'log-002', user: 'editor@example.com', action: 'İçerik Oluşturdu', details: 'Başlık: Yeni Başarı Hikayesi', timestamp: '2024-07-29 11:05:42', level: 'info' },
  { id: 'log-003', user: 'viewer@example.com', action: 'Giriş Başarısız', details: 'IP: 192.168.1.10, Neden: Yanlış şifre', timestamp: '2024-07-29 09:15:03', level: 'warning' },
  { id: 'log-004', user: 'admin@example.com', action: 'Sistem Ayarı Değiştirdi', details: 'Ayar: Bakım Modu, Değer: Aktif', timestamp: '2024-07-28 23:00:00', level: 'critical' },
  { id: 'log-005', user: 'editor@example.com', action: 'İçerik Sildi', details: 'İçerik ID: post-123', timestamp: '2024-07-28 16:45:21', level: 'info' },
];


export default function ActivityLogsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Aktivite Kayıtları</CardTitle>
                <CardDescription>Sistemde gerçekleşen tüm kullanıcı ve sistem aktivitelerinin kaydı.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh] w-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kullanıcı</TableHead>
                                <TableHead>Eylem</TableHead>
                                <TableHead>Detaylar</TableHead>
                                <TableHead>Zaman Damgası</TableHead>
                                <TableHead>Seviye</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logData.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">{log.user}</TableCell>
                                    <TableCell>{log.action}</TableCell>
                                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                                    <TableCell>{log.timestamp}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.level === 'critical' ? 'destructive' : log.level === 'warning' ? 'default' : 'secondary'} className={log.level === 'warning' ? 'bg-yellow-500' : ''}>
                                            {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                 <Pagination className="mt-4">
                    <PaginationContent>
                        <PaginationItem>
                        <PaginationPrevious href="#" />
                        </PaginationItem>
                        {/* Sayfa numaraları burada oluşturulabilir */}
                        <PaginationItem>
                        <PaginationNext href="#" />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </CardContent>
        </Card>
    );
}
