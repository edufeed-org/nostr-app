import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@/hooks/useNostr';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { RSVP_KIND, parseNostrRSVP, createNostrRSVPObject } from '@/lib/nostr/eventUtils';
import { NostrEventRSVP } from '@/lib/nostr/types';
import { useToast } from '@/hooks/useToast';

/**
 * Hook to get RSVPs for an event
 */
export function useEventRSVPs(eventId: string, creatorId: string) {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['event-rsvps', eventId],
    queryFn: async ({ signal }) => {
      const events = await nostr.query(
        [{ 
          kinds: [RSVP_KIND], 
          '#e': [eventId],
          '#p': [creatorId]
        }],
        { signal }
      );
      
      // Parse RSVP events
      const rsvps = events
        .map(parseNostrRSVP)
        .filter(Boolean);
        
      // Count RSVPs by status
      const counts = {
        yes: 0,
        no: 0,
        maybe: 0
      };
      
      rsvps.forEach(rsvp => {
        if (rsvp) {
          counts[rsvp.rsvp.status] += rsvp.rsvp.attendees || 1;
        }
      });
      
      return {
        rsvps,
        counts
      };
    },
    enabled: !!eventId && !!creatorId && !!nostr
  });
}

/**
 * Hook to get the current user's RSVP for an event
 */
export function useUserRSVP(eventId: string, creatorId: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['user-rsvp', eventId, user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!user?.pubkey) {
        return null;
      }
      
      const events = await nostr.query(
        [{ 
          kinds: [RSVP_KIND], 
          authors: [user.pubkey],
          '#e': [eventId],
          '#p': [creatorId]
        }],
        { signal }
      );
      
      if (!events.length) {
        return null;
      }
      
      const rsvp = parseNostrRSVP(events[0]);
      return rsvp?.rsvp || null;
    },
    enabled: !!eventId && !!creatorId && !!user?.pubkey && !!nostr
  });
}

/**
 * Hook to submit or update an RSVP
 */
export function useSubmitRSVP() {
  const { user } = useCurrentUser();
  const { mutate: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      rsvp, 
      eventId, 
      creatorId 
    }: { 
      rsvp: NostrEventRSVP; 
      eventId: string; 
      creatorId: string; 
    }) => {
      if (!user?.pubkey) {
        throw new Error('User not logged in');
      }
      
      const rsvpEvent = createNostrRSVPObject(
        rsvp,
        eventId,
        creatorId,
        user.pubkey
      );
      
      await publish(rsvpEvent);
      
      return { rsvp, eventId, creatorId };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: ['user-rsvp', data.eventId]
      });
      
      queryClient.invalidateQueries({
        queryKey: ['event-rsvps', data.eventId]
      });
      
      // Show success toast
      toast({
        title: 'RSVP Submitted',
        description: `Your RSVP was successfully ${data.rsvp.status === 'yes' ? 'accepted' : data.rsvp.status === 'no' ? 'declined' : 'marked as maybe'}`,
        variant: 'default',
      });
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: 'RSVP Failed',
        description: error.message || 'Failed to submit RSVP',
        variant: 'destructive',
      });
    }
  });
}