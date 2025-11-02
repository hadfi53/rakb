import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CheckInOutPhotos } from './CheckInOutPhotos';
import { useCheckInOut } from '@/hooks/use-check-in-out';
import { Booking } from '@/types/booking';

interface CheckInOutButtonsProps {
  booking: Booking;
  role: 'owner' | 'renter';
}

export function CheckInOutButtons({ booking, role }: CheckInOutButtonsProps) {
  const [showPhotos, setShowPhotos] = useState(false);
  const { canCheckIn, canCheckOut } = useCheckInOut({ booking, role });

  const handleCheckIn = () => {
    if (role !== 'owner') {
      toast.error('Seuls les propriétaires peuvent faire le check-in');
      return;
    }
    setShowPhotos(true);
  };

  const handleCheckOut = () => {
    if (role !== 'renter') {
      toast.error('Seuls les locataires peuvent faire le check-out');
      return;
    }
    setShowPhotos(true);
  };

  const handleComplete = () => {
    setShowPhotos(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {showPhotos ? (
        <CheckInOutPhotos
          bookingId={booking.id}
          type={role === 'owner' ? 'check-in' : 'check-out'}
          onComplete={handleComplete}
        />
      ) : (
        <>
          {role === 'owner' && booking.status === 'confirmed' && !booking.checkInOutStatus && (
            <Button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              variant="outline"
              className="w-full"
            >
              Check In
            </Button>
          )}
          {role === 'renter' && booking.status === 'confirmed' && booking.checkInOutStatus === 'checked-in' && (
            <Button
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              variant="outline"
              className="w-full"
            >
              Check Out
            </Button>
          )}
        </>
      )}
    </div>
  );
} 