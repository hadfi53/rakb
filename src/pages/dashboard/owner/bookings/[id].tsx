import { useEffect, useState } from "react";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { BookingDetails } from "@/components/booking/BookingDetails";

export default function BookingDetailsPage(props) {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const bookingId = props.id;

  useEffect(() => {
    if (bookingId && user) {
      fetchBookingDetails();
    }
  }, [bookingId, user]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          total_price,
          pickup_location,
          return_location,
          vehicle:vehicles (
            id,
            make,
            model,
            year,
            images
          ),
          renter:profiles!bookings_renter_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('id', bookingId)
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;

      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Réservation non trouvée</h1>
        <p className="text-muted-foreground">
          Cette réservation n'existe pas ou vous n'avez pas les permissions nécessaires pour y accéder.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 mt-16">
      <BookingDetails booking={booking} userRole="owner" />
    </div>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      id: context.params.id,
    },
  };
} 