import { redirect } from "next/navigation";

/**
 * This page called a non-existent /api/ai-faq backend. Reviewing generated FAQs
 * (approve, reject, archive) is served by the faq-learning review queue.
 */
export default async function AiFaqRedirect({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  redirect(`/${encodeURIComponent(tenant)}/admin/support/faq-learning/review`);
}
