"use client";

import { useCallback, useState } from "react";
import { Brain, Loader2, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { httpClient } from "@/lib/api/http-client";
import { useAsyncEffect } from "@/hooks/use-async-effect";

interface CategorizationStats {
  source: "keyword_heuristic";
  trainingAvailable: false;
  totalTickets: number;
  categorizedTickets: number;
  totalPredictions: null;
  autoAssigned: null;
  averageConfidence: null;
  accuracyRate: null;
}

export function CategorizationInsights() {
  const [stats, setStats] = useState<CategorizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result =
        await httpClient.getWrapped<CategorizationStats>("/tickets/ai/stats");
      if (
        result.source !== "keyword_heuristic" ||
        !Number.isInteger(result.totalTickets) ||
        !Number.isInteger(result.categorizedTickets)
      ) {
        throw new Error("Unsupported statistics response");
      }
      setStats(result);
    } catch {
      setStats(null);
      setError(
        "Kategorizasyon bilgileri yüklenemedi. Oturumunuzu ve erişim yetkinizi kontrol ederek tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useAsyncEffect(() => {
    void reload();
  }, [reload]);

  return (
    <section className="space-y-6" aria-label="Kategorizasyon durumu">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-semibold">
            <Brain aria-hidden className="h-7 w-7" />
            Kategorizasyon durumu
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mevcut yöntem: sabit anahtar kelime kuralları.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void reload()}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Yenile
        </Button>
      </div>
      {loading && (
        <p role="status" className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Bilgiler yükleniyor…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-4 text-sm"
        >
          {error}
        </p>
      )}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Toplam destek talebi",
              value: stats.totalTickets.toLocaleString("tr-TR"),
              detail: "Bu çalışma alanındaki kayıtlar",
            },
            {
              label: "Kategori atanmış talep",
              value: stats.categorizedTickets.toLocaleString("tr-TR"),
              detail: "Atama kaynağından bağımsız kayıt sayısı",
            },
            {
              label: "Model doğruluğu",
              value: "Ölçülmedi",
              detail: "Doğrulanmış değerlendirme verisi yok",
            },
            {
              label: "Otomatik atama sayısı",
              value: "Ölçülmedi",
              detail: "Atama kaynağı için ölçüm kaydı yok",
            },
          ].map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <CardTitle className="text-sm">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Model eğitimi henüz kullanılamıyor</CardTitle>
          <CardDescription>
            Bu modül geçmiş taleplerle bir model eğitmiyor. Eğitim ve ölçülmüş
            model performansı ayrı bir geliştirme aşamasıdır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button disabled>Model eğitimi kullanılamıyor</Button>
          <p className="text-sm text-muted-foreground">
            Kategori önerileri başlık ve açıklamadaki kelimeleri sabit
            kurallarla eşleştirir. Öneri skoru, eşleşen kelimelerin göreli
            ağırlığıdır; doğruluk olasılığı değildir. Otomatik kategori seçimi
            bu göreli skorun %60 eşiğini kullanır.
          </p>
          <p className="text-sm text-muted-foreground">
            Toplam tahmin ve ortalama model güveni için de ölçüm kaydı
            bulunmuyor.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
