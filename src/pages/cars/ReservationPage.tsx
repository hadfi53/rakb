import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays, differenceInDays, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Car, MapPin, Calendar as CalendarIcon, Shield, CreditCard as CreditCardIcon, AlertCircle, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getVehicleImageUrl } from "@/lib/utils";

const ReservationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getUserRole } = useAuth();
  
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 8));
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [message, setMessage] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  
  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.getVehicle(id || ''),
    enabled: !!id,
  });
  
  useEffect(() => {
    if (vehicle) {
      setPickupLocation(vehicle.location || "");
      setReturnLocation(vehicle.location || "");
    }
  }, [vehicle]);

  // Vérifier si l'utilisateur est une agence au chargement de la page
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const userRole = await getUserRole();
          if (userRole === 'owner') {
            toast({
              title: "Réservation interdite",
              description: "Les agences de location ne peuvent pas réserver de véhicules. Vous devez utiliser un compte personnel (locataire) pour effectuer une réservation.",
              variant: "destructive",
            });
            navigate(-1);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du rôle:', error);
        }
      }
    };
    checkUserRole();
  }, [user, getUserRole, toast, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-1/3 rounded mb-4" />
            <div className="h-[30vh] bg-gray-200 rounded-lg mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="h-12 bg-gray-200 rounded mb-4" />
                <div className="h-64 bg-gray-200 rounded" />
              </div>
              <div>
                <div className="h-64 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Erreur lors du chargement
          </h1>
          <p className="text-gray-600 mb-4">
            Une erreur s'est produite lors du chargement des détails du véhicule.
          </p>
          <Button onClick={() => navigate(-1)}>
            Retourner à la recherche
          </Button>
        </div>
      </div>
    );
  }
  
  // Calculer le prix total
  const durationDays = differenceInDays(endDate, startDate) || 1;
  const dailyRate = vehicle.price_per_day || vehicle.price || 0;
  const basePrice = dailyRate * durationDays;
  const insurancePrice = selectedInsurance === 'basic' ? durationDays * 50 : selectedInsurance === 'premium' ? durationDays * 100 : 0;
  const serviceFee = Math.round(basePrice * 0.10); // 10% de frais de service
  const totalPrice = basePrice + serviceFee + insurancePrice;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour effectuer une réservation",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }

    // Vérifier si l'utilisateur est une agence
    try {
      const userRole = await getUserRole();
      if (userRole === 'owner') {
        toast({
          title: "Réservation interdite",
          description: "Les agences de location ne peuvent pas réserver de véhicules. Veuillez créer un compte personnel (locataire) pour effectuer une réservation.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
    }
    
    if (!startDate || !endDate) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez sélectionner des dates de début et de fin",
        variant: "destructive",
      });
      return;
    }
    
    if (isBefore(endDate, startDate)) {
      toast({
        title: "Dates invalides",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }
    
    if (!pickupLocation) {
      toast({
        title: "Lieu de prise en charge manquant",
        description: "Veuillez indiquer le lieu de prise en charge",
        variant: "destructive",
      });
      return;
    }
    
    if (!returnLocation) {
      toast({
        title: "Lieu de retour manquant",
        description: "Veuillez indiquer le lieu de retour",
        variant: "destructive",
      });
      return;
    }
    
    if (!acceptTerms) {
      toast({
        title: "Conditions non acceptées",
        description: "Veuillez accepter les conditions générales",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Créer la réservation dans la base de données
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('owner_id')
        .eq('id', id)
        .single();
      
      if (vehicleError) {
        throw new Error("Impossible de récupérer les informations du véhicule");
      }
      
      const ownerId = vehicleData.owner_id;
      
      // Calculer la durée et les prix
      const durationDays = differenceInDays(endDate, startDate) || 1;
      const basePrice = dailyRate * durationDays;
      const insurancePrice = selectedInsurance === 'basic' ? durationDays * 50 : selectedInsurance === 'premium' ? durationDays * 100 : 0;
      const serviceFee = Math.round(basePrice * 0.10); // 10% de frais de service
      const totalPrice = basePrice + serviceFee + insurancePrice;
      
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          vehicle_id: id,
          renter_id: user.id,
          owner_id: ownerId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          pickup_location: pickupLocation,
          return_location: returnLocation,
          base_price: basePrice,
          service_fee: serviceFee,
          insurance_fee: insurancePrice,
          total_price: totalPrice,
          status: 'pending',
          duration_days: durationDays,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (bookingError) {
        throw bookingError;
      }
      
      toast({
        title: "Réservation confirmée",
        description: "Votre demande de réservation a été envoyée au propriétaire",
      });
      navigate("/dashboard/renter");
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const nextStep = () => {
    if (step === 1) {
      if (!startDate || !endDate) {
        toast({
          title: "Dates manquantes",
          description: "Veuillez sélectionner des dates de début et de fin",
          variant: "destructive",
        });
        return;
      }
      
      if (isBefore(endDate, startDate)) {
        toast({
          title: "Dates invalides",
          description: "La date de fin doit être après la date de début",
          variant: "destructive",
        });
        return;
      }
      
      if (!pickupLocation || !returnLocation) {
        toast({
          title: "Lieux manquants",
          description: "Veuillez indiquer les lieux de prise en charge et de retour",
          variant: "destructive",
        });
        return;
      }
    }
    
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <Link to={`/cars/${id}`} className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux détails du véhicule
          </Link>
          
          <h1 className="text-2xl font-bold mt-4 flex items-center">
            <Car className="w-6 h-6 mr-2 text-primary" />
            Réservation de {vehicle.name || `${vehicle.make} ${vehicle.model} ${vehicle.year}`}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Étape 1: Dates et lieux */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Étape 1: Dates et lieux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Date de début</Label>
                      <div className="border rounded-md p-2">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date: Date | undefined) => date && setStartDate(date)}
                          disabled={(date: Date) => date < addDays(new Date(), 1)}
                          initialFocus
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Date de fin</Label>
                      <div className="border rounded-md p-2">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date: Date | undefined) => date && setEndDate(date)}
                          disabled={(date: Date) => date <= startDate}
                          initialFocus
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pickupLocation">Lieu de prise en charge</Label>
                    <Input
                      id="pickupLocation"
                      value={pickupLocation}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
                      placeholder="Adresse de prise en charge"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="returnLocation">Lieu de retour</Label>
                    <Input
                      id="returnLocation"
                      value={returnLocation}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnLocation(e.target.value)}
                      placeholder="Adresse de retour"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={nextStep}>
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Étape 2: Options d'assurance */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Étape 2: Options d'assurance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div 
                      className={`border rounded-md p-4 cursor-pointer transition-colors ${selectedInsurance === 'none' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                      onClick={() => setSelectedInsurance('none')}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">Sans assurance</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Aucune protection supplémentaire. Vous êtes responsable de tous les dommages.
                          </p>
                        </div>
                        <div className="font-medium">0 MAD</div>
                      </div>
                      {selectedInsurance === 'none' && (
                        <div className="mt-2 flex items-center text-primary">
                          <CheckCheck className="w-4 h-4 mr-1" />
                          <span className="text-sm">Sélectionné</span>
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer transition-colors ${selectedInsurance === 'basic' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                      onClick={() => setSelectedInsurance('basic')}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">Assurance de base</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Couverture des dommages matériels jusqu'à 50 000 MAD avec une franchise de 5 000 MAD.
                          </p>
                        </div>
                        <div className="font-medium">50 MAD/jour</div>
                      </div>
                      {selectedInsurance === 'basic' && (
                        <div className="mt-2 flex items-center text-primary">
                          <CheckCheck className="w-4 h-4 mr-1" />
                          <span className="text-sm">Sélectionné</span>
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className={`border rounded-md p-4 cursor-pointer transition-colors ${selectedInsurance === 'premium' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'}`}
                      onClick={() => setSelectedInsurance('premium')}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">Assurance premium</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Couverture complète sans franchise. Inclut l'assistance routière 24/7 et le véhicule de remplacement.
                          </p>
                        </div>
                        <div className="font-medium">100 MAD/jour</div>
                      </div>
                      {selectedInsurance === 'premium' && (
                        <div className="mt-2 flex items-center text-primary">
                          <CheckCheck className="w-4 h-4 mr-1" />
                          <span className="text-sm">Sélectionné</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      Retour
                    </Button>
                    <Button onClick={nextStep}>
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Étape 3: Confirmation et paiement */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Étape 3: Confirmation et paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md space-y-3">
                      <h3 className="font-medium">Récapitulatif de la réservation</h3>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          <span>Date de début:</span>
                        </div>
                        <div>{format(startDate, 'PPP', { locale: fr })}</div>
                        
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          <span>Date de fin:</span>
                        </div>
                        <div>{format(endDate, 'PPP', { locale: fr })}</div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>Lieu de prise en charge:</span>
                        </div>
                        <div>{pickupLocation}</div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>Lieu de retour:</span>
                        </div>
                        <div>{returnLocation}</div>
                        
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span>Assurance:</span>
                        </div>
                        <div>
                          {selectedInsurance === 'none' && "Sans assurance"}
                          {selectedInsurance === 'basic' && "Assurance de base"}
                          {selectedInsurance === 'premium' && "Assurance premium"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message au propriétaire (optionnel)</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        placeholder="Informations supplémentaires pour le propriétaire"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={acceptTerms} 
                        onCheckedChange={(checked: boolean | "indeterminate") => setAcceptTerms(checked === true)} 
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        J'accepte les conditions générales et la politique d'annulation
                      </label>
                    </div>
                    
                    <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <CreditCardIcon className="w-5 h-5" />
                        <h3 className="font-medium">Informations de paiement</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Le paiement sera traité une fois que le propriétaire aura accepté votre demande de réservation.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardName">Nom sur la carte</Label>
                          <Input id="cardName" placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Numéro de carte</Label>
                          <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Date d'expiration</Label>
                          <Input id="expiry" placeholder="MM/AA" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" placeholder="123" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      Retour
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? "Réservation en cours..." : "Confirmer la réservation"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Informations sur le véhicule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Informations sur le véhicule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-md overflow-hidden">
                  <img 
                    src={getVehicleImageUrl(vehicle.image_url || vehicle.images?.[0])} 
                    alt={vehicle.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm text-gray-500">Marque</h3>
                    <p className="font-medium">{vehicle.make || vehicle.brand}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">Modèle</h3>
                    <p className="font-medium">{vehicle.model}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">Année</h3>
                    <p className="font-medium">{vehicle.year}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">Transmission</h3>
                    <p className="font-medium">{vehicle.transmission || "Non spécifié"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">Carburant</h3>
                    <p className="font-medium">{vehicle.fuel_type || vehicle.fuel || "Non spécifié"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500">Places</h3>
                    <p className="font-medium">{vehicle.seats || "Non spécifié"}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Description</h3>
                  <p className="text-sm">{vehicle.description || "Aucune description disponible."}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500 mb-1">Localisation</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <p className="text-sm">{vehicle.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Résumé de la réservation */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Résumé de la réservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Durée de location:</span>
                  </div>
                  <span className="font-medium">{durationDays} jours</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{dailyRate} MAD x {durationDays} jours</span>
                    <span>{basePrice} MAD</span>
                  </div>
                  
                  {selectedInsurance && selectedInsurance !== 'none' && (
                    <div className="flex justify-between text-sm">
                      <span>
                        Assurance {selectedInsurance === 'basic' ? 'de base' : 'premium'} 
                        ({selectedInsurance === 'basic' ? '50' : '100'} MAD/jour)
                      </span>
                      <span>{insurancePrice} MAD</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span>Frais de service (10%)</span>
                    <span>{serviceFee} MAD</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{totalPrice} MAD</span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Politique d'annulation</p>
                      <p className="mt-1">Annulation gratuite jusqu'à 48h avant la prise en charge. Après ce délai, des frais peuvent s'appliquer.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-xs text-gray-500 text-center">
                    En confirmant votre réservation, vous acceptez les conditions générales de Rakeb et la politique d'annulation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
