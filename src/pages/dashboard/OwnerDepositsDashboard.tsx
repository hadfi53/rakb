import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { mockFinancialApi, Deposit } from "@/lib/mock-financial-data";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const OwnerDepositsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [retainDialogOpen, setRetainDialogOpen] = useState(false);
  const [retainAmount, setRetainAmount] = useState('');
  const [retainReason, setRetainReason] = useState('');

  useEffect(() => {
    const loadDeposits = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const depositsData = await mockFinancialApi.getDeposits(user.id);
        setDeposits(depositsData);
      } catch (error) {
        console.error('Error loading deposits:', error);
        toast.error('Erreur lors du chargement des dépôts');
      } finally {
        setLoading(false);
      }
    };

    loadDeposits();
  }, [user]);

  const handleRelease = async (depositId: string) => {
    if (!user) return;

    try {
      await mockFinancialApi.releaseDeposit(user.id, depositId);
      toast.success('Dépôt libéré avec succès');
      const updatedDeposits = await mockFinancialApi.getDeposits(user.id);
      setDeposits(updatedDeposits);
    } catch (error) {
      console.error('Error releasing deposit:', error);
      toast.error('Erreur lors de la libération du dépôt');
    }
  };

  const handleRetain = async () => {
    if (!user || !selectedDeposit) return;

    try {
      const amount = parseFloat(retainAmount);
      if (isNaN(amount) || amount <= 0 || amount > selectedDeposit.amount) {
        toast.error('Montant invalide');
        return;
      }

      await mockFinancialApi.retainDeposit(user.id, selectedDeposit.id, amount, retainReason);
      toast.success('Dépôt retenu avec succès');
      setRetainDialogOpen(false);
      setRetainAmount('');
      setRetainReason('');
      setSelectedDeposit(null);
      
      const updatedDeposits = await mockFinancialApi.getDeposits(user.id);
      setDeposits(updatedDeposits);
    } catch (error) {
      console.error('Error retaining deposit:', error);
      toast.error('Erreur lors de la rétention du dépôt');
    }
  };

  const getStatusIcon = (status: Deposit['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'held':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      case 'released':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'retained':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: Deposit['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'held':
        return 'Bloqué';
      case 'released':
        return 'Libéré';
      case 'retained':
        return 'Retenu';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };

  const getStatusColor = (status: Deposit['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'held':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'retained':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: deposits.reduce((sum, d) => sum + d.amount, 0),
    held: deposits.filter(d => d.status === 'held').reduce((sum, d) => sum + d.amount, 0),
    released: deposits.filter(d => d.status === 'released').reduce((sum, d) => sum + d.amount, 0),
    retained: deposits.filter(d => d.status === 'retained').reduce((sum, d) => sum + (d.retained_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des dépôts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard/owner"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Dépôts</h1>
          <p className="text-gray-600 mt-2">Gérez les dépôts de garantie de vos réservations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total des dépôts</p>
                  <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.total)}</h3>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dépôts bloqués</p>
                  <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.held)}</h3>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dépôts libérés</p>
                  <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.released)}</h3>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dépôts retenus</p>
                  <h3 className="text-2xl font-bold mt-2">{formatCurrency(stats.retained)}</h3>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deposits List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des dépôts</CardTitle>
          </CardHeader>
          <CardContent>
            {deposits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Réservation</th>
                      <th className="text-left py-3 px-4 font-medium">Montant</th>
                      <th className="text-left py-3 px-4 font-medium">Statut</th>
                      <th className="text-left py-3 px-4 font-medium">Date de blocage</th>
                      <th className="text-left py-3 px-4 font-medium">Date de libération</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((deposit) => (
                      <tr key={deposit.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            to={`/bookings/${deposit.booking_id}`}
                            className="text-primary hover:underline"
                          >
                            #{deposit.booking_id.slice(-8)}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium">{formatCurrency(deposit.amount)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deposit.status)}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                              {getStatusLabel(deposit.status)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(deposit.hold_date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {deposit.release_date
                            ? new Date(deposit.release_date).toLocaleDateString('fr-FR')
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {deposit.status === 'held' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRelease(deposit.id)}
                                >
                                  Libérer
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDeposit(deposit);
                                    setRetainAmount(deposit.amount.toString());
                                    setRetainDialogOpen(true);
                                  }}
                                >
                                  Retenir
                                </Button>
                              </>
                            )}
                            {deposit.status === 'retained' && deposit.retain_reason && (
                              <span className="text-sm text-gray-600" title={deposit.retain_reason}>
                                {deposit.retained_amount ? formatCurrency(deposit.retained_amount) : ''}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun dépôt disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retain Dialog */}
        <Dialog open={retainDialogOpen} onOpenChange={setRetainDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retenir un dépôt</DialogTitle>
              <DialogDescription>
                Spécifiez le montant à retenir et la raison
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="amount">Montant à retenir</Label>
                <Input
                  id="amount"
                  type="number"
                  value={retainAmount}
                  onChange={(e) => setRetainAmount(e.target.value)}
                  max={selectedDeposit?.amount}
                  min={0}
                />
                {selectedDeposit && (
                  <p className="text-sm text-gray-500 mt-1">
                    Montant maximum : {formatCurrency(selectedDeposit.amount)}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="reason">Raison de la rétention</Label>
                <Textarea
                  id="reason"
                  value={retainReason}
                  onChange={(e) => setRetainReason(e.target.value)}
                  placeholder="Dommages, retard, etc."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRetainDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleRetain}>Confirmer la rétention</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OwnerDepositsDashboard;

