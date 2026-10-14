import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, LucideIcon } from "lucide-react";
import Link from "next/link";

interface ComingSoonProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  backLink?: string;
  backLabel?: string;
}

/**
 * Placeholder for portal features without a backend yet. It names the page with
 * the route's single h1 and promises no delivery date.
 */
export function ComingSoon({
  icon: Icon = Rocket,
  title,
  description,
  backLink = "/portal/dashboard",
  backLabel = "Panele dön",
}: ComingSoonProps) {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Icon aria-hidden className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            <CardDescription className="text-lg">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Bu özellik henüz kullanıma açık değil. Açıldığında bu sayfada yer
            alacak.
          </p>
          <Button asChild>
            <Link href={backLink}>
              <ArrowLeft aria-hidden className="mr-2 h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
