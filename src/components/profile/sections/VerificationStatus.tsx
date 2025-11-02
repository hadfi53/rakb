
import { CheckCircle, AlertCircle, XCircle, Shield } from 'lucide-react';
import { VerificationStatus as Status } from '@/types/user';
import { cn } from '@/lib/utils';

interface VerificationStatusProps {
  status: Status;
  role: 'owner' | 'renter';
}

export const VerificationStatus = ({ status, role }: VerificationStatusProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'verified':
        return `${role === 'owner' ? 'Propriétaire' : 'Locataire'} Vérifié`;
      case 'pending':
        return 'Vérification en cours';
      case 'rejected':
        return 'Vérification rejetée';
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-background border';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full",
      getBgColor()
    )}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
    </div>
  );
};
