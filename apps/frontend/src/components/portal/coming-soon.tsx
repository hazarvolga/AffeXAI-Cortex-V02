import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Calendar, LucideIcon } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  expectedDate?: string;
  backLink?: string;
  backLabel?: string;
}

export function ComingSoon({
  icon: Icon = Rocket,
  title,
  description,
  expectedDate,
  backLink = "/portal/dashboard",
  backLabel = "Panele Dön"
}: ComingSoonProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[600px]">
      <Card className="max-w-2xl w-full mx-4">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl">{title}</CardTitle>
            <CardDescription className="text-lg">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {expectedDate && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Beklenen Tarih: {expectedDate}</span>
            </div>
          )}
          
          <div className="pt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Bu özellik şu anda geliştirme aşamasındadır. 
              Kullanıma sunulduğunda sizleri bilgilendireceğiz.
            </p>
            <Button asChild className="mt-4">
              <Link href={backLink}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
