import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Car, 
  Calendar, 
  DollarSign, 
  Bell, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  RotateCcw,
  User,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Eye
} from "lucide-react";
import { BookingRequestsManager } from "@/components/dashboard/BookingRequestsManager";
import { toast } from "sonner";
import * as bookingsBackend from "@/lib/backend/bookings";
import { CheckInOutButtons } from "@/components/dashboard/CheckInOutButtons";
import { format, parseISO } from "date-fns";
import { formatCurrency, getVehicleImageUrl, cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { Booking, Vehicle, UserProfile } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  const handleRejectBookingClick = (booking: OwnerBooking) => {
    setSelectedBooking(booking);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const handleRejectBooking = async (): Promise<void> => {
    if (!user || !selectedBooking) return;
    
    setIsRejecting(true);
    try {
      await bookingsBackend.rejectBookingRequest(selectedBooking.id, user.id, rejectReason);
      toast.success("Réservation refusée");
      setIsRejectDialogOpen(false);
      setSelectedBooking(null);
      setRejectReason("");
      await getOwnerBookings();
    } catch (error) {
      console.error("Erreur lors du refus de la réservation:", error);
      toast.error("Erreur lors du refus de la réservation");
    } finally {
      setIsRejecting(false);
    }
  };

  const calculateTotalRevenue = () => {
    const confirmedRevenue = confirmedBookings.reduce((total: number, booking: OwnerBooking) => 
      total + booking.totalAmount, 0);
    const completedRevenue = completedBookings.reduce((total: number, booking: OwnerBooking) => 
      total + booking.totalAmount, 0);
    return confirmedRevenue + completedRevenue;
  };

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [selectedBooking, setSelectedBooking] = useState<OwnerBooking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const filteredBookings = useMemo(() => {
    if (activeTab === "all") return bookings;
    if (activeTab === "confirmed") return confirmedBookings;
    if (activeTab === "completed") return completedBookings;
    if (activeTab === "cancelled") return cancelledBookings;
    return pendingBookings;
  }, [activeTab, bookings, pendingBookings, confirmedBookings, completedBookings, cancelledBookings]);

  const handleBookingClick = (booking: OwnerBooking) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const transformBookingForDetails = (booking: OwnerBooking) => {
    const durationDays = booking.durationDays || Math.ceil(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) || 1;

    return {
      id: booking.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      totalAmount: booking.totalAmount || 0,
      pickupLocation: '',
      returnLocation: '',
      vehicleId: booking.vehicleId,
      vehicleName: booking.vehicle 
        ? `${booking.vehicle.make || ''} ${booking.vehicle.model || ''} ${booking.vehicle.year || ''}`.trim()
        : 'Véhicule non spécifié',
      vehicleBrand: booking.vehicle?.make || '',
      vehicleModel: booking.vehicle?.model || '',
      vehicleYear: booking.vehicle?.year?.toString() || '',
      vehicleImageUrl: booking.vehicle?.images?.[0] || '',
      renterId: booking.renterId,
      renterName: booking.renter 
        ? `${booking.renter.firstName || ''} ${booking.renter.lastName || ''}`.trim() || 'Non renseigné'
        : 'Non renseigné',
      renterEmail: booking.renter?.email || '',
      renterPhone: booking.renter?.phone || '',
      renterAvatarUrl: booking.renter?.avatarUrl || '',
      ownerId: booking.ownerId,
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      dailyRate: durationDays > 0 ? (booking.totalAmount || 0) / durationDays : 0,
      durationDays: durationDays,
      serviceFee: (booking.totalAmount || 0) * 0.1,
      depositAmount: 0,
      createdAt: booking.createdAt,
      updatedAt: booking.createdAt,
      pickupChecklist: undefined,
      pickupPhotos: [],
      pickupDate: undefined,
      returnChecklist: undefined,
      returnPhotos: [],
      returnDate: undefined,
      check_in_photos: [],
      check_out_photos: [],
      checkInOutStatus: booking.checkInOutStatus === 'checked-in' ? 'check_in_completed' as const :
                       booking.checkInOutStatus === 'checked-out' ? 'check_out_completed' as const :
                       'not_started' as const,
      contactShared: false
    };
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Car className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-6 px-4 mt-20">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 mt-20 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Réservations</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et suivez toutes vos réservations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <RotateCcw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Actualiser
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalRevenue())}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {confirmedBookings.length + completedBookings.length} réservation{confirmedBookings.length + completedBookings.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Action requise</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{confirmedBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Réservations actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Réservations complétées</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: typeof activeTab) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">
            En attente
        {pendingBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingBookings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmées
            {confirmedBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">{confirmedBookings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées
            {completedBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">{completedBookings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulées
            {cancelledBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">{cancelledBookings.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Aucune réservation trouvée</h3>
                <p className="text-muted-foreground max-w-sm">
                  {activeTab === "all" 
                    ? "Vous n'avez aucune réservation pour le moment."
                    : `Vous n'avez pas de réservation ${
                        activeTab === "pending" ? "en attente" :
                        activeTab === "confirmed" ? "confirmée" :
                        activeTab === "completed" ? "terminée" :
                        "annulée"
                      } pour le moment.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredBookings.map((booking) => (
                <Card 
                  key={booking.id}
                  className={cn(
                    "overflow-hidden transition-all hover:shadow-lg cursor-pointer border-l-4",
                    booking.status === "pending" && "border-l-yellow-500",
                    booking.status === "confirmed" && "border-l-blue-500",
                    booking.status === "in_progress" && "border-l-primary",
                    booking.status === "completed" && "border-l-green-500",
                    booking.status === "cancelled" && "border-l-red-500"
                  )}
                  onClick={() => handleBookingClick(booking)}
                >
                  <CardHeader className="space-y-0 pb-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Vehicle Image */}
                      {booking.vehicle?.images?.[0] ? (
                        <div className="h-32 w-full md:w-48 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={getVehicleImageUrl(booking.vehicle.images[0])} 
                            alt={`${booking.vehicle?.make || ''} ${booking.vehicle?.model || ''}`}
                            className="h-full w-full object-cover"
            />
          </div>
                      ) : (
                        <div className="h-32 w-full md:w-48 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Car className="h-12 w-12 text-muted-foreground" />
                        </div>
        )}

                      {/* Booking Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col md:flex-row justify-between gap-2">
          <div>
                            <CardTitle className="text-xl mb-1">
                              {booking.vehicle?.year || ''} {booking.vehicle?.make || ''} {booking.vehicle?.model || ''}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={booking.renter?.avatarUrl} />
                                <AvatarFallback className="text-xs">
                                  {booking.renter?.firstName?.[0] || 'N'}{booking.renter?.lastName?.[0] || 'R'}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm text-muted-foreground">
                                {booking.renter?.firstName || 'Non'} {booking.renter?.lastName || 'renseigné'}
                              </p>
                      </div>
                    </div>

                          <div className="flex flex-col items-start md:items-end gap-2">
                            <Badge className={cn("inline-flex items-center gap-1", getStatusColor(booking.status))}>
                              {getStatusIcon(booking.status)}
                              <span>{getStatusText(booking.status)}</span>
                            </Badge>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(booking.totalAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.durationDays || 1} jour{(booking.durationDays || 1) > 1 ? 's' : ''}
                            </p>
                    </div>
                  </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Dates */}
                          <div className="flex items-start gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Période de location</p>
                              <p className="text-muted-foreground">
                                {format(parseISO(booking.startDate), "dd MMM yyyy", { locale: fr })} - {format(parseISO(booking.endDate), "dd MMM yyyy", { locale: fr })}
                              </p>
            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1">
                            {booking.renter?.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <p className="truncate">{booking.renter.email}</p>
                              </div>
                            )}
                            {booking.renter?.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <p>{booking.renter.phone}</p>
          </div>
        )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Action Buttons */}
                    {booking.status === "pending" && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptBooking(booking);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accepter
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectBookingClick(booking);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Refuser
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                      </div>
                    )}

                    {(booking.status === "confirmed" || booking.status === "in_progress") && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <CheckInOutButtons booking={booking} role="owner" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                      </div>
                    )}

                    {booking.status === "completed" && (
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </Button>
                  </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                selectedBooking.vehicle 
                  ? `${selectedBooking.vehicle.make || ''} ${selectedBooking.vehicle.model || ''} - ${format(parseISO(selectedBooking.startDate), 'dd MMMM yyyy', { locale: fr })}`.trim()
                  : format(parseISO(selectedBooking.startDate), 'dd MMMM yyyy', { locale: fr })
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && user && (
            <BookingDetails 
              booking={transformBookingForDetails(selectedBooking)} 
              userRole="owner"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Booking Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir refuser cette réservation ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedBooking && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {selectedBooking.vehicle?.make} {selectedBooking.vehicle?.model}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span>
                  {selectedBooking.renter?.firstName} {selectedBooking.renter?.lastName}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span>
                  Du {format(parseISO(selectedBooking.startDate), 'dd MMM yyyy', { locale: fr })} au {format(parseISO(selectedBooking.endDate), 'dd MMM yyyy', { locale: fr })}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Raison du refus (optionnel)</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Expliquez pourquoi vous refusez cette réservation..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
            </div>
          </div>
        )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectBooking}
              disabled={isRejecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRejecting ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin mr-2" />
                  Traitement...
                </>
              ) : (
                "Refuser"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 