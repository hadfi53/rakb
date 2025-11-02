import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'renter' | 'owner' | 'admin';
export type Language = 'fr' | 'en' | 'ar';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type DocumentType =
  | 'identity'
  | 'identity_card'
  | 'driver_license'
  | 'proof_of_address'
  | 'vehicle_registration'
  | 'insurance'
  | 'technical_inspection'
  | 'business_premises_photo'
  | 'trade_register';
export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export interface Address {
  id?: string;
  user_id?: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface BankInformation {
  iban: string;
  bic: string;
  accountHolder: string;
}

export interface UserStats {
  total_rentals: number;
  rating: number;
  rating_count: number;
  reservation_compliance: number;
  acceptance_rate: number;
}

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_path: string;
  file_url: string;
  status: DocumentStatus;
  verification_notes?: string;
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  email_verified?: boolean;
  phone_verified?: boolean;
  verified_tenant?: boolean;
  verified_host?: boolean;
  birthdate?: string;
  address?: Address;
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface SocialMediaProfile {
  platform: 'linkedin' | 'instagram' | 'facebook';
  url: string;
  verified: boolean;
}

export interface UserReview {
  id: string;
  reviewer_id: string;
  reviewer: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  rating: number;
  comment: string;
  created_at: string;
  rental_id?: string;
}

export interface AppUser {
  id: string;
  email: string;
  user_metadata: {
    role?: UserRole;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string; role: UserRole }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUserRole: () => Promise<UserRole | null>;
  updateUserRole: (role: UserRole) => Promise<void>;
  hasRequiredDocuments: (role: UserRole) => Promise<boolean>;
}
