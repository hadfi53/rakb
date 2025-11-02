import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentSheetProps {
  totalAmount: number;
  onSubmit: (paymentData: PaymentData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export const PaymentSheet = ({ totalAmount, onSubmit, isLoading = false, error }: PaymentSheetProps) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateForm = (): boolean => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      setLocalError("Numéro de carte invalide");
      return false;
    }
    if (!expiryDate || expiryDate.length !== 5) {
      setLocalError("Date d'expiration invalide (MM/AA)");
      return false;
    }
    if (!cvv || cvv.length < 3) {
      setLocalError("Code CVV invalide");
      return false;
    }
    if (!cardholderName || cardholderName.length < 3) {
      setLocalError("Nom du titulaire requis");
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const paymentData: PaymentData = {
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv,
      cardholderName,
    };

    try {
      // TODO: Intégration Stripe
      // 1. Créer un PaymentIntent via votre backend
      // 2. Confirmer le paiement avec Stripe
      // 3. Appeler la RPC create_booking_with_payment avec les détails
      
      // Pour l'instant, simulation du processus
      await onSubmit(paymentData);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Erreur lors du paiement");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Informations de paiement
        </CardTitle>
        <CardDescription>
          Paiement sécurisé via notre plateforme. Vos informations sont cryptées.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || localError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cardholderName">Nom du titulaire</Label>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              placeholder="JOHN DOE"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Numéro de carte</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date d'expiration</Label>
              <Input
                id="expiryDate"
                value={expiryDate}
                onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                placeholder="MM/AA"
                maxLength={5}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Montant total</span>
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(totalAmount)}
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Procéder au paiement
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Paiement sécurisé - Vos données sont protégées
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

