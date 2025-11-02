import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Star, MessageSquare, Flag, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { mockReviewsApi, MockReview } from "@/lib/mock-reviews-data";
import { RatingStars } from "@/components/ratings/RatingStars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AgencyReviews = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responding, setResponding] = useState(false);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const reviewsData = await mockReviewsApi.getAgencyReviews(user.id);
        // Trier par date (plus récents en premier)
        reviewsData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error loading reviews:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les avis",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [user, toast]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast({
        variant: "destructive",
        title: "Réponse vide",
        description: "Veuillez écrire une réponse",
      });
      return;
    }

    try {
      setResponding(true);
      await mockReviewsApi.respondToReview(reviewId, responseText);
      
      // Mettre à jour la review localement
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? {
              ...r,
              agency_response: {
                response: responseText,
                responded_at: new Date().toISOString(),
              },
            }
          : r
      ));

      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été publiée",
      });

      setRespondingTo(null);
      setResponseText("");
    } catch (err) {
      console.error("Error responding to review:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
      });
    } finally {
      setResponding(false);
    }
  };

  const handleReport = async (reviewId: string, reason: string) => {
    try {
      await mockReviewsApi.reportReview(reviewId, reason);
      toast({
        title: "Avis signalé",
        description: "L'avis a été signalé à notre équipe de modération",
      });
    } catch (err) {
      console.error("Error reporting review:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de signaler l'avis",
      });
    }
  };

  const getReviewerName = (reviewerId: string): string => {
    return `Client ${reviewerId.slice(0, 8)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/dashboard/owner"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des avis</h1>
            <p className="text-gray-600 mt-2">
              Gérez les avis reçus pour vos véhicules
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total d'avis</p>
                <p className="text-2xl font-bold mt-1">{reviews.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Note moyenne</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <p className="text-2xl font-bold">
                    {reviews.length > 0 
                      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Taux de réponse</p>
                <p className="text-2xl font-bold mt-1">
                  {reviews.length > 0
                    ? Math.round((reviews.filter(r => r.agency_response).length / reviews.length) * 100)
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun avis reçu</p>
                <p className="text-sm text-gray-500 mt-2">
                  Les avis de vos clients apparaîtront ici
                </p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getReviewerName(review.reviewer_id).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getReviewerName(review.reviewer_id)}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingStars value={review.rating} readOnly size="sm" />
                      {getStatusBadge(review.status)}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{review.comment}</p>

                  {/* Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {review.photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Réponse existante */}
                  {review.agency_response ? (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <p className="font-medium text-blue-900">Votre réponse</p>
                        <span className="text-xs text-blue-600">
                          {format(new Date(review.agency_response.responded_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800">{review.agency_response.response}</p>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRespondingTo(review.id)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Répondre à cet avis
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Répondre à l'avis</DialogTitle>
                            <DialogDescription>
                              Votre réponse sera visible publiquement sous cet avis
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Votre réponse</Label>
                              <Textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Merci pour votre avis..."
                                rows={5}
                                className="mt-2"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText("");
                              }}
                            >
                              Annuler
                            </Button>
                            <Button
                              onClick={() => handleRespond(review.id)}
                              disabled={responding || !responseText.trim()}
                            >
                              {responding ? "Envoi..." : "Publier la réponse"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Flag className="w-4 h-4 mr-2" />
                          Signaler
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Signaler cet avis</AlertDialogTitle>
                          <AlertDialogDescription>
                            Pourquoi signalez-vous cet avis ? Notre équipe examinera votre signalement.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleReport(review.id, 'Contenu inapproprié')}
                          >
                            Contenu inapproprié
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleReport(review.id, 'Faux avis')}
                          >
                            Faux avis
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleReport(review.id, 'Spam')}
                          >
                            Spam
                          </Button>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyReviews;

