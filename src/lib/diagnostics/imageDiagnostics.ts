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
  const testPath = 'images/test-vehicle.jpg'; // Chemin de test
  const testUrl = `${supabaseUrl}/storage/v1/object/public/vehicles/${testPath}`;
  
  console.log('🔍 Diagnostic: Vérification de l\'accessibilité du bucket "vehicles"...');
  console.log('📍 URL de test:', testUrl);
  
  try {
    // Tester avec fetch HEAD request
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    // Si on reçoit 200, 404, ou 403, le bucket est accessible (404 = fichier inexistant mais bucket accessible)
    // Si on reçoit autre chose ou erreur CORS, le bucket est probablement privé
    const isAccessible = response.status === 200 || response.status === 404;
    
    if (isAccessible) {
      console.log('✅ Bucket "vehicles" est accessible publiquement');
      return {
        bucketAccessible: true,
        sampleUrl: testUrl,
        error: null,
        recommendation: 'Le bucket est configuré correctement. Si les images ne s\'affichent pas, vérifiez les chemins dans la base de données.'
      };
    } else {
      console.warn('⚠️ Bucket "vehicles" pourrait être privé (status:', response.status, ')');
      return {
        bucketAccessible: false,
        sampleUrl: testUrl,
        error: `HTTP ${response.status}`,
        recommendation: 'Allez dans Supabase Dashboard > Storage > Buckets > "vehicles" > Settings > Activez "Public bucket"'
      };
    }
  } catch (error: any) {
    // Erreur CORS ou réseau = bucket probablement privé ou problème de configuration
    console.warn('⚠️ Erreur lors du test d\'accessibilité:', error.message);
    
    return {
      bucketAccessible: false,
      sampleUrl: testUrl,
      error: error.message || 'Unknown error',
      recommendation: 'Allez dans Supabase Dashboard > Storage > Buckets > "vehicles" > Settings > Activez "Public bucket". Si le bucket est déjà public, vérifiez les politiques RLS.'
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

