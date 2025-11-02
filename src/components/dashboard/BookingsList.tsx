import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Booking, BookingStatus } from "@/types/booking";
import { BookingStatusLabels, BookingStatusColors } from "@/types/booking";
import { Calendar, MapPin, User, Plus } from "lucide-react";

const BookingsList = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'owner' | 'renter' | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      const role = await getUserRole();
      setUserRole(role);
    };
    checkUserRole();
  }, [user]);

  const renderBookingCard = (booking: Booking) => {
    return (
      <Card key={booking.id} className="hover:shadow-md transition-shadow overflow-hidden">
        {booking.vehicleImageUrl && (
          <div className="relative h-40 w-full">
            <img 
              src={booking.vehicleImageUrl} 
              alt={booking.vehicleName} 
              className="h-full w-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge className={BookingStatusColors[booking.status]}>
                {BookingStatusLabels[booking.status]}
              </Badge>
            </div>
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">
                {booking.vehicleName || `${booking.vehicleBrand} ${booking.vehicleModel} ${booking.vehicleYear}`}
              </h3>
              {!booking.vehicleImageUrl && (
                <Badge className={BookingStatusColors[booking.status]}>
                  {BookingStatusLabels[booking.status]}
                </Badge>
              )}
            </div>
            <div className="text-lg font-bold text-primary">
              {booking.totalAmount} Dh
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Du {new Date(booking.startDate).toLocaleDateString('fr-FR')} au {new Date(booking.endDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{booking.pickupLocation}</span>
            </div>
            {userRole === 'owner' ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{booking.renterName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{booking.ownerName}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            {userRole === 'owner' && booking.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBookingAction(booking.id, 'reject')}
                >
                  Refuser
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleBookingAction(booking.id, 'confirm')}
                >
                  Accepter
                </Button>
              </>
            )}
            {userRole === 'renter' && (booking.status === 'pending' || booking.status === 'confirmed') && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleBookingAction(booking.id, 'cancel')}
              >
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {userRole === 'owner' && (
        <div className="flex justify-end mb-4">
          <Link to="/cars/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un véhicule
            </Button>
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map(renderBookingCard)}
      </div>
    </div>
  );
};

export default BookingsList; 