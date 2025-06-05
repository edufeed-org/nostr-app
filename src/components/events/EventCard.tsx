import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { NostrEventWithMeta } from '@/lib/nostr/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon, ClockIcon, UsersIcon } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EventCardProps {
  event: NostrEventWithMeta;
}

export function EventCard({ event }: EventCardProps) {
  const author = useAuthor(event.pubkey);
  const authorProfile = author.data?.metadata;
  
  // Format dates
  const startDate = new Date(event.startDate);
  const formattedDate = format(startDate, 'EEE, MMMM d, yyyy');
  const formattedTime = format(startDate, 'h:mm a');
  
  // Calculate if event is today or upcoming
  const isToday = new Date().toDateString() === startDate.toDateString();
  const isPast = startDate.getTime() < Date.now();
  
  return (
    <Card className={`h-full transition-shadow hover:shadow-md ${isPast ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {event.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {event.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{event.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Link to={`/events/${event.id}`}>
                <CardTitle className="text-lg hover:underline line-clamp-1">
                  {event.title}
                </CardTitle>
              </Link>
              {isToday && (
                <Badge variant="default" className="ml-2 text-xs">Today</Badge>
              )}
            </div>
          </div>
          
          {event.image && (
            <div className="w-16 h-16 rounded overflow-hidden shrink-0 ml-4">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <CardDescription className="flex items-center mt-1 gap-2">
          <Avatar className="h-5 w-5 mr-1">
            <AvatarImage src={authorProfile?.picture} alt={authorProfile?.name || 'Event organizer'} />
            <AvatarFallback className="text-xs">{authorProfile?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-xs">
            by {authorProfile?.name || authorProfile?.display_name || 'Unknown'}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <ClockIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span>{formattedTime}</span>
          </div>
          {event.location?.name && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPinIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">{event.location.name}</span>
            </div>
          )}
          {event.virtual && event.virtualUrl && (
            <div className="text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Virtual Event
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="w-full flex justify-between items-center text-sm">
          <div>
            {event.rsvpCount && (
              <div className="flex items-center gap-1">
                <UsersIcon className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {event.rsvpCount.yes} attending
                </span>
              </div>
            )}
          </div>
          <Link 
            to={`/events/${event.id}`}
            className="text-xs text-primary hover:underline"
          >
            View details
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}