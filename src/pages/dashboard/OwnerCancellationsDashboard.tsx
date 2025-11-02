import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { mockCancellationApi, Cancellation } from "@/lib/mock-cancellation-data";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, XCircle, TrendingDown } from "lucide-react";

const OwnerCancellationsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);

  useEffect(() => {
    const loadCancellations = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await mockCancellationApi.getCancellations(user.id, 'owner');
        setCancellations(data);
      } catch (error) {
        console.error('Error loading cancellations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCancellations();
  }, [user]);

  const stats = {
    total: cancellations.length,
    totalRefund: cancellations.reduce((sum, c) => sum + c.refund_amount, 0),
    totalFees: cancellations.reduce((sum, c) => sum + c.fee_amount, 0),
    revenueImpact: cancellations.reduce((sum, c) => sum + c.fee_amount, 0)
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/dashboard/owner"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Historique des annulations</h1>
          <p className="text-gray-600 mt-2">Impact des annulations sur vos revenus</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total annulé</p>
              <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total remboursé</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRefund)}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total frais</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.totalFees)}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Impact revenus</p>
              <h3 className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(stats.revenueImpact)}</h3>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des annulations</CardTitle>
          </CardHeader>
          <CardContent>
            {cancellations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Réservation</th>
                      <th className="text-left py-3 px-4 font-medium">Annulé par</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Raison</th>
                      <th className="text-left py-3 px-4 font-medium">Remboursement</th>
                      <th className="text-left py-3 px-4 font-medium">Frais</th>
                      <th className="text-left py-3 px-4 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancellations.map((cancellation) => (
                      <tr key={cancellation.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            to={`/bookings/${cancellation.booking_id}`}
                            className="text-primary hover:underline"
                          >
                            #{cancellation.booking_id.slice(-8)}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          {cancellation.cancelled_by === 'owner' ? 'Agence' : 'Locataire'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(cancellation.cancellation_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{cancellation.reason}</td>
                        <td className="py-3 px-4 font-medium text-green-600">
                          {formatCurrency(cancellation.refund_amount)}
                        </td>
                        <td className="py-3 px-4 font-medium text-red-600">
                          {formatCurrency(cancellation.fee_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            cancellation.status === 'completed' ? 'bg-green-100 text-green-800' :
                            cancellation.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cancellation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune annulation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerCancellationsDashboard;

