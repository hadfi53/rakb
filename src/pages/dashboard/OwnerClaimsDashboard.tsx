import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { mockDamageClaimsApi, Claim } from "@/lib/mock-damage-claims-data";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const OwnerClaimsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    const loadClaims = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const claimsData = await mockDamageClaimsApi.getClaims(user.id);
        setClaims(claimsData);
      } catch (error) {
        console.error('Error loading claims:', error);
        toast.error('Erreur lors du chargement des réclamations');
      } finally {
        setLoading(false);
      }
    };

    loadClaims();
  }, [user]);

  const getStatusIcon = (status: Claim['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'submitted':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'under_review':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-green-200 text-green-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: claims.length,
    totalAmount: claims.reduce((sum, c) => sum + c.claim_amount, 0),
    pending: claims.filter(c => c.status === 'submitted' || c.status === 'under_review').length,
    approved: claims.filter(c => c.status === 'approved' || c.status === 'paid').length
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Réclamations</h1>
          <p className="text-gray-600 mt-2">Suivi des réclamations d'assurance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total réclamations</p>
              <h3 className="text-2xl font-bold mt-2">{stats.total}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Montant total</p>
              <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.totalAmount)}</h3>
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
              <p className="text-sm font-medium text-muted-foreground">Approuvées</p>
              <h3 className="text-2xl font-bold mt-2">{stats.approved}</h3>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des réclamations</CardTitle>
          </CardHeader>
          <CardContent>
            {claims.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Réclamation</th>
                      <th className="text-left py-3 px-4 font-medium">Réservation</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Montant</th>
                      <th className="text-left py-3 px-4 font-medium">Statut</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            to={`/dashboard/owner/claims/${claim.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            #{claim.id.slice(-8)}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/bookings/${claim.booking_id}`}
                            className="text-primary hover:underline"
                          >
                            #{claim.booking_id.slice(-8)}
                          </Link>
                        </td>
                        <td className="py-3 px-4 capitalize">{claim.claim_type}</td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(claim.claim_amount)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(claim.status)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                              {claim.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {claim.submitted_date
                            ? new Date(claim.submitted_date).toLocaleDateString('fr-FR')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune réclamation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerClaimsDashboard;

