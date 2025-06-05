import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { EVENT_UPDATE_KIND, parseNostrEventUpdate } from '@/lib/nostr/eventUtils';
import { NostrEventUpdate } from '@/lib/nostr/types';

/**
 * Hook to get updates for an event
 */
export function useEventUpdates(eventId: string) {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['event-updates', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ 
          kinds: [EVENT_UPDATE_KIND], 
          '#e': [eventId],
        }],
        { signal }
      );
      
      // Parse update events
      const updates = events
        .map(parseNostrEventUpdate)
        .filter(Boolean) as NostrEventUpdate[];
        
      // Sort by created_at (most recent first)
      updates.sort((a, b) => b.createdAt - a.createdAt);
      
      return updates;
    },
    enabled: !!eventId && !!nostr
  });
}