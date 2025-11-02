import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, HelpCircle } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();

  useSEO({
    title: "Page non trouvée",
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
    noindex: true,
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white pt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary/20 mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Page non trouvée
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/search">
                <Search className="mr-2 h-5 w-5" />
                Rechercher un véhicule
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/help">
                <HelpCircle className="mr-2 h-5 w-5" />
                Besoin d'aide ?
              </Link>
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">
              Pages populaires :
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link to="/" className="hover:text-primary hover:underline">
                  → Accueil
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-primary hover:underline">
                  → Rechercher un véhicule
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-primary hover:underline">
                  → Comment ça marche
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary hover:underline">
                  → Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary hover:underline">
                  → FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
