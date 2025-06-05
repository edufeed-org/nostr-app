import { useMemo } from 'react';
import { useEventRSVPs } from '@/hooks/events/useRSVP';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthor } from '@/hooks/useAuthor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, CalendarCheck, Calendar, CalendarX } from 'lucide-react';

interface RSVPListProps {
  eventId: string;
  creatorId: string;
}

export function RSVPList({ eventId, creatorId }: RSVPListProps) {
  const { data, isLoading } = useEventRSVPs(eventId, creatorId);
  
  const rsvps = useMemo(() => {
    if (!data?.rsvps) return { yes: [], no: [], maybe: [] };
    
    const yesRSVPs = data.rsvps.filter(r => r && r.rsvp.status === 'yes');
    const noRSVPs = data.rsvps.filter(r => r && r.rsvp.status === 'no');
    const maybeRSVPs = data.rsvps.filter(r => r && r.rsvp.status === 'maybe');
    
    return { yes: yesRSVPs, no: noRSVPs, maybe: maybeRSVPs };
  }, [data?.rsvps]);
  
  const counts = data?.counts || { yes: 0, no: 0, maybe: 0 };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (!data || !data.rsvps?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
          <CardDescription>
            No RSVPs yet. Be the first to RSVP!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendees</CardTitle>
        <CardDescription>
          {counts.yes} going · {counts.maybe} maybe · {counts.no} not going
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="yes">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="yes" className="flex items-center">
              <CalendarCheck className="h-4 w-4 mr-1" />
              Going ({counts.yes})
            </TabsTrigger>
            <TabsTrigger value="maybe" className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Maybe ({counts.maybe})
            </TabsTrigger>
            <TabsTrigger value="no" className="flex items-center">
              <CalendarX className="h-4 w-4 mr-1" />
              Not Going ({counts.no})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="yes">
            <RSVPUserList users={rsvps.yes} emptyMessage="No one has RSVP'd as going yet." />
          </TabsContent>
          
          <TabsContent value="maybe">
            <RSVPUserList users={rsvps.maybe} emptyMessage="No one has RSVP'd as maybe yet." />
          </TabsContent>
          
          <TabsContent value="no">
            <RSVPUserList users={rsvps.no} emptyMessage="No one has RSVP'd as not going yet." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function RSVPUserList({ 
  users, 
  emptyMessage 
}: { 
  users: Array<{
    userId: string;
    rsvp: {
      status: string;
      comment?: string;
      attendees?: number;
    };
  } | null>; 
  emptyMessage: string;
}) {
  if (!users.length) {
    return <p className="text-sm text-muted-foreground py-4">{emptyMessage}</p>;
  }
  
  return (
    <ul className="space-y-4">
      {users.map(rsvp => {
        if (!rsvp) return null;
        return (
          <RSVPUserItem 
            key={rsvp.userId} 
            userId={rsvp.userId} 
            comment={rsvp.rsvp.comment}
            attendees={rsvp.rsvp.attendees || 1}
          />
        );
      })}
    </ul>
  );
}

function RSVPUserItem({ 
  userId, 
  comment,
  attendees
}: { 
  userId: string; 
  comment?: string;
  attendees: number;
}) {
  const { data: author, isLoading } = useAuthor(userId);
  
  if (isLoading) {
    return <div className="animate-pulse h-12 bg-muted rounded"></div>;
  }
  
  const name = author?.metadata?.name || author?.metadata?.display_name || 'Anonymous';
  const picture = author?.metadata?.picture;
  
  return (
    <li className="flex items-start gap-3">
      <Avatar>
        <AvatarImage src={picture} alt={name} />
        <AvatarFallback>{name[0]}</AvatarFallback>
      </Avatar>
      
      <div>
        <div className="font-medium">{name}</div>
        {attendees > 1 && (
          <div className="text-sm text-muted-foreground">
            +{attendees - 1} guests
          </div>
        )}
        {comment && (
          <div className="mt-1 text-sm">{comment}</div>
        )}
      </div>
    </li>
  );
}