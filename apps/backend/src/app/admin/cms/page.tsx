'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const CmsDashboardPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">CMS Yönetim Paneli</h1>
        <p className="text-muted-foreground">İçerik yönetim sistemini yönetin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sayfa Yönetimi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              CMS sayfalarını oluşturun, düzenleyin ve yayınlayın.
            </p>
            <Link href="/admin/cms/pages">
              <Button className="w-full">Sayfaları Yönet</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Görsel Editör</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Görsel arayüz üzerinden sayfalarınızı oluşturun ve düzenleyin.
            </p>
            <Link href="/admin/cms/editor">
              <Button className="w-full">Editörü Aç</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medya Yönetimi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Medya dosyalarınızı yükleyin ve yönetin.
            </p>
            <Link href="/admin/cms/media">
              <Button className="w-full">Medya Kitaplığı</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İçerik Bileşenleri</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Kullanılabilir içerik bileşenlerini görüntüleyin.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Bileşenleri Görüntüle
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Başlangıç</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">1. Yeni Sayfa Oluştur</h3>
                <p className="text-sm text-muted-foreground">
                  Sayfa yönetimi bölümünden yeni bir sayfa oluşturun.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">2. Görsel Editörü Kullan</h3>
                <p className="text-sm text-muted-foreground">
                  Sürükle-bırak arayüzü ile sayfanızı tasarllayın.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">3. Yayınla</h3>
                <p className="text-sm text-muted-foreground">
                  Sayfanızı yayınlayarak ziyaretçilerinize gösterin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CmsDashboardPage;