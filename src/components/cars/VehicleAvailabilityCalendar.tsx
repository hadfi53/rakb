import { useState, useEffect, useMemo } from "react";
import { format, eachDayOfInterval, isSameDay, startOfDay, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, Users, Calendar as CalendarIcon, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { Vehicle } from "@/types";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface BookingPeriod {
  start_date: string;
  end_date: string;
  status: string;
  renter_name?: string;
}

interface AvailabilityStatus {
  date: Date;
  status: 'available' | 'booked' | 'maintenance' | 'blocked';
  reason?: string;
  bookingId?: string;
  renterName?: string;
}

interface VehicleAvailabilityCalendarProps {
  vehicle: Vehicle;
  onDateSelect?: (date: Date) => void;
  selectedDates?: Date[];
  disabled?: boolean;
}

const VehicleAvailabilityCalendar = ({ 
  vehicle, 
  onDateSelect, 
  selectedDates = [],
  disabled = false 
}: VehicleAvailabilityCalendarProps) => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [bookings, setBookings] = useState<BookingPeriod[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [maintenanceDates, setMaintenanceDates] = useState<string[]>([]);
  const [viewersCount, setViewersCount] = useState<number>(0);
  const [lastBookingTime, setLastBookingTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer les réservations et dates bloquées
  useEffect(() => {
    const loadAvailabilityData = async () => {
      if (!vehicle?.id) return;

      try {
        setLoading(true);

        // Récupérer les réservations
        // La table bookings utilise car_id au lieu de vehicle_id
        // Essayer d'abord avec car_id, puis vehicle_id si car_id ne retourne rien
        let bookingsData: any[] | null = null;
        let bookingsError: any = null;

        // Essayer avec car_id (format le plus courant)
        const { data: carIdBookings, error: carIdError } = await supabase
          .from('bookings')
          .select(`
            start_date, 
            end_date, 
            status, 
            renter:profiles!user_id(first_name, last_name)
          `)
          .eq('car_id', vehicle.id)
          .in('status', ['pending', 'confirmed', 'accepted', 'in_progress', 'active']);

        if (carIdError) {
          // Si car_id échoue, essayer avec vehicle_id
          const { data: vehicleIdBookings, error: vehicleIdError } = await supabase
            .from('bookings')
            .select(`
              start_date, 
              end_date, 
              status, 
              renter:profiles!user_id(first_name, last_name)
            `)
            .eq('vehicle_id', vehicle.id)
            .in('status', ['pending', 'confirmed', 'accepted', 'in_progress', 'active']);

          bookingsData = vehicleIdBookings;
          bookingsError = vehicleIdError;
        } else {
          bookingsData = carIdBookings;
          bookingsError = carIdError;
        }

        if (bookingsError) {
          console.error('Error loading bookings:', bookingsError);
        } else {
          const formattedBookings: BookingPeriod[] = (bookingsData || []).map((booking: any) => ({
            start_date: booking.start_date,
            end_date: booking.end_date,
            status: booking.status,
            renter_name: booking.renter 
              ? `${booking.renter.first_name || ''} ${booking.renter.last_name || ''}`.trim()
              : undefined
          }));
          setBookings(formattedBookings);
        }

        // Note: Pour l'instant, nous n'avons pas de table vehicle_blocked_dates
        // Les dates de maintenance et blocages peuvent être gérés via le statut du véhicule
        // ou via une table dédiée si elle est créée ultérieurement
        setBlockedDates([]);
        setMaintenanceDates([]);

        // Simuler le nombre de personnes qui regardent (à remplacer par une vraie implémentation)
        setViewersCount(Math.floor(Math.random() * 12) + 1);

        // Récupérer la dernière réservation
        // Essayer d'abord avec car_id
        const { data: lastBookingCarId, error: lastBookingCarIdError } = await supabase
          .from('bookings')
          .select('created_at')
          .eq('car_id', vehicle.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let lastBooking = lastBookingCarId;
        let lastBookingError = lastBookingCarIdError;

        // Si car_id ne retourne rien, essayer avec vehicle_id
        if (lastBookingError || !lastBooking) {
          const { data: lastBookingVehicleId, error: lastBookingVehicleIdError } = await supabase
            .from('bookings')
            .select('created_at')
            .eq('vehicle_id', vehicle.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          lastBooking = lastBookingVehicleId;
          lastBookingError = lastBookingVehicleIdError;
        }

        if (!lastBookingError && lastBooking && lastBooking.created_at) {
          const lastBookingDate = new Date(lastBooking.created_at);
          const minutesAgo = Math.floor((Date.now() - lastBookingDate.getTime()) / 60000);
          
          if (minutesAgo < 60) {
            setLastBookingTime(`${minutesAgo} minute${minutesAgo > 1 ? 's' : ''}`);
          } else if (minutesAgo < 1440) {
            const hoursAgo = Math.floor(minutesAgo / 60);
            setLastBookingTime(`${hoursAgo} heure${hoursAgo > 1 ? 's' : ''}`);
          } else {
            setLastBookingTime(null);
          }
        } else {
          setLastBookingTime(null);
        }

      } catch (error) {
        console.error('Error loading availability data:', error);
      } finally {
        setLoading(false);
      }
    };

        loadAvailabilityData();
  }, [vehicle?.id, supabase]);

  // Générer toutes les dates disponibles/indisponibles pour les 3 prochains mois
  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityStatus>();
    const today = startOfDay(new Date());
    const endDate = addDays(today, 90);

    // Initialiser toutes les dates comme disponibles
    const allDates = eachDayOfInterval({ start: today, end: endDate });
    allDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      map.set(dateStr, {
        date,
        status: 'available'
      });
    });

    // Marquer les réservations
    bookings.forEach(booking => {
      try {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        const bookingDates = eachDayOfInterval({ start, end });
        
        bookingDates.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const existing = map.get(dateStr);
          if (existing && existing.status === 'available') {
            map.set(dateStr, {
              date,
              status: 'booked',
              reason: `Réservé${booking.renter_name ? ` par ${booking.renter_name}` : ''}`,
              bookingId: booking.start_date,
              renterName: booking.renter_name
            });
          }
        });
      } catch (error) {
        console.error('Error processing booking dates:', error);
      }
    });

    // Marquer les dates de maintenance
    maintenanceDates.forEach(dateStr => {
      const existing = map.get(dateStr);
      if (existing) {
        map.set(dateStr, {
          ...existing,
          status: 'maintenance',
          reason: 'Maintenance programmée'
        });
      }
    });

    // Marquer les dates bloquées
    blockedDates.forEach(dateStr => {
      const existing = map.get(dateStr);
      if (existing && existing.status === 'available') {
        map.set(dateStr, {
          ...existing,
          status: 'blocked',
          reason: 'Bloqué par le propriétaire'
        });
      }
    });

    return map;
  }, [bookings, blockedDates, maintenanceDates]);

  // Obtenir le statut d'une date
  const getDateStatus = (date: Date): AvailabilityStatus => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availabilityMap.get(dateStr) || {
      date,
      status: 'available'
    };
  };

  // Vérifier si le véhicule est disponible maintenant
  const isAvailableNow = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const status = availabilityMap.get(today);
    return status?.status === 'available';
  }, [availabilityMap]);

  // Obtenir la prochaine date disponible
  const getNextAvailableDate = useMemo(() => {
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const checkDate = addDays(today, i);
      const status = getDateStatus(checkDate);
      if (status.status === 'available') {
        return format(checkDate, 'd MMMM', { locale: fr });
      }
    }
    return null;
  }, [availabilityMap]);

  // Déterminer les classes CSS pour une date
  const getDateClassName = (date: Date): string => {
    const status = getDateStatus(date);
    const isSelected = selectedDates.some(d => isSameDay(d, date));
    const isToday = isSameDay(date, new Date());

    const baseClasses = "relative h-9 w-9 rounded-md transition-colors";

    if (isSelected) {
      return cn(baseClasses, "bg-primary text-primary-foreground font-semibold");
    }

    switch (status.status) {
      case 'booked':
        return cn(baseClasses, "bg-red-100 text-red-700 border border-red-300 cursor-not-allowed", 
          isToday && "ring-2 ring-red-400");
      case 'maintenance':
        return cn(baseClasses, "bg-orange-100 text-orange-700 border border-orange-300 cursor-not-allowed",
          isToday && "ring-2 ring-orange-400");
      case 'blocked':
        return cn(baseClasses, "bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed");
      default:
        return cn(baseClasses, "hover:bg-primary/10 hover:text-primary cursor-pointer",
          isToday && "bg-accent text-accent-foreground font-semibold");
    }
  };

  // Vérifier si une date est désactivée
  const isDateDisabled = (date: Date): boolean => {
    const status = getDateStatus(date);
    return status.status !== 'available' || disabled;
  };

  // Gérer la sélection de date
  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !onDateSelect) return;
    const status = getDateStatus(date);
    if (status.status === 'available') {
      onDateSelect(date);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Indicateurs de disponibilité en temps réel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Badge disponibilité */}
            <Badge 
              variant={isAvailableNow ? "default" : "secondary"}
              className={cn(
                "flex items-center gap-2 px-3 py-1",
                isAvailableNow 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-gray-500"
              )}
            >
              {isAvailableNow ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Disponible maintenant
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  {getNextAvailableDate 
                    ? `Prochainement disponible le ${getNextAvailableDate}`
                    : "Indisponible"}
                </>
              )}
            </Badge>

            {/* Compteur de viewers */}
            {viewersCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                <Users className="h-3 w-3" />
                {viewersCount} {viewersCount > 1 ? 'personnes regardent' : 'personne regarde'} ce véhicule
              </Badge>
            )}

            {/* Alerte dernière réservation */}
            {lastBookingTime && (
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 text-amber-600 border-amber-300">
                <AlertCircle className="h-3 w-3" />
                Dernière réservation il y a {lastBookingTime}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span>Réservé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
              <span>Bloqué</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Disponibilité du véhicule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Calendar
              mode="single"
              selected={selectedDates[0]}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              numberOfMonths={2}
              className="rounded-md border"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative",
                day: cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary"
                ),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                day_range_middle: "",
                day_range_end: "",
                day_hidden: "invisible",
              }}
              modifiers={{
                booked: bookings.flatMap(b => {
                  try {
                    const start = new Date(b.start_date);
                    const end = new Date(b.end_date);
                    return eachDayOfInterval({ start, end });
                  } catch {
                    return [];
                  }
                }),
                maintenance: maintenanceDates.map(d => new Date(d)),
                blocked: blockedDates.map(d => new Date(d)),
              }}
              modifiersClassNames={{
                booked: "bg-red-100 text-red-700 border border-red-300 cursor-not-allowed hover:bg-red-100",
                maintenance: "bg-orange-100 text-orange-700 border border-orange-300 cursor-not-allowed hover:bg-orange-100",
                blocked: "bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed hover:bg-gray-100",
              }}
            />
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleAvailabilityCalendar;
