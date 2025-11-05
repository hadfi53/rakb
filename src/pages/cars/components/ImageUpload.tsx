import { useState } from "react";
import { Upload, X, Check, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  initialImages?: string[];
}

const ImageUpload = ({ onImagesChange, initialImages = [] }: ImageUploadProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const imageUrls: string[] = [];
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`Le fichier "${file.name}" n'est pas une image valide`);
        }
        
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Le fichier "${file.name}" dépasse la taille maximale de 10MB`);
        }
        
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        // Determine MIME type from file extension (priority over file.type which can be unreliable)
        const mimeTypeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'webp': 'image/webp',
          'heic': 'image/heic',
        };
        
        // Always prefer extension-based MIME type if available, otherwise use file.type
        let contentType: string;
        if (fileExt && mimeTypeMap[fileExt]) {
          contentType = mimeTypeMap[fileExt];
          console.log('✅ Using extension-based MIME type:', contentType, 'for extension:', fileExt, '(original file.type was:', file.type, ')');
        } else if (file.type && file.type !== 'application/json' && file.type !== 'application/octet-stream' && file.type.startsWith('image/')) {
          contentType = file.type;
          console.log('✅ Using original file.type:', contentType);
        } else {
          contentType = 'image/jpeg'; // Default fallback
          console.warn('⚠️ Could not determine MIME type, using image/jpeg. Extension:', fileExt, 'file.type:', file.type);
        }

        // Create a new File object with the correct MIME type
        const fileToUpload = new File([file], file.name, { 
          type: contentType,
          lastModified: file.lastModified || Date.now()
        });
        
        // Update progress
        const progressPerFile = 100 / files.length;
        setUploadProgress((prev) => Math.min(prev + progressPerFile * 0.5, 95));
        
        try {
          // Upload file
          const filePath = `images/${fileName}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('vehicles')
            .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false,
              contentType: contentType
            });
            
          if (uploadError) {
            console.error('Upload error details:', uploadError);
            throw uploadError;
          }
          
          // Use the path from uploadData if available, otherwise use the path we used
          const actualPath = uploadData?.path || filePath;
          
          // Get public URL using the actual path
          const { data: { publicUrl } } = supabase.storage
            .from('vehicles')
            .getPublicUrl(actualPath);
          
          console.log('📸 Image uploaded successfully:', {
            fileName: file.name,
            filePath: actualPath,
            publicUrl: publicUrl,
            uploadData: uploadData
          });
          
          // Test if the URL is accessible (with a small delay for CDN propagation)
          setTimeout(async () => {
            try {
              const testResponse = await fetch(publicUrl, { 
                method: 'HEAD',
                cache: 'no-cache'
              });
              console.log('🔍 Image accessibility test:', {
                url: publicUrl,
                status: testResponse.status,
                statusText: testResponse.statusText,
                accessible: testResponse.status === 200
              });
              
              if (testResponse.status !== 200) {
                console.warn('⚠️ Image might not be accessible. Status:', testResponse.status);
                console.warn('💡 Try opening this URL in a new tab:', publicUrl);
              }
            } catch (fetchError) {
              console.warn('⚠️ Could not test image accessibility:', fetchError);
            }
          }, 500); // Small delay for CDN propagation
          
          // Add timestamp to URL to prevent caching issues
          const urlWithTimestamp = `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
          imageUrls.push(urlWithTimestamp);
          setUploadProgress((prev) => Math.min(prev + progressPerFile * 0.5, 99));
          
        } catch (uploadError) {
          console.error("Upload error for file:", file.name, uploadError);
          throw new Error(`Erreur lors de l'upload de "${file.name}": ${uploadError.message}`);
        }
      }
      
      // Update state with new images
      const newImagesList = [...uploadedImages, ...imageUrls];
      setUploadedImages(newImagesList);
      onImagesChange(newImagesList);
      
      toast({
        title: "Upload réussi",
        description: `${files.length} image(s) téléchargée(s) avec succès.`,
      });
      
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'upload",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'upload",
      });
    } finally {
      setUploading(false);
      setUploadProgress(100);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Photos du véhicule
      </label>
      
      {/* Zone de téléchargement */}
      <div className={cn(
        "flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors",
        uploading 
          ? "border-primary/50 bg-primary/5" 
          : "border-gray-300 hover:border-primary/50"
      )}>
        <div className="space-y-2 text-center">
          {uploading ? (
            <>
              <div className="mx-auto h-12 w-12 text-primary animate-pulse">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">Téléchargement en cours...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark">
                  <span>Télécharger des images</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    multiple 
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG jusqu'à 10MB</p>
            </>
          )}
        </div>
      </div>
      
      {/* Aperçu des images téléchargées */}
      {uploadedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Images téléchargées</h4>
          <div className="grid grid-cols-3 gap-4">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                  <img 
                    src={url} 
                    alt={`Vehicle image ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error('❌ Image failed to load:', {
                        index,
                        url,
                        attemptedUrl: target.src,
                        error: 'Image load error - possible CORS or 404'
                      });
                      
                      // Try to open the URL in a new tab for debugging
                      if (import.meta.env.DEV) {
                        console.warn('🔗 Try opening this URL manually:', url);
                      }
                      
                      // Show error placeholder
                      target.src = '/placeholder.svg';
                      target.alt = 'Image non disponible';
                    }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log('✅ Image loaded successfully:', {
                        index,
                        url: target.src,
                        naturalWidth: target.naturalWidth,
                        naturalHeight: target.naturalHeight
                      });
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
