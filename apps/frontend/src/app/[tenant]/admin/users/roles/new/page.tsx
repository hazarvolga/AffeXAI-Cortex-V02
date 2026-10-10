import { redirect } from 'next/navigation';

export default async function LegacyCreateRolePage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = await params;
    redirect(`/${tenant}/admin/roles`);
}
