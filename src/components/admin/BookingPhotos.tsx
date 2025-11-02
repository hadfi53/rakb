import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface Photo {
  url: string;
  type: "exterior" | "interior" | "odometer";
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface BookingPhotosProps {
  bookingId: string;
}

export function BookingPhotos({ bookingId }: BookingPhotosProps) {
  const [checkInPhotos, setCheckInPhotos] = useState<Photo[]>([]);
  const [checkOutPhotos, setCheckOutPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, [bookingId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);

      // Fetch check-in photos
      const { data: checkInData, error: checkInError } = await supabase
        .storage
        .from("check-in-out")
        .list(`${bookingId}/check-in`);

      if (checkInError) throw checkInError;

      // Fetch check-out photos
      const { data: checkOutData, error: checkOutError } = await supabase
        .storage
        .from("check-in-out")
        .list(`${bookingId}/check-out`);

      if (checkOutError) throw checkOutError;

      // Process and set photos
      setCheckInPhotos(
        checkInData
          ? checkInData.map((file) => ({
              url: `${bookingId}/check-in/${file.name}`,
              type: file.name.split("-")[0] as "exterior" | "interior" | "odometer",
              timestamp: file.created_at || "",
              // Location would be stored in metadata
            }))
          : []
      );

      setCheckOutPhotos(
        checkOutData
          ? checkOutData.map((file) => ({
              url: `${bookingId}/check-out/${file.name}`,
              type: file.name.split("-")[0] as "exterior" | "interior" | "odometer",
              timestamp: file.created_at || "",
              // Location would be stored in metadata
            }))
          : []
      );
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading photos...</div>;
  }

  const renderPhotoGrid = (photos: Photo[]) => {
    const groupedPhotos = photos.reduce((acc, photo) => {
      if (!acc[photo.type]) {
        acc[photo.type] = [];
      }
      acc[photo.type].push(photo);
      return acc;
    }, {} as Record<string, Photo[]>);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(groupedPhotos).map(([type, photos]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="capitalize">{type}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/check-in-out/${photo.url}`}
                      alt={`${type} photo`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                      {format(new Date(photo.timestamp), "dd/MM/yyyy HH:mm")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="check-in" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="check-in">Check-in Photos</TabsTrigger>
        <TabsTrigger value="check-out">Check-out Photos</TabsTrigger>
      </TabsList>
      <TabsContent value="check-in">
        {checkInPhotos.length > 0 ? (
          renderPhotoGrid(checkInPhotos)
        ) : (
          <div className="text-center py-4 text-gray-500">
            No check-in photos available
          </div>
        )}
      </TabsContent>
      <TabsContent value="check-out">
        {checkOutPhotos.length > 0 ? (
          renderPhotoGrid(checkOutPhotos)
        ) : (
          <div className="text-center py-4 text-gray-500">
            No check-out photos available
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
} 