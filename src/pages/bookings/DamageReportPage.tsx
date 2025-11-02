import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockDamageClaimsApi, DamageReport } from "@/lib/mock-damage-claims-data";
import { mockBookingApi } from "@/lib/mock-booking-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import ImageUpload from "@/pages/cars/components/ImageUpload";

const DamageReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [formData, setFormData] = useState({
    damage_type: 'scratch' as DamageReport['damage_type'],
    severity: 'minor' as DamageReport['severity'],
    description: '',
    location: '',
    estimated_cost: 0
  });
  const [photos, setPhotos] = useState<string[]>([]);

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
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !id) return;

    if (!formData.description.trim() || !formData.location.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSubmitting(true);
      await mockDamageClaimsApi.createDamageReport(id, user.id, {
        ...formData,
        photos,
        reported_by: 'owner'
      });

      toast.success('Signalement de dommage créé avec succès');
      navigate(`/bookings/${id}`);
    } catch (error) {
      console.error('Error creating damage report:', error);
      toast.error('Erreur lors de la création du signalement');
    } finally {
      setSubmitting(false);
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

  if (!booking) return null;

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
          <h1 className="text-3xl font-bold text-gray-900">Signaler un dommage</h1>
          <p className="text-gray-600 mt-2">Réservation #{id.slice(-8)}</p>
        </div>

        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Information importante</p>
            <p className="text-sm text-yellow-800 mt-1">
              Veuillez fournir des photos claires et une description détaillée du dommage pour faciliter le traitement.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Détails du dommage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="damage_type">Type de dommage *</Label>
                <Select
                  value={formData.damage_type}
                  onValueChange={(value: DamageReport['damage_type']) =>
                    setFormData({ ...formData, damage_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scratch">Rayure</SelectItem>
                    <SelectItem value="dent">Bosse</SelectItem>
                    <SelectItem value="crack">Fissure</SelectItem>
                    <SelectItem value="stain">Tache</SelectItem>
                    <SelectItem value="mechanical">Problème mécanique</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">Gravité *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: DamageReport['severity']) =>
                    setFormData({ ...formData, severity: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Mineur</SelectItem>
                    <SelectItem value="moderate">Modéré</SelectItem>
                    <SelectItem value="major">Majeur</SelectItem>
                    <SelectItem value="severe">Sévère</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Emplacement du dommage *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Porte avant droite, pare-brise, etc."
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez le dommage en détail..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="estimated_cost">Coût estimé (MAD)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.01}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                initialImages={photos}
                onImagesChange={setPhotos}
              />
              <p className="text-sm text-gray-500 mt-2">
                Ajoutez jusqu'à 5 photos du dommage
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Envoi...' : 'Envoyer le signalement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DamageReportPage;

