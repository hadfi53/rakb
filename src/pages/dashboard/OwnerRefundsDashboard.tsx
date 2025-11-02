import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { mockFinancialApi, Refund } from "@/lib/mock-financial-data";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react";

const OwnerRefundsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState<Refund[]>([]);

  useEffect(() => {
    const loadRefunds = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const refundsData = await mockFinancialApi.getRefunds(user.id);
        setRefunds(refundsData);
      } catch (error) {
        console.error('Error loading refunds:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRefunds();
  }, [user]);

  const getStatusIcon = (status: Refund['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: Refund['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'processing':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  const getStatusColor = (status: Refund['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: refunds.reduce((sum, r) => sum + r.amount, 0),
    pending: refunds.filter(r => r.status === 'pending').length,
    processing: refunds.filter(r => r.status === 'processing').length,
    completed: refunds.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des remboursements...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Remboursements</h1>
          <p className="text-gray-600 mt-2">Gestion des remboursements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total remboursé</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.completed)}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">En attente</p>
              <h3 className="text-2xl font-bold mt-2">{stats.pending}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">En cours</p>
              <h3 className="text-2xl font-bold mt-2">{stats.processing}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total demandé</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.total)}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Refunds List */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des remboursements</CardTitle>
          </CardHeader>
          <CardContent>
            {refunds.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Réservation</th>
                      <th className="text-left py-3 px-4 font-medium">Montant</th>
                      <th className="text-left py-3 px-4 font-medium">Raison</th>
                      <th className="text-left py-3 px-4 font-medium">Statut</th>
                      <th className="text-left py-3 px-4 font-medium">Date de demande</th>
                      <th className="text-left py-3 px-4 font-medium">Date de traitement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            to={`/bookings/${refund.booking_id}`}
                            className="text-primary hover:underline"
                          >
                            #{refund.booking_id.slice(-8)}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(refund.amount)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{refund.reason}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(refund.status)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(refund.status)}`}>
                              {getStatusLabel(refund.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(refund.requested_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {refund.processed_date
                            ? new Date(refund.processed_date).toLocaleDateString('fr-FR')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun remboursement disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerRefundsDashboard;

