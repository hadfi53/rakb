import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isWithinInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2,
  RotateCcw,
  Calendar,
  Clock,
  Car,
  CheckCircle,
  XCircle,
  DollarSign,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, getVehicleImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { Link } from "react-router-dom";
import { BookingStatus } from "@/types/booking";
import { Booking as BookingType } from "@/types";

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected";
  totalAmount: number;
  durationDays: number;
  pickupLocation?: string;
  returnLocation?: string;
  createdAt: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    images?: string[];
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
}

// Fonction pour transformer la structure de réservation
const transformBookingForDetails = (booking: Booking, currentUser: any): BookingType => {
  // Create a compatible BookingType object for the BookingDetails component
  return {
    id: booking.id,
    vehicle_id: booking.vehicle.id,
    renter_id: currentUser?.id || '',
    owner_id: booking.owner.id,
    start_date: booking.startDate,
    end_date: booking.endDate,
    status: booking.status as BookingStatus,
    total_price: booking.totalAmount,
    pickup_location: booking.pickupLocation || '',
    return_location: booking.returnLocation || '',
    created_at: booking.createdAt,
    updated_at: booking.createdAt,
    duration_days: booking.durationDays,
    
    // Additional properties needed by BookingDetails but not in BookingType
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalAmount: booking.totalAmount,
    pickupLocation: booking.pickupLocation || '',
    returnLocation: booking.returnLocation || '',
    
    // Vehicle info
    vehicleId: booking.vehicle.id,
    vehicleName: `${booking.vehicle.make} ${booking.vehicle.model} ${booking.vehicle.year}`,
    vehicleBrand: booking.vehicle.make,
    vehicleModel: booking.vehicle.model,
    vehicleYear: booking.vehicle.year.toString(),
    vehicleImageUrl: booking.vehicle.images?.[0] || '',
    
    // Owner info
    ownerId: booking.owner.id,
    ownerName: `${booking.owner.firstName} ${booking.owner.lastName}`,
    ownerEmail: booking.owner.email,
    ownerPhone: booking.owner.phone || '',
    
    // Renter info
    renterId: currentUser?.id || '',
    renterName: currentUser?.user_metadata?.full_name || 'Locataire',
    renterEmail: currentUser?.email || '',
    renterPhone: currentUser?.user_metadata?.phone || '',
    
    // Financial info
    dailyRate: booking.totalAmount / booking.durationDays,
    serviceFee: booking.totalAmount * 0.1, // 10% de frais de service
    depositAmount: 0,
    
    // Check-in/check-out info
    pickupChecklist: undefined,
    pickupPhotos: [],
    pickupDate: undefined,
    returnChecklist: undefined,
    returnPhotos: [],
    returnDate: undefined,
    check_in_photos: [],
    check_out_photos: [],
    checkInOutStatus: 'not_started',
    contactShared: false
  } as BookingType;
};

export default function RenterBookings() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "active" | "completed" | "cancelled">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_price,
          duration_days,
          pickup_location,
          return_location,
          created_at,
          vehicle:vehicles (
            id,
            make,
            model,
            year,
            images
          ),
          owner:profiles!bookings_owner_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('renter_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = startOfDay(new Date());
      const transformedBookings: Booking[] = data.map(booking => {
        const startDate = parseISO(booking.start_date);
        const endDate = parseISO(booking.end_date);
        const isInProgress = booking.status === 'confirmed' && 
          isWithinInterval(today, { start: startDate, end: endDate });

        return {
          id: booking.id,
          startDate: booking.start_date,
          endDate: booking.end_date,
          status: isInProgress ? 'in_progress' : booking.status,
          totalAmount: booking.total_price,
          durationDays: booking.duration_days || 0,
          pickupLocation: booking.pickup_location,
          returnLocation: booking.return_location,
          createdAt: booking.created_at,
          vehicle: {
            id: booking.vehicle.id,
            make: booking.vehicle.make,
            model: booking.vehicle.model,
            year: booking.vehicle.year,
            images: booking.vehicle.images,
          },
          owner: {
            id: booking.owner.id,
            firstName: booking.owner.first_name,
            lastName: booking.owner.last_name,
            email: booking.owner.email,
            phone: booking.owner.phone,
            avatarUrl: booking.owner.avatar_url,
          },
        };
      });

      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer les réservations. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('renter_id', user?.id);

      if (error) throw error;

      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus } 
          : booking
      ));

      toast({
        title: "Succès",
        description: "Le statut de la réservation a été mis à jour.",
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut. Veuillez réessayer.",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBookings();
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return booking.status === "in_progress" || booking.status === "confirmed";
    if (activeTab === "cancelled") return booking.status === "cancelled" || booking.status === "rejected";
    return booking.status === activeTab;
  });

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-primary/20 text-primary';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Car className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
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
      case 'rejected': return 'Refusée';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement des réservations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 mt-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Réservations</h1>
          <p className="text-muted-foreground">
            Consultez et gérez vos demandes de location
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to="/dashboard/renter">
              Retour au tableau de bord
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: typeof activeTab) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending" className="text-yellow-600">En attente</TabsTrigger>
          <TabsTrigger value="active" className="text-primary">En cours</TabsTrigger>
          <TabsTrigger value="completed" className="text-green-600">Terminées</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-red-600">Annulées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">
                  Aucune donnée à afficher pour le moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredBookings.map((booking) => (
                <Card 
                  key={booking.id}
                  className={cn(
                    "overflow-hidden transition-all hover:shadow-md cursor-pointer",
                    booking.status === "in_progress" && "border-primary/50"
                  )}
                  onClick={() => handleBookingClick(booking)}
                >
                  <CardHeader className="space-y-0">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      {/* Vehicle and Owner Info */}
                      <div className="flex items-start gap-4">
                        {booking.vehicle.images?.[0] ? (
                          <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={getVehicleImageUrl(booking.vehicle.images[0])} 
                              alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Car className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={booking.owner.avatarUrl} />
                              <AvatarFallback>
                                {booking.owner.firstName[0]}{booking.owner.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm text-muted-foreground">
                              {booking.owner.firstName} {booking.owner.lastName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status and Amount */}
                      <div className="flex flex-col items-end gap-2">
                        <div className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                          getStatusColor(booking.status)
                        )}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{getStatusText(booking.status)}</span>
                        </div>
                        <p className="text-lg font-semibold">
                          {formatCurrency(booking.totalAmount)} MAD
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Dates */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p>Du: {format(parseISO(booking.startDate), "PPP", { locale: fr })}</p>
                            <p>Au: {format(parseISO(booking.endDate), "PPP", { locale: fr })}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p>{booking.owner.email}</p>
                        </div>
                        {booking.owner.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p>{booking.owner.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Locations */}
                    {(booking.pickupLocation || booking.returnLocation) && (
                      <>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {booking.pickupLocation && (
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                              <div>
                                <p className="font-medium">Lieu de prise en charge</p>
                                <p className="text-muted-foreground">{booking.pickupLocation}</p>
                              </div>
                            </div>
                          )}
                          {booking.returnLocation && booking.returnLocation !== booking.pickupLocation && (
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                              <div>
                                <p className="font-medium">Lieu de retour</p>
                                <p className="text-muted-foreground">{booking.returnLocation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>

                  {/* Action Buttons */}
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <CardFooter className="bg-muted/50 flex flex-wrap gap-2">
                      {booking.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleStatusUpdate(booking.id, "cancelled");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      )}
                      {booking.status === "confirmed" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleStatusUpdate(booking.id, "cancelled");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      )}
                    </CardFooter>
                  )}
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
            <DialogTitle>
              Détails de la réservation
            </DialogTitle>
            <DialogDescription>
              {selectedBooking && `${selectedBooking.vehicle.make} ${selectedBooking.vehicle.model} - ${format(parseISO(selectedBooking.startDate), 'dd MMMM yyyy', { locale: fr })}`}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <BookingDetails 
              booking={transformBookingForDetails(selectedBooking, user)} 
              userRole="renter"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 