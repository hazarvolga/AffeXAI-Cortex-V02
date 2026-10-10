
import { redirect } from 'next/navigation';

// This page now acts as a simple entry point to the portal's default view.
// The role-based routing and display logic is now handled by the layout and the specific /portal/dashboard/[role] pages.
// We redirect to the 'customer' dashboard as the default landing page for the portal.
export default function PortalDashboardRootPage() {
  redirect('/portal/dashboard/customer');
}
