import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { mockAdminApi, PendingVehicle } from "@/lib/mock-admin-data";
import { formatCurrency, getVehicleImageUrl } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Car } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const AdminVehiclesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<PendingVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<PendingVehicle | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await mockAdminApi.getPendingVehicles();
        setVehicles(data);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, [user]);

  const handleApprove = async (vehicleId: string) => {
    if (!user) return;

    try {
      setProcessing(true);
      await mockAdminApi.approveVehicle(vehicleId, user.id);
      toast.success('Véhicule approuvé avec succès');
      const updated = await mockAdminApi.getPendingVehicles();
      setVehicles(updated);
    } catch (error) {
      console.error('Error approving vehicle:', error);
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedVehicle || !rejectReason.trim()) {
      toast.error('Veuillez indiquer une raison');
      return;
    }

    try {
      setProcessing(true);
      await mockAdminApi.rejectVehicle(selectedVehicle.id, user.id, rejectReason);
      toast.success('Véhicule rejeté');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedVehicle(null);
      const updated = await mockAdminApi.getPendingVehicles();
      setVehicles(updated);
    } catch (error) {
      console.error('Error rejecting vehicle:', error);
      toast.error('Erreur lors du rejet');
    } finally {
      setProcessing(false);
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Modération des Véhicules</h1>
          <p className="text-gray-600 mt-2">Approuvez ou rejetez les véhicules en attente</p>
        </div>

        <div className="mb-6">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {vehicles.length} véhicule(s) en attente
          </Badge>
        </div>

        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={getVehicleImageUrl(vehicle.images[0])}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>📍 {vehicle.location}</p>
                    <p>💰 {formatCurrency(vehicle.price_per_day)}/jour</p>
                    <p>📅 Soumis le {new Date(vehicle.submitted_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApprove(vehicle.id)}
                      disabled={processing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setRejectDialogOpen(true);
                      }}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun véhicule en attente de modération</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter le véhicule</DialogTitle>
              <DialogDescription>
                Veuillez indiquer la raison du rejet
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Raison du rejet *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Le véhicule ne respecte pas nos standards de qualité..."
                rows={4}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminVehiclesPage;

