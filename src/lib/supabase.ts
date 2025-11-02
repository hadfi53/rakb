import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Environment variables are required - no fallbacks for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  const errorMsg = 'Missing VITE_SUPABASE_URL environment variable. Please check your .env file.';
  if (import.meta.env.DEV) {
    console.error('❌', errorMsg);
    console.error('📝 Create a .env file in the project root with:');
    console.error('   VITE_SUPABASE_URL=your_supabase_url');
  }
  throw new Error(errorMsg);
}
if (!supabaseKey) {
  const errorMsg = 'Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.';
  if (import.meta.env.DEV) {
    console.error('❌', errorMsg);
    console.error('📝 Add to your .env file:');
    console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  }
  throw new Error(errorMsg);
}

// Configuration robuste du client Supabase avec des options améliorées
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  }
})

// Amélioration des en-têtes pour toutes les requêtes
const originalFetch = supabase.rest.fetcher;
supabase.rest.fetcher = (url, options) => {
  options.headers = options.headers || {};
  
  // Ajouter l'en-tête Accept s'il n'existe pas déjà
  if (!options.headers['Accept']) {
    options.headers['Accept'] = 'application/json';
  }
  
  // Appeler la fonction fetch originale
  return originalFetch(url, options);
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown) => {
  if (error instanceof Error) {
    console.error('Supabase error:', error.message);
    return error.message;
  }
  console.error('Unknown error:', error);
  return 'Une erreur inattendue est survenue';
};

// Types for common Supabase responses
export type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Utility function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Auth check error:', error.message);
    return false;
  }
  return !!session;
};

// Utility function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Get user error:', error.message);
    return null;
  }
  return user;
};

// Fonction pour effacer complètement la session et la recréer
export const clearAuthSession = async () => {
  try {
    // Se déconnecter proprement
    await supabase.auth.signOut({ scope: 'local' });
    
    // Supprimer les données d'authentification du localStorage
    window.localStorage.removeItem('supabase.auth.token');
    
    // Autres clés potentielles
    const keys = Object.keys(window.localStorage);
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('auth') || key.includes('rakeb')) {
        window.localStorage.removeItem(key);
      }
    });
    
    console.log('Auth session cleared successfully');
    return true;
  } catch (err) {
    console.error('Failed to clear auth session:', err);
    return false;
  }
};