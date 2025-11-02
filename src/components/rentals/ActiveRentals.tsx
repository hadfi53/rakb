import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRentals } from '@/hooks/use-rentals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompleteRentalButton } from './CompleteRentalButton';
import { formatCurrency } from '@/lib/utils';

export const ActiveRentals = () => {
  const { user } = useAuth();
  const { rentals, loading, fetchRentals } = useRentals();

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  if (loading) {
    return <div className="text-center py-4">Chargement des locations...</div>;
  }

  const activeRentals = rentals.filter(rental => 
    ['confirmed', 'in_progress'].includes(rental.status)
  );

  if (!activeRentals.length) {
    return <div className="text-center py-4">Aucune location active.</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Locations actives</h2>
      {activeRentals.map((rental) => (
        <Card key={rental.id}>
          <CardHeader>
            <CardTitle>{rental.vehicle_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Locataire:</span> {rental.renter_name}
              </p>
              <p>
                <span className="font-semibold">Propriétaire:</span> {rental.owner_name}
              </p>
              <p>
                <span className="font-semibold">Période:</span>{' '}
                {new Date(rental.start_date).toLocaleDateString()} -{' '}
                {new Date(rental.end_date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Prix total:</span> {formatCurrency(rental.total_price)}
              </p>
              {rental.status === 'in_progress' && (
                <div className="mt-4">
                  <CompleteRentalButton
                    rentalId={rental.id}
                    onComplete={fetchRentals}
                    isOwner={user?.id === rental.owner_id}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 