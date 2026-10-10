import { redirect } from 'next/navigation';

export default async function BrandPage({ params }: { params: Promise<{ tenant: string }> }) {
    const resolvedParams = await params;
    const tenant = resolvedParams?.tenant || 'affexai';
    redirect(`/${tenant}/admin/brand/intelligence`);
}
