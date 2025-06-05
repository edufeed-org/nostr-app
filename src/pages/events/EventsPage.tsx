import { useState } from 'react';
import { useUpcomingEvents, usePastEvents } from '@/hooks/events/useEventQueries';
import { NostrEventWithMeta } from '@/lib/nostr/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, CalendarRange, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';
import { RelaySelector } from '@/components/RelaySelector';

export default function EventsPage() {
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Fetch upcoming events
  const { 
    data: upcomingEvents, 
    isLoading: isLoadingUpcoming 
  } = useUpcomingEvents({ limit: 50 });
  
  // Fetch past events
  const { 
    data: pastEvents, 
    isLoading: isLoadingPast 
  } = usePastEvents({ limit: 20 });
  
  // Filter events by search query and tags
  const filterEvents = (events: NostrEventWithMeta[] = []) => {
    const query = searchQuery.toLowerCase().trim();
    
    return events.filter(event => {
      // Filter by search query
      const matchesQuery = !query || 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        (event.location?.name && event.location.name.toLowerCase().includes(query)) ||
        (event.tags && event.tags.some(tag => tag.toLowerCase().includes(query)));
      
      // Filter by selected tags
      const matchesTags = selectedTags.length === 0 || 
        (event.tags && event.tags.some(tag => selectedTags.includes(tag)));
      
      return matchesQuery && matchesTags;
    });
  };
  
  // Get all unique tags from events
  const getAllTags = () => {
    const tagSet = new Set<string>();
    
    [...(upcomingEvents || []), ...(pastEvents || [])].forEach(event => {
      if (event.tags && event.tags.length > 0) {
        event.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  };
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const filteredUpcomingEvents = filterEvents(upcomingEvents);
  const filteredPastEvents = filterEvents(pastEvents);
  const allTags = getAllTags();
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-1">
              Discover events and activities
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-8 w-full sm:w-[220px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {user && (
              <Button asChild className="gap-2">
                <Link to="/events/create">
                  <Plus className="h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(tag)}
                className="text-xs"
              >
                {tag}
              </Button>
            ))}
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
        
        {/* Events tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Upcoming Events
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center">
              <CalendarRange className="h-4 w-4 mr-1" />
              Past Events
            </TabsTrigger>
          </TabsList>
          
          {/* Upcoming events */}
          <TabsContent value="upcoming" className="m-0">
            {isLoadingUpcoming ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-[240px] w-full" />
                ))}
              </div>
            ) : (
              <>
                {filteredUpcomingEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUpcomingEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="col-span-full">
                    <div className="border-2 border-dashed rounded-lg p-12 text-center">
                      <div className="max-w-sm mx-auto space-y-6">
                        <p className="text-muted-foreground">
                          No upcoming events found {searchQuery ? "for your search" : ""}
                          <br />
                          Try a different search or relay
                        </p>
                        <RelaySelector className="w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Past events */}
          <TabsContent value="past" className="m-0">
            {isLoadingPast ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-[240px] w-full" />
                ))}
              </div>
            ) : (
              <>
                {filteredPastEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPastEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="col-span-full">
                    <div className="border-2 border-dashed rounded-lg p-12 text-center">
                      <div className="max-w-sm mx-auto space-y-6">
                        <p className="text-muted-foreground">
                          No past events found {searchQuery ? "for your search" : ""}
                          <br />
                          Try a different search or relay
                        </p>
                        <RelaySelector className="w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}