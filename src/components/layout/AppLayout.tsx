import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { ModeToggle } from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, PlusIcon, HomeIcon } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEventNotifications } from '@/hooks/events/useEventNotifications';
import { Separator } from '@/components/ui/separator';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useCurrentUser();
  
  // Initialize notifications
  useEventNotifications();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <Link to="/" className="text-2xl font-bold">
            NostrEvents
          </Link>
          
          <div className="flex items-center space-x-4">
            <LoginArea className="max-w-60" />
            <ModeToggle />
          </div>
        </div>
      </header>
      
      {/* Navigation bar */}
      <nav className="border-b bg-muted/40">
        <div className="container mx-auto p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <HomeIcon className="h-4 w-4 mr-1" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/events">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Events
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/map">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  Explore Map
                </Link>
              </Button>
            </div>
            
            {user && (
              <Button size="sm" asChild>
                <Link to="/events/create">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <main className="flex-1">
        <div className="container mx-auto py-6">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="container mx-auto p-6">
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">About NostrEvents</h4>
              <p className="text-muted-foreground text-sm">
                A decentralized event planning and discovery platform built on Nostr.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-1 text-sm">
                <li><Link to="/events" className="hover:underline">Browse Events</Link></li>
                <li><Link to="/map" className="hover:underline">Explore Map</Link></li>
                {user && (
                  <li><Link to="/events/create" className="hover:underline">Create Event</Link></li>
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Connect</h4>
              <p className="text-sm text-muted-foreground">
                Built with Nostr protocol
              </p>
              <div className="mt-2 flex items-center">
                <RelaySelector />
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NostrEvents - Powered by Nostr
          </div>
        </div>
      </footer>
    </div>
  );
}

// This is a placeholder. We'll create the actual component later
function RelaySelector() {
  return <div>Relay selector (placeholder)</div>;
}