import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/CookieConsent";
import ErrorBoundary from "./components/ErrorBoundary";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/query-core";
import AppRoutes from "./routes";
import SupabaseProvider from "./lib/supabase/supabase-provider";
import { runImageDiagnostics } from "./lib/diagnostics/imageDiagnostics";

const queryClient = new QueryClient();

function App() {
  // Exécuter les diagnostics d'images au démarrage (dev seulement)
  useEffect(() => {
    if (import.meta.env.DEV) {
      runImageDiagnostics();
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SupabaseProvider>
            <AuthProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Toaster />
                <CookieConsent />
                <div className="min-h-screen bg-background flex flex-col">
                  <Navbar />
                  <div className="flex-1 pt-[106px]">
                    <ErrorBoundary>
                      <AppRoutes />
                    </ErrorBoundary>
                  </div>
                  <Footer />
                </div>
              </BrowserRouter>
            </AuthProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
