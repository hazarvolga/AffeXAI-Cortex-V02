import { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Breadcrumb } from '@/components/layout/breadcrumb';

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="theme-public flex min-h-screen flex-col bg-background">
      <Header />
      {/* Breadcrumb navigation - SEO optimized, auto-generated from URL */}
      <Breadcrumb 
        variant="minimal"
        showHomeIcon={true}
        hiddenPaths={['/']}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
