import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicle } from "@/hooks/use-vehicle";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getVehicleReviews, getVehicleReviewStats, type Review } from "@/lib/backend/reviews";
import { RatingStars } from "@/components/ratings/RatingStars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const VehicleReviews = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getVehicleById } = useVehicle();

  const [vehicle, setVehicle] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { rating: number; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load vehicle
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) return;
      try {
        const vehicleData = await getVehicleById(id);
        setVehicle(vehicleData);
      } catch (err) {
        console.error("Error loading vehicle:", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données du véhicule",
        });
        navigate('/');
      }
    };
    loadVehicle();
  }, [id, getVehicleById, navigate, toast]);

  // Load reviews and stats
  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [reviewsResult, statsResult] = await Promise.all([
          getVehicleReviews(id),
          getVehicleReviewStats(id),
        ]);
        
        if (reviewsResult.error) {
          throw reviewsResult.error;
        }
        if (statsResult.error) {
          throw statsResult.error;
        }
        
        setReviews(reviewsResult.reviews);
        setStats(statsResult.stats);
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
  }, [id, toast]);

  if (loading && !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={`/cars/${id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux détails du véhicule
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Avis et évaluations</h1>
            <p className="text-gray-600 mt-2">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
          </div>
        </div>

        {/* Stats Card */}
        {stats && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-2">
                      <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                      <span className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {stats.totalReviews} avis
                    </p>
                  </div>
                  <div className="h-16 w-px bg-gray-300"></div>
                  <div>
                    <p className="text-sm text-gray-600">Distribution</p>
                    <div className="flex flex-col gap-1 mt-2">
                      {stats.ratingDistribution.slice().reverse().map((dist) => (
                        <div key={dist.rating} className="flex items-center gap-2">
                          <span className="text-xs w-12">{dist.rating} étoiles</span>
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400"
                              style={{
                                width: `${(dist.count / stats.totalReviews) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-8">{dist.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  {/* Note: Photos and response rate can be added later if needed in reviews table */}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters removed - reviews are sorted by newest from backend */}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun avis pour ce véhicule</p>
                <p className="text-sm text-gray-500 mt-2">
                  Soyez le premier à laisser un avis après votre réservation !
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
                        {review.reviewer?.avatar_url && (
                          <AvatarImage src={review.reviewer.avatar_url} alt={`${review.reviewer.first_name} ${review.reviewer.last_name}`} />
                        )}
                        <AvatarFallback>
                          {review.reviewer
                            ? `${review.reviewer.first_name?.[0] || ''}${review.reviewer.last_name?.[0] || ''}`
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {review.reviewer
                            ? `${review.reviewer.first_name} ${review.reviewer.last_name}`
                            : "Utilisateur anonyme"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <RatingStars value={review.rating} readOnly size="sm" />
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mb-4">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleReviews;

