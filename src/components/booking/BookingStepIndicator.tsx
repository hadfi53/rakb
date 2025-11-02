import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const BookingStepIndicator = ({ 
  currentStep, 
  totalSteps, 
  stepLabels 
}: BookingStepIndicatorProps) => {
  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div
              key={stepNumber}
              className="flex flex-col items-center flex-1 relative"
              aria-label={`Étape ${stepNumber}: ${label}`}
            >
              {/* Connector Line */}
              {index < stepLabels.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 left-[60%] w-full h-0.5 -z-10",
                    isCompleted ? "bg-primary" : "bg-gray-200"
                  )}
                />
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                  isCompleted &&
                    "bg-primary text-white shadow-md scale-110",
                  isCurrent &&
                    "bg-primary text-white shadow-lg ring-4 ring-primary/20 scale-110",
                  isPending &&
                    "bg-gray-200 text-gray-400"
                )}
                role="status"
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[100px]",
                  isCompleted && "text-primary",
                  isCurrent && "text-primary font-semibold",
                  isPending && "text-gray-400"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStepIndicator;
