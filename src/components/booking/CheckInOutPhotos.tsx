import { useState } from 'react';
import { useSupabase } from '@/lib/supabase/supabase-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Upload } from 'lucide-react';
import { CheckInOutPhoto } from '@/types/check-in-out';

interface CheckInOutPhotosProps {
  bookingId: string;
  type: 'check-in' | 'check-out';
  onComplete: () => void;
}

export function CheckInOutPhotos({ bookingId, type, onComplete }: CheckInOutPhotosProps) {
  const { supabase } = useSupabase();
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      toast.error('Veuillez sélectionner au moins une photo');
      return;
    }

    setUploading(true);

    try {
      // Get location if available
      let location = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (error) {
        console.warn('Location not available:', error);
      }

      // Upload photos to storage
      const uploadedPhotos: CheckInOutPhoto[] = [];
      for (const photo of photos) {
        const fileName = `${bookingId}/${type}/${Date.now()}-${photo.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('check-in-out')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        if (data) {
          const { data: urlData } = await supabase.storage
            .from('check-in-out')
            .getPublicUrl(data.path);

          if (urlData) {
            uploadedPhotos.push({
              id: data.path,
              bookingId,
              url: urlData.publicUrl,
              type,
              takenAt: new Date().toISOString(),
              metadata: location ? { location } : undefined
            });
          }
        }
      }

      // Save photo records to database
      const { error: dbError } = await supabase
        .from('check_in_out_photos')
        .insert(uploadedPhotos);

      if (dbError) throw dbError;

      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          checkInOutStatus: type === 'check-in' ? 'checked-in' : 'checked-out',
          status: type === 'check-out' ? 'completed' : 'in_progress'
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      toast.success('Photos téléchargées avec succès');
      onComplete();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Erreur lors du téléchargement des photos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {type === 'check-in' ? 'Check-in Photos' : 'Check-out Photos'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Prenez des photos de l'état du véhicule
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="photos">Photos</Label>
          <Input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handlePhotoChange}
            className="cursor-pointer"
          />
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {Array.from(photos).map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Preview ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const input = document.getElementById('photos') as HTMLInputElement;
              input?.click();
            }}
          >
            <Camera className="w-4 h-4 mr-2" />
            Prendre des photos
          </Button>
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={photos.length === 0 || uploading}
          >
            {uploading ? (
              'Téléchargement...'
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Télécharger
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
} 