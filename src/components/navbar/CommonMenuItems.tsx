
import { Link } from "react-router-dom";
import { HelpCircle, MessageCircle, Shield } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export const CommonMenuItems = () => {
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/how-it-works" className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Comment ça marche</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/contact" className="cursor-pointer">
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>Contact</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/legal" className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          <span>Légal</span>
        </Link>
      </DropdownMenuItem>
    </>
  );
};
