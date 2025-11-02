import React, { memo } from "react";
import { Menu, User, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMenuContent } from "./UserMenuContent";
import { GuestMenuContent } from "./GuestMenuContent";
import { CommonMenuItems } from "./CommonMenuItems";
import { Link } from "react-router-dom";

interface DesktopMenuProps {
  user: any;
  onSignOut: () => void;
  getInitials: (user: any) => string;
  unreadCount?: number;
}

export const DesktopMenu = memo(({ user, onSignOut, getInitials, unreadCount = 0 }: DesktopMenuProps) => {
  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.first_name} />
                <AvatarFallback>{getInitials(user)}</AvatarFallback>
              </Avatar>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <UserMenuContent 
              user={user} 
              onSignOut={onSignOut} 
              getInitials={getInitials}
              unreadCount={unreadCount}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center space-x-2">
          <Link to="/auth/login">
            <Button variant="default" size="sm">
              <LogIn className="mr-2 h-4 w-4" />
              Connexion
            </Button>
          </Link>
          <Link to="/auth/register">
            <Button variant="outline" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Inscription
            </Button>
          </Link>
        </div>
      )}
    </>
  );
});

DesktopMenu.displayName = "DesktopMenu";
