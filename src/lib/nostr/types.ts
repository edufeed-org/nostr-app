import { NostrEvent } from '@nostrify/nostrify';

export interface EventLocation {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface NostrEventData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: EventLocation;
  virtual?: boolean;
  virtualUrl?: string;
  image?: string; 
  tags?: string[];
  cost?: string;
  capacity?: number;
  requirements?: string;
  contact?: string;
}

export interface NostrEventRSVP {
  status: 'yes' | 'no' | 'maybe';
  comment?: string;
  attendees?: number;
}

export type NostrEventUpdate = {
  id: string;
  eventId: string;
  creatorId: string;
  content: string;
  type: 'announcement' | 'change' | 'cancellation';
  createdAt: number;
};

export interface NostrEventWithMeta extends NostrEventData {
  id: string; // This is the "d" tag
  pubkey: string;
  createdAt: number;
  coHosts?: string[];
  relayHint?: string;
  rawEvent?: NostrEvent;
  rsvpCount?: {
    yes: number;
    no: number;
    maybe: number;
  };
}