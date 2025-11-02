import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Star, Upload, X, Camera } from "lucide-react";
import { RatingStars } from "@/components/ratings/RatingStars";
import { mockReviewsApi } from "@/lib/mock-reviews-data";
import { mockBookingApi } from "@/lib/mock-booking-data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const SubmitReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Ratings
  const [overallRating, setOverallRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [agencyRating, setAgencyRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load booking
  useEffect(() => {
    const loadBooking = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const bookingData = await mockBookingApi.getBookingById(id);
        
        if (!bookingData) {
          toast({
            variant: "destructive",
            title: "Réservation introuvable",
            description: "Cette réservation n'existe pas",
          });
          navigate('/dashboard/renter/bookings');
          return;
        }

        // Vérifier que c'est bien la réservation de l'utilisateur et qu'elle est terminée
        if (bookingData.renter_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Cette réservation ne vous appartient pas",
          });
          navigate('/dashboard/renter/bookings');
          return;
        }

        if (bookingData.status !== 'completed') {
          toast({
            variant: "destructive",
            title: "Réservation non terminée",
            description: "Vous ne pouvez laisser un avis qu'après la fin de la réservation",
          });
          navigate(`/bookings/${id}`);
          return;
        }

        // Vérifier si un avis existe déjà
        const existingReviews = await mockReviewsApi.getVehicleReviews(bookingData.vehicle_id);
        const hasExistingReview = existingReviews.some(r => r.reviewer_id === user.id && r.booking_id === id);
        
        if (hasExistingReview) {
          toast({
            variant: "destructive",
            title: "Avis déjà soumis",
            description: "Vous avez déjà laissé un avis pour cette réservation",
          });
          navigate(`/cars/${bookingData.vehicle_id}/reviews`);
          return;
        }

        setBooking(bookingData);
      } catch (err) {
        console.error("Error loading booking:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la réservation",
        });
        navigate('/dashboard/renter/bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [id, user, navigate, toast]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    
    // Créer des previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (overallRating === 0) {
      newErrors.overallRating = "Veuillez donner une note globale";
    }

    if (vehicleRating === 0) {
      newErrors.vehicleRating = "Veuillez noter le véhicule";
    }

    if (agencyRating === 0) {
      newErrors.agencyRating = "Veuillez noter l'agence";
    }

    if (communicationRating === 0) {
      newErrors.communicationRating = "Veuillez noter la communication";
    }

    if (comment.length < 20) {
      newErrors.comment = "Le commentaire doit contenir au moins 20 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!booking || !user || !validateForm()) {
      toast({
        variant: "destructive",
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs requis",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Convertir les photos en URLs (dans un vrai système, on les uploaderait)
      const photoUrls: string[] = photoPreviews;

      // Créer la review
      await mockReviewsApi.createReview({
        vehicle_id: booking.vehicle_id,
        booking_id: id,
        reviewer_id: user.id,
        reviewed_user_id: booking.owner_id,
        rating: overallRating,
        comment,
        photos: photoUrls,
        vehicle_rating: vehicleRating,
        agency_rating: agencyRating,
        communication_rating: communicationRating,
      });

      toast({
        title: "Avis soumis !",
        description: "Votre avis a été enregistré et sera publié après modération",
      });

      navigate(`/cars/${booking.vehicle_id}/reviews`);
    } catch (err) {
      console.error("Error submitting review:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre votre avis. Veuillez réessayer.",
      });
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={`/bookings/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la réservation
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laisser un avis</h1>
            <p className="text-gray-600 mt-2">
              Partagez votre expérience pour aider d'autres utilisateurs
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Votre réservation s'est terminée le {new Date(booking.end_date).toLocaleDateString('fr-FR')}.
            Votre avis aidera d'autres utilisateurs à prendre leur décision.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Évaluation complète</CardTitle>
            <CardDescription>
              Veuillez noter différents aspects de votre expérience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Note globale */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Note globale <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <RatingStars
                  value={overallRating}
                  onChange={setOverallRating}
                  size="lg"
                />
                {overallRating > 0 && (
                  <span className="text-lg font-medium">
                    {overallRating} / 5
                  </span>
                )}
              </div>
              {errors.overallRating && (
                <p className="text-sm text-red-600 mt-1">{errors.overallRating}</p>
              )}
            </div>

            {/* Note véhicule */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Évaluation du véhicule <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Comment évaluez-vous l'état, le confort et la propreté du véhicule ?
                </p>
                <div className="flex items-center gap-4">
                  <RatingStars
                    value={vehicleRating}
                    onChange={setVehicleRating}
                  />
                  {vehicleRating > 0 && (
                    <span className="text-sm font-medium">
                      {vehicleRating} / 5
                    </span>
                  )}
                </div>
              </div>
              {errors.vehicleRating && (
                <p className="text-sm text-red-600 mt-1">{errors.vehicleRating}</p>
              )}
            </div>

            {/* Note agence */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Évaluation de l'agence <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Comment évaluez-vous le service et la fiabilité de l'agence ?
                </p>
                <div className="flex items-center gap-4">
                  <RatingStars
                    value={agencyRating}
                    onChange={setAgencyRating}
                  />
                  {agencyRating > 0 && (
                    <span className="text-sm font-medium">
                      {agencyRating} / 5
                    </span>
                  )}
                </div>
              </div>
              {errors.agencyRating && (
                <p className="text-sm text-red-600 mt-1">{errors.agencyRating}</p>
              )}
            </div>

            {/* Note communication */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Communication <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Comment évaluez-vous la qualité de la communication avec l'agence ?
                </p>
                <div className="flex items-center gap-4">
                  <RatingStars
                    value={communicationRating}
                    onChange={setCommunicationRating}
                  />
                  {communicationRating > 0 && (
                    <span className="text-sm font-medium">
                      {communicationRating} / 5
                    </span>
                  )}
                </div>
              </div>
              {errors.communicationRating && (
                <p className="text-sm text-red-600 mt-1">{errors.communicationRating}</p>
              )}
            </div>

            {/* Commentaire */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Commentaire détaillé <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez votre expérience en détail (minimum 20 caractères)..."
                className="min-h-32"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                  {comment.length}/20 caractères minimum
                </p>
                {comment.length >= 20 && (
                  <span className="text-sm text-green-600">✓ Longueur suffisante</span>
                )}
              </div>
              {errors.comment && (
                <p className="text-sm text-red-600 mt-1">{errors.comment}</p>
              )}
            </div>

            {/* Photos */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Photos (optionnel)
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Ajoutez des photos pour illustrer votre avis
              </p>
              
              <div className="space-y-4">
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    as="span"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {photos.length === 0 ? 'Ajouter des photos' : `Ajouter d'autres photos (${photos.length} sélectionnées)`}
                  </Button>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? "Envoi en cours..." : "Publier mon avis"}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Votre avis sera publié après modération par notre équipe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitReview;

