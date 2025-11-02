import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getBookingById } from "@/lib/backend/bookings";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Printer, ArrowLeft, CheckCircle, Building2, User, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { companyInfo } from "@/lib/config/company";

const ReceiptPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [renter, setRenter] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);

        // Get booking data
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

        setBooking(bookingData);

        // Get payment data from payments table
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("booking_id", id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!paymentError && paymentData) {
          setPayment(paymentData);
        }

        // Get vehicle details if not included
        if (bookingData.vehicle_id) {
          const { data: vehicleData } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", bookingData.vehicle_id)
            .single();

          if (vehicleData) setVehicle(vehicleData);
        }

        // Get owner details
        if (bookingData.owner_id) {
          const { data: ownerData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", bookingData.owner_id)
            .single();

          if (ownerData) setOwner(ownerData);
        }

        // Get renter details
        if (bookingData.renter_id) {
          const { data: renterData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", bookingData.renter_id)
            .single();

          if (renterData) setRenter(renterData);
        }
      } catch (error) {
        console.error("Error loading receipt data:", error);
        toast.error("Erreur lors du chargement du reçu");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du reçu...</p>
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
            <p className="text-gray-600 mb-4">Reçu introuvable</p>
            <Button onClick={() => navigate("/dashboard/renter/bookings")}>
              Retour aux réservations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const receiptNumber = `RE-${booking.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const paymentDate = payment?.created_at || booking.created_at;
  const totalAmount = booking.total_amount || booking.total_price || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Actions */}
          <div className="mb-6 flex items-center justify-between print:hidden">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>

          {/* Receipt Card */}
          <Card className="bg-white print:shadow-none">
            <CardContent className="p-8">
              {/* Header */}
              <div className="mb-8 pb-8 border-b-2 border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-primary mb-2">RAKB</h1>
                    <p className="text-gray-600">Reçu de paiement</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">N° de reçu</p>
                    <p className="text-lg font-bold">{receiptNumber}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Date: {format(new Date(paymentDate), "PPP", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-6 flex justify-end">
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">Paiement confirmé</span>
                </div>
              </div>

              {/* Company Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">RAKB</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {companyInfo.address.full}<br />
                    Tél: {companyInfo.phoneDisplay}<br />
                    Email: {companyInfo.email}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Client</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {renter?.first_name} {renter?.last_name}
                    <br />
                    {renter?.email}
                    <br />
                    {renter?.phone_number}
                  </p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Détails du paiement
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Méthode de paiement:</span>
                    <span className="font-medium">
                      {payment?.provider_payment_data?.stripe_payment_intent_id
                        ? "Carte bancaire"
                        : "Non spécifiée"}
                    </span>
                  </div>
                  {payment?.provider_payment_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Transaction:</span>
                      <span className="font-mono text-sm">{payment.provider_payment_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    <span className="font-medium text-green-600">Payé</span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="mb-8">
                <h3 className="font-semibold mb-4">Détails de la réservation</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Montant
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">
                              Location - {vehicle?.brand || "Véhicule"} {vehicle?.model}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(booking.start_date), "PPP", { locale: fr })} -{" "}
                              {format(new Date(booking.end_date), "PPP", { locale: fr })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.pickup_location}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {new Intl.NumberFormat("fr-MA", {
                            style: "currency",
                            currency: "MAD",
                          }).format(totalAmount)}
                        </td>
                      </tr>
                      {booking.caution_amount > 0 && (
                        <tr>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">Caution</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {new Intl.NumberFormat("fr-MA", {
                              style: "currency",
                              currency: "MAD",
                            }).format(booking.caution_amount)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-4 font-bold text-lg">Total payé</td>
                        <td className="px-4 py-4 text-right font-bold text-lg text-primary">
                          {new Intl.NumberFormat("fr-MA", {
                            style: "currency",
                            currency: "MAD",
                          }).format(totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Merci pour votre confiance !</p>
                <p className="mt-2">Ce document fait foi de paiement.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptPage;

