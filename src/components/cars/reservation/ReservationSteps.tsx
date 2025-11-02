
import { useState } from "react";
import { 
  Calendar as CalendarIcon, Shield, Info, 
  CreditCard, Tag, CheckCircle, AlertCircle
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

import { VehicleInfoCard } from "./VehicleInfoCard";
import { ReservationSummary } from "./ReservationSummary";
import { InsuranceOption } from "./InsuranceOption";
import { AdditionalOption } from "./AdditionalOption";
import { OptionsReview } from "./OptionsReview";
import { OrderSummary } from "./OrderSummary";
import { PaymentMethod } from "./PaymentMethod";
import { ConfirmationCard, ConfirmationSummary } from "./ConfirmationCard";

// Shared data
import { insuranceOptions, additionalOptions, paymentMethods } from "../ReservationDialog";

interface ReservationStepsProps {
  currentStep: number;
  car: any;
  startDate?: Date;
  endDate?: Date;
  setStartDate: (date?: Date) => void;
  setEndDate: (date?: Date) => void;
  selectedInsurance: string;
  setSelectedInsurance: (value: string) => void;
  selectedOptions: string[];
  setSelectedOptions: (options: string[]) => void;
  formData: {
    fullName: string;
    email: string;
    phone: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedPayment: string;
  setSelectedPayment: (value: string) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoApplied: boolean;
  setPromoApplied: (applied: boolean) => void;
  calculateTotal: () => number;
  handleSubmit: () => void;
}

export const ReservationSteps = ({
  currentStep,
  car,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedInsurance,
  setSelectedInsurance,
  selectedOptions,
  setSelectedOptions,
  formData,
  handleInputChange,
  selectedPayment,
  setSelectedPayment,
  promoCode,
  setPromoCode,
  promoApplied,
  setPromoApplied,
  calculateTotal,
  handleSubmit
}: ReservationStepsProps) => {
  const isMobile = useIsMobile();
  
  const toggleOption = (optionId: string) => {
    setSelectedOptions(
      selectedOptions.includes(optionId) 
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId]
    );
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === "WELCOME") {
      setPromoApplied(true);
      toast.success("Code promo appliqué ! -10% sur votre réservation");
    } else {
      toast.error("Code promo invalide");
      setPromoCode("");
    }
  };

  const getSelectedInsurance = () => {
    return insuranceOptions.find(ins => ins.id === selectedInsurance);
  };

  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-4">
          <VehicleInfoCard car={car} />

          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Dates de location
            </h3>
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'sm:grid-cols-2 gap-4'}`}>
              <div>
                <Label className="text-sm text-gray-600">Début</Label>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  className={`rounded-md border ${isMobile ? 'w-full' : ''}`}
                  disabled={(date) => date < new Date()}
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600">Fin</Label>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  className={`rounded-md border ${isMobile ? 'w-full' : ''}`}
                  disabled={(date) => !startDate || date < startDate}
                />
              </div>
            </div>
          </div>

          {startDate && endDate && (
            <ReservationSummary 
              startDate={startDate}
              endDate={endDate}
              car={car}
              calculateTotal={calculateTotal}
              promoApplied={promoApplied}
            />
          )}
        </div>
      );

    case 2:
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Options d'assurance
            </h3>
            <RadioGroup
              value={selectedInsurance}
              onValueChange={setSelectedInsurance}
              className="space-y-3"
            >
              {insuranceOptions.map((option) => (
                <InsuranceOption 
                  key={option.id} 
                  option={option} 
                  selected={selectedInsurance === option.id} 
                />
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Options supplémentaires
            </h3>
            <div className="space-y-2">
              {additionalOptions.map((option) => (
                <AdditionalOption 
                  key={option.id}
                  option={option}
                  selected={selectedOptions.includes(option.id)}
                  onToggle={toggleOption}
                />
              ))}
            </div>
          </div>

          <OptionsReview 
            selectedInsurance={getSelectedInsurance()}
            selectedOptions={selectedOptions}
            additionalOptions={additionalOptions}
            calculateTotal={calculateTotal}
            promoApplied={promoApplied}
          />
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Informations personnelles
            </h3>
            <div className="grid gap-3">
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'sm:grid-cols-2 gap-4'}`}>
                <div className="space-y-1">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Votre nom complet"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Votre numéro"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <Label>Code promo</Label>
            </div>
            <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
              <Input
                placeholder="Ex: WELCOME"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={promoApplied}
              />
              <Button 
                variant="outline"
                onClick={applyPromoCode}
                className={`whitespace-nowrap ${isMobile ? 'w-full' : ''}`}
                disabled={promoApplied || !promoCode}
              >
                Appliquer
              </Button>
            </div>
            {promoApplied && (
              <div className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>Code promo WELCOME appliqué : -10%</span>
              </div>
            )}
          </div>
          
          <OrderSummary 
            car={car}
            startDate={startDate}
            endDate={endDate}
            selectedInsurance={getSelectedInsurance()}
            selectedOptions={selectedOptions}
            additionalOptions={additionalOptions}
            promoApplied={promoApplied}
            calculateTotal={calculateTotal}
          />
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Méthode de paiement
            </h3>
            <RadioGroup
              value={selectedPayment}
              onValueChange={setSelectedPayment}
              className="space-y-2"
            >
              {paymentMethods.map((method) => (
                <PaymentMethod 
                  key={method.id}
                  method={method}
                  selected={selectedPayment === method.id}
                />
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cardNumber">Numéro de carte</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  required
                />
                <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
              <div className="space-y-1">
                <Label htmlFor="expiry">Date d'expiration</Label>
                <Input
                  id="expiry"
                  name="expiry"
                  placeholder="MM/AA"
                  value={formData.expiry}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  name="cvv"
                  type="password"
                  maxLength={3}
                  placeholder="123"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="terms" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
              <label htmlFor="terms" className="text-sm text-gray-600">
                J'accepte les <a href="#" className="text-primary hover:underline">conditions générales</a> et la <a href="#" className="text-primary hover:underline">politique de confidentialité</a>
              </label>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Politique d'annulation</p>
                <p>Gratuite jusqu'à 48h avant le début de la location. Des frais peuvent s'appliquer en cas d'annulation tardive.</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/5 space-y-2">
            <div className="flex items-center justify-between text-base font-bold text-primary">
              <span>Montant total à payer</span>
              <span>{calculateTotal()} Dh</span>
            </div>
            <p className="text-xs text-gray-500">
              Une caution de {getSelectedInsurance()?.caution || 0} Dh sera préautorisée sur votre carte bancaire mais non débitée.
            </p>
          </div>
        </div>
      );

    case 5:
      return (
        <div className="space-y-4">
          <ConfirmationSummary email={formData.email} />
          <ConfirmationCard 
            car={car}
            startDate={startDate}
            endDate={endDate}
            email={formData.email}
            total={calculateTotal()}
          />
          <div className="text-sm text-gray-600 text-center">
            <p>Besoin d'aide ? <a href="#" className="text-primary hover:underline">Contactez-nous</a></p>
            <p className="mt-1">Ou consultez vos <a href="#" className="text-primary hover:underline">réservations</a></p>
          </div>
        </div>
      );

    default:
      return null;
  }
};
