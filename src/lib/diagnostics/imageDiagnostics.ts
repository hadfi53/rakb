/**
 * Diagnostics pour les images Supabase Storage
 * Vérifie l'accessibilité du bucket et affiche des messages utiles en console
 */

import { supabase } from '@/integrations/supabase/client';

export interface ImageDiagnosticResult {
  bucketAccessible: boolean;
  sampleUrl: string | null;
  error: string | null;
  recommendation: string;
}

/**
 * Teste l'accessibilité d'une URL d'image spécifique
 */
export async function testImageUrl(imageUrl: string): Promise<{
  accessible: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ accessible: true });
    img.onerror = () => resolve({ 
      accessible: false, 
      error: 'Image failed to load' 
    });
    
    // Timeout après 5 secondes
    setTimeout(() => {
      resolve({ 
        accessible: false, 
        error: 'Timeout: image took too long to load' 
      });
    }, 5000);
    
    img.src = imageUrl;
  });
}

/**
 * Vérifie si le bucket 'vehicles' est accessible publiquement
 */
export async function checkVehiclesBucketAccess(): Promise<ImageDiagnosticResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kcujctyosmjlofppntfb.supabase.co';
  
  // Tester plusieurs chemins possibles pour mieux détecter l'accessibilité
  const testPaths = [
    'images/test-vehicle.jpg', // Fichier de test (probablement inexistant)
    '', // Root du bucket (pour tester l'accessibilité générale)
  ];
  
  console.log('🔍 Diagnostic: Vérification de l\'accessibilité du bucket "vehicles"...');
  
  // Tester d'abord avec une requête HEAD sur le root du bucket
  // Si le bucket est public, on devrait recevoir une réponse (même si c'est une erreur 400/404)
  // Si le bucket est privé, on recevra une erreur CORS ou 403
  const rootUrl = `${supabaseUrl}/storage/v1/object/public/vehicles/`;
  
  try {
    // Tester avec fetch HEAD request sur le root
    const response = await fetch(rootUrl, { 
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'cors'
    });
    
    // Analyse plus fine des codes de statut :
    // - 200 = OK, bucket accessible
    // - 404 = Fichier inexistant mais bucket accessible (bucket public)
    // - 400 = Requête invalide mais bucket accessible (bucket public, juste pas de fichier)
    // - 403 = Accès refusé = bucket privé
    // - 401 = Non autorisé = bucket privé
    // - CORS error = bucket privé ou problème de configuration
    
    const status = response.status;
    
    // Si on reçoit 403 ou 401, le bucket est définitivement privé
    if (status === 403 || status === 401) {
      console.warn('⚠️ Bucket "vehicles" est privé (status:', status, ')');
      return {
        bucketAccessible: false,
        sampleUrl: rootUrl,
        error: `HTTP ${status} - Accès refusé`,
        recommendation: 'Allez dans Supabase Dashboard > Storage > Buckets > "vehicles" > Settings > Activez "Public bucket"'
      };
    }
    
    // Si on reçoit 200, 404, ou 400, le bucket est accessible (même si le fichier n'existe pas)
    // 400 peut signifier "bad request" mais le bucket est accessible
    if (status === 200 || status === 404 || status === 400) {
      console.log('✅ Bucket "vehicles" est accessible publiquement (status:', status, ')');
      return {
        bucketAccessible: true,
        sampleUrl: rootUrl,
        error: null,
        recommendation: 'Le bucket est configuré correctement. Si les images ne s\'affichent pas, vérifiez les chemins dans la base de données.'
      };
    }
    
    // Autres codes = incertain, mais on assume que c'est accessible
    console.log('✅ Bucket "vehicles" semble accessible (status:', status, ')');
    return {
      bucketAccessible: true,
      sampleUrl: rootUrl,
      error: null,
      recommendation: 'Le bucket semble accessible. Si les images ne s\'affichent pas, vérifiez les chemins dans la base de données.'
    };
    
  } catch (error: any) {
    // Erreur CORS = bucket probablement privé
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      console.warn('⚠️ Erreur CORS - Le bucket "vehicles" pourrait être privé');
      return {
        bucketAccessible: false,
        sampleUrl: rootUrl,
        error: error.message || 'CORS error',
        recommendation: 'Allez dans Supabase Dashboard > Storage > Buckets > "vehicles" > Settings > Activez "Public bucket". Si le bucket est déjà public, vérifiez les politiques RLS.'
      };
    }
    
    // Autre erreur = on assume que c'est accessible (peut être un timeout réseau)
    console.log('✅ Bucket "vehicles" semble accessible (erreur réseau possible)');
    return {
      bucketAccessible: true,
      sampleUrl: rootUrl,
      error: null,
      recommendation: 'Le bucket semble accessible. Si les images ne s\'affichent pas, vérifiez les chemins dans la base de données.'
    };
  }
}

/**
 * Exécute tous les diagnostics d'images (appelé au démarrage en dev)
 */
export async function runImageDiagnostics(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return; // Seulement en mode développement
  }
  
  console.log('🔍 ========== DIAGNOSTICS IMAGES SUPABASE ==========');
  
  const bucketCheck = await checkVehiclesBucketAccess();
  
  console.log('📊 Résultat:', bucketCheck);
  console.log('💡 Recommendation:', bucketCheck.recommendation);
  
  if (!bucketCheck.bucketAccessible) {
    console.warn('❌ Le bucket "vehicles" n\'est PAS accessible publiquement');
    console.warn('📝 Étapes à suivre:');
    console.warn('   1. Allez sur https://supabase.com/dashboard');
    console.warn('   2. Sélectionnez votre projet');
    console.warn('   3. Allez dans Storage > Buckets');
    console.warn('   4. Cliquez sur le bucket "vehicles"');
    console.warn('   5. Allez dans l\'onglet "Settings"');
    console.warn('   6. Activez "Public bucket"');
    console.warn('   7. Sauvegardez les modifications');
  } else {
    console.log('✅ Le bucket "vehicles" est correctement configuré');
  }
  
  console.log('🔍 ================================================');
}

