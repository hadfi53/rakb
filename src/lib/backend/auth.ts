import { supabase } from '@/lib/supabase';
import type { User, AuthError } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'owner' | 'renter';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'owner' | 'renter' | 'admin';
  verified_tenant: boolean;
  verified_host: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Sign up a new user and create their profile
 */
export const signUp = async (data: SignUpData): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
        },
      },
    });

    if (signUpError) {
      return { user: null, error: signUpError };
    }

    if (!authData.user) {
      return { user: null, error: { message: 'Failed to create user', name: 'AuthError' } as AuthError };
    }

    // Profile is automatically created by handle_new_user trigger
    // Wait a moment for the trigger to complete, then verify profile exists
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (profileCheckError) {
      console.error('Profile verification error:', profileCheckError);
      // Even if check fails, return success as trigger should have created it
    }

    return { user: authData.user, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      user: null,
      error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
    };
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (data: SignInData): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      return { user: null, error: signInError };
    }

    return { user: authData.user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      user: null,
      error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
    };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
    };
  }
};

/**
 * Get the current user session
 */
export const getSession = async (): Promise<{ session: any; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      session: null,
      error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
    };
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    return { user: data.user, error };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      user: null,
      error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
    };
  }
};

/**
 * Get user profile from profiles table
 */
export const getProfile = async (userId: string): Promise<{ profile: Profile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data as Profile, error: null };
  } catch (error) {
    console.error('Get profile error:', error);
    return { profile: null, error };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<{ profile: Profile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error };
    }

    return { profile: data as Profile, error: null };
  } catch (error) {
    console.error('Update profile error:', error);
    return { profile: null, error };
  }
};

/**
 * Get user role from profile
 * Maps 'host' to 'owner' for backward compatibility
 */
export const getUserRole = async (userId: string): Promise<'owner' | 'renter' | 'admin' | null> => {
  try {
    const { profile, error } = await getProfile(userId);
    if (error) {
      console.error('Error fetching profile for role:', error);
      return null;
    }
    if (!profile) {
      console.warn('Profile not found for user:', userId);
      return null;
    }
    console.log('User role from profile:', profile.role, 'for user:', userId);
    
    // Map database roles to code roles
    // DB roles: 'host', 'proprietaire', 'locataire', 'renter', 'admin'
    // Code roles: 'owner', 'renter', 'admin'
    const role = profile.role;
    
    // Map proprietaires/hosts to owner
    if (role === 'host' || role === 'proprietaire' || role === 'owner') {
      return 'owner';
    }
    
    // Map locataires to renter
    if (role === 'locataire' || role === 'renter') {
      return 'renter';
    }
    
    // Admin stays admin
    if (role === 'admin') {
      return 'admin';
    }
    
    // Default fallback
    return null;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
};

/**
 * Check if user is verified tenant
 */
export const isVerifiedTenant = async (userId: string): Promise<boolean> => {
  try {
    const { profile } = await getProfile(userId);
    return profile?.verified_tenant || false;
  } catch (error) {
    console.error('Check verified tenant error:', error);
    return false;
  }
};

/**
 * Check if user is verified host
 */
export const isVerifiedHost = async (userId: string): Promise<boolean> => {
  try {
    const { profile } = await getProfile(userId);
    return profile?.verified_host || false;
  } catch (error) {
    console.error('Check verified host error:', error);
    return false;
  }
};

/**
 * Reset password - send reset email
 */
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/change-password`,
    });
    return { error };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
    };
  }
};

/**
 * Update password
 */
export const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      error: { message: 'An unexpected error occurred', name: 'AuthError' } as AuthError,
    };
  }
};

