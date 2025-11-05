import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { adminService, AdminStats } from "@/lib/admin-service";
import { supabase } from "@/lib/supabase";
import { 
  Users, Car, Calendar, DollarSign, FileText, 
  CheckCircle, Clock, TrendingUp, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

    const loadStats = async () => {
      if (!user) return;

      try {
        setLoading(true);
      console.log('Loading admin stats...');
        const data = await adminService.getStats();
      console.log('Admin stats loaded:', data);
        setStats(data);
      
      // Load recent payments
      const recentPayments = await adminService.getPayments({ limit: 10 });
      setPayments(recentPayments);
      console.log('Recent payments loaded:', recentPayments.length);
      } catch (error) {
        console.error('Error loading stats:', error);
        toast.error('Erreur lors du chargement des statistiques');
      // Set default stats to prevent crash
      setStats({
        totalUsers: 0,
        totalVehicles: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingDocuments: 0,
        pendingVerifications: 0,
        activeBookings: 0,
        completedBookings: 0,
        revenueByMonth: [],
        bookingsByStatus: [],
        revenueByStatus: [],
        topVehicles: [],
        topHosts: [],
        userGrowth: [],
        recentRevenue: 0,
        averageBookingValue: 0,
        platformCommission: 0,
        hostPayouts: 0,
      });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadStats();
  }, [user]);

  // Set up real-time subscriptions for stats updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to changes in profiles, cars, bookings, and documents
    const channel = supabase
      .channel('admin-dashboard-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cars'
        },
        () => {
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'identity_documents'
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

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

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Impossible de charger les statistiques</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/admin/users"
    },
    {
      title: "Véhicules",
      value: stats.totalVehicles,
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100",
      link: "/admin/vehicles"
    },
    {
      title: "Réservations",
      value: stats.totalBookings,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/admin/bookings"
    },
    {
      title: "Revenus totaux",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      link: "/admin/bookings"
    },
    {
      title: "Documents en attente",
      value: stats.pendingDocuments,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      link: "/admin/documents"
    },
    {
      title: "Vérifications en attente",
      value: stats.pendingVerifications,
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-100",
      link: "/admin/documents"
    },
    {
      title: "Réservations actives",
      value: stats.activeBookings,
      icon: CheckCircle,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
      link: "/admin/bookings?status=confirmed"
    },
    {
      title: "Réservations terminées",
      value: stats.completedBookings,
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      link: "/admin/bookings?status=completed"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Administrateur</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de la plateforme RAKB</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link key={index} to={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-full`}>
                        <Icon className={`${stat.color} w-6 h-6`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Payments */}
        {payments.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Paiements récents</CardTitle>
              <CardDescription>Derniers paiements capturés par Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Montant</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Réservation</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID Stripe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(payment.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(payment.amount || 0)} {payment.currency || 'MAD'}
                        </td>
                        <td className="py-3 px-4">
                          {payment.booking_id ? (
                            <Link
                              to={`/bookings/${payment.booking_id}`}
                              className="text-primary hover:underline"
                            >
                              {payment.booking_id.substring(0, 8)}...
                            </Link>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : payment.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {payment.status === 'completed' ? 'Complété' : 
                             payment.status === 'pending' ? 'En attente' :
                             payment.status === 'failed' ? 'Échoué' : payment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs text-gray-600">
                            {payment.provider_payment_id || payment.provider_ref || payment.provider || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/documents">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Vérifier les documents
                  {stats.pendingDocuments > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {stats.pendingDocuments}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link to="/admin/vehicles">
                <Button variant="outline" className="w-full justify-start">
                  <Car className="w-4 h-4 mr-2" />
                  Modérer les véhicules
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Gérer les utilisateurs
                </Button>
              </Link>
              <Link to="/admin/bookings">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Voir les réservations
                </Button>
              </Link>
              <Link to="/admin/emails">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Gérer les emails
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenus (30j)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.recentRevenue)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="text-green-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valeur moyenne</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.averageBookingValue)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="text-blue-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Commission plateforme</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.platformCommission)}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <DollarSign className="text-purple-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements hôtes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.hostPayouts)}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <DollarSign className="text-yellow-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des revenus (6 mois)</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.revenueByMonth && stats.revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenus" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookings by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Réservations par statut</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.bookingsByStatus && stats.bookingsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.bookingsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.bookingsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Growth and Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth */}
          <Card>
            <CardHeader>
              <CardTitle>Croissance des utilisateurs (6 mois)</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.userGrowth && stats.userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#3b82f6" name="Utilisateurs" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Revenus par statut</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.revenueByStatus && stats.revenueByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.revenueByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenus" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Véhicules</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topVehicles.length > 0 ? (
                <div className="space-y-4">
                  {stats.topVehicles.map((vehicle, index) => (
                    <div key={vehicle.car_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                          <p className="text-sm text-gray-500">{vehicle.bookings} réservations</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(vehicle.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun véhicule avec réservations</p>
              )}
            </CardContent>
          </Card>

          {/* Top Hosts */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Hôtes</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topHosts.length > 0 ? (
                <div className="space-y-4">
                  {stats.topHosts.map((host, index) => (
                    <div key={host.host_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{host.name}</p>
                          <p className="text-sm text-gray-500">{host.bookings} réservations</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatCurrency(host.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun hôte avec réservations</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux de réservation</span>
                  <Badge variant="outline">
                    {stats.totalBookings > 0 && stats.totalVehicles > 0
                      ? ((stats.activeBookings / stats.totalVehicles) * 100).toFixed(1)
                      : 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Revenu moyen par réservation</span>
                  <Badge variant="outline">
                    {formatCurrency(stats.averageBookingValue)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Documents en attente</span>
                  <Badge variant={stats.pendingDocuments > 0 ? "destructive" : "success"}>
                    {stats.pendingDocuments}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vérifications en attente</span>
                  <Badge variant={stats.pendingVerifications > 0 ? "destructive" : "success"}>
                    {stats.pendingVerifications}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut des réservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <Badge variant="outline">{stats.totalBookings}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Actives</span>
                  <Badge variant="success">{stats.activeBookings}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Terminées</span>
                  <Badge variant="default">{stats.completedBookings}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taux de complétion</span>
                  <Badge variant="outline">
                    {stats.totalBookings > 0
                      ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(1)
                      : 0}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

