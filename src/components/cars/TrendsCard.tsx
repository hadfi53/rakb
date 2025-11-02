
import { Card } from "@/components/ui/card";
import { Users, Clock, TrendingUp } from "lucide-react";

const TrendsCard = () => {
  return (
    <Card className="p-4 sm:p-6 backdrop-blur-xl bg-white/80 border-0 shadow-lg space-y-4 hidden lg:block">
      <h3 className="font-medium text-gray-900">Tendances actuelles</h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-primary/90 bg-primary/5 p-3 rounded-lg transform hover:scale-[1.02] transition-all cursor-default">
          <Users className="w-4 h-4" />
          <span>12 personnes consultent cette recherche</span>
        </div>
        <div className="flex items-center gap-2 text-orange-500/90 bg-orange-500/5 p-3 rounded-lg transform hover:scale-[1.02] transition-all cursor-default">
          <Clock className="w-4 h-4" />
          <span>Dernière réservation il y a 5 min</span>
        </div>
        <div className="flex items-center gap-2 text-rose-500/90 bg-rose-500/5 p-3 rounded-lg transform hover:scale-[1.02] transition-all cursor-default">
          <TrendingUp className="w-4 h-4" />
          <span>Prix en hausse pour ces dates</span>
        </div>
      </div>
    </Card>
  );
};

export default TrendsCard;
