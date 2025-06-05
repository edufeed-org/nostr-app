import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useEvent } from '@/hooks/events/useEventQueries';
import { useEventUpdates } from '@/hooks/events/useEventUpdates';
import { useExportToCalendar } from '@/hooks/events/useEventActions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, ClockIcon, MapPinIcon, LinkIcon, InfoIcon, Calendar as CalendarPlusIcon, 
  Edit, RefreshCw, AlertTriangle, MessageSquare, Users, Globe } from 'lucide-react';
import { RSVPForm } from './RSVPForm';
import { RSVPList } from './RSVPList';

interface EventDetailProps {
  eventId: string;
}

export function EventDetail({ eventId }: EventDetailProps) {
  const { data: event, isLoading, error } = useEvent(eventId);
  const { user } = useCurrentUser();
  const { mutate: exportToCalendar } = useExportToCalendar();
  const [activeTab, setActiveTab] = useState('details');
  
  if (isLoading) {
    return <EventSkeleton />;
  }
  
  if (error || !event) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Event Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The event you're looking for doesn't exist or couldn't be loaded.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline">
            <Link to="/events">Back to Events</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  const isOrganizer = user && user.pubkey === event.pubkey;
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPastEvent = startDate.getTime() < Date.now();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        {/* Event header */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {event.tags?.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
              
              {isPastEvent && (
                <Badge variant="secondary">Past Event</Badge>
              )}
            </div>
            
            <div className="flex justify-between items-start">
              <CardTitle className="text-2xl font-bold">{event.title}</CardTitle>
              
              {isOrganizer && (
                <Button variant="outline" size="sm" asChild className="ml-2">
                  <Link to={`/events/${eventId}/edit`}>
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
            
            <CardDescription>
              <EventOrganizer pubkey={event.pubkey} />
            </CardDescription>
          </CardHeader>
          
          {event.image && (
            <CardContent className="pt-0 pb-4">
              <div className="rounded-lg overflow-hidden h-48 md:h-64">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          )}
          
          <CardContent className="pb-4">
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <CalendarIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div className="text-sm text-muted-foreground">
                      {format(startDate, 'EEEE, MMMM d, yyyy')}
                      {endDate && endDate.toDateString() !== startDate.toDateString() && (
                        <>
                          <span> to </span>
                          {format(endDate, 'EEEE, MMMM d, yyyy')}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div className="text-sm text-muted-foreground">
                      {format(startDate, 'h:mm a')}
                      {endDate && (
                        <>
                          <span> to </span>
                          {format(endDate, 'h:mm a')}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {event.location && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">
                      {event.location.name && <div>{event.location.name}</div>}
                      {event.location.address && <div>{event.location.address}</div>}
                    </div>
                  </div>
                </div>
              )}
              
              {event.virtual && event.virtualUrl && (
                <div className="flex items-start">
                  <Globe className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Virtual Event</div>
                    <a 
                      href={event.virtualUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      Join Event
                      <LinkIcon className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
              
              {event.cost && (
                <div className="flex items-start">
                  <InfoIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Cost</div>
                    <div className="text-sm text-muted-foreground">
                      {event.cost}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToCalendar(event)}
            >
              <CalendarPlusIcon className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
          </CardFooter>
        </Card>
        
        {/* Event tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-0">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="details" className="flex items-center">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="updates" className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Updates
                </TabsTrigger>
                <TabsTrigger value="attendees" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Attendees
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="pt-4">
              <TabsContent value="details" className="m-0">
                <div className="prose dark:prose-invert max-w-none">
                  {event.description.split('\n').map((paragraph, i) => (
                    paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
                  ))}
                  
                  {event.requirements && (
                    <>
                      <h3 className="text-lg font-semibold mt-4">Requirements</h3>
                      <p>{event.requirements}</p>
                    </>
                  )}
                  
                  {event.contact && (
                    <>
                      <h3 className="text-lg font-semibold mt-4">Contact</h3>
                      <p>{event.contact}</p>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="updates" className="m-0">
                <EventUpdates eventId={eventId} />
              </TabsContent>
              
              <TabsContent value="attendees" className="m-0">
                <EventAttendees eventId={eventId} creatorId={event.pubkey} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      
      <div className="space-y-6">
        {/* RSVP form */}
        <RSVPForm eventId={eventId} creatorId={event.pubkey} />
        
        {/* Additional info */}
        {event.capacity && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                This event can accommodate up to <span className="font-medium">{event.capacity}</span> attendees.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-2/3" />
            <div className="flex items-center mt-2">
              <Skeleton className="h-8 w-8 rounded-full mr-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex">
                <Skeleton className="h-5 w-5 mr-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex">
                <Skeleton className="h-5 w-5 mr-2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            
            <div className="flex mt-4">
              <Skeleton className="h-5 w-5 mr-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="border rounded-lg">
              <Skeleton className="h-10 w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function EventOrganizer({ pubkey }: { pubkey: string }) {
  const { data: author, isLoading } = useAuthor(pubkey);
  
  if (isLoading) {
    return (
      <div className="flex items-center">
        <Skeleton className="h-5 w-5 rounded-full mr-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }
  
  const name = author?.metadata?.name || author?.metadata?.display_name || 'Unknown';
  const picture = author?.metadata?.picture;
  
  return (
    <div className="flex items-center">
      <Avatar className="h-5 w-5 mr-2">
        <AvatarImage src={picture} alt={name} />
        <AvatarFallback className="text-xs">{name[0]}</AvatarFallback>
      </Avatar>
      <span>Organized by {name}</span>
    </div>
  );
}

function EventUpdates({ eventId }: { eventId: string }) {
  const { data: updates, isLoading } = useEventUpdates(eventId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="border rounded-md p-4 space-y-2">
            <div className="flex items-center">
              <Skeleton className="h-4 w-24 mr-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }
  
  if (!updates || updates.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No updates have been posted yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {updates.map(update => (
        <Card key={update.id} className={`border ${update.type === 'cancellation' ? 'border-destructive' : ''}`}>
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center">
                {update.type === 'announcement' && (
                  <MessageSquare className="h-4 w-4 mr-1" />
                )}
                {update.type === 'change' && (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {update.type === 'cancellation' && (
                  <AlertTriangle className="h-4 w-4 mr-1 text-destructive" />
                )}
                
                {update.type === 'announcement' && 'Announcement'}
                {update.type === 'change' && 'Change Notice'}
                {update.type === 'cancellation' && 'Cancellation Notice'}
              </CardTitle>
              
              <span className="text-xs text-muted-foreground">
                {format(new Date(update.createdAt * 1000), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="whitespace-pre-wrap">
              {update.content}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventAttendees({ eventId, creatorId }: { eventId: string, creatorId: string }) {
  return <RSVPList eventId={eventId} creatorId={creatorId} />;
}