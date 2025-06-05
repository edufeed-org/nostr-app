import { useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@/hooks/useNostr';
import { RSVP_KIND, parseNostrRSVP } from '@/lib/nostr/eventUtils';
import { NostrEventWithMeta } from '@/lib/nostr/types';
import { useToast } from '@/hooks/useToast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Default notification times (hours before event)
const DEFAULT_NOTIFICATION_TIMES = [24, 1]; // 24 hours and 1 hour before

/**
 * Hook to manage event notifications
 */
export function useEventNotifications() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { toast } = useToast();
  
  // Store the last notification times for events
  const [lastNotified, setLastNotified] = useLocalStorage<Record<string, number>>(
    'nostr:event-notifications',
    {}
  );
  
  // Get all RSVPs for the current user where response is 'yes'
  const getRSVPsForCurrentUser = useCallback(async () => {
    if (!user?.pubkey || !nostr) return [];
    
    // Query RSVPs from the current user
    const rsvpEvents = await nostr.query(
      [{ 
        kinds: [RSVP_KIND], 
        authors: [user.pubkey] 
      }]
    );
    
    // Parse and filter RSVPs where status is 'yes'
    return rsvpEvents
      .map(parseNostrRSVP)
      .filter(rsvp => rsvp && rsvp.rsvp.status === 'yes')
      .map(rsvp => rsvp!.eventId);
  }, [user?.pubkey, nostr]);
  
  // Get upcoming events that the user has RSVP'd to
  const fetchUpcomingRSVPdEvents = useCallback(async () => {
    if (!user?.pubkey || !nostr) return [];
    
    // Get event IDs the user has RSVP'd to
    const rsvpEventIds = await getRSVPsForCurrentUser();
    if (rsvpEventIds.length === 0) return [];
    
    // Current time in seconds
    const now = Math.floor(Date.now() / 1000);
    
    // Query events by their IDs
    const events = await Promise.all(
      rsvpEventIds.map(async (id) => {
        const eventResults = await nostr.query(
          [{ kinds: [31000], '#d': [id] }]
        );
        return eventResults;
      })
    );
    
    // Flatten and parse the events
    const allEvents = events.flat();
    const parsedEvents: NostrEventWithMeta[] = [];
    
    for (const event of allEvents) {
      try {
        const content = JSON.parse(event.content);
        
        // Get the 'd' tag (event ID)
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (!dTag || !dTag[1]) continue;
        
        // Get start date from tags or content
        const startTag = event.tags.find(tag => tag[0] === 'start');
        const startDate = startTag && startTag[1] ? startTag[1] : content.startDate;
        
        // Convert start date to timestamp 
        const startTimestamp = new Date(startDate).getTime() / 1000;
        
        // Only include future events
        if (startTimestamp > now) {
          parsedEvents.push({
            id: dTag[1],
            title: content.title,
            description: content.description,
            startDate,
            endDate: content.endDate,
            location: content.location,
            pubkey: event.pubkey,
            createdAt: event.created_at,
          });
        }
      } catch (e) {
        console.error('Error parsing event:', e);
      }
    }
    
    return parsedEvents;
  }, [user?.pubkey, nostr, getRSVPsForCurrentUser]);
  
  // Check if we should send notification for an event
  const shouldNotify = useCallback((event: NostrEventWithMeta) => {
    const eventStartTime = new Date(event.startDate).getTime();
    const now = Date.now();
    
    // Skip events that have already started
    if (eventStartTime <= now) {
      return false;
    }
    
    // Time until event (in hours)
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
    
    // Check if the event is close to any notification time
    for (const notificationHours of DEFAULT_NOTIFICATION_TIMES) {
      // Check if we're within 5 minutes of the notification time
      const timeDiff = Math.abs(hoursUntilEvent - notificationHours);
      
      if (timeDiff < 5/60) { // 5 minutes in hours
        // Check if we've already notified for this event at this time
        const notificationKey = `${event.id}_${notificationHours}`;
        const lastNotificationTime = lastNotified[notificationKey] || 0;
        
        // Only notify if we haven't in the last hour
        if (now - lastNotificationTime > 60 * 60 * 1000) {
          // Update the last notification time
          setLastNotified({
            ...lastNotified,
            [notificationKey]: now
          });
          
          return { 
            shouldNotify: true, 
            timeDescription: notificationHours === 1 
              ? '1 hour' 
              : `${notificationHours} hours`
          };
        }
      }
    }
    
    return false;
  }, [lastNotified, setLastNotified]);
  
  // Check for notifications every minute
  useEffect(() => {
    if (!user?.pubkey || !nostr) return;
    
    const checkNotifications = async () => {
      try {
        const events = await fetchUpcomingRSVPdEvents();
        
        for (const event of events) {
          const notification = shouldNotify(event);
          
          if (notification && notification.shouldNotify) {
            // Show notification
            toast({
              title: `Upcoming Event: ${event.title}`,
              description: `Starting in ${notification.timeDescription}${event.location?.name ? ` at ${event.location.name}` : ''}`,
              variant: 'default',
              duration: 10000, // show for 10 seconds
            });
          }
        }
      } catch (e) {
        console.error('Error checking notifications:', e);
      }
    };
    
    // Initial check
    checkNotifications();
    
    // Set up interval
    const interval = setInterval(checkNotifications, 60 * 1000); // check every minute
    
    return () => clearInterval(interval);
  }, [user?.pubkey, nostr, fetchUpcomingRSVPdEvents, shouldNotify, toast]);
  
  return null; // This hook doesn't return anything, it just runs in the background
}