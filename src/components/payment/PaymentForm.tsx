import { DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaymentFormProps {
  amount: number;
  onSuccess: (response: PaymentResponse) => void;
  onError: (error: string) => void;
  className?: string;
}

interface PaymentResponse {
  success: boolean;
  payment_id: string;
  payment_method_id: string;
  transaction_id: string;
  status: string;
  payment_method?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last_four: string;
  is_default: boolean;
  card_type?: string;
}

interface FormData {
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvc: string;
  save_payment_method: boolean;
}

const formatCardNumber = (value: string): string => {
  const v = value.replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < v.length; i += 4) {
    parts.push(v.slice(i, i + 4));
  }
  return parts.join(' ');
};

const detectCardType = (cardNumber: string): string => {
  const number = cardNumber.replace(/\D/g, '');
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  return 'unknown';
};

const validateForm = (data: FormData): Partial<FormData> => {
  const errors: Partial<FormData> = {};
  if (!data.card_number.replace(/\s/g, '').match(/^\d{16}$/)) {
    errors.card_number = 'Invalid card number';
  }
  if (!data.expiry_month.match(/^(0[1-9]|1[0-2])$/)) {
    errors.expiry_month = 'Invalid month';
  }
  if (!data.expiry_year.match(/^\d{2}$/)) {
    errors.expiry_year = 'Invalid year';
  }
  if (!data.cvc.match(/^\d{3,4}$/)) {
    errors.cvc = 'Invalid CVC';
  }
  return errors;
};

export const PaymentForm = ({
  amount,
  onSuccess,
  onError,
  className
}: PaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [newMethod, setNewMethod] = useState<string>('card');
  const [formData, setFormData] = useState<FormData>({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvc: '',
    save_payment_method: false
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [cardType, setCardType] = useState<string>('unknown');

  const handleCardNumberChange = (e: { target: { value: string } }) => {
    const formattedValue = formatCardNumber(e.target.value);
    setFormData(prev => ({ ...prev, card_number: formattedValue }));
    setCardType(detectCardType(formattedValue));
  };

  const handleExpiryMonthChange = (e: { target: { value: string } }) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setFormData(prev => ({ ...prev, expiry_month: value }));
  };

  const handleExpiryYearChange = (e: { target: { value: string } }) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setFormData(prev => ({ ...prev, expiry_year: value }));
  };

  const handleCVCChange = (e: { target: { value: string } }) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({ ...prev, cvc: value }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    
    // Valider le formulaire
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      onError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock payment processing - utiliser les données Stripe de test
      const cardNumber = formData.card_number.replace(/\s/g, '');
      
      // Vérifier que c'est une carte de test Stripe valide
      if (!cardNumber.match(/^(4242|4000|5555|2222)/)) {
        throw new Error('Numéro de carte invalide. Utilisez une carte de test Stripe (4242 4242 4242 4242)');
      }
      
      // Pass card data to success callback for Stripe processing
      // Note: In production, use Stripe Elements for secure card collection
      const response: PaymentResponse = {
        success: true,
        payment_id: `pm_${Date.now()}`,
        payment_method_id: `pm_${Date.now()}`,
        transaction_id: `txn_${Date.now()}`,
        status: 'completed',
        payment_method: 'card',
        // Include card data for Stripe processing (will be used server-side)
        cardNumber: cardNumber,
        expiryDate: `${formData.expiry_month}/${formData.expiry_year}`,
        cvv: formData.cvc,
        cardholderName: formData.cardholderName || 'Cardholder',
      };
      
      onSuccess(response);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {savedMethods.length > 0 && (
              <RadioGroup
                value={selectedMethod}
                onValueChange={setSelectedMethod}
                className="space-y-2"
              >
                {savedMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id}>
                      {method.card_type} **** {method.last_four}
                      {method.is_default && " (Default)"}
                    </Label>
                  </div>
                ))}
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">Use a new card</Label>
                </div>
              </RadioGroup>
            )}

            {(!savedMethods.length || selectedMethod === 'new') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card_number">Card number</Label>
                  <Input
                    id="card_number"
                    value={formData.card_number}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry_month">Month</Label>
                    <Input
                      id="expiry_month"
                      value={formData.expiry_month}
                      onChange={handleExpiryMonthChange}
                      placeholder="MM"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_year">Year</Label>
                    <Input
                      id="expiry_year"
                      value={formData.expiry_year}
                      onChange={handleExpiryYearChange}
                      placeholder="YY"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      value={formData.cvc}
                      onChange={handleCVCChange}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="save_card"
                    checked={formData.save_payment_method}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setFormData(prev => ({ ...prev, save_payment_method: checked === true }))
                    }
                  />
                  <Label htmlFor="save_card">Save card for future payments</Label>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Amount to pay:</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pay ${amount.toFixed(2)}
                </span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 