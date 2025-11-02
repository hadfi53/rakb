import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from 'lucide-react';

interface CompleteRentalButtonProps {
  rentalId: string;
  onComplete?: () => void;
  isOwner: boolean;
}

export const CompleteRentalButton = ({
  rentalId,
  onComplete,
  isOwner
}: CompleteRentalButtonProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Mettre à jour le statut de la location
      const { error } = await supabase
        .from('rentals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          reviewed: false
        })
        .eq('id', rentalId);

      if (error) throw error;

      toast({
        title: "Location terminée",
        description: "La location a été marquée comme terminée. Vous pouvez maintenant laisser un avis.",
      });

      onComplete?.();
    } catch (error) {
      console.error('Error completing rental:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de terminer la location. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleComplete}
      disabled={isLoading}
      className="gap-2"
    >
      <CheckCircle className="h-4 w-4" />
      {isOwner ? "Confirmer le retour du véhicule" : "Confirmer la fin de location"}
    </Button>
  );
}; 