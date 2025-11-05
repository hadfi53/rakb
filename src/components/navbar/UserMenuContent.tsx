import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { User, LayoutDashboard, LogOut, Car, Mail, Calendar, Settings, Bell, Heart, MessageSquare, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/use-favorites";

interface UserMenuContentProps {
  user: any;
  onSignOut: () => void;
  getInitials: (user: any) => string;
  unreadCount?: number;
}

export const UserMenuContent = ({ user, onSignOut, getInitials, unreadCount = 0 }: UserMenuContentProps) => {
  const { getUserRole } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { favorites } = useFavorites();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role);
      } catch (error) {
        console.error("Erreur lors de la récupération du rôle:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [getUserRole]);

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
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none">
            {user.user_metadata?.first_name} {user.user_metadata?.last_name}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {user.email}
          </p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Chargement du rôle...</p>
          ) : (
            <div className="flex items-center mt-1">
              <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                {userRole === 'owner' ? 'Agence de location' : 
                 userRole === 'renter' ? 'Locataire' : 
                 userRole === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </Badge>
            </div>
          )}
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {isOwner && (
        <>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/owner" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Tableau de bord</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/owner/vehicles" className="cursor-pointer">
              <Car className="mr-2 h-4 w-4" />
              <span>Mes véhicules</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/owner/bookings" className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Mes réservations</span>
            </Link>
          </DropdownMenuItem>
        </>
      )}
      {isRenter && (
        <>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/renter" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Tableau de bord</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/renter/bookings" className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Mes réservations</span>
            </Link>
          </DropdownMenuItem>
        </>
      )}
      {isAdmin && (
        <>
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Tableau de bord Admin</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/admin/users" className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Gestion des utilisateurs</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/admin/emails" className="cursor-pointer">
              <Mail className="mr-2 h-4 w-4" />
              <span>Gestion des emails</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/admin/vehicles" className="cursor-pointer">
              <Car className="mr-2 h-4 w-4" />
              <span>Gestion des véhicules</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/admin/documents" className="cursor-pointer">
              <Mail className="mr-2 h-4 w-4" />
              <span>Gestion des documents</span>
            </Link>
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/profile" className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Mon profil</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/favorites" className="cursor-pointer flex justify-between w-full">
          <div className="flex items-center">
            <Heart className="mr-2 h-4 w-4" />
            <span>Favoris</span>
          </div>
          {favorites.length > 0 && (
            <Badge className="ml-2 bg-primary/10 text-primary text-xs">
              {favorites.length}
            </Badge>
          )}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/settings" className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/notifications" className="cursor-pointer flex justify-between w-full">
          <div className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500 text-white text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/messages" className="cursor-pointer">
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Messages</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Se déconnecter</span>
      </DropdownMenuItem>
    </>
  );
};
