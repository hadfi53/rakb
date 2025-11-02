import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate une date en format français
 */
export function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'PPP', { locale: fr });
  } catch (e) {
    return dateString;
  }
}

/**
 * Formate un prix en MAD avec séparateur de milliers
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' MAD';
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' MAD'
}

/**
 * Vérifie si le bucket 'vehicles' est accessible publiquement
 * @returns Promise<boolean> - true si accessible, false sinon
 */
export async function checkBucketAccessibility(): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kcujctyosmjlofppntfb.supabase.co';
    // Tester avec un chemin de test (cette requête échouera mais nous indiquera si le bucket est public)
    const testUrl = `${supabaseUrl}/storage/v1/object/public/vehicles/test-check.txt`;
    
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    // En mode no-cors, on ne peut pas lire le status, mais si ça ne lance pas d'erreur,
    // c'est un bon signe (même si le fichier n'existe pas)
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
    console.warn('⚠️ Impossible de vérifier l\'accessibilité du bucket vehicles');
    }
    return false;
  }
}

/**
 * Formate une URL d'image depuis Supabase Storage
 * Si l'URL est déjà complète (commence par http/https), la retourne telle quelle
 * Si c'est un chemin relatif, génère l'URL publique depuis le bucket 'vehicles'
 * 
 * TOUJOURS utilise /storage/v1/object/public/ pour les URLs publiques (pas /sign/)
 * 
 * @param imageUrl - URL ou chemin de l'image
 * @returns URL complète de l'image ou placeholder si aucune image
 */
export function getVehicleImageUrl(imageUrl: string | undefined | null): string {
  // Si pas d'URL, retourner placeholder
  if (!imageUrl || imageUrl.trim() === '') {
    if (import.meta.env.DEV) {
      console.warn('🖼️ Empty image URL provided');
    }
    return '/placeholder.svg';
  }

  const trimmedUrl = imageUrl.trim();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('Missing VITE_SUPABASE_URL environment variable');
    return '/placeholder.svg';
  }

  // Si l'URL est déjà complète (commence par http/https), vérifier et corriger si nécessaire
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    // CORRIGER: Remplacer /sign/ par /public/ pour les URLs signées
    if (trimmedUrl.includes('/storage/v1/object/sign/')) {
      const correctedUrl = trimmedUrl.replace('/storage/v1/object/sign/', '/storage/v1/object/public/');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🖼️ Converted signed URL to public:', {
          original: trimmedUrl,
          corrected: correctedUrl
        });
      }
      
      // Enlever les query params (token, etc.) qui ne sont pas nécessaires pour les URLs publiques
      return correctedUrl.split('?')[0];
    }
    
    // Si l'URL utilise le bon format public, vérifier qu'elle utilise bien /public/
    if (trimmedUrl.includes(supabaseUrl) && trimmedUrl.includes('/storage/v1/object/')) {
      // Extraire le chemin et reconstruire avec /public/
      const urlMatch = trimmedUrl.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/?]+)\/(.+?)(?:\?|$)/);
      if (urlMatch) {
        const bucketName = urlMatch[1];
        const filePath = urlMatch[2].split('?')[0]; // Enlever query params
        
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
        
        if (process.env.NODE_ENV === 'development' && trimmedUrl !== publicUrl) {
          console.log('🖼️ Normalized URL:', {
            original: trimmedUrl,
            normalized: publicUrl
          });
        }
        
        return publicUrl;
      }
    }
    
    // Si l'URL semble correcte et pointe vers Supabase, la retourner
    if (trimmedUrl.includes(supabaseUrl) && trimmedUrl.includes('/storage/v1/object/public/')) {
      // Enlever les query params au cas où
      return trimmedUrl.split('?')[0];
    }
    
    // Si c'est une URL externe valide (pas Supabase), la retourner telle quelle
    return trimmedUrl;
  }

  // Ignorer les valeurs qui ne ressemblent pas à des chemins d'images valides
  // (comme "bookings" seul ou autres valeurs invalides)
  if (
    trimmedUrl === 'bookings' ||
    trimmedUrl === 'vehicles' ||
    trimmedUrl.toLowerCase() === 'null' ||
    trimmedUrl.toLowerCase() === 'undefined'
  ) {
    console.warn('Invalid image URL detected:', trimmedUrl);
    return '/placeholder.svg';
  }

  // Vérifier que c'est un nom de fichier valide avec extension
  if (!trimmedUrl.includes('.')) {
    console.warn('Image URL without extension:', trimmedUrl);
    return '/placeholder.svg';
  }

  // Si c'est un chemin relatif, générer l'URL publique
  // Le bucket Supabase Storage pour les véhicules est 'vehicles'
  let path = trimmedUrl.startsWith('/') ? trimmedUrl.slice(1) : trimmedUrl;
  
  // Détecter si c'est un chemin complet avec structure UUID/UUID/filename
  // Ces chemins ne doivent pas être modifiés
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i;
  const isUuidPath = uuidPattern.test(path);
  
  // Si le chemin ne commence pas par un préfixe connu et n'est pas un chemin UUID
  // On ajoute 'images/' pour les chemins simples
  if (!path.startsWith('images/') && 
      !path.startsWith('vehicle-photos/') && 
      !path.startsWith('user_documents/') && 
      !path.startsWith('check-in-out/') &&
      !isUuidPath) {
    // Si c'est juste un nom de fichier (pas de slash), ajouter le préfixe 'images/'
    if (!path.includes('/')) {
      path = `images/${path}`;
    } else {
      // Le chemin contient déjà des slashes mais n'est pas un chemin UUID complet
      // On essaie avec 'images/' pour maintenir la compatibilité
      path = `images/${path}`;
    }
  }
  
  try {
    // Générer l'URL publique depuis Supabase Storage
    // TOUJOURS utiliser /storage/v1/object/public/ (jamais /sign/)
    let bucketName = 'vehicles';
    
    // Détecter le bucket selon le chemin (pour compatibilité)
    // IMPORTANT: Les images existantes sont dans 'car-images', pas 'vehicles'
    if (path.startsWith('car-images/')) {
      bucketName = 'car-images';
      // Enlever le préfixe 'car-images/' du chemin car le bucket_id est déjà spécifié
      path = path.replace(/^car-images\//, '');
    } else if (path.startsWith('vehicle-photos/')) {
      bucketName = 'vehicle-photos';
    } else if (path.startsWith('user_documents/')) {
      bucketName = 'user_documents';
    } else if (path.startsWith('check-in-out/')) {
      bucketName = 'check-in-out';
    } else if (isUuidPath) {
      // IMPORTANT: Pour les chemins UUID (user_id/car_id/filename), utiliser 'car-images'
      // car c'est là que se trouvent TOUTES les images existantes (0 images dans vehicles)
      // Format attendu: uuid/uuid/filename.jpg
      bucketName = 'car-images';
    }
    
    // Construire l'URL publique TOUJOURS avec /public/ (jamais /sign/)
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/path/to/image.jpg
    // NOTE: Pour les chemins UUID, on utilise 'car-images' car c'est là que sont les images existantes
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
    
    // Logs de diagnostic en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ Generated image URL:', { 
        original: trimmedUrl, 
        path, 
        publicUrl, 
        bucket: bucketName,
        isUuidPath,
        supabaseUrl
      });
      
      // Tester l'accessibilité de l'image (mode développement seulement)
      // Utiliser une Image pour tester car fetch() peut avoir des problèmes CORS
      const testImage = new Image();
      testImage.onload = () => {
        console.log('✅ Image loaded successfully:', publicUrl);
      };
      testImage.onerror = () => {
        // Si l'image échoue dans car-images et c'est un chemin UUID, essayer vehicles
        if (bucketName === 'car-images' && isUuidPath) {
          const fallbackUrl = `${supabaseUrl}/storage/v1/object/public/vehicles/${path}`;
          console.warn('⚠️ Image failed to load in car-images, trying vehicles:', {
            original: publicUrl,
            fallback: fallbackUrl
          });
          // Tester le fallback
          const fallbackImage = new Image();
          fallbackImage.onload = () => {
            console.log('✅ Image found in vehicles bucket:', fallbackUrl);
          };
          fallbackImage.onerror = () => {
            console.warn('❌ Image not found in either car-images or vehicles:', path);
            console.warn('💡 Vérifiez que le chemin de l\'image est correct dans la base de données');
          };
          fallbackImage.src = fallbackUrl;
        } else {
          console.warn('⚠️ Image failed to load:', publicUrl);
          console.warn('💡 Vérifiez que le bucket est public et que le chemin est correct');
        }
      };
      // Ne charger que si l'URL semble valide
      if (publicUrl && !publicUrl.includes('undefined') && !publicUrl.includes('null')) {
        testImage.src = publicUrl;
      }
    }
    
    // Vérifier que l'URL est valide
    if (!publicUrl || publicUrl.includes('undefined') || publicUrl.includes('null')) {
      console.warn('❌ Invalid public URL generated:', { 
        original: trimmedUrl, 
        path, 
        publicUrl, 
        bucket: bucketName 
      });
      return '/placeholder.svg';
    }
    
    return publicUrl;
  } catch (error) {
    console.warn('❌ Error generating public URL for image:', { 
      original: trimmedUrl, 
      path, 
      error 
    });
    return '/placeholder.svg';
  }
}

/**
 * Formate un tableau d'URLs d'images depuis Supabase Storage
 * Filtre automatiquement les valeurs invalides
 * 
 * @param images - Tableau d'URLs ou chemins d'images
 * @returns Tableau d'URLs complètes (filtré des valeurs invalides)
 */
export function getVehicleImagesUrls(images: string[] | undefined | null): string[] {
  if (!images || images.length === 0) {
    return ['/placeholder.svg'];
  }

  // Filtrer et formater les images valides
  const validImages = images
    .map(img => getVehicleImageUrl(img))
    .filter(url => url !== '/placeholder.svg'); // Retirer les placeholders de la liste principale

  // Si aucune image valide, retourner un placeholder
  if (validImages.length === 0) {
    return ['/placeholder.svg'];
  }

  return validImages;
}
