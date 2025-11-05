import { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserRole } from '@/types/user';
import { supabase, isAuthenticated, clearAuthSession } from '@/lib/supabase';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, getUserRole, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        if (!user) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // Vérification rapide pour les routes qui acceptent tous les rôles authentifiés
        // Pas besoin de vérifications complexes pour profile, settings, notifications, etc.
        if (allowedRoles.length === 3 && allowedRoles.includes('renter') && 
            allowedRoles.includes('owner') && allowedRoles.includes('admin')) {
          // Route accessible à tous les utilisateurs authentifiés (profile, settings, notifications, etc.)
          if (isMounted) {
            setHasAccess(true);
            setIsLoading(false);
          }
          return;
        }

        // Vérification rapide avec les métadonnées utilisateur pour éviter les appels Supabase inutiles
        const metadataRoleRaw = user.user_metadata?.role as string;
        // Map database roles to code roles
        let metadataRole: UserRole | null = null;
        if (metadataRoleRaw === 'host' || metadataRoleRaw === 'proprietaire' || metadataRoleRaw === 'owner') {
          metadataRole = 'owner';
        } else if (metadataRoleRaw === 'locataire' || metadataRoleRaw === 'renter') {
          metadataRole = 'renter';
        } else if (metadataRoleRaw === 'admin') {
          metadataRole = 'admin';
        }
        
        if (metadataRole && allowedRoles.includes(metadataRole)) {
          // Si le rôle est dans les rôles autorisés et qu'on n'a pas besoin de vérification spéciale
          const needsSpecialVerification = (allowedRoles.length === 1 && 
            (allowedRoles[0] === 'owner' || allowedRoles[0] === 'renter'));
          
          if (!needsSpecialVerification) {
            // Pas besoin de vérification spéciale (vérification des documents), accorder l'accès immédiatement
            if (isMounted) {
              setHasAccess(true);
              setIsLoading(false);
            }
            return;
          }
        }

        // Pour les routes mixtes (renter + owner), vérifier rapidement avec getUserRole
        if (allowedRoles.length === 2 && allowedRoles.includes('renter') && allowedRoles.includes('owner')) {
          try {
            const userRole = await getUserRole();
            if (userRole && allowedRoles.includes(userRole)) {
              if (isMounted) {
                setHasAccess(true);
                setIsLoading(false);
              }
              return;
            }
          } catch (error) {
            console.error('Error getting user role:', error);
            // Continuer avec la vérification complète en cas d'erreur
          }
        }

        // Continuer avec la vérification complète pour les routes spéciales
        console.log('User metadata role:', metadataRole);
        try {
          // Récupérer le profil directement depuis la table profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile in RoleRoute:', profileError);
            throw profileError;
          }

          // Vérifier si des données valides ont été renvoyées
          if (profileData && profileData.id) {
            const profile = profileData;
            const profileRoleRaw = profile.role as string;
            
            // Map database roles to code roles
            let profileRole: UserRole | null = null;
            if (profileRoleRaw === 'host' || profileRoleRaw === 'proprietaire' || profileRoleRaw === 'owner') {
              profileRole = 'owner';
            } else if (profileRoleRaw === 'locataire' || profileRoleRaw === 'renter') {
              profileRole = 'renter';
            } else if (profileRoleRaw === 'admin') {
              profileRole = 'admin';
            }
            
            console.log('Profile retrieved in RoleRoute:', profile);
            console.log('Checking if role', profileRole, 'is in allowed roles:', allowedRoles);

            // Si le rôle du profil est dans les rôles autorisés, accorder l'accès
            if (profileRole && allowedRoles.includes(profileRole)) {
              // Vérifications supplémentaires selon les règles métier RAKB
              const isOwnerOnlyRoute = allowedRoles.length === 1 && allowedRoles[0] === 'owner';
              const isRenterOnlyRoute = allowedRoles.length === 1 && allowedRoles[0] === 'renter';

              // Récupérer les drapeaux de vérification depuis profiles
              const { data: profileRow } = await supabase
                .from('profiles')
                .select('id, role, verified_host, verified_tenant')
                .eq('id', user.id)
                .single();

              const verifiedHost = Boolean((profileRow as any)?.verified_host);
              const verifiedTenant = Boolean((profileRow as any)?.verified_tenant);

              if (isOwnerOnlyRoute && !verifiedHost) {
                if (isMounted) {
                  setHasAccess(false);
                  setRedirectPath('/before-owner');
                  setIsLoading(false);
                  toast.error("Accès réservé aux hôtes vérifiés. Documents requis: ID/passport, carte grise, assurance, visite technique.");
                }
                return;
              }

              if (isRenterOnlyRoute && !verifiedTenant) {
                if (isMounted) {
                  setHasAccess(false);
                  setRedirectPath('/documents/verification');
                  setIsLoading(false);
                  toast.error("Vérification requise. Documents: ID/passport, permis, justificatif de domicile.");
                }
                return;
              }

              if (isMounted) {
                setHasAccess(true);
                setIsLoading(false);
              }
              return;
            }
            
            // Si les rôles ne correspondent pas mais que le rôle des métadonnées est autorisé
            const metadataRoleRaw = user.user_metadata?.role as string;
            let normalizedMetadataRole: UserRole | null = null;
            if (metadataRoleRaw === 'host' || metadataRoleRaw === 'proprietaire' || metadataRoleRaw === 'owner') {
              normalizedMetadataRole = 'owner';
            } else if (metadataRoleRaw === 'locataire' || metadataRoleRaw === 'renter') {
              normalizedMetadataRole = 'renter';
            } else if (metadataRoleRaw === 'admin') {
              normalizedMetadataRole = 'admin';
            }
            
            if (normalizedMetadataRole && allowedRoles.includes(normalizedMetadataRole) && 
                (!profileRole || profileRole !== normalizedMetadataRole)) {
              
              console.log('Role mismatch: profile=', profileRole, 'metadata=', normalizedMetadataRole);
              console.log('Updating profile role to match metadata role');
              
              // Mapper le rôle normalisé vers le rôle DB avant la mise à jour
              // On garde le rôle DB original si c'est 'host' ou 'proprietaire'
              const dbRoleToUpdate = metadataRoleRaw || (normalizedMetadataRole === 'owner' ? 'proprietaire' : 'locataire');
              
              // Mettre à jour le profil avec le rôle des métadonnées (prioritaire)
              try {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ role: dbRoleToUpdate, updated_at: new Date().toISOString() })
                  .eq('id', user.id);
                
                if (updateError) {
                  console.error('Error updating profile role in RoleRoute:', updateError);
                } else {
                  console.log('Profile role successfully updated to match metadata');
                }
                
                // Accorder l'accès puisque le rôle des métadonnées est autorisé
                if (isMounted) {
                  setHasAccess(true);
                  setIsLoading(false);
                }
                return;
              } catch (updateErr) {
                console.error('Exception updating profile role in RoleRoute:', updateErr);
              }
            }
          } else {
            console.warn('No valid profile data returned from RPC');
            
            // Si aucun profil n'a été trouvé, vérifier les métadonnées
            const metadataRoleRaw = user.user_metadata?.role as string;
            let normalizedMetadataRole: UserRole | null = null;
            if (metadataRoleRaw === 'host' || metadataRoleRaw === 'proprietaire' || metadataRoleRaw === 'owner') {
              normalizedMetadataRole = 'owner';
            } else if (metadataRoleRaw === 'locataire' || metadataRoleRaw === 'renter') {
              normalizedMetadataRole = 'renter';
            } else if (metadataRoleRaw === 'admin') {
              normalizedMetadataRole = 'admin';
            }
            
            if (normalizedMetadataRole && allowedRoles.includes(normalizedMetadataRole)) {
              console.log('No profile found but metadata role is allowed');
              
              // Créer un profil manuellement via l'API
              try {
                // Récupérer des données utilisateur supplémentaires si nécessaire
                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError) {
                  console.error('Erreur lors de la récupération des données utilisateur:', userError);
                  // Continuer quand même
                }
                
                const userMetadata = userData?.user?.user_metadata || user.user_metadata || {};
                
                // Map code role to DB role
                const dbRole = metadataRoleRaw || (normalizedMetadataRole === 'owner' ? 'proprietaire' : 'locataire');
                
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: user.id,
                    first_name: userMetadata.firstName || userMetadata.first_name || '',
                    last_name: userMetadata.lastName || userMetadata.last_name || '',
                    role: dbRole,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });
                
                if (insertError) {
                  console.error('Erreur création profil manuellement:', insertError);
                } else {
                  console.log('Profil créé manuellement avec succès');
                }
                
                // Malgré l'erreur éventuelle, accorder l'accès si le rôle normalisé est autorisé
                if (normalizedMetadataRole && allowedRoles.includes(normalizedMetadataRole)) {
                  if (isMounted) {
                    setHasAccess(true);
                    setIsLoading(false);
                  }
                  return;
                }
              } catch (insertErr) {
                console.error('Exception création profil manuelle:', insertErr);
              }
            }
          }

          // Si on arrive ici, l'utilisateur n'a pas accès
          console.log('User does not have access to this route');
          if (isMounted) {
            // Déterminer le chemin de redirection en fonction du rôle
            const userRole = await getUserRole();
            const path = userRole === 'owner' ? '/dashboard/owner' : '/dashboard/renter';
            
            setHasAccess(false);
            setRedirectPath(path);
            setIsLoading(false);
            
            toast.error(
              `Accès non autorisé. Redirection vers votre tableau de bord ${
                userRole === 'owner' ? 'propriétaire' : 'locataire'
              }`
            );
          }
        } catch (error) {
          console.error('Error in profile processing:', error);
          if (isMounted) {
            setHasAccess(false);
            setIsLoading(false);
            // En cas d'erreur, rediriger vers le tableau de bord locataire par défaut
            setRedirectPath('/dashboard/renter');
          }
        }
      } catch (error) {
        console.error('Critical error in checkAccess:', error);
        if (isMounted) {
          toast.error("Une erreur est survenue lors de la vérification de vos accès");
          setIsLoading(false);
          // En cas d'erreur critique, rediriger vers le tableau de bord locataire par défaut
          setRedirectPath('/dashboard/renter');
        }
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [user?.id, location.pathname]); // Ne vérifier que quand l'utilisateur ou la route change réellement

  // Fonction pour réparer un profil utilisateur avec des problèmes
  const repairUserProfile = async (userId: string, role: UserRole) => {
    try {
      console.log("Tentative de réparation du profil utilisateur:", userId, role);
      
      if (!userId) {
        console.error("ID utilisateur manquant pour la réparation du profil");
        return false;
      }
      
      // Vérification si le profil existe déjà
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Erreur lors de la vérification du profil:", checkError);
      }
      
      if (existingProfile) {
        // Le profil existe, mettons à jour le rôle
        console.log("Profil existant trouvé, mise à jour du rôle:", role);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: role,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error("Erreur lors de la mise à jour du profil:", updateError);
          return false;
        }
        
        console.log("Profil mis à jour avec succès");
        return true;
      } else {
        // Le profil n'existe pas, créons-le sans utiliser les RPC
        console.log("Aucun profil trouvé, création d'un nouveau profil avec le rôle:", role);
        
        // Obtenir les données utilisateur pour l'email
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.error("Erreur lors de la récupération des données utilisateur:", userError);
          return false;
        }
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: userData.user.email,
            first_name: userData.user.user_metadata?.firstName || '',
            last_name: userData.user.user_metadata?.lastName || '',
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notification_preferences: { email: true, push: true }
          });
          
        if (insertError) {
          console.error("Erreur lors de la création du profil:", insertError);
          return false;
        }
        
        console.log("Nouveau profil créé avec succès");
        return true;
      }
    } catch (error) {
      console.error("Erreur lors de la réparation du profil:", error);
      return false;
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!hasAccess && redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute; 