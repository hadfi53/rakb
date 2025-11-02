import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicle } from "@/hooks/use-vehicle";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, X, Wrench, Lock, Unlock, Download } from "lucide-react";
import { format, eachDayOfInterval, isSameDay, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { mockAvailabilityApi, BlockedDate } from "@/lib/mock-availability-data";
import { mockBookingApi } from "@/lib/mock-booking-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateStatus {
  date: Date;
  status: 'available' | 'blocked' | 'booked' | 'maintenance';
  bookingId?: string;
  blockId?: string;
  reason?: string;
}

const VehicleAvailability = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getVehicleById } = useVehicle();

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState<'maintenance' | 'manual' | 'other'>('manual');
  const [blockNote, setBlockNote] = useState('');

  // Load vehicle data
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const vehicleData = await getVehicleById(id);
        if (!vehicleData || vehicleData.owner_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'êtes pas autorisé à gérer ce véhicule",
          });
          navigate('/dashboard/owner/vehicles');
          return;
        }
        setVehicle(vehicleData);
      } catch (err) {
        console.error("Error loading vehicle:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données du véhicule",
        });
        navigate('/dashboard/owner/vehicles');
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [id, user, getVehicleById, navigate, toast]);

  // Load blocked dates and bookings
  useEffect(() => {
    const loadAvailabilityData = async () => {
      if (!id) return;

      try {
        // Load blocked dates
        const blocked = await mockAvailabilityApi.getBlockedDates(id);
        setBlockedDates(blocked);

        // Load bookings for this vehicle
        // Note: mockBookingApi doesn't have getVehicleBookings, so we simulate
        if (user?.id) {
          try {
            const allBookings = await mockBookingApi.getOwnerBookings(user.id);
            const vehicleBookings = allBookings.filter(b => b.vehicle_id === id);
            
            const booked: string[] = [];
            vehicleBookings.forEach(booking => {
              try {
                const start = new Date(booking.start_date);
                const end = new Date(booking.end_date);
                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                  const days = eachDayOfInterval({ start, end });
                  days.forEach(day => {
                    booked.push(format(day, 'yyyy-MM-dd'));
                  });
                }
              } catch (err) {
                console.error("Error processing booking dates:", err);
              }
            });
            setBookedDates(booked);
          } catch (err) {
            console.error("Error loading bookings:", err);
            // Continue without bookings if error
          }
        }
      } catch (err) {
        console.error("Error loading availability data:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données de disponibilité",
        });
      }
    };

    loadAvailabilityData();
  }, [id, user?.id, toast]);

  const isDateBlocked = (date: Date): BlockedDate | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedDates.find(b => b.date === dateStr) || null;
  };

  const isDateBooked = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookedDates.includes(dateStr);
  };

  const getDateStatus = (date: Date): DateStatus => {
    const blocked = isDateBlocked(date);
    const booked = isDateBooked(date);

    if (booked) {
      return { date, status: 'booked' };
    }
    if (blocked) {
      return {
        date,
        status: blocked.reason === 'maintenance' ? 'maintenance' : 'blocked',
        blockId: blocked.id,
        reason: blocked.reason,
      };
    }
    return { date, status: 'available' };
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucune date sélectionnée",
        description: "Veuillez sélectionner au moins une date à bloquer",
      });
      return;
    }

    try {
      const dateStrings = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
      await mockAvailabilityApi.blockDates(id!, dateStrings, blockReason, blockNote);
      
      // Reload blocked dates
      const blocked = await mockAvailabilityApi.getBlockedDates(id!);
      setBlockedDates(blocked);

      toast({
        title: "Dates bloquées",
        description: `${selectedDates.length} date(s) bloquée(s) avec succès`,
      });

      setSelectedDates([]);
      setBlockDialogOpen(false);
      setBlockNote('');
    } catch (err) {
      console.error("Error blocking dates:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de bloquer les dates",
      });
    }
  };

  const handleUnblockDates = async (blockIds: string[]) => {
    try {
      await mockAvailabilityApi.unblockDates(id!, blockIds);
      
      // Reload blocked dates
      const blocked = await mockAvailabilityApi.getBlockedDates(id!);
      setBlockedDates(blocked);

      toast({
        title: "Dates débloquées",
        description: `${blockIds.length} date(s) débloquée(s) avec succès`,
      });
    } catch (err) {
      console.error("Error unblocking dates:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de débloquer les dates",
      });
    }
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates || dates.length === 0) {
      // Si aucune date sélectionnée, on peut gérer le clic sur une date individuelle
      return;
    }

    // Pour chaque date sélectionnée
    dates.forEach(date => {
      const status = getDateStatus(date);
      
      // Si la date est déjà bloquée manuellement, la débloquer
      if (status.status === 'blocked' && status.blockId) {
        handleUnblockDates([status.blockId]);
        return;
      }

      // Si la date est disponible ou en maintenance, l'ajouter à la sélection si pas déjà présente
      if (status.status === 'available' || status.status === 'maintenance') {
        if (!selectedDates.some(d => isSameDay(d, date))) {
          setSelectedDates(prev => [...prev, date]);
        }
      }
    });
  };

  const handleSingleDateClick = (date: Date) => {
    const status = getDateStatus(date);
    
    // Si la date est déjà bloquée manuellement, la débloquer
    if (status.status === 'blocked' && status.blockId) {
      handleUnblockDates([status.blockId]);
      return;
    }

    // Si la date est disponible ou en maintenance, toggle la sélection
    if (status.status === 'available' || status.status === 'maintenance') {
      if (selectedDates.some(d => isSameDay(d, date))) {
        setSelectedDates(prev => prev.filter(d => !isSameDay(d, date)));
      } else {
        setSelectedDates(prev => [...prev, date]);
      }
    }
  };

  const disabledDates = (date: Date): boolean => {
    return isBefore(date, startOfDay(new Date()));
  };

  const getDateClassName = (date: Date): string => {
    const status = getDateStatus(date);
    switch (status.status) {
      case 'booked':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/dashboard/owner/vehicles"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à mes véhicules
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendrier de disponibilité</h1>
              <p className="text-gray-600 mt-2">
                {vehicle.make} {vehicle.model} {vehicle.year}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-sm">Réservé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-sm">Bloqué</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                <span className="text-sm">Maintenance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedDates.length} date(s) sélectionnée(s)
                </span>
                {selectedDates.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDates([])}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Effacer
                  </Button>
                )}
              </div>
              <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={selectedDates.length === 0}
                    onClick={() => setBlockDialogOpen(true)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Bloquer les dates sélectionnées
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bloquer des dates</DialogTitle>
                    <DialogDescription>
                      Vous allez bloquer {selectedDates.length} date(s) pour ce véhicule
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Raison du blocage</Label>
                      <Select value={blockReason} onValueChange={(v: any) => setBlockReason(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="manual">Blocage manuel</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Note (optionnel)</Label>
                      <Textarea
                        value={blockNote}
                        onChange={(e) => setBlockNote(e.target.value)}
                        placeholder="Ajouter une note..."
                        rows={3}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Dates sélectionnées :</p>
                      <ul className="list-disc list-inside">
                        {selectedDates.slice(0, 5).map((date, idx) => (
                          <li key={idx}>{format(date, 'PPP', { locale: fr })}</li>
                        ))}
                        {selectedDates.length > 5 && (
                          <li>... et {selectedDates.length - 5} autre(s)</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleBlockDates}>
                      Bloquer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendrier - {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <CardDescription>
              Cliquez sur une date disponible pour la sélectionner, ou sur une date bloquée pour la débloquer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => handleDateSelect(dates)}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              disabled={disabledDates}
              locale={fr}
              className="rounded-md border"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day: "hover:bg-gray-100 cursor-pointer",
              }}
              modifiers={{
                booked: bookedDates.map(d => new Date(d)),
                blocked: blockedDates.filter(b => b.reason !== 'maintenance').map(b => new Date(b.date)),
                maintenance: blockedDates.filter(b => b.reason === 'maintenance').map(b => new Date(b.date)),
              }}
              modifiersClassNames={{
                booked: "bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed",
                blocked: "bg-red-100 text-red-700 border-red-300 cursor-pointer",
                maintenance: "bg-orange-100 text-orange-700 border-orange-300 cursor-pointer",
              }}
            />
          </CardContent>
        </Card>

        {/* Blocked Dates List */}
        {blockedDates.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Dates bloquées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {blockedDates.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(blocked.date), 'PPP', { locale: fr })}
                        </p>
                        {blocked.reason && (
                          <p className="text-sm text-gray-500">
                            {blocked.reason === 'maintenance' && 'Maintenance'}
                            {blocked.reason === 'manual' && 'Blocage manuel'}
                            {blocked.reason === 'other' && 'Autre'}
                            {blocked.note && ` - ${blocked.note}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblockDates([blocked.id])}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Débloquer
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VehicleAvailability;

