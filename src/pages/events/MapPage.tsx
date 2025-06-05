import { AppLayout } from '@/components/layout/AppLayout';
import { EventsMap } from '@/components/events/EventsMap';

export default function MapPage() {
  return (
    <AppLayout>
      <EventsMap />
    </AppLayout>
  );
}