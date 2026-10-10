'use client';

/**
 * Section Picker
 * Visual grid for selecting section templates
 */

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    allSectionTemplates,
    templateCategories,
    getTemplatesByCategory,
    SectionTemplate
} from './SectionTemplates';
import {
    type LucideIcon,
    Plus,
    Layout,
    Grid3x3,
    Megaphone,
    FileText,
    Quote,
    CreditCard,
    Mail,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const iconMap: Record<string, LucideIcon> = {
    Layout,
    Grid3x3,
    Megaphone,
    FileText,
    Quote,
    CreditCard,
    Mail,
};

interface SectionPickerProps {
    onSelect: (template: SectionTemplate) => void;
    trigger?: React.ReactNode;
}

export function SectionPicker({ onSelect, trigger }: SectionPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('hero');
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

    const handleSelect = (template: SectionTemplate) => {
        onSelect(template);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Section
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Section</DialogTitle>
                </DialogHeader>

                <Tabs
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    className="flex-1 flex flex-col overflow-hidden"
                >
                    {/* Category Tabs */}
                    <TabsList className="flex-shrink-0 h-auto flex-wrap gap-1 bg-transparent p-0 mb-4">
                        {templateCategories.map((cat) => {
                            const Icon = iconMap[cat.icon] || Layout;
                            const count = getTemplatesByCategory(cat.id as any).length;

                            return (
                                <TabsTrigger
                                    key={cat.id}
                                    value={cat.id}
                                    className={cn(
                                        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                                        'px-3 py-2 rounded-md border',
                                        count === 0 && 'opacity-50'
                                    )}
                                    disabled={count === 0}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {cat.label}
                                    {count > 0 && (
                                        <span className="ml-2 text-xs opacity-70">({count})</span>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {/* Template Grid */}
                    <div className="flex-1 overflow-y-auto">
                        {templateCategories.map((cat) => (
                            <TabsContent key={cat.id} value={cat.id} className="mt-0">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {getTemplatesByCategory(cat.id as any).map((template) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            isHovered={hoveredTemplate === template.id}
                                            onHover={() => setHoveredTemplate(template.id)}
                                            onLeave={() => setHoveredTemplate(null)}
                                            onSelect={() => handleSelect(template)}
                                        />
                                    ))}
                                </div>

                                {getTemplatesByCategory(cat.id as any).length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No templates in this category yet.</p>
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Template Card Component
 */
interface TemplateCardProps {
    template: SectionTemplate;
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
    onSelect: () => void;
}

function TemplateCard({
    template,
    isHovered,
    onHover,
    onLeave,
    onSelect
}: TemplateCardProps) {
    return (
        <motion.div
            className={cn(
                'relative rounded-lg border overflow-hidden cursor-pointer transition-all',
                'hover:border-primary hover:shadow-lg',
                isHovered && 'ring-2 ring-primary'
            )}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onSelect}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Preview Area */}
            <div
                className="aspect-video flex items-center justify-center"
                style={{ backgroundColor: template.previewColor }}
            >
                {template.previewImage ? (
                    <img
                        src={template.previewImage}
                        alt={template.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-white/80 text-center p-4">
                        <div className="text-2xl font-bold mb-1">
                            {template.name.charAt(0)}
                        </div>
                        <div className="text-xs opacity-70">Preview</div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3 bg-background">
                <h3 className="font-medium text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                </p>
            </div>

            {/* Hover Overlay */}
            {isHovered && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-primary/10 flex items-center justify-center"
                >
                    <Button size="sm" className="gap-2">
                        <Check className="h-4 w-4" />
                        Use Template
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}

export default SectionPicker;
