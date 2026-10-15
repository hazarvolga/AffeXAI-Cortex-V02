"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Search,
  Layout,
  Type,
  Image,
  Share2,
  ShoppingCart,
  Star,
  Code,
} from "lucide-react";

const BLOCK_CATEGORIES = [
  {
    id: "structure",
    label: "Yapı",
    icon: Layout,
    blocks: [
      { id: "one_column", label: "1 Sütun", icon: "▬" },
      { id: "two_column", label: "2 Sütun", icon: "▬▬" },
      { id: "three_column", label: "3 Sütun", icon: "▬▬▬" },
      { id: "spacer", label: "Boşluk", icon: "⎯" },
      { id: "divider", label: "Ayırıcı", icon: "━" },
    ],
  },
  {
    id: "content",
    label: "İçerik",
    icon: Type,
    blocks: [
      { id: "heading", label: "Başlık", icon: "H1" },
      { id: "text", label: "Metin", icon: "T" },
      { id: "button", label: "Buton", icon: "🔘" },
      { id: "list", label: "Liste", icon: "•" },
      { id: "quote", label: "Alıntı", icon: "❝" },
    ],
  },
  {
    id: "media",
    label: "Medya",
    icon: Image,
    blocks: [
      { id: "image", label: "Resim", icon: "🖼️" },
      { id: "image_text", label: "Resim+Metin", icon: "🖼️T" },
      { id: "video", label: "Video", icon: "▶️" },
      { id: "icon", label: "İkon", icon: "⭐" },
    ],
  },
  {
    id: "social",
    label: "Sosyal",
    icon: Share2,
    blocks: [
      { id: "social_links", label: "Sosyal Linkler", icon: "📱" },
      { id: "social_share", label: "Paylaş", icon: "↗️" },
    ],
  },
  {
    id: "ecommerce",
    label: "E-Ticaret",
    icon: ShoppingCart,
    blocks: [
      { id: "product", label: "Ürün Kartı", icon: "🛒" },
      { id: "product_grid", label: "Ürün Grid", icon: "⊞" },
      { id: "pricing_table", label: "Fiyat Tablosu", icon: "💰" },
      { id: "coupon", label: "Kupon", icon: "🎫" },
    ],
  },
  {
    id: "interactive",
    label: "Etkileşimli",
    icon: Star,
    blocks: [
      { id: "countdown", label: "Geri Sayım", icon: "⏱️" },
      { id: "rating", label: "Yıldız Puanı", icon: "⭐" },
      { id: "progress_bar", label: "İlerleme", icon: "▰" },
    ],
  },
  {
    id: "special",
    label: "Özel",
    icon: Code,
    blocks: [
      { id: "header", label: "Başlık Bölümü", icon: "▭" },
      { id: "footer", label: "Altbilgi", icon: "▁" },
      { id: "html_code", label: "HTML Kodu", icon: "<>" },
      { id: "logo", label: "Logo", icon: "🏢" },
    ],
  },
];

type BlockCategory = (typeof BLOCK_CATEGORIES)[number];
type LibraryBlock = BlockCategory["blocks"][number];

function BlockButton({
  block,
  categoryId,
  onBlockSelect,
}: {
  block: LibraryBlock;
  categoryId: string;
  onBlockSelect: (block: any) => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({ type: block.id, category: categoryId }),
        );
      }}
      onClick={() => onBlockSelect({ ...block, category: categoryId })}
      className="rounded-lg border bg-card p-3 text-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="mb-1 block text-2xl" aria-hidden="true">
        {block.icon}
      </span>
      <span className="block text-xs font-medium">{block.label}</span>
    </button>
  );
}

/** Clicking a block appends it to the email; blocks can also be dragged onto the canvas. */
export function BlockLibrarySidebar({
  onBlockSelect,
}: {
  onBlockSelect: (block: any) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const visibleCategories = BLOCK_CATEGORIES.map((category) => ({
    ...category,
    blocks: category.blocks.filter((block) =>
      block.label
        .toLocaleLowerCase("tr")
        .includes(searchQuery.toLocaleLowerCase("tr")),
    ),
  })).filter(
    (category) =>
      category.blocks.length > 0 &&
      (activeCategory === "all" || category.id === activeCategory),
  );
  const filters = [{ id: "all", label: "Tümü" }, ...BLOCK_CATEGORIES];

  return (
    <aside
      aria-label="Blok kütüphanesi"
      className="w-full max-h-[50vh] md:max-h-none md:w-80 border-b md:border-b-0 md:border-r bg-card flex flex-col"
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Blok kütüphanesi</h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Blok ara"
            placeholder="Blok ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div
          role="group"
          aria-label="Kategori"
          className="mt-3 flex flex-wrap gap-1"
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={activeCategory === filter.id}
              onClick={() => setActiveCategory(filter.id)}
              className={cn(
                "rounded-md px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeCategory === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-accent",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {visibleCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aramaya uyan blok yok.
            </p>
          )}
          {visibleCategories.map((category) => (
            <section
              key={category.id}
              aria-labelledby={`block-category-${category.id}`}
            >
              <h3
                id={`block-category-${category.id}`}
                className="text-sm font-medium mb-2 flex items-center gap-2"
              >
                <category.icon className="h-4 w-4" aria-hidden="true" />
                {category.label}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {category.blocks.map((block) => (
                  <BlockButton
                    key={block.id}
                    block={block}
                    categoryId={category.id}
                    onBlockSelect={onBlockSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
