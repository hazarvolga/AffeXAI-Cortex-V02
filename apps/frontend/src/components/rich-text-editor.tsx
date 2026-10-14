"use client";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Link from "@tiptap/extension-link";
import { Toggle } from "@/components/ui/toggle";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Paperclip,
  AtSign,
  Link as LinkIcon,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import tippy from "tippy.js";
import { promptDialog } from "@/lib/dialogs/dialog-queue";

interface MentionItem {
  id: string;
  label: string;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  // New props for HTML support
  htmlMode?: boolean; // If true, works with HTML input/output
  showToolbar?: boolean; // Control toolbar visibility
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

// Mention suggestion component
interface MentionListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

export const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    // A new suggestion list starts from the first item (adjusted during render).
    const [listedItems, setListedItems] = useState(items);
    if (listedItems !== items) {
      setListedItems(items);
      setSelectedIndex(0);
    }

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          if (items.length === 0) return false;
          if (event.key === "ArrowUp") {
            setSelectedIndex(
              (index) => (index + items.length - 1) % items.length,
            );
            return true;
          }
          if (event.key === "ArrowDown") {
            setSelectedIndex((index) => (index + 1) % items.length);
            return true;
          }
          if (event.key === "Enter") {
            selectItem(selectedIndex);
            return true;
          }
          return false;
        },
      }),
      [items, selectedIndex, command],
    );

    return (
      <div className="bg-white border border-gray-200 rounded-md shadow-lg p-1 w-48">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`px-3 py-2 cursor-pointer rounded ${
                index === selectedIndex ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => selectItem(index)}
            >
              @{item.label}
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-gray-500">Kullanıcı bulunamadı</div>
        )}
      </div>
    );
  },
);
MentionList.displayName = "MentionList";

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Write something...",
  className,
  attachments = [],
  onAttachmentsChange,
  htmlMode = false,
  showToolbar = true,
}: RichTextEditorProps) {
  const [suggestionItems, setSuggestionItems] = useState<MentionItem[]>([
    { id: "usr-001", label: "Ahmet Yılmaz" },
    { id: "usr-002", label: "Zeynep Kaya" },
    { id: "usr-003", label: "Mehmet Demir" },
    { id: "usr-004", label: "Elif Şahin" },
  ]);

  const [suggestionRange, setSuggestionRange] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const popupRef = useRef<any>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          items: ({ query }) => {
            return suggestionItems
              .filter((item) =>
                item.label.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 5);
          },
          render: () => {
            let component: ReactRenderer<
              MentionListHandle,
              MentionListProps
            > | null = null;
            let popup: any = null;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer<
                  MentionListHandle,
                  MentionListProps
                >(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });

                popupRef.current = popup;
              },

              onUpdate: (props: any) => {
                component?.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup?.[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown: (props: any) => {
                if (props.event.key === "Escape") {
                  popup?.[0].hide();
                  return true;
                }

                return component?.ref?.onKeyDown(props) ?? false;
              },

              onExit: () => {
                popup?.[0].destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    [suggestionItems],
  );

  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions,
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        ),
      },
    },
  });

  const insertMention = (user: MentionItem) => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: "mention",
            attrs: user,
          },
          {
            type: "text",
            text: " ",
          },
        ])
        .run();
    }
  };

  if (!editor) {
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onAttachmentsChange) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newAttachments.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }

    onAttachmentsChange([...attachments, ...newAttachments]);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="border rounded-md">
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b">
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("link")}
            onPressedChange={async () => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                const url = await promptDialog({
                  title: "URL:",
                  label: "URL:",
                });
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("blockquote")}
            onPressedChange={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          {!htmlMode && (
            <Toggle
              size="sm"
              onPressedChange={() => {
                // Insert @ symbol to trigger mention
                editor.chain().focus().insertContent("@").run();
              }}
            >
              <AtSign className="h-4 w-4" />
            </Toggle>
          )}
          {onAttachmentsChange && (
            <label>
              <Toggle size="sm" asChild>
                <span>
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                  />
                </span>
              </Toggle>
            </label>
          )}
        </div>
      )}
      <EditorContent
        editor={editor}
        placeholder={placeholder}
        className="prose prose-sm max-w-none p-3"
      />
      {attachments.length > 0 && (
        <div className="p-2 border-t">
          <div className="text-sm font-medium mb-1">Ekler:</div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs"
              >
                <Paperclip className="h-3 w-3" />
                <span>{attachment.name}</span>
                <span className="text-muted-foreground">
                  ({Math.round(attachment.size / 1024)} KB)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
