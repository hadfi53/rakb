import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockCancellationApi, CancellationCalculation } from "@/lib/mock-cancellation-data";
import { mockBookingApi } from "@/lib/mock-booking-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CancelBookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState<CancellationCalculation | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const bookingData = await mockBookingApi.getBookingById(id);
        if (!bookingData) {
          toast.error('Réservation introuvable');
          navigate('/dashboard');
          return;
        }

        setBooking(bookingData);
        
        // Calculate cancellation
        setCalculating(true);
        const calc = await mockCancellationApi.calculateCancellation(id);
        setCalculation(calc);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
        setCalculating(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  const handleCancel = async () => {
    if (!user || !id || !reason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    try {
      setCancelling(true);
      const role = booking.renter_id === user.id ? 'renter' : 'owner';
      await mockCancellationApi.cancelBooking(id, user.id, role, reason);
      
      toast.success('Réservation annulée avec succès');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
      setConfirmDialogOpen(false);
    }
  };

  if (loading || calculating) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!calculation || !booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Annuler la réservation</h1>
          <p className="text-gray-600 mt-2">Politique d'annulation et frais</p>
        </div>

        {/* Alert */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Attention</p>
            <p className="text-sm text-yellow-800 mt-1">
              L'annulation de cette réservation entraînera des frais selon notre politique.
            </p>
          </div>
        </div>

        {/* Cancellation Calculation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Détails de l'annulation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date de début de réservation</p>
                <p className="font-medium">{new Date(booking.start_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Jours avant le début</p>
                <p className="font-medium">{calculation.days_before} jours</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant total</p>
                <p className="font-medium">{formatCurrency(calculation.booking_total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Politique appliquée</p>
                <p className="font-medium">
                  {calculation.refund_percentage}% remboursé, {calculation.fee_percentage}% de frais
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant remboursable</span>
                <span className="font-medium">{formatCurrency(calculation.refund_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frais d'annulation</span>
                <span className="font-medium text-red-600">{formatCurrency(calculation.fee_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Remboursement net</span>
                <span className={calculation.net_refund > 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(calculation.net_refund)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Politique d'annulation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span><strong>Plus de 7 jours avant :</strong> Remboursement complet (100%)</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                <span><strong>3 à 7 jours avant :</strong> Remboursement partiel (50%, frais de 50%)</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <span><strong>Moins de 3 jours :</strong> Aucun remboursement (frais de 100%)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Reason Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Raison de l'annulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Raison *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Veuillez indiquer la raison de l'annulation..."
                  rows={4}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
            Retour
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={!reason.trim()}
            className="flex-1"
          >
            Confirmer l'annulation
          </Button>
        </div>

        {/* Confirm Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir annuler cette réservation ? 
                Vous recevrez un remboursement de {formatCurrency(calculation.net_refund)} 
                {calculation.net_refund === 0 && ' (aucun remboursement selon la politique)'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelling ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CancelBookingPage;

