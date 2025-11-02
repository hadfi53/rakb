
interface OrderSummaryProps {
  car: any;
  startDate?: Date;
  endDate?: Date;
  selectedInsurance: any;
  selectedOptions: string[];
  additionalOptions: any[];
  promoApplied: boolean;
  calculateTotal: () => number;
}

export const OrderSummary = ({
  car,
  startDate,
  endDate,
  selectedInsurance,
  selectedOptions,
  additionalOptions,
  promoApplied,
  calculateTotal
}: OrderSummaryProps) => {
  if (!startDate || !endDate) return null;
  
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
      <h4 className="font-medium text-gray-700">Récapitulatif</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Véhicule</span>
          <span className="font-medium">{car?.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Durée</span>
          <span className="font-medium">{days} jours</span>
        </div>
        <div className="flex justify-between">
          <span>Assurance {selectedInsurance?.name}</span>
          <span className="font-medium">{selectedInsurance?.price} Dh/jour</span>
        </div>
        
        {selectedOptions.length > 0 && (
          <>
            <div className="flex justify-between font-medium">
              <span>Options</span>
              <span></span>
            </div>
            {selectedOptions.map(optId => {
              const opt = additionalOptions.find(o => o.id === optId);
              return opt ? (
                <div key={opt.id} className="flex justify-between text-xs ml-4">
                  <span>{opt.name}</span>
                  <span>{opt.price} Dh</span>
                </div>
              ) : null;
            })}
          </>
        )}
        
        {promoApplied && (
          <div className="flex justify-between text-green-600">
            <span>Réduction (WELCOME)</span>
            <span>-10%</span>
          </div>
        )}
        
        <div className="flex justify-between pt-2 border-t font-bold text-primary">
          <span>Total</span>
          <span>{calculateTotal()} Dh</span>
        </div>
      </div>
    </div>
  );
};
