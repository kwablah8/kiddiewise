import { PageHeader } from "@/components/app/page-header";
import { CommunicationTabs } from "@/components/communication/communication-tabs";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        subtitle="Write announcements for parents and staff, and keep the school calendar."
      />
      <CommunicationTabs />
    </div>
  );
}
