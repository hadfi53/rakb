import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckInOutPhotos } from '@/components/booking/CheckInOutPhotos';
import { useCheckInOut } from '@/hooks/use-check-in-out';
import { Booking } from '@/types/booking';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Camera } from 'lucide-react';
import { OwnerBooking } from "@/hooks/use-owner-bookings";

interface CheckInOutButtonsProps {
  booking: OwnerBooking;
  role: 'owner' | 'renter';
}

export const CheckInOutButtons = ({ booking, role }: CheckInOutButtonsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<'check-in' | 'check-out' | null>(null);
  const { toast } = useToast();

  // Convert OwnerBooking to Booking for useCheckInOut hook
  const convertedBooking: Booking = {
    ...booking,
    checkInOutStatus: booking.checkInOutStatus === 'checked-in' ? 'check_in_completed' :
                     booking.checkInOutStatus === 'checked-out' ? 'check_out_completed' :
                     'not_started',
  } as Booking;

  const { canCheckIn, canCheckOut } = useCheckInOut({ booking: convertedBooking, role });

  const openDialog = (action: 'check-in' | 'check-out') => {
    setActiveAction(action);
    setIsDialogOpen(true);
  };

  const handleActionComplete = () => {
    setIsDialogOpen(false);
    setActiveAction(null);
  };

  return (
    <>
      <div className="flex gap-2">
        {role === "owner" && canCheckIn && (
          <Button
            onClick={() => openDialog("check-in")}
            variant="default"
          >
            Start Check-in
          </Button>
        )}
        
        {role === "renter" && canCheckOut && (
          <Button
            onClick={() => openDialog("check-out")}
            variant="default"
          >
            Start Check-out
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {activeAction === "check-in" ? "Vehicle Check-in" : "Vehicle Check-out"}
            </DialogTitle>
          </DialogHeader>
          
          {activeAction && (
            <CheckInOutPhotos
              bookingId={booking.id}
              type={activeAction}
              onComplete={handleActionComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}; 