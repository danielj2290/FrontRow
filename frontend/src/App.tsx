import { BrowserRouter, Route, Routes } from "react-router";
import { SiteHeader } from "./components/SiteHeader.tsx";
import { SearchPage } from "./pages/SearchPage.tsx";
import { EventDetailPage } from "./pages/EventDetailPage.tsx";
import { ArtistPage } from "./pages/ArtistPage.tsx";
import { GenrePage } from "./pages/GenrePage.tsx";
import { EmptyState } from "./components/EmptyState.tsx";
import { LocationProvider } from "./context/LocationContext.tsx";

// BrowserRouter uses real URLs (/event/sg-123) rather than hash fragments.
// That needs the server to serve index.html for any unmatched path, which is
// what the catch-all rewrite in vercel.json does in production and what Vite's
// dev server does automatically.
function App() {
  return (
    <LocationProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
          <SiteHeader />
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/event/:id" element={<EventDetailPage />} />
            <Route path="/artist/:name" element={<ArtistPage />} />
            <Route path="/genre/:slug" element={<GenrePage />} />
            <Route
              path="*"
              element={
                <div className="mx-auto max-w-6xl px-4 py-10">
                  <EmptyState
                    title="Page not found"
                    body="That URL does not exist. Try searching for an artist instead."
                  />
                </div>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </LocationProvider>
  );
}

export default App;
