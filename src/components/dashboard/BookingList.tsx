import { OwnerBooking } from "@/hooks/use-owner-bookings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Car, User, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface BookingListProps {
  bookings: OwnerBooking[];
  type: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  onAcceptBooking?: (booking: OwnerBooking) => Promise<void>;
  onRejectBooking?: (booking: OwnerBooking, reason: string) => Promise<void>;
  loading: boolean;
  onRefresh: () => void;
}

export function BookingList({
  bookings,
  type,
  onAcceptBooking,
  onRejectBooking,
  loading,
  onRefresh
}: BookingListProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
    }).format(price);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          {type === 'pending' && <Clock className="h-6 w-6 text-gray-400" />}
          {type === 'confirmed' && <CheckCircle className="h-6 w-6 text-gray-400" />}
          {type === 'completed' && <CheckCircle className="h-6 w-6 text-gray-400" />}
          {type === 'cancelled' && <XCircle className="h-6 w-6 text-gray-400" />}
        </div>
        <h3 className="text-lg font-medium mb-1">Aucune réservation {type === 'pending' ? 'en attente' : type === 'confirmed' ? 'confirmée' : type === 'completed' ? 'terminée' : 'annulée'}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden border-l-4" 
          style={{ 
            borderLeftColor: 
              type === 'pending' ? '#f59e0b' : 
              type === 'confirmed' ? '#10b981' : 
              type === 'completed' ? '#6b7280' : 
              '#ef4444' 
          }}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {booking.vehicle?.make} {booking.vehicle?.model} {booking.vehicle?.year}
                </h3>
                <div className="flex items-center mt-2">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={booking.renter?.avatar} />
                    <AvatarFallback>
                      {booking.renter ? getInitials(booking.renter.firstName, booking.renter.lastName) : 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{booking.renter?.firstName} {booking.renter?.lastName}</p>
                    <p className="text-sm text-gray-500">{booking.renter?.email}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{formatPrice(booking.totalAmount)}</p>
                <p className="text-sm text-gray-500">
                  pour {booking.durationDays} jour{booking.durationDays > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm">Du {formatDate(booking.startDate)}</p>
                  <p className="text-sm">Au {formatDate(booking.endDate)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-500" />
                <p className="text-sm">
                  Demande reçue le {format(new Date(booking.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            </div>

            {type === 'pending' && onAcceptBooking && onRejectBooking && (
              <div className="mt-4 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  className="border-red-500 text-red-500 hover:bg-red-50"
                  onClick={() => onRejectBooking(booking, '')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Refuser
                </Button>
                <Button 
                  variant="default"
                  onClick={() => onAcceptBooking(booking)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accepter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 