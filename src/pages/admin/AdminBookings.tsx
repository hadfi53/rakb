import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, RotateCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Booking } from "@/types/booking";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BookingPhotos } from "@/components/admin/BookingPhotos";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { adminService } from "@/lib/admin-service";

export default function AdminBookings() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Use AdminService instead of direct Supabase query to ensure proper access
      const bookingsData = await adminService.getBookings();
      
      // Format bookings for display
      const formattedBookings = bookingsData.map(booking => ({
        id: booking.id,
        booking_id: booking.booking_id,
        user_id: booking.user_id,
        host_id: booking.host_id,
        car_id: booking.car_id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        total_amount: booking.total_amount,
        status: booking.status,
        payment_status: booking.payment_status,
        created_at: booking.created_at,
        renter: {
          fullName: booking.renter_name,
          email: ''
        },
        owner: {
          fullName: booking.host_name,
          email: ''
        },
        vehicle: {
          make: booking.vehicle_name.split(' ')[0] || '',
          model: booking.vehicle_name.split(' ').slice(1).join(' ') || ''
        }
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error loading bookings",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchBookings();
      toast({
        title: "Bookings refreshed",
        description: "The bookings list has been updated",
      });
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      booking.id.toLowerCase().includes(searchLower) ||
      booking.renter.fullName.toLowerCase().includes(searchLower) ||
      booking.owner.fullName.toLowerCase().includes(searchLower)
    );
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Gestion des réservations</h1>
          <p className="text-muted-foreground">
            Consultez et gérez toutes les réservations
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="mt-4 md:mt-0"
        >
          <RotateCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Rechercher par ID, nom du locataire ou propriétaire..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Réservation #{booking.id}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>Véhicule: {booking.vehicle?.make} {booking.vehicle?.model}</p>
                    <p>Locataire: {booking.renter.fullName} ({booking.renter.email})</p>
                    <p>Propriétaire: {booking.owner.fullName} ({booking.owner.email})</p>
                    <p>Du {format(new Date(booking.startDate), 'dd MMM yyyy', { locale: fr })}</p>
                    <p>Au {format(new Date(booking.endDate), 'dd MMM yyyy', { locale: fr })}</p>
                    <p>Statut: {booking.status}</p>
                    <p>Montant total: {formatCurrency(booking.totalAmount)}</p>
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <BookingPhotos bookingId={booking.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 