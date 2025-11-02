
import { Star, Calendar, CheckCircle } from 'lucide-react';
import { UserStats as Stats } from '@/types/user';

interface UserStatsProps {
  stats: Stats;
}

export const UserStats = ({ stats }: UserStatsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Statistiques</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Total locations</span>
          </div>
          <p className="text-2xl font-semibold">{stats.total_rentals}</p>
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span className="text-sm">Note moyenne</span>
          </div>
          <p className="text-2xl font-semibold">
            {stats.rating.toFixed(1)}/5
            <span className="text-sm text-muted-foreground ml-1">
              ({stats.rating_count})
            </span>
          </p>
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Respect réservations</span>
          </div>
          <p className="text-2xl font-semibold">{stats.reservation_compliance}%</p>
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Taux d'acceptation</span>
          </div>
          <p className="text-2xl font-semibold">{stats.acceptance_rate}%</p>
        </div>
      </div>
    </div>
  );
};
