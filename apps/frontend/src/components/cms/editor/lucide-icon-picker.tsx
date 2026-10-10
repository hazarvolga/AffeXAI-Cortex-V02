'use client';

import React, { useState, useMemo, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { X, Search, Grid3X3 } from 'lucide-react';

// Icon categories for better organization
const ICON_CATEGORIES = {
  all: { label: 'Tümü', icons: [] as string[] },
  general: {
    label: 'Genel',
    icons: [
      'Home', 'Search', 'Settings', 'Menu', 'MoreHorizontal', 'MoreVertical',
      'Check', 'X', 'Plus', 'Minus', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
      'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ExternalLink', 'Link',
      'Copy', 'Clipboard', 'Download', 'Upload', 'Share', 'Share2',
      'Bookmark', 'Heart', 'Star', 'ThumbsUp', 'ThumbsDown', 'Flag',
      'Bell', 'BellRing', 'Clock', 'Calendar', 'CalendarDays', 'Timer',
      'Zap', 'Sparkles', 'Flame', 'Sun', 'Moon', 'Cloud',
    ],
  },
  media: {
    label: 'Medya',
    icons: [
      'Image', 'Images', 'Camera', 'Video', 'Film', 'Music', 'Mic', 'Volume2',
      'Play', 'Pause', 'PlayCircle', 'StopCircle', 'SkipForward', 'SkipBack',
      'Youtube', 'Instagram', 'Twitter', 'Facebook', 'Linkedin', 'Github',
      'Rss', 'Podcast', 'Radio', 'Tv', 'Monitor', 'Smartphone',
      'Headphones', 'Speaker', 'Aperture', 'Focus', 'Scan', 'QrCode',
    ],
  },
  files: {
    label: 'Dosyalar',
    icons: [
      'File', 'FileText', 'FileImage', 'FileVideo', 'FileAudio', 'FileCode',
      'FilePlus', 'FileMinus', 'FileCheck', 'FileX', 'Files', 'Folder',
      'FolderOpen', 'FolderPlus', 'Archive', 'Package', 'Box', 'Boxes',
      'Paperclip', 'Inbox', 'Mail', 'MailOpen', 'Send', 'MessageSquare',
      'BookOpen', 'Book', 'Bookmark', 'Library', 'Newspaper', 'ScrollText',
    ],
  },
  business: {
    label: 'İş',
    icons: [
      'Building', 'Building2', 'Briefcase', 'Wallet', 'CreditCard', 'Banknote',
      'DollarSign', 'Euro', 'PiggyBank', 'Receipt', 'Percent', 'TrendingUp',
      'TrendingDown', 'BarChart', 'BarChart2', 'BarChart3', 'PieChart', 'LineChart',
      'Users', 'User', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX',
      'Award', 'Trophy', 'Medal', 'Crown', 'Target', 'Goal',
      'Presentation', 'Kanban', 'ClipboardList', 'ListChecks', 'CheckSquare', 'Square',
    ],
  },
  tech: {
    label: 'Teknoloji',
    icons: [
      'Code', 'Code2', 'Terminal', 'Command', 'Cpu', 'HardDrive',
      'Server', 'Database', 'Cloud', 'CloudDownload', 'CloudUpload', 'Wifi',
      'Globe', 'Globe2', 'Network', 'Router', 'Laptop', 'Monitor',
      'Smartphone', 'Tablet', 'Watch', 'Gamepad2', 'Keyboard', 'Mouse',
      'Bug', 'Wrench', 'Settings', 'Settings2', 'Cog', 'Tool',
      'GitBranch', 'GitCommit', 'GitMerge', 'GitPullRequest', 'Github', 'Gitlab',
    ],
  },
  navigation: {
    label: 'Navigasyon',
    icons: [
      'Map', 'MapPin', 'MapPinned', 'Compass', 'Navigation', 'Navigation2',
      'Route', 'Signpost', 'Milestone', 'Flag', 'Locate', 'LocateFixed',
      'Move', 'Move3d', 'Maximize', 'Minimize', 'Expand', 'Shrink',
      'LayoutGrid', 'LayoutList', 'LayoutDashboard', 'Rows', 'Columns', 'Grid',
      'SplitSquareHorizontal', 'SplitSquareVertical', 'PanelLeft', 'PanelRight', 'PanelTop', 'PanelBottom',
    ],
  },
  education: {
    label: 'Eğitim',
    icons: [
      'GraduationCap', 'BookOpen', 'Book', 'BookMarked', 'Library', 'School',
      'Lightbulb', 'Brain', 'Puzzle', 'Blocks', 'Shapes', 'Palette',
      'Pen', 'Pencil', 'PenTool', 'Eraser', 'Highlighter', 'Type',
      'Languages', 'Calculator', 'Ruler', 'Compass', 'Microscope', 'Telescope',
      'Atom', 'Dna', 'FlaskConical', 'TestTube', 'Beaker', 'Stethoscope',
    ],
  },
  security: {
    label: 'Güvenlik',
    icons: [
      'Lock', 'Unlock', 'Key', 'KeyRound', 'Shield', 'ShieldCheck',
      'ShieldAlert', 'ShieldOff', 'Eye', 'EyeOff', 'Fingerprint', 'Scan',
      'AlertTriangle', 'AlertCircle', 'AlertOctagon', 'Info', 'HelpCircle', 'CircleHelp',
      'CheckCircle', 'CheckCircle2', 'XCircle', 'Ban', 'CircleSlash', 'OctagonAlert',
      'Siren', 'Verified', 'BadgeCheck', 'BadgeAlert', 'BadgeX', 'BadgeInfo',
    ],
  },
};

// Get all unique icon names from lucide-react
const getAllIconNames = (): string[] => {
  const iconNames = Object.keys(LucideIcons).filter(
    (key) =>
      key !== 'default' &&
      key !== 'createLucideIcon' &&
      key !== 'icons' &&
      typeof (LucideIcons as any)[key] === 'function' &&
      /^[A-Z]/.test(key)
  );
  return iconNames.sort();
};

// Popular/commonly used icons for quick access
const POPULAR_ICONS = [
  'Home', 'Search', 'User', 'Users', 'Settings', 'Mail', 'Phone', 'MapPin',
  'Calendar', 'Clock', 'Star', 'Heart', 'Check', 'X', 'Plus', 'Minus',
  'ArrowRight', 'ArrowLeft', 'ChevronDown', 'ChevronRight', 'ExternalLink', 'Link',
  'File', 'FileText', 'Folder', 'Image', 'Video', 'Music', 'Download', 'Upload',
  'Share', 'Copy', 'Edit', 'Trash', 'Eye', 'EyeOff', 'Lock', 'Unlock',
  'Bell', 'MessageSquare', 'Send', 'Bookmark', 'Tag', 'Filter', 'Sort', 'Layers',
  'Rss', 'BookOpen', 'GraduationCap', 'Award', 'Trophy', 'Target', 'Zap', 'Sparkles',
  'Building', 'Building2', 'Briefcase', 'ShoppingCart', 'CreditCard', 'Wallet',
  'Globe', 'Code', 'Terminal', 'Database', 'Server', 'Cloud', 'Wifi', 'Smartphone',
];

interface LucideIconPickerProps {
  value?: string | null;
  onChange: (iconName: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const LucideIconPicker: React.FC<LucideIconPickerProps> = ({
  value,
  onChange,
  placeholder = 'İkon seç',
  disabled = false,
  showLabel = false,
  label = 'İkon',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get all icon names
  const allIconNames = useMemo(() => getAllIconNames(), []);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons: string[] = [];

    if (selectedCategory === 'all') {
      icons = searchQuery ? allIconNames : POPULAR_ICONS;
    } else {
      icons = ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES]?.icons || [];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      icons = allIconNames.filter((name) => name.toLowerCase().includes(query));
    }

    return icons.slice(0, 100); // Limit for performance
  }, [searchQuery, selectedCategory, allIconNames]);

  // Render icon by name
  const renderIcon = useCallback((iconName: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;

    const sizeClass = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    }[size];

    return <IconComponent className={sizeClass} />;
  }, []);

  // Handle icon selection
  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearchQuery('');
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && <Label>{label}</Label>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between h-10 px-3"
          >
            <div className="flex items-center gap-2">
              {value ? (
                <>
                  {renderIcon(value, 'md')}
                  <span className="text-sm">{value}</span>
                </>
              ) : (
                <>
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{placeholder}</span>
                </>
              )}
            </div>
            {value && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>İkon Seç</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İkon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(key);
                    setSearchQuery('');
                  }}
                  className="h-7 text-xs"
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Icon Grid */}
            <ScrollArea className="h-[400px] pr-4">
              {filteredIcons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>İkon bulunamadı</p>
                  <p className="text-sm">Farklı bir arama terimi deneyin</p>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2">
                  {filteredIcons.map((iconName) => (
                    <Button
                      key={iconName}
                      variant={value === iconName ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleSelect(iconName)}
                      className={cn(
                        'h-12 w-12 p-0 flex flex-col items-center justify-center gap-1',
                        value === iconName && 'ring-2 ring-primary'
                      )}
                      title={iconName}
                    >
                      {renderIcon(iconName, 'lg')}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Selected Icon Info */}
            {value && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {renderIcon(value, 'lg')}
                  <div>
                    <p className="font-medium">{value}</p>
                    <p className="text-xs text-muted-foreground">Seçili ikon</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
                  Temizle
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LucideIconPicker;
