import React, { memo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Car, LogIn, UserPlus, LayoutDashboard, User, LogOut, HelpCircle, MessageCircle, Shield, Bell, Settings, Calendar, Mail, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

interface MobileMenuProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  getInitials: (user: any) => string;
  unreadCount?: number;
  onBecomeOwner: (e: React.MouseEvent) => void;
}

export const MobileMenu = memo(({ 
  user, 
  isOpen, 
  onClose, 
  onSignOut, 
  getInitials,
  unreadCount = 0,
  onBecomeOwner
}: MobileMenuProps) => {
  const { getUserRole } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const role = await getUserRole();
          setUserRole(role);
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserRole();
  }, [user, getUserRole]);

  const isOwner = userRole === 'owner';
  const isRenter = userRole === 'renter';
  const isAdmin = userRole === 'admin';

  const getRoleBadgeColor = () => {
    if (isOwner) return "bg-blue-100 text-blue-800";
    if (isRenter) return "bg-green-100 text-green-800";
    if (isAdmin) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {user ? (
              <div className="flex flex-col space-y-4">
                {/* Profil utilisateur */}
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.first_name} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium">
                      {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {!isLoading && (
                      <Badge className={`mt-1 text-xs ${getRoleBadgeColor()}`}>
                        {userRole === 'owner' ? 'Agence de location' : 
                         userRole === 'renter' ? 'Locataire' : 
                         userRole === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Navigation principale */}
                <div className="space-y-2">
                  {/* Options spécifiques au rôle */}
                  {isOwner && (
                    <>
                      <Link to="/dashboard/owner">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Tableau de bord
                        </Button>
                      </Link>
                      <Link to="/dashboard/owner/vehicles">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <Car className="mr-2 h-4 w-4" />
                          Mes véhicules
                        </Button>
                      </Link>
                      <Link to="/dashboard/owner/bookings">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Mes réservations
                        </Button>
                      </Link>
                    </>
                  )}

                  {isRenter && (
                    <>
                      <Link to="/dashboard/renter">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Tableau de bord
                        </Button>
                      </Link>
                      <Link to="/dashboard/renter/bookings">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Mes réservations
                        </Button>
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <Link to="/admin">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Tableau de bord Admin
                        </Button>
                      </Link>
                      <Link to="/admin/users">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <Users className="mr-2 h-4 w-4" />
                          Gestion des utilisateurs
                        </Button>
                      </Link>
                      <Link to="/admin/vehicles">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <Car className="mr-2 h-4 w-4" />
                          Gestion des véhicules
                        </Button>
                      </Link>
                      <Link to="/admin/documents">
                        <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                          <FileText className="mr-2 h-4 w-4" />
                          Gestion des documents
                        </Button>
                      </Link>
                    <Link to="/admin/emails">
                      <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                        <Mail className="mr-2 h-4 w-4" />
                        Gestion des emails
                      </Button>
                    </Link>
                    </>
                  )}

                  {/* Options communes */}
                  <Link to="/profile">
                    <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Button>
                  </Link>

                  <Link to="/settings">
                    <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Button>
                  </Link>

                  <Link to="/notifications">
                    <Button variant="ghost" className="w-full justify-start relative" onClick={onClose}>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive"
                          className="ml-auto"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>

                  {!isOwner && (
                    <Button
                      onClick={(e) => {
                        onBecomeOwner(e);
                        onClose();
                      }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Car className="mr-2 h-4 w-4" />
                      Pour les agences
                    </Button>
                  )}
                </div>

                {/* Liens secondaires */}
                <div className="space-y-2 border-t pt-4">
                  <Link to="/how-it-works">
                    <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Comment ça marche
                    </Button>
                  </Link>

                  <Link to="/contact">
                    <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
                  </Link>

                  <Link to="/legal">
                    <Button variant="ghost" className="w-full justify-start" onClick={onClose}>
                      <Shield className="mr-2 h-4 w-4" />
                      Légal
                    </Button>
                  </Link>
                </div>

                {/* Déconnexion */}
                <div className="border-t pt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                <Link to="/auth/login" onClick={onClose}>
                  <Button variant="default" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Connexion
                  </Button>
                </Link>

                <Link to="/auth/register" onClick={onClose}>
                  <Button variant="outline" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inscription
                  </Button>
                </Link>

                <Button
                  onClick={(e) => {
                    onBecomeOwner(e);
                    onClose();
                  }}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Car className="mr-2 h-4 w-4" />
                  Pour les agences
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

MobileMenu.displayName = "MobileMenu";
