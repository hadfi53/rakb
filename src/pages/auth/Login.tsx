import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, Car, Shield, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { getDashboardRouteByRole } from "@/utils/role-redirect";

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, getUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as LocationState | null;
  const from = state?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(formData.email, formData.password);
      
      // Récupérer le rôle de l'utilisateur pour redirection appropriée
      const userRole = await getUserRole();
      
      // Vérifier que l'utilisateur a un rôle défini
      if (!userRole) {
        toast({
          variant: "destructive",
          title: "Rôle non défini",
          description: "Votre compte ne possède pas de rôle défini. Veuillez contacter le support.",
        });
        setIsLoading(false);
        return;
      }
      
      // Déterminer la route de redirection selon le rôle
      // Si l'utilisateur a été redirigé depuis une route protégée, essayer d'y retourner
      // Sinon, rediriger vers le dashboard approprié selon le rôle
      let redirectPath: string;
      if (from && from !== '/auth/login') {
        // Si une route de retour existe et n'est pas la page de login elle-même
        redirectPath = from;
      } else {
        // Sinon, rediriger vers le dashboard approprié selon le rôle
        redirectPath = getDashboardRouteByRole(userRole);
      }
      
      // Message de bienvenue personnalisé selon le rôle
      const roleMessages: Record<'owner' | 'renter' | 'admin', { title: string; description: string }> = {
        owner: {
          title: "Connexion réussie",
          description: "Bienvenue, vous êtes connecté en tant qu'Agence de location",
        },
        renter: {
          title: "Connexion réussie",
          description: "Bienvenue, vous êtes connecté en tant que Locataire",
        },
        admin: {
          title: "Connexion réussie",
          description: "Bienvenue, vous êtes connecté en tant qu'Administrateur",
        },
      };
      
      const welcomeMessage = userRole && roleMessages[userRole] ? roleMessages[userRole] : {
        title: "Connexion réussie",
        description: "Bienvenue sur RAKB",
      };
      
      toast({
        title: welcomeMessage.title,
        description: welcomeMessage.description,
      });
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Vérifiez vos identifiants et réessayez",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
      {/* Bouton retour fixe en haut à gauche */}
      <div className="fixed top-0 left-0 p-6 z-10">
        <Link to="/" className="group inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Retour
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-fit">
              <Car className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Connexion à RAKB
              </CardTitle>
              <CardDescription>
                Pas encore inscrit ?{" "}
                <Link to="/auth/register" className="text-primary hover:text-primary-dark font-medium transition-colors">
                  Créer un compte
                </Link>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Votre mot de passe"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Link 
                      to="/auth/forgot-password" 
                      className="text-sm text-primary hover:text-primary-dark transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-4 bg-white text-gray-500">Ou continuer avec</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full" type="button">
                  <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Google
                </Button>
                <Button variant="outline" className="w-full" type="button">
                  <img src="https://authjs.dev/img/providers/facebook.svg" alt="Facebook" className="w-5 h-5 mr-2" />
                  Facebook
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-gray-600 mt-6">
                <Shield className="w-4 h-4" />
                <span>Connexion sécurisée via SSL</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
