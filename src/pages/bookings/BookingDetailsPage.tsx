import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import { BookingDetails } from "@/components/booking/BookingDetails";
import { Booking } from "@/types";
import { getBookingById, updateBookingStatus } from "@/lib/backend/bookings";
import { supabase } from "@/lib/supabase";

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'renter' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!user || !id) return;

      try {
        setIsLoading(true);

        // Récupérer les détails de la réservation depuis Supabase avec toutes les données
        const { data: rawData, error: rawError } = await supabase
          .from('bookings')
          .select(`
            *,
            car:cars(*),
            renter:profiles!user_id(*),
            host:profiles!host_id(*),
            vehicle:cars(*),
            owner:profiles!host_id(*)
          `)
          .eq('id', id)
          .single();

        if (rawError || !rawData) {
          toast({
            title: "Réservation introuvable",
            description: "La réservation que vous recherchez n'existe pas.",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }

        // Déterminer renter_id et owner_id selon le schéma
        const renterId = rawData.user_id || rawData.renter_id;
        const ownerId = rawData.host_id || rawData.owner_id;

        // Vérifier que l'utilisateur est autorisé à voir cette réservation
        if (renterId !== user.id && ownerId !== user.id) {
          toast({
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à voir cette réservation.",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }

        // Déterminer le rôle de l'utilisateur
        const role = renterId === user.id ? 'renter' : 'owner';
        setUserRole(role);

        // Obtenir les données du véhicule
        const car = rawData.car || rawData.vehicle;
        const host = rawData.host || rawData.owner;
        const renter = rawData.renter;

        // Gérer les images du véhicule
        let carImages: string[] = [];
        if (car?.images) {
          if (Array.isArray(car.images)) {
            carImages = car.images;
          } else if (typeof car.images === 'string') {
            try {
              carImages = JSON.parse(car.images);
            } catch {
              carImages = [];
            }
          }
        }

        // Mapper payment_status
        const paymentStatusMap: Record<string, string> = {
          'paid': 'charged',
          'pending': 'pending',
          'failed': 'failed',
          'refunded': 'refunded',
        };
        const paymentStatus = paymentStatusMap[rawData.payment_status as string] || rawData.payment_status || 'pending';

        // Formater la réservation selon le type Booking attendu par BookingDetails
        const formattedBooking: Booking = {
          id: rawData.id,
          vehicleId: rawData.car_id || rawData.vehicle_id,
          vehicleName: car ? `${car.make || car.brand || ''} ${car.model || ''}`.trim() : "Véhicule inconnu",
          vehicleBrand: car?.make || car?.brand || '',
          vehicleModel: car?.model || '',
          vehicleYear: car?.year || new Date().getFullYear(),
          vehicleImageUrl: carImages[0] || '',
          
          renterId: renterId,
          renterName: renter ? `${renter.first_name || ''} ${renter.last_name || ''}`.trim() : "Locataire inconnu",
          renterEmail: renter?.email || '',
          renterPhone: renter?.phone_number || renter?.phone || '',
          
          ownerId: ownerId,
          ownerName: host ? `${host.first_name || ''} ${host.last_name || ''}`.trim() : "Propriétaire inconnu",
          ownerEmail: host?.email || '',
          ownerPhone: host?.phone_number || host?.phone || '',
          
          startDate: rawData.start_date,
          endDate: rawData.end_date,
          pickupLocation: rawData.pickup_location || '',
          returnLocation: rawData.return_location || rawData.pickup_location || '',
          
          status: rawData.status,
          
          dailyRate: car?.price_per_day || 0,
          durationDays: Math.ceil((new Date(rawData.end_date).getTime() - new Date(rawData.start_date).getTime()) / (1000 * 60 * 60 * 24)),
          serviceFee: rawData.service_fee || 0,
          totalAmount: rawData.total_amount || rawData.total_price || 0,
          depositAmount: rawData.deposit_amount || rawData.caution_amount || 0,
          
          pickupChecklist: null,
          pickupPhotos: [],
          pickupDate: null,
          returnChecklist: null,
          returnPhotos: [],
          returnDate: null,
          
          check_in_photos: [],
          check_out_photos: [],
          checkInOutStatus: 'not_started',
          
          createdAt: rawData.created_at,
          updatedAt: rawData.updated_at || rawData.created_at,
          
          // Ajouter paymentStatus pour BookingDetails
          paymentStatus: paymentStatus as any,
          rating: 0,
          
          vehicle: car,
          renter: renter,
          owner: host
        } as any; // Type assertion car BookingDetails attend un format légèrement différent

        setBooking(formattedBooking);
      } catch (error) {
        console.error("Erreur lors de la récupération des détails de la réservation:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les détails de la réservation.",
          variant: "destructive"
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id, user, navigate, toast]);

  const handleBookingAction = async (action: string) => {
    if (!booking || !user) return;

    try {
      if (action === 'cancel') {
        // Vérifier que l'utilisateur est autorisé à annuler
        if (userRole === 'renter' && booking.renterId !== user.id) {
          throw new Error("Vous n'êtes pas autorisé à annuler cette réservation.");
        }

        // Annuler la réservation via Supabase
        const { error: updateError } = await updateBookingStatus(booking.id, 'cancelled', user.id);
        
        if (updateError) {
          throw new Error(updateError.message || "Impossible d'annuler la réservation");
        }

        // Recharger les données de la réservation
        const { booking: updatedBooking } = await getBookingById(booking.id);
        if (updatedBooking) {
          const formattedBooking = {
            ...booking,
            status: 'cancelled' as any,
            updatedAt: updatedBooking.updated_at
          };
          setBooking(formattedBooking);
        }

        toast({
          title: "Réservation annulée",
          description: "La réservation a été annulée avec succès."
        });
      } else if (action === 'check_in' || action === 'vehicle_pickup') {
        // Rediriger vers la page de check-in
        navigate(`/bookings/${booking.id}/check-in`);
      } else if (action === 'check_out' || action === 'vehicle_return') {
        // Rediriger vers la page de check-out
        navigate(`/bookings/${booking.id}/check-out`);
      } else if (action === 'review') {
        // Rediriger vers la page de review (seulement pour les locataires)
        if (userRole === 'renter') {
          navigate(`/bookings/${booking.id}/review`);
        }
      } else if (action === 'share_contact') {
        toast({
          title: "Coordonnées partagées",
          description: "Vos coordonnées ont été partagées avec succès."
        });
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
      toast({
        title: "Erreur",
        description: (error as Error).message || `Impossible d'effectuer l'action demandée.`,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des détails de la réservation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Réservation introuvable</h1>
            <p className="text-gray-600 mb-6">La réservation que vous recherchez n'existe pas ou a été supprimée.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:underline flex items-center"
          >
            ← Retour au tableau de bord
          </button>
          <h1 className="text-2xl font-bold mt-2">Détails de la réservation</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <BookingDetails 
            booking={booking} 
            userRole={userRole ?? "renter"} // Provide default value to satisfy type
            onAction={handleBookingAction} 
          />
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPage; 