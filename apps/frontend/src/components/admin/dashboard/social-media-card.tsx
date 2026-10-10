import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { socialMediaService, SocialAccount } from "@/lib/api/socialMediaService";

export function SocialMediaCard() {
  const params = useParams();
  const tenant = params?.tenant as string || "default";

  const [loading, setLoading] = useState(true);
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const accounts = await socialMediaService.getAccounts();
        setConnectedCount(accounts.filter(a => a.isActive).length);
      } catch (error) {
        console.error("Failed to fetch social accounts", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sosyal Medya</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">Bağlı Hesap</p>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href={`/${tenant}/admin/social`}>
            Yönet <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
