'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  itemName?: string;
}

/**
 * Professional delete confirmation dialog
 * 
 * @example
 * ```tsx
 * const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 * const [pageToDelete, setPageToDelete] = useState<string | null>(null);
 * 
 * <DeleteConfirmDialog
 *   open={deleteDialogOpen}
 *   onOpenChange={setDeleteDialogOpen}
 *   onConfirm={async () => {
 *     await cmsService.deletePage(pageToDelete!);
 *     fetchPages();
 *   }}
 *   title="Sayfayı Sil"
 *   description="Bu sayfayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
 *   itemName="sayfa"
 * />
 * ```
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Silme Onayı',
  description = 'Bu öğeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
  confirmText = 'Sil',
  cancelText = 'İptal',
  isDeleting = false,
  itemName,
}: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-foreground">
                {itemName}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Siliniyor...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
