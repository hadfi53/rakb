
import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export const GuestMenuContent = () => {
  return (
    <>
      <DropdownMenuItem asChild>
        <Link to="/auth/login" className="cursor-pointer">
          <LogIn className="mr-2 h-4 w-4" />
          <span>Connexion</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/auth/register" className="cursor-pointer">
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Inscription</span>
        </Link>
      </DropdownMenuItem>
    </>
  );
};
