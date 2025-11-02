
import { Input } from '@/components/ui/input';
import { Phone, Mail } from 'lucide-react';
import { UserProfile } from '@/types/user';

interface ContactInfoProps {
  profile: Partial<UserProfile>;
  onProfileChange: (updates: Partial<UserProfile>) => void;
}

export const ContactInfo = ({ profile, onProfileChange }: ContactInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Mail className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-600">{profile.email}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Phone className="w-5 h-5 text-gray-500" />
        <Input
          placeholder="Numéro de téléphone"
          value={profile.phone || ''}
          onChange={(e) => onProfileChange({ phone: e.target.value })}
        />
      </div>
    </div>
  );
};
