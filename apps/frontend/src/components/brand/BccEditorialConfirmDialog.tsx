'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface BccEditorialConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export function BccEditorialConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "SYSTEM TERMINATION",
    description = "Abandoning this workflow will result in data loss. Unsaved configurations will be purged.",
    confirmText = "PURGE DATA",
    cancelText = "RESUME PROTOCOL",
    loading = false,
}: BccEditorialConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-[#0B0F19]/95 backdrop-blur-xl border border-red-500/30 text-white shadow-2xl shadow-red-900/10 max-w-md">
                <AlertDialogHeader className="space-y-4">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-xs tracking-[0.2em] uppercase">System Alert</span>
                    </div>

                    <AlertDialogTitle className="font-space-grotesk text-2xl tracking-tight text-white font-light">
                        {title}
                    </AlertDialogTitle>

                    <AlertDialogDescription className="font-mono text-xs text-white/60 leading-relaxed border-l-2 border-red-500/20 pl-4 py-1">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
                    <AlertDialogCancel
                        disabled={loading}
                        className="bg-transparent border border-white/10 text-white/70 hover:bg-white/5 hover:text-white hover:border-[#13ecec]/30 font-mono text-xs tracking-wider transition-all"
                    >
                        {cancelText}
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={loading}
                        className="bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/80 font-mono text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    >
                        {loading ? 'PROCESSING...' : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
