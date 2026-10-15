import { redirect } from "next/navigation";

/**
 * Page editing lives in the visual editor, which reads and saves through the
 * CMS API. This route used to edit a static fixture and its Save did nothing.
 */
export default async function EditCmsPageRedirect({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;
  redirect(`/admin/cms/editor?pageId=${encodeURIComponent(pageId)}`);
}
