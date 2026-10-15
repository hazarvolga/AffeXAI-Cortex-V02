import type { CreateComponentDto } from "@/lib/cms/cms-service";

/** Component types the backend stores as themselves; everything else is a prebuilt block. */
const PRIMITIVE_TYPES: ReadonlySet<string> = new Set([
  "text",
  "button",
  "image",
  "container",
  "card",
  "grid",
]);

export interface PersistableComponent {
  id: string;
  type: string;
  props: Record<string, unknown>;
  parentId?: string | null;
  orderIndex?: number;
  blockId?: string;
}

export interface StoredComponent {
  id: string;
  type: string;
  blockId?: string | null;
  props?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PageMeta {
  title: string;
  slug: string;
  description: string;
  showHeader: boolean;
  showFooter: boolean;
  fullWidth: boolean;
  categoryId: string | null;
}

export interface ComponentSyncPlan<T extends PersistableComponent> {
  remove: string[];
  update: T[];
  create: T[];
}

/** A stored row as the editor expects it: prebuilt blocks use their block id as type. */
export function fromStoredComponent<T extends StoredComponent>(
  stored: T,
): T & { type: string; blockId?: string } {
  const props = stored.props ?? {};
  const legacyBlockId =
    typeof props.blockId === "string" ? props.blockId : undefined;
  const blockId = stored.blockId || legacyBlockId;
  if (stored.type === "block" && blockId)
    return { ...stored, type: blockId, blockId };
  return blockId ? { ...stored, blockId } : { ...stored, blockId: undefined };
}

export function toComponentDto(
  component: PersistableComponent,
  pageId: string,
): CreateComponentDto {
  const isBlock = !PRIMITIVE_TYPES.has(component.type);
  return {
    pageId,
    parentId: null,
    type: (isBlock ? "block" : component.type) as CreateComponentDto["type"],
    blockId: isBlock ? component.type : undefined,
    props: component.props,
    orderIndex: component.orderIndex || 0,
  };
}

export function planComponentSync<T extends PersistableComponent>(
  local: readonly T[],
  storedIds: readonly string[],
): ComponentSyncPlan<T> {
  const stored = new Set(storedIds);
  const kept = new Set(local.map((component) => component.id));
  return {
    remove: storedIds.filter((id) => !kept.has(id)),
    update: local.filter((component) => stored.has(component.id)),
    create: local.filter((component) => !stored.has(component.id)),
  };
}

export function remapComponentIds<T extends PersistableComponent>(
  components: readonly T[],
  idMap: ReadonlyMap<string, string>,
): T[] {
  return components.map((component) => ({
    ...component,
    id: idMap.get(component.id) ?? component.id,
  }));
}

/** Serialises exactly what a save writes, so equal snapshots mean nothing is unsaved. */
export function editorSnapshot(
  components: readonly PersistableComponent[],
  meta: PageMeta,
): string {
  return JSON.stringify({
    meta,
    components: components.map((component) => ({
      type: component.type,
      props: component.props,
      orderIndex: component.orderIndex || 0,
    })),
  });
}
