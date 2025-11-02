
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, Check } from "lucide-react";

interface ReservationFooterProps {
  currentStep: number;
  canContinue: boolean;
  handleBack: () => void;
  handleNext: () => void;
  handleSubmit: () => void;
  onClose: () => void;
}

export const ReservationFooter = ({
  currentStep,
  canContinue,
  handleBack,
  handleNext,
  handleSubmit,
  onClose
}: ReservationFooterProps) => {
  const isMobile = useIsMobile();
  
  if (currentStep === 5) {
    return (
      <Button className="w-full" onClick={onClose}>
        <Check className="w-4 h-4 mr-2" />
        Terminer
      </Button>
    );
  }

  return (
    <div className={`flex ${isMobile ? 'flex-col w-full gap-2' : 'w-full justify-between'}`}>
      {currentStep > 1 && (
        <Button 
          variant="outline" 
          onClick={handleBack}
          className={isMobile ? "w-full" : ""}
          size={isMobile ? "sm" : "default"}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      )}
      <div className={`${isMobile ? 'w-full' : currentStep === 1 ? 'w-full' : ''}`}>
        <Button
          onClick={currentStep === 4 ? handleSubmit : handleNext}
          disabled={!canContinue}
          className={`${isMobile ? 'w-full' : currentStep === 1 ? 'w-full' : ''}`}
          size={isMobile ? "sm" : "default"}
        >
          {currentStep === 4 ? "Confirmer la réservation" : "Continuer"}
        </Button>
      </div>
    </div>
  );
};
