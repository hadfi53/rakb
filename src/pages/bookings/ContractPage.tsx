import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getBookingById } from "@/lib/backend/bookings";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, ArrowLeft, FileText, PenTool } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

const ContractPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [renter, setRenter] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

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

        setIsOwner(bookingData.owner_id === user.id);
        setBooking(bookingData);

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
        console.error("Error loading contract data:", error);
        toast.error("Erreur lors du chargement du contrat");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  const handleSignContract = async () => {
    if (!id || !user) return;

    try {
      // Try to update contract_signed field (may not exist in all schemas)
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Try pickup_contract_signed first (exists in some schemas)
      try {
        const { error } = await supabase
          .from("bookings")
          .update({
            pickup_contract_signed: true,
            ...updateData,
          })
          .eq("id", id);

        if (!error) {
          toast.success("Contrat signé avec succès");
          return;
        }
      } catch {
        // Field doesn't exist, continue
      }

      // If that fails, just update updated_at as a record of viewing/signing
      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Contrat visualisé");
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error("Erreur lors de la signature du contrat");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du contrat...</p>
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
            <p className="text-gray-600 mb-4">Données manquantes</p>
            <Button onClick={() => navigate("/dashboard")}>Retour au dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const contractNumber = `CT-${booking.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const durationDays = differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) + 1;
  const startDate = format(new Date(booking.start_date), "PPP", { locale: fr });
  const endDate = format(new Date(booking.end_date), "PPP", { locale: fr });

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
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
              {!booking.pickup_contract_signed && !booking.return_contract_signed && (
                <Button onClick={handleSignContract}>
                  <PenTool className="w-4 h-4 mr-2" />
                  Signer le contrat
                </Button>
              )}
            </div>
          </div>

          {/* Contract Card */}
          <Card className="bg-white print:shadow-none">
            <CardContent className="p-8">
              {/* Header */}
              <div className="mb-8 text-center border-b-2 border-gray-200 pb-8">
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Contrat de location</h1>
                <p className="text-gray-600">N° {contractNumber}</p>
                {(booking.pickup_contract_signed || booking.return_contract_signed) && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <PenTool className="w-4 h-4" />
                    <span className="font-semibold">Contrat signé</span>
                  </div>
                )}
              </div>

              {/* Contract Content */}
              <div className="space-y-6 text-gray-700">
                {/* Preamble */}
                <section>
                  <p className="mb-4">
                    Entre les soussignés :
                  </p>
                  <div className="ml-6 space-y-2">
                    <p>
                      <strong>Le Propriétaire/Loueur :</strong><br />
                      {owner.first_name} {owner.last_name}<br />
                      {owner.email}
                      {owner.phone_number && <><br />{owner.phone_number}</>}
                    </p>
                    <p>
                      <strong>Le Locataire :</strong><br />
                      {renter.first_name} {renter.last_name}<br />
                      {renter.email}
                      {renter.phone_number && <><br />{renter.phone_number}</>}
                    </p>
                  </div>
                </section>

                {/* Vehicle Details */}
                <section>
                  <h3 className="font-bold mb-3">ARTICLE 1 - OBJET DU CONTRAT</h3>
                  <p className="mb-2">
                    Le présent contrat a pour objet la location du véhicule suivant :
                  </p>
                  <div className="ml-6 bg-gray-50 p-4 rounded-lg">
                    <p><strong>Marque/Modèle :</strong> {vehicle.brand} {vehicle.model}</p>
                    <p><strong>Année :</strong> {vehicle.year}</p>
                    <p><strong>Immatriculation :</strong> {vehicle.license_plate || "À confirmer"}</p>
                    <p><strong>Type :</strong> {vehicle.type || vehicle.category || "Non spécifié"}</p>
                  </div>
                </section>

                {/* Rental Period */}
                <section>
                  <h3 className="font-bold mb-3">ARTICLE 2 - DURÉE ET DATES DE LOCATION</h3>
                  <div className="ml-6 space-y-2">
                    <p>
                      <strong>Période de location :</strong> {startDate} au {endDate}
                    </p>
                    <p>
                      <strong>Durée :</strong> {durationDays} jour{durationDays > 1 ? "s" : ""}
                    </p>
                    <p>
                      <strong>Lieu de prise en charge :</strong> {booking.pickup_location}
                    </p>
                    <p>
                      <strong>Lieu de retour :</strong> {booking.return_location || booking.pickup_location}
                    </p>
                  </div>
                </section>

                {/* Financial Terms */}
                <section>
                  <h3 className="font-bold mb-3">ARTICLE 3 - CONDITIONS FINANCIÈRES</h3>
                  <div className="ml-6 space-y-2">
                    <p>
                      <strong>Prix de location :</strong>{" "}
                      {new Intl.NumberFormat("fr-MA", {
                        style: "currency",
                        currency: "MAD",
                      }).format(booking.total_amount || booking.total_price || 0)}
                    </p>
                    {booking.caution_amount > 0 && (
                      <p>
                        <strong>Caution :</strong>{" "}
                        {new Intl.NumberFormat("fr-MA", {
                          style: "currency",
                          currency: "MAD",
                        }).format(booking.caution_amount)}
                      </p>
                    )}
                    <p className="mt-2">
                      Le paiement a été effectué intégralement au moment de la réservation.
                    </p>
                  </div>
                </section>

                {/* Obligations */}
                <section>
                  <h3 className="font-bold mb-3">ARTICLE 4 - OBLIGATIONS DU LOCATAIRE</h3>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Utiliser le véhicule conformément à sa destination normale</li>
                    <li>Respecter le code de la route</li>
                    <li>Ne pas prêter le véhicule à un tiers</li>
                    <li>Maintenir le véhicule en bon état</li>
                    <li>Retourner le véhicule dans l'état où il a été reçu</li>
                    <li>Respecter les dates de retour convenues</li>
                  </ul>
                </section>

                {/* Insurance */}
                <section>
                  <h3 className="font-bold mb-3">ARTICLE 5 - ASSURANCE</h3>
                  <p className="ml-6">
                    Le véhicule est couvert par une assurance responsabilité civile. Le locataire
                    est responsable de tous les dommages non couverts par l'assurance.
                  </p>
                </section>

                {/* Fuel */}
                <section>
                  <h3 className="font-bold mb-3">ARTICLE 6 - CARBURANT</h3>
                  <p className="ml-6">
                    Le véhicule sera livré avec un plein de carburant. Le locataire s'engage à
                    restituer le véhicule avec le même niveau de carburant.
                  </p>
                </section>

                {/* Penalties */}
                <section>
                  <h3 className="font-bold mb-3">ARTICLE 7 - RETARD ET PÉNALITÉS</h3>
                  <p className="ml-6">
                    Tout retard dans la restitution du véhicule donnera lieu à des pénalités de
                    retard selon les conditions générales de location.
                  </p>
                </section>

                {/* Signatures */}
                <section className="mt-12 pt-8 border-t-2 border-gray-200">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="text-center">
                      <p className="font-semibold mb-4">Le Propriétaire</p>
                      <div className="h-20 border-b border-gray-300 mb-2"></div>
                      <p className="text-sm">{owner.first_name} {owner.last_name}</p>
                      <p className="text-xs text-gray-500">
                        Date: {format(new Date(), "PPP", { locale: fr })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold mb-4">Le Locataire</p>
                      <div className="h-20 border-b border-gray-300 mb-2"></div>
                      <p className="text-sm">{renter.first_name} {renter.last_name}</p>
                      <p className="text-xs text-gray-500">
                        Date: {format(new Date(), "PPP", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>RAKeB - Plateforme de location de véhicules</p>
                <p className="mt-1">Ce contrat est régi par le droit marocain.</p>
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

export default ContractPage;

