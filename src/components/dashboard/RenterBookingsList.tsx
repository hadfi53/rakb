import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRenterBookings, RenterBooking } from '@/hooks/use-renter-bookings';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { getVehicleImageUrl } from '@/lib/utils';
import {
  Car,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  User,
  AlertCircle
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmée', color: 'bg-green-500' },
  in_progress: { label: 'En cours', color: 'bg-blue-500' },
  completed: { label: 'Terminée', color: 'bg-gray-500' },
  cancelled: { label: 'Annulée', color: 'bg-red-500' },
  rejected: { label: 'Refusée', color: 'bg-red-700' }
};

interface RenterBookingsListProps {
  filter?: (booking: RenterBooking) => boolean;
}

export const RenterBookingsList = ({ filter }: RenterBookingsListProps) => {
  const { bookings, isLoading, error } = useRenterBookings();
  const navigate = useNavigate();

  // Apply filter if provided
  const filteredBookings = filter ? bookings.filter(filter) : bookings;

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p>Une erreur est survenue lors du chargement des réservations.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Aucune réservation
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {filter ? "Aucune réservation ne correspond aux critères sélectionnés." : "Vous n'avez pas encore effectué de réservation."}
        </p>
        {!filter && (
          <Button
            onClick={() => navigate('/cars')}
            className="mt-6"
          >
            Explorer les véhicules
          </Button>
        )}
      </div>
    );
  }

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {filteredBookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Vehicle Image */}
              <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={getVehicleImageUrl(booking.vehicle?.images?.[0] || booking.vehicle?.image_url)}
                  alt={`${booking.vehicle?.make} ${booking.vehicle?.model}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>

              {/* Booking Details */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {booking.vehicle?.make} {booking.vehicle?.model} {booking.vehicle?.year}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`${statusConfig[booking.status].color} text-white mt-2`}
                    >
                      {statusConfig[booking.status].label}
                    </Badge>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatPrice(booking.total_price)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{booking.duration_days} jours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {booking.owner?.first_name} {booking.owner?.last_name}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  >
                    Voir les détails
                  </Button>
                  {booking.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {/* Handle cancellation */}}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 