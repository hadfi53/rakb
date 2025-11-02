import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { format, addDays, differenceInDays, isBefore, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Vehicle } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { MapPin, Calendar as CalendarIcon, Clock, DollarSign } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { StripePaymentForm } from "@/components/payment/StripePaymentForm";
import { confirmPaymentWithMethodAndCreateBooking } from "@/lib/payment/stripe";

interface ReservationDialogProps {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookedPeriod {
  start: Date;
  end: Date;
}

type BookingState = 'selecting_dates' | 'reviewing' | 'paying' | 'confirmed' | 'failed';

const ReservationDialog = ({ vehicle, open, onOpenChange }: ReservationDialogProps) => {
  const { toast } = useToast();
  const { user, isVerifiedTenant, getUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [bookingState, setBookingState] = useState<BookingState>('selecting_dates');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'renter' | 'owner' | 'admin' | null>(null);
  const { supabase } = useSupabase();
  
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);
  
  // Récupérer les dates de l'URL
  const searchParams = new URLSearchParams(location.search);
  const datesParam = searchParams.get("dates") || "";
  let initialStartDate = tomorrow;
  let initialEndDate = nextWeek;
  
  if (datesParam) {
    const datesParts = datesParam.split(":");
    if (datesParts.length === 2) {
      const parsedStartDate = parseISO(datesParts[0]);
      const parsedEndDate = parseISO(datesParts[1]);
      if (!isNaN(parsedStartDate.getTime()) && !isNaN(parsedEndDate.getTime())) {
        initialStartDate = parsedStartDate;
        initialEndDate = parsedEndDate;
      }
    }
  }
  
  const [currentStep, setCurrentStep] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialStartDate,
    to: initialEndDate
  });
  const [pickupLocation, setPickupLocation] = useState(vehicle.location || "");
  const [returnLocation, setReturnLocation] = useState(vehicle.location || "");
  const [message, setMessage] = useState("");
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculer le prix total
  const durationDays = dateRange?.from && dateRange?.to ? 
    differenceInDays(dateRange.to, dateRange.from) || 1 : 1;
  const dailyRate = vehicle.price_per_day || vehicle.price || 0;
  const basePrice = dailyRate * durationDays;
  const serviceFee = Math.round(basePrice * 0.10); // 10% de frais de service
  const totalPrice = basePrice + serviceFee;

  // Charger les périodes déjà réservées
  useEffect(() => {
    const loadBookedPeriods = async () => {
      if (!vehicle?.id) return;

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('car_id', vehicle.id)
        .in('status', ['pending', 'confirmed', 'in_progress', 'active']);

      if (error) {
        console.error("Erreur lors du chargement des réservations:", error);
        return;
      }

      // Convertir les périodes en dates individuelles
      const dates: Date[] = [];
      bookings?.forEach(booking => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        let current = new Date(start);
        while (current <= end) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      });

      setBookedDates(dates);
    };

    loadBookedPeriods();
  }, [vehicle?.id, supabase]);

  // Check authentication and verification when dialog opens
  useEffect(() => {
    const checkAccess = async () => {
      if (open && !user) {
        toast({
          title: "Connexion requise",
          description: "Vous devez être connecté pour effectuer une réservation",
          variant: "destructive",
        });
        onOpenChange(false);
        navigate("/auth/login", { 
          state: { 
            redirectTo: window.location.pathname,
            message: "Connectez-vous pour réserver ce véhicule" 
          } 
        });
        return;
      }
      
      if (open && user) {
        // Vérifier si l'utilisateur est une agence
        const role = await getUserRole();
        setUserRole(role);
        
        if (role === 'owner') {
          toast({
            title: "Réservation interdite",
            description: "Les agences de location ne peuvent pas réserver de véhicules. Vous devez utiliser un compte personnel (locataire) pour effectuer une réservation.",
            variant: "destructive",
          });
          onOpenChange(false);
          return;
        }
        
        const verified = await isVerifiedTenant();
        setIsVerified(verified);
        if (!verified) {
          toast({
            title: "Vérification requise",
            description: "Vous devez être vérifié en tant que locataire pour réserver",
            variant: "destructive",
          });
          onOpenChange(false);
          navigate("/verify/tenant");
          return;
        }
        setBookingState('selecting_dates');
      }
    };
    checkAccess();
  }, [open, user, navigate, onOpenChange, toast, isVerifiedTenant, getUserRole]);

  // If not authenticated, don't render the dialog
  if (!user || isVerified === false) return null;

  // Fonction pour vérifier si une date est déjà réservée
  const isDateBooked = (date: Date) => {
    return bookedDates.some(bookedDate => 
      bookedDate.getDate() === date.getDate() &&
      bookedDate.getMonth() === date.getMonth() &&
      bookedDate.getFullYear() === date.getFullYear()
    );
  };

  // Fonction pour obtenir les classes CSS pour une date donnée
  const getDateClassName = (date: Date) => {
    if (isDateBooked(date)) {
      return "line-through text-gray-400 bg-gray-100";
    }
    return "";
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez sélectionner vos dates de location",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez sélectionner vos dates de location",
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
    
    setIsSubmitting(true);
    
    try {
      // Simuler une réservation réussie
      setTimeout(() => {
        toast({
          title: "Réservation confirmée",
          description: "Votre demande de réservation a été envoyée au propriétaire",
        });
        onOpenChange(false);
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    return days * vehicle.price_per_day;
  };

  const handlePaymentSuccess = async (paymentResponse: { paymentIntentId: string; paymentMethodId: string }) => {
    try {
      setIsSubmitting(true);
      
      if (!dateRange?.from || !dateRange?.to || !user) {
        throw new Error("Données de réservation invalides");
      }

      // Prepare booking data
      // IMPORTANT: caution_amount must be an integer for database compatibility
      const cautionAmount = Math.round(totalPrice * 0.1); // 10% deposit, rounded to integer
      
      const bookingData = {
        car_id: vehicle.id,
        user_id: user.id,
        host_id: vehicle.owner_id,
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        pickup_location: pickupLocation,
        return_location: returnLocation || pickupLocation,
        total_amount: totalPrice,
        caution_amount: cautionAmount, // Round to integer before sending
        message: message || undefined,
      };
      
      // Confirm payment and create booking using PaymentMethod ID (secure way)
      const result = await confirmPaymentWithMethodAndCreateBooking(
        paymentResponse.paymentIntentId,
        paymentResponse.paymentMethodId,
        bookingData
      );

      if (!result.success) {
        throw new Error(result.error || "Le paiement a échoué");
      }

      toast({
        title: "Paiement réussi !",
        description: "Votre paiement a été effectué avec succès. En attente de confirmation du propriétaire."
      });

      onOpenChange(false);
      
      // Redirect to booking confirmation page
      if (result.booking?.id) {
        navigate(`/bookings/${result.booking.id}/confirm`);
      } else {
        navigate("/dashboard/renter/bookings");
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error in handlePaymentSuccess:', error);
      }
      handlePaymentError(error.message || "Une erreur est survenue lors du traitement du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Erreur de paiement",
      description: error,
      variant: "destructive"
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col h-full min-h-0">
            {/* Top Section - Date Display */}
            <div className="bg-white border-b px-6 py-4 shrink-0">
              <div 
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                role="button"
                tabIndex={0}
              >
                <CalendarIcon className="h-5 w-5 text-primary" />
                {dateRange?.from && dateRange?.to ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{format(dateRange.from, "d MMM")}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium">{format(dateRange.to, "d MMM")}</span>
                    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                      {durationDays} {durationDays > 1 ? 'jours' : 'jour'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Sélectionnez vos dates</span>
                )}
              </div>
            </div>

            {/* Calendar Section */}
            <div className="flex-1 p-6 min-h-0 overflow-y-auto">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 w-full overflow-x-auto">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    disabled={[
                      { before: new Date() },
                      (date: Date) => isDateBooked(date)
                    ]}
                    numberOfMonths={isMobile ? 1 : 2}
                    defaultMonth={dateRange?.from || new Date()}
                    className="w-full [-webkit-tap-highlight-color:transparent]"
                    classNames={{
                      months: "flex flex-col sm:flex-row sm:space-x-6 mx-auto w-full",
                      month: "space-y-3 w-full",
                      caption: "flex justify-center relative items-center h-8",
                      caption_label: "font-medium text-sm",
                      nav: "flex items-center gap-1",
                      nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-gray-50 rounded-full transition-colors absolute",
                      nav_button_previous: "left-1",
                      nav_button_next: "right-1",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "w-9 font-normal text-[0.8rem] text-gray-500",
                      row: "flex w-full mt-1.5",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center",
                      day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
                      day_today: "bg-gray-50 text-primary font-semibold",
                      day_outside: "text-gray-400",
                      day_disabled: "text-gray-300 line-through hover:bg-transparent cursor-not-allowed",
                      day_range_middle: "rounded-none bg-primary/10 text-primary",
                      day_range_end: "rounded-full bg-primary text-white",
                      day_range_start: "rounded-full bg-primary text-white",
                      day_hidden: "invisible",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
                      IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
                    }}
                  />
                </div>

                {/* Price Summary */}
                {dateRange?.from && dateRange?.to && (
                  <div className="border-t p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{dailyRate} MAD × {durationDays} jours</span>
                      <span className="font-medium">{basePrice} MAD</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Frais de service</span>
                      <span className="font-medium">{serviceFee} MAD</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-semibold text-primary">{totalPrice} MAD</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="bg-white border-t px-6 py-4 shrink-0">
              <Button
                onClick={handleNext}
                disabled={!dateRange?.from || !dateRange?.to}
                className="w-full h-11 text-base font-medium rounded-full"
              >
                {dateRange?.from && dateRange?.to ? 'Continuer' : 'Sélectionnez des dates'}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col h-full min-h-0">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] h-full">
                {/* Left Column - Form */}
                <div className="p-6 space-y-6">
                  {/* Locations Section */}
                  <div className="space-y-4">
                    {/* Pickup Location */}
                    <div className="bg-white rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <Label htmlFor="pickup" className="font-medium">Lieu de prise en charge</Label>
                      </div>
                      <Input
                        id="pickup"
                        value={pickupLocation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
                        placeholder="Saisissez l'adresse de prise en charge"
                        className="border-0 bg-gray-50/50 h-11"
                        required
                      />
                    </div>

                    {/* Return Location */}
                    <div className="bg-white rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <Label htmlFor="return" className="font-medium">Lieu de retour</Label>
                      </div>
                      <Input
                        id="return"
                        value={returnLocation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnLocation(e.target.value)}
                        placeholder="Saisissez l'adresse de retour"
                        className="border-0 bg-gray-50/50 h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Message Section */}
                  <div className="bg-white rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <Label htmlFor="message" className="font-medium">Message au propriétaire</Label>
                    </div>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                      placeholder="Présentez-vous et partagez vos plans de voyage (optionnel)"
                      className="border-0 bg-gray-50/50 min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Right Column - Summary */}
                <div className="lg:border-l border-gray-200 bg-white p-6">
                  <div className="space-y-6">
                    {/* Date Summary */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <div className="text-sm">
                        <div className="font-medium">
                          {format(dateRange?.from || tomorrow, 'd MMM')} - {format(dateRange?.to || nextWeek, 'd MMM')}
                        </div>
                        <div className="text-gray-500">
                          {durationDays} {durationDays > 1 ? 'jours' : 'jour'}
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{dailyRate} MAD × {durationDays} jours</span>
                        <span>{basePrice} MAD</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frais de service (10%)</span>
                        <span>{serviceFee} MAD</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t">
                        <span className="font-medium">Total</span>
                        <span className="text-lg font-semibold text-primary">{totalPrice} MAD</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={handleNext}
                      disabled={!pickupLocation || !returnLocation}
                      className="w-full h-11 text-base font-medium rounded-full"
                    >
                      Continuer vers le paiement
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Paiement</span>
              </div>
              <StripePaymentForm 
                onSuccess={handlePaymentSuccess} 
                onError={handlePaymentError}
                amount={totalPrice}
                bookingData={{
                  car_id: vehicle.id,
                  user_id: user?.id || "",
                  host_id: vehicle.owner_id,
                  start_date: dateRange?.from?.toISOString() || "",
                  end_date: dateRange?.to?.toISOString() || "",
                  pickup_location: pickupLocation,
                  return_location: returnLocation || pickupLocation,
                  total_amount: totalPrice,
                  caution_amount: totalPrice * 0.1,
                  message: message || undefined,
                }}
                userInfo={{
                  email: user?.email || user?.user_metadata?.email,
                  name: user?.user_metadata?.first_name 
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                    : user?.user_metadata?.full_name || undefined,
                  phone: user?.user_metadata?.phone,
                }}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] h-[90vh] flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">
          {currentStep === 1 ? "Sélection des dates" :
           currentStep === 2 ? "Détails de la location" :
           "Finalisation de la réservation"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Étape {currentStep} sur 3 du processus de réservation
        </DialogDescription>

        {/* Header - Fixed */}
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shrink-0">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleBack}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {currentStep === 1 ? "Sélection des dates" :
                 currentStep === 2 ? "Détails de la location" :
                 "Finalisation de la réservation"}
              </h2>
              <span className="text-sm text-gray-500 shrink-0 ml-2">Étape {currentStep}/3</span>
            </div>
            <Progress value={(currentStep / 3) * 100} className="h-1 mt-3" />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 bg-gray-50 overflow-y-auto min-h-0">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationDialog;
