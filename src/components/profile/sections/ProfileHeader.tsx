
import { VerificationStatus } from '@/components/profile/sections/VerificationStatus';
import { UserProfile } from '@/types/user';
import {
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

interface ProfileHeaderProps {
  profile: Partial<UserProfile>;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>Mon Profil</CardTitle>
          <CardDescription>Gérez vos informations personnelles</CardDescription>
        </div>
        <VerificationStatus
          status={profile.verification_status || 'pending'}
          role={profile.role || 'renter'}
        />
      </div>
    </CardHeader>
  );
};
