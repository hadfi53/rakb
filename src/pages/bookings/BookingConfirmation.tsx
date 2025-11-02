import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, MessageSquare, ArrowRight, Calendar, MapPin, Car, Clock, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { getBookingById } from "@/lib/backend/bookings";
import Navbar from "@/components/Navbar";

const BookingConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookingCode, setBookingCode] = useState<string>("");
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooking = async () => {
      if (!id || !user) return;
      
      setLoading(true);
      try {
        // Get booking from Supabase
        const { booking: bookingData, error: bookingError } = await getBookingById(id);

        if (bookingError || !bookingData) {
          toast.error("Réservation introuvable");
          navigate("/dashboard/renter/bookings");
          return;
        }

        // Check access
        if (bookingData.renter_id !== user.id && bookingData.owner_id !== user.id) {
          toast.error("Accès refusé");
          navigate("/dashboard");
          return;
        }

        // Generate booking code from reference_number or create one
        const code = bookingData.reference_number || `RAKB-${id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        setBookingCode(code);
        setBooking(bookingData);
      } catch (error) {
        console.error("Error loading booking:", error);
        toast.error("Erreur lors du chargement de la réservation");
        navigate("/dashboard/renter/bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id, user, navigate]);

  const copyBookingCode = () => {
    navigator.clipboard.writeText(bookingCode);
    toast.success("Code de réservation copié !");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de la réservation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Réservation introuvable</p>
            <Button onClick={() => navigate("/dashboard/renter/bookings")}>
              Retour aux réservations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {booking.status === 'pending' ? 'Paiement effectué !' : 'Réservation confirmée !'}
          </h1>
          <p className="text-gray-600">
            {booking.status === 'pending' 
              ? 'Votre paiement a été effectué avec succès. En attente de confirmation du propriétaire.'
              : 'Votre demande de réservation a été acceptée'}
          </p>
        </div>

        {/* Booking Code */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Code de réservation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <code className="text-2xl font-mono font-bold text-primary">
                {bookingCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyBookingCode}
                className="ml-4"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Conservez ce code pour vos références
            </p>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="w-5 h-5" />
              Détails de la réservation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Dates de location</p>
                  <p className="font-medium">
                    {format(new Date(booking.start_date), "PPP", { locale: fr })} - {format(new Date(booking.end_date), "PPP", { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Lieu de prise en charge</p>
                  <p className="font-medium">{booking.pickup_location || "À confirmer"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Car className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Véhicule</p>
                  <p className="font-medium">
                    {booking.vehicle?.make || booking.vehicle?.brand} {booking.vehicle?.model} {booking.vehicle?.year}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(
                      booking.total_price || booking.total_amount || 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Info */}
        {booking.status === 'pending' && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2 text-yellow-900">En attente de confirmation</h3>
                  <p className="text-sm text-yellow-800">
                    Votre paiement a été effectué avec succès. Le propriétaire doit maintenant confirmer votre réservation.
                    Vous serez notifié dès que la réservation sera confirmée.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Prochaines étapes</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Un email de confirmation a été envoyé à {user?.email}</span>
              </li>
              {booking.status === 'confirmed' && (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Vous recevrez les détails de rendez-vous 24h avant le début de la location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Préparez vos documents (permis de conduire, pièce d'identité)</span>
                  </li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2"
                onClick={() => navigate(`/bookings/${id}/invoice`)}
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm">Facture</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2"
                onClick={() => navigate(`/bookings/${id}/receipt`)}
              >
                <Receipt className="w-6 h-6" />
                <span className="text-sm">Reçu</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 gap-2"
                onClick={() => navigate(`/bookings/${id}/contract`)}
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm">Contrat</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link to={`/bookings/${id}`}>
              Voir les détails de la réservation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <Button
            onClick={() => {
              navigate(`/messages?booking=${id}`);
            }}
            className="flex-1"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contacter le propriétaire
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            Retour à l'accueil
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

