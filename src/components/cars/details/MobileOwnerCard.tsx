
import { MessageCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MobileOwnerCardProps {
  owner?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    rating?: number;
    created_at?: string;
  } | null;
}

const MobileOwnerCard = ({ owner }: MobileOwnerCardProps) => {
  const ownerFirstName = owner?.first_name || "";
  const ownerLastName = owner?.last_name || "";
  const displayName = ownerFirstName || ownerLastName
    ? `${ownerFirstName} ${ownerLastName}`.trim()
    : "Propriétaire";
  const memberSince = owner?.created_at ? new Date(owner.created_at).getFullYear() : undefined;
  const rating = owner?.rating ?? 4.5;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {owner?.avatar_url ? (
            <img 
              src={owner.avatar_url} 
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {(ownerFirstName[0] || "").toUpperCase()}{(ownerLastName[0] || "").toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold">{displayName}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              {rating.toFixed(1)}{memberSince ? ` · Membre depuis ${memberSince}` : null}
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full mt-4">
          <MessageCircle className="w-4 h-4 mr-2" />
          Contacter le propriétaire
        </Button>
      </CardContent>
    </Card>
  );
};

export default MobileOwnerCard;
