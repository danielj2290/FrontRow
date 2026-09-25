import { BrowserRouter, Route, Routes } from "react-router";
import { SiteHeader } from "./components/SiteHeader.tsx";
import { SiteFooter } from "./components/SiteFooter.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ScrollRestoration } from "./components/ScrollRestoration.tsx";
import { HomePage } from "./pages/HomePage.tsx";
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
        <ScrollRestoration />

        {/* flex column + flex-1 on main pins the footer to the bottom of the
            viewport on short pages, instead of leaving it floating mid-screen
            under a one-result search. */}
        <div className="flex min-h-screen flex-col bg-canvas text-fg">
          <SiteHeader />

          <main className="flex-1">
            {/* Inside the router so the fallback UI still has working links,
                and inside main so a caught error does not take the header and
                footer down with it. */}
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/event/:id" element={<EventDetailPage />} />
                <Route path="/artist/:name" element={<ArtistPage />} />
                <Route path="/genre/:slug" element={<GenrePage />} />
                <Route
                  path="*"
                  element={
                    <div className="mx-auto max-w-6xl px-4 py-20">
                      <EmptyState
                        title="Page not found"
                        body="That URL does not exist. Try searching for an artist instead."
                      />
                    </div>
                  }
                />
              </Routes>
            </ErrorBoundary>
          </main>

          <SiteFooter />
        </div>
      </BrowserRouter>
    </LocationProvider>
  );
}

export default App;
