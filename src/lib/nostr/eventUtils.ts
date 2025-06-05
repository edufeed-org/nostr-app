import { NostrEvent } from '@nostrify/nostrify';
import { NostrEventData, NostrEventRSVP, NostrEventUpdate, NostrEventWithMeta } from './types';

// Constants for event kinds
export const EVENT_KIND = 31000;
export const RSVP_KIND = 31001;
export const EVENT_UPDATE_KIND = 31002;

/**
 * Parse a Nostr event into our NostrEventWithMeta format
 */
export function parseNostrEvent(event: NostrEvent): NostrEventWithMeta | null {
  try {
    const content = JSON.parse(event.content) as NostrEventData;
    
    // Get the unique identifier from the 'd' tag
    const dTag = event.tags.find(tag => tag[0] === 'd');
    if (!dTag || !dTag[1]) return null;
    
    const id = dTag[1];
    
    // Get subject/title from tags (fallback to content)
    const subjectTag = event.tags.find(tag => tag[0] === 'subject');
    const title = subjectTag && subjectTag[1] ? subjectTag[1] : content.title;
    
    // Get location from tags (fallback to content)
    const locationTag = event.tags.find(tag => tag[0] === 'location');
    const locationFromTag = locationTag && locationTag[1] ? locationTag[1] : undefined;
    
    // Get dates from tags (fallback to content)
    const startTag = event.tags.find(tag => tag[0] === 'start');
    const startDate = startTag && startTag[1] ? startTag[1] : content.startDate;
    
    const endTag = event.tags.find(tag => tag[0] === 'end');
    const endDate = endTag && endTag[1] ? endTag[1] : content.endDate;
    
    // Get image from tags (fallback to content)
    const imageTag = event.tags.find(tag => tag[0] === 'image');
    const image = imageTag && imageTag[1] ? imageTag[1] : content.image;
    
    // Get category tags
    const categoryTags = event.tags.filter(tag => tag[0] === 't').map(tag => tag[1]);
    
    // Get co-hosts from 'p' tags
    const coHosts = event.tags
      .filter(tag => tag[0] === 'p' && tag.length >= 2)
      .map(tag => tag[1]);
    
    // Get relay hint
    const relayTag = event.tags.find(tag => tag[0] === 'r');
    const relayHint = relayTag && relayTag[1] ? relayTag[1] : undefined;
    
    return {
      ...content,
      title,
      id,
      pubkey: event.pubkey,
      createdAt: event.created_at,
      startDate,
      endDate,
      image,
      tags: categoryTags.length > 0 ? categoryTags : content.tags,
      coHosts,
      relayHint,
      rawEvent: event,
      // If tags were provided, ensure they override content
      ...(locationFromTag ? { location: { name: locationFromTag } } : {})
    };
  } catch (e) {
    console.error('Error parsing Nostr event:', e);
    return null;
  }
}

/**
 * Create a Nostr event object from our data model
 */
export function createNostrEventObject(
  eventData: NostrEventData, 
  pubkey: string, 
  id: string,
  coHosts: string[] = [],
  relayHint?: string
): Partial<NostrEvent> {
  // Create the base tags
  const tags = [
    ['d', id],
    ['subject', eventData.title],
    ['start', eventData.startDate]
  ];
  
  // Add optional tags
  if (eventData.endDate) {
    tags.push(['end', eventData.endDate]);
  }
  
  if (eventData.location?.name) {
    tags.push(['location', eventData.location.name]);
  }
  
  if (eventData.image) {
    tags.push(['image', eventData.image]);
  }
  
  // Add category tags
  if (eventData.tags && eventData.tags.length > 0) {
    eventData.tags.forEach(tag => tags.push(['t', tag]));
  }
  
  // Add co-hosts
  if (coHosts && coHosts.length > 0) {
    coHosts.forEach(host => tags.push(['p', host]));
  }
  
  // Add relay hint
  if (relayHint) {
    tags.push(['r', relayHint]);
  }
  
  // Create the event object
  return {
    kind: EVENT_KIND,
    content: JSON.stringify(eventData),
    tags,
  };
}

/**
 * Parse a Nostr RSVP event
 */
export function parseNostrRSVP(event: NostrEvent): { rsvp: NostrEventRSVP, eventId: string, userId: string } | null {
  try {
    const content = JSON.parse(event.content) as NostrEventRSVP;
    
    // Get the event ID from the 'e' tag
    const eTag = event.tags.find(tag => tag[0] === 'e');
    if (!eTag || !eTag[1]) return null;
    
    const eventId = eTag[1];
    
    // Ensure we have a valid status
    if (!content.status || !['yes', 'no', 'maybe'].includes(content.status)) {
      return null;
    }
    
    return {
      rsvp: {
        status: content.status as 'yes' | 'no' | 'maybe',
        comment: content.comment,
        attendees: content.attendees || 1
      },
      eventId,
      userId: event.pubkey
    };
  } catch (e) {
    console.error('Error parsing Nostr RSVP:', e);
    return null;
  }
}

/**
 * Create a Nostr RSVP object
 */
export function createNostrRSVPObject(
  rsvpData: NostrEventRSVP, 
  eventId: string, 
  eventCreatorPubkey: string,
  userPubkey: string
): Partial<NostrEvent> {
  // Create a unique identifier using the user's pubkey and event ID
  const rsvpId = `${userPubkey.substring(0, 8)}_${eventId}`;
  
  // Create the tags
  const tags = [
    ['d', rsvpId],
    ['e', eventId], // Reference to the event
    ['p', eventCreatorPubkey], // Reference to the event creator
    ['status', rsvpData.status]
  ];
  
  // Create the event object
  return {
    kind: RSVP_KIND,
    content: JSON.stringify(rsvpData),
    tags
  };
}

/**
 * Parse a Nostr event update
 */
export function parseNostrEventUpdate(event: NostrEvent): NostrEventUpdate | null {
  try {
    // Get the unique identifier from the 'd' tag
    const dTag = event.tags.find(tag => tag[0] === 'd');
    if (!dTag || !dTag[1]) return null;
    
    const id = dTag[1];
    
    // Get the event ID from the 'e' tag
    const eTag = event.tags.find(tag => tag[0] === 'e');
    if (!eTag || !eTag[1]) return null;
    
    const eventId = eTag[1];
  
    // Get the update type
    const typeTag = event.tags.find(tag => tag[0] === 'type');
    const type = typeTag && typeTag[1] ? typeTag[1] as 'announcement' | 'change' | 'cancellation' : 'announcement';
    
    return {
      id,
      eventId,
      creatorId: event.pubkey,
      content: event.content,
      type,
      createdAt: event.created_at
    };
  } catch (e) {
    console.error('Error parsing Nostr event update:', e);
    return null;
  }
}

/**
 * Create a Nostr event update object
 */
export function createNostrEventUpdateObject(
  content: string,
  eventId: string,
  eventCreatorPubkey: string,
  type: 'announcement' | 'change' | 'cancellation' = 'announcement'
): Partial<NostrEvent> {
  // Create a unique identifier
  const updateId = `update_${Date.now()}`;
  
  // Create the tags
  const tags = [
    ['d', updateId],
    ['e', eventId], // Reference to the event
    ['p', eventCreatorPubkey], // Reference to the event creator
    ['type', type]
  ];
  
  // Create the event object
  return {
    kind: EVENT_UPDATE_KIND,
    content: content,
    tags
  };
}