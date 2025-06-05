import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserRSVP, useSubmitRSVP } from '@/hooks/events/useRSVP';
import { NostrEventRSVP } from '@/lib/nostr/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, Calendar, CalendarX, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface RSVPFormProps {
  eventId: string;
  creatorId: string;
}

export function RSVPForm({ eventId, creatorId }: RSVPFormProps) {
  const { user } = useCurrentUser();
  const { data: existingRSVP, isLoading } = useUserRSVP(eventId, creatorId);
  const { mutate: submitRSVP, isPending: isSubmitting } = useSubmitRSVP();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'yes' | 'no' | 'maybe'>(
    existingRSVP?.status || 'yes'
  );
  const [comment, setComment] = useState<string>(existingRSVP?.comment || '');
  
  // Handle RSVP submission
  const handleSubmit = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You must be logged in to RSVP for events.',
        variant: 'destructive'
      });
      return;
    }
    
    const rsvp: NostrEventRSVP = {
      status,
      comment: comment.trim() || undefined
    };
    
    submitRSVP({ rsvp, eventId, creatorId });
  };
  
  // If the user is not logged in, show a login prompt
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RSVP to this event</CardTitle>
          <CardDescription>
            You need to be logged in to RSVP to this event.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Use the login button in the top-right corner to log in.
          </p>
        </CardFooter>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RSVP</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>RSVP to this event</CardTitle>
        <CardDescription>
          Let the organizer know if you'll be attending.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={status === 'yes' ? 'default' : 'outline'}
              className="flex flex-col items-center py-6"
              onClick={() => setStatus('yes')}
            >
              <CalendarCheck className="h-6 w-6 mb-1" />
              <span>Going</span>
            </Button>
            
            <Button
              type="button"
              variant={status === 'maybe' ? 'default' : 'outline'}
              className="flex flex-col items-center py-6"
              onClick={() => setStatus('maybe')}
            >
              <Calendar className="h-6 w-6 mb-1" />
              <span>Maybe</span>
            </Button>
            
            <Button
              type="button"
              variant={status === 'no' ? 'default' : 'outline'}
              className="flex flex-col items-center py-6"
              onClick={() => setStatus('no')}
            >
              <CalendarX className="h-6 w-6 mb-1" />
              <span>Not Going</span>
            </Button>
          </div>
          
          <div>
            <Textarea
              placeholder="Add an optional comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {existingRSVP ? 'Update RSVP' : 'Submit RSVP'}
        </Button>
      </CardFooter>
    </Card>
  );
}