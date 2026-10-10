import React from 'react';
import { Button } from "@/components/ui/button";
import { Table, Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";

type ViewType = 'table' | 'calendar';

interface ViewToggleProps {
    view: ViewType;
    onViewChange: (view: ViewType) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex items-center border border-white/10 p-1 bg-black/40">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('table')}
                className={cn(
                    "h-7 px-3 text-[10px] uppercase tracking-widest rounded-none transition-all",
                    view === 'table'
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                )}
            >
                <Table className="w-3 h-3 mr-2" />
                List
            </Button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('calendar')}
                className={cn(
                    "h-7 px-3 text-[10px] uppercase tracking-widest rounded-none transition-all",
                    view === 'calendar'
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                )}
            >
                <Calendar className="w-3 h-3 mr-2" />
                Calendar
            </Button>
        </div>
    );
}
