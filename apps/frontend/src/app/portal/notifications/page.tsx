import { NotificationCenter } from "@/components/notifications/notification-center";
import { PageHeader } from "@/components/patterns/page-states";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirimler"
        description="Hesabınıza gönderilen bildirimleri görün ve okundu olarak işaretleyin."
      />
      <NotificationCenter />
    </div>
  );
}
