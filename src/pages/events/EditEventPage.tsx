import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEvent } from '@/hooks/events/useEventQueries';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { EventForm } from '@/components/events/EventForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useCallback } from 'react';

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEvent(eventId || '');
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  
  const handleSuccess = useCallback(() => {
    if (eventId) {
      navigate(`/events/${eventId}`);
    } else {
      navigate('/events');
    }
  }, [navigate, eventId]);
  
  // Unauthorized check
  const isUnauthorized = !isLoading && event && user && event.pubkey !== user.pubkey;
  
  if (isLoading) {
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
        
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }
  
  if (error || !event || !eventId) {
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
        
        <Card className="max-w-lg mx-auto border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Event Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              The event you're trying to edit doesn't exist or couldn't be loaded.
            </p>
            <Button asChild>
              <Link to="/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }
  
  if (isUnauthorized) {
    return (
      <AppLayout>
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to={`/events/${eventId}`} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Event
            </Link>
          </Button>
        </div>
        
        <Card className="max-w-lg mx-auto border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Unauthorized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              You don't have permission to edit this event. Only the event creator can make changes.
            </p>
            <Button asChild>
              <Link to={`/events/${eventId}`}>Back to Event</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to={`/events/${eventId}`} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Event
          </Link>
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Event</h1>
        <EventForm existingEvent={event} onSuccess={handleSuccess} />
      </div>
    </AppLayout>
  );
}