export function calculateDurationDays(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function calculateInsuranceFee(basePrice: number, insuranceOption: string): number {
  switch (insuranceOption) {
    case 'basic':
      return Math.round(basePrice * 0.05); // 5% du prix de base
    case 'premium':
      return Math.round(basePrice * 0.10); // 10% du prix de base
    case 'full':
      return Math.round(basePrice * 0.15); // 15% du prix de base
    default:
      return 0; // Pas d'assurance
  }
} 