'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Trash2, UserX } from 'lucide-react';
import { User } from '@affexai/shared-types';

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userId: string, hardDelete: boolean) => Promise<void>;
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
}: DeleteUserDialogProps) {
  const [hardDelete, setHardDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const isConfirmed = confirmText.toLowerCase() === 'sil';
  const userFullName = `${user.firstName} ${user.lastName}`;

  const handleConfirm = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await onConfirm(user.id, hardDelete);
      // Reset state
      setHardDelete(false);
      setConfirmText('');
      onOpenChange(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl">Kullanıcıyı Sil</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Bu işlem geri alınamaz!
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <Separator />

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{userFullName}</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{user.email}</p>
          </div>

          {/* Delete Options */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
              <Checkbox
                id="hardDelete"
                checked={hardDelete}
                onCheckedChange={(checked) => setHardDelete(checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="hardDelete"
                  className="text-sm font-medium cursor-pointer text-foreground"
                >
                  Kalıcı Olarak Sil (Hard Delete)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {hardDelete ? (
                    <>
                      <strong className="text-destructive">⚠️ Uyarı:</strong> Kullanıcı veritabanından tamamen silinecek.
                      Bu işlem geri alınamaz ve email adresi yeniden kullanılabilir.
                    </>
                  ) : (
                    <>
                      Kullanıcı geçici olarak devre dışı bırakılacak (Soft Delete).
                      Gerekirse geri yüklenebilir. Email adresi bloke kalır.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmText" className="text-sm font-medium text-foreground">
                Onaylamak için <code className="px-1.5 py-0.5 bg-muted rounded text-destructive font-semibold">SİL</code> yazın
              </Label>
              <input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                placeholder="SİL"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Trash2 className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-xs text-destructive">
                <strong>Silme İşlemi:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Kullanıcının tüm verilerine erişim kaybedilir</li>
                  <li>İlişkili kayıtlar etkilenebilir</li>
                  {hardDelete && (
                    <>
                      <li className="font-semibold">Veritabanından kalıcı olarak silinir</li>
                      <li className="font-semibold">Email adresi yeniden kullanılabilir</li>
                    </>
                  )}
                  {!hardDelete && (
                    <li>Gerekirse admin tarafından geri yüklenebilir</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              'Siliniyor...'
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {hardDelete ? 'Kalıcı Olarak Sil' : 'Kullanıcıyı Sil'}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
