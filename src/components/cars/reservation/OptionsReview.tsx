
interface OptionsReviewProps {
  selectedInsurance: any;
  selectedOptions: string[];
  additionalOptions: any[];
  calculateTotal: () => number;
  promoApplied: boolean;
}

export const OptionsReview = ({
  selectedInsurance,
  selectedOptions,
  additionalOptions,
  calculateTotal,
  promoApplied
}: OptionsReviewProps) => {
  return (
    <div className="p-4 rounded-lg bg-primary/5 space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Sous-total :</span>
        <span>{calculateTotal() - (promoApplied ? calculateTotal() * 0.1 : 0)} Dh</span>
      </div>
      {promoApplied && (
        <div className="flex items-center justify-between text-sm text-green-600">
          <span>Réduction (WELCOME) :</span>
          <span>-{Math.round(calculateTotal() * 0.1)} Dh</span>
        </div>
      )}
      <div className="flex items-center justify-between text-base font-bold text-primary pt-2 border-t">
        <span>Total :</span>
        <span>{calculateTotal()} Dh</span>
      </div>
    </div>
  );
};
