import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OwnerInfoProps {
  owner: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    rating?: number;
    created_at: string;
  };
  className?: string;
}

const OwnerInfo = ({ owner, className }: OwnerInfoProps) => {
  // Calculer l'année d'inscription
  const memberSince = new Date(owner.created_at).getFullYear();
  const rating = owner.rating || 4.5; // Valeur par défaut si pas de note

  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Propriétaire</h2>
        <div className="flex items-center space-x-4">
          {owner.avatar_url ? (
            <img 
              src={owner.avatar_url} 
              alt={`${owner.first_name} ${owner.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
              {owner.first_name[0]}{owner.last_name[0]}
            </div>
          )}
          <div>
            <h3 className="font-semibold">{owner.first_name} {owner.last_name}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              {rating.toFixed(1)} · Membre depuis {memberSince}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerInfo;
