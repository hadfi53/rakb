import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

interface PriceBreakdownProps {
  dailyRate: number;
  durationDays: number;
  insurancePrice?: number;
  serviceFeePercent?: number;
  depositAmount?: number;
  className?: string;
}

export const PriceBreakdown = ({
  dailyRate,
  durationDays,
  insurancePrice = 0,
  serviceFeePercent = 10,
  depositAmount,
  className = ""
}: PriceBreakdownProps) => {
  const basePrice = dailyRate * durationDays;
  const serviceFee = Math.round(basePrice * (serviceFeePercent / 100));
  const subtotal = basePrice + serviceFee + insurancePrice;
  const total = subtotal; // Deposit is separate

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{formatCurrency(dailyRate)} × {durationDays} {durationDays > 1 ? 'jours' : 'jour'}</span>
          <span>{formatCurrency(basePrice)}</span>
        </div>
        
        {insurancePrice > 0 && (
          <div className="flex justify-between text-sm">
            <span>Assurance</span>
            <span>{formatCurrency(insurancePrice)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Frais de service ({serviceFeePercent}%)</span>
          <span>{formatCurrency(serviceFee)}</span>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
      
      {depositAmount && depositAmount > 0 && (
        <>
          <Separator />
          <div className="flex justify-between text-sm text-gray-600">
            <span>Caution (remboursable)</span>
            <span>{formatCurrency(depositAmount)}</span>
          </div>
        </>
      )}
    </div>
  );
};

