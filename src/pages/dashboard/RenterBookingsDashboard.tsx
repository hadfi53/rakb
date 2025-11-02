import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RotateCcw,
  Car,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getRenterBookings, updateBookingStatus } from "@/lib/backend/bookings";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingStatusLabels, BookingStatusColors, BookingStatus } from "@/types/booking";
import { Booking } from "@/types/booking";
import { CheckInOutButtons } from "@/components/dashboard/CheckInOutButtons";
import { formatCurrency, getVehicleImageUrl } from "@/lib/utils";

interface RenterBooking {
  id: string;
  vehicleId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalAmount: number;
  durationDays: number;
  createdAt: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
}

export default function RenterBookingsDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<RenterBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { bookings: bookingsData, error } = await getRenterBookings(user.id);
      
      if (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Une erreur est survenue lors de la récupération de vos réservations');
        return;
      }
      
      // Calculer durationDays pour chaque réservation
      const calculateDurationDays = (startDate: string, endDate: string): number => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
      };
      
      // Convertir Booking vers RenterBooking
      const formattedBookings: RenterBooking[] = (bookingsData || []).map(booking => ({
        id: booking.id,
        vehicleId: booking.vehicle_id,
        renterId: booking.renter_id,
        ownerId: booking.owner_id,
        startDate: booking.start_date || '',
        endDate: booking.end_date || '',
        status: booking.status,
        totalAmount: booking.total_price || 0,
        durationDays: calculateDurationDays(booking.start_date || '', booking.end_date || ''),
        createdAt: booking.created_at,
        vehicle: booking.vehicle ? {
          id: booking.vehicle.id,
          make: booking.vehicle.make || booking.vehicle.brand || '',
          model: booking.vehicle.model || '',
          year: booking.vehicle.year || 2023,
          images: (booking.vehicle.images || []).filter(img => {
            if (!img || typeof img !== 'string') return false;
            const trimmed = img.trim();
            return trimmed !== '' && 
                   trimmed !== 'bookings' && 
                   trimmed !== 'vehicles' &&
                   (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('.'));
          })
        } : undefined,
        owner: booking.owner ? {
          id: booking.owner.id || '',
          firstName: booking.owner.first_name || '',
          lastName: booking.owner.last_name || '',
          email: booking.owner.email || '',
          avatar: booking.owner.avatar_url,
          phone: booking.owner.phone || ''
        } : {
          id: booking.owner_id || '',
          firstName: 'Propriétaire',
          lastName: '',
          email: '',
          avatar: undefined,
          phone: undefined
        }
      }));

      setBookings(formattedBookings);
      
      // Compter les réservations par statut
      setPendingCount(formattedBookings.filter(b => b.status === 'pending').length);
      setConfirmedCount(formattedBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length);
      setCompletedCount(formattedBookings.filter(b => b.status === 'completed').length);
      setCancelledCount(formattedBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length);
      
    } catch (error) {
      console.error('Exception lors de la récupération des réservations:', error);
      toast.error('Une erreur est survenue lors de la récupération de vos réservations');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
      return;
    }

    if (user) {
      fetchBookings();
    }
  }, [user, authLoading, navigate, fetchBookings]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchBookings();
      toast.success("Réservations mises à jour");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des réservations:", error);
      toast.error("Erreur lors du rafraîchissement des réservations");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!user) return;
    
    try {
      const { booking, error } = await updateBookingStatus(bookingId, 'cancelled', user.id);
      if (error) {
        throw error;
      }
      toast.success('Réservation annulée avec succès');
      fetchBookings();
    } catch (error) {
      console.error('Exception lors de l\'annulation de la réservation:', error);
      toast.error('Une erreur est survenue lors de l\'annulation de la réservation');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: fr });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(price);
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes réservations</h1>
          <p className="text-muted-foreground">
            Consultez et gérez vos demandes de location
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-4">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Actualiser
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/renter">
              Retour au tableau de bord
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className={pendingCount > 0 ? "border-yellow-300 bg-yellow-50" : ""}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className={`${pendingCount > 0 ? "bg-yellow-500/20" : "bg-yellow-500/10"} p-3 rounded-full`}>
                  <Clock className={`h-6 w-6 ${pendingCount > 0 ? "text-yellow-600" : "text-yellow-500"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">En attente</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    {pendingCount > 0 && (
                      <Badge className="ml-2 bg-yellow-200 text-yellow-800 hover:bg-yellow-300">
                        En cours de traitement
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="bg-green-500/10 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Confirmées</p>
                  <p className="text-2xl font-bold">{confirmedCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Terminées</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className="bg-red-500/10 p-3 rounded-full">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Annulées/Refusées</p>
                  <p className="text-2xl font-bold">{cancelledCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">Aucune réservation</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Vous n'avez pas encore effectué de réservation. Parcourez notre catalogue de véhicules pour trouver celui qui vous convient.
            </p>
            <Button asChild>
              <Link to="/">Rechercher un véhicule</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-l-4" 
              style={{ 
                borderLeftColor: booking.status === 'pending' ? '#f59e0b' : 
                               booking.status === 'confirmed' ? '#10b981' : 
                               booking.status === 'in_progress' ? '#3b82f6' : 
                               booking.status === 'completed' ? '#6b7280' : 
                               '#ef4444' 
              }}
            >
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/4 h-48 md:h-auto bg-gray-100 relative">
                  {booking.vehicle?.images && booking.vehicle.images.length > 0 ? (
                    <img 
                      src={getVehicleImageUrl(booking.vehicle.images[0])} 
                      alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Car className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={BookingStatusColors[booking.status]}>
                      {BookingStatusLabels[booking.status]}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6 flex-1">
                  <div className="flex flex-col md:flex-row justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {booking.vehicle?.make} {booking.vehicle?.model} {booking.vehicle?.year}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Propriétaire: {booking.owner?.firstName} {booking.owner?.lastName}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <p className="text-2xl font-bold text-primary">{formatPrice(booking.totalAmount)}</p>
                      <p className="text-sm text-gray-500">pour {booking.durationDays} jour{booking.durationDays > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="font-medium mb-2">Période de location</p>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <p className="text-sm">Début: <span className="font-medium">{formatDate(booking.startDate)}</span></p>
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <p className="text-sm">Fin: <span className="font-medium">{formatDate(booking.endDate)}</span></p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Statut de la réservation</p>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                        {booking.status === 'pending' && (
                          <div className="flex items-start">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">En attente de confirmation</p>
                              <p className="text-xs text-yellow-700">Le propriétaire doit accepter votre demande</p>
                            </div>
                          </div>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <div className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-800">Réservation confirmée</p>
                              <p className="text-xs text-green-700">Votre réservation a été acceptée</p>
                            </div>
                          </div>
                        )}
                        
                        {booking.status === 'rejected' && (
                          <div className="flex items-start">
                            <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Réservation refusée</p>
                              <p className="text-xs text-red-700">Le propriétaire a refusé votre demande</p>
                            </div>
                          </div>
                        )}
                        
                        {booking.status === 'cancelled' && (
                          <div className="flex items-start">
                            <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Réservation annulée</p>
                              <p className="text-xs text-red-700">Vous avez annulé cette réservation</p>
                            </div>
                          </div>
                        )}
                        
                        {booking.status === 'completed' && (
                          <div className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-800">Location terminée</p>
                              <p className="text-xs text-blue-700">Cette location est terminée</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Demande effectuée le {format(new Date(booking.createdAt), 'PPP', { locale: fr })}</span>
                  </div>
                  
                  <div className="flex justify-end">
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <Button 
                        variant="outline" 
                        className="border-red-500 text-red-500 hover:bg-red-50"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Annuler la réservation
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline"
                      className="ml-2"
                      asChild
                    >
                      <Link to={`/bookings/${booking.id}`}>
                        Voir les détails
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {/* Réservations en cours */}
        {bookings.filter(b => b.status === 'in_progress').length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Réservations en cours</h2>
            <div className="grid gap-4">
              {bookings
                .filter(b => b.status === 'in_progress')
                .map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">
                            {booking.vehicle?.make} {booking.vehicle?.model}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-500">
                            <p>Du {format(new Date(booking.startDate), 'PPP', { locale: fr })}</p>
                            <p>Au {format(new Date(booking.endDate), 'PPP', { locale: fr })}</p>
                            <p>Montant total: {formatCurrency(booking.totalAmount)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <CheckInOutButtons booking={booking} role="renter" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Réservations à venir */}
        {bookings.filter(b => b.status === 'confirmed').length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Réservations à venir</h2>
            <div className="grid gap-4">
              {bookings
                .filter(b => b.status === 'confirmed')
                .map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">
                            {booking.vehicle?.make} {booking.vehicle?.model}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-500">
                            <p>Du {format(new Date(booking.startDate), 'PPP', { locale: fr })}</p>
                            <p>Au {format(new Date(booking.endDate), 'PPP', { locale: fr })}</p>
                            <p>Montant total: {formatCurrency(booking.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Réservations terminées */}
        {bookings.filter(b => b.status === 'completed').length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Réservations terminées</h2>
            <div className="grid gap-4">
              {bookings
                .filter(b => b.status === 'completed')
                .map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">
                            {booking.vehicle?.make} {booking.vehicle?.model}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-500">
                            <p>Du {format(new Date(booking.startDate), 'PPP', { locale: fr })}</p>
                            <p>Au {format(new Date(booking.endDate), 'PPP', { locale: fr })}</p>
                            <p>Montant total: {formatCurrency(booking.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 