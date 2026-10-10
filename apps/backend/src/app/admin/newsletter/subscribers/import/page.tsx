
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, CheckCircle, Circle, FileUp, ListFilter, Loader2, Upload, Users, X, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { groups, segments } from '@/lib/newsletter-data';


type Step = 'upload' | 'verifying' | 'results';

const StepIndicator = ({ currentStep }: { currentStep: Step }) => {
    const steps = [
        { id: 'upload', title: '1. Yükle ve Ayarla' },
        { id: 'verifying', title: '2. Doğrulama' },
        { id: 'results', title: '3. Sonuçlar ve Onay' },
    ];
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <ol className="flex items-center w-full">
            {steps.map((step, index) => (
                <li
                    key={step.id}
                    className="flex w-full items-center text-sm font-medium after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block"
                >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${index <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {index < currentStepIndex ? <Check/> : index + 1}
                    </span>
                </li>
            ))}
        </ol>
    )
};


export default function ImportSubscribersPage() {
    const [step, setStep] = useState<Step>('upload');
    const [fileName, setFileName] = useState('');
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    const startVerification = () => {
        setStep('verifying');
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + 10;
                if (newProgress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setStep('results'), 500);
                    return 100;
                }
                return newProgress;
            });
        }, 300);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/newsletter/subscribers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Toplu Abone İçe Aktarma</h1>
                    <p className="text-muted-foreground">Abonelerinizi CSV dosyasıyla içe aktarın ve e-posta adreslerini doğrulayın.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                   <StepIndicator currentStep={step} />
                </CardHeader>

                {step === 'upload' && (
                    <>
                        <CardContent className="space-y-8 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="file-upload">1. CSV Dosyasını Yükleyin</Label>
                                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                                    <div className="text-center">
                                    <FileUp className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                        <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                                        >
                                        <span>Dosyanızı yükleyin</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv" />
                                        </label>
                                        <p className="pl-1">veya sürükleyip bırakın</p>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-600">Sadece CSV dosyaları. En fazla 10MB.</p>
                                    {fileName && <p className="text-sm font-medium mt-4 text-green-600">Yüklendi: {fileName}</p>}
                                    </div>
                                </div>
                            </div>
                            <Separator />
                             <div className="space-y-4">
                                <Label>2. Gruplara veya Segmentlere Ekle (Opsiyonel)</Label>
                                <div className="grid sm:grid-cols-2 gap-6">
                                     <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Bir Gruba Ekle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {groups.map(group => (
                                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                             ))}
                                        </SelectContent>
                                    </Select>
                                     <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Bir Segmente Ekle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {segments.map(segment => (
                                                <SelectItem key={segment.id} value={segment.id}>{segment.name}</SelectItem>
                                             ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={startVerification} disabled={!fileName}>
                                Doğrulamayı Başlat <ArrowLeft className="mr-2 h-4 w-4 rotate-180"/>
                            </Button>
                        </CardFooter>
                    </>
                )}

                {step === 'verifying' && (
                    <CardContent className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                        <h2 className="text-2xl font-semibold">E-postalar Doğrulanıyor...</h2>
                        <p className="text-muted-foreground mt-2 mb-6">Lütfen bekleyin, aboneleriniz kontrol ediliyor. Bu işlem birkaç dakika sürebilir.</p>
                        <Progress value={progress} className="w-full max-w-md" />
                         <p className="text-sm font-medium mt-2">{progress}%</p>
                    </CardContent>
                )}
                
                {step === 'results' && (
                    <>
                    <CardContent className="space-y-6 pt-6">
                         <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Doğrulama Tamamlandı!</AlertTitle>
                            <AlertDescription>
                                İşte {fileName} dosyanızın analiz sonuçları. Lütfen sonuçları inceleyip içe aktarma işlemini onaylayın.
                            </AlertDescription>
                        </Alert>

                         <div className="grid md:grid-cols-3 gap-4 text-center">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-green-600 flex items-center justify-center gap-2"><CheckCircle/>Geçerli</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">1,152</p>
                                    <p className="text-xs text-muted-foreground">Abone listeye eklenecek.</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-red-600 flex items-center justify-center gap-2"><XCircle/>Geçersiz</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">87</p>
                                    <p className="text-xs text-muted-foreground">Geçersiz format, sahte alan adları.</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-yellow-600 flex items-center justify-center gap-2"><ListFilter/>Riskli</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">11</p>
                                    <p className="text-xs text-muted-foreground">Tek kullanımlık e-postalar, manuel onay bekliyor.</p>
                                </CardContent>
                            </Card>
                        </div>
                         <p className="text-sm text-muted-foreground text-center">
                            Sadece "Geçerli" olarak işaretlenen e-postalar abone listenize eklenecektir. Geçersiz ve riskli e-postaların detaylı raporunu indirebilirsiniz.
                        </p>
                    </CardContent>
                     <CardFooter className="flex justify-between">
                         <Button variant="outline" onClick={() => setStep('upload')}>
                            <ArrowLeft className="mr-2 h-4 w-4"/> Geri Dön
                        </Button>
                         <div className='flex gap-2'>
                            <Button variant="secondary">Detaylı Raporu İndir</Button>
                            <Button>
                                1,152 Aboneyi İçe Aktar
                            </Button>
                        </div>
                    </CardFooter>
                    </>
                )}


            </Card>
        </div>
    );
}
