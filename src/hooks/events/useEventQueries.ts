import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { EVENT_KIND, parseNostrEvent } from '@/lib/nostr/eventUtils';
import { NostrEventWithMeta } from '@/lib/nostr/types';
import type { NostrFilter } from '@nostrify/nostrify';

/**
 * Hook to fetch a single event by its ID
 */
export function useEvent(id: string) {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['event', id],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ 
          kinds: [EVENT_KIND], 
          '#d': [id] 
        }],
        { signal }
      );
      
      if (!events.length) {
        throw new Error('Event not found');
      }
      
      const parsedEvent = parseNostrEvent(events[0]);
      if (!parsedEvent) {
        throw new Error('Failed to parse event data');
      }
      
      return parsedEvent;
    },
    enabled: !!id && !!nostr
  });
}

/**
 * Hook to fetch events based on a filter
 */
export function useEvents(options: {
  limit?: number;
  since?: number;
  until?: number;
  authors?: string[];
  tags?: { [key: string]: string[] };
}) {
  const { nostr } = useNostr();
  const { limit = 20, since, until, authors, tags } = options;
  
  return useQuery({
    queryKey: ['events', { limit, since, until, authors, tags }],
    queryFn: async ({ signal }) => {
      // Build the filter
      const filter: NostrFilter = { 
        kinds: [EVENT_KIND], 
        limit
      };
      
      if (since) {
        filter.since = since;
      }
      
      if (until) {
        filter.until = until;
      }
      
      if (authors && authors.length > 0) {
        filter.authors = authors;
      }
      
      // Add tag filters
      if (tags) {
        Object.entries(tags).forEach(([key, values]) => {
          if (values.length > 0) {
            filter[`#${key}`] = values;
          }
        });
      }
      
      const events = await nostr.query([filter], { signal });
      
      // Parse events
      const parsedEvents = events
        .map(parseNostrEvent)
        .filter(Boolean) as NostrEventWithMeta[];
        
      // Sort by start date
      parsedEvents.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return dateA - dateB;
      });
      
      return parsedEvents;
    },
    enabled: !!nostr
  });
}

/**
 * Hook to fetch upcoming events (starting from today)
 */
export function useUpcomingEvents(options: {
  limit?: number;
  authors?: string[];
  tags?: string[];
} = {}) {
  const { limit = 20, authors, tags } = options;
  
  // Calculate today's timestamp (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = Math.floor(today.getTime() / 1000);
  
  const tagFilter: { [key: string]: string[] } = {};
  
  // Add tags if provided
  if (tags && tags.length > 0) {
    tagFilter.t = tags;
  }
  
  return useEvents({
    limit,
    since,
    authors,
    tags: tagFilter
  });
}

/**
 * Hook to fetch past events (before today)
 */
export function usePastEvents(options: {
  limit?: number;
  authors?: string[];
  tags?: string[];
} = {}) {
  const { limit = 20, authors, tags } = options;
  
  // Calculate today's timestamp (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const until = Math.floor(today.getTime() / 1000);
  
  const tagFilter: { [key: string]: string[] } = {};
  
  // Add tags if provided
  if (tags && tags.length > 0) {
    tagFilter.t = tags;
  }
  
  return useEvents({
    limit,
    until,
    authors,
    tags: tagFilter
  });
}