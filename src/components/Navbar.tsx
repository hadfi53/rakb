import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Car, Bell, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { NavLogo } from "./navbar/NavLogo";
import { DesktopMenu } from "./navbar/DesktopMenu";
import { MobileMenu } from "./navbar/MobileMenu";
import { useNotificationBadge } from "@/hooks/use-notification-badge";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, getUserRole } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { unreadCount } = useNotificationBadge();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const role = await getUserRole();
          setUserRole(role);
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle:", error);
        }
      }
    };

    fetchUserRole();
  }, [user, getUserRole]);

  const handleSignOut = async () => {
    try {
      const success = await signOut();
      if (success) {
        // Forcer un rechargement complet de la page pour s'assurer que tout est réinitialisé
        window.location.href = '/';
      } else {
        // En cas d'échec, rediriger quand même vers la page d'accueil
        navigate('/');
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // En cas d'erreur, rediriger quand même vers la page d'accueil
      navigate('/');
    }
  };

  const handleBecomeOwner = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Rediriger directement vers la page d'information, peu importe le statut de l'utilisateur
    navigate('/become-owner');
  };

  const getInitials = (user: any) => {
    const firstName = user?.user_metadata?.first_name || '';
    const lastName = user?.user_metadata?.last_name || '';
    return (firstName[0] + lastName[0]).toUpperCase();
  };

  return (
    <>
      {/* Bannière d'annonce */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground text-center py-1 px-3 md:py-2 md:px-4 shadow-sm">
        <div className="container mx-auto flex items-center justify-center gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base leading-tight">
          <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="whitespace-nowrap">
            L'application <span className="font-bold">RAKB</span> sera bientôt disponible pour <span className="font-semibold">iPhone</span> et <span className="font-semibold">Android</span>
          </span>
        </div>
      </div>

      {/* Header principal */}
      <header className="fixed left-0 right-0 z-50 bg-background border-b top-[34px] md:top-[42px]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <NavLogo />

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Bouton "Pour les agences" - masqué si l'utilisateur est déjà une agence */}
          {userRole !== 'owner' && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200"
              onClick={handleBecomeOwner}
            >
              <Car className="w-4 h-4 mr-2" />
              Pour les agences
            </Button>
          )}
          
          {/* Bouton de notifications pour les utilisateurs connectés */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive"
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-[10px]"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          )}
          
          <DesktopMenu 
            user={user} 
            onSignOut={handleSignOut} 
            getInitials={getInitials} 
            unreadCount={unreadCount}
          />
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          <Menu className="h-6 w-6 md:h-5 md:w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        user={user}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSignOut={handleSignOut}
        getInitials={getInitials}
        unreadCount={unreadCount}
        onBecomeOwner={handleBecomeOwner}
      />
      </header>
    </>
  );
};

export default Navbar;
