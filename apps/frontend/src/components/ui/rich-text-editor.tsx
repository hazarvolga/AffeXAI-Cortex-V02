'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { ticketEditorExtensions } from './ticket-editor-extensions';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Paperclip,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
    content?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    onFileUpload?: (file: File) => Promise<string>; // Returns uploaded file URL
    className?: string;
    allowFileUploads?: boolean;
}

export function RichTextEditor({
    content = '',
    onChange,
    placeholder = 'Sorununuzu detaylıca yazın...',
    onFileUpload,
    allowFileUploads = true,
    className,
}: RichTextEditorProps) {
    const { toast } = useToast();
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: ticketEditorExtensions(placeholder),
        immediatelyRender: false,
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
    });

    const handleImageUpload = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Check file size (max 5MB for images)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: 'Hata',
                    description: 'Görsel boyutu 5MB\'dan küçük olmalıdır',
                    variant: 'destructive',
                });
                return;
            }

            setIsUploading(true);
            try {
                if (onFileUpload) {
                    // Upload via API
                    const url = await onFileUpload(file);
                    editor?.chain().focus().setImage({ src: url }).run();
                } else {
                    // Use base64 as fallback
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const url = e.target?.result as string;
                        editor?.chain().focus().setImage({ src: url }).run();
                    };
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                toast({
                    title: 'Hata',
                    description: 'Görsel yüklenirken bir hata oluştu',
                    variant: 'destructive',
                });
            } finally {
                setIsUploading(false);
            }
        };
        input.click();
    }, [editor, onFileUpload, toast]);

    const handleFileUpload = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: 'Hata',
                    description: 'Dosya boyutu 10MB\'dan küçük olmalıdır',
                    variant: 'destructive',
                });
                return;
            }

            setIsUploading(true);
            try {
                if (onFileUpload) {
                    const url = await onFileUpload(file);
                    // Insert as link
                    editor
                        ?.chain()
                        .focus()
                        .insertContent(`<a href="${url}" target="_blank">${file.name}</a> `)
                        .run();
                } else {
                    toast({
                        title: 'Uyarı',
                        description: 'Dosya yükleme özelliği aktif değil',
                        variant: 'destructive',
                    });
                }
            } catch (error) {
                toast({
                    title: 'Hata',
                    description: 'Dosya yüklenirken bir hata oluştu',
                    variant: 'destructive',
                });
            } finally {
                setIsUploading(false);
            }
        };
        input.click();
    }, [editor, onFileUpload, toast]);

    const handleAddLink = () => {
        if (!linkUrl) return;

        if (linkText) {
            editor
                ?.chain()
                .focus()
                .insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a> `)
                .run();
        } else {
            editor?.chain().focus().setLink({ href: linkUrl }).run();
        }

        setLinkUrl('');
        setLinkText('');
        setIsLinkDialogOpen(false);
    };

    if (!editor) {
        return null;
    }

    return (
        <div className={cn('border rounded-lg overflow-hidden', className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
                {/* Text Formatting */}
                <div className="flex items-center gap-1 pr-2 border-r">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-accent')}
                        title="Kalın (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-accent')}
                        title="İtalik (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-accent')}
                        title="Altı Çizili (Ctrl+U)"
                    >
                        <UnderlineIcon className="h-4 w-4" />
                    </Button>
                </div>

                {/* Lists */}
                <div className="flex items-center gap-1 pr-2 border-r">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-accent')}
                        title="Madde İşaretli Liste"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-accent')}
                        title="Numaralı Liste"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 pr-2 border-r">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
                        title="Sola Hizala"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
                        title="Ortala"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
                        title="Sağa Hizala"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Media & Links */}
                <div className="flex items-center gap-1 pr-2 border-r">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsLinkDialogOpen(true)}
                        className="h-8 w-8 p-0"
                        title="Link Ekle"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleImageUpload}
                        className="h-8 w-8 p-0"
                        title="Görsel Ekle"
                        disabled={isUploading || !allowFileUploads}
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleFileUpload}
                        className="h-8 w-8 p-0"
                        title="Dosya Ekle"
                        disabled={isUploading || !allowFileUploads}
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                </div>

                {/* Undo/Redo */}
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="h-8 w-8 p-0"
                        title="Geri Al (Ctrl+Z)"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="h-8 w-8 p-0"
                        title="Yinele (Ctrl+Y)"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} className="bg-background" />

            {/* Link Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Link Ekle</DialogTitle>
                        <DialogDescription>
                            Eklemek istediğiniz linkin URL'sini girin
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="link-url">URL</Label>
                            <Input
                                id="link-url"
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link-text">Görünen Metin (Opsiyonel)</Label>
                            <Input
                                id="link-text"
                                placeholder="Tıklayın"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleAddLink}>Ekle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
