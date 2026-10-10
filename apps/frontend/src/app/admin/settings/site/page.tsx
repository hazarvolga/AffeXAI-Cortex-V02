import { redirect } from 'next/navigation';

export default function LegacySiteSettingsPage() {
  redirect('/admin/settings');
}
