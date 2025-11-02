import { useState } from "react";
import { CalendarIcon, Clock, Shield, Star, Users, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Vehicle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ReservationCardProps {
  vehicle: Vehicle;
  onReserve: () => void;
}

const ReservationCard = ({ vehicle, onReserve }: ReservationCardProps) => {
  return (
    <Card className="border-2 hover:border-primary/40 transition-all duration-300">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-primary">
              {(vehicle.price_per_day ?? vehicle.price ?? 0)} Dh <span className="text-sm font-normal text-gray-600">/jour</span>
            </div>
            <div className="flex items-center mt-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium">
                {vehicle.rating ? vehicle.rating.toFixed(1) : "0.0"}
              </span>
              {(vehicle as any).bookings_count !== undefined && (vehicle as any).bookings_count > 0 && (
                <>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-gray-600">{(vehicle as any).bookings_count} voyage{(vehicle as any).bookings_count > 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Disponible
          </Badge>
        </div>

        <div className="flex flex-col space-y-3 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center text-gray-700">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            <span>{vehicle.location || "Casablanca, Maroc"}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Users className="w-4 h-4 mr-2 text-primary" />
            <span>{vehicle.seats || "5"} places</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock className="w-4 h-4 mr-2 text-primary" />
            <span>Confirmation instantanée</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Annulation gratuite jusqu'à 24h avant
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Assurance tous risques incluse
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Assistance 24/7
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium h-12 text-lg"
            onClick={onReserve}
          >
            <CalendarIcon className="w-5 h-5 mr-2" />
            Réserver maintenant
          </Button>
          
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Shield className="w-4 h-4 mr-2 text-primary" />
            Paiement 100% sécurisé
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationCard;
