import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RatingStars } from './RatingStars';
import { useRatings, RatingStats } from '@/hooks/use-ratings';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface RatingDisplayProps {
  userId: string;
  type: 'owner' | 'renter';
  className?: string;
}

export const RatingDisplay = ({
  userId,
  type,
  className
}: RatingDisplayProps) => {
  const { getUserRatingStats } = useRatings();
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getUserRatingStats(userId, type);
      setStats(data);
      setLoading(false);
    };

    fetchStats();
  }, [userId, type]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          Aucune évaluation disponible
        </CardContent>
      </Card>
    );
  }

  const renderOwnerStats = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Communication"
          value={stats.communication_avg || 0}
        />
        <StatCard
          label="Ponctualité"
          value={stats.punctuality_avg || 0}
        />
        <StatCard
          label="État du véhicule"
          value={stats.car_condition_avg || 0}
        />
      </div>
    </div>
  );

  const renderRenterStats = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Fiabilité"
          value={stats.reliability_avg || 0}
        />
        <StatCard
          label="Soin du véhicule"
          value={stats.car_care_avg || 0}
        />
        <StatCard
          label="État au retour"
          value={stats.return_condition_avg || 0}
        />
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <RatingStars
            value={stats.average_rating}
            onChange={() => {}}
            readOnly
            size="lg"
          />
          <span className="text-2xl font-semibold">
            {stats.average_rating.toFixed(1)}
          </span>
          <span className="text-gray-500">
            ({stats.total_ratings} avis)
          </span>
        </div>

        {type === 'owner' ? renderOwnerStats() : renderRenterStats()}
      </CardContent>
    </Card>
  );
};

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="text-sm text-gray-500 mb-2">{label}</div>
    <div className="flex items-center gap-2">
      <RatingStars
        value={value}
        onChange={() => {}}
        readOnly
        size="sm"
      />
      <span className="font-medium">{value.toFixed(1)}</span>
    </div>
  </div>
); 