import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import * as authBackend from '@/lib/backend/auth'

export type DocumentType = 'driver_license' | 'identity_card' | 'bank_details' | 'vehicle_registration' | 'insurance';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { 
    email: string; 
    password: string; 
    options: { 
      data: { 
        first_name: string; 
        last_name: string;
        role: 'owner' | 'renter';
      } 
    } 
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (data: { first_name?: string; last_name?: string; phone?: string }) => Promise<void>;
  getUserRole: () => Promise<'owner' | 'renter' | 'admin' | null>;
  refreshUser: () => Promise<void>;
  isVerifiedTenant: () => Promise<boolean>;
  isVerifiedHost: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize: Get session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { session } = await authBackend.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // If refresh token is invalid or session expired, ensure we land on login
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || '';
          if (!path.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { user: authUser, error: authError } = await authBackend.signIn({ email, password });
      
      if (authError) {
        const errorMessage = authError.message || 'Failed to sign in';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Erreur de connexion',
          description: errorMessage,
        });
        throw new Error(errorMessage);
      }

      if (authUser) {
        setUser(authUser);
        toast({
          title: 'Connexion réussie',
          description: 'Bienvenue !',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: { 
    email: string; 
    password: string; 
    options: { 
      data: { 
        first_name: string; 
        last_name: string;
        role: 'owner' | 'renter';
      } 
    } 
  }) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { user: authUser, error: authError } = await authBackend.signUp({
        email: data.email,
        password: data.password,
        first_name: data.options.data.first_name,
        last_name: data.options.data.last_name,
        role: data.options.data.role,
      });

      if (authError) {
        const errorMessage = authError.message || 'Failed to sign up';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Erreur d\'inscription',
          description: errorMessage,
        });
        throw new Error(errorMessage);
      }

      if (authUser) {
        setUser(authUser);
        toast({
          title: 'Inscription réussie',
          description: 'Votre compte a été créé avec succès !',
        });
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { error: authError } = await authBackend.signOut();
      
      if (authError) {
        setError(authError.message || 'Failed to sign out');
        throw new Error(authError.message);
      }

      setUser(null);
      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt !',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { user: authUser } = await authBackend.getCurrentUser();
      if (authUser) {
        setUser(authUser);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const updateProfile = async (data: { first_name?: string; last_name?: string; phone?: string }) => {
    if (!user) throw new Error('No user logged in');
    try {
      setError(null);
      setIsLoading(true);
      
      const { profile, error: profileError } = await authBackend.updateProfile(user.id, data);
      
      if (profileError) {
        setError(profileError.message || 'Failed to update profile');
        throw new Error(profileError.message);
      }

      if (profile) {
        toast({
          title: 'Profil mis à jour',
          description: 'Vos informations ont été mises à jour avec succès.',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserRole = async (): Promise<'owner' | 'renter' | 'admin' | null> => {
    if (!user) return null;
    try {
      const role = await authBackend.getUserRole(user.id);
      if (role) {
        console.log('User role retrieved:', role);
        return role;
      }
      // If database query returns null, check metadata as fallback
      const metadataRole = user.user_metadata?.role as 'owner' | 'renter' | 'admin' | 'host' | undefined;
      if (metadataRole) {
        // Map 'host' to 'owner' for backward compatibility
        const normalizedRole = metadataRole === 'host' ? 'owner' : metadataRole;
        console.log('User role from metadata:', normalizedRole);
        return normalizedRole;
      }
      console.warn('No role found for user, defaulting to null');
      return null;
    } catch (err) {
      console.error('Error getting user role:', err);
      // Only use metadata as fallback if we have no other information
      const metadataRole = user.user_metadata?.role as 'owner' | 'renter' | 'admin' | 'host' | undefined;
      // Map 'host' to 'owner' for backward compatibility
      return metadataRole === 'host' ? 'owner' : (metadataRole || null);
    }
  };

  const isVerifiedTenant = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      return await authBackend.isVerifiedTenant(user.id);
    } catch (err) {
      console.error('Error checking verified_tenant:', err);
      return false;
    }
  };

  const isVerifiedHost = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      return await authBackend.isVerifiedHost(user.id);
    } catch (err) {
      console.error('Error checking verified_host:', err);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    getUserRole,
    refreshUser,
    isVerifiedTenant,
    isVerifiedHost,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
