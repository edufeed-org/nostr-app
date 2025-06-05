# NIP-XX: Event Planning Protocol

## Abstract

This NIP defines a set of event kinds and conventions for event planning and management on the Nostr network, including event announcements, RSVPs, and calendar integrations.

## Event Kinds

### Event Announcement (Kind: 31000)

A replaceable event that announces a planned event with details such as title, description, location, date/time, etc.

#### Content

JSON object with the following properties:

```json
{
  "title": "string", // Required: Event title
  "description": "string", // Required: Event description
  "startDate": "ISO-8601 string", // Required: Event start date and time
  "endDate": "ISO-8601 string", // Optional: Event end date and time
  "location": { // Optional: Physical location
    "name": "string", // Optional: Location name
    "address": "string", // Optional: Full address
    "latitude": "number", // Optional: Geographic coordinates
    "longitude": "number" // Optional: Geographic coordinates
  },
  "virtual": "boolean", // Optional: Whether the event is virtual/online
  "virtualUrl": "string", // Optional: Link for virtual/online events
  "image": "string", // Optional: URL to event banner image
  "tags": ["string"], // Optional: Array of tags for categorizing the event
  "cost": "string", // Optional: Cost information
  "capacity": "number", // Optional: Maximum number of attendees
  "requirements": "string", // Optional: Any special requirements for attendees
  "contact": "string" // Optional: Contact information for event organizer
}
```

#### Tags

- `d`: Unique identifier for the event
- `subject`: Event title (same as content.title)
- `location`: Optional physical location
- `start`: Required event start date in ISO-8601 format
- `end`: Optional event end date in ISO-8601 format
- `image`: Optional URL to event banner image
- `t`: Optional tags for categorizing the event (multiple allowed)
- `p`: Optional references to co-hosts (pubkeys)
- `r`: Optional reference to a relay where the event's information should be published

### RSVP Response (Kind: 31001)

A replaceable event that represents a user's RSVP to an event.

#### Content

JSON object with the following properties:

```json
{
  "status": "string", // Required: "yes", "no", or "maybe"
  "comment": "string", // Optional: A comment about the RSVP
  "attendees": "number" // Optional: Number of attendees in the RSVP (default: 1)
}
```

#### Tags

- `d`: Unique identifier for this RSVP (typically the user's pubkey + event identifier)
- `e`: Reference to the event (Kind: 31000) this RSVP is for
- `p`: Reference to the event creator's pubkey
- `status`: RSVP status ("yes", "no", or "maybe")

### Event Update (Kind: 31002)

A parameterized replaceable event that represents an update or announcement about an existing event.

#### Content

Text content of the update.

#### Tags

- `d`: Unique identifier for this update
- `e`: Reference to the event (Kind: 31000) this update is for
- `p`: Reference to the event creator's pubkey
- `type`: Type of update (e.g., "announcement", "change", "cancellation")

## Client Behavior

Clients implementing this protocol SHOULD:

1. Display events chronologically or by proximity to the current date
2. Allow users to filter events by location, category, or date range
3. Show RSVP counts for events
4. Allow users to manage their RSVPs
5. Provide calendar export functionality (e.g., iCal, Google Calendar)
6. Send notifications for upcoming events the user has RSVP'd to
7. Allow event creators to see a list of attendees who have RSVP'd
8. Support maps for displaying event locations