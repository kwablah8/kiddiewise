import { NotificationsList } from "@/components/parent/notifications-list";

export default function ParentNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Notifications</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          When your children arrive at and leave school, as recorded at the gate.
        </p>
      </div>
      <NotificationsList />
    </div>
  );
}
