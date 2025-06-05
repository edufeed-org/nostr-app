import { useNavigate, Link } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { EventForm } from '@/components/events/EventForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect } from 'react';

export default function CreateEventPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  
  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      navigate('/events');
    }
  }, [user, navigate]);
  
  const handleSuccess = useCallback(() => {
    navigate('/events');
  }, [navigate]);
  
  if (!user) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Login Required</h1>
            <p className="text-muted-foreground mt-2 mb-6">
              You need to be logged in to create an event.
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
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Event</h1>
        <EventForm onSuccess={handleSuccess} />
      </div>
    </AppLayout>
  );
}