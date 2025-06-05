import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import EventsPage from "./pages/events/EventsPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CreateEventPage from "./pages/events/CreateEventPage";
import EditEventPage from "./pages/events/EditEventPage";
import MapPage from "./pages/events/MapPage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/create" element={<CreateEventPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/:eventId/edit" element={<EditEventPage />} />
        <Route path="/map" element={<MapPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;