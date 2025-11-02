import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Car, DollarSign, Plus, Moon, Sun, Clock, XCircle,
  MapPin, ArrowRight
} from "lucide-react";
import { Vehicle } from "@/lib/types";
import { useVehicle } from "@/hooks/use-vehicle";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from '@/contexts/ThemeContext';
import { useBooking } from '@/hooks/use-booking';
import { Booking, BookingStatus } from '@/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BookingsList from "./BookingsList";

const OwnerDashboard = () => {
  const { theme, setTheme } = useTheme();
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('7days');
  
  // Récupérer les véhicules du propriétaire
  const { user } = useAuth();
  const { getOwnerVehicles, vehicles, loading: isLoadingVehicles } = useVehicle();
  
  useEffect(() => {
    if (user) {
      getOwnerVehicles();
    }
  }, [user, getOwnerVehicles]);

  // Récupérer les réservations du propriétaire
  const { loading: isLoadingBookings, bookings, getOwnerBookings } = useBooking();

  // Charger les réservations au chargement du composant
  useEffect(() => {
    const loadBookings = async () => {
      await getOwnerBookings();
    };
    
    loadBookings();
  }, [getOwnerBookings]);

  // Calculer les statistiques en fonction des réservations
  const calculateStats = () => {
    if (!bookings || bookings.length === 0) {
      return {
        revenue: 0,
        inRoute: 0,
        pending: 0,
        canceled: 0
      };
    }

    const revenue = bookings.reduce((total, booking) => {
      // Ne compter que les réservations confirmées ou terminées
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        return total + (booking.total_price || booking.totalAmount || 0);
      }
      return total;
    }, 0);

    const inRoute = bookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'in_progress'
    ).length;

    const pending = bookings.filter(booking => 
      booking.status === 'pending'
    ).length;

    const canceled = bookings.filter(booking => 
      booking.status === 'cancelled' || booking.status === 'rejected'
    ).length;

    return {
      revenue,
      inRoute,
      pending,
      canceled
    };
  };

  const stats = calculateStats();

  // Générer des données de revenus pour le graphique
  const generateRevenueData = () => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const data = [];
    
    // Si nous n'avons pas de réservations, retourner des données vides
    if (!bookings || bookings.length === 0) {
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        data.push({
          day: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          revenue: 0,
          bookings: 0
        });
      }
      return data;
    }

    // Créer un dictionnaire pour stocker les revenus par jour
    const revenueByDay: Record<string, { revenue: number, bookings: number }> = {};
    
    // Initialiser tous les jours avec des valeurs à zéro
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dayKey = date.toISOString().split('T')[0];
      revenueByDay[dayKey] = { revenue: 0, bookings: 0 };
    }
    
    // Calculer les revenus pour chaque jour
    bookings.forEach(booking => {
      // Ne compter que les réservations confirmées ou terminées
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        const startDate = new Date(booking.startDate || booking.start_date || '');
        const dayKey = startDate.toISOString().split('T')[0];
        
        // Vérifier si la date est dans notre plage
        if (revenueByDay[dayKey]) {
          revenueByDay[dayKey].revenue += booking.total_price || booking.totalAmount || 0;
          revenueByDay[dayKey].bookings += 1;
        }
      }
    });
    
    // Convertir le dictionnaire en tableau pour le graphique
    Object.entries(revenueByDay).forEach(([dayKey, values]) => {
      const date = new Date(dayKey);
      data.push({
        day: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        revenue: values.revenue,
        bookings: values.bookings
      });
    });
    
    // Trier les données par date
    data.sort((a, b) => {
      const dateA = new Date(a.day.split(' ')[0] + ' ' + a.day.split(' ')[1]);
      const dateB = new Date(b.day.split(' ')[0] + ' ' + b.day.split(' ')[1]);
      return dateA.getTime() - dateB.getTime();
    });
    
    return data;
  };

  const revenueData = generateRevenueData();

  // Calculer les statistiques par catégorie de véhicule
  const calculateVehicleStats = () => {
    if (!vehicles || vehicles.length === 0 || !bookings || bookings.length === 0) {
      return [
        { category: 'SUV', count: 0, utilization: 0, revenue: 0 },
        { category: 'Berline', count: 0, utilization: 0, revenue: 0 },
        { category: 'Sportive', count: 0, utilization: 0, revenue: 0 },
        { category: 'Luxe', count: 0, utilization: 0, revenue: 0 }
      ];
    }

    // Compter les véhicules par catégorie
    const categoryCounts: Record<string, number> = {};
    vehicles.forEach(vehicle => {
      const category = vehicle.category || 'Autre';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Calculer les revenus et l'utilisation par catégorie
    const categoryStats: Record<string, { revenue: number, bookingDays: number }> = {};
    bookings.forEach(booking => {
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        const vehicle = vehicles?.find(v => v.id === booking.vehicle_id || v.id === booking.vehicleId);
        if (vehicle) {
          const category = vehicle.category || 'Autre';
          if (!categoryStats[category]) {
            categoryStats[category] = { revenue: 0, bookingDays: 0 };
          }
          categoryStats[category].revenue += booking.total_price || booking.totalAmount || 0;
          // Calculate duration days from dates
          const start = new Date(booking.start_date || booking.startDate || '');
          const end = new Date(booking.end_date || booking.endDate || '');
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 0;
          categoryStats[category].bookingDays += days;
        }
      }
    });

    // Calculer le taux d'utilisation (jours de réservation / jours totaux disponibles)
    const totalDays = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    
    // Convertir en tableau pour l'affichage
    const result = Object.keys(categoryCounts).map(category => {
      const count = categoryCounts[category] || 0;
      const stats = categoryStats[category] || { revenue: 0, bookingDays: 0 };
      const totalAvailableDays = count * totalDays;
      const utilization = totalAvailableDays > 0 
        ? Math.round((stats.bookingDays / totalAvailableDays) * 100) 
        : 0;
      
      return {
        category,
        count,
        utilization,
        revenue: stats.revenue
      };
    });

    // Si nous avons moins de 4 catégories, ajouter des catégories vides
    const defaultCategories = ['SUV', 'Berline', 'Sportive', 'Luxe'];
    const existingCategories = result.map(item => item.category);
    
    defaultCategories.forEach(category => {
      if (!existingCategories.includes(category)) {
        result.push({
          category,
          count: 0,
          utilization: 0,
          revenue: 0
        });
      }
    });

    // Limiter à 4 catégories maximum
    return result.slice(0, 4);
  };

  const vehicleStats = calculateVehicleStats();

  // Calculer les données pour le graphique circulaire des statuts
  const calculateStatusData = () => {
    if (!bookings || bookings.length === 0) {
      return [
        { name: 'En attente', value: 0, color: '#f59e0b' },
        { name: 'Confirmées', value: 0, color: '#3b82f6' },
        { name: 'Terminées', value: 0, color: '#10b981' },
        { name: 'Annulées', value: 0, color: '#ef4444' }
      ];
    }

    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length;

    return [
      { name: 'En attente', value: pending, color: '#f59e0b' },
      { name: 'Confirmées', value: confirmed, color: '#3b82f6' },
      { name: 'Terminées', value: completed, color: '#10b981' },
      { name: 'Annulées', value: cancelled, color: '#ef4444' }
    ];
  };

  const statusData = calculateStatusData();

  const isLoading = isLoadingVehicles || isLoadingBookings;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Cartes de Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                      <h3 className="text-2xl font-bold mt-2">{stats.revenue.toLocaleString('fr-FR')} DH</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En route</p>
                      <h3 className="text-2xl font-bold mt-2">{stats.inRoute}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Car className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En attente</p>
                      <h3 className="text-2xl font-bold mt-2">{stats.pending}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                  {stats.pending > 0 && (
                    <div className="mt-4">
                      <Link to="/dashboard/owner/bookings" className="text-sm text-primary hover:underline flex items-center">
                        Gérer les demandes <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Annulées</p>
                      <h3 className="text-2xl font-bold mt-2">{stats.canceled}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle>Revenus hebdomadaires</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vue d'ensemble des revenus et réservations
                    </p>
                  </div>
                  <select
                    className="text-sm bg-transparent border rounded-md px-2 py-1"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as '7days' | '30days' | '90days')}
                  >
                    <option value="7days">7 jours</option>
                    <option value="30days">30 jours</option>
                    <option value="90days">90 jours</option>
                  </select>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="average" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" />
                        <YAxis tickFormatter={(value) => `${value.toLocaleString('fr-FR')} DH`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          formatter={(value: number) => [`${value.toLocaleString('fr-FR')} DH`, 'Revenus']}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#revenue)"
                          name="Revenus"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle>Statut des réservations</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Répartition des réservations par statut
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    {bookings && bookings.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [value, 'Réservations']}
                            contentStyle={{
                              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <p>Aucune réservation disponible</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistiques par catégorie de véhicule */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
              {vehicleStats.map((stat) => (
                <Card key={stat.category}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{stat.category}</h3>
                        <span className="text-sm text-muted-foreground">{stat.count} véhicules</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Taux d'utilisation</span>
                            <span className="font-medium">{stat.utilization}%</span>
                          </div>
                          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${stat.utilization}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Revenus</span>
                          <span className="font-medium">{stat.revenue.toLocaleString('fr-FR')} DH</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Ajouter un véhicule */}
            <div className="mb-8">
              <Link to="/cars/add">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter un véhicule
                </Button>
              </Link>
            </div>

            {/* Réservations Récentes - uniquement les réservations reçues pour les véhicules de l'agence */}
            <div className="mt-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Réservations Reçues</h2>
                <Link to="/dashboard/owner/bookings" className="text-sm text-primary hover:underline flex items-center">
                  Gérer toutes les réservations <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <BookingsList />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
