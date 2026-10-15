import { redirect } from "next/navigation";

/**
 * New pages are created by the visual editor's first save. This route used to
 * show a concept form whose Save did nothing.
 */
export default async function NewCmsPageRedirect({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(`/${encodeURIComponent(tenant)}/admin/cms/editor`);
}
