
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/user';
import { Car, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RoleSelectionProps {
  currentRole?: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSelection = ({ currentRole, onRoleChange }: RoleSelectionProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Je suis un</label>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={currentRole === 'renter' ? 'default' : 'outline'}
          onClick={() => onRoleChange('renter')}
          className="w-full py-2 md:py-3 transition-all duration-200"
          size={isMobile ? "sm" : "default"}
        >
          <Search className="w-4 h-4 mr-2" />
          <span>Locataire</span>
        </Button>
        <Button
          variant={currentRole === 'owner' ? 'default' : 'outline'}
          onClick={() => onRoleChange('owner')}
          className="w-full py-2 md:py-3 transition-all duration-200"
          size={isMobile ? "sm" : "default"}
        >
          <Car className="w-4 h-4 mr-2" />
          <span>Propriétaire</span>
        </Button>
      </div>
    </div>
  );
};
