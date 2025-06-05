import { Link } from 'react-router-dom';
import { useUpcomingEvents } from '@/hooks/events/useEventQueries';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, MapPin, Plus, ArrowRight, CalendarDays, CalendarCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EventCard } from '@/components/events/EventCard';
import { RelaySelector } from '@/components/RelaySelector';

export default function HomePage() {
  const { user } = useCurrentUser();
  const { 
    data: upcomingEvents, 
    isLoading: isLoadingEvents 
  } = useUpcomingEvents({ limit: 6 });
  
  // Check if there are events the user might be interested in
  const hasEvents = !isLoadingEvents && upcomingEvents && upcomingEvents.length > 0;
  
  return (
    <AppLayout>
      {/* Hero section */}
      <section className="py-12 md:py-20 mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Discover and Plan Events on Nostr
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          A decentralized platform for creating, discovering, and attending events with RSVP functionality and location mapping.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/events">
              <CalendarClock className="h-5 w-5" />
              Explore Events
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link to="/map">
              <MapPin className="h-5 w-5" />
              View Event Map
            </Link>
          </Button>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-12 bg-muted/40">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything You Need to Manage Events
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-lg p-6 border shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CalendarClock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Events</h3>
              <p className="text-muted-foreground">
                Easily create and manage events with all the details your attendees need.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">RSVP System</h3>
              <p className="text-muted-foreground">
                Let attendees confirm their participation and receive updates about events.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 border shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Location Mapping</h3>
              <p className="text-muted-foreground">
                Find events near you with integrated maps and location-based discovery.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Upcoming events section */}
      <section className="py-12">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Upcoming Events</h2>
              <p className="text-muted-foreground mt-1">
                Discover events happening soon
              </p>
            </div>
            
            <Button asChild variant="ghost" size="sm">
              <Link to="/events" className="flex items-center">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          
          {isLoadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-[240px] w-full" />
              ))}
            </div>
          ) : (
            <>
              {hasEvents ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <h3 className="text-xl font-medium mb-2">No upcoming events found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    There are no upcoming events in this relay. Try switching relays or create your own event!
                  </p>
                  
                  <div className="flex flex-col items-center gap-6">
                    <RelaySelector className="max-w-xs" />
                    
                    {user && (
                      <Button asChild className="gap-2">
                        <Link to="/events/create">
                          <Plus className="h-4 w-4" />
                          Create an Event
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Plan Your Next Event?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Create your event now and share it with the Nostr community.
          </p>
          {user ? (
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/events/create">
                <Plus className="h-5 w-5" />
                Create an Event
              </Link>
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm opacity-90">Login to create events</p>
              <Button asChild size="lg" variant="secondary">
                <Link to="/events">
                  Explore Events
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}