import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { EventDetail } from '@/components/events/EventDetail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  
  if (!eventId) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p className="text-muted-foreground mt-2 mb-6">
              The event you're looking for doesn't exist or the ID is invalid.
            </p>
            <Button asChild>
              <Link to="/events">Back to Events</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/events" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
        </Button>
      </div>
      
      <EventDetail eventId={eventId} />
    </AppLayout>
  );
}