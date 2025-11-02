import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicle } from "@/hooks/use-vehicle";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Users, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { mockVehicleStatsApi, VehicleStats } from "@/lib/mock-vehicle-stats-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const VehicleStats = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getVehicleById } = useVehicle();

  const [vehicle, setVehicle] = useState<any>(null);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7days' | '30days' | '90days' | '1year'>('30days');

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
            description: "Vous n'êtes pas autorisé à voir les statistiques de ce véhicule",
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

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!id) return;

      try {
        const startDate = new Date();
        const endDate = new Date();
        
        switch (period) {
          case '7days':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case '1year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }

        const statsData = await mockVehicleStatsApi.getVehicleStats({
          vehicleId: id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        setStats(statsData);
      } catch (err) {
        console.error("Error loading stats:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les statistiques",
        });
      }
    };

    loadStats();
  }, [id, period, toast]);

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

  if (!vehicle || !stats) {
    return null;
  }

  // Format revenue by period for chart
  const revenueChartData = stats.revenue_by_period.slice(-12).map(item => ({
    period: format(new Date(item.period + '-01'), 'MMM', { locale: fr }),
    revenue: item.revenue,
    bookings: item.bookings,
  }));

  // Format bookings by status for pie chart
  const bookingsByStatusData = stats.bookings_by_status.map(item => ({
    name: item.status === 'pending' ? 'En attente' :
          item.status === 'confirmed' ? 'Confirmées' :
          item.status === 'completed' ? 'Terminées' :
          item.status === 'cancelled' ? 'Annulées' :
          item.status === 'rejected' ? 'Rejetées' : item.status,
    value: item.count,
  }));

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-3xl font-bold text-gray-900">Statistiques du véhicule</h1>
              <p className="text-gray-600 mt-2">
                {vehicle.make} {vehicle.model} {vehicle.year}
              </p>
            </div>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="90days">90 derniers jours</SelectItem>
                <SelectItem value="1year">1 an</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(stats.total_revenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Réservations</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total_bookings}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux d'occupation</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.occupancy_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Durée moyenne</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.average_booking_duration} jour(s)
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenus par période
              </CardTitle>
              <CardDescription>Évolution des revenus sur les 12 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name="Revenus (MAD)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bookings by Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Réservations par statut
              </CardTitle>
              <CardDescription>Répartition des réservations selon leur statut</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bookingsByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bookingsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Détails des réservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Confirmées</span>
                  <Badge variant="default">{stats.confirmed_bookings}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Terminées</span>
                  <Badge variant="default" className="bg-green-500">{stats.completed_bookings}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">En attente</span>
                  <Badge variant="secondary">{stats.pending_bookings}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Annulées</span>
                  <Badge variant="destructive">{stats.cancelled_bookings}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Table */}
          <Card>
            <CardHeader>
              <CardTitle>Revenus mensuels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.revenue_by_period.slice(-6).reverse().map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {format(new Date(item.period + '-01'), 'MMMM yyyy', { locale: fr })}
                      </p>
                      <p className="text-sm text-gray-500">{item.bookings} réservation(s)</p>
                    </div>
                    <p className="font-bold text-primary">
                      {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(item.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VehicleStats;

