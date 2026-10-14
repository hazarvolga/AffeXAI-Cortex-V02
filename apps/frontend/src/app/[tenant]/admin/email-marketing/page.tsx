import { redirect } from "next/navigation";

/** The e-mail marketing module moved to /<tenant>/admin/email. */
export default async function EmailMarketingRedirect({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(`/${encodeURIComponent(tenant)}/admin/email`);
}
