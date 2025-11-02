import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/use-booking';
import { Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, differenceInDays, isBefore, isAfter, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { CalendarIcon, Car, CreditCard, Shield, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useVehicle } from "@/hooks/use-vehicle";

const bookingSchema = z.object({
  startDate: z.date({
    required_error: "Veuillez sélectionner une date de début",
  }),
  endDate: z.date({
    required_error: "Veuillez sélectionner une date de fin",
  }),
  pickupLocation: z.string().min(1, "Veuillez entrer un lieu de prise en charge"),
  returnLocation: z.string().min(1, "Veuillez entrer un lieu de retour"),
  message: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface CreateBookingFormProps {
  vehicle: Vehicle;
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateBookingForm = ({ vehicle, onSuccess, onCancel }: CreateBookingFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createBookingRequest, loading } = useBooking();
  const { checkVehicleAvailability } = useVehicle();
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalDays, setTotalDays] = useState(1);

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);
  
  const [startDate, setStartDate] = useState<Date>(tomorrow);
  const [endDate, setEndDate] = useState<Date>(nextWeek);
  const [location, setLocation] = useState(vehicle.location || '');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [suggestedDates, setSuggestedDates] = useState<{ start: Date; end: Date } | null>(null);
  
  // Calculer le nombre de jours et le prix total
  const durationDays = differenceInDays(endDate, startDate) || 1;
  
  // Gestion robuste du prix selon différentes structures possibles
  const dailyRate = vehicle.price_per_day ?? vehicle.price ?? 0;
  const basePrice = dailyRate * durationDays;
  const serviceFee = Math.round(basePrice * 0.10); // 10% de frais de service
  const totalPrice = basePrice + serviceFee;
  const depositAmount = vehicle.security_deposit || Math.round(basePrice * 0.3); // 30% du prix total par défaut
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      pickupLocation: vehicle.location,
      returnLocation: vehicle.location,
    },
  });

  const calculatePrice = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setTotalDays(diffDays);
  };

  const handleDateSelect = async (start: Date, end: Date) => {
    setIsChecking(true);
    try {
      const availability = await checkVehicleAvailability(
        vehicle.id,
        format(start, "yyyy-MM-dd"),
        format(end, "yyyy-MM-dd")
      );

      if (!availability.isAvailable) {
        toast({
          variant: "destructive",
          title: "Dates non disponibles",
          description: "Le véhicule n'est pas disponible pour ces dates. Veuillez en choisir d'autres.",
        });
        return false;
      }

      calculatePrice(start, end);
      return true;
    } catch (error) {
      console.error("Erreur lors de la vérification de disponibilité:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vérifier la disponibilité. Veuillez réessayer.",
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    setStartDate(date);
    
    // Si la date de fin est avant la nouvelle date de début, ajuster la date de fin
    if (isBefore(endDate, date)) {
      setEndDate(addDays(date, 1));
    }
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return;
    setEndDate(date);
  };
  
  const applyAlternativeDates = () => {
    if (suggestedDates) {
      setStartDate(suggestedDates.start);
      setEndDate(suggestedDates.end);
      setSuggestedDates(null);
      setAvailabilityError(null);
    }
  };
  
  const validateForm = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez choisir des dates de début et de fin",
        variant: "destructive",
      });
      return false;
    }
    
    if (!isAfter(endDate, startDate)) {
      toast({
        title: "Dates invalides",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return false;
    }
    
    if (!location) {
      toast({
        title: "Lieu manquant",
        description: "Veuillez indiquer le lieu de prise en charge",
        variant: "destructive",
      });
      return false;
    }
    
    // Conserver la vérification pour l'erreur de disponibilité
    if (availabilityError) {
      toast({
        title: "Véhicule non disponible",
        description: "Ce véhicule n'est pas disponible pour les dates sélectionnées",
        variant: "destructive",
      });
      return false;
    }
    
    if (!acceptTerms) {
      toast({
        title: "Conditions non acceptées",
        description: "Veuillez accepter les conditions générales",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Non connecté",
        description: "Vous devez être connecté pour effectuer une réservation.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Créer la demande de réservation
      console.log("Création de la réservation avec les données:", data);
      console.log("Utilisateur:", user);
      console.log("Véhicule:", vehicle);
      
      const bookingRequest = {
        vehicleId: vehicle.id,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        pickupLocation: data.pickupLocation,
        returnLocation: data.returnLocation,
        insuranceOption: 'basic' as const // Utiliser l'option de base pour l'instant
      };
      
      console.log("Demande de réservation:", bookingRequest);
      
      const response = await createBookingRequest(bookingRequest);
      
      if (response.success) {
        console.log("Réservation créée avec succès:", response);
        toast({
          title: "Réservation créée",
          description: "Votre réservation a été créée avec succès.",
        });
        
        onSuccess();
      } else {
        console.error("Erreur lors de la création de la réservation:", response.error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: response.error || "Impossible de créer la réservation. Veuillez réessayer.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la réservation. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">Réserver {vehicle.name || `${vehicle.brand} ${vehicle.model}`}</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          {dailyRate.toLocaleString('fr-FR')} MAD par jour · {vehicle.location}
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  if (date) {
                    setValue("startDate", date);
                    if (endDate && date > endDate) {
                      setValue("endDate", date);
                    }
                    handleDateSelect(date, endDate || date);
                  }
                }}
                initialFocus
                disabled={(date) => 
                  isBefore(date, tomorrow) || 
                  (vehicle.unavailable_dates ? vehicle.unavailable_dates.some(d => 
                    format(new Date(d), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  ) : false)
                }
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP', { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  if (date) {
                    setValue("endDate", date);
                    if (startDate && date < startDate) {
                      setValue("startDate", date);
                    }
                    handleDateSelect(startDate || date, date);
                  }
                }}
                initialFocus
                disabled={(date) => 
                  isBefore(date, startDate) || 
                  (vehicle.unavailable_dates ? vehicle.unavailable_dates.some(d => 
                    format(new Date(d), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  ) : false)
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {availabilityError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Véhicule non disponible</AlertTitle>
          <AlertDescription>
            {availabilityError}
            {suggestedDates && (
              <div className="mt-2">
                <p>Dates alternatives disponibles :</p>
                <p className="font-medium">
                  {format(suggestedDates.start, 'PPP', { locale: fr })} - {format(suggestedDates.end, 'PPP', { locale: fr })}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={applyAlternativeDates}
                >
                  Utiliser ces dates
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">Lieu de prise en charge</Label>
        <Input 
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          placeholder="Adresse de prise en charge" 
        />
      </div>
      
      <div className="mt-4 space-y-4">
        <div className="bg-muted p-4 rounded-md">
          <h4 className="font-medium mb-2">Résumé de la réservation</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{dailyRate.toLocaleString('fr-FR')} MAD x {durationDays} jours</span>
              <span>{basePrice.toLocaleString('fr-FR')} MAD</span>
            </div>
            <div className="flex justify-between">
              <span>Frais de service</span>
              <span>{serviceFee.toLocaleString('fr-FR')} MAD</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{totalPrice.toLocaleString('fr-FR')} MAD</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="terms" 
            checked={acceptTerms} 
            onCheckedChange={(checked) => setAcceptTerms(checked === true)} 
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            J'accepte les conditions générales et la politique d'annulation
          </label>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isChecking || isSubmitting} className="flex-1">
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isChecking || isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? "Réservation en cours..." : "Réserver"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingForm; 