import { AlertCircle, FileText, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FormLoadingState({ label = 'Formlar yükleniyor' }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] text-white/50" role="status">
      <LoaderCircle className="mr-3 h-5 w-5 animate-spin text-[#ff8c00]" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function FormErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/[0.04] px-6 text-center" role="alert">
      <AlertCircle className="mb-4 h-8 w-8 text-red-400" aria-hidden="true" />
      <p className="max-w-lg text-sm text-white/70">{message}</p>
      {onRetry && <Button className="mt-5" variant="outline" onClick={onRetry}>Tekrar dene</Button>}
    </div>
  );
}

export function FormEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.01] px-6 text-center">
      <FileText className="mb-4 h-9 w-9 text-[#ff8c00]" aria-hidden="true" />
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-white/40">{description}</p>
    </div>
  );
}
