import { useState, FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Lock, AlertCircle, Loader2 } from "lucide-react";
import { createPaymentIntent, getStripe } from "@/lib/payment/stripe";

// Initialize Stripe
const stripePromise = getStripe();

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (response: { paymentIntentId: string; paymentMethodId: string }) => void;
  onError: (error: string) => void;
  bookingData?: {
    car_id: string;
    user_id: string;
    host_id: string;
    start_date: string;
    end_date: string;
    pickup_location: string;
    return_location?: string;
    total_amount: number;
    caution_amount: number;
    message?: string;
  };
  userInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  className?: string;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    invalid: {
      color: "#9e2146",
    },
  },
  hidePostalCode: true,
};

const PaymentFormContent = ({
  amount,
  onSuccess,
  onError,
  bookingData,
  userInfo,
}: Omit<StripePaymentFormProps, "className">) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe n'est pas encore chargé. Veuillez réessayer.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Le formulaire de carte n'est pas disponible.");
      return;
    }

    if (!cardholderName || cardholderName.trim().length < 3) {
      setError("Veuillez entrer le nom du titulaire de la carte.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create Payment Intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        amount,
        currency: "mad",
        metadata: bookingData
          ? {
              booking_id: bookingData.car_id,
              user_id: bookingData.user_id,
              host_id: bookingData.host_id,
              start_date: bookingData.start_date,
              end_date: bookingData.end_date,
              total_amount: bookingData.total_amount.toString(),
            }
          : {},
        customerEmail: userInfo?.email,
        customerName: userInfo?.name,
      });

      if (!clientSecret) {
        throw new Error("Impossible de créer l'intention de paiement.");
      }

      // Step 2: Create Payment Method from card element
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: cardholderName,
          email: userInfo?.email,
          phone: userInfo?.phone,
        },
      });

      if (pmError || !paymentMethod) {
        throw new Error(pmError?.message || "Impossible de créer la méthode de paiement.");
      }

      // Step 3: Confirm Payment Intent with Payment Method
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || "Le paiement a échoué.");
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentMethod.id,
        });
      } else {
        throw new Error(`Le statut du paiement est: ${paymentIntent?.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue lors du paiement.";
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="cardholderName">Nom du titulaire de la carte</Label>
        <Input
          id="cardholderName"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          placeholder="JOHN DOE"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-element">Informations de la carte</Label>
        <div className="border rounded-md p-3 bg-white">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium">Montant total</span>
          <span className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat("fr-MA", {
              style: "currency",
              currency: "MAD",
            }).format(amount)}
          </span>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !stripe} size="lg">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Procéder au paiement
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Paiement sécurisé par Stripe - Vos données sont protégées
      </p>
      {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') && (
        <Alert className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Mode test activé - Utilisez la carte de test: <strong>4242 4242 4242 4242</strong>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
};

export const StripePaymentForm = ({
  amount,
  onSuccess,
  onError,
  bookingData,
  userInfo,
  className,
}: StripePaymentFormProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Informations de paiement
        </CardTitle>
        <CardDescription>
          Paiement sécurisé via Stripe. Vos informations de carte sont directement transmises à Stripe et ne sont jamais stockées sur nos serveurs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise}>
          <PaymentFormContent
            amount={amount}
            onSuccess={onSuccess}
            onError={onError}
            bookingData={bookingData}
            userInfo={userInfo}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};

