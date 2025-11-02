
import { Progress } from "@/components/ui/progress";
import { DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface StepHeaderProps {
  currentStep: number;
  startDate?: Date;
  endDate?: Date;
}

export const StepHeader = ({ currentStep, startDate, endDate }: StepHeaderProps) => {
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Détails et dates";
      case 2: return "Assurance et options";
      case 3: return "Vos informations";
      case 4: return "Paiement sécurisé";
      case 5: return "Confirmation";
      default: return "";
    }
  };
  
  const getProgress = () => {
    return (currentStep / 5) * 100;
  };
  
  const days = startDate && endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  return (
    <DialogHeader className="p-6 pb-3">
      <div className="flex justify-between items-center w-full">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <span>Étape {currentStep}/5</span>
          <span className="text-gray-400 mx-2">•</span>
          <span>{getStepTitle()}</span>
        </DialogTitle>
        {currentStep < 5 && days > 0 && (
          <Badge variant="outline" className="font-normal">
            {days} jours
          </Badge>
        )}
      </div>
      <Progress value={getProgress()} className="h-1 mt-4" />
    </DialogHeader>
  );
};
