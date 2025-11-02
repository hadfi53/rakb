import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getBookingById } from "@/lib/backend/bookings";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, ArrowLeft, CheckCircle, Building2, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { companyInfo } from "@/lib/config/company";

const InvoicePage = () => {
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
          navigate("/dashboard");
          return;
        }

        // Check access
        if (bookingData.renter_id !== user.id && bookingData.owner_id !== user.id) {
          toast.error("Accès refusé");
          navigate("/dashboard");
          return;
        }

        setBooking(bookingData);

        // Get payment data
        const { data: paymentData } = await supabase
          .from("payments")
          .select("*")
          .eq("booking_id", id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (paymentData) setPayment(paymentData);

        // Get vehicle details
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
        console.error("Error loading invoice data:", error);
        toast.error("Erreur lors du chargement de la facture");
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
            <p className="mt-4 text-gray-600">Chargement de la facture...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking || !vehicle || !owner || !renter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Facture introuvable</p>
            <Button onClick={() => navigate("/dashboard")}>Retour au dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const invoiceNumber = `INV-${booking.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const issueDate = booking.created_at || new Date().toISOString();
  const dueDate = payment?.created_at || booking.created_at || new Date().toISOString();
  
  const durationDays = differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) + 1;
  const basePrice = booking.base_price || (vehicle.price_per_day * durationDays) || 0;
  const serviceFee = booking.service_fee || (basePrice * 0.1);
  const insuranceFee = booking.insurance_fee || 0;
  const deposit = booking.caution_amount || booking.deposit_amount || 0;
  const subtotal = basePrice + insuranceFee;
  const tax = subtotal * 0.18; // TVA 18%
  const totalAmount = booking.total_amount || booking.total_price || (subtotal + serviceFee + tax);

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

          {/* Invoice Card */}
          <Card className="bg-white print:shadow-none">
            <CardContent className="p-8">
              {/* Header */}
              <div className="mb-8 pb-8 border-b-2 border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-8 h-8 text-primary" />
                      <h1 className="text-3xl font-bold text-primary">RAKeB</h1>
                    </div>
                    <p className="text-gray-600">Plateforme de location de véhicules</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{companyInfo.address.street}</p>
                      <p>{companyInfo.address.city}, {companyInfo.address.country}</p>
                      <p>Tél: {companyInfo.phoneDisplay}</p>
                      <p>Email: {companyInfo.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">FACTURE</h2>
                    <p className="text-sm text-gray-500 mb-1">N° {invoiceNumber}</p>
                    <p className="text-sm text-gray-500">
                      Date d'émission: {format(new Date(issueDate), "PPP", { locale: fr })}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Date d'échéance: {format(new Date(dueDate), "PPP", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Facturé par</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {owner.first_name} {owner.last_name}
                    <br />
                    {owner.email}
                    <br />
                    {owner.phone_number}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Facturé à</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {renter.first_name} {renter.last_name}
                    <br />
                    {renter.email}
                    <br />
                    {renter.phone_number}
                  </p>
                </div>
              </div>

              {/* Booking Details */}
              <div className="mb-8">
                <h3 className="font-semibold mb-4">Détails de la réservation</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Véhicule</p>
                      <p className="font-medium">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Période</p>
                      <p className="font-medium">
                        {format(new Date(booking.start_date), "PPP", { locale: fr })} -{" "}
                        {format(new Date(booking.end_date), "PPP", { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Durée</p>
                      <p className="font-medium">{durationDays} jour{durationDays > 1 ? "s" : ""}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lieu de prise en charge</p>
                      <p className="font-medium">{booking.pickup_location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
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
                        Location de véhicule ({durationDays} jour{durationDays > 1 ? "s" : ""})
                      </td>
                      <td className="px-4 py-3 text-right">
                        {new Intl.NumberFormat("fr-MA", {
                          style: "currency",
                          currency: "MAD",
                        }).format(basePrice)}
                      </td>
                    </tr>
                    {insuranceFee > 0 && (
                      <tr>
                        <td className="px-4 py-3">Assurance</td>
                        <td className="px-4 py-3 text-right">
                          {new Intl.NumberFormat("fr-MA", {
                            style: "currency",
                            currency: "MAD",
                          }).format(insuranceFee)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-4 py-3">Frais de service (10%)</td>
                      <td className="px-4 py-3 text-right">
                        {new Intl.NumberFormat("fr-MA", {
                          style: "currency",
                          currency: "MAD",
                        }).format(serviceFee)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">TVA (18%)</td>
                      <td className="px-4 py-3 text-right">
                        {new Intl.NumberFormat("fr-MA", {
                          style: "currency",
                          currency: "MAD",
                        }).format(tax)}
                      </td>
                    </tr>
                    {deposit > 0 && (
                      <tr>
                        <td className="px-4 py-3">Caution (remboursable)</td>
                        <td className="px-4 py-3 text-right">
                          {new Intl.NumberFormat("fr-MA", {
                            style: "currency",
                            currency: "MAD",
                          }).format(deposit)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-4 py-4 font-bold text-lg">Total</td>
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

              {/* Payment Status */}
              <div className="mb-8">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    payment?.status === "completed" || booking.payment_status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {payment?.status === "completed" || booking.payment_status === "completed" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : null}
                  <span className="font-semibold">
                    {payment?.status === "completed" || booking.payment_status === "completed"
                      ? "Payé"
                      : "En attente de paiement"}
                  </span>
                </div>
                {payment?.created_at && (
                  <p className="text-sm text-gray-600 mt-2">
                    Date de paiement: {format(new Date(payment.created_at), "PPP", { locale: fr })}
                  </p>
                )}
                {payment?.provider_payment_id && (
                  <p className="text-sm text-gray-500 mt-1">
                    Transaction ID: {payment.provider_payment_id}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Merci pour votre confiance !</p>
                <p className="mt-2">
                  Pour toute question concernant cette facture, veuillez nous contacter à{" "}
                  <a href={`mailto:${companyInfo.email}`} className="text-primary hover:underline">
                    {companyInfo.email}
                  </a>
                </p>
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

export default InvoicePage;
