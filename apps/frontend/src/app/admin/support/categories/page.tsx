
'use client';
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Trash2,
  CornerDownRight,
} from 'lucide-react';
import { supportCategories, SupportCategory } from '@/lib/support-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const CategoryForm = ({
  category,
  categories,
}: {
  category?: SupportCategory;
  categories: SupportCategory[];
}) => {
  const isEditing = !!category;
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Kategoriyi Düzenle' : 'Yeni Kategori Oluştur'}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? `"${category.name}" kategorisinin bilgilerini güncelleyin.`
            : 'Destek talepleri için yeni bir kategori oluşturun.'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Ad
          </Label>
          <Input
            id="name"
            defaultValue={category?.name}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Açıklama
          </Label>
          <Textarea
            id="description"
            defaultValue={category?.description}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="parent" className="text-right">
            Üst Kategori
          </Label>
          <Select defaultValue={category?.parentId || 'none'}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Bir üst kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Yok</SelectItem>
              {categories
                .filter(c => !c.parentId && c.id !== category?.id) // Prevent self-parenting
                .map(parent => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">
          {isEditing ? 'Değişiklikleri Kaydet' : 'Kategori Oluştur'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default function SupportCategoriesPage() {
  const renderCategoryRows = (
    categories: SupportCategory[],
    parentId: string | null = null,
    level = 0
  ) => {
    const rows: React.ReactNode[] = [];
    const children = categories.filter(c => c.parentId === parentId);

    for (const category of children) {
      rows.push(
        <TableRow key={category.id}>
          <TableCell
            className="font-medium"
            style={{ paddingLeft: `${level * 24 + 16}px` }}
          >
            <div className="flex items-center gap-2">
              {level > 0 && (
                <CornerDownRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{category.name}</span>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground">
            {category.description}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">{category.ticketCount}</Badge>
          </TableCell>
          <TableCell>
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Menüyü aç</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DialogTrigger asChild>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" /> Düzenle
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CategoryForm
                category={category}
                categories={supportCategories}
              />
            </Dialog>
          </TableCell>
        </TableRow>
      );
      rows.push(...renderCategoryRows(categories, category.id, level + 1));
    }

    return rows;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Destek Kategorileri</CardTitle>
          <CardDescription>
            Destek taleplerini organize etmek için kategorileri yönetin.
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Kategori Ekle
            </Button>
          </DialogTrigger>
          <CategoryForm categories={supportCategories} />
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kategori Adı</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Talep Sayısı</TableHead>
              <TableHead>
                <span className="sr-only">Eylemler</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderCategoryRows(supportCategories)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
