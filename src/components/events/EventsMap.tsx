import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { useUpcomingEvents } from '@/hooks/events/useEventQueries';
import { NostrEventWithMeta } from '@/lib/nostr/types';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Calendar, MapPin } from 'lucide-react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for missing marker icons in Leaflet with modern build tools
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { RelaySelector } from '../RelaySelector';

// Fix default icon issue
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconRetinaUrl: markerIconUrl,
});

export function EventsMap() {
  const { data: events, isLoading } = useUpcomingEvents({ limit: 100 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<NostrEventWithMeta[]>([]);
  const [mapEvents, setMapEvents] = useState<NostrEventWithMeta[]>([]);
  
  // Default map center (San Francisco)
  const defaultCenter = useMemo<[number, number]>(() => [37.7749, -122.4194], []);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  useEffect(() => {
    if (!events) return;
    
    // Filter events for search
    const query = searchQuery.toLowerCase().trim();
    const filtered = query 
      ? events.filter(event => 
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          (event.location?.name && event.location.name.toLowerCase().includes(query)) ||
          (event.location?.address && event.location.address.toLowerCase().includes(query)) ||
          (event.tags && event.tags.some(tag => tag.toLowerCase().includes(query)))
        )
      : [...events];
    
    setFilteredEvents(filtered);
    
    // Filter events for map (only those with coordinates)
    const withCoordinates = filtered.filter(
      event => event.location?.latitude && event.location?.longitude
    );
    setMapEvents(withCoordinates);
    
    // Update map center if we have events with coordinates
    if (withCoordinates.length > 0) {
      // Calculate average latitude and longitude
      const latSum = withCoordinates.reduce(
        (sum, event) => sum + (event.location?.latitude || 0), 
        0
      );
      const lngSum = withCoordinates.reduce(
        (sum, event) => sum + (event.location?.longitude || 0), 
        0
      );
      
      setMapCenter([
        latSum / withCoordinates.length,
        lngSum / withCoordinates.length
      ]);
    } else {
      setMapCenter(defaultCenter);
    }
  }, [events, searchQuery, defaultCenter]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold">Event Map</h1>
          <p className="text-muted-foreground mt-1">
            Discover events happening near you
          </p>
        </div>
        
        <div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="map">
        <TabsList className="mb-4">
          <TabsTrigger value="map" className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            Map View
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            List View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="m-0">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <div>
              <Card>
                <CardContent className="p-0">
                  <div className="h-[500px] w-full rounded-xl overflow-hidden">
                    <MapContainer
                      center={mapCenter}
                      zoom={10}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {mapEvents.map(event => {
                        if (!event.location?.latitude || !event.location?.longitude) return null;
                        
                        return (
                          <Marker
                            key={event.id}
                            position={[event.location.latitude, event.location.longitude]}
                          >
                            <Popup>
                              <div className="max-w-[250px]">
                                <h3 className="font-semibold">{event.title}</h3>
                                <div className="text-xs mt-1">
                                  {format(new Date(event.startDate), 'MMM d, yyyy h:mm a')}
                                </div>
                                {event.location?.name && (
                                  <div className="text-xs mt-1">
                                    {event.location.name}
                                  </div>
                                )}
                                <Link 
                                  to={`/events/${event.id}`}
                                  className="text-xs text-blue-600 hover:underline mt-2 block"
                                >
                                  View event details
                                </Link>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </CardContent>
                
                <CardFooter className="py-2 px-4 bg-muted/20 border-t">
                  <div className="text-xs text-muted-foreground">
                    {mapEvents.length} events with location data
                    {mapEvents.length === 0 && " - try a different relay by using the selector below"}
                  </div>
                </CardFooter>
              </Card>
              
              {mapEvents.length === 0 && (
                <div className="mt-6 max-w-md mx-auto">
                  <Card className="border-dashed">
                    <CardContent className="py-6 text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="mb-4">No events with location data found.</p>
                      <RelaySelector className="max-w-xs mx-auto" />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list" className="m-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {filteredEvents.length === 0 ? (
                <div className="mt-6 max-w-md mx-auto">
                  <Card className="border-dashed">
                    <CardContent className="py-6 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="mb-4">No events found for your search criteria.</p>
                      <RelaySelector className="max-w-xs mx-auto" />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map(event => (
                    <EventMapCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventMapCard({ event }: { event: NostrEventWithMeta }) {
  const startDate = new Date(event.startDate);
  
  const hasCoordinates = event.location?.latitude && event.location?.longitude;
  const coordinates = hasCoordinates && event.location 
    ? [event.location.latitude, event.location.longitude] as [number, number]
    : null;
    
  return (
    <Card>
      <CardHeader className="pb-2">
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {event.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {event.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        <CardTitle className="text-lg line-clamp-2">
          {event.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="text-sm mb-2">
          {format(startDate, 'EEE, MMM d, yyyy · h:mm a')}
        </div>
        
        {event.location?.name && (
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{event.location.name}</span>
          </div>
        )}
        
        <div className="text-sm line-clamp-2 text-muted-foreground">
          {event.description}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="w-full flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <Link to={`/events/${event.id}`}>Details</Link>
          </Button>
          
          {coordinates && (
            <Button 
              variant="secondary" 
              size="sm"
              asChild
            >
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${coordinates[0]},${coordinates[1]}`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <MapPin className="h-3.5 w-3.5 mr-1" />
                Map
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}