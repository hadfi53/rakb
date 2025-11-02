
import { Input } from '@/components/ui/input';
import { UserProfile } from '@/types/user';

interface PersonalInfoProps {
  profile: Partial<UserProfile>;
  onProfileChange: (updates: Partial<UserProfile>) => void;
}

export const PersonalInfo = ({ profile, onProfileChange }: PersonalInfoProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label htmlFor="firstName" className="text-sm font-medium">
          Prénom
        </label>
        <Input
          id="firstName"
          value={profile.first_name}
          onChange={(e) => onProfileChange({ first_name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="lastName" className="text-sm font-medium">
          Nom
        </label>
        <Input
          id="lastName"
          value={profile.last_name}
          onChange={(e) => onProfileChange({ last_name: e.target.value })}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label htmlFor="birthdate" className="text-sm font-medium">
          Date de naissance
        </label>
        <Input
          id="birthdate"
          type="date"
          value={profile.birthdate || ''}
          onChange={(e) => onProfileChange({ birthdate: e.target.value })}
        />
      </div>
    </div>
  );
};
