import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from '@/components/ratings/RatingStars';
import { Star } from 'lucide-react';

interface RentalReviewDialogProps {
  rentalId: string;
  reviewerId: string;
  reviewedId: string;
  reviewerRole: 'renter' | 'owner';
  onReviewSubmitted?: () => void;
}

export const RentalReviewDialog = ({
  rentalId,
  reviewerId,
  reviewedId,
  reviewerRole,
  onReviewSubmitted
}: RentalReviewDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: reviewerId,
          reviewed_id: reviewedId,
          rating,
          comment,
          status: 'pending',
          rental_id: rentalId
        });

      if (error) throw error;

      toast({
        title: "Avis soumis",
        description: "Votre avis a été envoyé avec succès",
      });

      setIsOpen(false);
      setRating(0);
      setComment('');
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre votre avis. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Star className="h-4 w-4" />
          Laisser un avis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {reviewerRole === 'renter' 
              ? "Évaluez votre expérience de location" 
              : "Évaluez le locataire"}
          </DialogTitle>
          <DialogDescription>
            {reviewerRole === 'renter'
              ? "Partagez votre expérience avec cette voiture et son propriétaire"
              : "Partagez votre expérience avec ce locataire"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Note</label>
            <RatingStars
              value={rating}
              onChange={setRating}
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Commentaire</label>
            <Textarea
              placeholder={
                reviewerRole === 'renter'
                  ? "Décrivez votre expérience avec la voiture et le propriétaire..."
                  : "Décrivez votre expérience avec le locataire..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? "Envoi..." : "Envoyer l'avis"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 