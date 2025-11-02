import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Car, 
  Calendar, 
  DollarSign, 
  Bell, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { BookingRequestsManager } from "@/components/dashboard/BookingRequestsManager";
import { toast } from "sonner";
import * as bookingsBackend from "@/lib/backend/bookings";
import { CheckInOutButtons } from "@/components/dashboard/CheckInOutButtons";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { Booking, Vehicle, UserProfile } from "@/types";

// Convert OwnerBooking to Booking type
const convertToBooking = (ownerBooking: OwnerBooking): Booking => {
  // Create a vehicle object that matches the Vehicle type
  const vehicle = ownerBooking.vehicle ? {
    id: ownerBooking.vehicle.id,
    owner_id: ownerBooking.ownerId,
    make: ownerBooking.vehicle.make,
    model: ownerBooking.vehicle.model,
    year: ownerBooking.vehicle.year,
    price_per_day: ownerBooking.totalAmount / ownerBooking.durationDays,
    location: '',
    images: ownerBooking.vehicle.images,
    status: 'available' as const,
    created_at: ownerBooking.createdAt,
    updated_at: ownerBooking.createdAt
  } : undefined;

  // Create a renter object that matches the UserProfile type
  const renter = ownerBooking.renter ? {
    id: ownerBooking.renter.id,
    first_name: ownerBooking.renter.firstName,
    last_name: ownerBooking.renter.lastName,
    email: ownerBooking.renter.email,
    phone: ownerBooking.renter.phone || '',
    role: 'renter' as const,
    notification_preferences: {
      email: true,
      push: true
    }
  } : undefined;

  // Return the Booking object
  return {
    id: ownerBooking.id,
    vehicleId: ownerBooking.vehicleId,
    renterId: ownerBooking.renterId,
    ownerId: ownerBooking.ownerId,
    status: ownerBooking.status,
    startDate: ownerBooking.startDate,
    endDate: ownerBooking.endDate,
    pickupLocation: '',
    returnLocation: '',
    dailyRate: ownerBooking.totalAmount / ownerBooking.durationDays,
    serviceFee: 0,
    totalAmount: ownerBooking.totalAmount,
    vehicle,
    renter,
    owner: undefined,
    vehicleName: ownerBooking.vehicle ? `${ownerBooking.vehicle.make} ${ownerBooking.vehicle.model}` : '',
    vehicleBrand: ownerBooking.vehicle?.make || '',
    vehicleModel: ownerBooking.vehicle?.model || '',
    vehicleYear: ownerBooking.vehicle?.year?.toString() || '',
    vehicleImageUrl: ownerBooking.vehicle?.images?.[0],
    renterName: ownerBooking.renter ? `${ownerBooking.renter.firstName} ${ownerBooking.renter.lastName}` : '',
    renterEmail: ownerBooking.renter?.email || '',
    renterPhone: ownerBooking.renter?.phone,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    durationDays: ownerBooking.durationDays,
    depositAmount: 0,
    createdAt: ownerBooking.createdAt,
    updatedAt: ownerBooking.createdAt,
    check_in_photos: [],
    check_out_photos: [],
    checkInOutStatus: ownerBooking.checkInOutStatus === 'checked-in' ? 'check_in_completed' as const :
                     ownerBooking.checkInOutStatus === 'checked-out' ? 'check_out_completed' as const :
                     'not_started' as const
  };
};

interface OwnerBooking {
  id: string;
  vehicleId: string;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: Booking['status'];
  totalAmount: number;
  createdAt: string;
  durationDays: number;
  checkInOutStatus: 'checked-in' | 'checked-out' | null;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
  renter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  };
}

export default function OwnerBookingsDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getOwnerBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { bookings: bookingsData, error: bookingsError } = await bookingsBackend.getOwnerBookings(user.id);
      
      if (bookingsError) {
        console.error('Error fetching owner bookings:', bookingsError);
        throw bookingsError;
      }
      
      const formattedBookings: OwnerBooking[] = (bookingsData || []).map(booking => {
        // Calculate duration days from dates
        const start = new Date(booking.start_date || booking.startDate || '');
        const end = new Date(booking.end_date || booking.endDate || '');
        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 0;
        
        // Handle JSONB images from car
        let carImages: string[] = [];
        if (booking.vehicle?.images) {
          if (Array.isArray(booking.vehicle.images)) {
            carImages = booking.vehicle.images;
          } else if (typeof booking.vehicle.images === 'string') {
            try {
              carImages = JSON.parse(booking.vehicle.images);
            } catch {
              carImages = [];
            }
          }
        }
        
        return {
          id: booking.id,
          vehicleId: booking.vehicle_id || booking.car_id || '',
          renterId: booking.renter_id || booking.user_id || '',
          ownerId: booking.owner_id || booking.host_id || user.id,
          startDate: booking.start_date || booking.startDate || '',
          endDate: booking.end_date || booking.endDate || '',
          status: booking.status,
          totalAmount: booking.total_price || booking.totalAmount || 0,
          createdAt: booking.created_at,
          durationDays: durationDays,
          checkInOutStatus: null,
          vehicle: booking.vehicle ? {
            id: booking.vehicle.id,
            make: booking.vehicle.brand || booking.vehicle.make,
            model: booking.vehicle.model,
            year: booking.vehicle.year || 2023,
            images: carImages
          } : undefined,
          renter: booking.renter ? {
            id: booking.renter.id || '',
            firstName: booking.renter.first_name || '',
            lastName: booking.renter.last_name || '',
            email: booking.renter.email || '',
            avatarUrl: booking.renter.avatar_url,
            phone: booking.renter.phone_number || booking.renter.phone
          } : undefined
        };
      });
      
      setBookings(formattedBookings);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors du chargement');
      setError(error);
      toast.error('Impossible de charger vos réservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getOwnerBookings();
    }
  }, [user]);

  // Filtrer les réservations par statut
  const pendingBookings = useMemo(() => 
    bookings.filter((booking: OwnerBooking) => booking.status === 'pending'), 
    [bookings]
  );

  const confirmedBookings = useMemo(() => 
    bookings.filter((booking: OwnerBooking) => booking.status === 'confirmed'), 
    [bookings]
  );

  const completedBookings = useMemo(() => 
    bookings.filter((booking: OwnerBooking) => booking.status === 'completed'), 
    [bookings]
  );

  const cancelledBookings = useMemo(() => 
    bookings.filter((booking: OwnerBooking) => booking.status === 'cancelled'), 
    [bookings]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime < 2000) {
      return;
    }

    try {
      setIsRefreshing(true);
      setLastRefreshTime(now);
      await getOwnerBookings();
      toast.success("Réservations mises à jour");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des réservations:", error);
      toast.error("Erreur lors du rafraîchissement des réservations");
    } finally {
      setIsRefreshing(false);
    }
  }, [getOwnerBookings, lastRefreshTime]);

  const handleAcceptBooking = async (booking: OwnerBooking): Promise<void> => {
    if (!user) return;
    
    try {
      await bookingsBackend.acceptBookingRequest(booking.id, user.id);
      toast.success("Réservation acceptée");
      await getOwnerBookings();
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la réservation:", error);
      toast.error("Erreur lors de l'acceptation de la réservation");
    }
  };

  const handleRejectBooking = async (booking: OwnerBooking, reason: string): Promise<void> => {
    if (!user) return;
    
    try {
      await bookingsBackend.rejectBookingRequest(booking.id, user.id, reason);
      toast.success("Réservation refusée");
      await getOwnerBookings();
    } catch (error) {
      console.error("Erreur lors du refus de la réservation:", error);
      toast.error("Erreur lors du refus de la réservation");
    }
  };

  const calculateTotalRevenue = () => {
    const confirmedRevenue = confirmedBookings.reduce((total: number, booking: OwnerBooking) => 
      total + booking.totalAmount, 0);
    const completedRevenue = completedBookings.reduce((total: number, booking: OwnerBooking) => 
      total + booking.totalAmount, 0);
    return confirmedRevenue + completedRevenue;
  };


  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-4 mt-16">
        <Skeleton className="h-12 w-64 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 mt-16">
      <div className="grid gap-4">
        {/* Réservations en attente */}
        {pendingBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Réservations en attente</h2>
            <BookingRequestsManager
              pendingBookings={pendingBookings}
              confirmedBookings={confirmedBookings}
              completedBookings={completedBookings}
              cancelledBookings={cancelledBookings}
              onAcceptBooking={handleAcceptBooking}
              onRejectBooking={handleRejectBooking}
              loading={loading}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {/* Réservations confirmées */}
        {confirmedBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Réservations confirmées</h2>
            <div className="grid gap-2">
              {confirmedBookings.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>Locataire: {booking.renter?.firstName} {booking.renter?.lastName}</p>
                        <p>Du {format(new Date(booking.startDate), 'dd MMM yyyy', { locale: fr })}</p>
                        <p>Au {format(new Date(booking.endDate), 'dd MMM yyyy', { locale: fr })}</p>
                        <p>Total: {formatCurrency(booking.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <CheckInOutButtons booking={booking} role="owner" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Réservations terminées */}
        {cancelledBookings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Réservations terminées</h2>
            <div className="grid gap-2">
              {cancelledBookings.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>Locataire: {booking.renter?.firstName} {booking.renter?.lastName}</p>
                        <p>Du {format(new Date(booking.startDate), 'dd MMM yyyy', { locale: fr })}</p>
                        <p>Au {format(new Date(booking.endDate), 'dd MMM yyyy', { locale: fr })}</p>
                        <p>Total: {formatCurrency(booking.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 