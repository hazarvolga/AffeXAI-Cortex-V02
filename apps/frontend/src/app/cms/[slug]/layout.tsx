import { ReactNode } from 'react';

// This layout provides a basic structure for CMS pages
// Header and footer are now handled per-page based on layout options
export default function CmsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {children}
    </div>
  );
}