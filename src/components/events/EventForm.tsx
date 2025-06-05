import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCreateEvent, useUpdateEvent } from '@/hooks/events/useEventActions';
import { useUploadFile } from '@/hooks/useUploadFile';
import { NostrEventData, NostrEventWithMeta } from '@/lib/nostr/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Image, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface EventFormProps {
  existingEvent?: NostrEventWithMeta;
  onSuccess?: () => void;
}

export function EventForm({ existingEvent, onSuccess }: EventFormProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    existingEvent?.startDate ? new Date(existingEvent.startDate) : undefined
  );
  const [startTime, setStartTime] = useState(
    existingEvent?.startDate ? format(new Date(existingEvent.startDate), 'HH:mm') : ''
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    existingEvent?.endDate ? new Date(existingEvent.endDate) : undefined
  );
  const [endTime, setEndTime] = useState(
    existingEvent?.endDate ? format(new Date(existingEvent.endDate), 'HH:mm') : ''
  );
  const [locationName, setLocationName] = useState(existingEvent?.location?.name || '');
  const [locationAddress, setLocationAddress] = useState(existingEvent?.location?.address || '');
  const [latitude, setLatitude] = useState<string>(
    existingEvent?.location?.latitude ? existingEvent.location.latitude.toString() : ''
  );
  const [longitude, setLongitude] = useState<string>(
    existingEvent?.location?.longitude ? existingEvent.location.longitude.toString() : ''
  );
  const [isVirtual, setIsVirtual] = useState(existingEvent?.virtual || false);
  const [virtualUrl, setVirtualUrl] = useState(existingEvent?.virtualUrl || '');
  const [imageUrl, setImageUrl] = useState(existingEvent?.image || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(existingEvent?.image || '');
  const [tags, setTags] = useState<string[]>(existingEvent?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [cost, setCost] = useState(existingEvent?.cost || '');
  const [capacity, setCapacity] = useState<string>(
    existingEvent?.capacity ? existingEvent.capacity.toString() : ''
  );
  const [requirements, setRequirements] = useState(existingEvent?.requirements || '');
  const [contact, setContact] = useState(existingEvent?.contact || '');
  
  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Format date with time for Nostr
  const formatDateWithTime = (date: Date | undefined, time: string): string | undefined => {
    if (!date) return undefined;
    
    const [hours, minutes] = time.split(':').map(Number);
    const dateWithTime = new Date(date);
    dateWithTime.setHours(hours || 0);
    dateWithTime.setMinutes(minutes || 0);
    
    return dateWithTime.toISOString();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to create an event');
      return;
    }
    
    if (!title || !description || !startDate || !startTime) {
      alert('Please fill out all required fields');
      return;
    }
    
    try {
      // Upload image if provided
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const [[_, url]] = await uploadFile(imageFile);
        finalImageUrl = url;
      }
      
      // Prepare the event data
      const eventData: NostrEventData = {
        title,
        description,
        startDate: formatDateWithTime(startDate, startTime)!,
        endDate: endDate ? formatDateWithTime(endDate, endTime || '23:59') : undefined,
        location: {
          name: locationName || undefined,
          address: locationAddress || undefined,
          latitude: latitude ? parseFloat(latitude) : undefined,
          longitude: longitude ? parseFloat(longitude) : undefined,
        },
        virtual: isVirtual,
        virtualUrl: isVirtual ? virtualUrl : undefined,
        image: finalImageUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
        cost: cost || undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        requirements: requirements || undefined,
        contact: contact || undefined,
      };
      
      if (existingEvent) {
        // Update existing event
        updateEvent({
          eventData,
          id: existingEvent.id,
          coHosts: existingEvent.coHosts,
        }, { 
          onSuccess: () => {
            onSuccess?.();
          }
        });
      } else {
        // Create new event
        createEvent(eventData, {
          onSuccess: () => {
            onSuccess?.();
          }
        });
      }
    } catch (error) {
      console.error('Error creating/updating event:', error);
      alert('Failed to save event');
    }
  };
  
  const isPending = isCreating || isUpdating || isUploading;
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Tell people the essential details about your event.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="Give your event a name"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="What is your event about?"
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => 
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time (optional)</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Where will your event take place?
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVirtual"
                checked={isVirtual}
                onCheckedChange={(checked) => setIsVirtual(checked === true)}
              />
              <Label htmlFor="isVirtual">This is a virtual event</Label>
            </div>
            
            {isVirtual ? (
              <div className="space-y-2">
                <Label htmlFor="virtualUrl">Virtual Event URL</Label>
                <Input 
                  id="virtualUrl"
                  placeholder="https://meet.example.com/your-event"
                  value={virtualUrl}
                  onChange={e => setVirtualUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Provide a link to your virtual event (Zoom, Google Meet, etc.)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="locationName">Venue Name</Label>
                  <Input
                    id="locationName"
                    placeholder="e.g. City Park, Conference Center"
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="locationAddress">Address</Label>
                  <Input
                    id="locationAddress"
                    placeholder="Full address of venue"
                    value={locationAddress}
                    onChange={e => setLocationAddress(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude (optional)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 37.7749"
                      value={latitude}
                      onChange={e => setLatitude(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude (optional)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g. -122.4194"
                      value={longitude}
                      onChange={e => setLongitude(e.target.value)}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Tip: You can get coordinates by right-clicking on a location in Google Maps 
                  and selecting "What's here?"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>
              Enhance your event with more information.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
              <div className="grid gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="image" className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-20 hover:border-primary transition-colors">
                        <Image className="h-6 w-6 mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {imageFile || imageUrl ? 'Change image' : 'Upload image'}
                        </span>
                      </div>
                    </Label>
                  </div>
                  
                  {(imagePreview || imageUrl) && (
                    <div className="relative">
                      <img
                        src={imagePreview || imageUrl}
                        alt="Event preview"
                        className="rounded-lg h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setImageUrl('');
                        }}
                        className="absolute top-1 right-1 bg-background rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex space-x-2">
                <Input
                  id="tags"
                  placeholder="Add tags like 'music', 'conference', etc."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="sm">Add</Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <div 
                      key={tag}
                      className="bg-muted px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost (optional)</Label>
              <Input 
                id="cost"
                placeholder="e.g. Free, $10, Donation-based"
                value={cost}
                onChange={e => setCost(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input 
                id="capacity"
                type="number"
                min="1"
                placeholder="Maximum number of attendees"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="requirements">Requirements (optional)</Label>
              <Textarea 
                id="requirements"
                placeholder="Any special requirements for attendees"
                value={requirements}
                onChange={e => setRequirements(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="contact">Contact Information (optional)</Label>
              <Input 
                id="contact"
                placeholder="How can attendees contact you?"
                value={contact}
                onChange={e => setContact(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </div>
    </form>
  );
}