
import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
    return (
        <div>
             <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Yeni Etkinlik Oluştur</h1>
                <p className="text-muted-foreground">Etkinliğinizin tüm detaylarını bu form üzerinden yapılandırın.</p>
            </div>
            <EventForm />
        </div>
    );
}
