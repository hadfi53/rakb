import { DollarSign, Wallet, CreditCard } from 'lucide-react';

export type PaymentMethodType = 'card' | 'wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'credit_card',
    name: 'Credit Card',
    icon: CreditCard,
    description: 'Paiement sécurisé par carte bancaire'
  },
  {
    id: 'inwi_money',
    name: 'Inwi Money',
    icon: Wallet,
    description: 'Paiement via Inwi Money'
  },
  {
    id: 'western_union',
    name: 'Western Union',
    icon: DollarSign,
    description: 'Paiement via Western Union'
  }
];

export interface UserPaymentMethod {
  id: string;
  user_id: string;
  type: PaymentMethodType;
  provider_payment_method_id: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id?: string;
  user_id: string;
  payment_method_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider_payment_id?: string;
  provider_payment_data?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentFormData {
  payment_method_id?: string;
  payment_method?: PaymentMethodType;
  card_number?: string;
  expiry_month?: number;
  expiry_year?: number;
  cvc?: string;
  save_payment_method?: boolean;
}

export interface PaymentResponse {
  success: boolean;
  payment_id?: string;
  payment_method_id?: string;
  error?: string;
  transaction_id?: string;
  status: PaymentStatus;
} 