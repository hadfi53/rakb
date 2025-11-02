import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Vehicle } from '@/types';
import { useBooking } from '@/hooks/use-booking';
import { BookingRequest, InsuranceOption } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, MapPin, Shield, CreditCard, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { moroccanCities } from '@/lib/data/moroccan-cities';

interface BookingFormProps {
  vehicle: Vehicle;
  initialDates?: DateRange;
  onBookingSuccess?: (bookingId: string) => void;
}

export const BookingForm = ({ vehicle, initialDates, onBookingSuccess }: BookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, createBookingRequest } = useBooking({
    onSuccess: (booking) => {
      if (onBookingSuccess) {
        onBookingSuccess(booking.id);
      }
    }
  });
  
  // État pour le formulaire
  const [dates, setDates] = useState<DateRange | undefined>(
    initialDates || {
      from: new Date(),
      to: addDays(new Date(), 3)
    }
  );
  
  const [pickupLocation, setPickupLocation] = useState<string>(vehicle.location || '');
  const [returnLocation, setReturnLocation] = useState<string>(vehicle.location || '');
  const [insuranceOption, setInsuranceOption] = useState<InsuranceOption>('basic');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [terms, setTerms] = useState(false);
  
  // Calcul des détails du prix
  const daysCount = dates?.from && dates?.to 
    ? differenceInDays(dates.to, dates.from) + 1 
    : 0;
  
  const basePrice = vehicle.price_per_day * daysCount;
  
  // Calcul des frais d'assurance
  let insuranceFee = 0;
  if (insuranceOption === 'premium') {
    insuranceFee = daysCount * 100; // 100 MAD/jour
  } else if (insuranceOption === 'standard') {
    insuranceFee = daysCount * 50; // 50 MAD/jour
  }
  
  // Frais de service (10%)
  const serviceFee = basePrice * 0.10;
  
  // Total
  const totalPrice = basePrice + insuranceFee + serviceFee;
  
  // Gestion des erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!dates?.from || !dates?.to) {
      newErrors.dates = "Veuillez sélectionner des dates de location";
    }
    
    if (!pickupLocation) {
      newErrors.pickupLocation = "Veuillez spécifier un lieu de prise en charge";
    }
    
    if (!returnLocation) {
      newErrors.returnLocation = "Veuillez spécifier un lieu de retour";
    }
    
    if (showPaymentDetails) {
      if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = "Numéro de carte invalide";
      }
      
      if (!cardHolder) {
        newErrors.cardHolder = "Nom du titulaire requis";
      }
      
      if (!expiryDate || !expiryDate.includes('/')) {
        newErrors.expiryDate = "Date d'expiration invalide";
      }
      
      if (!cvv || cvv.length < 3) {
        newErrors.cvv = "CVV invalide";
      }
    }
    
    if (!terms) {
      newErrors.terms = "Veuillez accepter les conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return value;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth/login', { 
        state: { 
          redirectTo: `/cars/${vehicle.id}`,
          message: "Connectez-vous pour réserver ce véhicule" 
        } 
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    if (!dates?.from || !dates?.to) {
      return;
    }
    
    const bookingRequest: BookingRequest = {
      vehicleId: vehicle.id,
      startDate: dates.from.toISOString(),
      endDate: dates.to.toISOString(),
      pickupLocation,
      returnLocation,
      insuranceOption
    };
    
    const response = await createBookingRequest(bookingRequest);
    
    if (response.success) {
      setShowPaymentDetails(false);
      
      // Redirection vers la page de réservation
      if (response.bookingId) {
        navigate(`/bookings/${response.bookingId}`);
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Réservation de véhicule</CardTitle>
        <CardDescription>
          Complétez les informations pour réserver {vehicle.make} {vehicle.model}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection des dates */}
          <div className="space-y-2">
            <Label htmlFor="dates">Dates de location</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dates && "text-muted-foreground",
                    errors.dates && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dates?.from ? (
                    dates.to ? (
                      <>
                        {format(dates.from, "P", { locale: fr })} -{" "}
                        {format(dates.to, "P", { locale: fr })}
                        <span className="ml-2 text-muted-foreground">
                          ({daysCount} jour{daysCount > 1 ? "s" : ""})
                        </span>
                      </>
                    ) : (
                      format(dates.from, "P", { locale: fr })
                    )
                  ) : (
                    <span>Sélectionner les dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dates?.from}
                  selected={dates}
                  onSelect={setDates}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date()}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {errors.dates && (
              <p className="text-sm text-destructive">{errors.dates}</p>
            )}
          </div>
          
          {/* Lieu de prise en charge */}
          <div className="space-y-2">
            <Label htmlFor="pickupLocation">Lieu de prise en charge</Label>
            <div className="flex space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground self-center" />
              <Select 
                value={pickupLocation} 
                onValueChange={setPickupLocation}
              >
                <SelectTrigger 
                  className={cn(
                    "flex-1",
                    errors.pickupLocation && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Sélectionner un lieu" />
                </SelectTrigger>
                <SelectContent>
                  {moroccanCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.pickupLocation && (
              <p className="text-sm text-destructive">{errors.pickupLocation}</p>
            )}
          </div>
          
          {/* Lieu de retour */}
          <div className="space-y-2">
            <Label htmlFor="returnLocation">Lieu de retour</Label>
            <div className="flex space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground self-center" />
              <Select 
                value={returnLocation} 
                onValueChange={setReturnLocation}
              >
                <SelectTrigger 
                  className={cn(
                    "flex-1",
                    errors.returnLocation && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Sélectionner un lieu" />
                </SelectTrigger>
                <SelectContent>
                  {moroccanCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.returnLocation && (
              <p className="text-sm text-destructive">{errors.returnLocation}</p>
            )}
          </div>
          
          {/* Options d'assurance */}
          <div className="space-y-2">
            <Label>Options d'assurance</Label>
            <RadioGroup 
              value={insuranceOption} 
              onValueChange={(value) => setInsuranceOption(value as InsuranceOption)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic" className="flex-1 cursor-pointer">
                  <div className="font-medium">Basique</div>
                  <div className="text-sm text-muted-foreground">
                    Protection contre les dommages et la responsabilité civile
                  </div>
                </Label>
                <div className="font-medium text-right">Inclus</div>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="flex-1 cursor-pointer">
                  <div className="font-medium">Standard</div>
                  <div className="text-sm text-muted-foreground">
                    Protection améliorée incluant le vol et la crevaison
                  </div>
                </Label>
                <div className="font-medium text-right">+50 MAD/jour</div>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value="premium" id="premium" />
                <Label htmlFor="premium" className="flex-1 cursor-pointer">
                  <div className="font-medium">Premium</div>
                  <div className="text-sm text-muted-foreground">
                    Protection complète sans franchise
                  </div>
                </Label>
                <div className="font-medium text-right">+100 MAD/jour</div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Récapitulatif du prix */}
          <div className="space-y-2 pt-2">
            <h3 className="font-medium">Détails du prix</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{vehicle.price_per_day} MAD × {daysCount} jours</span>
                <span>{basePrice.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Assurance {insuranceOption}</span>
                <span>{insuranceFee.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de service</span>
                <span>{serviceFee.toLocaleString()} MAD</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{totalPrice.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs mt-1">
                <span>Dépôt de garantie (remboursable)</span>
                <span>5000 MAD</span>
              </div>
            </div>
            
            <div className="flex items-center mt-4 border rounded-md p-3 bg-muted/50">
              <Info className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Le paiement n'est pas débité immédiatement. Votre carte sera 
                préautorisée et le paiement sera effectué uniquement après 
                l'acceptation de la demande par le propriétaire.
              </p>
            </div>
          </div>
          
          {showPaymentDetails && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium">Informations de paiement</h3>
              
              {/* Numéro de carte */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Numéro de carte</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    className={cn(
                      "pl-10",
                      errors.cardNumber && "border-destructive"
                    )}
                    maxLength={19}
                  />
                </div>
                {errors.cardNumber && (
                  <p className="text-sm text-destructive">{errors.cardNumber}</p>
                )}
              </div>
              
              {/* Nom du titulaire */}
              <div className="space-y-2">
                <Label htmlFor="cardHolder">Titulaire de la carte</Label>
                <Input
                  id="cardHolder"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Prénom Nom"
                  className={errors.cardHolder ? "border-destructive" : ""}
                />
                {errors.cardHolder && (
                  <p className="text-sm text-destructive">{errors.cardHolder}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Date d'expiration */}
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Date d'expiration</Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    placeholder="MM/AA"
                    className={errors.expiryDate ? "border-destructive" : ""}
                    maxLength={5}
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-destructive">{errors.expiryDate}</p>
                  )}
                </div>
                
                {/* CVV */}
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    className={errors.cvv ? "border-destructive" : ""}
                    maxLength={4}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-destructive">{errors.cvv}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Conditions */}
          <div className="flex items-start space-x-2 pt-4">
            <input
              type="checkbox"
              id="terms"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm">
              J'accepte les <a href="/legal" className="text-primary hover:underline">conditions d'utilisation</a>, la <a href="/legal/privacy" className="text-primary hover:underline">politique de confidentialité</a> et les <a href="/legal/insurance" className="text-primary hover:underline">conditions d'assurance</a>.
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-destructive mt-1">{errors.terms}</p>
          )}
          
          {!showPaymentDetails ? (
            <Button 
              type="button" 
              className="w-full" 
              onClick={() => setShowPaymentDetails(true)}
              disabled={!dates?.from || !dates?.to || !pickupLocation || !returnLocation}
            >
              Continuer vers le paiement
            </Button>
          ) : (
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Traitement en cours..." : "Demander une réservation"}
            </Button>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Shield className="h-4 w-4 mr-1" />
          Paiement sécurisé via notre plateforme
        </div>
      </CardFooter>
    </Card>
  );
}; 