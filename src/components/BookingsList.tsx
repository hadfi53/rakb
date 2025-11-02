import { useBookingSubscription } from '@/hooks/use-booking-subscription';

export const BookingsList = ({ role }: { role: 'renter' | 'owner' }) => {
  useBookingSubscription();
  // ... existing code ...
}; 