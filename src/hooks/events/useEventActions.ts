import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createNostrEventObject, createNostrEventUpdateObject } from '@/lib/nostr/eventUtils';
import { NostrEventData } from '@/lib/nostr/types';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
  const { user } = useCurrentUser();
  const { mutate: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (eventData: NostrEventData & { coHosts?: string[] }) => {
      if (!user?.pubkey) {
        throw new Error('User not logged in');
      }

      // Generate a unique ID for the event
      const id = `event_${Date.now()}`;
      const { coHosts, ...eventDataWithoutCoHosts } = eventData;

      const eventObject = createNostrEventObject(
        eventDataWithoutCoHosts,
        user.pubkey,
        id,
        coHosts
      );

      const result = await publish(eventObject);

      return { id, event: eventDataWithoutCoHosts, result };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['events'] });

      // Show success toast
      toast({
        title: 'Event Created',
        description: 'Your event has been created successfully!',
        variant: 'default',
      });

      // Navigate to the event detail page
      navigate(`/events/${data.id}`);
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: 'Event Creation Failed',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update an existing event
 */
export function useUpdateEvent() {
  const { user } = useCurrentUser();
  const { mutate: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventData,
      id,
      coHosts,
    }: {
      eventData: NostrEventData;
      id: string;
      coHosts?: string[];
    }) => {
      if (!user?.pubkey) {
        throw new Error('User not logged in');
      }

      const eventObject = createNostrEventObject(
        eventData,
        user.pubkey,
        id,
        coHosts
      );

      await publish(eventObject);

      return { id, event: eventData };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', data.id] });

      // Show success toast
      toast({
        title: 'Event Updated',
        description: 'Your event has been updated successfully!',
        variant: 'default',
      });
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: 'Event Update Failed',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to create an event update/announcement
 */
export function useCreateEventUpdate() {
  const { user } = useCurrentUser();
  const { mutate: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      content,
      eventId,
      creatorId,
      type = 'announcement',
    }: {
      content: string;
      eventId: string;
      creatorId: string;
      type?: 'announcement' | 'change' | 'cancellation';
    }) => {
      if (!user?.pubkey) {
        throw new Error('User not logged in');
      }

      // Check if the current user is the event creator
      if (user.pubkey !== creatorId) {
        throw new Error('Only the event creator can post updates');
      }

      const updateObject = createNostrEventUpdateObject(
        content,
        eventId,
        creatorId,
        type
      );

      await publish(updateObject);

      return { eventId, type, content };
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['event-updates', data.eventId] });

      // Show success toast
      let title = 'Update Posted';
      if (data.type === 'cancellation') {
        title = 'Event Cancelled';
      } else if (data.type === 'change') {
        title = 'Event Change Posted';
      }

      toast({
        title,
        description: 'Your update has been posted successfully!',
        variant: 'default',
      });
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to post update',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to generate calendar events and download as ICS file
 */
export function useExportToCalendar() {
  return useMutation({
    mutationFn: async (event: NostrEventData) => {
      // Dynamically import ical-generator
      const ical = (await import('ical-generator')).default;
      
      const calendar = ical();
      
      calendar.createEvent({
        start: new Date(event.startDate),
        end: event.endDate ? new Date(event.endDate) : undefined,
        summary: event.title,
        description: event.description,
        location: event.location?.name || event.location?.address || '',
        url: event.virtual ? event.virtualUrl : undefined,
      });
      
      const blob = new Blob([calendar.toString()], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      
      // Create a link element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    },
  });
}