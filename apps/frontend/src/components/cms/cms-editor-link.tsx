"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { canEditCms, cmsPagesPath } from "@/lib/cms/cms-editor-access";
import { getPublicCopy } from "@/lib/i18n/public-copy";

/** Renders nothing for visitors; signed-in content editors get a shortcut to the CMS. */
export function CmsEditorLink() {
  const { user, isSuperAdmin, isLoading } = useAuth();
  if (isLoading || !user || !canEditCms(user, isSuperAdmin)) return null;

  return (
    <Button asChild variant="outline">
      <Link href={cmsPagesPath(user)}>
        {getPublicCopy().cmsPage.editorLink}
      </Link>
    </Button>
  );
}
