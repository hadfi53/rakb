import { UserRole } from '@/types/user';

/**
 * Retourne la route de dashboard appropriée selon le rôle de l'utilisateur
 * Maps 'host' to 'owner' for backward compatibility
 * @param role - Le rôle de l'utilisateur
 * @returns La route vers le dashboard correspondant
 */
export const getDashboardRouteByRole = (role: UserRole | 'host' | 'proprietaire' | 'locataire' | null): string => {
  // Map database roles to code roles
  // DB: 'host', 'proprietaire' → Code: 'owner'
  // DB: 'locataire', 'renter' → Code: 'renter'
  let normalizedRole: UserRole | null = null;
  
  if (role === 'host' || role === 'proprietaire' || role === 'owner') {
    normalizedRole = 'owner';
  } else if (role === 'locataire' || role === 'renter') {
    normalizedRole = 'renter';
  } else if (role === 'admin') {
    normalizedRole = 'admin';
  }
  
  switch (normalizedRole) {
    case 'renter':
      return '/dashboard/renter';
    case 'owner':
      return '/dashboard/owner';
    case 'admin':
      return '/admin/users'; // Page admin principale
    default:
      return '/'; // Page d'accueil par défaut si aucun rôle
  }
};

