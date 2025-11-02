import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Calendar, Clock, CheckCircle, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import * as bookingsBackend from "@/lib/backend/bookings";
import { Booking, BookingStatus, BookingStatusLabels, BookingStatusColors } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const RenterDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getUserRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [hasNewRejections, setHasNewRejections] = useState(false);
  
  const showErrorToast = (message: string) => {
    toast({
      variant: "destructive",
      title: "Erreur",
      description: message
    });
  };

  const showSuccessToast = (message: string) => {
    toast({
      title: "Succès",
      description: message
    });
  };

  // Récupérer les réservations du locataire
  const fetchRenterBookings = useCallback(async () => {
    try {
      if (!user) return;

      setIsRefreshing(true);
      setError(null);

      const { bookings: formattedBookings, error: bookingsError } = await bookingsBackend.getRenterBookings(user.id);
      
      if (bookingsError) {
        console.error('Error fetching renter bookings:', bookingsError);
        throw bookingsError;
      }
      
      setBookings(formattedBookings || []);

      // Compter les réservations en attente et refusées
      const pending = formattedBookings.filter(b => b.status === 'pending').length;
      const rejected = formattedBookings.filter(b => b.status === 'rejected').length;

      setPendingCount(pending);
      setRejectedCount(rejected);

      if (formattedBookings.length === 0) {
        setError("Vous n'avez pas encore de réservations");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
      setError("Une erreur est survenue lors de la récupération de vos réservations");
      showErrorToast("Une erreur est survenue lors de la récupération de vos réservations.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [user, toast]);

  // Charger les réservations du locataire
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!user) {
          navigate('/auth/login');
          return;
        }

        const userRole = await getUserRole();
        if (userRole !== 'renter') {
          showErrorToast("Accès non autorisé. Cette page est réservée aux locataires.");
          navigate('/');
          return;
        }

        await fetchRenterBookings();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        setError("Une erreur est survenue lors de la vérification de vos accès");
        showErrorToast("Une erreur est survenue lors de la vérification de vos accès");
        setIsLoading(false);
      }
    };

    checkAccess();

    // Pas de souscription en mode mock, on peut rafraîchir manuellement
  }, [user, navigate, getUserRole, fetchRenterBookings]);

  // Recharger les données quand on navigue vers cette page
  useEffect(() => {
    if (user && location.pathname === '/dashboard/renter' && !isLoading) {
      // Ne recharger que si on vient d'arriver sur la page (pas au premier montage)
      const hasLoaded = bookings.length > 0 || error !== null;
      if (hasLoaded) {
        fetchRenterBookings();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Annuler une réservation
  const handleCancel = async (reservation: Booking) => {
    try {
      if (!user) return;

      await bookingsBackend.cancelBooking(reservation.id, user.id);

      showSuccessToast("Votre réservation a été annulée avec succès.");

      fetchRenterBookings();
    } catch (error) {
      console.error("Erreur lors de l'annulation de la réservation:", error);
      showErrorToast("Impossible d'annuler la réservation. Veuillez réessayer.");
    }
  };

  // Renouveler une réservation
  const handleRenewal = (reservation: Booking) => {
    const vehicleId = reservation.vehicle_id || reservation.vehicleId;
    if (vehicleId) {
      navigate(`/cars/${vehicleId}/reserve`);
    }
  };

  // Calculer les statistiques des réservations
  const calculateBookingStats = () => {
    const stats = {
      total: bookings.length,
      active: bookings.filter(b => b.status === 'in_progress').length,
      upcoming: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      rejected: bookings.filter(b => b.status === 'rejected').length
    };

    return stats;
  };

  // Données pour le graphique des statuts
  const getStatusChartData = () => {
    if (!bookings || bookings.length === 0) return [];

    const stats = calculateBookingStats();
    
    return [
      { name: 'En attente', value: stats.pending, color: '#f59e0b' },
      { name: 'Confirmées', value: stats.upcoming, color: '#3b82f6' },
      { name: 'En cours', value: stats.active, color: '#10b981' },
      { name: 'Terminées', value: stats.completed, color: '#6b7280' },
      { name: 'Refusées', value: stats.rejected, color: '#ef4444' },
      { name: 'Annulées', value: stats.cancelled, color: '#9ca3af' }
    ].filter(item => item.value > 0);
  };

  // Composant pour afficher le tableau des réservations
  const ReservationsTable = ({ reservations }: { reservations: Booking[] }) => {
    if (error && reservations.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchRenterBookings()}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchRenterBookings()}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Véhicule</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  Aucune réservation trouvée
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">
                    {reservation.vehicle ? `${reservation.vehicle.brand || reservation.vehicle.make} ${reservation.vehicle.model}` : 'Véhicule inconnu'}
                  </TableCell>
                  <TableCell>
                    {new Date(reservation.start_date || reservation.startDate || '').toLocaleDateString('fr-FR')} - {new Date(reservation.end_date || reservation.endDate || '').toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs inline-flex items-center w-fit ${
                        BookingStatusColors[reservation.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {BookingStatusLabels[reservation.status] || 
                        reservation.status}
                      </span>
                      {reservation.status === 'rejected' && (
                        <div className="text-xs text-gray-500 mt-1 flex items-start">
                          <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                          <span>Demande refusée par l'agence</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{(reservation.total_price || reservation.totalAmount || 0)} Dh</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {reservation.status === "completed" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRenewal(reservation)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Renouveler
                        </Button>
                      )}
                      {(reservation.status === "pending" || reservation.status === "confirmed") && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCancel(reservation)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/bookings/${reservation.id}`)}
                      >
                        Détails
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const stats = calculateBookingStats();
  const statusData = getStatusChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold">Tableau de bord - Locataire</h1>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link to="/dashboard/renter/bookings">
                <Calendar className="mr-2 h-4 w-4" />
                Voir toutes mes réservations
              </Link>
            </Button>
        </div>
        </div>

        {/* Notifications */}
        {pendingCount > 0 && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Demandes en attente</AlertTitle>
            <AlertDescription className="text-blue-700">
              Vous avez {pendingCount} demande{pendingCount > 1 ? 's' : ''} de réservation en attente de confirmation par les propriétaires.
            </AlertDescription>
          </Alert>
        )}
        
        {hasNewRejections && rejectedCount > 0 && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Demandes refusées</AlertTitle>
            <AlertDescription className="text-red-700">
              Vous avez {rejectedCount} demande{rejectedCount > 1 ? 's' : ''} de réservation qui {rejectedCount > 1 ? 'ont été refusées' : 'a été refusée'} par {rejectedCount > 1 ? 'les propriétaires' : 'le propriétaire'}.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Car className="h-8 w-8 text-primary opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En attente</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Confirmées</p>
                  <p className="text-2xl font-bold">{stats.upcoming}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En cours</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <Clock className="h-8 w-8 text-green-500 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Terminées</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-500 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Refusées</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Annulées</p>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-gray-400 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Réservations et Graphique */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Liste des réservations */}
          <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Mes réservations</CardTitle>
          </CardHeader>
          <CardContent>
                <Tabs defaultValue="all">
              <TabsList>
                    <TabsTrigger value="all">
                      Toutes
                      {bookings.length > 0 && (
                        <span className={cn("ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold")}>
                          {bookings.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      En attente
                      {stats.pending > 0 && (
                        <span className={cn("ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold")}>
                          {stats.pending}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="confirmed">
                      Confirmées
                      {stats.upcoming > 0 && (
                        <span className={cn("ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold")}>
                          {stats.upcoming}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="active">
                      En cours
                      {stats.active > 0 && (
                        <span className={cn("ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold")}>
                          {stats.active}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Terminées
                      {stats.completed > 0 && (
                        <span className={cn("ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold")}>
                          {stats.completed}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Refusées
                      {stats.rejected > 0 && (
                        <span className={cn("ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold")}>
                          {stats.rejected}
                        </span>
                      )}
                    </TabsTrigger>
              </TabsList>

                  <TabsContent value="all" className="mt-4">
                    <ReservationsTable reservations={bookings} />
                  </TabsContent>

                  <TabsContent value="pending" className="mt-4">
                    <ReservationsTable reservations={bookings.filter(b => b.status === 'pending')} />
                  </TabsContent>

                  <TabsContent value="confirmed" className="mt-4">
                    <ReservationsTable reservations={bookings.filter(b => b.status === 'confirmed')} />
              </TabsContent>

                  <TabsContent value="active" className="mt-4">
                    <ReservationsTable reservations={bookings.filter(b => b.status === 'in_progress')} />
              </TabsContent>

                  <TabsContent value="completed" className="mt-4">
                    <ReservationsTable reservations={bookings.filter(b => b.status === 'completed')} />
              </TabsContent>

                  <TabsContent value="rejected" className="mt-4">
                    <ReservationsTable reservations={bookings.filter(b => b.status === 'rejected')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
          </div>

          {/* Graphique des statuts */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des réservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Aucune donnée à afficher
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RenterDashboard;
