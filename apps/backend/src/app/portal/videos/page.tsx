
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, PlayCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { educationData } from "@/lib/education-data";
import { Button } from "@/components/ui/button";

export default function VideosPage() {
    const videos = educationData.content.videos;
    
    return (
        <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Eğitim Videoları</h2>
                    <p className="text-muted-foreground">
                        Allplan ve diğer ürünler hakkında ipuçları ve eğitimler.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="w-full max-w-sm">
                        <Input placeholder="Videolarda ara..." icon={Search} />
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/portal/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Geri Dön
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.map((item, index) => (
                    <Link href="#" key={index}>
                        <Card className="overflow-hidden group h-full flex flex-col">
                            <div className="relative aspect-video">
                                <Image src={item.thumbnail} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105"/>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <PlayCircle className="h-16 w-16 text-white/80 group-hover:text-white transition-colors"/>
                                </div>
                            </div>
                            <CardContent className="p-4 flex-grow">
                                <p className="font-semibold truncate group-hover:text-primary">{item.title}</p>
                                <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
